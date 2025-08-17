-- 0002_create_test_cases_table.sql

CREATE TABLE IF NOT EXISTS test_cases (
    id CHAR(36) PRIMARY KEY,
    assignment_id CHAR(36) NOT NULL,
    input_path TEXT NOT NULL,
    expected_output_path TEXT NOT NULL,
    weight INT DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE
); 