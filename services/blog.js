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
                SELECT p.*,
                    COALESCE(
                        json_agg(
                            json_build_object(
                                'id', bt.id,
                                'name', bt.name
                            )
                        ) FILTER (WHERE bt.id IS NOT NULL),
                        '[]'
                    ) as tags
                FROM website.posts p
                LEFT JOIN website.post_tags pt ON p.id = pt.post_id
                LEFT JOIN website.blog_tags bt ON pt.tag_id = bt.id
                WHERE p.published = true
                GROUP BY p.id
                ORDER BY p.created_at DESC
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

    async getAdjacentPosts(currentPostDate, currentPostId, published = true) {
        const query = `
            SELECT id, title, slug, created_at 
            FROM website.posts
            WHERE published = $1
            ORDER BY created_at ASC;
        `;
    
        const { rows } = await pool.query(query, [published]);
        
        const currentIndex = rows.findIndex(post => post.id === currentPostId);
        
        return {
            prev_post: currentIndex > 0 ? rows[currentIndex - 1] : null,
            next_post: currentIndex < rows.length - 1 ? rows[currentIndex + 1] : null
        };
    }

    async getPostBySlug(slug) {
        try {
            const { rows } = await pool.query(
                `SELECT p.*,
                    COALESCE(
                        json_agg(
                            json_build_object(
                                'id', bt.id,
                                'name', bt.name
                            )
                        ) FILTER (WHERE bt.id IS NOT NULL),
                        '[]'
                    ) as tags
                FROM website.posts p
                LEFT JOIN website.post_tags pt ON p.id = pt.post_id 
                LEFT JOIN website.blog_tags bt ON pt.tag_id = bt.id
                WHERE p.slug = $1 AND p.published = true
                GROUP BY p.id`,
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

                marked.use({
                    extensions: [{
                        name: 'underline',
                        level: 'inline',
                        start(src) {
                            const match = src.match(/\+\+/);
                            return match ? match.index : -1;
                        },
                        tokenizer(src) {
                            const match = /^\+\+([^+]+)\+\+/.exec(src);
                            if (match) {
                                return {
                                    type: 'underline',
                                    raw: match[0],
                                    text: match[1],
                                    tokens: []
                                };
                            }
                            return undefined;
                        },
                        renderer(token) {
                            return `<u>${token.text}</u>`;
                        }
                    }]
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
                `SELECT p.*,
                    COALESCE(
                        json_agg(
                            json_build_object(
                                'id', bt.id,
                                'name', bt.name
                            )
                        ) FILTER (WHERE bt.id IS NOT NULL),
                        '[]'
                    ) as tags
                FROM website.posts p
                LEFT JOIN website.post_tags pt ON p.id = pt.post_id
                LEFT JOIN website.blog_tags bt ON pt.tag_id = bt.id
                GROUP BY p.id
                ORDER BY p.created_at DESC`
            );
            return rows;
        } catch (err) {
            throw new Error('Failed to fetch posts: ' + err.message);
        }
    }

    async createPost({ title, content, slug, thumbnail, published, tags }) {
        try {
            const { rows } = await pool.query(
                `INSERT INTO website.posts (title, content, slug, thumbnail, published) 
                 VALUES ($1, $2, $3, $4, $5) 
                 RETURNING *`,
                [title, content, slug, thumbnail, published]
            );

            if (tags?.length) {
                await this.assignTagsToPost(rows[0].id, tags);
            }

            return rows[0] || null;
        } catch (err) {
            throw new Error('Failed to create post: ' + err.message);
        }
    }

    async updatePost(slug, { title, content, thumbnail, published, tags }) {
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

            if (tags?.length && rows[0]) {
                await this.assignTagsToPost(rows[0].id, tags);
            }

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

    async createTag(name) {
        const { rows } = await pool.query(
            'INSERT INTO website.blog_tags (name) VALUES ($1) RETURNING *',
            [name]
        );
        return rows[0];
    }

    async assignTagsToPost(postId, tagIds) {
        try {
            await pool.query(
                'DELETE FROM website.post_tags WHERE post_id = $1',
                [postId]
            );

            for (const tagId of tagIds) {
                await pool.query(
                    'INSERT INTO website.post_tags (post_id, tag_id) VALUES ($1, $2)',
                    [postId, tagId]
                );
            }
            return true;
        } catch (err) {
            throw new Error('Failed to assign tags: ' + err.message);
        }
    }

    async getAllTags() {
        const { rows } = await pool.query('SELECT * FROM website.blog_tags ORDER BY name');
        return rows;
    }

    async deleteTag(id) {
        await pool.query(
            'DELETE FROM website.blog_tags WHERE id = $1',
            [id]
        );
    }
}

export default new BlogService();