-- Add 'type' column to feature_requests if it doesn't exist (for databases restored from older backups)
DROP PROCEDURE IF EXISTS add_type_col;
CREATE PROCEDURE add_type_col()
BEGIN
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'feature_requests' AND COLUMN_NAME = 'type') THEN
        ALTER TABLE feature_requests ADD COLUMN `type` VARCHAR(50) NOT NULL DEFAULT 'feature';
    END IF;
END;
CALL add_type_col();
DROP PROCEDURE add_type_col;
