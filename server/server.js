const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const fs = require('fs');
const crypto = require('crypto');
require('dotenv').config();
const AudiobookshelfClient = require('./abs-client');

/**
 * BookBoss Server
 * Backend API for managing books, users, and Audiobookshelf integration.
 */
const app = express();
const port = process.env.PORT || 3000;

// In-memory session store
const sessions = {}; // token -> { userId, username, isAdmin, expiresAt }
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Authentication Middleware
// Verifies the Bearer token against the in-memory session store
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) return res.sendStatus(401); // Unauthorized

    const session = sessions[token];
    if (!session) return res.sendStatus(403); // Forbidden (Invalid token)

    if (Date.now() > session.expiresAt) {
        delete sessions[token];
        return res.sendStatus(403); // Expired
    }

    req.user = session;
    next();
};

// Serve static files (public)
app.use(express.static(path.join(__dirname, '../book-boss-web')));
// Serve uploaded files (covers and book files)
app.use('/uploads', express.static('uploads'));

// Multer Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
// Allow both book file and cover image uploads
const upload = multer({ storage: storage });

// Database Connection
const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD ?? 'password',
    database: process.env.DB_NAME || 'bookboss'
});

db.connect(err => {
    if (err) {
        console.error('Database connection failed:', err.stack);
        return;
    }
    console.log('Connected to database.');
});

// --- API Endpoints ---

// Get all books
// --- API Endpoints ---

// Get all books (public access for testing)
app.get('/api/books', (req, res) => {
    const query = 'SELECT * FROM books ORDER BY added_at DESC';
    db.query(query, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: err.message });
        }
        // Parse JSON categories
        const books = results.map(book => ({
            ...book,
            categories: typeof book.categories === 'string' ? JSON.parse(book.categories || '[]') : (book.categories || []),
            descriptors: typeof book.descriptors === 'string' ? JSON.parse(book.descriptors || '[]') : (book.descriptors || [])
        }));
        res.json(books);
    });
});

// Add a new book (with optional file upload)
// Add a new book (with optional file upload)
// Add a new book (with optional file upload)
// Handles both metadata and file uploads (book file and cover image)
app.post('/api/books', authenticateToken, upload.fields([{ name: 'file', maxCount: 1 }, { name: 'coverFile', maxCount: 1 }]), async (req, res) => {
    const { title, author, isbn, cover, library, categories, addedAt } = req.body;
    const bookFile = req.files && req.files['file'] ? req.files['file'][0] : null;
    const coverFile = req.files && req.files['coverFile'] ? req.files['coverFile'][0] : null;

    let filePath = null;
    let format = 'Physical';

    if (bookFile) {
        filePath = bookFile.path;
        format = path.extname(bookFile.originalname).substring(1).toUpperCase(); // e.g., 'EPUB'
    }
    // Handle categories parsing safely
    const bookFilePath = bookFile ? bookFile.path : null;

    // Handle cover image - download if URL provided, use uploaded file if available
    let coverPath = null;
    if (coverFile) {
        // Use uploaded cover file
        coverPath = coverFile.path;
    } else if (cover && cover.startsWith('http')) {
        // Download cover image from URL
        try {
            const imageResponse = await axios.get(cover, { responseType: 'arraybuffer' });
            const imageBuffer = Buffer.from(imageResponse.data, 'binary');

            // Generate unique filename
            const hash = crypto.createHash('md5').update(cover).digest('hex');
            const ext = cover.match(/\.(jpg|jpeg|png|gif|webp)$/i)?.[1] || 'jpg';
            const filename = `cover_${hash}.${ext}`;
            const filepath = path.join('uploads', filename);

            // Ensure uploads directory exists
            if (!fs.existsSync('uploads')) {
                fs.mkdirSync('uploads', { recursive: true });
            }

            // Save image
            fs.writeFileSync(filepath, imageBuffer);
            coverPath = filepath;
            console.log(`Downloaded cover image: ${filepath}`);
        } catch (error) {
            console.error('Error downloading cover image:', error.message);
            // Continue without cover image if download fails
            coverPath = cover; // Store URL as fallback
        }
    } else {
        coverPath = cover || null;
    }

    // Handle categories - can be a string (from FormData) or array (from JSON)
    let categoryList = '[]';
    if (categories) {
        if (typeof categories === 'string') {
            categoryList = JSON.stringify(categories.split(',').map(c => c.trim()));
        } else if (Array.isArray(categories)) {
            categoryList = JSON.stringify(categories);
        }
    }

    // Handle descriptors - can be a string, array, or already JSON string
    let descriptorsJson = '[]';
    if (req.body.descriptors) {
        if (typeof req.body.descriptors === 'string') {
            // Check if it's already a JSON string
            try {
                JSON.parse(req.body.descriptors);
                descriptorsJson = req.body.descriptors;
            } catch {
                // It's a plain string, treat as empty for now
                descriptorsJson = '[]';
            }
        } else if (Array.isArray(req.body.descriptors)) {
            descriptorsJson = JSON.stringify(req.body.descriptors);
        }
    }

    // Convert ISO datetime to MySQL DATETIME format (YYYY-MM-DD HH:MM:SS)
    let addedAtValue = new Date();
    if (addedAt) {
        addedAtValue = new Date(addedAt);
    }
    const mysqlDatetime = addedAtValue.toISOString().slice(0, 19).replace('T', ' ');

    const query = 'INSERT INTO books (title, author, isbn, cover_url, cover_image_path, `library`, categories, file_path, format, binding_type, descriptors, added_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';

    db.query(query, [
        title,
        author,
        isbn,
        cover || null, // Keep original cover URL logic if needed, or use this for external URL
        coverPath,     // New column for local path or external URL if we want to unify
        library || 'Main Library',
        categoryList,
        bookFilePath,
        req.body.format || 'Physical',
        req.body.binding_type || 'Paperback',
        descriptorsJson,
        mysqlDatetime
    ], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ message: 'Book added successfully', id: result.insertId });
    });
});

// Update a book (metadata only)
// Update a book (metadata only)
// Update a book (metadata only)
// Allows updating book details including cover image
app.put('/api/books/:id', authenticateToken, upload.fields([{ name: 'coverFile', maxCount: 1 }]), (req, res) => {
    const { id } = req.params;
    const { title, author, isbn, library, categories, cover, format, binding_type, descriptors } = req.body;
    const coverFile = req.files['coverFile'] ? req.files['coverFile'][0] : null;

    // Handle categories parsing safely
    let parsedCategories = [];
    try {
        parsedCategories = typeof categories === 'string' ? JSON.parse(categories) : (categories || []);
    } catch (e) { parsedCategories = []; }

    // Determine final cover URL/path
    const finalCover = coverFile ? coverFile.path : (cover || null);
    const descriptorsJson = descriptors ? descriptors : '[]';

    // We update both cover_url and cover_image_path to be safe, or just one. 
    // Let's update cover_image_path if it's a file, and cover_url if it's a string.
    // For simplicity, let's assume finalCover goes to cover_url for now as legacy, 
    // but we should also update cover_image_path if it's a local file.

    let query = 'UPDATE books SET title = ?, author = ?, isbn = ?, `library` = ?, categories = ?, format = ?, binding_type = ?, descriptors = ?';
    let values = [title, author, isbn, library, JSON.stringify(parsedCategories), format || 'Physical', binding_type, descriptorsJson];

    if (finalCover) {
        query += ', cover_url = ?, cover_image_path = ?';
        values.push(finalCover, finalCover);
    }

    query += ' WHERE id = ?';
    values.push(id);

    db.query(query, values, (err, result) => {
        if (err) { console.error(err); return res.status(500).json({ error: err.message }); }
        res.json({ message: 'Book updated successfully' });
    });
});

// Refresh metadata for all books
// Downloads cover images and updates metadata for all books in the library
app.post('/api/books/refresh-metadata', authenticateToken, async (req, res) => {
    try {
        // Get all books
        const books = await new Promise((resolve, reject) => {
            db.query('SELECT * FROM books', (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        });

        const total = books.length;
        let processed = 0;
        let downloaded = 0;
        let skipped = 0;
        let failed = 0;

        console.log(`Starting metadata refresh for ${total} books...`);

        for (const book of books) {
            try {
                // Skip if no cover URL or already has local cover
                if (!book.cover_url || !book.cover_url.startsWith('http')) {
                    skipped++;
                    processed++;
                    console.log(`Skipped: ${book.title} (no URL or already local)`);
                    continue;
                }

                // Download cover image
                console.log(`Downloading cover for: ${book.title}`);
                const imageResponse = await axios.get(book.cover_url, {
                    responseType: 'arraybuffer',
                    timeout: 10000
                });
                const imageBuffer = Buffer.from(imageResponse.data, 'binary');

                // Generate unique filename
                const hash = crypto.createHash('md5').update(book.cover_url).digest('hex');
                const ext = book.cover_url.match(/\.(jpg|jpeg|png|gif|webp)$/i)?.[1] || 'jpg';
                const filename = `cover_${hash}.${ext}`;
                const filepath = path.join('uploads', filename);

                // Ensure uploads directory exists
                if (!fs.existsSync('uploads')) {
                    fs.mkdirSync('uploads', { recursive: true });
                }

                // Save image
                fs.writeFileSync(filepath, imageBuffer);

                // Update database
                await new Promise((resolve, reject) => {
                    db.query(
                        'UPDATE books SET cover_image_path = ? WHERE id = ?',
                        [filepath, book.id],
                        (err) => {
                            if (err) reject(err);
                            else resolve();
                        }
                    );
                });

                downloaded++;
                processed++;
                console.log(`Downloaded: ${book.title}`);

            } catch (error) {
                console.error(`Error processing ${book.title}:`, error.message);
                failed++;
                processed++;
            }
        }

        const message = `Metadata refresh complete! Downloaded: ${downloaded}, Skipped: ${skipped}, Failed: ${failed}`;
        console.log(message);

        res.json({
            success: true,
            message,
            processed: total,
            downloaded,
            skipped,
            failed
        });
    } catch (error) {
        console.error('Metadata refresh error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Download book file
// Download book file
// Download book file
// Securely serves the book file to the user
app.get('/api/books/:id/download', authenticateToken, (req, res) => {
    const bookId = req.params.id;
    const query = 'SELECT file_path, title, format FROM books WHERE id = ?';

    db.query(query, [bookId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: err.message });
        }
        if (results.length === 0 || !results[0].file_path) {
            return res.status(404).json({ error: 'File not found' });
        }

        const book = results[0];
        const file = path.join(__dirname, book.file_path);
        const filename = `${book.title}.${book.format.toLowerCase()}`;

        res.download(file, filename, (err) => {
            if (err) {
                console.error('Error downloading file:', err);
                // Don't send another response if headers already sent
                if (!res.headersSent) {
                    res.status(500).send('Error downloading file');
                }
            }
        });
    });
});

// Login Endpoint
// Login Endpoint
// Authenticates user and returns a session token
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const query = 'SELECT * FROM users WHERE username = ?';

    db.query(query, [username], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: err.message });
        }

        if (results.length === 0) {
            return res.status(401).json({ error: 'User not found' });
        }

        const user = results[0];

        // Check password (plaintext for now)
        if (user.password !== password) {
            return res.status(401).json({ error: 'Password incorrect' });
        }

        // Generate Session Token
        const token = uuidv4();
        sessions[token] = {
            userId: user.id,
            username: user.username,
            isAdmin: user.is_admin === 1,
            expiresAt: Date.now() + SESSION_DURATION
        };

        res.json({
            token: token,
            id: user.id,
            username: user.username,
            isAdmin: user.is_admin === 1
        });
    });
});

// Delete a book
// Delete a book
// Delete a book
// Removes book metadata from database (Note: File deletion not yet implemented)
app.delete('/api/books/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    // In a real app, we should also delete the file from 'uploads/'
    const query = 'DELETE FROM books WHERE id = ? OR isbn = ?';
    db.query(query, [id, id], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'Book deleted successfully' });
    });
});

// --- User Management APIs ---
// Endpoints for managing application users (admin only features planned)

// Get all users
// Get all users
app.get('/api/users', authenticateToken, (req, res) => {
    db.query('SELECT id, username, is_admin FROM users', (err, results) => {
        if (err) {
            console.error('Error fetching users:', err);
            res.status(500).json({ error: 'Failed to fetch users' });
            return;
        }
        res.json(results);
    });
});

// Create a user
// Create a user
app.post('/api/users', authenticateToken, (req, res) => {
    const { username, password, isAdmin } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }
    const query = 'INSERT INTO users (username, password, is_admin) VALUES (?, ?, ?)';
    db.query(query, [username, password, isAdmin || false], (err, result) => {
        if (err) {
            console.error('Error creating user:', err);
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ error: 'Username already exists' });
            }
            res.status(500).json({ error: 'Failed to create user' });
            return;
        }
        res.status(201).json({ message: 'User created', id: result.insertId });
    });
});

// Update a user
// Update a user
app.put('/api/users/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    const { username, password, isAdmin } = req.body;

    // Dynamic query construction
    let query = 'UPDATE users SET ';
    const values = [];
    const updates = [];

    if (username) {
        updates.push('username = ?');
        values.push(username);
    }
    if (password) {
        updates.push('password = ?');
        values.push(password);
    }
    if (isAdmin !== undefined) {
        updates.push('is_admin = ?');
        values.push(isAdmin);
    }

    if (updates.length === 0) {
        return res.status(400).json({ error: 'No updates provided' });
    }

    query += updates.join(', ') + ' WHERE id = ?';
    values.push(id);

    db.query(query, values, (err, result) => {
        if (err) {
            console.error('Error updating user:', err);
            res.status(500).json({ error: 'Failed to update user' });
            return;
        }
        res.json({ message: 'User updated successfully' });
    });
});

// Delete a user
// Delete a user
app.delete('/api/users/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM users WHERE id = ?', [id], (err, result) => {
        if (err) {
            console.error('Error deleting user:', err);
            res.status(500).json({ error: 'Failed to delete user' });
            return;
        }
        res.json({ message: 'User deleted successfully' });
    });
});

// Public Registration Endpoint
app.post('/api/register', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    // Check if user exists
    db.query('SELECT * FROM users WHERE username = ?', [username], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: err.message });
        }
        if (results.length > 0) {
            return res.status(409).json({ error: 'Username already exists' });
        }

        // Create user (default not admin)
        const query = 'INSERT INTO users (username, password, is_admin) VALUES (?, ?, 0)';
        db.query(query, [username, password], (err, result) => {
            if (err) {
                console.error('Error creating user:', err);
                return res.status(500).json({ error: 'Failed to create user' });
            }
            res.status(201).json({ message: 'User created successfully' });
        });
    });
});

// --- Settings APIs ---

// Get all settings
// Get all settings
app.get('/api/settings', authenticateToken, (req, res) => {
    db.query('SELECT * FROM settings', (err, results) => {
        if (err) {
            console.error('Error fetching settings:', err);
            res.status(500).json({ error: 'Failed to fetch settings' });
            return;
        }
        // Convert array of {key, value} to object {key: value}
        const settings = results.reduce((acc, curr) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {});
        res.json(settings);
    });
});

// Update settings (bulk or single)
// Update settings (bulk or single)
app.post('/api/settings', authenticateToken, (req, res) => {
    const settings = req.body; // Expecting object { key: value, key2: value2 }

    if (!settings || Object.keys(settings).length === 0) {
        return res.status(400).json({ error: 'No settings provided' });
    }

    // Use a transaction or multiple queries. For simplicity, we'll loop (not atomic, but fine for this scale)
    // Better approach: INSERT INTO ... ON DUPLICATE KEY UPDATE
    const keys = Object.keys(settings);
    let completed = 0;
    let hasError = false;

    keys.forEach(key => {
        const value = settings[key];
        const query = 'INSERT INTO settings (`key`, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = ?';
        db.query(query, [key, value, value], (err) => {
            if (err) {
                console.error(`Error saving setting ${key}:`, err);
                hasError = true;
            }
            completed++;
            if (completed === keys.length) {
                if (hasError) {
                    res.status(500).json({ error: 'Some settings failed to save' });
                } else {
                    res.json({ message: 'Settings saved successfully' });
                }
            }
        });
    });
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

// --- Audiobookshelf Integration ---
// Endpoints for managing connections to Audiobookshelf servers

// List user's ABS servers
app.get('/api/audiobookshelf/servers', authenticateToken, (req, res) => {
    const userId = req.user.id;
    db.query('SELECT id, server_name, server_url, is_active, created_at FROM audiobookshelf_servers WHERE user_id = ?', [userId], (err, results) => {
        if (err) { console.error(err); return res.status(500).json({ error: err.message }); }
        res.json(results);
    });
});

// Add ABS server
// Add ABS server
// Authenticates with the ABS server and stores the connection details
app.post('/api/audiobookshelf/servers', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const { server_name, server_url, username, password } = req.body;

    if (!server_name || !server_url || !username || !password) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        // Authenticate with ABS to get token
        const loginData = await AudiobookshelfClient.login(server_url, username, password);
        const apiToken = loginData.user.token;

        // Save to DB
        db.query(
            'INSERT INTO audiobookshelf_servers (user_id, server_name, server_url, api_token) VALUES (?, ?, ?, ?)',
            [userId, server_name, server_url, apiToken],
            (err, result) => {
                if (err) { console.error(err); return res.status(500).json({ error: err.message }); }
                res.status(201).json({ message: 'Server added successfully', id: result.insertId });
            }
        );
    } catch (error) {
        console.error('ABS Connection Error:', error);
        res.status(500).json({ error: 'Failed to connect to Audiobookshelf server. Please check credentials and URL.' });
    }
});

// Update ABS server
app.put('/api/audiobookshelf/servers/:id', authenticateToken, (req, res) => {
    const userId = req.user.id;
    const serverId = req.params.id;
    const { server_name, server_url, is_active } = req.body;

    db.query(
        'UPDATE audiobookshelf_servers SET server_name = ?, server_url = ?, is_active = ? WHERE id = ? AND user_id = ?',
        [server_name, server_url, is_active, serverId, userId],
        (err, result) => {
            if (err) { console.error(err); return res.status(500).json({ error: err.message }); }
            res.json({ message: 'Server updated successfully' });
        }
    );
});

// Delete ABS server
app.delete('/api/audiobookshelf/servers/:id', authenticateToken, (req, res) => {
    const userId = req.user.id;
    const serverId = req.params.id;

    db.query('DELETE FROM audiobookshelf_servers WHERE id = ? AND user_id = ?', [serverId, userId], (err, result) => {
        if (err) { console.error(err); return res.status(500).json({ error: err.message }); }
        res.json({ message: 'Server removed successfully' });
    });
});

// Test/Status ABS server
// Test/Status ABS server
// Verifies the connection to a stored ABS server
app.get('/api/audiobookshelf/servers/:id/status', authenticateToken, (req, res) => {
    const userId = req.user.id;
    const serverId = req.params.id;

    db.query('SELECT server_url, api_token FROM audiobookshelf_servers WHERE id = ? AND user_id = ?', [serverId, userId], async (err, results) => {
        if (err) { console.error(err); return res.status(500).json({ error: err.message }); }
        if (results.length === 0) return res.status(404).json({ error: 'Server not found' });

        const server = results[0];
        const client = new AudiobookshelfClient(server.server_url, server.api_token);

        try {
            const status = await client.getServerStatus();
            res.json({ status: 'connected', info: status });
        } catch (error) {
            res.status(500).json({ status: 'error', error: error.message });
        }
    });
});
