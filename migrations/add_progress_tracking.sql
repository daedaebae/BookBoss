-- Add reading progress tracking columns to books table
ALTER TABLE books 
ADD COLUMN current_page INT DEFAULT 0,
ADD COLUMN progress_percentage DECIMAL(5,2) DEFAULT 0.00,
ADD COLUMN last_read_at DATETIME NULL;
