import express from 'express';
const router = express.Router();
import * as notificationController from '../controllers/notificationController';
import { authenticateToken, requireAdmin  } from '../middleware/authMiddleware';

// Public/User routes
router.get('/', authenticateToken, notificationController.getNotifications);
router.post('/:id/acknowledge', authenticateToken, notificationController.acknowledgeNotification);

// Admin routes
router.post('/', authenticateToken, requireAdmin, notificationController.createNotification);
router.delete('/:id', authenticateToken, requireAdmin, notificationController.deleteNotification);

export default router;
