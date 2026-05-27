const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const host = process.env.DB_HOST || 'localhost';
const port = host === 'localhost' ? 3307 : 3306;

const db = mysql.createConnection({
    host: host,
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || 'rootpassword',
    database: process.env.MYSQL_DATABASE || 'bookboss',
    port: port
});

db.connect(async err => {
    if (err) {
        console.error('Connection failed:', err);
        process.exit(1);
    }

    const username = 'admin';

    db.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
        if (err) {
            console.error('Query error:', err);
            db.end();
            return;
        }

        if (results.length > 0) {
            console.log('Admin user already exists. Custom password retained.');
            db.end();
        } else {
            // Generate a random 16-character password on first run
            const generatedPassword = crypto.randomBytes(12).toString('base64url');
            const hashedPassword = await bcrypt.hash(generatedPassword, 10);

            db.query('INSERT INTO users (username, password, is_admin) VALUES (?, ?, 1)', [username, hashedPassword], (err) => {
                if (err) {
                    console.error('Failed to create admin user:', err);
                } else {
                    console.log('========================================');
                    console.log('Admin user created.');
                    console.log(`Admin password: ${generatedPassword}`);
                    console.log('Change this password immediately after first login.');
                    console.log('========================================');
                }
                db.end();
            });
        }
    });
});
