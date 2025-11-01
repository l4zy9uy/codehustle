-- Remove deleted_at column
DROP INDEX idx_problems_deleted_at ON problems;
ALTER TABLE problems DROP COLUMN deleted_at;

