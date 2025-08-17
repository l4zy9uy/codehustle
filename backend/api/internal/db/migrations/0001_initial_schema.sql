-- 0001_initial_schema.sql

CREATE TABLE IF NOT EXISTS courses (
    id CHAR(36) PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT TRUE,
    created_by CHAR(36) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS course_enrollments (
    course_id CHAR(36) NOT NULL,
    user_id CHAR(36) NOT NULL,
    enrolled_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (course_id, user_id)
);

CREATE TABLE IF NOT EXISTS assignments (
    id CHAR(36) PRIMARY KEY,
    course_id CHAR(36) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    difficulty VARCHAR(50),
    test_cases JSON NOT NULL,
    is_published BOOLEAN DEFAULT FALSE,
    deadline DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS submissions (
    id CHAR(36) PRIMARY KEY,
    assignment_id CHAR(36) NOT NULL,
    user_id CHAR(36) NOT NULL,
    code TEXT NOT NULL,
    language VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    score INT,
    execution_time INT,
    memory_usage INT,
    submitted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
); 