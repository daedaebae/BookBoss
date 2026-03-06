import db from '../config/db';

const getLoans = (req, res) => {
    const userId = req.user.id;
    db.query('SELECT loans.*, books.title as book_title FROM loans JOIN books ON loans.book_id = books.id WHERE user_id = ?', [userId], (err, results) => {
        if (err) { console.error(err); return res.status(500).json({ error: err.message }); }
        res.json(results);
    });
};

const createLoan = (req, res) => {
    const userId = req.user.id;
    const { book_id, borrower_name, due_date, notes } = req.body;
    db.query('INSERT INTO loans (user_id, book_id, borrower_name, due_date, notes) VALUES (?, ?, ?, ?, ?)',
        [userId, book_id, borrower_name, due_date, notes], (err, result) => {
            if (err) { console.error(err); return res.status(500).json({ error: err.message }); }
            // Update book is_loaned status as well for legacy compatibility
            db.query('UPDATE books SET is_loaned = 1, borrower_name = ?, loan_date = CURRENT_DATE, due_date = ? WHERE id = ?',
                [borrower_name, due_date, book_id]);
            res.status(201).json({ message: 'Loan created' });
        });
};

const returnLoan = (req, res) => {
    const userId = req.user.id;
    const loanId = req.params.id;
    db.query('UPDATE loans SET return_date = CURRENT_DATE WHERE id = ? AND user_id = ?', [loanId, userId], (err, result) => {
        if (err) { console.error(err); return res.status(500).json({ error: err.message }); }
        // Also update book
        db.query('SELECT book_id FROM loans WHERE id = ?', [loanId], (err, resBook) => {
            if (resBook && (resBook as any[]).length > 0) {
                db.query('UPDATE books SET is_loaned = 0, borrower_name = NULL, loan_date = NULL, due_date = NULL WHERE id = ?', [resBook[0].book_id]);
            }
        });
        res.json({ message: 'Book returned' });
    });
};

export default {
    getLoans,
    createLoan,
    returnLoan
};
