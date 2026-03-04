const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');
const logger = require('../utils/logger');

router.get('/', authenticateToken, settingsController.getSettings);
router.post('/', authenticateToken, requireAdmin, settingsController.updateSettings);

// Task 8: Runtime log-level toggle for debug mode
router.post('/log-level', authenticateToken, requireAdmin, (req, res) => {
    const { level } = req.body;
    const valid = ['debug', 'info', 'warn', 'error'];
    if (!valid.includes(level)) {
        return res.status(400).json({ error: `Invalid log level. Must be one of: ${valid.join(', ')}` });
    }
    logger.setLevel(level);
    res.json({ success: true, level });
});

module.exports = router;

