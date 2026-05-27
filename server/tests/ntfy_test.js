require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const axios = require('axios');
const jwt = require('jsonwebtoken');
const db = require('../src/config/db');

const API_URL = process.env.API_URL || 'http://127.0.0.1:5000/api';
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error('JWT_SECRET must be set before running tests');

async function runNtfyTest() {
    console.log('Starting NTFY System Test...');

    const testUser = {
        username: 'ntfy_tester_' + Date.now(),
        password: 'password123',
        isAdmin: true
    };

    let token;
    let userId;
    let featureId;

    try {
        console.log('Creating test user in DB...');
        const [result] = await db.promise().query(
            'INSERT INTO users (username, password, is_admin) VALUES (?, ?, ?)',
            [testUser.username, '$2a$10$abcdefg...', testUser.isAdmin]
        );
        userId = result.insertId;
        console.log(`Test user created with ID: ${userId}`);

        token = jwt.sign({ id: userId, username: testUser.username, isAdmin: testUser.isAdmin }, JWT_SECRET, { expiresIn: '1h' });
        console.log('Generated Test Token.');

        console.log('\nTesting POST /api/features (Should trigger NTFY)...');
        const newFeature = {
            title: 'Automated NTFY Test ' + Date.now(),
            description: 'This is a test feature request to verify the NTFY integration.'
        };

        try {
            const res = await axios.post(`${API_URL}/features`, newFeature, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            console.log(`POST /api/features Status: ${res.status}`);
            console.log('Body:', res.data);

            if (res.data.warning) {
                console.error('\\nNTFY WARNING returned by API:', res.data.warning);
                console.error('The push notification failed to send.');
                process.exit(1);
            } else {
                console.log('\\nNTFY notification sent successfully (no warning returned)!');
                featureId = res.data.id;
            }
        } catch (err) {
            console.error('POST /api/features Failed:', err.message);
            if (err.response) console.error('Response:', err.response.data);
            process.exit(1);
        }

        console.log('\\nCleaning up...');
        if (featureId) await db.promise().query('DELETE FROM feature_requests WHERE id = ?', [featureId]);
        if (userId) await db.promise().query('DELETE FROM users WHERE id = ?', [userId]);
        console.log('Cleanup complete.');

    } catch (error) {
        console.error('NTFY Test Failed:', error);
        process.exit(1);
    } finally {
        process.exit(0);
    }
}

runNtfyTest();
