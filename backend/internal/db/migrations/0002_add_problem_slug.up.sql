-- Add slug column to problems table
ALTER TABLE problems ADD COLUMN slug VARCHAR(120) UNIQUE AFTER title;

-- Create index on slug for faster lookups
CREATE INDEX idx_problems_slug ON problems(slug);

