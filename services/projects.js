import pool from '../db.js';

class ProjectService {
    async getAllProjects() {
        try {
            const { rows: projects } = await pool.query(
                'SELECT * FROM website.projects ORDER BY created_at DESC'
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
            } else {
                projects.forEach(project => {
                    project.tags = [];
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
                'SELECT * FROM website.projects WHERE featured = true ORDER BY created_at DESC'
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
            } else {
                projects.forEach(project => {
                    project.tags = [];
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
                `SELECT p.*, c.name as category_name 
                 FROM website.projects p 
                 JOIN website.categories c ON p.category_id = c.id 
                 WHERE p.category_id = $1 
                 ORDER BY p.created_at DESC`,
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
                });
            } else {
                projects.forEach(project => {
                    project.tags = [];
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
            repo_text 
        } = projectData;
        
        const { rows } = await pool.query(
            `INSERT INTO website.projects 
            (title, description, category_id, featured, image_url, project_url, project_text, repo_url, repo_text) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
            RETURNING *`,
            [title, description, category_id, featured, image_url, project_url, project_text, repo_url, repo_text]
        );
        return rows[0];
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
}

const projectService = new ProjectService();
export default projectService;