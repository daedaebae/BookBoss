import express from 'express';
const router = express.Router();
import jobController from '../controllers/jobController';
import { authenticateToken  } from '../middleware/authMiddleware';

router.get('/', authenticateToken, jobController.getJobs);

export default router;
