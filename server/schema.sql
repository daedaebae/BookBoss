USE bookboss;

CREATE TABLE IF NOT EXISTS books (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255),
    isbn VARCHAR(20),
    cover_url TEXT,
    `library` VARCHAR(50) DEFAULT 'Main Library',
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    categories JSON,
    file_path VARCHAR(255),
    format VARCHAR(50),
    cover_image_path VARCHAR(255),
    binding_type VARCHAR(50),
    descriptors JSON,
    series VARCHAR(255),
    series_index FLOAT,
    publisher VARCHAR(255),
    language VARCHAR(10) DEFAULT 'en',
    description TEXT,
    shelf VARCHAR(255),
    status VARCHAR(50) DEFAULT 'Not Started',
    rating FLOAT DEFAULT 0,
    page_count INT DEFAULT 0,
    publication_date VARCHAR(20),
    is_loaned BOOLEAN DEFAULT FALSE,
    borrower_name VARCHAR(255),
    loan_date DATETIME,
    due_date DATETIME
);

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL, -- In a real app, hash this!
    is_admin BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS settings (
    `key` VARCHAR(50) PRIMARY KEY,
    value TEXT
);

CREATE TABLE IF NOT EXISTS book_photos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    book_id INT NOT NULL,
    photo_path VARCHAR(255) NOT NULL,
    photo_type VARCHAR(50),
    description TEXT,
    tags JSON,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
);

-- Insert default admin user if not exists (password: admin)
INSERT IGNORE INTO users (username, password, is_admin) VALUES ('admin', 'admin', TRUE);

-- Insert default settings if not exists
INSERT IGNORE INTO settings (`key`, value) VALUES 
('app_title', 'BookBoss'),
('theme', 'light'),
('allow_registration', 'true');
