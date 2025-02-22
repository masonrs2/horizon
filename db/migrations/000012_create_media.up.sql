CREATE TABLE media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    s3_key TEXT NOT NULL,  -- Full S3 path: "dev/media/posts/abc123.jpg"
    file_type VARCHAR(10) NOT NULL CHECK (file_type IN ('image', 'video')),
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_temp BOOLEAN NOT NULL DEFAULT true  -- For dev cleanup
);

CREATE INDEX idx_media_s3_key ON media(s3_key); 