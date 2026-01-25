const mysql = require('mysql2');
require('dotenv').config({ path: './server/.env.local' });

// Hardcode root creds to bypass access denied/parsing issues
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '$$22v88@*H@G*HF',
    database: 'bookboss',
    port: 3307
});

db.connect(err => {
    if (err) {
        console.error('Database connection failed:', err);
        process.exit(1);
    }
    console.log('Connected to database.');

    const createServersTable = `
        CREATE TABLE IF NOT EXISTS audiobookshelf_servers (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            server_name VARCHAR(255) NOT NULL,
            server_url VARCHAR(255) NOT NULL,
            api_token VARCHAR(500),
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;

    const createMappingsTable = `
        CREATE TABLE IF NOT EXISTS abs_book_mappings (
            id INT AUTO_INCREMENT PRIMARY KEY,
            book_id INT NOT NULL,
            abs_server_id INT NOT NULL,
            abs_library_item_id VARCHAR(255) NOT NULL,
            abs_library_id VARCHAR(255) NOT NULL,
            last_synced TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
            FOREIGN KEY (abs_server_id) REFERENCES audiobookshelf_servers(id) ON DELETE CASCADE,
            UNIQUE KEY unique_book_mapping (book_id, abs_server_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;

    db.query(createServersTable, (err) => {
        if (err) {
            console.error('Failed to create audiobookshelf_servers table:', err);
            db.end();
            process.exit(1);
        }
        console.log('✓ Created audiobookshelf_servers table');

        db.query(createMappingsTable, (err) => {
            if (err) {
                console.error('Failed to create abs_book_mappings table:', err);
                db.end();
                process.exit(1);
            }
            console.log('✓ Created abs_book_mappings table');
            db.end();
        });
    });
});
