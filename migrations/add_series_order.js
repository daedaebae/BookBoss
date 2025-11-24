const mysql = require('mysql2');
require('dotenv').config({ path: './server/.env' });

const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'bookboss'
});

db.connect(err => {
    if (err) {
        console.error('Database connection failed:', err);
        process.exit(1);
    }
    console.log('Connected to database.');

    const sql = 'ALTER TABLE books ADD COLUMN series_order INT DEFAULT NULL';

    db.query(sql, (err) => {
        if (err) {
            console.error('Migration failed:', err);
            process.exit(1);
        }
        console.log('Successfully added series_order column to books table.');
        db.end();
    });
});
