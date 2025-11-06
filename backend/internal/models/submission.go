package models

import "time"

// Submission represents a user's code submission to a problem
type Submission struct {
	ID              string    `gorm:"type:char(36);primaryKey" json:"id"`
	ProblemID       string    `gorm:"type:char(36);not null;column:problem_id;index" json:"problem_id"`
	UserID          string    `gorm:"type:char(36);not null;column:user_id;index" json:"user_id"`
	CourseID        *string   `gorm:"type:char(36);column:course_id" json:"course_id,omitempty"`
	ContestID       *string   `gorm:"type:char(36);column:contest_id" json:"contest_id,omitempty"`
	Code            string    `gorm:"type:text;not null" json:"code"`
	Language        string    `gorm:"size:50;not null" json:"language"`
	LanguageVersion *string   `gorm:"size:50;column:language_version" json:"language_version,omitempty"`
	Status          string    `gorm:"size:50;not null;default:'pending'" json:"status"`
	Score           *int      `json:"score,omitempty"`
	ExecutionTime   *int      `gorm:"column:execution_time" json:"execution_time,omitempty"` // milliseconds
	MemoryUsage     *int      `gorm:"column:memory_usage" json:"memory_usage,omitempty"`     // KB
	CodeSizeBytes   *int      `gorm:"column:code_size_bytes" json:"code_size_bytes,omitempty"`
	CompileLogPath  *string   `gorm:"type:text;column:compile_log_path" json:"compile_log_path,omitempty"`
	RunLogPath      *string   `gorm:"type:text;column:run_log_path" json:"run_log_path,omitempty"`
	SubmittedAt     time.Time `gorm:"autoCreateTime;column:submitted_at" json:"submitted_at"`

	// Relations
	TestCaseResults []SubmissionTestCase `gorm:"foreignKey:SubmissionID" json:"test_case_results,omitempty"`
}

// SubmissionTestCase represents per-test-case results
type SubmissionTestCase struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	SubmissionID string    `gorm:"type:char(36);not null;column:submission_id;index" json:"submission_id"`
	TestCaseID   string    `gorm:"type:char(36);not null;column:test_case_id;index" json:"test_case_id"`
	Status       string    `gorm:"size:50;not null" json:"status"` // accepted, wrong_answer, compile_error, runtime_error, time_limit_exceeded, memory_limit_exceeded, system_error
	Score        *int      `json:"score,omitempty"`
	TimeMs       *int      `gorm:"column:time_ms" json:"time_ms,omitempty"`
	MemoryKb     *int      `gorm:"column:memory_kb" json:"memory_kb,omitempty"`
	LogPath      *string   `gorm:"type:text;column:log_path" json:"log_path,omitempty"`
	CreatedAt    time.Time `gorm:"autoCreateTime;column:created_at" json:"created_at"`

	// Relations
	TestCase TestCase `gorm:"foreignKey:TestCaseID" json:"test_case,omitempty"`
}

// TableName specifies the table name for SubmissionTestCase
func (SubmissionTestCase) TableName() string {
	return "submission_testcases"
}
