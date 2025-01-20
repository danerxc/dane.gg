-- Create application user if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_user WHERE usename = 'dane_gg') THEN
        CREATE USER dane_gg WITH PASSWORD 'your_secure_password';
    END IF;
END
$$;

-- Create schema first
CREATE SCHEMA IF NOT EXISTS website;

-- Grant usage on schema
GRANT USAGE ON SCHEMA website TO dane_gg;

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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    totp_secret TEXT,
    totp_enabled BOOLEAN DEFAULT false
    CONSTRAINT valid_username CHECK (username ~ '^[a-zA-Z0-9_-]{3,50}$'),
    CONSTRAINT valid_password CHECK (char_length(password_hash) >= 60)
);

CREATE TABLE website.posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(280) NOT NULL UNIQUE,
    content TEXT NOT NULL,
    thumbnail VARCHAR(255),
    published BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT title_length CHECK (char_length(title) >= 3),
    CONSTRAINT valid_slug CHECK (slug ~ '^[a-z0-9-]+$'),
    CONSTRAINT content_not_empty CHECK (char_length(content) > 0)
);

CREATE TABLE website.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    message_type VARCHAR(50) NOT NULL,
    message_color VARCHAR(50),
    client_uuid UUID,
    CONSTRAINT content_not_empty CHECK (char_length(content) > 0)
);

-- Categories table must be created before projects table due to foreign key
CREATE TABLE website.project_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE website.projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    category_id UUID NOT NULL,
    featured BOOLEAN DEFAULT false,
    image_url VARCHAR(255),
    project_url VARCHAR(255),
    project_text VARCHAR(50) DEFAULT 'View Project',
    repo_url VARCHAR(255),
    repo_text VARCHAR(50) DEFAULT 'View Repository',
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_project_category 
        FOREIGN KEY (category_id) 
        REFERENCES website.project_categories(id)
        ON DELETE RESTRICT
);

-- Create the tags table
CREATE TABLE website.tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(50) NOT NULL,
    color VARCHAR(7) NOT NULL, -- Hex code for the color
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create the project_tags table for the many-to-many relationship
CREATE TABLE website.project_tags (
    project_id UUID REFERENCES website.projects(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES website.tags(id) ON DELETE CASCADE,
    PRIMARY KEY (project_id, tag_id)
);

CREATE TABLE IF NOT EXISTS website.page_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    page_path VARCHAR(255) NOT NULL,
    visitor_id VARCHAR(36) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    country_code VARCHAR(2),
    referrer TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create tags table
CREATE TABLE IF NOT EXISTS website.blog_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create post_tags junction table
CREATE TABLE IF NOT EXISTS website.post_tags (
    post_id UUID REFERENCES website.posts(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES website.blog_tags(id) ON DELETE CASCADE,
    PRIMARY KEY (post_id, tag_id)
);

-- Insert tags
INSERT INTO website.tags (title, color) VALUES
('JavaScript', '#F0DB4F'),
('Node.js', '#43853D'),
('Express', '#000000'),
('React', '#61DAFB'),
('CSS', '#2965f1'),
('HTML', '#e34c26');

-- Rest of schema with explicit references
CREATE INDEX idx_posts_slug ON website.posts(slug);
CREATE INDEX idx_posts_published ON website.posts(published) WHERE published = true;
CREATE INDEX idx_messages_client_uuid ON website.messages(client_uuid);
CREATE INDEX idx_messages_timestamp ON website.messages(timestamp);
CREATE INDEX idx_projects_featured ON website.projects(featured);
CREATE INDEX idx_projects_category_id ON website.projects(category_id);
CREATE INDEX idx_categories_name ON website.project_categories(name);
CREATE INDEX idx_page_views_visitor_id ON website.page_views(visitor_id);
CREATE INDEX idx_page_views_created_at ON website.page_views(created_at);
CREATE INDEX idx_projects_display_order ON website.projects(category_id, display_order);

-- Grant permissions on all existing tables
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA website TO dane_gg;

-- Grant permissions on sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA website TO dane_gg;

-- Set default permissions for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA website 
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO dane_gg;

-- Set default permissions for future sequences
ALTER DEFAULT PRIVILEGES IN SCHEMA website 
GRANT USAGE, SELECT ON SEQUENCES TO dane_gg;

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