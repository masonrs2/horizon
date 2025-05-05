package model

import (
	"github.com/jackc/pgx/v5/pgtype"
)

type User struct {
	ID             pgtype.UUID        `json:"id"`
	Username       string             `json:"username"`
	Email          string             `json:"email"`
	Password       string             `json:"password"`
	PasswordHash   string             `json:"-"`
	DisplayName    pgtype.Text        `json:"display_name"`
	AvatarUrl      pgtype.Text        `json:"avatar_url"`
	Bio            pgtype.Text        `json:"bio"`
	Location       pgtype.Text        `json:"location"`
	Website        pgtype.Text        `json:"website"`
	IsPrivate      bool               `json:"is_private"`
	CreatedAt      pgtype.Timestamptz `json:"created_at"`
	UpdatedAt      pgtype.Timestamptz `json:"updated_at"`
	DeletedAt      pgtype.Timestamptz `json:"deleted_at"`
	EmailVerified  bool               `json:"email_verified"`
	LastLogin      pgtype.Timestamptz `json:"last_login"`
	FollowersCount int64              `json:"followers_count"`
	FollowingCount int64              `json:"following_count"`
}
