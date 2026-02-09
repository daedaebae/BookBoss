const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

async function resetAdmin() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.MYSQL_USER || 'bookboss',
        password: process.env.MYSQL_PASSWORD || 'bookboss_secret',
        database: process.env.MYSQL_DATABASE || 'bookboss',
        port: process.env.DB_PORT || 3307
    });

    const hashedPassword = await bcrypt.hash('admin', 10);
    console.log('New Hash:', hashedPassword);

    await connection.execute('UPDATE users SET password = ? WHERE username = ?', [hashedPassword, 'admin']);
    console.log('Admin password reset to "admin"');
    await connection.end();
}

resetAdmin().catch(console.error);
