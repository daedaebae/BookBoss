const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Use environment variables (Docker provides these)
const config = {
    host: process.env.DB_HOST || 'db',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'bookboss'
};

async function resetPassword() {
    let connection;
    try {
        console.log('Connecting to database...');
        connection = await mysql.createConnection(config);

        const username = 'admin'; // Assuming 'admin' is the username to reset
        const newPassword = 'admin';
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Check if user exists
        const [rows] = await connection.execute('SELECT * FROM users WHERE username = ?', [username]);

        if (rows.length === 0) {
            console.log('Admin user not found. Creating one...');
            await connection.execute(
                'INSERT INTO users (username, password, is_admin) VALUES (?, ?, 1)',
                [username, hashedPassword]
            );
            console.log('Admin user created with password "admin".');
        } else {
            console.log('Updating admin password...');
            await connection.execute(
                'UPDATE users SET password = ? WHERE username = ?',
                [hashedPassword, username]
            );
            console.log('Password reset successfully to "admin".');
        }

    } catch (error) {
        console.error('Error resetting password:', error);
    } finally {
        if (connection) await connection.end();
        process.exit();
    }
}

resetPassword();
