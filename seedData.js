const mysql = require('mysql2');
require('dotenv').config({ path: './server/.env' });

const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'bookboss'
});

const dummyBooks = [
    {
        title: "The Great Gatsby",
        author: "F. Scott Fitzgerald",
        isbn: "9780743273565",
        cover_url: "https://covers.openlibrary.org/b/id/8432047-L.jpg",
        library: "Main Library",
        status: "Completed",
        rating: 5,
        format: "Physical",
        binding_type: "Hardcover",
        page_count: 180,
        shelf: "Favorites",
        categories: JSON.stringify(["Classics", "Fiction"]),
        added_at: new Date('2023-01-15')
    },
    {
        title: "Dune",
        author: "Frank Herbert",
        isbn: "9780441013593",
        cover_url: "https://covers.openlibrary.org/b/id/12765606-L.jpg",
        library: "Main Library",
        status: "Reading",
        rating: 0,
        format: "Ebook",
        binding_type: "Digital",
        page_count: 412,
        shelf: "Sci-Fi",
        categories: JSON.stringify(["Science Fiction", "Adventure"]),
        added_at: new Date('2023-02-20')
    },
    {
        title: "Project Hail Mary",
        author: "Andy Weir",
        isbn: "9780593135204",
        cover_url: "https://covers.openlibrary.org/b/id/10594333-L.jpg",
        library: "Office",
        status: "To Read",
        rating: 0,
        format: "Audiobook",
        binding_type: "Digital",
        page_count: 496,
        shelf: "Sci-Fi",
        categories: JSON.stringify(["Science Fiction", "Space"]),
        added_at: new Date('2023-03-10')
    },
    {
        title: "The Hobbit",
        author: "J.R.R. Tolkien",
        isbn: "9780547928227",
        cover_url: "https://covers.openlibrary.org/b/id/8406786-L.jpg",
        library: "Main Library",
        status: "Completed",
        rating: 5,
        format: "Physical",
        binding_type: "Paperback",
        page_count: 310,
        shelf: "Fantasy",
        categories: JSON.stringify(["Fantasy", "Classics"]),
        added_at: new Date('2023-01-05')
    },
    {
        title: "1984",
        author: "George Orwell",
        isbn: "9780451524935",
        cover_url: "https://covers.openlibrary.org/b/id/12646694-L.jpg",
        library: "Main Library",
        status: "Completed",
        rating: 4,
        format: "Physical",
        binding_type: "Paperback",
        page_count: 328,
        shelf: "Classics",
        categories: JSON.stringify(["Dystopian", "Politics"]),
        added_at: new Date('2023-04-12')
    },
    {
        title: "Thinking, Fast and Slow",
        author: "Daniel Kahneman",
        isbn: "9780374275631",
        cover_url: "https://covers.openlibrary.org/b/id/7234863-L.jpg",
        library: "Office",
        status: "Reading",
        rating: 0,
        format: "Ebook",
        binding_type: "Digital",
        page_count: 499,
        shelf: "Non-Fiction",
        categories: JSON.stringify(["Psychology", "Science"]),
        added_at: new Date('2023-05-01')
    },
    {
        title: "Clean Code",
        author: "Robert C. Martin",
        isbn: "9780132350884",
        cover_url: "https://covers.openlibrary.org/b/id/12539656-L.jpg",
        library: "Office",
        status: "Completed",
        rating: 5,
        format: "Physical",
        binding_type: "Paperback",
        page_count: 464,
        shelf: "Tech",
        categories: JSON.stringify(["Programming", "Technology"]),
        added_at: new Date('2023-02-15')
    },
    {
        title: "The Pragmatic Programmer",
        author: "Andrew Hunt",
        isbn: "9780201616224",
        cover_url: "https://covers.openlibrary.org/b/id/12470783-L.jpg",
        library: "Office",
        status: "To Read",
        rating: 0,
        format: "Ebook",
        binding_type: "Digital",
        page_count: 352,
        shelf: "Tech",
        categories: JSON.stringify(["Programming", "Career"]),
        added_at: new Date('2023-06-20')
    }
];

db.connect(err => {
    if (err) {
        console.error('Database connection failed:', err);
        process.exit(1);
    }
    console.log('Connected to database.');

    // Clear existing data
    db.query('DELETE FROM books', (err) => {
        if (err) {
            console.error('Error clearing books:', err);
            process.exit(1);
        }
        console.log('Cleared existing books.');

        // Insert new data
        const query = `INSERT INTO books 
            (title, author, isbn, cover_url, \`library\`, status, rating, format, binding_type, page_count, shelf, categories, added_at) 
            VALUES ?`;

        const values = dummyBooks.map(b => [
            b.title, b.author, b.isbn, b.cover_url, b.library, b.status, b.rating,
            b.format, b.binding_type, b.page_count, b.shelf, b.categories, b.added_at
        ]);

        db.query(query, [values], (err, result) => {
            if (err) {
                console.error('Error inserting dummy books:', err);
                process.exit(1);
            }
            console.log(`Successfully inserted ${result.affectedRows} dummy books.`);
            db.end();
        });
    });
});
