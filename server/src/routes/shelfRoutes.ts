import express from 'express';
const router = express.Router();
import shelfController from '../controllers/shelfController';
import { authenticateToken  } from '../middleware/authMiddleware';

router.get('/', authenticateToken, shelfController.getShelves);
router.post('/', authenticateToken, shelfController.createShelf);
router.put('/:id', authenticateToken, shelfController.renameShelf);
router.delete('/:id', authenticateToken, shelfController.deleteShelf);
router.post('/:id/books', authenticateToken, shelfController.addBookToShelf);
router.delete('/:id/books/:bookId', authenticateToken, shelfController.removeBookFromShelf);

export default router;
