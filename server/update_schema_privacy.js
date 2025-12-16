/**
 * Database Schema Updater (Privacy Settings)
 * Adds the 'privacy_settings' column to the users table.
 */
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
        console.error('Database connection failed:', err.stack);
        process.exit(1);
    }
    console.log('Connected to database.');

    const query = "ALTER TABLE users ADD COLUMN privacy_settings JSON DEFAULT NULL";

    db.query(query, (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('Column privacy_settings already exists.');
            } else {
                console.error('Error adding column privacy_settings:', err.message);
                process.exit(1);
            }
        } else {
            console.log('Added column: privacy_settings');
        }
        db.end();
    });
});
