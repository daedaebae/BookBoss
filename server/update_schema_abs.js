/**
 * Database Schema Updater (Audiobookshelf)
 * Creates tables for Audiobookshelf servers, book mappings, and progress tracking.
 * Run this script to initialize ABS integration features.
 */
const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'bookboss',
    multipleStatements: true
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to database:', err);
        process.exit(1);
    }
    console.log('Connected to database.');
    updateSchema();
});

/**
 * Defines and executes the table creation queries
 */
function updateSchema() {
    const queries = [
        // Table for storing ABS server connection details
        `CREATE TABLE IF NOT EXISTS audiobookshelf_servers (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            server_name VARCHAR(255) NOT NULL,
            server_url VARCHAR(500) NOT NULL,
            api_token TEXT,
            is_active BOOLEAN DEFAULT true,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )`,
        // Table for mapping local books to ABS library items
        `CREATE TABLE IF NOT EXISTS abs_book_mappings (
            id INT AUTO_INCREMENT PRIMARY KEY,
            book_id INT NOT NULL,
            abs_server_id INT NOT NULL,
            abs_library_item_id VARCHAR(255) NOT NULL,
            abs_library_id VARCHAR(255),
            last_synced DATETIME,
            FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
            FOREIGN KEY (abs_server_id) REFERENCES audiobookshelf_servers(id) ON DELETE CASCADE,
            UNIQUE KEY unique_mapping (book_id, abs_server_id)
        )`,
        // Table for tracking listening progress
        `CREATE TABLE IF NOT EXISTS abs_listening_progress (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            book_id INT NOT NULL,
            abs_server_id INT NOT NULL,
            \`current_time\` DECIMAL(10,2),
            \`duration\` DECIMAL(10,2),
            \`progress\` DECIMAL(5,4),
            is_finished BOOLEAN DEFAULT false,
            last_update DATETIME,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
            FOREIGN KEY (abs_server_id) REFERENCES audiobookshelf_servers(id) ON DELETE CASCADE
        )`
    ];

    runQueries(queries);
}

/**
 * Recursively executes a list of SQL queries
 * @param {string[]} queries - Array of SQL query strings
 */
function runQueries(queries) {
    if (queries.length === 0) {
        console.log('All schema updates completed.');
        db.end();
        return;
    }

    const query = queries.shift();
    console.log('Running query:', query.split('\n')[0] + '...');

    db.query(query, (err, result) => {
        if (err) {
            console.error('Error running query:', err);
        } else {
            console.log('Query successful.');
        }
        runQueries(queries);
    });
}
