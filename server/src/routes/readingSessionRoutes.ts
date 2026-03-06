import express from 'express';
const router = express.Router();
import readingSessionController from '../controllers/readingSessionController';
import { authenticateToken  } from '../middleware/authMiddleware';

router.post('/', authenticateToken, readingSessionController.startSession);
router.put('/:id/end', authenticateToken, readingSessionController.endSession);

export default router;
