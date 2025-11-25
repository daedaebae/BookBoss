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

    // Add notes field for book reviews
    const addNotesField = `
        ALTER TABLE books 
        ADD COLUMN notes TEXT DEFAULT NULL COMMENT 'User notes and reviews for the book'
    `;

    db.query(addNotesField, (err) => {
        if (err) {
            console.error('Failed to add notes field:', err);
            db.end();
            process.exit(1);
        }
        console.log('✓ Added notes field to books table');
        console.log('\nMigration completed successfully!');
        console.log('\nNew field added:');
        console.log('  - notes (TEXT) - For user reviews and notes');
        db.end();
    });
});
