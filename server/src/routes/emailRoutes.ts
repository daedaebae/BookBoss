import express from 'express';
const router = express.Router();
import db from '../config/db';
import emailService from '../services/emailService';
import { authenticateToken, requireAdmin } from '../middleware/authMiddleware';
import logger from '../utils/logger';
import path from 'path';

// POST /api/email/test -> Admin only
router.post('/test', authenticateToken, requireAdmin, async (req, res) => {
    const { to, host, port, secure, user, pass } = req.body;

    if (!to) {
        return res.status(400).json({ error: 'Recipient address required' });
    }

    try {
        const configOverride = host ? { host, port, secure, user, pass } : null;
        await emailService.sendTestEmail(to, configOverride);
        res.json({ message: 'Test email sent successfully!' });
    } catch (error) {
        logger.error('Test email failed:', error);
        res.status(500).json({ error: error.message || 'Failed to send test email' });
    }
});

// POST /api/email/send/:bookId
router.post('/send/:bookId', authenticateToken, async (req, res) => {
    const { to } = req.body;
    const bookId = req.params.bookId;

    if (!to) {
        return res.status(400).json({ error: 'Recipient address (e.g. Kindle email) required' });
    }

    try {
        const userId = (req as any).user.id;
        const [books] = await db.promise().query('SELECT * FROM books WHERE id = ? AND owner_id = ?', [bookId, userId]);
        if ((books as any[]).length === 0) {
            return res.status(404).json({ error: 'Book not found' });
        }

        const book = books[0];

        // Determine which file to send (EPUB preferred, then PDF)
        let targetFile = book.epub_file_path; // Try explicit EPUB first
        if (!targetFile && book.file_path && (book.file_path.endsWith('.epub') || book.file_path.endsWith('.pdf'))) {
            targetFile = book.file_path;
        } else if (!targetFile && book.file_path) {
            targetFile = book.file_path;
        }

        if (!targetFile) {
            return res.status(404).json({ error: 'No digital format available to send for this book' });
        }

        const ext = path.extname(targetFile);
        const safeTitle = (book.title || 'book').replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const safeAuthor = (book.author || 'author').replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const filename = `${safeTitle}_${safeAuthor}${ext}`;

        await emailService.sendEbook(to, book.title, targetFile, filename);

        res.json({ message: `Successfully sent ${book.title} to ${to}!` });
    } catch (error) {
        logger.error(`Send to device failed for book ${bookId}:`, error);
        res.status(500).json({ error: error.message || 'Failed to send ebook' });
    }
});

export default router;
