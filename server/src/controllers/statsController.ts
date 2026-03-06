import db from '../config/db';

const getBookStats = (req, res) => {
    const statsQuery = `
        SELECT 
            COUNT(*) as total_books,
            COUNT(CASE WHEN status = 'Completed' THEN 1 END) as completed_books,
            COUNT(CASE WHEN status = 'In Progress' THEN 1 END) as in_progress_books,
            COUNT(CASE WHEN status = 'Not Started' THEN 1 END) as not_started_books,
            COUNT(CASE WHEN format = 'Ebook' THEN 1 END) as ebooks,
            COUNT(CASE WHEN format = 'Physical' THEN 1 END) as physical_books,
            COUNT(CASE WHEN format = 'Audiobook' THEN 1 END) as audiobooks,
            AVG(rating) as average_rating,
            SUM(page_count) as total_pages
        FROM books
    `;
    db.query(statsQuery, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results[0]);
    });
};

const getReadingByMonth = (req, res) => {
    const { year } = req.query;
    const currentYear = year || new Date().getFullYear();

    const query = `
        SELECT 
            MONTH(added_at) as month,
            COUNT(*) as books_added,
            COUNT(CASE WHEN status = 'Completed' THEN 1 END) as books_completed
        FROM books
        WHERE YEAR(added_at) = ?
        GROUP BY MONTH(added_at)
        ORDER BY month
    `;
    db.query(query, [currentYear], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
};

const getAuthorStats = (req, res) => {
    const query = `
        SELECT 
            author,
            COUNT(*) as book_count,
            AVG(rating) as average_rating,
            COUNT(CASE WHEN status = 'Completed' THEN 1 END) as completed_count
        FROM books
        WHERE author IS NOT NULL AND author != ''
        GROUP BY author
        ORDER BY book_count DESC
        LIMIT 20
    `;
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
};

export default {
    getBookStats,
    getReadingByMonth,
    getAuthorStats
};
