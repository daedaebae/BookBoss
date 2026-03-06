import express from 'express';
const router = express.Router();
import bookController from '../controllers/bookController';
import { authenticateToken, requireAdmin  } from '../middleware/authMiddleware';

router.delete('/:photoId', authenticateToken, requireAdmin, bookController.deleteBookPhoto);
router.put('/:photoId', authenticateToken, requireAdmin, bookController.updateBookPhoto);

export default router;
