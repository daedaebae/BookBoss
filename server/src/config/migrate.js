const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });

const dbConfig = {
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE || 'bookboss',
    port: process.env.DB_PORT || 3306,
    multipleStatements: true
};

async function runMigrations() {
    let connection;
    try {
        console.log('Connecting to database for schema migrations...');
        let retries = 5;
        while (retries > 0) {
            try {
                connection = await mysql.createConnection(dbConfig);
                break;
            } catch (err) {
                console.log(`Connection failed, retrying in 2 seconds... (${retries} retries left)`);
                await new Promise(res => setTimeout(res, 2000));
                retries--;
                if (retries === 0) throw err;
            }
        }
        console.log('Successfully connected to database for migrations.');

        await connection.query(`
            CREATE TABLE IF NOT EXISTS schema_migrations (
                id INT AUTO_INCREMENT PRIMARY KEY,
                migration_name VARCHAR(255) NOT NULL UNIQUE,
                applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        const migrationsDir = path.join(__dirname, '../migrations');
        if (!fs.existsSync(migrationsDir)) {
            console.log('No migrations directory found, creating...');
            fs.mkdirSync(migrationsDir, { recursive: true });
        }

        const files = fs.readdirSync(migrationsDir)
            .filter(f => f.endsWith('.sql') || f.endsWith('.js'))
            .sort();

        const [rows] = await connection.query('SELECT migration_name FROM schema_migrations');
        const applied = new Set(rows.map(r => r.migration_name));

        let appliedCount = 0;
        for (const file of files) {
            if (!applied.has(file)) {
                console.log(`Applying migration: ${file}...`);
                const fullPath = path.join(migrationsDir, file);

                try {
                    await connection.beginTransaction();

                    if (file.endsWith('.sql')) {
                        const sql = fs.readFileSync(fullPath, 'utf8');
                        if (sql.trim()) {
                            await connection.query(sql);
                        }
                    } else if (file.endsWith('.js')) {
                        const migration = require(fullPath);
                        if (migration.up) {
                            await migration.up(connection);
                        } else {
                            console.warn(`Migration ${file} is missing an 'up' function export.`);
                        }
                    }

                    await connection.query('INSERT INTO schema_migrations (migration_name) VALUES (?)', [file]);
                    await connection.commit();
                    console.log(`Successfully applied ${file}`);
                    appliedCount++;
                } catch (migrationError) {
                    await connection.rollback();
                    console.error(`Error applying migration ${file}:`, migrationError.message);
                    throw migrationError;
                }
            }
        }

        if (appliedCount === 0) {
            console.log('Database schema is already up to date.');
        } else {
            console.log(`Successfully applied ${appliedCount} new migration(s).`);
        }

        process.exit(0);
    } catch (err) {
        console.error('Migration framework failed:', err.message);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

runMigrations();
