const express = require('express');
const router = express.Router();
const featureController = require('../controllers/featureController');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');

router.get('/', authenticateToken, featureController.getFeatureRequests);
router.post('/', authenticateToken, featureController.createFeatureRequest);
router.post('/:id/vote', authenticateToken, featureController.voteFeature);
router.put('/:id/status', authenticateToken, requireAdmin, featureController.updateFeatureStatus);

module.exports = router;
