const express = require('express');
const router = express.Router();
const bookController = require('../controllers/bookController');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');

router.delete('/:photoId', authenticateToken, requireAdmin, bookController.deleteBookPhoto);
router.put('/:photoId', authenticateToken, requireAdmin, bookController.updateBookPhoto);

module.exports = router;
