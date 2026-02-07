const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');

router.get('/', authenticateToken, settingsController.getSettings);
router.post('/', authenticateToken, requireAdmin, settingsController.updateSettings);

module.exports = router;
