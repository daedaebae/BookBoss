const mysql = require('mysql2');
require('dotenv').config({ path: './server/.env.local' });

// Hardcoded creds (root) to ensure we can alter tables
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

    const queries = [
        // 1. Add owner_id column
        `ALTER TABLE books ADD COLUMN owner_id INT`,

        // 2. Assign all existing books to User ID 1 (assumed Admin/First User)
        `UPDATE books SET owner_id = 1 WHERE owner_id IS NULL`,

        // 3. Make owner_id NOT NULL and add Foreign Key
        `ALTER TABLE books MODIFY COLUMN owner_id INT NOT NULL`,
        `ALTER TABLE books ADD CONSTRAINT fk_book_owner FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE`
    ];

    runQueries(queries);
});

function runQueries(queries) {
    if (queries.length === 0) {
        console.log('Migration completed successfully!');
        db.end();
        return;
    }

    const currentQuery = queries.shift();
    console.log(`Running: ${currentQuery}`);

    db.query(currentQuery, (err) => {
        if (err) {
            // If duplicate column error, just skip
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('Column already exists, skipping.');
            } else if (err.code === 'ER_FK_DUP_NAME') { // Duplicate foreign key
                console.log('Foreign key already exists, skipping.');
            } else {
                console.error('Migration failed:', err);
                db.end();
                process.exit(1);
                return;
            }
        }
        runQueries(queries);
    });
}
