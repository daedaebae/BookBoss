import db from '../config/db';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

const resetAdminPasswordAfterRestore = async () => {
    try {
        const hash = await bcrypt.hash('admin', 10);
        await db.promise().query(
            'UPDATE users SET password = ? WHERE username = ? AND is_admin = 1',
            [hash, 'admin']
        );
        console.log('Admin password re-set to "admin" post-restore.');
    } catch (err) {
        console.warn('Warning: Could not reset admin password after restore:', err.message);
    }
};

const backupDatabase = async (req, res) => {
    try {
        const tables = ['books', 'users', 'settings', 'audiobookshelf_servers'];
        const backup = {};

        for (const table of tables) {
            const [tableExists] = await db.promise().query(`SHOW TABLES LIKE '${table}'`);
            if ((tableExists as any[]).length > 0) {
                const [rows] = await db.promise().query(`SELECT * FROM ${table}`);
                backup[table] = rows;
            }
        }

        const filename = `bookboss_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
        res.json(backup);
    } catch (error) {
        console.error('Backup failed:', error);
        res.status(500).json({ error: 'Backup failed: ' + error.message });
    }
};

const exportCsv = (req, res) => {
    const userId = req.user.id;
    const query = `
        SELECT b.title, b.author, b.isbn, b.publisher, b.publication_date, 
               b.page_count, b.description, b.status, b.rating, b.notes,
               b.physical_format, b.book_condition, b.is_signed, b.edition_type
        FROM books b
        WHERE b.owner_id = ?
        ORDER BY b.title ASC
    `;

    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Error exporting CSV:', err);
            return res.status(500).json({ error: err.message });
        }

        const headers = [
            'Title', 'Author', 'ISBN', 'Publisher', 'Publication Date',
            'Page Count', 'Description', 'Status', 'Rating', 'Notes',
            'Format', 'Condition', 'Signed', 'Edition'
        ];

        const csvRows = [headers.join(',')];

        (results as any[]).forEach(row => {
            const values = headers.map(header => {
                const key = header.toLowerCase().replace(/ /g, '_');
                const dbKey = {
                    'publication_date': 'publication_date',
                    'page_count': 'page_count',
                    'format': 'physical_format',
                    'condition': 'book_condition',
                    'signed': 'is_signed',
                    'edition': 'edition_type'
                }[key] || key;

                let val = row[dbKey] || '';
                if (val === 1 || val === true) val = 'Yes';
                if (val === 0 || val === false) val = 'No';
                const stringVal = String(val).replace(/"/g, '""');
                return `"${stringVal}"`;
            });
            csvRows.push(values.join(','));
        });

        const csvString = csvRows.join('\n');
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=library_export.csv');
        res.send(csvString);
    });
};

const exportJson = async (req, res) => {
    const userId = req.user.id;
    try {
        const [books] = await db.promise().query('SELECT * FROM books WHERE owner_id = ? ORDER BY title ASC', [userId]);
        const [shelves] = await db.promise().query('SELECT * FROM shelves WHERE user_id = ? ORDER BY name ASC', [userId]);

        const exportData = {
            metadata: {
                exported_at: new Date().toISOString(),
                user_id: userId,
                book_count: (books as any[]).length,
                shelf_count: (shelves as any[]).length
            },
            books: books,
            shelves: shelves
        };

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename=library_export.json');
        res.json(exportData);
    } catch (err) {
        console.error('Error exporting JSON:', err);
        res.status(500).json({ error: err.message });
    }
};

const sqlBackup = (req, res) => {
    const mysqldump = process.env.MYSQLDUMP_PATH || 'mysqldump';
    const dbUser = process.env.MYSQL_USER || 'root';
    const dbPassword = process.env.MYSQL_PASSWORD;
    const dbName = process.env.MYSQL_DATABASE || 'bookboss';
    const dbHost = process.env.DB_HOST || 'localhost';

    const backupDir = path.join(process.cwd(), 'backups'); // Adjust path
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-${timestamp}.sql`;
    const filepath = path.join(backupDir, filename);

    // Escape or spawn properly, but here we can just ensure dbName doesn't contain spaces/quotes if strictly env 
    // In exec, wrap the variables in quotes or use safer mechanisms. The simplest is ensuring no malicious env vars.
    // However, for best security, exec should not just concatenate. Since these are ENV vars, it's low risk unless user sets them via API.
    // We'll wrap in quotes as a basic mitigation against spaces, though child_process.spawn is ideal.
    const cmd = `${mysqldump} -h "${dbHost}" -u "${dbUser}" -p"${dbPassword}" --no-tablespaces "${dbName}" > "${filepath}"`;

    exec(cmd, (error) => {
        if (error) return res.status(500).json({ error: 'Backup failed', details: error.message });
        res.download(filepath, filename);
    });
};

const sqlRestore = async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No backup file provided' });

    const filepath = req.file.path;

    // Check if it's an older JSON backup
    if (req.file.originalname.endsWith('.json') || req.file.mimetype === 'application/json') {
        try {
            const data = JSON.parse(fs.readFileSync(filepath, 'utf8'));

            await db.promise().query('SET FOREIGN_KEY_CHECKS = 0');
            for (const table of Object.keys(data)) {
                if (table === 'metadata') continue; // exportJson has metadata
                if (!/^[a-zA-Z0-9_]+$/.test(table)) throw new Error(`Security Violation: Invalid table name format`);
                const rows = data[table];
                if (!Array.isArray(rows) || rows.length === 0) continue;

                // check if table exists
                const [tableExists] = await db.promise().query(`SHOW TABLES LIKE ?`, [table]);
                if ((tableExists as any[]).length > 0) {
                    await db.promise().query(`TRUNCATE TABLE \`${table}\``);
                    for (const row of rows) {
                        const keys = Object.keys(row);
                        if (!keys.every(k => /^[a-zA-Z0-9_]+$/.test(k))) throw new Error(`Security Violation: Invalid column name`);
                        const values = Object.values(row);
                        const placeholders = keys.map(() => '?').join(',');
                        const query = `INSERT INTO \`${table}\` (${keys.map(k => `\`${k}\``).join(',')}) VALUES (${placeholders})`;
                        await db.promise().query(query, values);
                    }
                }
            }
            await db.promise().query('SET FOREIGN_KEY_CHECKS = 1');
            fs.unlinkSync(filepath);
            await resetAdminPasswordAfterRestore();
            return res.json({ message: 'Database restored successfully from JSON backup' });
        } catch (err) {
            console.error('JSON Restore failed:', err);
            try { await db.promise().query('SET FOREIGN_KEY_CHECKS = 1'); } catch (e) { }
            try { fs.unlinkSync(filepath); } catch (e) { }
            return res.status(500).json({ error: 'JSON Restore failed', details: err.message });
        }
    }

    // Otherwise, assume it's a MySQL dump (.sql)
    const mysql = process.env.MYSQL_PATH || 'mysql';
    const dbUser = process.env.MYSQL_USER || 'root';
    const dbPassword = process.env.MYSQL_PASSWORD;
    const dbName = process.env.MYSQL_DATABASE || 'bookboss';
    const dbHost = process.env.DB_HOST || 'localhost';

    const cmd = `"${mysql}" -h "${dbHost}" -u "${dbUser}" -p"${dbPassword}" "${dbName}" < "${filepath}"`;

    exec(cmd, (error, stdout, stderr) => {
        console.log("sqlRestore output:", stdout);
        if (stderr) console.error("sqlRestore stderr:", stderr);
        if (error) console.error("sqlRestore error:", error);

        try { fs.unlinkSync(filepath); } catch (e) { }
        if (error) return res.status(500).json({ error: 'Restore failed', details: error.message, stderr: stderr });
        resetAdminPasswordAfterRestore().then(() => {
            res.json({ message: 'Database restored successfully' });
        });
    });
};

const generateDummyData = (req, res) => {
    const command = 'node generate_large_dataset.js';
    exec(command, { cwd: process.cwd() }, (error, stdout, stderr) => {
        if (error) return res.status(500).json({ error: 'Generation failed', details: stderr || error.message });
        res.json({ success: true, message: 'Dataset generated successfully.' });
    });
};

const getLibraryStats = async (req, res) => {
    try {
        const [results] = await db.promise().query(`
            SELECT 
                u.id, 
                u.username, 
                COUNT(DISTINCT b.id) as book_count,
                COUNT(DISTINCT s.id) as shelf_count
            FROM users u
            LEFT JOIN books b ON b.owner_id = u.id
            LEFT JOIN shelves s ON s.user_id = u.id
            GROUP BY u.id, u.username
        `);
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: 'Database error' });
    }
};

const wipeLibrary = async (req, res) => {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ error: 'User ID required' });

    try {
        await db.promise().query('DELETE FROM books WHERE owner_id = ?', [userId]);
        await db.promise().query('DELETE FROM shelves WHERE user_id = ?', [userId]);
        await db.promise().query('DELETE FROM user_books WHERE user_id = ?', [userId]);
        res.json({ success: true, message: 'User library wiped.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export default {
    backupDatabase,
    exportCsv,
    exportJson,
    sqlBackup,
    sqlRestore,
    generateDummyData,
    getLibraryStats,
    wipeLibrary
};
