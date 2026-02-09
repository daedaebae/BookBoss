require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') }); // Load env from project root
const axios = require('axios');
const jwt = require('jsonwebtoken');
const db = require('../src/config/db');

const API_URL = 'http://localhost:5000/api';
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret'; // Fallback if not in env, but should be.

async function runTests() {
    console.log('Starting Integration Tests...');

    // 1. Setup Test User
    const testUser = {
        username: 'test_integrator_' + Date.now(),
        password: 'password123',
        isAdmin: true
    };

    let token;
    let userId;

    try {
        // Create user directly in DB to avoid relying on Registration API for this setup
        /*
        // actually, let's use the API if possible, but we need a token for user creation if admin-only?
        // Routes say: router.post('/', authenticateToken, requireAdmin, userController.createUser);
        // So we can't create the FIRST user via API if we are locked out.
        // We must stick to DB insertion for the test setup.
        */

        console.log('Creating test user in DB...');
        const [result] = await db.promise().query(
            'INSERT INTO users (username, password, is_admin) VALUES (?, ?, ?)',
            [testUser.username, '$2a$10$abcdefg...', testUser.isAdmin] // Dummy hash, we won't login via password, we forge token.
        );
        userId = result.insertId;
        console.log(`Test user created with ID: ${userId}`);

        // Generate Token
        token = jwt.sign({ id: userId, username: testUser.username, isAdmin: testUser.isAdmin }, JWT_SECRET, { expiresIn: '1h' });
        console.log('Generated Test Token.');

        // 2. Test GET /api/books (Empty initially or populated)
        console.log('\nTesting GET /api/books...');
        try {
            const res = await axios.get(`${API_URL}/books`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log(`GET /api/books Status: ${res.status}`);
            console.log(`Books Count: ${res.data.length}`);
        } catch (err) {
            console.error('GET /api/books Failed:', err.message);
            if (err.response) console.error('Response:', err.response.data);
            process.exit(1);
        }

        // 3. Test POST /api/books (Add Book)
        console.log('\nTesting POST /api/books...');
        const newBook = {
            title: 'Integration Test Book',
            author: 'Test Author',
            description: 'Created by integration test script',
            status: 'Not Started',
            categories: ['Test', 'Integration']
        };

        let bookId;
        try {
            // Note: server expects multipart/form-data because of upload middleware? 
            // bookRoutes: router.post('/', authenticateToken, upload.single('coverFile'), bookController.addBook);
            // We need to send form data.
            const FormData = require('form-data');
            const form = new FormData();
            Object.keys(newBook).forEach(key => {
                if (Array.isArray(newBook[key])) form.append(key, JSON.stringify(newBook[key]));
                else form.append(key, newBook[key]);
            });

            const res = await axios.post(`${API_URL}/books`, form, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    ...form.getHeaders()
                }
            });
            console.log(`POST /api/books Status: ${res.status}`);
            console.log('Body:', res.data);
            bookId = res.data.id;
        } catch (err) {
            console.error('POST /api/books Failed:', err.message);
            if (err.response) console.error('Response:', err.response.data);
            process.exit(1);
        }

        // 4. Verify Book Added
        console.log('\nVerifying Book Added...');
        try {
            const res = await axios.get(`${API_URL}/books`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const book = res.data.find(b => b.id === bookId);
            if (book) {
                console.log(`Found book: ${book.title} (ID: ${book.id})`);
            } else {
                console.error('Book not found in list!');
                process.exit(1);
            }
        } catch (err) {
            console.error('Verification Failed:', err.message);
            process.exit(1);
        }

        // 5. Cleanup
        console.log('\nCleaning up...');
        await db.promise().query('DELETE FROM books WHERE id = ?', [bookId]);
        await db.promise().query('DELETE FROM users WHERE id = ?', [userId]);
        console.log('Cleanup complete.');

    } catch (error) {
        console.error('Test Suite Failed:', error);
        process.exit(1);
    } finally {
        // Close DB connection? 
        // db.end() might hang if pool. 
        // We'll just exit.
        process.exit(0);
    }
}

runTests();
