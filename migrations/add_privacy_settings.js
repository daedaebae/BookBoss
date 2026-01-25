const mysql = require('mysql2');
require('dotenv').config(); // Load from root .env by default

const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || process.env.MYSQL_USER || 'root',
    password: process.env.DB_PASSWORD || process.env.MYSQL_PASSWORD || process.env.MYSQL_ROOT_PASSWORD,
    database: process.env.DB_NAME || process.env.MYSQL_DATABASE || 'bookboss',
    port: 3307 // Docker mapped port
});

db.connect(err => {
    if (err) {
        console.error('Database connection failed:', err);
        process.exit(1);
    }
    console.log('Connected to database.');

    const sql = `
        ALTER TABLE users 
        ADD COLUMN privacy_settings JSON COMMENT 'User privacy preferences';
    `;

    db.query(sql, (err) => {
        if (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('Column privacy_settings already exists. Skipping.');
            } else {
                console.error('Migration failed:', err);
                process.exit(1);
            }
        } else {
            console.log('Successfully added privacy_settings column to users table.');
        }
        db.end();
    });
});
