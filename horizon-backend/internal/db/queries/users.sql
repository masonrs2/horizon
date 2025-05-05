-- name: GetUserByID :one
SELECT * FROM users
WHERE id = $1 AND deleted_at IS NULL;

-- name: GetUserByUsername :one
SELECT * FROM users
WHERE username = $1 AND deleted_at IS NULL;

-- name: GetUserByEmail :one
SELECT * FROM users
WHERE email = $1 AND deleted_at IS NULL;

-- name: CreateUser :one
INSERT INTO users (
    username, 
    email, 
    password_hash, 
    display_name
    -- avatar_url, bio, and is_private will use their default values
)
VALUES (
    $1, $2, $3, $4
)
RETURNING id, username, email, password_hash, display_name, 
    COALESCE(avatar_url, '') as avatar_url,
    COALESCE(bio, '') as bio,
    COALESCE(is_private, false) as is_private,
    created_at, updated_at, deleted_at, email_verified, last_login;

-- name: GetUserStats :one
SELECT 
    (SELECT COUNT(*) FROM follows f WHERE f.followed_id = u.id AND f.is_accepted = true) as followers_count,
    (SELECT COUNT(*) FROM follows f WHERE f.follower_id = u.id AND f.is_accepted = true) as following_count
FROM users u
WHERE u.id = $1 AND u.deleted_at IS NULL;

-- name: UpdateUser :one
UPDATE users
SET
  display_name = COALESCE($2, display_name),
  bio = COALESCE($3, bio),
  location = COALESCE($4, location),
  website = COALESCE($5, website),
  updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: UpdateUserAvatar :one
UPDATE users
SET
  avatar_url = sqlc.arg(avatar_url),
  updated_at = NOW()
WHERE id = sqlc.arg(id)
RETURNING *; 