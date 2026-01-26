const mysql = require('mysql2');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'bookboss',
    multipleStatements: true
};

const db = mysql.createConnection(dbConfig);

const createFeatureRequestsTable = `
CREATE TABLE IF NOT EXISTS feature_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status ENUM('open', 'planned', 'in_progress', 'completed', 'rejected') DEFAULT 'open',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

const createFeatureVotesTable = `
CREATE TABLE IF NOT EXISTS feature_votes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    feature_request_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (feature_request_id) REFERENCES feature_requests(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_vote (user_id, feature_request_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

db.connect(err => {
    if (err) {
        console.error('Connection failed:', err);
        process.exit(1);
    }
    console.log('Connected to database.');

    db.query(createFeatureRequestsTable, (err, result) => {
        if (err) {
            console.error('Error creating feature_requests table:', err);
            process.exit(1);
        }
        console.log('feature_requests table verified/created.');

        db.query(createFeatureVotesTable, (err, result) => {
            if (err) {
                console.error('Error creating feature_votes table:', err);
                process.exit(1);
            }
            console.log('feature_votes table verified/created.');

            db.end();
            console.log('Migration complete.');
        });
    });
});
