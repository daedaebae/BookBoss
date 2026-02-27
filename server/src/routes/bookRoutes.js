const express = require('express');
const router = express.Router();
const bookController = require('../controllers/bookController');
const absController = require('../controllers/absController');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Public/Shared Access (authenticated)
router.get('/', authenticateToken, bookController.getBooks);
router.get('/:id/download', authenticateToken, bookController.downloadBook);
router.get('/:bookId/photos', authenticateToken, bookController.getBookPhotos);

// Advanced Search (Internal)
router.get('/search/advanced', authenticateToken, bookController.advancedSearch);
router.get('/duplicates', authenticateToken, bookController.findDuplicates);

// Bulk Ops
router.delete('/bulk', authenticateToken, requireAdmin, bookController.bulkDeleteBooks); // DELETE /api/books/bulk
router.patch('/bulk', authenticateToken, requireAdmin, bookController.bulkUpdateBooks);
router.post('/refresh-metadata', authenticateToken, requireAdmin, bookController.refreshMetadata);

// Admin Operations
router.post('/', authenticateToken, upload.single('coverFile'), bookController.addBook);

router.put('/:id', authenticateToken, requireAdmin, upload.fields([{ name: 'coverFile', maxCount: 1 }]), bookController.updateBook);
router.delete('/:id', authenticateToken, requireAdmin, bookController.deleteBook);

// ABS Integration
router.post('/:id/link/abs', authenticateToken, requireAdmin, absController.linkBookToAbs);
router.delete('/:id/link/abs', authenticateToken, requireAdmin, absController.unlinkBookFromAbs);

// Photos Management
router.post('/:bookId/photos', authenticateToken, requireAdmin, upload.single('photo'), bookController.addBookPhoto);
router.delete('/photos/:photoId', authenticateToken, requireAdmin, bookController.deleteBookPhoto);
// Note: Route in server.js was /api/photos/:photoId for DELETE, and PUT.
// But POST was /api/books/:bookId/photos.
// I should probably clean this up. 
// Standard REST: POST /books/:id/photos, DELETE /books/:id/photos/:photoId OR DELETE /photos/:id
// server.js had `app.delete('/api/photos/:photoId'`.
// I will mount this router at /api/books.
// So this delete route would be /api/books/photos/:photoId ? No, `router.delete('/photos/:photoId')` inside `bookRoutes` mounted at `/api/books` works.
// BUT server.js had `/api/photos/:photoId`. That's a top level `/api/photos`.
// I should probably make a `photoRoutes.js` if I want to match that URL structure strictly, OR just mount it at `/api/photos`.
// Or if I keep it in bookRoutes, I need to make sure the path matches.
// If I mount `bookRoutes` at `/api/books`, then `/api/books/photos/:photoId` works well.
// But the frontend might expect `/api/photos/:photoId`.
// I should check `server.js` route again.
// Line 1017: `app.delete('/api/photos/:photoId'`
// Line 979: `app.post('/api/books/:bookId/photos'`
// So they are inconsistent.
// I will create `photoRoutes.js` for the direct photo manipulation (/api/photos) to be safe and clean.
// And keep the `post` in `bookRoutes`.
// Or just put everything in `bookRoutes` and handle the paths.
// If I mount `bookRoutes` at `/api/books`, I can't easily handle `/api/photos`.
// I'll create `photoRoutes.js`.

module.exports = router;
