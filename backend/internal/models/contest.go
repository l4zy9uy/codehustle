package models

import (
	"database/sql/driver"
	"encoding/json"
	"time"
)

// Contest represents an OI-mode contest
type Contest struct {
	ID                       string         `gorm:"type:char(36);primaryKey" json:"id"`
	Title                    string         `gorm:"size:200;not null" json:"title"`
	Description              string         `gorm:"type:text" json:"description"`
	StartAt                  time.Time      `gorm:"column:start_at;not null" json:"start_at"`
	EndAt                    time.Time      `gorm:"column:end_at;not null" json:"end_at"`
	IsPublic                 bool           `gorm:"column:is_public;default:false" json:"is_public"`
	Password                 *string        `gorm:"size:255;column:password" json:"-"` // Never expose password in JSON
	AllowedLanguages         StringArray    `gorm:"type:json;column:allowed_languages" json:"allowed_languages,omitempty"`
	SubmissionLimitPerProblem int           `gorm:"column:submission_limit_per_problem;default:0" json:"submission_limit_per_problem"` // 0 = unlimited
	RuleType                 string         `gorm:"size:50;column:rule_type;default:'OI';not null" json:"rule_type"`
	CreatedBy                string         `gorm:"type:char(36);not null;column:created_by" json:"created_by"`
	CreatedAt                time.Time      `gorm:"autoCreateTime;column:created_at" json:"created_at"`
	UpdatedAt                *time.Time     `gorm:"column:updated_at" json:"updated_at,omitempty"`
	DeletedAt                *time.Time     `gorm:"column:deleted_at;index" json:"deleted_at,omitempty"`

	// Relations (not loaded by default)
	Problems     []ContestProblem     `gorm:"foreignKey:ContestID" json:"problems,omitempty"`
	Participants []ContestParticipant `gorm:"foreignKey:ContestID" json:"participants,omitempty"`
}

// ContestParticipant represents a user registered for a contest
type ContestParticipant struct {
	ContestID    string    `gorm:"type:char(36);primaryKey;column:contest_id" json:"contest_id"`
	UserID       string    `gorm:"type:char(36);primaryKey;column:user_id" json:"user_id"`
	RegisteredAt time.Time `gorm:"autoCreateTime;column:registered_at" json:"registered_at"`

	// Relations
	User *User `gorm:"foreignKey:UserID" json:"user,omitempty"`
}

// ContestProblem represents a problem within a contest with per-contest settings
type ContestProblem struct {
	ContestID        string      `gorm:"type:char(36);not null;column:contest_id;uniqueIndex:idx_contest_problem" json:"contest_id"`
	ProblemID        string      `gorm:"type:char(36);not null;column:problem_id;uniqueIndex:idx_contest_problem" json:"problem_id"`
	Points           int         `gorm:"not null" json:"points"`
	Ordinal          *int        `json:"ordinal,omitempty"`
	TimeLimitMs      *int        `gorm:"column:time_limit_ms" json:"time_limit_ms,omitempty"`      // Override problem default
	MemoryLimitKb    *int        `gorm:"column:memory_limit_kb" json:"memory_limit_kb,omitempty"`  // Override problem default
	AllowedLanguages StringArray `gorm:"type:json;column:allowed_languages" json:"allowed_languages,omitempty"` // Override contest default
	CreatedAt        time.Time   `gorm:"autoCreateTime;column:created_at" json:"created_at"`

	// Relations
	Problem *Problem `gorm:"foreignKey:ProblemID" json:"problem,omitempty"`
}

// StringArray is a custom type for JSON string arrays
type StringArray []string

// Scan implements sql.Scanner interface
func (s *StringArray) Scan(value interface{}) error {
	if value == nil {
		*s = nil
		return nil
	}
	
	bytes, ok := value.([]byte)
	if !ok {
		return nil
	}
	
	return json.Unmarshal(bytes, s)
}

// Value implements driver.Valuer interface
func (s StringArray) Value() (driver.Value, error) {
	if s == nil {
		return nil, nil
	}
	return json.Marshal(s)
}

// TableName specifies the table name for Contest
func (Contest) TableName() string {
	return "contests"
}

// TableName specifies the table name for ContestParticipant
func (ContestParticipant) TableName() string {
	return "contest_participants"
}

// TableName specifies the table name for ContestProblem
func (ContestProblem) TableName() string {
	return "contest_problems"
}

// ContestStatus returns the current status of the contest
func (c *Contest) Status() string {
	now := time.Now()
	if c.DeletedAt != nil {
		return "deleted"
	}
	if now.Before(c.StartAt) {
		return "upcoming"
	}
	if now.After(c.EndAt) {
		return "ended"
	}
	return "running"
}

// IsActive returns true if the contest is currently running
func (c *Contest) IsActive() bool {
	now := time.Now()
	return c.DeletedAt == nil && now.After(c.StartAt) && now.Before(c.EndAt)
}

// CanRegister returns true if registration is still open
func (c *Contest) CanRegister() bool {
	now := time.Now()
	return c.DeletedAt == nil && now.Before(c.EndAt)
}

// RequiresPassword returns true if the contest requires a password
func (c *Contest) RequiresPassword() bool {
	return c.Password != nil && *c.Password != ""
}


