import db from '../config/db';
import bcrypt from 'bcryptjs';

// Admin Operations
const getUsers = (req, res) => {
    db.query('SELECT id, username, is_admin FROM users', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
};

const createUser = async (req, res) => {
    const { username, password, isAdmin } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Missing credentials' });

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        db.query(
            'INSERT INTO users (username, password, is_admin) VALUES (?, ?, ?)',
            [username, hashedPassword, isAdmin || false],
            (err, result) => {
                if (err) {
                    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Username exists' });
                    return res.status(500).json({ error: err.message });
                }
                res.status(201).json({ id: (result as any).insertId, message: 'User created' });
            }
        );
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

const updateUser = async (req, res) => {
    const { id } = req.params;
    const { username, password, isAdmin } = req.body;

    let updates = [];
    let values = [];

    if (username) { updates.push('username = ?'); values.push(username); }
    if (password) {
        updates.push('password = ?');
        values.push(await bcrypt.hash(password, 10));
    }
    if (isAdmin !== undefined) { updates.push('is_admin = ?'); values.push(isAdmin); }

    if (updates.length === 0) return res.status(400).json({ error: 'No updates' });

    values.push(id);
    db.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values, (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'User updated' });
    });
};

const deleteUser = (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM users WHERE id = ?', [id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'User deleted' });
    });
};

// Profile Operations
const getProfile = (req, res) => {
    const userId = req.user.id;
    db.query('SELECT id, username, is_admin, privacy_settings FROM users WHERE id = ?', [userId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if ((results as any[]).length === 0) return res.status(404).json({ error: 'User not found' });

        const user = results[0];
        try { user.privacy_settings = JSON.parse(user.privacy_settings || '{}'); } catch (e) { }
        res.json(user);
    });
};

const updateProfile = async (req, res) => {
    const userId = req.user.id;
    const { privacy_settings, password } = req.body;

    try {
        const [results] = await db.promise().query('SELECT privacy_settings FROM users WHERE id = ?', [userId]);
        if ((results as any[]).length === 0) return res.status(404).json({ error: 'User not found' });

        let updates = [];
        let values = [];

        if (privacy_settings !== undefined) {
            let current = {};
            try { current = JSON.parse(results[0].privacy_settings || '{}'); } catch (e) { }
            const updated = { ...current, ...(privacy_settings || {}) };
            updates.push('privacy_settings = ?');
            values.push(JSON.stringify(updated));
        }

        if (password) {
            updates.push('password = ?');
            values.push(await bcrypt.hash(password, 10));
        }

        if (updates.length === 0) return res.status(400).json({ error: 'No updates provided' });

        values.push(userId);
        await db.promise().query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);

        let responseJson = { message: 'Profile updated' };
        if (privacy_settings !== undefined) {
            let current = {};
            try { current = JSON.parse(results[0].privacy_settings || '{}'); } catch (e) { }
            (responseJson as any).privacy_settings = { ...current, ...(privacy_settings || {}) };
        }
        res.json(responseJson);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

const getPublicUsers = (req, res) => {
    // Current user can see anyone who shares library, OR themselves
    const userId = req.user ? req.user.id : 0; // if auth middleware not applied strictly for this endpoint?
    //server.js said `app.get('/api/users/public', authenticateToken` so req.user exists.

    const query = `
        SELECT id, username,
        JSON_UNQUOTE(JSON_EXTRACT(privacy_settings, '$.library_name')) as library_name
        FROM users
        WHERE JSON_EXTRACT(privacy_settings, '$.share_library') = true
        OR id = ?
    `;
    db.query(query, [userId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
};

const getUserBooks = (req, res) => {
    const userId = req.user.id;
    db.query('SELECT * FROM user_books WHERE user_id = ?', [userId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
};

const updateUserBookProgress = (req, res) => {
    const userId = req.user.id;
    const { bookId } = req.params;
    const { status, progress, rating } = req.body;

    const query = `
        INSERT INTO user_books (user_id, book_id, status, progress, rating)
        VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
        status = VALUES(status), progress = VALUES(progress), rating = VALUES(rating)
    `;
    db.query(query, [userId, bookId, status || 'Not Started', progress || 0, rating || 0], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Progress updated' });
    });
};

export default {
    getUsers,
    createUser,
    updateUser,
    deleteUser,
    getProfile,
    updateProfile,
    getPublicUsers,
    getUserBooks,
    updateUserBookProgress
};
