import mysql from 'mysql2';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
import logger from '../utils/logger';

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE || 'bookboss',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

const db = mysql.createPool(dbConfig);

const checkDbConnection = (retries: number = 5, delay: number = 5000) => {
    db.getConnection((err, connection) => {
        if (err) {
            logger.error(`Database connection failed: ${err.message}. Retries left: ${retries}`);
            if (retries > 0) {
                setTimeout(() => checkDbConnection(retries - 1, delay), delay);
            } else {
                logger.error('Fatal: Could not connect to database after multiple attempts. Exiting.');
                process.exit(1);
            }
        } else {
            logger.info('Successfully connected to the database.');
            connection.release();
        }
    });
};

// Start connection check
checkDbConnection();

if (!process.env.MYSQL_PASSWORD) {
    logger.warn('WARNING: MYSQL_PASSWORD environment variable is not set. Database connection may fail.');
}

db.on('connection', () => {
    logger.debug('DB pool connection established');
});

export default db;
