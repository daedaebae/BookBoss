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

    // Create shelves table
    const createShelvesTable = `
        CREATE TABLE IF NOT EXISTS shelves (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL UNIQUE,
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    `;

    // Create shelf_books junction table
    const createShelfBooksTable = `
        CREATE TABLE IF NOT EXISTS shelf_books (
            shelf_id INT NOT NULL,
            book_id INT NOT NULL,
            added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (shelf_id, book_id),
            FOREIGN KEY (shelf_id) REFERENCES shelves(id) ON DELETE CASCADE,
            FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
        )
    `;

    // Run migrations in sequence
    db.query(createShelvesTable, (err) => {
        if (err) {
            console.error('Failed to create shelves table:', err);
            db.end();
            process.exit(1);
        }
        console.log('✓ Created shelves table');

        db.query(createShelfBooksTable, (err) => {
            if (err) {
                console.error('Failed to create shelf_books table:', err);
                db.end();
                process.exit(1);
            }
            console.log('✓ Created shelf_books table');
            console.log('\nMigration completed successfully!');
            db.end();
        });
    });
});
