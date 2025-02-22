CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(30) UNIQUE NOT NULL CHECK (LENGTH(username) >= 3),
    email VARCHAR(320) UNIQUE NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z]{2,}$'),
    password_hash TEXT NOT NULL,
    display_name VARCHAR(50) CHECK (LENGTH(display_name) >= 2),
    avatar_url TEXT,
    bio VARCHAR(160) DEFAULT '',
    is_private BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    email_verified BOOLEAN NOT NULL DEFAULT false,
    last_login TIMESTAMPTZ
);

-- Indexes for common lookups
CREATE INDEX idx_users_username ON users(LOWER(username));
CREATE INDEX idx_users_email ON users(LOWER(email));
CREATE INDEX idx_users_created ON users(created_at); 