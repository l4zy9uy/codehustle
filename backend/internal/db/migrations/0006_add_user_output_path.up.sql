-- Add user_output_path to submission_testcases for storing user's actual output

ALTER TABLE submission_testcases 
ADD COLUMN user_output_path TEXT NULL COMMENT 'MinIO object key for user output (stored for wrong_answer cases)';

