const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'bookboss',
    multipleStatements: true
});

db.connect(err => {
    if (err) {
        console.error('Database connection failed:', err.stack);
        return;
    }
    console.log('Connected to database.');
    updateSchema();
});

function updateSchema() {
    const queries = [
        // 1. Add new columns to 'books' table
        `ALTER TABLE books
         ADD COLUMN IF NOT EXISTS series VARCHAR(255),
         ADD COLUMN IF NOT EXISTS series_index FLOAT,
         ADD COLUMN IF NOT EXISTS publisher VARCHAR(255),
         ADD COLUMN IF NOT EXISTS language VARCHAR(10),
         ADD COLUMN IF NOT EXISTS description TEXT,
         ADD COLUMN IF NOT EXISTS page_count INT DEFAULT 0,
         ADD COLUMN IF NOT EXISTS published_date VARCHAR(20),
         ADD COLUMN IF NOT EXISTS rating INT DEFAULT 0;`,

        // 2. Create 'shelves' table
        `CREATE TABLE IF NOT EXISTS shelves (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            name VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );`,

        // 3. Create 'shelf_books' table
        `CREATE TABLE IF NOT EXISTS shelf_books (
            shelf_id INT NOT NULL,
            book_id INT NOT NULL,
            added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (shelf_id, book_id),
            FOREIGN KEY (shelf_id) REFERENCES shelves(id) ON DELETE CASCADE,
            FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
        );`,

        // 4. Create 'user_books' (Reading Progress) table
        `CREATE TABLE IF NOT EXISTS user_books (
            user_id INT NOT NULL,
            book_id INT NOT NULL,
            status ENUM('read', 'reading', 'plan_to_read', 'dropped') DEFAULT 'plan_to_read',
            progress INT DEFAULT 0,
            rating INT DEFAULT 0,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (user_id, book_id),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
        );`,

        // 5. Create 'loans' table
        `CREATE TABLE IF NOT EXISTS loans (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            book_id INT NOT NULL,
            borrower_name VARCHAR(255) NOT NULL,
            loan_date DATE DEFAULT (CURRENT_DATE),
            due_date DATE,
            return_date DATE,
            notes TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
        );`,

        // 6. Add 'privacy_settings' to 'users' table
        `ALTER TABLE users
         ADD COLUMN IF NOT EXISTS privacy_settings JSON;`
    ];

    let completed = 0;
    let errors = 0;

    queries.forEach((query, index) => {
        db.query(query, (err, result) => {
            if (err) {
                console.error(`Error executing query ${index + 1}:`, err.message);
                errors++;
            } else {
                console.log(`Query ${index + 1} executed successfully.`);
            }
            completed++;
            if (completed === queries.length) {
                console.log(`Schema update complete. Errors: ${errors}`);
                db.end();
            }
        });
    });
}
