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
    is_admin BOOLEAN DEFAULT FALSE,
    privacy_settings JSON DEFAULT NULL
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
INSERT IGNORE INTO users (username, password, is_admin) VALUES ('admin', '$2b$12$4yY/5Cpxenb2XSSN12umfOyZKt4LaFoGd.ZorV6QQ2Fk8VzVp3XHa', TRUE);

-- Insert default settings if not exists
INSERT IGNORE INTO settings (`key`, value) VALUES 
('app_title', 'BookBoss'),
('theme', 'light'),
('allow_registration', 'true');

-- Shelves Support
CREATE TABLE IF NOT EXISTS shelves (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    user_id INT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS shelf_books (
    shelf_id INT NOT NULL,
    book_id INT NOT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (shelf_id, book_id),
    FOREIGN KEY (shelf_id) REFERENCES shelves(id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
);

-- User Reading Progress & Status
CREATE TABLE IF NOT EXISTS user_books (
    user_id INT NOT NULL,
    book_id INT NOT NULL,
    status VARCHAR(50) DEFAULT 'Not Started', -- 'Not Started', 'Reading', 'Completed', 'DnF'
    progress INT DEFAULT 0, -- Page number or percentage?
    rating INT,
    notes TEXT,
    last_read TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, book_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
);

-- Audiobookshelf Integration
CREATE TABLE IF NOT EXISTS audiobookshelf_servers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    server_name VARCHAR(255) NOT NULL,
    server_url VARCHAR(500) NOT NULL,
    api_token TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS abs_book_mappings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    book_id INT NOT NULL,
    abs_server_id INT NOT NULL,
    abs_library_item_id VARCHAR(255) NOT NULL,
    abs_library_id VARCHAR(255),
    last_synced DATETIME,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    FOREIGN KEY (abs_server_id) REFERENCES audiobookshelf_servers(id) ON DELETE CASCADE,
    UNIQUE KEY unique_mapping (book_id, abs_server_id)
);

CREATE TABLE IF NOT EXISTS abs_listening_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    book_id INT NOT NULL,
    abs_server_id INT NOT NULL,
    `current_time` DECIMAL(10,2),
    `duration` DECIMAL(10,2),
    `progress` DECIMAL(5,4),
    is_finished BOOLEAN DEFAULT false,
    last_update DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    FOREIGN KEY (abs_server_id) REFERENCES audiobookshelf_servers(id) ON DELETE CASCADE
);


