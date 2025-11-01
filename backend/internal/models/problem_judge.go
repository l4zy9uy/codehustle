package models

import "time"

type ProblemJudge struct {
	ID                    string    `gorm:"type:char(36);primaryKey" json:"id"`
	ProblemID             string    `gorm:"type:char(36);uniqueIndex;not null" json:"problem_id"`
	CheckerKind           string    `gorm:"size:20;not null" json:"checker_kind"`
	CheckerCustomPath     *string   `gorm:"type:text" json:"checker_custom_path,omitempty"`
	CheckerArgs           *string   `gorm:"type:json" json:"checker_args,omitempty"`
	CheckerRuntimeImage   *string   `gorm:"size:200" json:"checker_runtime_image,omitempty"`
	CheckerVersion        *string   `gorm:"size:50" json:"checker_version,omitempty"`
	ValidatorPath         *string   `gorm:"type:text" json:"validator_path,omitempty"`
	ValidatorArgs         *string   `gorm:"type:json" json:"validator_args,omitempty"`
	ValidatorRuntimeImage *string   `gorm:"size:200" json:"validator_runtime_image,omitempty"`
	ValidatorVersion      *string   `gorm:"size:50" json:"validator_version,omitempty"`
	CreatedAt             time.Time `gorm:"autoCreateTime" json:"created_at"`
}
