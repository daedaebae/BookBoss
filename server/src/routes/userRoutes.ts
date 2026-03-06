import express from 'express';
const router = express.Router();
import userController from '../controllers/userController';
import { authenticateToken, requireAdmin  } from '../middleware/authMiddleware';

// Profile (Self)
router.get('/profile', authenticateToken, userController.getProfile);
router.put('/profile', authenticateToken, userController.updateProfile);

// Public Users (Shared libraries) - This seemed to be public/authenticated user accessible
router.get('/public', authenticateToken, userController.getPublicUsers);

// Admin Management
router.get('/', authenticateToken, requireAdmin, userController.getUsers);
router.post('/', authenticateToken, requireAdmin, userController.createUser); // This replaces /api/register
router.put('/:id', authenticateToken, requireAdmin, userController.updateUser);
router.delete('/:id', authenticateToken, requireAdmin, userController.deleteUser);
// note: server.js had /api/register pointing to a creation logic. 
// We are mapping DELETE /api/users/:id, POST /api/users, etc.

export default router;
