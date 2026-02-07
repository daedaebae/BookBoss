const express = require('express');
const router = express.Router();
const jobController = require('../controllers/jobController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.get('/', authenticateToken, jobController.getJobs);

module.exports = router;
