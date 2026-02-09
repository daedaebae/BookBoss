const db = require('../config/db');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const backupDatabase = async (req, res) => {
    try {
        const tables = ['books', 'users', 'settings', 'audiobookshelf_servers'];
        const backup = {};

        for (const table of tables) {
            const [tableExists] = await db.promise().query(`SHOW TABLES LIKE '${table}'`);
            if (tableExists.length > 0) {
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
    const query = `
        SELECT b.title, b.author, b.isbn, b.publisher, b.publication_date, 
               b.page_count, b.description, b.status, b.rating, b.notes,
               b.physical_format, b.book_condition, b.is_signed, b.edition_type
        FROM books b
        ORDER BY b.title ASC
    `;

    db.query(query, (err, results) => {
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

        results.forEach(row => {
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

const exportJson = (req, res) => {
    const query = 'SELECT * FROM books ORDER BY title ASC';
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename=library_export.json');
        res.json(results);
    });
};

const sqlBackup = (req, res) => {
    const mysqldump = process.env.MYSQLDUMP_PATH || 'mysqldump';
    const dbUser = process.env.MYSQL_USER || 'root';
    const dbPassword = process.env.MYSQL_PASSWORD;
    const dbName = process.env.MYSQL_DATABASE || 'bookboss';
    const dbHost = process.env.DB_HOST || 'localhost';

    const backupDir = path.join(__dirname, '../../backups'); // Adjust path
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-${timestamp}.sql`;
    const filepath = path.join(backupDir, filename);

    const cmd = `${mysqldump} -h ${dbHost} -u ${dbUser} -p${dbPassword} --no-tablespaces ${dbName} > "${filepath}"`;

    exec(cmd, (error) => {
        if (error) return res.status(500).json({ error: 'Backup failed', details: error.message });
        res.download(filepath, filename);
    });
};

const sqlRestore = (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No backup file provided' });

    const mysql = process.env.MYSQL_PATH || 'mysql';
    const dbUser = process.env.MYSQL_USER || 'root';
    const dbPassword = process.env.MYSQL_PASSWORD;
    const dbName = process.env.MYSQL_DATABASE || 'bookboss';
    const dbHost = process.env.DB_HOST || 'localhost';

    const filepath = req.file.path;
    const cmd = `${mysql} -h ${dbHost} -u ${dbUser} -p${dbPassword} ${dbName} < "${filepath}"`;

    exec(cmd, (error) => {
        fs.unlinkSync(filepath);
        if (error) return res.status(500).json({ error: 'Restore failed', details: error.message });
        res.json({ message: 'Database restored successfully' });
    });
};

const generateDummyData = (req, res) => {
    const command = 'node generate_large_dataset.js';
    exec(command, { cwd: path.join(__dirname, '../../') }, (error, stdout, stderr) => {
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

module.exports = {
    backupDatabase,
    exportCsv,
    exportJson,
    sqlBackup,
    sqlRestore,
    generateDummyData,
    getLibraryStats,
    wipeLibrary
};
