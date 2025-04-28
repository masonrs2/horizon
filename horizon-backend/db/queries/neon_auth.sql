-- name: GetUserFromNeonAuth :one
SELECT 
    id, 
    name as display_name, 
    email, 
    raw_json->>'username' as username,
    raw_json->>'avatar_url' as avatar_url
FROM neon_auth.users_sync 
WHERE raw_json->>'username' = $1 AND deleted_at IS NULL
LIMIT 1;

-- name: GetUserByIDFromNeonAuth :one
SELECT 
    id, 
    name as display_name, 
    email, 
    raw_json->>'username' as username,
    raw_json->>'avatar_url' as avatar_url
FROM neon_auth.users_sync 
WHERE id = $1 AND deleted_at IS NULL
LIMIT 1;

-- name: ListUsers :many
SELECT 
    id, 
    name as display_name, 
    email, 
    raw_json->>'username' as username,
    raw_json->>'avatar_url' as avatar_url
FROM neon_auth.users_sync 
WHERE deleted_at IS NULL
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;

-- name: GetUserCount :one
SELECT COUNT(*) FROM neon_auth.users_sync WHERE deleted_at IS NULL; 