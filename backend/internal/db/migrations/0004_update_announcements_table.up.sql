-- Update announcements table to match API requirements
-- Add new columns
ALTER TABLE announcements 
  ADD COLUMN snippet TEXT NULL AFTER title,
  ADD COLUMN author VARCHAR(200) NULL AFTER content,
  ADD COLUMN image TEXT NULL AFTER author,
  ADD COLUMN deleted_at DATETIME NULL AFTER visible_until,
  ADD COLUMN updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at;

-- Remove columns we don't need (only if they exist)
SET @dbname = DATABASE();
SET @tablename = "announcements";
SET @columnname = "is_pinned";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  CONCAT("ALTER TABLE ", @tablename, " DROP COLUMN ", @columnname),
  "SELECT 1"
));
PREPARE alterIfExists FROM @preparedStatement;
EXECUTE alterIfExists;
DEALLOCATE PREPARE alterIfExists;

SET @columnname = "published_at";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  CONCAT("ALTER TABLE ", @tablename, " DROP COLUMN ", @columnname),
  "SELECT 1"
));
PREPARE alterIfExists FROM @preparedStatement;
EXECUTE alterIfExists;
DEALLOCATE PREPARE alterIfExists;

-- Create index for soft delete
CREATE INDEX idx_announcements_deleted_at ON announcements(deleted_at);

-- Create announcement_reads junction table for tracking read status
CREATE TABLE IF NOT EXISTS announcement_reads (
  user_id CHAR(36) NOT NULL,
  announcement_id CHAR(36) NOT NULL,
  read_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, announcement_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (announcement_id) REFERENCES announcements(id) ON DELETE CASCADE,
  INDEX idx_announcement_reads_user (user_id),
  INDEX idx_announcement_reads_announcement (announcement_id)
);

