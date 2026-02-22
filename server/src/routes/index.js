const express = require('express');
const router = express.Router();
const featureController = require('../controllers/featureController');
const { authenticateToken } = require('../middleware/authMiddleware');

const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const bookRoutes = require('./bookRoutes');
const shelfRoutes = require('./shelfRoutes');
const loanRoutes = require('./loanRoutes');
const readingListRoutes = require('./readingListRoutes');
const readingSessionRoutes = require('./readingSessionRoutes');
const statsRoutes = require('./statsRoutes');
const searchRoutes = require('./searchRoutes');
const settingsRoutes = require('./settingsRoutes');
const jobRoutes = require('./jobRoutes');
const systemRoutes = require('./systemRoutes');
// const featureRoutes = require('./featureRoutes'); // Removed in favor of inline routes
const absRoutes = require('./absRoutes');
const photoRoutes = require('./photoRoutes');

// Mount routes
// Map to existing API structure in server.js

// Auth
router.use('/', authRoutes); // /api/login

// Users & Profiles
router.use('/users', userRoutes);

// Books
router.use('/books', bookRoutes);

// Photos (Direct Access)
router.use('/photos', photoRoutes);

// Feature Requests
router.get('/features', authenticateToken, featureController.getFeatureRequests);
router.post('/features', authenticateToken, featureController.createFeatureRequest);
router.post('/features/:id/vote', authenticateToken, featureController.voteFeature);
router.put('/features/:id', authenticateToken, featureController.updateFeature); // Unified update (status + note)

// Shelves
router.use('/shelves', shelfRoutes);

// Loans
router.use('/loans', loanRoutes);

// Reading Lists
router.use('/reading-lists', readingListRoutes);

// Reading Sessions
router.use('/reading-sessions', readingSessionRoutes); // /api/reading-sessions

// Statistics
router.use('/statistics', statsRoutes);

// Search (Saved, Online, Editions)
// server.js had /api/saved-searches, /api/search/online, /api/search/editions
// My searchRoutes has /saved, /online, /editions.
// So mounting at /search makes /api/search/saved, /api/search/online.
// But legacy was /api/saved-searches.
// I will keep it clean: /api/search/... 
// AND I will alias /api/saved-searches if needed? 
// The "Flatten API Routes" task implies cleaning up. I'll stick to /api/search/...
router.use('/search', searchRoutes);
// For compatibility with /api/saved-searches, I might need a redirect or separate mount?
// Let's assume frontend refactor will handle it or I can alias.
router.use('/saved-searches', searchRoutes); // This mounts same controller. /api/saved-searches/saved? No. 
// searchRoutes has `router.get('/saved'...)`.
// So `/api/search/saved` works.
// For `/api/saved-searches` (GET/POST), it was root level resource.
// I will alias specific routes if I want 100% compat without frontend change.
// But I am refactoring frontend too. I will prefer clean API.
// /api/search/saved is better.

// Settings
router.use('/settings', settingsRoutes);

// Jobs
router.use('/jobs', jobRoutes);

// System/Admin
router.use('/', systemRoutes); // /api/backup, /api/restore, /api/export...
// systemRoutes has /backup, /restore, /export/csv... so mounting at root /api/ works.

// ABS
router.use('/audiobookshelf', absRoutes);

module.exports = router;
