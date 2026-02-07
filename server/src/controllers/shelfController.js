const db = require('../config/db');

const getShelves = (req, res) => {
    const userId = req.user.id;
    db.query('SELECT * FROM shelves WHERE user_id = ?', [userId], (err, results) => {
        if (err) { console.error(err); return res.status(500).json({ error: err.message }); }
        res.json(results);
    });
};

const createShelf = (req, res) => {
    const userId = req.user.id;
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Shelf name is required' });

    db.query('INSERT INTO shelves (user_id, name) VALUES (?, ?)', [userId, name], (err, result) => {
        if (err) { console.error(err); return res.status(500).json({ error: err.message }); }
        res.status(201).json({ id: result.insertId, name, user_id: userId });
    });
};

const deleteShelf = (req, res) => {
    const userId = req.user.id;
    const shelfId = req.params.id;
    db.query('DELETE FROM shelves WHERE id = ? AND user_id = ?', [shelfId, userId], (err, result) => {
        if (err) { console.error(err); return res.status(500).json({ error: err.message }); }
        res.json({ message: 'Shelf deleted' });
    });
};

const addBookToShelf = (req, res) => {
    const shelfId = req.params.id;
    const { bookId } = req.body;
    // Verify shelf belongs to user
    db.query('SELECT id FROM shelves WHERE id = ? AND user_id = ?', [shelfId, req.user.id], (err, results) => {
        if (err || results.length === 0) return res.status(403).json({ error: 'Shelf not found or access denied' });

        db.query('INSERT IGNORE INTO shelf_books (shelf_id, book_id) VALUES (?, ?)', [shelfId, bookId], (err, result) => {
            if (err) { console.error(err); return res.status(500).json({ error: err.message }); }
            res.json({ message: 'Book added to shelf' });
        });
    });
};

const removeBookFromShelf = (req, res) => {
    const shelfId = req.params.id;
    const bookId = req.params.bookId;
    // Verify shelf belongs to user
    db.query('SELECT id FROM shelves WHERE id = ? AND user_id = ?', [shelfId, req.user.id], (err, results) => {
        if (err || results.length === 0) return res.status(403).json({ error: 'Shelf not found or access denied' });

        db.query('DELETE FROM shelf_books WHERE shelf_id = ? AND book_id = ?', [shelfId, bookId], (err, result) => {
            if (err) { console.error(err); return res.status(500).json({ error: err.message }); }
            res.json({ message: 'Book removed from shelf' });
        });
    });
};

module.exports = {
    getShelves,
    createShelf,
    deleteShelf,
    addBookToShelf,
    removeBookFromShelf
};
