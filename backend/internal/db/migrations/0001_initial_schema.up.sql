-- 0001_initial_schema.sql

-- Users (comprehensive auth version)
CREATE TABLE IF NOT EXISTS users (
    id CHAR(36) PRIMARY KEY,
    email VARCHAR(254) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50) DEFAULT '',
    last_name VARCHAR(100) DEFAULT '',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    last_login_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Roles system
CREATE TABLE IF NOT EXISTS roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(200) DEFAULT NULL
);

INSERT INTO roles(name, description) VALUES
    ('student', 'Default'),
    ('ta', 'Teaching assistant'),
    ('instructor', 'Instructor'),
    ('admin', 'Administrator'),
    ('judge_worker', 'Worker service')
ON DUPLICATE KEY UPDATE name=name;

-- User roles (many-to-many)
CREATE TABLE IF NOT EXISTS user_roles (
    user_id CHAR(36) NOT NULL,
    role_id INT NOT NULL,
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);

-- OAuth identities
CREATE TABLE IF NOT EXISTS oauth_identities (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    provider VARCHAR(50) NOT NULL,
    provider_sub VARCHAR(255) NOT NULL,
    UNIQUE KEY uq_provider_sub (provider, provider_sub),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Refresh tokens
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    family_id CHAR(36) NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
    last_used_at TIMESTAMP NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_exp (user_id, expires_at),
    INDEX idx_family (family_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Email verification tokens
CREATE TABLE IF NOT EXISTS email_verification_tokens (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_user_pending (user_id, used_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Password reset tokens
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_exp (user_id, expires_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Service clients
CREATE TABLE IF NOT EXISTS service_clients (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    hmac_secret_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- Auth audit log
CREATE TABLE IF NOT EXISTS auth_audit_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id CHAR(36) NULL,
    event VARCHAR(50) NOT NULL,
    ip VARCHAR(45) NULL,
    ua VARCHAR(255) NULL,
    meta JSON NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_time (user_id, created_at)
);

-- Courses (owned by a lecturer)
CREATE TABLE IF NOT EXISTS courses (
    id CHAR(36) PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT TRUE,
    lecturer_id CHAR(36) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lecturer_id) REFERENCES users(id)
);

-- Course enrollments (role per-course)
CREATE TABLE IF NOT EXISTS course_enrollments (
    course_id CHAR(36) NOT NULL,
    user_id CHAR(36) NOT NULL,
    role_id INT NOT NULL DEFAULT 1, -- Default to 'student' role
    enrolled_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (course_id, user_id),
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id)
);

-- Problems (global)
CREATE TABLE IF NOT EXISTS problems (
    id CHAR(36) PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    statement_path TEXT NOT NULL, -- MinIO object key/URL for problem statement
    difficulty VARCHAR(50),
    is_public BOOLEAN DEFAULT FALSE,
    time_limit_ms INT NOT NULL DEFAULT 2000,
    memory_limit_kb INT NOT NULL DEFAULT 262144,
    created_by CHAR(36) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Tags and problem-tags
CREATE TABLE IF NOT EXISTS tags (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(120) NOT NULL UNIQUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS problem_tags (
    problem_id CHAR(36) NOT NULL,
    tag_id CHAR(36) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (problem_id, tag_id),
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- Course usage of problems
CREATE TABLE IF NOT EXISTS course_problems (
    course_id CHAR(36) NOT NULL,
    problem_id CHAR(36) NOT NULL,
    points INT NOT NULL,
    ordinal INT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (course_id, problem_id),
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE
);

-- Contests and usage
CREATE TABLE IF NOT EXISTS contests (
    id CHAR(36) PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    start_at DATETIME NOT NULL,
    end_at DATETIME NOT NULL,
    is_public BOOLEAN DEFAULT FALSE,
    created_by CHAR(36) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS contest_participants (
    contest_id CHAR(36) NOT NULL,
    user_id CHAR(36) NOT NULL,
    registered_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (contest_id, user_id),
    FOREIGN KEY (contest_id) REFERENCES contests(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS contest_problems (
    contest_id CHAR(36) NOT NULL,
    problem_id CHAR(36) NOT NULL,
    points INT NOT NULL,
    ordinal INT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (contest_id, problem_id),
    FOREIGN KEY (contest_id) REFERENCES contests(id) ON DELETE CASCADE,
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE
);

-- Test cases (global per problem, MinIO object keys + weights)
CREATE TABLE IF NOT EXISTS test_cases (
    id CHAR(36) PRIMARY KEY,
    problem_id CHAR(36) NOT NULL,
    name VARCHAR(200) NOT NULL,
    input_path TEXT NOT NULL, -- MinIO object key for test input
    expected_output_path TEXT NOT NULL, -- MinIO object key for expected output
    weight INT NOT NULL DEFAULT 1,
    is_sample BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE
);

-- Problem judges (pair of checker + input validator per problem)
CREATE TABLE IF NOT EXISTS problem_judges (
    id CHAR(36) PRIMARY KEY,
    problem_id CHAR(36) NOT NULL UNIQUE,
    checker_kind ENUM('diff','token','float_abs','float_rel','custom') NOT NULL,
    checker_custom_path TEXT NULL, -- MinIO key for custom checker source/binary
    checker_args JSON NULL, -- e.g., {"epsilon": 1e-6, "relative": true}
    checker_runtime_image VARCHAR(200) NULL, -- Docker image to build/run checker
    checker_version VARCHAR(50) NULL,
    validator_path TEXT NULL, -- MinIO key for input validator (optional)
    validator_args JSON NULL,
    validator_runtime_image VARCHAR(200) NULL,
    validator_version VARCHAR(50) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE
);

-- Submissions (context-aware; partial scoring via test case weights)
CREATE TABLE IF NOT EXISTS submissions (
    id CHAR(36) PRIMARY KEY,
    problem_id CHAR(36) NOT NULL,
    user_id CHAR(36) NOT NULL,
    course_id CHAR(36) NULL,
    contest_id CHAR(36) NULL,
    code TEXT NOT NULL,
    language VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    score INT,
    execution_time INT,
    memory_usage INT,
    code_size_bytes INT NULL,
    language_version VARCHAR(50) NULL,
    compile_log_path TEXT NULL,
    run_log_path TEXT NULL,
    submitted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL,
    FOREIGN KEY (contest_id) REFERENCES contests(id) ON DELETE SET NULL
);

-- Helpful indexes
CREATE INDEX idx_submissions_problem ON submissions(problem_id);
CREATE INDEX idx_submissions_problem_course ON submissions(problem_id, course_id);
CREATE INDEX idx_submissions_problem_contest ON submissions(problem_id, contest_id);
CREATE INDEX idx_submissions_user_problem ON submissions(user_id, problem_id);

-- Announcements (public)
CREATE TABLE IF NOT EXISTS announcements (
    id CHAR(36) PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    is_pinned BOOLEAN DEFAULT FALSE,
    created_by CHAR(36) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    published_at DATETIME NULL,
    visible_until DATETIME NULL,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Submission per-testcase results
CREATE TABLE IF NOT EXISTS submission_testcases (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    submission_id CHAR(36) NOT NULL,
    test_case_id CHAR(36) NOT NULL,
    status VARCHAR(50) NOT NULL,
    score INT NULL,
    time_ms INT NULL,
    memory_kb INT NULL,
    log_path TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_submission_test (submission_id, test_case_id),
    FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE,
    FOREIGN KEY (test_case_id) REFERENCES test_cases(id)
);

-- Judge jobs queue
CREATE TABLE IF NOT EXISTS judge_jobs (
    id CHAR(36) PRIMARY KEY,
    submission_id CHAR(36) NOT NULL,
    status ENUM('queued','running','done','error','cancelled') NOT NULL DEFAULT 'queued',
    worker_id VARCHAR(100) NULL,
    attempts INT NOT NULL DEFAULT 0,
    last_error TEXT NULL,
    enqueued_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    started_at DATETIME NULL,
    finished_at DATETIME NULL,
    INDEX idx_status_time (status, enqueued_at),
    FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE
);