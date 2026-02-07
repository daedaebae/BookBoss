const express = require('express');
const router = express.Router();
const systemController = require('../controllers/systemController');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Exports
router.get('/export/csv', authenticateToken, systemController.exportCsv);
router.get('/export/json', authenticateToken, systemController.exportJson);

// Backup/Restore
router.get('/backup', authenticateToken, requireAdmin, systemController.sqlBackup); // /api/backup
router.post('/restore', authenticateToken, requireAdmin, upload.single('backupFile'), systemController.sqlRestore); // /api/restore
// Also /api/admin/backup was duplicate. Let's map it too if legacy needed, or just rely on this.
router.get('/admin/backup', authenticateToken, requireAdmin, systemController.backupDatabase); // This was generating JSON backup in userController?
// Wait, systemController has `backupDatabase` (JSON) and `sqlBackup` (SQL).
// server.js line 2152 was SQL dump.
// server.js line 1256 was JSON dump.
// So:
// /api/backup -> SQL Dump (line 2152) -> systemController.sqlBackup
// /api/admin/backup -> JSON Dump (line 1256) -> systemController.backupDatabase

router.get('/admin/debug/generate-data', authenticateToken, requireAdmin, systemController.generateDummyData);

// Admin Library Management
router.get('/admin/libraries', authenticateToken, requireAdmin, systemController.getLibraryStats);
router.delete('/admin/libraries/:userId/wipe', authenticateToken, requireAdmin, systemController.wipeLibrary);

module.exports = router;
