import express from 'express';
const router = express.Router();
import db from '../config/db';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';
import logger from '../utils/logger';

// OPDS Basic Auth Middleware
const opdsAuth = async (req, res, next) => {
    const b64auth = (req.headers.authorization || '').split(' ')[1] || '';
    const [username, password] = Buffer.from(b64auth, 'base64').toString().split(':');

    if (!username || !password) {
        res.set('WWW-Authenticate', 'Basic realm="BookBoss OPDS"');
        return res.status(401).send('Authentication required.');
    }

    try {
        const [results] = await db.promise().query('SELECT * FROM users WHERE username = ?', [username]);
        if ((results as any[]).length === 0) {
            res.set('WWW-Authenticate', 'Basic realm="BookBoss OPDS"');
            return res.status(401).send('Invalid credentials.');
        }

        const user = results[0];
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            res.set('WWW-Authenticate', 'Basic realm="BookBoss OPDS"');
            return res.status(401).send('Invalid credentials.');
        }

        req.user = user;
        next();
    } catch (error) {
        logger.error('OPDS Auth error:', error);
        res.status(500).send('Internal Server Error');
    }
};

router.use(opdsAuth);

// Helper function to escape XML characters
const escapeXml = (unsafe) => {
    if (!unsafe) return '';
    return String(unsafe).replace(/[<>&'"]/g, (c) => {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
        }
    });
};

// Root OPDS Catalog
router.get('/', (req, res) => {
    const baseUrl = `${req.protocol}://${req.get('host')}/api/opds`;

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/terms/" xmlns:opds="http://opds-spec.org/2010/catalog">
    <id>urn:bookboss:catalog</id>
    <title>BookBoss OPDS Catalog</title>
    <updated>${new Date().toISOString()}</updated>
    <author>
        <name>BookBoss</name>
    </author>
    <link href="${baseUrl}" rel="self" type="application/atom+xml;profile=opds-catalog;kind=navigation"/>
    <link href="${baseUrl}" rel="start" type="application/atom+xml;profile=opds-catalog;kind=navigation"/>
    
    <entry>
        <title>All Books</title>
        <id>urn:bookboss:catalog:all</id>
        <updated>${new Date().toISOString()}</updated>
        <content type="text">Browse all books in the library.</content>
        <link href="${baseUrl}/books" type="application/atom+xml;profile=opds-catalog;kind=acquisition"/>
    </entry>
    
    <entry>
        <title>Recent Additions</title>
        <id>urn:bookboss:catalog:recent</id>
        <updated>${new Date().toISOString()}</updated>
        <content type="text">Recently added books.</content>
        <link href="${baseUrl}/books?sort=recent" type="application/atom+xml;profile=opds-catalog;kind=acquisition"/>
    </entry>
</feed>`;

    res.type('application/atom+xml;profile=opds-catalog;kind=navigation');
    res.send(xml);
});

// Books Feed
router.get('/books', async (req, res) => {
    try {
        const baseUrl = `${req.protocol}://${req.get('host')}/api/opds`;
        const sort = req.query.sort === 'recent' ? 'ORDER BY added_at DESC' : 'ORDER BY title ASC';

        // We probably only want books with digital formats for OPDS downloads, 
        // but showing physical books is okay for cataloging too. 
        // We'll show all books, but only digital ones get acquisition links.
        const [books] = await db.promise().query(`SELECT * FROM books WHERE owner_id = ? ${sort}`, [req.user.id]);

        const entries = (books as any[]).map(book => {
            let acqLink = '';

            // For file_path
            if (book.file_path && fs.existsSync(book.file_path)) {
                if (book.file_path.endsWith('.pdf')) {
                    acqLink = `<link href="${baseUrl}/download/${book.id}" rel="http://opds-spec.org/acquisition" type="application/pdf"/>`;
                } else if (book.file_path.endsWith('.epub')) {
                    acqLink = `<link href="${baseUrl}/download/${book.id}" rel="http://opds-spec.org/acquisition" type="application/epub+zip"/>`;
                }
            }
            // Fallback to epub_file_path if file_path wasn't a recognized download
            if (!acqLink && book.epub_file_path && fs.existsSync(book.epub_file_path)) {
                acqLink = `<link href="${baseUrl}/download/${book.id}?type=epub" rel="http://opds-spec.org/acquisition" type="application/epub+zip"/>`;
            }

            let imgLink = '';
            if (book.cover_image_path) {
                const coverUrl = `${req.protocol}://${req.get('host')}/${book.cover_image_path.replace(/\\\\/g, '/')}`;
                imgLink = `<link href="${coverUrl}" rel="http://opds-spec.org/image" type="image/jpeg"/>
                           <link href="${coverUrl}" rel="http://opds-spec.org/image/thumbnail" type="image/jpeg"/>`;
            }

            // OPDS requires valid dates for <updated> and <published>. 
            // Handle cases where publication_date might be just a year string, or null.
            let pubDateStr = '2000-01-01T00:00:00Z'; // fallback
            if (book.publication_date) {
                const d = new Date(book.publication_date);
                if (!isNaN(d.getTime())) {
                    pubDateStr = d.toISOString();
                } else if (/^\\d{4}$/.test(book.publication_date)) {
                    pubDateStr = `${book.publication_date}-01-01T00:00:00Z`;
                }
            }

            return `
    <entry>
        <title>${escapeXml(book.title)}</title>
        <id>urn:bookboss:book:${book.id}</id>
        <author><name>${escapeXml(book.author || 'Unknown Author')}</name></author>
        <published>${pubDateStr}</published>
        <updated>${new Date(book.added_at).toISOString()}</updated>
        <summary type="text">${escapeXml(book.description || '')}</summary>
        ${acqLink}
        ${imgLink}
    </entry>`;
        }).join('\n');

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/terms/" xmlns:opds="http://opds-spec.org/2010/catalog">
    <id>urn:bookboss:books</id>
    <title>BookBoss Catalog - Books</title>
    <updated>${new Date().toISOString()}</updated>
    <author><name>BookBoss</name></author>
    <link href="${baseUrl}/books" rel="self" type="application/atom+xml;profile=opds-catalog;kind=acquisition"/>
    ${entries}
</feed>`;

        res.type('application/atom+xml;profile=opds-catalog;kind=acquisition');
        res.send(xml);
    } catch (error) {
        logger.error('Error generating OPDS books feed:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Download Book
router.get('/download/:id', async (req, res) => {
    try {
        const bookId = req.params.id;
        const [books] = await db.promise().query('SELECT * FROM books WHERE id = ? AND owner_id = ?', [bookId, req.user.id]);

        if ((books as any[]).length === 0) {
            return res.status(404).send('Book not found');
        }

        const book = books[0];

        let targetFile = book.file_path;
        if (req.query.type === 'epub' && book.epub_file_path) {
            targetFile = book.epub_file_path;
        } else if (!targetFile && book.epub_file_path) {
            targetFile = book.epub_file_path;
        }

        if (!targetFile || !fs.existsSync(targetFile)) {
            return res.status(404).send('File not found on server');
        }

        const ext = path.extname(targetFile);
        const safeTitle = (book.title || 'book').replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const safeAuthor = (book.author || 'author').replace(/[^a-z0-9]/gi, '_').toLowerCase();

        res.download(targetFile, `${safeTitle}_${safeAuthor}${ext}`);
    } catch (error) {
        logger.error('OPDS Download error:', error);
        res.status(500).send('Internal Server Error');
    }
});

export default router;
