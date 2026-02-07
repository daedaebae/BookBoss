const express = require('express');
const router = express.Router();
const loanController = require('../controllers/loanController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.get('/', authenticateToken, loanController.getLoans);
router.post('/', authenticateToken, loanController.createLoan);
router.put('/:id/return', authenticateToken, loanController.returnLoan);

module.exports = router;
