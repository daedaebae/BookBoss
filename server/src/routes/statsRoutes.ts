import express from 'express';
const router = express.Router();
import statsController from '../controllers/statsController';
import { authenticateToken  } from '../middleware/authMiddleware';

router.get('/books', authenticateToken, statsController.getBookStats);
router.get('/reading-by-month', authenticateToken, statsController.getReadingByMonth);
router.get('/authors', authenticateToken, statsController.getAuthorStats);

export default router;
