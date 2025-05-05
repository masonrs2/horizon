-- name: CreateBookmark :exec
INSERT INTO bookmarks (user_id, post_id)
VALUES ($1, $2);

-- name: DeleteBookmark :exec
DELETE FROM bookmarks
WHERE user_id = $1 AND post_id = $2;

-- name: GetUserBookmarkedPosts :many
SELECT p.*
FROM posts p
JOIN bookmarks b ON b.post_id = p.id
WHERE b.user_id = $1
ORDER BY b.created_at DESC
LIMIT $2 OFFSET $3;

-- name: IsPostBookmarked :one
SELECT EXISTS (
    SELECT 1
    FROM bookmarks
    WHERE user_id = $1 AND post_id = $2
) AS is_bookmarked; 