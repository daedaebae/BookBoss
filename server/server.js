const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');

const axios = require('axios');
const fs = require('fs');
const crypto = require('crypto');
const { exec } = require('child_process');
require('dotenv').config();
const AudiobookshelfClient = require('./abs-client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const helmet = require('helmet');

if (!process.env.JWT_SECRET) {
    console.warn('WARNING: JWT_SECRET environment variable is not set. Using insecure default.');
}
const JWT_SECRET = process.env.JWT_SECRET || 'insecure-default-secret';

/**
 * BookBoss Server
 * Backend API for managing books, users, and Audiobookshelf integration.
 */
const app = express();
const port = process.env.PORT || 3000;

// Security Middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow cross-origin for images
}));


// Middleware - Enhanced CORS Configuration
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:8080'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Range'],
    exposedHeaders: ['Content-Range', 'Accept-Ranges', 'Content-Length']
}));
app.use(bodyParser.json());

// Additional headers for static files
app.use((req, res, next) => {
    // Set proper MIME types and CORS headers for all responses
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, Range');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Range, Accept-Ranges, Content-Length');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// In-memory session store (Removed in favor of JWT)
// const sessions = {}; 
// const SESSION_DURATION = 24 * 60 * 60 * 1000;

// Authentication Middleware
// Verifies the Bearer token using JWT
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) return res.sendStatus(401); // Unauthorized

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(401); // Unauthorized (Invalid/Expired token)
        req.user = user;
        next();
    });
};

// Admin Middleware
const requireAdmin = (req, res, next) => {
    if (!req.user || !req.user.isAdmin) {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};

// Serve static files (public)
// Serve static files (public) - REMOVED: React app is served via Vite dev server (port 5173)
// app.use(express.static(path.join(__dirname, '../book-boss-react/dist')));

// Serve uploaded files with proper headers
app.use('/uploads', (req, res, next) => {
    // Set proper MIME type based on file extension
    const ext = path.extname(req.path).toLowerCase();
    const mimeTypes = {
        '.epub': 'application/epub+zip',
        '.pdf': 'application/pdf',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp'
    };

    if (mimeTypes[ext]) {
        res.setHeader('Content-Type', mimeTypes[ext]);
    }

    // Enable range requests for large files
    res.setHeader('Accept-Ranges', 'bytes');

    next();
}, express.static('uploads'), (req, res) => {
    // Prevent fallthrough to SPA handler or default HTML 404
    // This ensures missing images return 404 immediately, avoiding CORB
    res.status(404).send('Not Found');
});

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
// Database Connection
const db = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'bookboss',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

if (!process.env.DB_PASSWORD) {
    console.warn('WARNING: DB_PASSWORD environment variable is not set. Database connection may fail.');
}

// Pool events (optional logging)
db.on('connection', (connection) => {
    console.log('DB Connection established');
});


// --- API Endpoints ---

// Get all books
// --- API Endpoints ---

// Get all books (public access for testing)
// Modified to include shelf_ids and reading status for the current user if logged in (via token check optional or if we assume this is mostly auth'd)
// Since this is public for now, we won't join user_books unless we have a user context.
// But the frontend sends token. So we should use authenticateToken if we want user specific data.
// However, the route definition is `app.get('/api/books', ...)` without `authenticateToken`.
// Let's keep it public but try to parse user if header exists? Or just leave it generic and fetch user data separately.
// The plan was to fetch reading progress via `/api/user/books`.
// So we just need `shelf_ids`.
app.get('/api/books', (req, res) => {
    // We use a LEFT JOIN to get shelf_ids and ABS mapping.
    // Since we also join shelf_books, let's keep it robust.
    const query = `
        SELECT b.*,
        (SELECT JSON_ARRAYAGG(shelf_id) FROM shelf_books WHERE book_id = b.id) as shelf_ids,
        abm.abs_server_id, abm.abs_library_item_id, abm.abs_library_id
        FROM books b
        LEFT JOIN abs_book_mappings abm ON b.id = abm.book_id
        ORDER BY b.added_at DESC
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: err.message });
        }
        // Parse JSON categories and shelf_ids
        const books = results.map(book => {
            const b = {
                ...book,
                categories: typeof book.categories === 'string' ? JSON.parse(book.categories || '[]') : (book.categories || []),
                descriptors: typeof book.descriptors === 'string' ? JSON.parse(book.descriptors || '[]') : (book.descriptors || []),
                shelf_ids: typeof book.shelf_ids === 'string' ? JSON.parse(book.shelf_ids || '[]') : (book.shelf_ids || []),
            };

            // Structure ABS info
            if (book.abs_server_id) {
                b.abs_metadata = {
                    serverId: book.abs_server_id,
                    libraryItemId: book.abs_library_item_id,
                    libraryId: book.abs_library_id
                };
            }

            // Clean up flat fields to avoid pollution (optional)
            delete b.abs_server_id;
            delete b.abs_library_item_id;
            delete b.abs_library_id;

            return b;
        });
        res.json(books);
    });
});

// Add a new book (with optional file upload)
// Add a new book (with optional file upload)
// Add a new book (with optional file upload)
// Handles both metadata and file uploads (book file and cover image)
// Bulk delete books
app.post('/api/books/bulk-delete', authenticateToken, (req, res) => {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: 'Invalid or empty IDs array' });
    }

    const placeholders = ids.map(() => '?').join(',');
    const query = `DELETE FROM books WHERE id IN (${placeholders})`;

    db.query(query, ids, (err, result) => {
        if (err) {
            console.error('Error bulk deleting books:', err);
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: `Successfully deleted ${result.affectedRows} books` });
    });
});

// Add a new book
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

    const query = 'INSERT INTO books (title, author, isbn, cover_url, cover_image_path, `library`, categories, file_path, format, binding_type, descriptors, series, series_index, publisher, language, description, shelf, status, rating, page_count, publication_date, is_loaned, borrower_name, loan_date, due_date, added_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';

    db.query(query, [
        title,
        author,
        isbn,
        cover || null,
        coverPath,
        library || 'Main Library',
        categoryList,
        bookFilePath,
        req.body.format || 'Physical',
        req.body.binding_type || 'Paperback',
        descriptorsJson,
        req.body.series || null,
        req.body.series_index || null,
        req.body.publisher || null,
        req.body.language || 'en',
        req.body.description || null,
        req.body.shelf || null, // Legacy shelf column, might be deprecated in favor of shelf_books
        req.body.status || 'Not Started',
        req.body.rating || 0,
        req.body.page_count || 0,
        req.body.publication_date || null,
        req.body.is_loaned || false,
        req.body.borrower_name || null,
        req.body.loan_date || null,
        req.body.due_date || null,
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
    const {
        title, author, isbn, library, categories, cover, format, binding_type, descriptors,
        series, series_index, publisher, language, description,
        shelf, status, rating, page_count, publication_date,
        is_loaned, borrower_name, loan_date, due_date
    } = req.body;
    const coverFile = req.files && req.files['coverFile'] ? req.files['coverFile'][0] : null;

    // Handle categories parsing safely
    let parsedCategories = [];
    try {
        parsedCategories = typeof categories === 'string' ? JSON.parse(categories) : (categories || []);
    } catch (e) { parsedCategories = []; }

    // Determine final cover URL/path
    const finalCover = coverFile ? coverFile.path : (cover || null);
    const descriptorsJson = descriptors ? descriptors : '[]';

    let query = `UPDATE books SET
        title = ?, author = ?, isbn = ?, \`library\` = ?, categories = ?,
        format = ?, binding_type = ?, descriptors = ?,
        series = ?, series_index = ?, publisher = ?, language = ?, description = ?,
        shelf = ?, status = ?, rating = ?, page_count = ?, publication_date = ?,
        is_loaned = ?, borrower_name = ?, loan_date = ?, due_date = ?`;

    let values = [
        title, author, isbn, library, JSON.stringify(parsedCategories),
        format || 'Physical', binding_type, descriptorsJson,
        series || null, series_index || null, publisher || null, language || 'en', description || null,
        shelf || null, status || 'Not Started', rating || 0, page_count || 0, publication_date || null,
        is_loaned || false, borrower_name || null, loan_date || null, due_date || null
    ];

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
                let updated = false;
                let coverUrl = book.cover_url;

                // 1. Fetch Metadata if ISBN exists
                if (book.isbn) {
                    console.log(`Fetching metadata for: ${book.title} (ISBN: ${book.isbn})`);
                    try {
                        const googleBooksResponse = await axios.get(`https://www.googleapis.com/books/v1/volumes?q=isbn:${book.isbn}`);
                        if (googleBooksResponse.data.items && googleBooksResponse.data.items.length > 0) {
                            const volumeInfo = googleBooksResponse.data.items[0].volumeInfo;

                            // Prepare updates
                            const newTitle = volumeInfo.title || book.title;
                            const newAuthor = volumeInfo.authors ? volumeInfo.authors.join(', ') : book.author;
                            const newPageCount = volumeInfo.pageCount || book.page_count;
                            const newPubDate = volumeInfo.publishedDate || book.publication_date;
                            const newCategories = volumeInfo.categories ? JSON.stringify(volumeInfo.categories) : book.categories;
                            const newCoverUrl = volumeInfo.imageLinks ? (volumeInfo.imageLinks.thumbnail || volumeInfo.imageLinks.smallThumbnail) : book.cover_url;

                            // Update DB
                            await new Promise((resolve, reject) => {
                                db.query(
                                    'UPDATE books SET title = ?, author = ?, page_count = ?, publication_date = ?, categories = ?, cover_url = ? WHERE id = ?',
                                    [newTitle, newAuthor, newPageCount, newPubDate, newCategories, newCoverUrl, book.id],
                                    (err) => {
                                        if (err) reject(err);
                                        else resolve();
                                    }
                                );
                            });

                            coverUrl = newCoverUrl; // Update local var for next step
                            updated = true;
                            console.log(`Updated metadata for: ${book.title}`);
                        } else {
                            console.log(`No metadata found for ISBN: ${book.isbn}`);
                        }
                    } catch (apiError) {
                        console.error(`API Error for ${book.title}:`, apiError.message);
                    }
                }

                // 2. Download cover image (using potentially updated URL)
                // Skip if no cover URL or already has local cover (unless we just updated it, then we might want to re-download? 
                // For now, let's only download if it's a remote URL and we don't have a local path OR if we just updated the URL)

                // Logic: If we have a coverUrl that starts with http, we should try to download it.
                // If we already have a local path, we might skip, BUT if we just updated the metadata, we might have a BETTER cover now.
                // So let's download if it's http.

                if (coverUrl && coverUrl.startsWith('http')) {
                    // Download cover image
                    console.log(`Downloading cover for: ${book.title}`);
                    const imageResponse = await axios.get(coverUrl, {
                        responseType: 'arraybuffer',
                        timeout: 10000
                    });
                    const imageBuffer = Buffer.from(imageResponse.data, 'binary');

                    // Generate unique filename
                    const hash = crypto.createHash('md5').update(coverUrl).digest('hex');
                    const ext = coverUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i)?.[1] || 'jpg';
                    const filename = `cover_${hash}.${ext}`;
                    const filepath = path.join('uploads', filename);

                    // Ensure uploads directory exists
                    if (!fs.existsSync('uploads')) {
                        fs.mkdirSync('uploads', { recursive: true });
                    }

                    // Save image
                    fs.writeFileSync(filepath, imageBuffer);

                    // Update database with local path
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
                    if (!updated) processed++; // Only increment if not already counted as updated
                    console.log(`Downloaded cover: ${book.title}`);
                } else {
                    skipped++;
                    if (!updated) processed++;
                }

                if (updated) processed++;

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
// Authenticates user and returns a JWT token
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const [results] = await db.promise().query('SELECT * FROM users WHERE username = ?', [username]);

        if (results.length === 0) {
            return res.status(401).json({ error: 'User not found' });
        }

        const user = results[0];

        // Check password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Password incorrect' });
        }

        // Generate JWT Token
        const token = jwt.sign(
            { id: user.id, username: user.username, isAdmin: user.is_admin === 1 },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token: token,
            id: user.id,
            username: user.username,
            isAdmin: user.is_admin === 1
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
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

// Bulk delete books
app.delete('/api/books/bulk', authenticateToken, (req, res) => {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: 'Invalid or empty ids array' });
    }

    const placeholders = ids.map(() => '?').join(',');
    const query = `DELETE FROM books WHERE id IN (${placeholders})`;

    db.query(query, ids, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: `${result.affectedRows} books deleted successfully` });
    });
});

// Bulk update books
app.patch('/api/books/bulk', authenticateToken, (req, res) => {
    const { ids, updates } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: 'Invalid or empty ids array' });
    }
    if (!updates || Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'No updates provided' });
    }

    // Whitelist allowed fields to prevent SQL injection
    const ALLOWED_FIELDS = [
        'title', 'author', 'isbn', 'library', 'categories', 'format', 'binding_type',
        'descriptors', 'series', 'series_index', 'publisher', 'language', 'description',
        'shelf', 'status', 'rating', 'page_count', 'publication_date', 'is_loaned',
        'borrower_name', 'loan_date', 'due_date'
    ];

    const validUpdates = {};
    Object.keys(updates).forEach(key => {
        if (ALLOWED_FIELDS.includes(key)) {
            validUpdates[key] = updates[key];
        }
    });

    if (Object.keys(validUpdates).length === 0) {
        return res.status(400).json({ error: 'No valid update fields provided' });
    }

    // Build SET clause from updates object
    const setClause = Object.keys(validUpdates).map(key => `${key} = ?`).join(', ');
    const setValues = Object.values(validUpdates);

    const placeholders = ids.map(() => '?').join(',');
    const query = `UPDATE books SET ${setClause} WHERE id IN (${placeholders})`;

    db.query(query, [...setValues, ...ids], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: `${result.affectedRows} books updated successfully` });
    });
});

// --- Book Photos API ---
// Endpoints for managing book photos

// Get all photos for a book
app.get('/api/books/:bookId/photos', authenticateToken, (req, res) => {
    const { bookId } = req.params;

    db.query(
        'SELECT * FROM book_photos WHERE book_id = ? ORDER BY uploaded_at DESC',
        [bookId],
        (err, results) => {
            if (err) {
                console.error('Error fetching photos:', err);
                return res.status(500).json({ error: err.message });
            }

            // Parse JSON tags
            const photos = results.map(photo => ({
                ...photo,
                tags: photo.tags ? JSON.parse(photo.tags) : []
            }));

            res.json(photos);
        }
    );
});

// Upload a new photo for a book
app.post('/api/books/:bookId/photos', authenticateToken, upload.single('photo'), async (req, res) => {
    const { bookId } = req.params;
    const { photo_type, description, tags } = req.body;

    if (!req.file) {
        return res.status(400).json({ error: 'No photo file provided' });
    }

    const photoPath = `/uploads/${req.file.filename}`;
    const parsedTags = tags ? JSON.parse(tags) : null;

    db.query(
        'INSERT INTO book_photos (book_id, photo_path, photo_type, description, tags) VALUES (?, ?, ?, ?, ?)',
        [bookId, photoPath, photo_type || null, description || null, parsedTags ? JSON.stringify(parsedTags) : null],
        (err, result) => {
            if (err) {
                console.error('Error saving photo:', err);
                return res.status(500).json({ error: err.message });
            }

            // Return the created photo
            db.query(
                'SELECT * FROM book_photos WHERE id = ?',
                [result.insertId],
                (err, results) => {
                    if (err) {
                        return res.status(500).json({ error: err.message });
                    }
                    const photo = results[0];
                    photo.tags = photo.tags ? JSON.parse(photo.tags) : [];
                    res.status(201).json(photo);
                }
            );
        }
    );
});

// Delete a photo
app.delete('/api/photos/:photoId', authenticateToken, (req, res) => {
    const { photoId } = req.params;

    // First get the photo path to delete the file
    db.query('SELECT photo_path FROM book_photos WHERE id = ?', [photoId], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'Photo not found' });
        }

        const photoPath = results[0].photo_path;
        const fullPath = path.join(__dirname, photoPath);

        // Delete from database
        db.query('DELETE FROM book_photos WHERE id = ?', [photoId], (err) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            // Try to delete the file (don't fail if file doesn't exist)
            fs.unlink(fullPath, (err) => {
                if (err && err.code !== 'ENOENT') {
                    console.error('Error deleting photo file:', err);
                }
            });

            res.json({ message: 'Photo deleted successfully' });
        });
    });
});

// Update photo metadata
app.put('/api/photos/:photoId', authenticateToken, (req, res) => {
    const { photoId } = req.params;
    const { photo_type, description, tags } = req.body;

    const updates = [];
    const values = [];

    if (photo_type !== undefined) {
        updates.push('photo_type = ?');
        values.push(photo_type);
    }
    if (description !== undefined) {
        updates.push('description = ?');
        values.push(description);
    }
    if (tags !== undefined) {
        updates.push('tags = ?');
        values.push(JSON.stringify(tags));
    }

    if (updates.length === 0) {
        return res.status(400).json({ error: 'No updates provided' });
    }

    values.push(photoId);

    db.query(
        `UPDATE book_photos SET ${updates.join(', ')} WHERE id = ?`,
        values,
        (err) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            // Return updated photo
            db.query('SELECT * FROM book_photos WHERE id = ?', [photoId], (err, results) => {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }
                const photo = results[0];
                photo.tags = photo.tags ? JSON.parse(photo.tags) : [];
                res.json(photo);
            });
        }
    );
});


// --- User Management APIs ---
// Endpoints for managing application users (admin only features planned)

// Get all users
// Get all users
// Get all users
app.get('/api/users', authenticateToken, requireAdmin, (req, res) => {
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
// Create a user
app.post('/api/users', authenticateToken, requireAdmin, async (req, res) => {
    const { username, password, isAdmin } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const query = 'INSERT INTO users (username, password, is_admin) VALUES (?, ?, ?)';
    db.query(query, [username, hashedPassword, isAdmin || false], (err, result) => {
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
// Update a user
app.put('/api/users/:id', authenticateToken, requireAdmin, async (req, res) => {
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
        values.push(await bcrypt.hash(password, 10));
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
// Delete a user
app.delete('/api/users/:id', authenticateToken, requireAdmin, (req, res) => {
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

// --- System Management APIs ---

// Backup Database
app.get('/api/admin/backup', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const tables = ['books', 'users', 'settings', 'audiobookshelf_servers'];
        const backup = {};

        for (const table of tables) {
            // Check if table exists first to avoid errors
            const [tableExists] = await db.promise().query(`SHOW TABLES LIKE '${table}'`);
            if (tableExists.length > 0) {
                const [rows] = await db.promise().query(`SELECT * FROM ${table}`);
                backup[table] = rows;
            }
        }

        const filename = `bookboss_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
        res.json(backup);
    } catch (error) {
        console.error('Backup failed:', error);
        res.status(500).json({ error: 'Backup failed: ' + error.message });
    }
});

// Public Registration Endpoint
// Public Registration Endpoint
app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    try {
        // Check if user exists
        const [results] = await db.promise().query('SELECT * FROM users WHERE username = ?', [username]);

        if (results.length > 0) {
            return res.status(409).json({ error: 'Username already exists' });
        }

        // Create user (default not admin)
        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await db.promise().query('INSERT INTO users (username, password, is_admin) VALUES (?, ?, 0)', [username, hashedPassword]);

        res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ error: 'Failed to create user' });
    }
});

// --- Shelves APIs ---

// Get all shelves for a user
app.get('/api/shelves', authenticateToken, (req, res) => {
    const userId = req.user.id;
    db.query('SELECT * FROM shelves WHERE user_id = ?', [userId], (err, results) => {
        if (err) { console.error(err); return res.status(500).json({ error: err.message }); }
        res.json(results);
    });
});

// Create a shelf
app.post('/api/shelves', authenticateToken, (req, res) => {
    const userId = req.user.id;
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Shelf name is required' });

    db.query('INSERT INTO shelves (user_id, name) VALUES (?, ?)', [userId, name], (err, result) => {
        if (err) { console.error(err); return res.status(500).json({ error: err.message }); }
        res.status(201).json({ id: result.insertId, name, user_id: userId });
    });
});

// Delete a shelf
app.delete('/api/shelves/:id', authenticateToken, (req, res) => {
    const userId = req.user.id;
    const shelfId = req.params.id;
    db.query('DELETE FROM shelves WHERE id = ? AND user_id = ?', [shelfId, userId], (err, result) => {
        if (err) { console.error(err); return res.status(500).json({ error: err.message }); }
        res.json({ message: 'Shelf deleted' });
    });
});

// Add book to shelf
app.post('/api/shelves/:id/books', authenticateToken, (req, res) => {
    const shelfId = req.params.id;
    const { bookId } = req.body;
    // Verify shelf belongs to user
    db.query('SELECT id FROM shelves WHERE id = ? AND user_id = ?', [shelfId, req.user.id], (err, results) => {
        if (err || results.length === 0) return res.status(403).json({ error: 'Shelf not found or access denied' });

        db.query('INSERT IGNORE INTO shelf_books (shelf_id, book_id) VALUES (?, ?)', [shelfId, bookId], (err, result) => {
            if (err) { console.error(err); return res.status(500).json({ error: err.message }); }
            res.json({ message: 'Book added to shelf' });
        });
    });
});

// Remove book from shelf
app.delete('/api/shelves/:id/books/:bookId', authenticateToken, (req, res) => {
    const shelfId = req.params.id;
    const bookId = req.params.bookId;
    // Verify shelf belongs to user
    db.query('SELECT id FROM shelves WHERE id = ? AND user_id = ?', [shelfId, req.user.id], (err, results) => {
        if (err || results.length === 0) return res.status(403).json({ error: 'Shelf not found or access denied' });

        db.query('DELETE FROM shelf_books WHERE shelf_id = ? AND book_id = ?', [shelfId, bookId], (err, result) => {
            if (err) { console.error(err); return res.status(500).json({ error: err.message }); }
            res.json({ message: 'Book removed from shelf' });
        });
    });
});

// --- Reading Progress APIs ---

// Update reading progress
app.post('/api/user/books/:bookId', authenticateToken, (req, res) => {
    const userId = req.user.id;
    const bookId = req.params.bookId;
    const { status, progress, rating } = req.body;

    const query = `INSERT INTO user_books (user_id, book_id, status, progress, rating)
                   VALUES (?, ?, ?, ?, ?)
                   ON DUPLICATE KEY UPDATE status = VALUES(status), progress = VALUES(progress), rating = VALUES(rating)`;

    db.query(query, [userId, bookId, status, progress || 0, rating || 0], (err, result) => {
        if (err) { console.error(err); return res.status(500).json({ error: err.message }); }
        res.json({ message: 'Progress updated' });
    });
});

// Get reading progress for all books of a user
app.get('/api/user/books', authenticateToken, (req, res) => {
    const userId = req.user.id;
    db.query('SELECT * FROM user_books WHERE user_id = ?', [userId], (err, results) => {
        if (err) { console.error(err); return res.status(500).json({ error: err.message }); }
        res.json(results);
    });
});

// --- Loans APIs ---

// Get all loans
app.get('/api/loans', authenticateToken, (req, res) => {
    const userId = req.user.id;
    db.query('SELECT loans.*, books.title as book_title FROM loans JOIN books ON loans.book_id = books.id WHERE user_id = ?', [userId], (err, results) => {
        if (err) { console.error(err); return res.status(500).json({ error: err.message }); }
        res.json(results);
    });
});

// Create a loan
app.post('/api/loans', authenticateToken, (req, res) => {
    const userId = req.user.id;
    const { book_id, borrower_name, due_date, notes } = req.body;
    db.query('INSERT INTO loans (user_id, book_id, borrower_name, due_date, notes) VALUES (?, ?, ?, ?, ?)',
        [userId, book_id, borrower_name, due_date, notes], (err, result) => {
            if (err) { console.error(err); return res.status(500).json({ error: err.message }); }
            // Update book is_loaned status as well for legacy compatibility
            db.query('UPDATE books SET is_loaned = 1, borrower_name = ?, loan_date = CURRENT_DATE, due_date = ? WHERE id = ?',
                [borrower_name, due_date, book_id]);
            res.status(201).json({ message: 'Loan created' });
        });
});

// Return a loan
app.put('/api/loans/:id/return', authenticateToken, (req, res) => {
    const userId = req.user.id;
    const loanId = req.params.id;
    db.query('UPDATE loans SET return_date = CURRENT_DATE WHERE id = ? AND user_id = ?', [loanId, userId], (err, result) => {
        if (err) { console.error(err); return res.status(500).json({ error: err.message }); }
        // Also update book
        db.query('SELECT book_id FROM loans WHERE id = ?', [loanId], (err, resBook) => {
            if (resBook && resBook.length > 0) {
                db.query('UPDATE books SET is_loaned = 0, borrower_name = NULL, loan_date = NULL, due_date = NULL WHERE id = ?', [resBook[0].book_id]);
            }
        });
        res.json({ message: 'Book returned' });
    });
});

// --- User Profile/Privacy APIs ---

app.get('/api/users/profile', authenticateToken, (req, res) => {
    const userId = req.user.id;
    db.query('SELECT id, username, is_admin, privacy_settings FROM users WHERE id = ?', [userId], (err, results) => {
        if (err) { console.error(err); return res.status(500).json({ error: err.message }); }
        if (results.length === 0) return res.status(404).json({ error: 'User not found' });

        const user = results[0];
        if (typeof user.privacy_settings === 'string') {
            user.privacy_settings = JSON.parse(user.privacy_settings || '{}');
        }
        res.json(user);
    });
});

app.put('/api/users/profile', authenticateToken, (req, res) => {
    const userId = req.user.id;
    const { privacy_settings } = req.body;
    db.query('UPDATE users SET privacy_settings = ? WHERE id = ?', [JSON.stringify(privacy_settings), userId], (err, result) => {
        if (err) { console.error(err); return res.status(500).json({ error: err.message }); }
        res.json({ message: 'Profile updated' });
    });
});

// --- Reading Lists APIs ---

// Get all reading lists for the current user
app.get('/api/reading-lists', authenticateToken, (req, res) => {
    const userId = req.user.id;
    const query = `
        SELECT rl.*, 
               COUNT(rlb.id) as book_count
        FROM reading_lists rl
        LEFT JOIN reading_list_books rlb ON rl.id = rlb.list_id
        WHERE rl.user_id = ?
        GROUP BY rl.id
        ORDER BY rl.updated_at DESC
    `;

    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Error fetching reading lists:', err);
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});

// Create a new reading list
app.post('/api/reading-lists', authenticateToken, (req, res) => {
    const userId = req.user.id;
    const { name, description, is_public } = req.body;

    if (!name) {
        return res.status(400).json({ error: 'List name is required' });
    }

    db.query(
        'INSERT INTO reading_lists (user_id, name, description, is_public) VALUES (?, ?, ?, ?)',
        [userId, name, description || null, is_public || false],
        (err, result) => {
            if (err) {
                console.error('Error creating reading list:', err);
                return res.status(500).json({ error: err.message });
            }
            res.status(201).json({
                id: result.insertId,
                message: 'Reading list created successfully'
            });
        }
    );
});

// Get books in a specific reading list
app.get('/api/reading-lists/:listId/books', authenticateToken, (req, res) => {
    const { listId } = req.params;
    const userId = req.user.id;

    // First verify the list belongs to the user or is public
    db.query(
        'SELECT * FROM reading_lists WHERE id = ? AND (user_id = ? OR is_public = TRUE)',
        [listId, userId],
        (err, lists) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            if (lists.length === 0) {
                return res.status(404).json({ error: 'Reading list not found' });
            }

            // Get books in the list
            const query = `
                SELECT b.*, rlb.added_at, rlb.notes as list_notes
                FROM books b
                INNER JOIN reading_list_books rlb ON b.id = rlb.book_id
                WHERE rlb.list_id = ?
                ORDER BY rlb.added_at DESC
            `;

            db.query(query, [listId], (err, results) => {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }
                res.json(results);
            });
        }
    );
});

// Add a book to a reading list
app.post('/api/reading-lists/:listId/books', authenticateToken, (req, res) => {
    const { listId } = req.params;
    const { book_id, notes } = req.body;
    const userId = req.user.id;

    // Verify the list belongs to the user
    db.query(
        'SELECT * FROM reading_lists WHERE id = ? AND user_id = ?',
        [listId, userId],
        (err, lists) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            if (lists.length === 0) {
                return res.status(403).json({ error: 'Access denied' });
            }

            // Add book to list
            db.query(
                'INSERT INTO reading_list_books (list_id, book_id, notes) VALUES (?, ?, ?)',
                [listId, book_id, notes || null],
                (err, result) => {
                    if (err) {
                        if (err.code === 'ER_DUP_ENTRY') {
                            return res.status(400).json({ error: 'Book already in this list' });
                        }
                        return res.status(500).json({ error: err.message });
                    }
                    res.status(201).json({ message: 'Book added to reading list' });
                }
            );
        }
    );
});

// Remove a book from a reading list
app.delete('/api/reading-lists/:listId/books/:bookId', authenticateToken, (req, res) => {
    const { listId, bookId } = req.params;
    const userId = req.user.id;

    // Verify the list belongs to the user
    db.query(
        'SELECT * FROM reading_lists WHERE id = ? AND user_id = ?',
        [listId, userId],
        (err, lists) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            if (lists.length === 0) {
                return res.status(403).json({ error: 'Access denied' });
            }

            db.query(
                'DELETE FROM reading_list_books WHERE list_id = ? AND book_id = ?',
                [listId, bookId],
                (err, result) => {
                    if (err) {
                        return res.status(500).json({ error: err.message });
                    }
                    res.json({ message: 'Book removed from reading list' });
                }
            );
        }
    );
});

// Update a reading list
app.put('/api/reading-lists/:listId', authenticateToken, (req, res) => {
    const { listId } = req.params;
    const { name, description, is_public } = req.body;
    const userId = req.user.id;

    db.query(
        'UPDATE reading_lists SET name = ?, description = ?, is_public = ? WHERE id = ? AND user_id = ?',
        [name, description, is_public, listId, userId],
        (err, result) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Reading list not found' });
            }
            res.json({ message: 'Reading list updated' });
        }
    );
});

// Delete a reading list
app.delete('/api/reading-lists/:listId', authenticateToken, (req, res) => {
    const { listId } = req.params;
    const userId = req.user.id;

    db.query(
        'DELETE FROM reading_lists WHERE id = ? AND user_id = ?',
        [listId, userId],
        (err, result) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Reading list not found' });
            }
            res.json({ message: 'Reading list deleted' });
        }
    );
});

// --- Advanced Library Features ---

// Advanced Search with fulltext
app.get('/api/books/search/advanced', authenticateToken, (req, res) => {
    const { query, fields } = req.query;

    if (!query) {
        return res.status(400).json({ error: 'Search query is required' });
    }

    // Use MySQL fulltext search
    const searchQuery = `
        SELECT *, MATCH(title, author) AGAINST(? IN NATURAL LANGUAGE MODE) as relevance
        FROM books
        WHERE MATCH(title, author) AGAINST(? IN NATURAL LANGUAGE MODE)
        ORDER BY relevance DESC
        LIMIT 100
    `;

    db.query(searchQuery, [query, query], (err, results) => {
        if (err) {
            console.error('Error in advanced search:', err);
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});

// Get book statistics for current user
app.get('/api/statistics/books', authenticateToken, (req, res) => {
    const userId = req.user.id;

    const statsQuery = `
        SELECT 
            COUNT(*) as total_books,
            COUNT(CASE WHEN status = 'Completed' THEN 1 END) as completed_books,
            COUNT(CASE WHEN status = 'In Progress' THEN 1 END) as in_progress_books,
            COUNT(CASE WHEN status = 'Not Started' THEN 1 END) as not_started_books,
            COUNT(CASE WHEN format = 'Ebook' THEN 1 END) as ebooks,
            COUNT(CASE WHEN format = 'Physical' THEN 1 END) as physical_books,
            COUNT(CASE WHEN format = 'Audiobook' THEN 1 END) as audiobooks,
            AVG(rating) as average_rating,
            SUM(page_count) as total_pages
        FROM books
    `;

    db.query(statsQuery, (err, results) => {
        if (err) {
            console.error('Error fetching statistics:', err);
            return res.status(500).json({ error: err.message });
        }
        res.json(results[0]);
    });
});

// Get reading statistics by month
app.get('/api/statistics/reading-by-month', authenticateToken, (req, res) => {
    const { year } = req.query;
    const currentYear = year || new Date().getFullYear();

    const query = `
        SELECT 
            MONTH(added_at) as month,
            COUNT(*) as books_added,
            COUNT(CASE WHEN status = 'Completed' THEN 1 END) as books_completed
        FROM books
        WHERE YEAR(added_at) = ?
        GROUP BY MONTH(added_at)
        ORDER BY month
    `;

    db.query(query, [currentYear], (err, results) => {
        if (err) {
            console.error('Error fetching monthly stats:', err);
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});

// Get author statistics
app.get('/api/statistics/authors', authenticateToken, (req, res) => {
    const query = `
        SELECT 
            author,
            COUNT(*) as book_count,
            AVG(rating) as average_rating,
            COUNT(CASE WHEN status = 'Completed' THEN 1 END) as completed_count
        FROM books
        WHERE author IS NOT NULL AND author != ''
        GROUP BY author
        ORDER BY book_count DESC
        LIMIT 20
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching author stats:', err);
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});

// Find duplicate books
app.get('/api/books/duplicates', authenticateToken, (req, res) => {
    const { method } = req.query; // 'isbn' or 'title-author'

    let query;
    if (method === 'isbn') {
        query = `
            SELECT isbn, GROUP_CONCAT(id) as book_ids, GROUP_CONCAT(title SEPARATOR ' | ') as titles, COUNT(*) as count
            FROM books
            WHERE isbn IS NOT NULL AND isbn != ''
            GROUP BY isbn
            HAVING count > 1
        `;
    } else {
        query = `
            SELECT 
                CONCAT(title, ' - ', author) as book_key,
                GROUP_CONCAT(id) as book_ids,
                title,
                author,
                COUNT(*) as count
            FROM books
            WHERE title IS NOT NULL AND author IS NOT NULL
            GROUP BY title, author
            HAVING count > 1
        `;
    }

    db.query(query, (err, results) => {
        if (err) {
            console.error('Error finding duplicates:', err);
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});

// Save a search query
app.post('/api/saved-searches', authenticateToken, (req, res) => {
    const userId = req.user.id;
    const { name, query_params } = req.body;

    if (!name || !query_params) {
        return res.status(400).json({ error: 'Name and query parameters are required' });
    }

    db.query(
        'INSERT INTO saved_searches (user_id, name, query_params) VALUES (?, ?, ?)',
        [userId, name, JSON.stringify(query_params)],
        (err, result) => {
            if (err) {
                console.error('Error saving search:', err);
                return res.status(500).json({ error: err.message });
            }
            res.status(201).json({
                id: result.insertId,
                message: 'Search saved successfully'
            });
        }
    );
});

// Get saved searches
app.get('/api/saved-searches', authenticateToken, (req, res) => {
    const userId = req.user.id;

    db.query(
        'SELECT * FROM saved_searches WHERE user_id = ? ORDER BY created_at DESC',
        [userId],
        (err, results) => {
            if (err) {
                console.error('Error fetching saved searches:', err);
                return res.status(500).json({ error: err.message });
            }

            // Parse JSON query_params
            const searches = results.map(search => ({
                ...search,
                query_params: JSON.parse(search.query_params)
            }));

            res.json(searches);
        }
    );
});

// Delete a saved search
app.delete('/api/saved-searches/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    db.query(
        'DELETE FROM saved_searches WHERE id = ? AND user_id = ?',
        [id, userId],
        (err, result) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Saved search not found' });
            }
            res.json({ message: 'Saved search deleted' });
        }
    );
});

// Start a reading session
app.post('/api/reading-sessions', authenticateToken, (req, res) => {
    const userId = req.user.id;
    const { book_id } = req.body;

    db.query(
        'INSERT INTO reading_sessions (user_id, book_id) VALUES (?, ?)',
        [userId, book_id],
        (err, result) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.status(201).json({
                session_id: result.insertId,
                message: 'Reading session started'
            });
        }
    );
});

// End a reading session
app.put('/api/reading-sessions/:id/end', authenticateToken, (req, res) => {
    const { id } = req.params;
    const { pages_read } = req.body;
    const userId = req.user.id;

    // Calculate duration
    db.query(
        'SELECT started_at FROM reading_sessions WHERE id = ? AND user_id = ?',
        [id, userId],
        (err, results) => {
            if (err || results.length === 0) {
                return res.status(404).json({ error: 'Session not found' });
            }

            const startedAt = new Date(results[0].started_at);
            const endedAt = new Date();
            const durationMinutes = Math.round((endedAt - startedAt) / 60000);

            db.query(
                'UPDATE reading_sessions SET ended_at = NOW(), duration_minutes = ?, pages_read = ? WHERE id = ? AND user_id = ?',
                [durationMinutes, pages_read || 0, id, userId],
                (err) => {
                    if (err) {
                        return res.status(500).json({ error: err.message });
                    }
                    res.json({
                        message: 'Reading session ended',
                        duration_minutes: durationMinutes
                    });
                }
            );
        }
    );
});

// Get reading sessions for a book
app.get('/api/books/:bookId/reading-sessions', authenticateToken, (req, res) => {
    const { bookId } = req.params;
    const userId = req.user.id;

    db.query(
        'SELECT * FROM reading_sessions WHERE book_id = ? AND user_id = ? ORDER BY started_at DESC',
        [bookId, userId],
        (err, results) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json(results);
        }
    );
});

// --- Backup & Export APIs ---

// Export Library as CSV
app.get('/api/export/csv', authenticateToken, (req, res) => {
    const userId = req.user.id;

    const query = `
        SELECT b.title, b.author, b.isbn, b.publisher, b.publication_date, 
               b.page_count, b.description, b.status, b.rating, b.notes,
               b.physical_format, b.book_condition, b.is_signed, b.edition_type
        FROM books b
        ORDER BY b.title ASC
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error('Error exporting CSV:', err);
            return res.status(500).json({ error: err.message });
        }

        // Convert to CSV
        const headers = [
            'Title', 'Author', 'ISBN', 'Publisher', 'Publication Date',
            'Page Count', 'Description', 'Status', 'Rating', 'Notes',
            'Format', 'Condition', 'Signed', 'Edition'
        ];

        const csvRows = [headers.join(',')];

        results.forEach(row => {
            const values = headers.map(header => {
                const key = header.toLowerCase().replace(/ /g, '_');
                // Map header names to DB columns where they differ
                const dbKey = {
                    'publication_date': 'publication_date',
                    'page_count': 'page_count',
                    'format': 'physical_format',
                    'condition': 'book_condition',
                    'signed': 'is_signed',
                    'edition': 'edition_type'
                }[key] || key;

                let val = row[dbKey] || '';

                // Handle booleans
                if (val === 1 || val === true) val = 'Yes';
                if (val === 0 || val === false) val = 'No';

                // Escape quotes and wrap in quotes
                const stringVal = String(val).replace(/"/g, '""');
                return `"${stringVal}"`;
            });
            csvRows.push(values.join(','));
        });

        const csvString = csvRows.join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=library_export.csv');
        res.send(csvString);
    });
});

// Export Library as JSON
app.get('/api/export/json', authenticateToken, (req, res) => {
    const query = 'SELECT * FROM books ORDER BY title ASC';

    db.query(query, (err, results) => {
        if (err) {
            console.error('Error exporting JSON:', err);
            return res.status(500).json({ error: err.message });
        }

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename=library_export.json');
        res.json(results);
    });
});

// Create Database Backup (SQL Dump)
app.get('/api/backup', authenticateToken, requireAdmin, (req, res) => {
    const mysqldump = process.env.MYSQLDUMP_PATH || 'mysqldump';
    const dbUser = process.env.DB_USER || 'root';
    const dbPassword = process.env.DB_PASSWORD;
    const dbName = process.env.DB_NAME || 'bookboss';
    const dbHost = process.env.DB_HOST || 'localhost';

    // Create backups directory if it doesn't exist
    const backupDir = path.join(__dirname, 'backups');
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir);
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-${timestamp}.sql`;
    const filepath = path.join(backupDir, filename);

    // Construct command
    // Note: Using --no-tablespaces to avoid permission issues on some setups
    const cmd = `${mysqldump} -h ${dbHost} -u ${dbUser} -p${dbPassword} --no-tablespaces ${dbName} > "${filepath}"`;

    exec(cmd, (error, stdout, stderr) => {
        if (error) {
            console.error('Backup error:', error);
            return res.status(500).json({ error: 'Backup failed', details: error.message });
        }

        res.download(filepath, filename, (err) => {
            if (err) {
                console.error('Download error:', err);
            }
            // Optional: Delete file after download to save space
            // fs.unlinkSync(filepath);
        });
    });
});

// Restore Database from Backup
app.post('/api/restore', authenticateToken, requireAdmin, upload.single('backupFile'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No backup file provided' });
    }

    const mysql = process.env.MYSQL_PATH || 'mysql';
    const dbUser = process.env.DB_USER || 'root';
    const dbPassword = process.env.DB_PASSWORD;
    const dbName = process.env.DB_NAME || 'bookboss';
    const dbHost = process.env.DB_HOST || 'localhost';

    const filepath = req.file.path;

    // Construct command
    const cmd = `${mysql} -h ${dbHost} -u ${dbUser} -p${dbPassword} ${dbName} < "${filepath}"`;

    exec(cmd, (error, stdout, stderr) => {
        // Clean up uploaded file
        fs.unlinkSync(filepath);

        if (error) {
            console.error('Restore error:', error);
            return res.status(500).json({ error: 'Restore failed', details: error.message });
        }

        res.json({ message: 'Database restored successfully' });
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
// Add ABS server
// Authenticates with the ABS server and stores the connection details
app.post('/api/audiobookshelf/servers', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const { server_name, server_url, api_key } = req.body;

    if (!server_name || !server_url || !api_key) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        // Authenticate with ABS by verifying the token
        const client = new AudiobookshelfClient(server_url, api_key);
        const status = await client.getServerStatus();

        // If successful, save to DB
        // We reuse the api_token column for the API Key
        db.query(
            'INSERT INTO audiobookshelf_servers (user_id, server_name, server_url, api_token) VALUES (?, ?, ?, ?)',
            [userId, server_name, server_url, api_key],
            (err, result) => {
                if (err) { console.error(err); return res.status(500).json({ error: err.message }); }
                res.status(201).json({ message: 'Server added successfully', id: result.insertId });
            }
        );
    } catch (error) {
        console.error('ABS Connection Error:', error);
        res.status(500).json({ error: 'Failed to connect to Audiobookshelf server. Please check URL and API Key.' });
    }
});


// Update ABS server
app.put('/api/audiobookshelf/servers/:id', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const serverId = req.params.id;
    const { server_name, server_url, api_key, is_active } = req.body;

    try {
        let updateQuery = 'UPDATE audiobookshelf_servers SET server_name = ?, server_url = ?, is_active = ?';
        let queryParams = [server_name, server_url, is_active];

        // If API Key is provided, verify it first
        if (api_key) {
            console.log('Verifying new API Key for update...');
            const client = new AudiobookshelfClient(server_url, api_key);
            await client.getServerStatus(); // Will throw if invalid

            updateQuery += ', api_token = ?';
            queryParams.push(api_key);
        }

        updateQuery += ' WHERE id = ? AND user_id = ?';
        queryParams.push(serverId, userId);

        db.query(updateQuery, queryParams, (err, result) => {
            if (err) { console.error(err); return res.status(500).json({ error: err.message }); }
            res.json({ message: 'Server updated successfully' });
        });
    } catch (error) {
        console.error('ABS Update Error:', error);
        res.status(500).json({ error: 'Failed to verify connection with new API Key.' });
    }
});

// Search ABS servers
app.get('/api/audiobookshelf/search', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const { q } = req.query;

    if (!q) return res.status(400).json({ error: 'Query parameter "q" is required' });

    try {
        const servers = await db.promise().query(
            'SELECT * FROM audiobookshelf_servers WHERE user_id = ? AND is_active = true',
            [userId]
        );

        if (servers[0].length === 0) {
            return res.json({ results: [] });
        }

        const allResults = [];

        for (const server of servers[0]) {
            try {
                const client = new AudiobookshelfClient(server.server_url, server.api_token);
                const libraries = await client.getLibraries();

                for (const lib of libraries) {
                    try {
                        const searchRes = await client.searchLibrary(lib.id, q);
                        // ABS search results structure: { book: [...], podcast: [...] } or just array?
                        // Documentation says it returns array of items usually, or object with 'results'.
                        // Let's assume typical ABS response which is usually an array matches or object with 'results'.
                        // We will standardize the output.

                        const items = searchRes.results || searchRes.book || searchRes || [];

                        // Filter for books/audiobooks only
                        const books = Array.isArray(items) ? items : (items.book || []);

                        books.forEach(item => {
                            // Enrich with server info for the frontend
                            allResults.push({
                                ...item,
                                _server: {
                                    id: server.id,
                                    name: server.server_name,
                                    url: server.server_url
                                },
                                _library: {
                                    id: lib.id,
                                    name: lib.name
                                }
                            });
                        });

                    } catch (searchErr) {
                        console.error(`Search failed for lib ${lib.name} on ${server.server_name}:`, searchErr.message);
                    }
                }
            } catch (serverErr) {
                console.error(`Failed to connect to server ${server.server_name}:`, serverErr.message);
            }
        }

        res.json({ results: allResults });

    } catch (error) {
        console.error('ABS Search Error:', error);
        res.status(500).json({ error: 'Search failed' });
    }
});

// Helper to download image
const downloadImage = async (url, token, filepath) => {
    try {
        const response = await axios({
            url: url,
            method: 'GET',
            responseType: 'stream',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.status !== 200) {
            throw new Error(`Failed to download image: Status ${response.status}`);
        }

        const dir = path.dirname(filepath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        const writer = fs.createWriteStream(filepath);
        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', (err) => {
                writer.close(); // Ensure stream is closed
                // Optionally delete the partial file
                if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
                reject(err);
            });
        });
    } catch (error) {
        console.error(`Image Download Error (${url}):`, error.message);
        throw error;
    }
};

// Import book from ABS
app.post('/api/books/import/abs', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const { absItem, serverId, libraryId } = req.body;

    if (!absItem || !serverId) return res.status(400).json({ error: 'Missing required data' });

    const connection = await db.promise().getConnection();
    try {
        await connection.beginTransaction();

        // Fetch Server details to get Token/URL for cover download
        const [servers] = await connection.query('SELECT * FROM audiobookshelf_servers WHERE id = ?', [serverId]);
        const server = servers[0];

        // 1. Fetch full details (optional)

        // 2. Insert into books table
        const collapsedSeries = absItem.media.metadata.series ? absItem.media.metadata.series.map(s => s.name).join(', ') : '';
        const author = absItem.media.metadata.authorName || (absItem.media.metadata.authors && absItem.media.metadata.authors.length > 0 ? absItem.media.metadata.authors[0].name : 'Unknown');

        // Create Book
        const [bookResult] = await connection.query(
            `INSERT INTO books (
                title, author, description, 
                series, series_order, 
                publication_date, publisher, 
                language, duration, 
                format, status, added_at, cover_url
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)`,
            [
                absItem.media.metadata.title || absItem.name,
                author,
                absItem.media.metadata.description,
                collapsedSeries,
                null,
                absItem.media.metadata.publishedYear ? `${absItem.media.metadata.publishedYear}-01-01` : null,
                absItem.media.metadata.publisher,
                absItem.media.metadata.language,
                absItem.media.duration,
                'Audiobook',
                'Not Started',
                '' // Placeholder for cover_url, will update after download if successful
            ]
        );

        const newBookId = bookResult.insertId;

        // 3. Create Mapping
        await connection.query(
            `INSERT INTO abs_book_mappings (
                book_id, abs_server_id, abs_library_item_id, abs_library_id, last_synced
            ) VALUES (?, ?, ?, ?, NOW())`,
            [newBookId, serverId, absItem.id, libraryId]
        );

        // 4. Handle Cover
        let coverUrl = null;
        if (server && absItem.media.coverPath) {
            try {
                // absItem.media.coverPath is usually relative "/api/items/..."
                // or just "items/..." depending on ABS version. 
                // But client usually sees relative path.
                // We construct full URL.
                // If it starts with /, append to server_url.
                const fullCoverUrl = server.server_url + (absItem.media.coverPath.startsWith('/') ? '' : '/') + absItem.media.coverPath;

                const filename = `abs-${newBookId}-${Date.now()}.jpg`;
                const localPath = path.join(__dirname, 'uploads/covers', filename);
                const dbPath = `/uploads/covers/${filename}`;

                await downloadImage(fullCoverUrl, server.api_token, localPath);

                // Update book with cover url
                await connection.query('UPDATE books SET cover_url = ? WHERE id = ?', [dbPath, newBookId]);
                coverUrl = dbPath;
            } catch (imgErr) {
                console.warn('Failed to download cover:', imgErr.message);
            }
        }

        await connection.commit();
        res.status(201).json({ message: 'Book imported successfully', bookId: newBookId, coverUrl });

    } catch (error) {
        await connection.rollback();
        console.error('Import Error:', error);
        res.status(500).json({ error: 'Import failed: ' + error.message });
    } finally {
        connection.release();
    }
});

// Link existing book to ABS
app.post('/api/books/:id/link/abs', authenticateToken, async (req, res) => {
    const bookId = req.params.id;
    const { serverId, libraryItemId, libraryId } = req.body;

    if (!serverId || !libraryItemId) return res.status(400).json({ error: 'Missing required link data' });

    try {
        await db.promise().query(
            `INSERT INTO abs_book_mappings (
                book_id, abs_server_id, abs_library_item_id, abs_library_id, last_synced
            ) VALUES (?, ?, ?, ?, NOW())
            ON DUPLICATE KEY UPDATE 
                abs_server_id = VALUES(abs_server_id),
                abs_library_item_id = VALUES(abs_library_item_id),
                abs_library_id = VALUES(abs_library_id),
                last_synced = NOW()`,
            [bookId, serverId, libraryItemId, libraryId]
        );
        res.json({ message: 'Book linked successfully' });
    } catch (error) {
        console.error('Link Error:', error);
        res.status(500).json({ error: 'Failed to link book' });
    }
});

// Sync/Bulk Import from ABS
app.post('/api/audiobookshelf/sync', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const { serverId, debug } = req.body;

    // Debug Log Helper
    const logs = [];
    const log = (msg) => {
        if (debug) logs.push(`[${new Date().toISOString()}] ${msg}`);
    };

    log('Starting Sync Process...');

    try {
        let query = 'SELECT * FROM audiobookshelf_servers WHERE user_id = ? AND is_active = true';
        const params = [userId];
        if (serverId) {
            query += ' AND id = ?';
            params.push(serverId);
        }

        const [servers] = await db.promise().query(query, params);
        log(`Found ${servers.length} active server(s) to sync.`);

        if (servers.length === 0) {
            return res.json({ message: 'No active servers found', stats: { imported: 0, linked: 0, skipped: 0, updated: 0, errors: 0 }, logs });
        }

        const stats = { imported: 0, linked: 0, skipped: 0, updated: 0, errors: 0 };
        const connection = await db.promise().getConnection();

        try {
            for (const server of servers) {
                log(`Syncing Server: ${server.server_name} (${server.server_url})...`);
                try {
                    const client = new AudiobookshelfClient(server.server_url, server.api_token);
                    const libraries = await client.getLibraries();
                    log(`Fetched ${libraries.length} libraries.`);

                    for (const lib of libraries) {
                        log(`Processing Library: ${lib.name} (ID: ${lib.id})...`);
                        const libItemsRes = await client.getLibraryItems(lib.id, { limit: 100000 });
                        const items = libItemsRes.results || libItemsRes.items || [];
                        log(`Fetched ${items.length} items from library.`);

                        for (const item of items) {
                            if (!item.media || !item.media.metadata || !item.media.metadata.title) {
                                log(`Skipping invalid item: ${item.id}`);
                                continue;
                            }

                            const title = item.media.metadata.title;
                            const author = item.media.metadata.authorName ||
                                (item.media.metadata.authors && item.media.metadata.authors.length > 0 ? item.media.metadata.authors[0].name : 'Unknown Author');

                            log(`Processing Item: "${title}" by ${author}`);

                            // Check existing mapping
                            const [existingMapping] = await connection.query(
                                'SELECT book_id FROM abs_book_mappings WHERE abs_library_item_id = ? AND abs_server_id = ?',
                                [item.id, server.id]
                            );

                            let bookIdToUpdate = null;
                            let isNewLink = false;

                            if (existingMapping.length > 0) {
                                bookIdToUpdate = existingMapping[0].book_id;
                                log(` -> Already mapped to Book ID: ${bookIdToUpdate}`);
                            } else {
                                // Check for existing book by Title + Author
                                const [existingBooks] = await connection.query(
                                    'SELECT id FROM books WHERE title = ? AND author = ?',
                                    [title, author]
                                );

                                if (existingBooks.length > 0) {
                                    bookIdToUpdate = existingBooks[0].id;
                                    isNewLink = true;
                                    log(` -> Match found (Title/Author). linking to Book ID: ${bookIdToUpdate}`);
                                    try {
                                        await connection.query(
                                            `INSERT INTO abs_book_mappings (book_id, abs_server_id, abs_library_id, abs_library_item_id)
                                             VALUES (?, ?, ?, ?)`,
                                            [bookIdToUpdate, server.id, lib.id, item.id]
                                        );
                                        stats.linked++;
                                        log(`    -> Linked to Book ID: ${bookIdToUpdate}`);
                                    } catch (linkErr) {
                                        if (linkErr.code === 'ER_DUP_ENTRY') {
                                            stats.skipped++;
                                            log(`    -> Already linked to another item? Checking...`);
                                        } else {
                                            throw linkErr;
                                        }
                                    }
                                }
                            }

                            if (bookIdToUpdate) {
                                // Backfill Logic
                                const [currentBooks] = await connection.query('SELECT * FROM books WHERE id = ?', [bookIdToUpdate]);
                                if (currentBooks.length > 0) {
                                    const book = currentBooks[0];
                                    let updates = [];
                                    let params = [];

                                    const fields = {
                                        description: item.media.metadata.description,
                                        publisher: item.media.metadata.publisher,
                                        language: item.media.metadata.language,
                                        publication_date: item.media.metadata.publishedYear ? `${item.media.metadata.publishedYear}-01-01` : null
                                    };

                                    for (const [key, val] of Object.entries(fields)) {
                                        if (!book[key] && val) {
                                            updates.push(`${key} = ?`);
                                            params.push(val);
                                            log(`    -> Backfilling ${key}`);
                                        }
                                    }

                                    if (!book.series && item.media.metadata.series && item.media.metadata.series.length > 0) {
                                        updates.push('series = ?');
                                        params.push(item.media.metadata.series.map(s => s.name).join(', '));
                                        log(`    -> Backfilling series`);
                                    }

                                    if (!book.cover_url && item.media.coverPath) {
                                        log(`    -> Missing cover. Attempting download...`);
                                        try {
                                            // Use API endpoint for cover
                                            const fullCoverUrl = `${server.server_url}/api/items/${item.id}/cover`;
                                            const filename = `abs-${bookIdToUpdate}-${Date.now()}.jpg`;
                                            const localPath = path.join(__dirname, 'uploads/covers', filename);
                                            const dbPath = `/uploads/covers/${filename}`;
                                            await downloadImage(fullCoverUrl, server.api_token, localPath);
                                            updates.push('cover_url = ?');
                                            params.push(dbPath);
                                            log(`    -> Cover downloaded vs API and linked.`);
                                        } catch (e) {
                                            log(`    -> Cover download failed: ${e.message}`);
                                            console.warn('Backfill cover err:', e.message);
                                        }
                                    }

                                    if (updates.length > 0) {
                                        params.push(bookIdToUpdate);
                                        await connection.query(`UPDATE books SET ${updates.join(', ')} WHERE id = ?`, params);
                                        stats.updated++;
                                        log(`    -> Updated book with ${updates.length} fields.`);
                                    } else {
                                        if (!isNewLink) {
                                            stats.skipped++;
                                            log(`    -> No updates needed.`);
                                        }
                                    }
                                }
                            } else {
                                // IMPORT
                                log(` -> Importing new book: "${title}"`);
                                const collapsedSeries = item.media.metadata.series && item.media.metadata.series.length > 0
                                    ? item.media.metadata.series.map(s => s.name).join(', ')
                                    : '';

                                const [bookResult] = await connection.query(
                                    `INSERT INTO books (
                                        title, author, description, 
                                        series, series_order, 
                                        publication_date, publisher, 
                                        language, duration, 
                                        format, status, added_at, cover_url
                                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)`,
                                    [
                                        title,
                                        author,
                                        item.media.metadata.description,
                                        collapsedSeries,
                                        null,
                                        item.media.metadata.publishedYear ? `${item.media.metadata.publishedYear}-01-01` : null,
                                        item.media.metadata.publisher,
                                        item.media.metadata.language,
                                        item.media.duration,
                                        'Audiobook',
                                        'Not Started',
                                        ''
                                    ]
                                );

                                const newBookId = bookResult.insertId;
                                await connection.query(
                                    `INSERT INTO abs_book_mappings (book_id, abs_server_id, abs_library_id, abs_library_item_id)
                                     VALUES (?, ?, ?, ?)`,
                                    [newBookId, server.id, lib.id, item.id]
                                );
                                stats.imported++;
                                log(`    -> Imported as Book ID: ${newBookId}`);

                                if (item.media.coverPath) {
                                    try {
                                        log(`    -> Downloading cover...`);
                                        // Use API endpoint
                                        const fullCoverUrl = `${server.server_url}/api/items/${item.id}/cover`;
                                        const filename = `abs-${newBookId}-${Date.now()}.jpg`;
                                        const localPath = path.join(__dirname, 'uploads/covers', filename);
                                        const dbPath = `/uploads/covers/${filename}`;

                                        await downloadImage(fullCoverUrl, server.api_token, localPath);
                                        await connection.query('UPDATE books SET cover_url = ? WHERE id = ?', [dbPath, newBookId]);
                                        log(`    -> Cover saved via API.`);
                                    } catch (imgErr) {
                                        log(`    -> Cover download failed: ${imgErr.message}`);
                                        console.warn(`Failed to download cover for ${title}:`, imgErr.message);
                                    }
                                }
                            }
                        }
                    }
                } catch (serverErr) {
                    console.error(`Error syncing server ${server.server_name}:`, serverErr);
                    log(`Error syncing server ${server.server_name}: ${serverErr.message}`);
                    stats.errors++;
                }
            }
        } finally {
            connection.release();
        }

        log('Sync complete.');
        res.json({ message: 'Sync complete', stats, logs });

    } catch (error) {
        console.error('ABS Sync Error:', error);
        log(`Fatal Sync Error: ${error.message}`);
        res.status(500).json({ error: 'Sync failed: ' + error.message, logs });
    }
});

// Unlink book
app.delete('/api/books/:id/link/abs', authenticateToken, async (req, res) => {
    const bookId = req.params.id;
    try {
        await db.promise().query('DELETE FROM abs_book_mappings WHERE book_id = ?', [bookId]);
        res.json({ message: 'Book unlinked successfully' });
    } catch (error) {
        console.error('Unlink Error:', error);
        res.status(500).json({ error: 'Failed to unlink book' });
    }
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
// Catch-all handler for 404s (prevents CORB)
app.use((req, res) => {
    res.type('txt').status(404).send('Not Found');
});
