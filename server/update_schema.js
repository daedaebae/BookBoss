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
        console.error('Database connection failed:', err.stack);
        return;
    }
    console.log('Connected to database.');

    const columnsToAdd = [
        "ADD COLUMN series VARCHAR(255) DEFAULT NULL",
        "ADD COLUMN shelf VARCHAR(255) DEFAULT NULL",
        "ADD COLUMN status VARCHAR(50) DEFAULT 'Not Started'"
    ];

    let completed = 0;

    columnsToAdd.forEach(col => {
        const query = `ALTER TABLE books ${col}`;
        db.query(query, (err, result) => {
            if (err) {
                if (err.code === 'ER_DUP_FIELDNAME') {
                    console.log(`Column already exists: ${col}`);
                } else {
                    console.error(`Error adding column: ${col}`, err.message);
                }
            } else {
                console.log(`Added column: ${col}`);
            }
            completed++;
            if (completed === columnsToAdd.length) {
                console.log('Schema update complete.');
                db.end();
            }
        });
    });
});
