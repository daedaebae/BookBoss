const db = require('../config/db');

const getReadingLists = (req, res) => {
    const userId = req.user.id;
    const query = `
        SELECT rl.*, 
               COUNT(rlb.id) as book_count
        FROM reading_lists rl
        LEFT JOIN reading_list_books rlb ON rl.id = rlb.list_id
        WHERE rl.user_id = ?
        GROUP BY rl.id
        ORDER BY rl.updated_at DESC
    `;
    db.query(query, [userId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
};

const createReadingList = (req, res) => {
    const userId = req.user.id;
    const { name, description, is_public } = req.body;

    if (!name) return res.status(400).json({ error: 'List name is required' });

    db.query(
        'INSERT INTO reading_lists (user_id, name, description, is_public) VALUES (?, ?, ?, ?)',
        [userId, name, description || null, is_public || false],
        (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({
                id: result.insertId,
                message: 'Reading list created successfully'
            });
        }
    );
};

const getListBooks = (req, res) => {
    const { listId } = req.params;
    const userId = req.user.id;

    db.query(
        'SELECT * FROM reading_lists WHERE id = ? AND (user_id = ? OR is_public = TRUE)',
        [listId, userId],
        (err, lists) => {
            if (err) return res.status(500).json({ error: err.message });
            if (lists.length === 0) return res.status(404).json({ error: 'Reading list not found' });

            const query = `
                SELECT b.*, rlb.added_at, rlb.notes as list_notes
                FROM books b
                INNER JOIN reading_list_books rlb ON b.id = rlb.book_id
                WHERE rlb.list_id = ?
                ORDER BY rlb.added_at DESC
            `;

            db.query(query, [listId], (err, results) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json(results);
            });
        }
    );
};

const addBookToList = (req, res) => {
    const { listId } = req.params;
    const { book_id, notes } = req.body;
    const userId = req.user.id;

    db.query(
        'SELECT * FROM reading_lists WHERE id = ? AND user_id = ?',
        [listId, userId],
        (err, lists) => {
            if (err) return res.status(500).json({ error: err.message });
            if (lists.length === 0) return res.status(403).json({ error: 'Access denied' });

            db.query(
                'INSERT INTO reading_list_books (list_id, book_id, notes) VALUES (?, ?, ?)',
                [listId, book_id, notes || null],
                (err) => {
                    if (err) {
                        if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'Book already in this list' });
                        return res.status(500).json({ error: err.message });
                    }
                    res.status(201).json({ message: 'Book added to reading list' });
                }
            );
        }
    );
};

const removeBookFromList = (req, res) => {
    const { listId, bookId } = req.params;
    const userId = req.user.id;

    db.query(
        'SELECT * FROM reading_lists WHERE id = ? AND user_id = ?',
        [listId, userId],
        (err, lists) => {
            if (err) return res.status(500).json({ error: err.message });
            if (lists.length === 0) return res.status(403).json({ error: 'Access denied' });

            db.query(
                'DELETE FROM reading_list_books WHERE list_id = ? AND book_id = ?',
                [listId, bookId],
                (err) => {
                    if (err) return res.status(500).json({ error: err.message });
                    res.json({ message: 'Book removed from reading list' });
                }
            );
        }
    );
};

const updateReadingList = (req, res) => {
    const { listId } = req.params;
    const { name, description, is_public } = req.body;
    const userId = req.user.id;

    db.query(
        'UPDATE reading_lists SET name = ?, description = ?, is_public = ? WHERE id = ? AND user_id = ?',
        [name, description, is_public, listId, userId],
        (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            if (result.affectedRows === 0) return res.status(404).json({ error: 'Reading list not found' });
            res.json({ message: 'Reading list updated' });
        }
    );
};

const deleteReadingList = (req, res) => {
    const { listId } = req.params;
    const userId = req.user.id;

    db.query(
        'DELETE FROM reading_lists WHERE id = ? AND user_id = ?',
        [listId, userId],
        (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            if (result.affectedRows === 0) return res.status(404).json({ error: 'Reading list not found' });
            res.json({ message: 'Reading list deleted' });
        }
    );
};

module.exports = {
    getReadingLists,
    createReadingList,
    getListBooks,
    addBookToList,
    removeBookFromList,
    updateReadingList,
    deleteReadingList
};
