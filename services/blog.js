// services/blog.js
const { Pool } = require('pg');
const marked = require('marked');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

class BlogService {
    async getAllPosts() {
        try {
            const { rows } = await pool.query(
                'SELECT id, title, slug, excerpt, created_at FROM blog_posts WHERE published = true ORDER BY created_at DESC'
            );
            return rows;
        } catch (err) {
            throw new Error('Failed to fetch posts: ' + err.message);
        }
    }

    async getPostBySlug(slug) {
        try {
            const { rows } = await pool.query(
                'SELECT * FROM blog_posts WHERE slug = $1 AND published = true',
                [slug]
            );
            
            if (rows.length === 0) {
                return null;
            }

            const post = rows[0];
            post.content = marked(post.content); // Convert Markdown to HTML
            return post;
        } catch (err) {
            throw new Error('Failed to fetch post: ' + err.message);
        }
    }

    async createPost({ title, content, slug, published = true }) {
        try {
            const { rows } = await pool.query(
                `INSERT INTO blog_posts (title, content, slug, published) 
                 VALUES ($1, $2, $3, $4) 
                 RETURNING *`,
                [title, content, slug, published]
            );
            return rows[0];
        } catch (err) {
            throw new Error('Failed to create post: ' + err.message);
        }
    }

    async updatePost(slug, { title, content, published }) {
        try {
            const { rows } = await pool.query(
                `UPDATE blog_posts 
                 SET title = COALESCE($1, title),
                     content = COALESCE($2, content),
                     published = COALESCE($3, published),
                     updated_at = CURRENT_TIMESTAMP
                 WHERE slug = $4
                 RETURNING *`,
                [title, content, published, slug]
            );
            return rows[0] || null;
        } catch (err) {
            throw new Error('Failed to update post: ' + err.message);
        }
    }

    async deletePost(slug) {
        try {
            const { rowCount } = await pool.query(
                'DELETE FROM blog_posts WHERE slug = $1',
                [slug]
            );
            return rowCount > 0;
        } catch (err) {
            throw new Error('Failed to delete post: ' + err.message);
        }
    }
}

module.exports = new BlogService();