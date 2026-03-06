import express from 'express';
const router = express.Router();
import loanController from '../controllers/loanController';
import { authenticateToken  } from '../middleware/authMiddleware';

router.get('/', authenticateToken, loanController.getLoans);
router.post('/', authenticateToken, loanController.createLoan);
router.put('/:id/return', authenticateToken, loanController.returnLoan);

export default router;
