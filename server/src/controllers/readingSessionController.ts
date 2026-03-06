import db from '../config/db';

const startSession = (req, res) => {
    const userId = req.user.id;
    const { book_id } = req.body;

    db.query(
        'INSERT INTO reading_sessions (user_id, book_id) VALUES (?, ?)',
        [userId, book_id],
        (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({
                session_id: (result as any).insertId,
                message: 'Reading session started'
            });
        }
    );
};

const endSession = (req, res) => {
    const { id } = req.params;
    const { pages_read } = req.body;
    const userId = req.user.id;

    db.query(
        'SELECT started_at FROM reading_sessions WHERE id = ? AND user_id = ?',
        [id, userId],
        (err, results) => {
            if (err || (results as any[]).length === 0) return res.status(404).json({ error: 'Session not found' });

            const startedAt = new Date(results[0].started_at);
            const endedAt = new Date();
            const durationMinutes = Math.round(((endedAt as any) - (startedAt as any)) / 60000);

            db.query(
                'UPDATE reading_sessions SET ended_at = NOW(), duration_minutes = ?, pages_read = ? WHERE id = ? AND user_id = ?',
                [durationMinutes, pages_read || 0, id, userId],
                (err) => {
                    if (err) return res.status(500).json({ error: err.message });
                    res.json({
                        message: 'Reading session ended',
                        duration_minutes: durationMinutes
                    });
                }
            );
        }
    );
};

const getBookSessions = (req, res) => {
    const { bookId } = req.params;
    const userId = req.user.id;

    db.query(
        'SELECT * FROM reading_sessions WHERE book_id = ? AND user_id = ? ORDER BY started_at DESC',
        [bookId, userId],
        (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(results);
        }
    );
};

export default {
    startSession,
    endSession,
    getBookSessions
};
