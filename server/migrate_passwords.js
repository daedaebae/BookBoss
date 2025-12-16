const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'bookboss'
};

async function migratePasswords() {
    if (!dbConfig.password) {
        console.error('Error: DB_PASSWORD environment variable is not set.');
        process.exit(1);
    }

    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected to database.');

        const [users] = await connection.execute('SELECT id, password FROM users');
        console.log(`Found ${users.length} users to check/migrate.`);

        for (const user of users) {
            // Check if password is already hashed (bcrypt hashes start with $2a$, $2b$, or $2y$ and are 60 chars long)
            if (user.password && user.password.length === 60 && user.password.startsWith('$2')) {
                console.log(`User ${user.id} already has hashed password. Skipping.`);
                continue;
            }

            console.log(`Hashing password for user ${user.id}...`);
            const hashedPassword = await bcrypt.hash(user.password, 10);
            await connection.execute('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, user.id]);
        }

        console.log('Password migration complete.');

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        if (connection) await connection.end();
    }
}

migratePasswords();
