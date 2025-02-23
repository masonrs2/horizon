package model

import (
	"github.com/jackc/pgx/v5/pgtype"
)

type User struct {
	ID            pgtype.UUID        `json:"id"`
	Username      string             `json:"username"`
	Email         string             `json:"email"`
	PasswordHash  string             `json:"password_hash"`
	DisplayName   pgtype.Text        `json:"display_name"`
	AvatarUrl     pgtype.Text        `json:"avatar_url"`
	Bio           pgtype.Text        `json:"bio"`
	IsPrivate     bool               `json:"is_private"`
	CreatedAt     pgtype.Timestamptz `json:"created_at"`
	UpdatedAt     pgtype.Timestamptz `json:"updated_at"`
	DeletedAt     pgtype.Timestamptz `json:"deleted_at"`
	EmailVerified bool               `json:"email_verified"`
	LastLogin     pgtype.Timestamptz `json:"last_login"`
}
