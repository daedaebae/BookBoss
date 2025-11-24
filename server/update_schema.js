/**
 * Database Schema Updater (Book Metadata)
 * Adds columns for enhanced book metadata (cover path, binding, descriptors).
 * Run this script once to update an existing database.
 */
require('dotenv').config();
const mysql = require('mysql2');

const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'bookboss'
});

db.connect(err => {
    if (err) {
        console.error('Database connection failed:', err);
        process.exit(1);
    }
    console.log('Connected to database.');

    // List of schema changes to apply
    const queries = [
        "ALTER TABLE books ADD COLUMN cover_image_path VARCHAR(255);",
        "ALTER TABLE books ADD COLUMN binding_type VARCHAR(50);",
        "ALTER TABLE books ADD COLUMN descriptors JSON;"
    ];

    let completed = 0;
    queries.forEach(query => {
        db.query(query, (err, result) => {
            if (err) {
                // Log error but continue (column might already exist)
                console.error('Error executing query:', query, err);
            } else {
                console.log('Executed:', query);
            }
            completed++;
            if (completed === queries.length) {
                console.log('Schema update complete.');
                db.end();
            }
        });
    });
});
