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

// Middleware - Enhanced CORS Configuration
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
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
// Modified to include shelf_ids and reading status for the current user if logged in (via token check optional or if we assume this is mostly auth'd)
// Since this is public for now, we won't join user_books unless we have a user context.
// But the frontend sends token. So we should use authenticateToken if we want user specific data.
// However, the route definition is `app.get('/api/books', ...)` without `authenticateToken`.
// Let's keep it public but try to parse user if header exists? Or just leave it generic and fetch user data separately.
// The plan was to fetch reading progress via `/api/user/books`.
// So we just need `shelf_ids`.
app.get('/api/books', (req, res) => {
    // We use a LEFT JOIN to get shelf_ids.
    // Since we can't easily do GROUP_CONCAT with a simple * select without grouping everything,
    // subquery is safer for mapped columns.
    // Note: older MySQL versions might not support JSON_ARRAYAGG.
    // If that fails, we might need a separate query or GROUP_CONCAT.
    // Let's try JSON_ARRAYAGG.
    const query = `
        SELECT b.*,
        (SELECT JSON_ARRAYAGG(shelf_id) FROM shelf_books WHERE book_id = b.id) as shelf_ids
        FROM books b
        ORDER BY b.added_at DESC
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: err.message });
        }
        // Parse JSON categories and shelf_ids
        const books = results.map(book => ({
            ...book,
            categories: typeof book.categories === 'string' ? JSON.parse(book.categories || '[]') : (book.categories || []),
            descriptors: typeof book.descriptors === 'string' ? JSON.parse(book.descriptors || '[]') : (book.descriptors || []),
            shelf_ids: typeof book.shelf_ids === 'string' ? JSON.parse(book.shelf_ids || '[]') : (book.shelf_ids || [])
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

    // Build SET clause from updates object
    const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const setValues = Object.values(updates);

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
app.post('/api/users', authenticateToken, requireAdmin, (req, res) => {
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
// Update a user
app.put('/api/users/:id', authenticateToken, requireAdmin, (req, res) => {
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
// Catch-all handler for 404s (prevents CORB)
app.use((req, res) => {
    res.type('txt').status(404).send('Not Found');
});
