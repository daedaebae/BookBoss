const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');

// Public/User routes
router.get('/', authenticateToken, notificationController.getNotifications);
router.post('/:id/acknowledge', authenticateToken, notificationController.acknowledgeNotification);

// Admin routes
router.post('/', authenticateToken, requireAdmin, notificationController.createNotification);
router.delete('/:id', authenticateToken, requireAdmin, notificationController.deleteNotification);

module.exports = router;
