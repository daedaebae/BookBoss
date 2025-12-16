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

    const queries = [
        `CREATE TABLE IF NOT EXISTS user_books (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            book_id INT NOT NULL,
            reading_status VARCHAR(50) DEFAULT 'To Read',
            current_page INT DEFAULT 0,
            rating INT DEFAULT 0,
            review TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
            UNIQUE(user_id, book_id)
        )`,
        `CREATE TABLE IF NOT EXISTS shelves (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            name VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )`,
        `CREATE TABLE IF NOT EXISTS shelf_books (
            id INT AUTO_INCREMENT PRIMARY KEY,
            shelf_id INT NOT NULL,
            book_id INT NOT NULL,
            user_id INT NOT NULL,
            added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (shelf_id) REFERENCES shelves(id) ON DELETE CASCADE,
            FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            UNIQUE(shelf_id, book_id)
        )`
    ];

    const runQueries = async () => {
        for (const query of queries) {
            await new Promise((resolve, reject) => {
                db.query(query, (err) => {
                    if (err) return reject(err);
                    console.log('Query successful:', query.substring(0, 50) + '...');
                    resolve();
                });
            });
        }
        console.log('Shelf schema update complete.');
        db.end();
    };

    runQueries().catch(err => {
        console.error(err);
        db.end();
    });
});
