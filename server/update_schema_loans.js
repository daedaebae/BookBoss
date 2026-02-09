const mysql = require('mysql2');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE || 'bookboss'
});

db.connect(err => {
    if (err) {
        console.error('Database connection failed:', err.stack);
        return;
    }
    console.log('Connected to database.');

    const columnsToAdd = [
        "ADD COLUMN is_loaned BOOLEAN DEFAULT FALSE",
        "ADD COLUMN borrower_name VARCHAR(255) DEFAULT NULL",
        "ADD COLUMN loan_date DATE DEFAULT NULL",
        "ADD COLUMN due_date DATE DEFAULT NULL"
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
                console.log('Loan tracking schema update complete.');
                db.end();
            }
        });
    });
});
