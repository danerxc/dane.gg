import pool from '../db.js';
import { marked } from 'marked';
import { JSDOM } from 'jsdom';
import createDOMPurify from 'dompurify';

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

const ALLOWED_TAGS = ['strong', 'em', 'u', 'strike', 'ul', 'ol', 'li', 'a', 'p'];
const ALLOWED_ATTR = ['href'];

const purifyConfig = {
    ALLOWED_TAGS: ALLOWED_TAGS,
    ALLOWED_ATTR: ALLOWED_ATTR,
    RETURN_DOM_FRAGMENT: false,
    RETURN_DOM: false
};

marked.setOptions({
    gfm: true,
    breaks: true,
    sanitize: false
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

class ProjectService {
    async getAllProjects() {
        try {
            const { rows: projects } = await pool.query(
                'SELECT * FROM website.projects ORDER BY display_order ASC, created_at DESC'
            );

            const projectIds = projects.map(project => project.id);

            if (projectIds.length > 0) {
                const { rows: tags } = await pool.query(
                    `SELECT pt.project_id, t.id, t.title, t.color
                    FROM website.project_tags pt
                    JOIN website.tags t ON pt.tag_id = t.id
                    WHERE pt.project_id = ANY($1::uuid[])`,
                    [projectIds]
                );

                const tagsByProjectId = {};
                tags.forEach(tag => {
                    const projectId = tag.project_id;
                    if (!tagsByProjectId[projectId]) {
                        tagsByProjectId[projectId] = [];
                    }
                    tagsByProjectId[projectId].push({
                        id: tag.id,
                        title: tag.title,
                        color: tag.color
                    });
                });

                projects.forEach(project => {
                    project.tags = tagsByProjectId[project.id] || [];
                    const htmlContent = marked.parse(project.description);
                    project.description = DOMPurify.sanitize(htmlContent, purifyConfig);
                });
            } else {
                projects.forEach(project => {
                    project.tags = [];
                    const htmlContent = marked.parse(project.description);
                    project.description = DOMPurify.sanitize(htmlContent, purifyConfig);
                });
            }

            return projects;
        } catch (err) {
            throw new Error('Failed to fetch projects: ' + err.message);
        }
    }

    async getAllProjectsAdmin() {
        try {
            const { rows: projects } = await pool.query(
                'SELECT * FROM website.projects ORDER BY display_order ASC, created_at DESC'
            );

            const projectIds = projects.map(project => project.id);

            if (projectIds.length > 0) {
                const { rows: tags } = await pool.query(
                    `SELECT pt.project_id, t.id, t.title, t.color
                    FROM website.project_tags pt
                    JOIN website.tags t ON pt.tag_id = t.id
                    WHERE pt.project_id = ANY($1::uuid[])`,
                    [projectIds]
                );

                const tagsByProjectId = {};
                tags.forEach(tag => {
                    const projectId = tag.project_id;
                    if (!tagsByProjectId[projectId]) {
                        tagsByProjectId[projectId] = [];
                    }
                    tagsByProjectId[projectId].push({
                        id: tag.id,
                        title: tag.title,
                        color: tag.color
                    });
                });

                projects.forEach(project => {
                    project.tags = tagsByProjectId[project.id] || [];
                });
            }

            return projects;
        } catch (err) {
            throw new Error('Failed to fetch projects: ' + err.message);
        }
    }

    
    async getFeaturedProjects() {
        try {
            const { rows: projects } = await pool.query(
                'SELECT * FROM website.projects WHERE featured = true ORDER BY display_order ASC, created_at DESC'
            );

            const projectIds = projects.map(project => project.id);

            if (projectIds.length > 0) {
                const { rows: tags } = await pool.query(
                    `SELECT pt.project_id, t.id, t.title, t.color
                    FROM website.project_tags pt
                    JOIN website.tags t ON pt.tag_id = t.id
                    WHERE pt.project_id = ANY($1::uuid[])`,
                    [projectIds]
                );

                const tagsByProjectId = {};
                tags.forEach(tag => {
                    const projectId = tag.project_id;
                    if (!tagsByProjectId[projectId]) {
                        tagsByProjectId[projectId] = [];
                    }
                    tagsByProjectId[projectId].push({
                        id: tag.id,
                        title: tag.title,
                        color: tag.color
                    });
                });

                projects.forEach(project => {
                    project.tags = tagsByProjectId[project.id] || [];
                    const htmlContent = marked.parse(project.description);
                    project.description = DOMPurify.sanitize(htmlContent, purifyConfig);
                });
            } else {
                projects.forEach(project => {
                    project.tags = [];
                    const htmlContent = marked.parse(project.description);
                    project.description = DOMPurify.sanitize(htmlContent, purifyConfig);
                });
            }

            return projects;
        } catch (err) {
            throw new Error('Failed to fetch featured projects: ' + err.message);
        }
    }

    async getProjectsByCategory(categoryId) {
        try {
            const { rows: projects } = await pool.query(
                'SELECT * FROM website.projects WHERE category_id = $1 ORDER BY display_order ASC, created_at DESC',
                [categoryId]
            );

            const projectIds = projects.map(project => project.id);

            if (projectIds.length > 0) {
                const { rows: tags } = await pool.query(
                    `SELECT pt.project_id, t.id, t.title, t.color
                    FROM website.project_tags pt
                    JOIN website.tags t ON pt.tag_id = t.id
                    WHERE pt.project_id = ANY($1::uuid[])`,
                    [projectIds]
                );

                const tagsByProjectId = {};
                tags.forEach(tag => {
                    const projectId = tag.project_id;
                    if (!tagsByProjectId[projectId]) {
                        tagsByProjectId[projectId] = [];
                    }
                    tagsByProjectId[projectId].push({
                        id: tag.id,
                        title: tag.title,
                        color: tag.color
                    });
                });

                projects.forEach(project => {
                    project.tags = tagsByProjectId[project.id] || [];
                    const htmlContent = marked.parse(project.description);
                    project.description = DOMPurify.sanitize(htmlContent, purifyConfig);
                });
            } else {
                projects.forEach(project => {
                    project.tags = [];
                    const htmlContent = marked.parse(project.description);
                    project.description = DOMPurify.sanitize(htmlContent, purifyConfig);
                });
            }

            return projects;
        } catch (err) {
            throw new Error('Failed to fetch projects by category: ' + err.message);
        }
    }

    async createProject(projectData) {
        const {
            title,
            description,
            category_id,
            featured,
            image_url,
            project_url,
            project_text,
            repo_url,
            repo_text,
            tagIds = []
        } = projectData;

        try {
            await pool.query('BEGIN');

            const { rows } = await pool.query(
                `INSERT INTO website.projects 
                (title, description, category_id, featured, image_url, project_url, project_text, repo_url, repo_text) 
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
                RETURNING *`,
                [title, description, category_id, featured, image_url, project_url, project_text, repo_url, repo_text]
            );

            const project = rows[0];

            for (const tagId of tagIds) {
                await pool.query(
                    'INSERT INTO website.project_tags (project_id, tag_id) VALUES ($1, $2)',
                    [project.id, tagId]
                );
            }

            await pool.query('COMMIT');
            return project;
        } catch (err) {
            await pool.query('ROLLBACK');
            throw new Error('Failed to create project: ' + err.message);
        }
    }

    async updateProject(id, projectData) {
        const {
            title,
            description,
            category_id,
            featured,
            image_url,
            project_url,
            project_text,
            repo_url,
            repo_text
        } = projectData;

        const { rows } = await pool.query(
            `UPDATE website.projects 
            SET title = $1, description = $2, category_id = $3, featured = $4, 
                image_url = $5, project_url = $6, project_text = $7, repo_url = $8, repo_text = $9
            WHERE id = $10 
            RETURNING *`,
            [title, description, category_id, featured, image_url, project_url, project_text, repo_url, repo_text, id]
        );
        return rows[0];
    }

    async deleteProject(id) {
        const { rowCount } = await pool.query('DELETE FROM website.projects WHERE id = $1', [id]);
        return rowCount > 0;
    }

    async updateProjectOrder(id, newOrder) {
        try {
            await pool.query('BEGIN');

            const { rows: [project] } = await pool.query(
                'SELECT id, display_order, category_id FROM website.projects WHERE id = $1',
                [id]
            );

            if (!project) {
                throw new Error('Project not found');
            }

            await pool.query(`
                UPDATE website.projects
                SET display_order = CASE
                    WHEN id = $1 THEN $2
                    WHEN display_order >= $2 AND display_order < $3 THEN display_order + 1
                    WHEN display_order <= $2 AND display_order > $3 THEN display_order - 1
                    ELSE display_order
                END
                WHERE category_id = $4
            `, [id, newOrder, project.display_order, project.category_id]);

            await pool.query('COMMIT');
            return true;
        } catch (err) {
            await pool.query('ROLLBACK');
            throw new Error('Failed to update project order: ' + err.message);
        }
    }

    async updateProjectCategoryAndOrder(projectId, { categoryId, newOrder }) {
        try {
          await pool.query('BEGIN');
          
          await pool.query(
            `UPDATE website.projects 
             SET category_id = $1, 
                 display_order = $2
             WHERE id = $3`,
            [categoryId, newOrder, projectId]
          );
      
          await pool.query(
            `UPDATE website.projects 
             SET display_order = display_order + 1
             WHERE category_id = $1 
             AND id != $2
             AND display_order >= $3`,
            [categoryId, projectId, newOrder]
          );
      
          await pool.query('COMMIT');
        } catch (err) {
          await pool.query('ROLLBACK');
          throw new Error('Failed to update project category and order: ' + err.message);
        }
      }

    async getCategories() {
        try {
            const { rows } = await pool.query(
                'SELECT * FROM website.project_categories ORDER BY name'
            );
            return rows;
        } catch (err) {
            throw new Error('Failed to fetch categories: ' + err.message);
        }
    }

    async createCategory(name) {
        try {
            const { rows } = await pool.query(
                'INSERT INTO website.project_categories (name) VALUES ($1) RETURNING *',
                [name]
            );
            return rows[0];
        } catch (err) {
            throw new Error('Failed to create category: ' + err.message);
        }
    }

    async updateCategory(id, name) {
        try {
            const { rows } = await pool.query(
                'UPDATE website.project_categories SET name = $1 WHERE id = $2 RETURNING *',
                [name, id]
            );
            return rows[0];
        } catch (err) {
            throw new Error('Failed to update category: ' + err.message);
        }
    }

    async deleteCategory(id) {
        try {
            const { rowCount } = await pool.query(
                'DELETE FROM website.project_categories WHERE id = $1',
                [id]
            );
            return rowCount > 0;
        } catch (err) {
            throw new Error('Failed to delete category: ' + err.message);
        }
    }

    async getAllTags() {
        try {
            const { rows } = await pool.query(
                'SELECT * FROM website.tags ORDER BY title'
            );
            return rows;
        } catch (err) {
            throw new Error('Failed to fetch tags: ' + err.message);
        }
    }

    async createTag({ title, color }) {
        try {
            const { rows } = await pool.query(
                'INSERT INTO website.tags (title, color) VALUES ($1, $2) RETURNING *',
                [title, color]
            );
            return rows[0];
        } catch (err) {
            throw new Error('Failed to create tag: ' + err.message);
        }
    }

    async updateTag(id, { title, color }) {
        try {
            const { rows } = await pool.query(
                'UPDATE website.tags SET title = $1, color = $2 WHERE id = $3 RETURNING *',
                [title, color, id]
            );
            return rows[0];
        } catch (err) {
            throw new Error('Failed to update tag: ' + err.message);
        }
    }

    async deleteTag(id) {
        try {
            const { rowCount } = await pool.query(
                'DELETE FROM website.tags WHERE id = $1',
                [id]
            );
            return rowCount > 0;
        } catch (err) {
            throw new Error('Failed to delete tag: ' + err.message);
        }
    }

    async assignTagsToProject(projectId, tagIds) {
        try {
            await pool.query('BEGIN');

            await pool.query(
                'DELETE FROM website.project_tags WHERE project_id = $1',
                [projectId]
            );

            for (const tagId of tagIds) {
                await pool.query(
                    'INSERT INTO website.project_tags (project_id, tag_id) VALUES ($1, $2)',
                    [projectId, tagId]
                );
            }

            await pool.query('COMMIT');

            const { rows: projects } = await pool.query(
                `SELECT p.*, array_agg(json_build_object('id', t.id, 'title', t.title, 'color', t.color)) as tags
                 FROM website.projects p
                 LEFT JOIN website.project_tags pt ON p.id = pt.project_id
                 LEFT JOIN website.tags t ON pt.tag_id = t.id
                 WHERE p.id = $1
                 GROUP BY p.id`,
                [projectId]
            );

            return projects[0];
        } catch (err) {
            await pool.query('ROLLBACK');
            throw new Error('Failed to assign tags to project: ' + err.message);
        }
    }

    async removeTagFromProject(projectId, tagId) {
        try {
            const { rowCount } = await pool.query(
                'DELETE FROM website.project_tags WHERE project_id = $1 AND tag_id = $2',
                [projectId, tagId]
            );
            return rowCount > 0;
        } catch (err) {
            throw new Error('Failed to remove tag from project: ' + err.message);
        }
    }
}

const projectService = new ProjectService();
export default projectService;