const mysql = require('mysql2');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE || 'bookboss',
    port: process.env.DB_PORT || 3307 // Default to 3307 as per docker-compose
});

db.connect(err => {
    if (err) {
        console.error('Database connection failed:', err.stack);
        return;
    }
    console.log('Connected to database.');

    const columnsToAdd = [
        "ADD COLUMN description TEXT DEFAULT NULL",
        "ADD COLUMN series_order FLOAT DEFAULT NULL",
        "ADD COLUMN publication_date DATE DEFAULT NULL",
        "ADD COLUMN publisher VARCHAR(255) DEFAULT NULL",
        "ADD COLUMN language VARCHAR(50) DEFAULT 'en'",
        "ADD COLUMN duration INT DEFAULT NULL COMMENT 'Duration in seconds'",
        "ADD COLUMN page_count INT DEFAULT NULL",
        "ADD COLUMN rating FLOAT DEFAULT 0"
    ];

    let completed = 0;

    columnsToAdd.forEach(col => {
        const query = `ALTER TABLE books ${col}`;
        db.query(query, (err, result) => {
            if (err) {
                if (err.code === 'ER_DUP_FIELDNAME') {
                    console.log(`Column already exists: ${col.split(' ')[2]}`);
                } else {
                    console.error(`Error adding column: ${col}`, err.message);
                }
            } else {
                console.log(`Added column: ${col.split(' ')[2]}`);
            }
            completed++;
            if (completed === columnsToAdd.length) {
                console.log('Schema update complete.');
                db.end();
            }
        });
    });
});
