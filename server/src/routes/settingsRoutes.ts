import express from 'express';
const router = express.Router();
import settingsController from '../controllers/settingsController';
import { authenticateToken, requireAdmin  } from '../middleware/authMiddleware';
import logger from '../utils/logger';

router.get('/', authenticateToken, settingsController.getSettings);
router.post('/', authenticateToken, requireAdmin, settingsController.updateSettings);

// Task 8: Runtime log-level toggle for debug mode
router.post('/log-level', authenticateToken, requireAdmin, (req, res) => {
    const { level } = req.body;
    const valid = ['debug', 'info', 'warn', 'error'];
    if (!valid.includes(level)) {
        return res.status(400).json({ error: `Invalid log level. Must be one of: ${valid.join(', ')}` });
    }
    (logger as any).setLevel(level);
    res.json({ success: true, level });
});

export default router;

