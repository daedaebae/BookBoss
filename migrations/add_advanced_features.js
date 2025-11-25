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

    // Add reading_sessions table for tracking reading time
    const createReadingSessionsTable = `
        CREATE TABLE IF NOT EXISTS reading_sessions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            book_id INT NOT NULL,
            started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            ended_at TIMESTAMP NULL,
            duration_minutes INT DEFAULT 0,
            pages_read INT DEFAULT 0,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
            INDEX idx_user_book (user_id, book_id),
            INDEX idx_started_at (started_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;

    // Add saved_searches table for storing user search queries
    const createSavedSearchesTable = `
        CREATE TABLE IF NOT EXISTS saved_searches (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            name VARCHAR(100) NOT NULL,
            query_params JSON NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            INDEX idx_user_id (user_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;

    // Add fulltext indexes for advanced search (only on existing columns)
    const addFulltextIndexes = `
        ALTER TABLE books 
        ADD FULLTEXT INDEX ft_search (title, author)
    `;

    // Execute migrations
    db.query(createReadingSessionsTable, (err) => {
        if (err) {
            console.error('Failed to create reading_sessions table:', err);
            db.end();
            process.exit(1);
        }
        console.log('✓ Created reading_sessions table');

        db.query(createSavedSearchesTable, (err) => {
            if (err) {
                console.error('Failed to create saved_searches table:', err);
                db.end();
                process.exit(1);
            }
            console.log('✓ Created saved_searches table');

            db.query(addFulltextIndexes, (err) => {
                if (err && !err.message.includes('Duplicate key name')) {
                    console.error('Failed to add fulltext indexes:', err);
                    db.end();
                    process.exit(1);
                }
                console.log('✓ Added fulltext search indexes');

                console.log('\nMigration completed successfully!');
                console.log('\nNew tables created:');
                console.log('  - reading_sessions (track reading time and progress)');
                console.log('  - saved_searches (save search queries)');
                console.log('\nIndexes added:');
                console.log('  - Fulltext search on title, author, description, publisher');
                db.end();
            });
        });
    });
});
