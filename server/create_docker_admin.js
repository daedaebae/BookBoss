const mysql = require('mysql2');
const bcrypt = require('bcryptjs');

// Explicit credentials from docker-compose.yml
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'rootpassword', // Matches MYSQL_ROOT_PASSWORD in docker-compose.yml
    database: 'bookboss',
    port: 3307 // Mapped port
});

db.connect(async err => {
    if (err) {
        console.error('Connection failed:', err);
        process.exit(1);
    }
    console.log('Connected to Docker database on port 3307.');

    const username = 'admin';
    const password = 'admin';
    const hashedPassword = await bcrypt.hash(password, 10);

    // Check if exists
    db.query('SELECT * FROM users WHERE username = ?', [username], (err, results) => {
        if (err) {
            console.error('Query error:', err);
            db.end();
            return;
        }

        if (results.length > 0) {
            console.log('User "admin" already exists. Updating password...');
            db.query('UPDATE users SET password = ?, is_admin = 1 WHERE username = ?', [hashedPassword, username], (err) => {
                if (err) console.error(err);
                else console.log('Password updated to "admin".');
                db.end();
            });
        } else {
            console.log('Creating user "admin"...');
            db.query('INSERT INTO users (username, password, is_admin) VALUES (?, ?, 1)', [username, hashedPassword], (err) => {
                if (err) console.error(err);
                else console.log('User created.');
                db.end();
            });
        }
    });
});
