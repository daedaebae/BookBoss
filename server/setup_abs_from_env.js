/**
 * setup_abs_from_env.js
 *
 * Runs at container startup (after migrations).
 * If ABS_SERVER_URL and ABS_API_KEY are set, ensures the admin user has that
 * Audiobookshelf server registered. If a server with the same URL already
 * exists for admin, it updates it; otherwise it inserts a new one.
 * This is a no-op when the env vars are not set.
 */

const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const absUrl = process.env.ABS_SERVER_URL;
const absKey = process.env.ABS_API_KEY;
const absName = process.env.ABS_SERVER_NAME || 'Audiobookshelf';

if (!absUrl || !absKey) {
    console.log('ABS_SERVER_URL / ABS_API_KEY not set — skipping ABS auto-config.');
    process.exit(0);
}

(async () => {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || '127.0.0.1',
            user: process.env.MYSQL_USER,
            password: process.env.MYSQL_PASSWORD,
            database: process.env.MYSQL_DATABASE,
            port: process.env.DB_PORT || 3306,
        });

        // Get the admin user id
        const [admins] = await connection.query(
            'SELECT id FROM users WHERE is_admin = 1 ORDER BY id ASC LIMIT 1'
        );

        if (admins.length === 0) {
            console.log('No admin user found — skipping ABS auto-config.');
            process.exit(0);
        }

        const adminId = admins[0].id;

        // Upsert: update if same URL already exists, otherwise insert
        const [existing] = await connection.query(
            'SELECT id FROM audiobookshelf_servers WHERE user_id = ? AND server_url = ?',
            [adminId, absUrl]
        );

        if (existing.length > 0) {
            await connection.query(
                'UPDATE audiobookshelf_servers SET server_name = ?, api_token = ?, is_active = 1 WHERE id = ?',
                [absName, absKey, existing[0].id]
            );
            console.log(`Updated existing ABS server for admin (id=${existing[0].id}): ${absName} → ${absUrl}`);
        } else {
            await connection.query(
                'INSERT INTO audiobookshelf_servers (user_id, server_name, server_url, api_token, is_active) VALUES (?, ?, ?, ?, 1)',
                [adminId, absName, absUrl, absKey]
            );
            console.log(`Registered new ABS server for admin: ${absName} → ${absUrl}`);
        }

    } catch (err) {
        console.error('ABS auto-config failed:', err.message);
        // Non-fatal — don't exit with error, the app should still start
    } finally {
        if (connection) await connection.end();
    }

    process.exit(0);
})();
