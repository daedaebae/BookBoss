const mysql = require('mysql2');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'bookboss'
};

const db = mysql.createConnection(dbConfig);

db.connect(async err => {
    if (err) {
        console.error('Connection failed:', err);
        process.exit(1);
    }
    console.log('Connected to DB');

    try {
        // 1. List Tables
        console.log('\n--- Tables ---');
        const [tables] = await db.promise().query('SHOW TABLES');
        console.log(tables.map(t => Object.values(t)[0]));

        // 2. Check Shelves Table
        console.log('\n--- Shelves Table Definition ---');
        try {
            const [shelvesDef] = await db.promise().query('DESCRIBE shelves');
            console.log(shelvesDef.map(c => c.Field));
        } catch (e) {
            console.log('Error describing shelves:', e.message);
        }

        // 3. Run failing libraries query
        console.log('\n--- Admin Libraries Query ---');
        try {
            const [results] = await db.promise().query(`
                SELECT 
                    u.id, 
                    u.username, 
                    COUNT(b.id) as book_count,
                    COUNT(s.id) as shelf_count
                FROM users u
                LEFT JOIN books b ON b.owner_id = u.id
                LEFT JOIN shelves s ON s.user_id = u.id
                GROUP BY u.id
            `);
            console.log('Query successful. Rows:', results.length);
            console.log(results);
        } catch (e) {
            console.error('Query failed:', e.message);
        }

        // 4. Run profile query (assuming user ID 1 exists)
        console.log('\n--- Profile Query (User 1) ---');
        try {
            const [users] = await db.promise().query('SELECT id, username, is_admin, privacy_settings FROM users WHERE id = ?', [1]);
            if (users.length > 0) {
                console.log('User found:', users[0]);
                try {
                    const settings = typeof users[0].privacy_settings === 'string'
                        ? JSON.parse(users[0].privacy_settings || '{}')
                        : users[0].privacy_settings;
                    console.log('Parsed settings:', settings);
                } catch (parseErr) {
                    console.error('JSON Parse Error:', parseErr.message);
                }
            } else {
                console.log('User 1 not found');
            }
        } catch (e) {
            console.error('Profile query failed:', e.message);
        }

    } catch (unexpected) {
        console.error('Unexpected error:', unexpected);
    } finally {
        db.end();
    }
});
