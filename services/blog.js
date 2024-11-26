const { Pool } = require('pg');
const { marked } = require('marked');
const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

class BlogService {
    async getAllPosts() {
        try {
            const { rows } = await pool.query(
                'SELECT id, title, slug, content, created_at FROM website.posts WHERE published = true ORDER BY created_at DESC'
            );
            return rows;
        } catch (err) {
            throw new Error('Failed to fetch posts: ' + err.message);
        }
    }

    async getPostBySlug(slug) {
        console.log('slug:', slug);
        try {
            const { rows } = await pool.query(
                'SELECT * FROM website.posts WHERE slug = $1 AND published = true',
                [slug]
            );
            
            if (rows.length === 0) {
                return null;
            }

            const post = rows[0];
            try {
                marked.setOptions({
                    gfm: true,
                    breaks: true,
                    sanitize: true
                });
                post.content = marked.parse(post.content);
            } catch (markdownError) {
                console.error('Markdown parsing error:', markdownError);
                post.content = post.content;
            }
            console.log('post:', post);
            return post;
        } catch (err) {
            throw new Error('Failed to fetch post: ' + err.message);
        }
    }

    async createPost({ title, content, slug, published = true }) {
        try {
            const { rows } = await pool.query(
                `INSERT INTO website.posts (title, content, slug, published) 
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
                `UPDATE website.posts 
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
                'DELETE FROM website.posts WHERE slug = $1',
                [slug]
            );
            return rowCount > 0;
        } catch (err) {
            throw new Error('Failed to delete post: ' + err.message);
        }
    }
}

module.exports = new BlogService();