-- Enhance contests table for OI-mode contests with additional fields

-- Add new columns to contests table
ALTER TABLE contests ADD COLUMN password VARCHAR(255) NULL COMMENT 'Optional password for private contests';
ALTER TABLE contests ADD COLUMN allowed_languages JSON NULL COMMENT 'Array of allowed programming languages, e.g. ["C++17", "Python3", "Java"]';
ALTER TABLE contests ADD COLUMN submission_limit_per_problem INT DEFAULT 0 COMMENT '0 means unlimited submissions';
ALTER TABLE contests ADD COLUMN rule_type VARCHAR(50) DEFAULT 'OI' NOT NULL COMMENT 'Contest scoring rule: OI (Olympiad in Informatics)';
ALTER TABLE contests ADD COLUMN deleted_at DATETIME NULL COMMENT 'Soft delete timestamp';
ALTER TABLE contests ADD COLUMN updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP;

-- Add index for soft delete
CREATE INDEX idx_contests_deleted_at ON contests(deleted_at);

-- Add index for contest status queries
CREATE INDEX idx_contests_start_end ON contests(start_at, end_at);
CREATE INDEX idx_contests_public ON contests(is_public, deleted_at);

-- Enhance contest_problems table with per-contest overrides
ALTER TABLE contest_problems ADD COLUMN time_limit_ms INT NULL COMMENT 'Per-contest time limit override (null means use problem default)';
ALTER TABLE contest_problems ADD COLUMN memory_limit_kb INT NULL COMMENT 'Per-contest memory limit override (null means use problem default)';
ALTER TABLE contest_problems ADD COLUMN allowed_languages JSON NULL COMMENT 'Per-problem language restrictions (null means use contest default)';

-- Add index for contest problem ordering
CREATE INDEX idx_contest_problems_ordinal ON contest_problems(contest_id, ordinal);



