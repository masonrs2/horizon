-- name: GetFollowStatus :one
SELECT EXISTS (
    SELECT 1 FROM follows f
    WHERE f.follower_id = $1 AND f.followed_id = $2
) as is_following,
COALESCE(
    (SELECT f.is_accepted FROM follows f
    WHERE f.follower_id = $1 AND f.followed_id = $2),
    false
) as is_accepted; 