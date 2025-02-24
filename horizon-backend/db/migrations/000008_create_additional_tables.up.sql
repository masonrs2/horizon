-- Reposts table with original poster tracking
CREATE TABLE reposts (
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    reposter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    original_poster_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (reposter_id, post_id),
    -- Ensure reposter isn't the original poster
    CHECK (reposter_id != original_poster_id)
);

-- Indexes for common queries
CREATE INDEX idx_reposts_post ON reposts(post_id);
CREATE INDEX idx_reposts_original_poster ON reposts(original_poster_id);