const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD ?? 'password',
    database: process.env.DB_NAME || 'bookboss'
});

db.connect(err => {
    if (err) {
        console.error('Connection failed:', err);
        process.exit(1);
    }
    const query = 'SELECT id, username, password, is_admin FROM users';
    db.query(query, (err, results) => {
        if (err) console.error(err);
        else console.log('Users:', results);
        db.end();
    });
});
