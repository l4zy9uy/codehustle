-- Remove user_output_path from submission_testcases

ALTER TABLE submission_testcases DROP COLUMN IF EXISTS user_output_path;

