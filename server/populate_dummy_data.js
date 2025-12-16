const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'bookboss'
});

db.connect(err => {
    if (err) {
        console.error('Connection failed:', err);
        process.exit(1);
    }
    console.log('Connected to database.');

    const books = [
        ['The Quantum Paradox', 'A.I. Writer', '978-3-16-148410-0', 'https://placehold.co/400x600?text=Sci-Fi', 'Main Library', JSON.stringify(["Sci-Fi", "Adventure"]), new Date(), null, null],
        ['Whispers of the Forest', 'Elven Bard', '978-1-4028-9462-6', 'https://placehold.co/400x600?text=Fantasy', 'Favorites', JSON.stringify(["Fantasy", "Magic"]), new Date(), null, null],
        ['That One Audiobook', 'Voice Actor', 'AUDIO-123', 'https://placehold.co/400x600?text=Audiobook', 'Main Library', JSON.stringify(["Audiobook"]), new Date(), 'uploads/that_one_audiobook.m4a', 'M4A']
    ];

    const query = 'INSERT INTO books (title, author, isbn, cover_url, `library`, categories, added_at, file_path, format) VALUES ?';

    db.query(query, [books], (err, result) => {
        if (err) console.error(err);
        else console.log('Dummy data inserted:', result.affectedRows);
        db.end();
    });
});
