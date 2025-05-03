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