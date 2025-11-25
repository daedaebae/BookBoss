const mysql = require('mysql2');
require('dotenv').config({ path: './server/.env' });

const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'bookboss'
});

db.connect(err => {
    if (err) {
        console.error('Database connection failed:', err);
        process.exit(1);
    }
    console.log('Connected to database.');

    // Add enhanced physical book metadata fields
    const addMetadataFields = `
        ALTER TABLE books 
        ADD COLUMN physical_format VARCHAR(50) DEFAULT NULL COMMENT 'Hardback, Paperback, Mass Market, Board Book, Leather Bound',
        ADD COLUMN book_condition VARCHAR(20) DEFAULT NULL COMMENT 'Excellent, Good, Fair, Poor',
        ADD COLUMN is_signed BOOLEAN DEFAULT FALSE,
        ADD COLUMN has_bonus_chapters BOOLEAN DEFAULT FALSE,
        ADD COLUMN edition_type VARCHAR(50) DEFAULT NULL COMMENT 'Limited Edition, First Edition, etc',
        ADD COLUMN edge_type VARCHAR(50) DEFAULT NULL COMMENT 'Gilded, Fore-edge Painted, Sprayed, Hidden Fore-edge',
        ADD COLUMN binding_details TEXT DEFAULT NULL COMMENT 'Additional binding and decorative details'
    `;

    // Create photos table for book photo gallery
    const createPhotosTable = `
        CREATE TABLE IF NOT EXISTS book_photos (
            id INT AUTO_INCREMENT PRIMARY KEY,
            book_id INT NOT NULL,
            photo_path VARCHAR(255) NOT NULL,
            photo_type VARCHAR(50) DEFAULT NULL COMMENT 'cover, spine, edges, special',
            description TEXT DEFAULT NULL,
            tags JSON DEFAULT NULL,
            uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
            INDEX idx_book_id (book_id)
        )
    `;

    // Run migrations in sequence
    db.query(addMetadataFields, (err) => {
        if (err) {
            console.error('Failed to add metadata fields:', err);
            db.end();
            process.exit(1);
        }
        console.log('✓ Added enhanced metadata fields to books table');

        db.query(createPhotosTable, (err) => {
            if (err) {
                console.error('Failed to create book_photos table:', err);
                db.end();
                process.exit(1);
            }
            console.log('✓ Created book_photos table');
            console.log('\nMigration completed successfully!');
            console.log('\nNew fields added:');
            console.log('  - physical_format (Hardback, Paperback, etc.)');
            console.log('  - book_condition (Excellent, Good, Fair, Poor)');
            console.log('  - is_signed (boolean)');
            console.log('  - has_bonus_chapters (boolean)');
            console.log('  - edition_type (Limited Edition, First Edition, etc.)');
            console.log('  - edge_type (Gilded, Fore-edge Painted, etc.)');
            console.log('  - binding_details (text field for additional details)');
            console.log('\nNew table created:');
            console.log('  - book_photos (for photo gallery feature)');
            db.end();
        });
    });
});
