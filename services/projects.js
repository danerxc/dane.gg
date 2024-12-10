import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

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
            throw new Error('Failed to fetch projects by category: ' + err.message);
        }
    }
}

export default new ProjectService();