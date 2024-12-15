import pool from '../db.js';
import { marked } from 'marked';

class BlogService {
    async getPublishedPosts(limit, offset = 0) {
        try {
            const countResult = await pool.query(
                'SELECT COUNT(*) FROM website.posts WHERE published = true'
            );
            const total = parseInt(countResult.rows[0].count);

            const query = `
                SELECT id, title, slug, content, created_at, thumbnail
                FROM website.posts
                WHERE published = true
                ORDER BY created_at DESC
                LIMIT $1 OFFSET $2
            `;
            
            const { rows } = await pool.query(query, [limit, offset]);

            return {
                posts: rows,
                total,
                hasMore: total > offset + limit,
                currentPage: Math.floor(offset / limit) + 1,
                totalPages: Math.ceil(total / limit)
            };
        } catch (err) {
            throw new Error('Failed to fetch posts: ' + err.message);
        }
    }

    async getAllPosts(limit, offset = 0) {
        try {
            const countResult = await pool.query(
                'SELECT COUNT(*) FROM website.posts'
            );
            const total = parseInt(countResult.rows[0].count);

            const query = `
                SELECT id, title, slug, content, created_at, published, thumbnail 
                FROM website.posts 
                ORDER BY created_at DESC
                LIMIT $1 OFFSET $2
            `;
            
            const { rows } = await pool.query(query, [limit, offset]);

            return {
                posts: rows,
                total,
                hasMore: total > offset + limit,
                currentPage: Math.floor(offset / limit) + 1,
                totalPages: Math.ceil(total / limit)
            };
        } catch (err) {
            throw new Error('Failed to fetch posts: ' + err.message);
        }
    }

    async getPostBySlug(slug) {
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
            return post;
        } catch (err) {
            throw new Error('Failed to fetch post: ' + err.message);
        }
    }

    async getAllPostsAdmin() {
        try {
            const { rows } = await pool.query(
                'SELECT * FROM website.posts ORDER BY created_at DESC'
            );
            return rows;
        } catch (err) {
            throw new Error('Failed to fetch posts: ' + err.message);
        }
    }

    async createPost({ title, content, slug, thumbnail, published }) {
        try {
            const { rows } = await pool.query(
                `INSERT INTO website.posts (title, content, slug, thumbnail, published) 
                 VALUES ($1, $2, $3, $4, $5) 
                 RETURNING *`,
                [title, content, slug, thumbnail, published]
            );
            return rows[0];
        } catch (err) {
            throw new Error('Failed to create post: ' + err.message);
        }
    }

    async updatePost(slug, { title, content, thumbnail, published }) {
        try {
            const { rows } = await pool.query(
                `UPDATE website.posts 
                 SET title = COALESCE($1, title),
                     content = COALESCE($2, content),
                     thumbnail = COALESCE($3, thumbnail),
                     published = COALESCE($4, published),
                     updated_at = CURRENT_TIMESTAMP
                 WHERE slug = $5
                 RETURNING *`,
                [title, content, thumbnail, published, slug]
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

export default new BlogService();