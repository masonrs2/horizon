-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(30) UNIQUE NOT NULL,
    email VARCHAR(320) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    display_name VARCHAR(50),
    avatar_url TEXT,
    bio VARCHAR(160) DEFAULT '',
    location TEXT,
    website TEXT,
    is_private BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    email_verified BOOLEAN DEFAULT false NOT NULL,
    last_login TIMESTAMPTZ,
    CONSTRAINT users_username_check CHECK (length(username) >= 3),
    CONSTRAINT users_display_name_check CHECK (length(display_name) >= 2),
    CONSTRAINT users_email_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z]{2,}$')
);

CREATE INDEX idx_users_username ON users (lower(username));
CREATE INDEX idx_users_email ON users (lower(email));
CREATE INDEX idx_users_created ON users (created_at);

-- Posts table
CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    is_private BOOLEAN DEFAULT false NOT NULL,
    reply_to_post_id UUID REFERENCES posts(id) ON DELETE SET NULL,
    allow_replies BOOLEAN DEFAULT true NOT NULL,
    media_urls TEXT[],
    like_count INTEGER DEFAULT 0 NOT NULL,
    repost_count INTEGER DEFAULT 0 NOT NULL,
    CONSTRAINT posts_check CHECK (id <> reply_to_post_id),
    CONSTRAINT posts_content_check CHECK (length(content) <= 500)
);

CREATE INDEX idx_posts_user_id ON posts (user_id);
CREATE INDEX idx_posts_parent_id ON posts (reply_to_post_id);

-- Post likes table
CREATE TABLE post_likes (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, post_id)
);

CREATE INDEX idx_post_likes_post ON post_likes (post_id);

-- Follows table
CREATE TABLE follows (
    follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    followed_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_accepted BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (follower_id, followed_id),
    CONSTRAINT follows_check CHECK (follower_id <> followed_id)
);

CREATE INDEX idx_follows_follower ON follows (follower_id);
CREATE INDEX idx_follows_followed ON follows (followed_id);

-- Bookmarks table
CREATE TABLE bookmarks (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, post_id)
);

CREATE INDEX idx_bookmarks_user ON bookmarks (user_id);

-- Media table
CREATE TABLE media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    s3_key TEXT NOT NULL,
    file_type VARCHAR(10) NOT NULL,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_temp BOOLEAN DEFAULT true NOT NULL,
    CONSTRAINT media_file_type_check CHECK (file_type IN ('image', 'video'))
);

CREATE INDEX idx_media_s3_key ON media (s3_key);

-- Mentions table
CREATE TABLE mentions (
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    mentioned_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (post_id, mentioned_user_id)
);

CREATE INDEX idx_mentions_user ON mentions (mentioned_user_id);

-- Messages table
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    read BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT messages_check CHECK (sender_id <> receiver_id),
    CONSTRAINT messages_content_check CHECK (length(content) <= 1000)
);

CREATE INDEX idx_messages_conversation ON messages (LEAST(sender_id, receiver_id), GREATEST(sender_id, receiver_id), created_at);

-- Post hashtags table
CREATE TABLE post_hashtags (
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    hashtag VARCHAR(140) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (post_id, hashtag)
);

CREATE INDEX idx_post_hashtags_tag ON post_hashtags (hashtag);

-- Reposts table
CREATE TABLE reposts (
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    reposter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    original_poster_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (reposter_id, post_id),
    CONSTRAINT reposts_check CHECK (reposter_id <> original_poster_id)
);

CREATE INDEX idx_reposts_post ON reposts (post_id);
CREATE INDEX idx_reposts_original_poster ON reposts (original_poster_id);

-- User relationships table
CREATE TABLE user_relationships (
    follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (follower_id, following_id),
    CONSTRAINT user_relationships_check CHECK (follower_id <> following_id)
);

CREATE INDEX idx_relationships_follower ON user_relationships (follower_id);
CREATE INDEX idx_relationships_following ON user_relationships (following_id);

-- Add notifications table
CREATE TYPE notification_type AS ENUM ('like', 'repost', 'reply', 'follow');

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    actor_id UUID NOT NULL REFERENCES users(id),
    post_id UUID REFERENCES posts(id),
    parent_post_id UUID REFERENCES posts(id),
    type notification_type NOT NULL,
    read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (actor_id) REFERENCES users(id),
    FOREIGN KEY (post_id) REFERENCES posts(id),
    FOREIGN KEY (parent_post_id) REFERENCES posts(id)
);

-- Add index for faster notification queries
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
CREATE INDEX idx_notifications_read ON notifications(read);

-- Add trigger to update updated_at
CREATE TRIGGER set_timestamp
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp(); 