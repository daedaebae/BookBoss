const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Saved Searches
router.get('/saved', authenticateToken, searchController.getSavedSearches); // /api/search/saved? or /api/saved-searches?
// server.js had /api/saved-searches
// I will mount these at /api/search probably?
// Or I should stick to the old structure to minimize frontend changes.
// /api/saved-searches -> Saved searches
// /api/search/online -> Online search
// /api/search/editions -> Editions
// /api/books/search/advanced -> Advanced search (internal)

// If I group them into `searchRoutes`, I can mount it at `/api/search`
// Then `/api/search/saved` would be `getSavedSearches`.
// But server.js had `/api/saved-searches`.
// Refactoring means "Flatten API Routes" was a task.
// So `/api/search/saved` is better.
// I will use that. Frontend will need update.
// But wait, "Flatten API Routes (Backend)" is a task I have NOT marked done.
// And "Reduce architectural complexity" is the goal.
// I will stick to logical grouping.
// /api/search/saved
// /api/search/online
// /api/search/editions

router.post('/saved', authenticateToken, searchController.saveSearch);
router.delete('/saved/:id', authenticateToken, searchController.deleteSavedSearch);

router.get('/online', authenticateToken, searchController.searchOnline);
router.get('/editions', authenticateToken, searchController.getEditions);

module.exports = router;
