const express = require('express');
const router = express.Router();
const readingSessionController = require('../controllers/readingSessionController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.post('/', authenticateToken, readingSessionController.startSession);
router.put('/:id/end', authenticateToken, readingSessionController.endSession);

module.exports = router;
