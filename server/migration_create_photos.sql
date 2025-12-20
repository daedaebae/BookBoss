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
