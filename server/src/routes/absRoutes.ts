import express from 'express';
const router = express.Router();
import absController from '../controllers/absController';
import { authenticateToken, requireAdmin  } from '../middleware/authMiddleware';

// Server Management
router.get('/servers', authenticateToken, absController.getAbsServers);
router.post('/servers', authenticateToken, requireAdmin, absController.addAbsServer);
router.put('/servers/:id', authenticateToken, requireAdmin, absController.updateAbsServer);
router.get('/servers/:id/status', authenticateToken, absController.checkAbsStatus);

// Search/Sync
router.get('/search', authenticateToken, absController.searchAbsServers);
router.post('/sync', authenticateToken, requireAdmin, absController.syncLibraryFromAbs);

// Item Management
router.post('/import', authenticateToken, requireAdmin, absController.importBookFromAbs);

// Note: Link/Unlink require ID, so they conceptually belong under /api/books/:id...
// But we are in `absRoutes` mounted at `/api/audiobookshelf`?
// server.js had `/api/books/:id/link/abs`.
// If I use `router.post('/:id/link', ...)` here, it would be `/api/audiobookshelf/:id/link` which implies ID is ABS server ID or item ID?
// But the link is "Book -> ABS Item".
// I will export these controller functions and use them in `bookRoutes` if I want strictly `/api/books/:id/link/abs`.
// OR I can use `/api/audiobookshelf/link-book/:bookId` here.
// I think `/api/books/:id/link/abs` is cleaner resource design.
// So I should modify `bookRoutes.js` to include these ABS link/unlink routes, using `absController`.

export default router;
