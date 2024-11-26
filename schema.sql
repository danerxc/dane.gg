-- Create schema first
CREATE SCHEMA IF NOT EXISTS website;

-- Set search path
SET search_path TO website;

-- Verify schema
SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'website';

-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA website;

-- Create tables with explicit schema
CREATE TABLE website.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    is_admin BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE website.posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(280) NOT NULL UNIQUE,
    content TEXT NOT NULL,
    author_id UUID NOT NULL REFERENCES website.users(id),
    published BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT title_length CHECK (char_length(title) >= 3)
);

-- Rest of schema with explicit references
CREATE INDEX idx_posts_slug ON website.posts(slug);
CREATE INDEX idx_posts_author ON website.posts(author_id);
CREATE INDEX idx_posts_published ON website.posts(published) WHERE published = true;

-- Function and trigger
CREATE OR REPLACE FUNCTION website.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_posts_updated_at
    BEFORE UPDATE ON website.posts
    FOR EACH ROW
    EXECUTE FUNCTION website.update_updated_at_column();