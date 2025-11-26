-- Rollback contest enhancements

-- Drop indexes
DROP INDEX IF EXISTS idx_contest_problems_ordinal ON contest_problems;
DROP INDEX IF EXISTS idx_contests_public ON contests;
DROP INDEX IF EXISTS idx_contests_start_end ON contests;
DROP INDEX IF EXISTS idx_contests_deleted_at ON contests;

-- Remove columns from contest_problems
ALTER TABLE contest_problems DROP COLUMN IF EXISTS allowed_languages;
ALTER TABLE contest_problems DROP COLUMN IF EXISTS memory_limit_kb;
ALTER TABLE contest_problems DROP COLUMN IF EXISTS time_limit_ms;

-- Remove columns from contests
ALTER TABLE contests DROP COLUMN IF EXISTS updated_at;
ALTER TABLE contests DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE contests DROP COLUMN IF EXISTS rule_type;
ALTER TABLE contests DROP COLUMN IF EXISTS submission_limit_per_problem;
ALTER TABLE contests DROP COLUMN IF EXISTS allowed_languages;
ALTER TABLE contests DROP COLUMN IF EXISTS password;



