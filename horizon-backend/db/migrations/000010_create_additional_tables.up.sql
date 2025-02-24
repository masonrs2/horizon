-- Post hashtags table
CREATE TABLE post_hashtags (
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    hashtag VARCHAR(140) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (post_id, hashtag)
);

-- Indexes
CREATE INDEX idx_post_hashtags_tag ON post_hashtags(hashtag);