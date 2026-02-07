const mysql = require('mysql2');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'bookboss',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

const db = mysql.createPool(dbConfig);

const checkDbConnection = (retries = 5, delay = 5000) => {
    db.getConnection((err, connection) => {
        if (err) {
            console.error(`Database connection failed: ${err.message}. Retries left: ${retries}`);
            if (retries > 0) {
                setTimeout(() => checkDbConnection(retries - 1, delay), delay);
            } else {
                console.error('Fatal: Could not connect to database after multiple attempts. Exiting.');
                process.exit(1);
            }
        } else {
            console.log('Successfully connected to the database.');

            // initializeTables(connection); // We can move initialization logic here or keep it separate
            connection.release();
        }
    });
};

// Start connection check
checkDbConnection();

if (!process.env.DB_PASSWORD) {
    console.warn('WARNING: DB_PASSWORD environment variable is not set. Database connection may fail.');
}

db.on('connection', (connection) => {
    // console.log('DB Connection established');
});

module.exports = db;
