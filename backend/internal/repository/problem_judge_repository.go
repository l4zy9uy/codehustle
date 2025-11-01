package repository

import (
	"codehustle/backend/internal/db"
	"codehustle/backend/internal/models"
	"context"
)

type ProblemJudgeRepository struct{}

func NewProblemJudgeRepository() *ProblemJudgeRepository { return &ProblemJudgeRepository{} }

func (r *ProblemJudgeRepository) GetByProblemID(ctx context.Context, problemID string) (*models.ProblemJudge, error) {
	var pj models.ProblemJudge
	if err := db.DB.WithContext(ctx).Where("problem_id = ?", problemID).First(&pj).Error; err != nil {
		return nil, err
	}
	return &pj, nil
}

func (r *ProblemJudgeRepository) Upsert(ctx context.Context, pj *models.ProblemJudge) error {
	return db.DB.WithContext(ctx).Save(pj).Error
}
