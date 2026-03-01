const express = require('express');
const router = express.Router();
const shelfController = require('../controllers/shelfController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.get('/', authenticateToken, shelfController.getShelves);
router.post('/', authenticateToken, shelfController.createShelf);
router.put('/:id', authenticateToken, shelfController.renameShelf);
router.delete('/:id', authenticateToken, shelfController.deleteShelf);
router.post('/:id/books', authenticateToken, shelfController.addBookToShelf);
router.delete('/:id/books/:bookId', authenticateToken, shelfController.removeBookFromShelf);

module.exports = router;
