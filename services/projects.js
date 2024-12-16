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

    async getProjectsByCategory(category) {
        try {
            const { rows: projects } = await pool.query(
                'SELECT * FROM website.projects WHERE category = $1 ORDER BY created_at DESC',
                [category]
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

    async createProject(projectData) {
        const { title, description, category, featured, image_url, project_url, project_text, repo_url, repo_text } = projectData;
        const { rows } = await pool.query(
            `INSERT INTO website.projects 
            (title, description, category, featured, image_url, project_url, project_text, repo_url, repo_text) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
            RETURNING *`,
            [title, description, category, featured, image_url, project_url, project_text, repo_url, repo_text]
        );
        return rows[0];
    }

    async updateProject(id, projectData) {
        const { title, description, category, featured, image_url, project_url, project_text, repo_url, repo_text } = projectData;
        const { rows } = await pool.query(
            `UPDATE website.projects 
            SET title = $1, description = $2, category = $3, featured = $4, 
                image_url = $5, project_url = $6, project_text = $7, repo_url = $8, repo_text = $9
            WHERE id = $10 
            RETURNING *`,
            [title, description, category, featured, image_url, project_url, project_text, repo_url, repo_text, id]
        );
        return rows[0];
    }

    async deleteProject(id) {
        const { rowCount } = await pool.query('DELETE FROM website.projects WHERE id = $1', [id]);
        return rowCount > 0;
    }
}

export default new ProjectService();