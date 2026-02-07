const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');

router.post('/login', authController.login);
router.post('/register', authenticateToken, requireAdmin, authController.register); // Restricted to Admins 
// server.js line 833: /api/login (public)
// server.js line 1282: /api/register (admin protected? No, comment said "Public Registration Endpoint" but middleware was authenticateToken, requireAdmin!)
// Wait, checking line 1282 again: `app.post('/api/register', authenticateToken, requireAdmin`
// So it WAS admin only.
// I should probably follow that if it was the policy.
// BUT `authController.register` I wrote was generic.
// Let's create a separate route file or just put it in `userRoutes` if it's admin/user management?
// Or `authRoutes` for the login.
// Is there a public register? Usually yes for a new app, but this seems self-hosted/private.
// I will keep `login` here.
// I will put `register` user creation in `userRoutes` protected by admin, to match `server.js` logic.
// However, `authController` has `register`. I can just use it.
// If I want public registration I would expose it here.
// Let's expose it here BUT check if the user intended it to be public or admin. 
// "Public Registration Endpoint" text suggests public, but code says admin.
// I'll stick to what the code did: ADMIN ONLY.
// So I won't put it in `authRoutes` (which are usually public).
// valid point. `authRoutes` -> public access (login).
// Maybe I'll put `register` in `userRoutes`?
// Or just export it here but require middleware router-level?
// Let's keep `login` only for now in public auth.
// And `register` is basically `createUser` in `userController`?
// `userController` has `createUser`. `authController` has `register`. Duplication?
// `authController`'s `register` hashed password. `userController`'s `createUser` also hashed password.
// They are duplicates. I should use `userController.createUser`.
// So `authRoutes` is just `login`.

module.exports = router;
