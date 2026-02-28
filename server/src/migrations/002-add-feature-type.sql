-- Add 'type' column to feature_requests if it doesn't exist (for databases restored from older backups)
ALTER TABLE feature_requests 
    ADD COLUMN IF NOT EXISTS `type` VARCHAR(50) NOT NULL DEFAULT 'feature';
