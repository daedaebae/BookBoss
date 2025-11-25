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

    // Create reading_lists table
    const createReadingListsTable = `
        CREATE TABLE IF NOT EXISTS reading_lists (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            name VARCHAR(100) NOT NULL,
            description TEXT,
            is_public BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            INDEX idx_user_id (user_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;

    // Create reading_list_books junction table
    const createReadingListBooksTable = `
        CREATE TABLE IF NOT EXISTS reading_list_books (
            id INT AUTO_INCREMENT PRIMARY KEY,
            list_id INT NOT NULL,
            book_id INT NOT NULL,
            added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            notes TEXT,
            FOREIGN KEY (list_id) REFERENCES reading_lists(id) ON DELETE CASCADE,
            FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
            UNIQUE KEY unique_list_book (list_id, book_id),
            INDEX idx_list_id (list_id),
            INDEX idx_book_id (book_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;

    // Add role column to users table for permissions
    const addRoleColumn = `
        ALTER TABLE users 
        ADD COLUMN role VARCHAR(20) DEFAULT 'viewer' 
        COMMENT 'User role: admin, editor, viewer'
    `;

    // Add permissions column to users table
    const addPermissionsColumn = `
        ALTER TABLE users 
        ADD COLUMN permissions JSON 
        COMMENT 'Custom permissions for the user'
    `;

    // Execute migrations
    db.query(createReadingListsTable, (err) => {
        if (err) {
            console.error('Failed to create reading_lists table:', err);
            db.end();
            process.exit(1);
        }
        console.log('✓ Created reading_lists table');

        db.query(createReadingListBooksTable, (err) => {
            if (err) {
                console.error('Failed to create reading_list_books table:', err);
                db.end();
                process.exit(1);
            }
            console.log('✓ Created reading_list_books table');

            db.query(addRoleColumn, (err) => {
                if (err && !err.message.includes('Duplicate column')) {
                    console.error('Failed to add role column:', err);
                    db.end();
                    process.exit(1);
                }
                console.log('✓ Added role column to users table');

                db.query(addPermissionsColumn, (err) => {
                    if (err && !err.message.includes('Duplicate column')) {
                        console.error('Failed to add permissions column:', err);
                        db.end();
                        process.exit(1);
                    }
                    console.log('✓ Added permissions column to users table');

                    console.log('\nMigration completed successfully!');
                    console.log('\nNew tables created:');
                    console.log('  - reading_lists (user reading lists)');
                    console.log('  - reading_list_books (books in reading lists)');
                    console.log('\nNew columns added:');
                    console.log('  - users.role (admin, editor, viewer)');
                    console.log('  - users.permissions (custom JSON permissions)');
                    db.end();
                });
            });
        });
    });
});
