-- Add deleted_at column for soft delete
ALTER TABLE problems ADD COLUMN deleted_at DATETIME NULL;
CREATE INDEX idx_problems_deleted_at ON problems(deleted_at);

