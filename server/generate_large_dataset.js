const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Use environment variables or fallback to Docker defaults
const config = {
    host: process.env.DB_HOST || 'db',
    user: process.env.DB_USER || 'bookboss', // Fallback to likely default
    password: process.env.DB_PASSWORD || 'bookboss_secret', // Fallback to likely default
    database: process.env.DB_NAME || 'bookboss'
};

const USERS_TO_CREATE = 5;



// Enriched Real Books Dataset
const REAL_BOOKS = [
    // Harry Potter Series
    {
        title: "Harry Potter and the Sorcerer's Stone",
        author: "J.K. Rowling",
        isbn: "9780590353427",
        series: "Harry Potter",
        series_index: 1,
        description: "Harry Potter has never even heard of Hogwarts when the letters start dropping on the doormat at number four, Privet Drive.",
        publication_date: "1997-06-26",
        publisher: "Scholastic",
        page_count: 309,
        categories: "Fantasy, Young Adult",
        language: "en"
    },
    {
        title: "Harry Potter and the Chamber of Secrets",
        author: "J.K. Rowling",
        isbn: "9780439064873",
        series: "Harry Potter",
        series_index: 2,
        description: "Verify your warnings, Harry Potter! A house-elf waits for the Boy Who Lived.",
        publication_date: "1998-07-02",
        publisher: "Scholastic",
        page_count: 341,
        categories: "Fantasy, Young Adult",
        language: "en"
    },
    {
        title: "Harry Potter and the Prisoner of Azkaban",
        author: "J.K. Rowling",
        isbn: "9780439136358",
        series: "Harry Potter",
        series_index: 3,
        description: "For twelve long years, the dread fortress of Azkaban held an infamous prisoner named Sirius Black.",
        publication_date: "1999-07-08",
        publisher: "Scholastic",
        page_count: 435,
        categories: "Fantasy, Young Adult",
        language: "en"
    },
    // Lord of the Rings
    {
        title: "The Hobbit",
        author: "J.R.R. Tolkien",
        isbn: "9780547928227",
        description: "In a hole in the ground there lived a hobbit.",
        publication_date: "1937-09-21",
        publisher: "Houghton Mifflin",
        page_count: 310,
        categories: "Fantasy, Classics",
        language: "en"
    },
    {
        title: "The Fellowship of the Ring",
        author: "J.R.R. Tolkien",
        isbn: "9780547928210",
        series: "The Lord of the Rings",
        series_index: 1,
        description: "The first volume in J.R.R. Tolkien's epic adventure The Lord of the Rings.",
        publication_date: "1954-07-29",
        publisher: "Houghton Mifflin",
        page_count: 423,
        categories: "Fantasy, Classics",
        language: "en"
    },
    // Sci-Fi
    {
        title: "Dune",
        author: "Frank Herbert",
        isbn: "9780441172719",
        series: "Dune",
        series_index: 1,
        description: "Set on the desert planet Arrakis, Dune is the story of the boy Paul Atreides.",
        publication_date: "1965-08-01",
        publisher: "Ace",
        page_count: 412,
        categories: "Science Fiction",
        language: "en"
    },
    {
        title: "Project Hail Mary",
        author: "Andy Weir",
        isbn: "9780593135204",
        description: "Ryland Grace is the sole survivor on a desperate, last-chance mission—and if he fails, humanity and the earth itself will perish.",
        publication_date: "2021-05-04",
        publisher: "Ballantine Books",
        page_count: 496,
        categories: "Science Fiction, Thriller",
        language: "en"
    },
    {
        title: "The Martian",
        author: "Andy Weir",
        isbn: "9780804139021",
        description: "Six days ago, astronaut Mark Watney became one of the first people to walk on Mars. Now, he's sure he'll be the first person to die there.",
        publication_date: "2014-02-11",
        publisher: "Crown",
        page_count: 369,
        categories: "Science Fiction",
        language: "en"
    },
    // Non-Fiction / Modern
    {
        title: "Atomic Habits",
        author: "James Clear",
        isbn: "9780735211292",
        description: "No matter your goals, Atomic Habits offers a proven framework for improving--every day.",
        publication_date: "2018-10-16",
        publisher: "Avery",
        page_count: 320,
        categories: "Self-Help, Business",
        language: "en"
    },
    {
        title: "Steve Jobs",
        author: "Walter Isaacson",
        isbn: "9781451648539",
        description: "Based on more than forty interviews with Jobs conducted over two years.",
        publication_date: "2011-10-24",
        publisher: "Simon & Schuster",
        page_count: 656,
        categories: "Biography, Technology",
        language: "en"
    }
];


async function run() {
    let connection;
    try {
        console.log('Connecting to database...');
        // Try to connect, utilizing process envs but falling back if undefined/empty inside container execution
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'db',
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME || 'bookboss'
        });

        console.log('Connected.');

        // 0. FIX SCHEMA (Shelves Unique Constraint)
        try {
            console.log('Checking/Fixing shelves schema...');
            // Check if index 'name' exists (which enforces global uniqueness)
            // Note: This is a hacky check, usually we'd query information_schema, but try/catch drop is easier.
            try {
                // Try to add the correct unique constraint. If it fails, maybe it exists.
                // But first, try to drop the bad one if it exists.
                // Assuming the bad key is named 'name' or 'name_UNIQUE' or similar. 
                // Let's query stats.
                const [indexes] = await connection.query("SHOW INDEX FROM shelves WHERE Key_name = 'name'");
                if (indexes.length > 0) {
                    console.log("Dropping incorrect unique constraint on 'name'...");
                    await connection.query("DROP INDEX name ON shelves");
                }
            } catch (ignored) {
                // Ignore if index doesn't exist or we can't drop it (maybe it's not there)
            }

            // Ensure we have the correct composite unique index
            try {
                await connection.query("ALTER TABLE shelves ADD UNIQUE KEY user_shelf_unique (user_id, name)");
                console.log("Added correct unique constraint (user_id, name).");
            } catch (err) {
                if (err.code !== 'ER_DUP_KEYNAME') console.log("Note on adding index: " + err.message);
            }

        } catch (schemaErr) {
            console.warn("Schema fix warning:", schemaErr.message);
        }

        // 0.5 FIX USERS SCHEMA
        try {
            console.log('Checking users schema...');
            // Check if column exists by trying to select it. If error, add it.
            // Or just try specific ALTER.
            // MySQL 5.7 doesn't support IF NOT EXISTS in ADD COLUMN easily without referencing information_schema.
            // We'll use the check-first approach.
            const [columns] = await connection.query("SHOW COLUMNS FROM users LIKE 'privacy_settings'");
            if (columns.length === 0) {
                console.log("Adding missing column 'privacy_settings' to users table...");
                await connection.query("ALTER TABLE users ADD COLUMN privacy_settings JSON DEFAULT NULL");
            }
        } catch (err) {
            console.error("Failed to add privacy_settings column:", err);
        }

        // 1. CLEAR DATABASE
        console.log('Clearing existing data...');
        // Order matters for foreign keys
        await connection.execute('DELETE FROM user_books');
        await connection.execute('DELETE FROM shelf_books');
        await connection.execute('DELETE FROM shelves');
        await connection.execute('DELETE FROM books');
        await connection.execute('DELETE FROM users');
        console.log('Database wiped.');


        // 2. Create Users
        console.log(`Creating ${USERS_TO_CREATE} test users...`);
        const userIds = [];
        const passwordHash = await bcrypt.hash('password123', 10);

        // Admin
        const adminPrivacy = JSON.stringify({ share_library: true, library_name: "Admin's Demo Library" });
        const [adminRes] = await connection.execute(
            'INSERT INTO users (username, password, is_admin, privacy_settings) VALUES (?, ?, 1, ?)',
            ['admin', await bcrypt.hash('admin', 10), adminPrivacy]
        );
        userIds.push({ id: adminRes.insertId, name: 'admin' });

        for (let i = 1; i <= USERS_TO_CREATE; i++) {
            const username = `testuser${i}`;
            const privacy = JSON.stringify({ share_library: true, library_name: `${username}'s Library` }); // Make them public for testing
            const [result] = await connection.execute(
                'INSERT INTO users (username, password, is_admin, privacy_settings) VALUES (?, ?, 0, ?)',
                [username, passwordHash, privacy]
            );
            userIds.push({ id: result.insertId, name: username });
        }
        console.log('Users created:', userIds.map(u => u.name));

        // 3. Insert Books for Each User
        // We will distribute the REAL_BOOKS among users to simulate "User Libraries"
        // Admin gets ALL books in the "Main Library" (owner_id = NULL or Admin? 
        // Based on recent schema, owner_id IS the user. If we want a "Main Shared Library" that isn't a specific user, 
        // we might use a dedicated admin account or NULL if the system supports it. 
        // Let's assume Admin owns the "Main" curated collection, and users have their own copies.

        console.log(`Inserting books into user libraries...`);

        for (const user of userIds) {
            // Pick a random subset of books for this user, or all for Admin
            const isMainAdmin = user.name === 'admin';
            // Admin gets all, others get random 5-8
            const userBooks = isMainAdmin ? REAL_BOOKS : REAL_BOOKS.sort(() => 0.5 - Math.random()).slice(0, Math.floor(Math.random() * 4) + 5);

            console.log(`  -> User ${user.name} gets ${userBooks.length} books.`);

            for (const book of userBooks) {
                // Insert the book record OWNED by this user
                const [res] = await connection.execute(
                    `INSERT INTO books (
                        title, author, series, series_index, isbn, 
                        description, publication_date, page_count, 
                        language, format, library, status, cover_url, 
                        publisher, categories, owner_id
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        book.title,
                        book.author,
                        book.series || null,
                        book.series_index || null,
                        book.isbn,
                        book.description,
                        book.publication_date,
                        book.page_count,
                        book.language,
                        'Physical',
                        'Main Library', // The name of the collection/location, e.g. "Bedroom"
                        'Not Started',
                        `https://covers.openlibrary.org/b/isbn/${book.isbn}-M.jpg`, // Auto-generate cover URL from OL
                        book.publisher,
                        JSON.stringify(book.categories.split(',').map(c => c.trim())),
                        user.id // ** CRITICAL: Set the owner_id **
                    ]
                );

                const newBookId = res.insertId;

                // Create random progress for this book
                const statuses = ['Not Started', 'In Progress', 'Completed'];
                const status = statuses[Math.floor(Math.random() * statuses.length)];
                const progress = status === 'Completed' ? 100 : (status === 'Not Started' ? 0 : Math.floor(Math.random() * 50));

                await connection.execute(
                    'INSERT INTO user_books (user_id, book_id, status, progress) VALUES (?, ?, ?, ?)',
                    [user.id, newBookId, status, progress]
                );
            }
        }
        console.log('Books inserted.');

        // 4. Create Shelves
        const shelfNames = ['Favorites', 'To Read', 'Sci-Fi', 'Fantasy'];
        for (const user of userIds) {
            for (const name of shelfNames) {
                await connection.execute('INSERT INTO shelves (user_id, name) VALUES (?, ?)', [user.id, name]);
            }
        }
        console.log('Shelves created.');

        // Done logic... (rest of the file is generic)

        console.log('Done! Database populated with real ISBNs for testing.');

    } catch (error) {
        console.error('Fatal error:', error);
    } finally {
        if (connection) await connection.end();
        process.exit();
    }
}

run();
