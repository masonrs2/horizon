-- Migration for Neon Auth Integration
-- Based on documentation at https://neon.tech/docs/guides/neon-auth

-- Up migration
-- Create neon_auth schema
CREATE SCHEMA IF NOT EXISTS neon_auth;

-- Create a table for syncing users from Neon Auth
-- This table will store user data that is synced from Neon Auth
CREATE TABLE IF NOT EXISTS neon_auth.users_sync (
    id UUID PRIMARY KEY,
    external_id TEXT NOT NULL,
    provider TEXT NOT NULL,
    email TEXT NOT NULL,
    username TEXT,
    display_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login TIMESTAMPTZ
);

-- Create index on external_id and provider
CREATE INDEX IF NOT EXISTS neon_auth_users_sync_external_id_provider_idx ON neon_auth.users_sync (external_id, provider);

-- Create function to sync user data to application users table
CREATE OR REPLACE FUNCTION neon_auth.sync_user_to_app()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if user already exists in application users table
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE email = NEW.email) THEN
        -- Insert new user into the application users table
        INSERT INTO public.users (
            username,
            email,
            password_hash,
            display_name,
            avatar_url,
            email_verified
        ) VALUES (
            COALESCE(NEW.username, NEW.email),
            NEW.email,
            'NEON_AUTH_MANAGED', -- Password is managed by Neon Auth
            COALESCE(NEW.display_name, NEW.username, NEW.email),
            NEW.avatar_url,
            TRUE
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to sync user data when a new user is added to neon_auth.users_sync
CREATE OR REPLACE TRIGGER neon_auth_user_sync_trigger
AFTER INSERT ON neon_auth.users_sync
FOR EACH ROW
EXECUTE FUNCTION neon_auth.sync_user_to_app();

-- Down migration
-- This will be executed when rolling back the migration
-- DROP TRIGGER IF EXISTS neon_auth_user_sync_trigger ON neon_auth.users_sync;
-- DROP FUNCTION IF EXISTS neon_auth.sync_user_to_app();
-- DROP INDEX IF EXISTS neon_auth_users_sync_external_id_provider_idx;
-- DROP TABLE IF EXISTS neon_auth.users_sync;
-- DROP SCHEMA IF EXISTS neon_auth; 