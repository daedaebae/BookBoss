const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.get('/books', authenticateToken, statsController.getBookStats);
router.get('/reading-by-month', authenticateToken, statsController.getReadingByMonth);
router.get('/authors', authenticateToken, statsController.getAuthorStats);

module.exports = router;
