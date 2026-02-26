const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function createNotificationsTable() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.MYSQL_USER || 'root',
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE || 'bookboss',
        port: process.env.DB_PORT || 3306,
    });

    try {
        console.log('Creating notifications table...');

        await connection.query(`
            CREATE TABLE IF NOT EXISTS notifications (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                message TEXT NOT NULL,
                type VARCHAR(50) DEFAULT 'info',
                is_global BOOLEAN DEFAULT FALSE,
                target_user_id INT NULL,
                requires_ack BOOLEAN DEFAULT FALSE,
                scheduled_for DATETIME NULL,
                expires_at DATETIME NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_by INT,
                FOREIGN KEY (target_user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
            )
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS notification_acknowledgements (
                id INT AUTO_INCREMENT PRIMARY KEY,
                notification_id INT NOT NULL,
                user_id INT NOT NULL,
                acknowledged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (notification_id) REFERENCES notifications(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE KEY unique_ack (notification_id, user_id)
            )
        `);

        console.log('Successfully created notifications and acknowledgements tables.');
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    } finally {
        await connection.end();
    }
}

createNotificationsTable();
