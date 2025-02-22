CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL CHECK (LENGTH(content) <= 500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    is_private BOOLEAN NOT NULL DEFAULT false,
    reply_to_post_id UUID REFERENCES posts(id) ON DELETE SET NULL,
    allow_replies BOOLEAN NOT NULL DEFAULT true,
    media_urls TEXT[],
    like_count INT NOT NULL DEFAULT 0,
    repost_count INT NOT NULL DEFAULT 0
    
    -- Ensure a post can't be both a reply and a repost
    CHECK (num_nonnulls(reply_to, repost_of_id) <= 1),
    
    -- Prevent self-replies
    CHECK (id != reply_to)
);

-- Indexes for common query patterns
CREATE INDEX idx_posts_user ON posts(user_id);
CREATE INDEX idx_posts_reply ON posts(reply_to);
CREATE INDEX idx_posts_repost ON posts(repost_of_id);CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL CHECK (LENGTH(content) <= 500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    is_private BOOLEAN NOT NULL DEFAULT false,
    reply_to_post_id UUID REFERENCES posts(id) ON DELETE SET NULL,
    allow_replies BOOLEAN NOT NULL DEFAULT true,
    media_urls TEXT[],
    like_count INT NOT NULL DEFAULT 0,
    repost_count INT NOT NULL DEFAULT 0
);

CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_parent_id ON posts(reply_to_post_id); 