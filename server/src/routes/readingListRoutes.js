const express = require('express');
const router = express.Router();
const readingListController = require('../controllers/readingListController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.get('/', authenticateToken, readingListController.getReadingLists);
router.post('/', authenticateToken, readingListController.createReadingList);
router.get('/:listId/books', authenticateToken, readingListController.getListBooks);
router.post('/:listId/books', authenticateToken, readingListController.addBookToList);
router.delete('/:listId/books/:bookId', authenticateToken, readingListController.removeBookFromList);
router.put('/:listId', authenticateToken, readingListController.updateReadingList);
router.delete('/:listId', authenticateToken, readingListController.deleteReadingList);

module.exports = router;
