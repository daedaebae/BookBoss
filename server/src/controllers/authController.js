const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

if (!process.env.JWT_SECRET) {
    if (process.env.NODE_ENV === 'production') {
        console.error('FATAL: JWT_SECRET environment variable is not set. Exiting.');
        process.exit(1);
    } else {
        console.warn('WARNING: JWT_SECRET environment variable is not set. Using random secret for development.');
    }
}
const JWT_SECRET = process.env.JWT_SECRET || require('crypto').randomBytes(64).toString('hex');

const login = async (req, res) => {
    const { username, password } = req.body;

    try {
        const [results] = await db.promise().query('SELECT * FROM users WHERE username = ?', [username]);

        if (results.length === 0) {
            return res.status(401).json({ error: 'User not found' });
        }

        const user = results[0];

        // Check password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Password incorrect' });
        }

        // Generate JWT Token
        const token = jwt.sign(
            { id: user.id, username: user.username, isAdmin: user.is_admin === 1 },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token: token,
            id: user.id,
            username: user.username,
            isAdmin: user.is_admin === 1
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

const register = async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    try {
        // Check if user exists
        const [results] = await db.promise().query('SELECT * FROM users WHERE username = ?', [username]);

        if (results.length > 0) {
            return res.status(409).json({ error: 'Username already exists' });
        }

        // Create user (default not admin)
        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await db.promise().query('INSERT INTO users (username, password, is_admin) VALUES (?, ?, 0)', [username, hashedPassword]);

        res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ error: 'Failed to create user' });
    }
};

module.exports = {
    login,
    register,
    JWT_SECRET // Exporting secret if needed by middleware, though middleware should probably be separate or in authController
};
