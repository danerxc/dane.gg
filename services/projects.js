import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

class ProjectService {
    async getAllProjects() {
        try {
            const { rows } = await pool.query(
                'SELECT * FROM website.projects ORDER BY created_at DESC'
            );
            return rows;
        } catch (err) {
            throw new Error('Failed to fetch projects: ' + err.message);
        }
    }

    async getFeaturedProjects() {
        try {
            const { rows } = await pool.query(
                'SELECT * FROM website.projects WHERE featured = true ORDER BY created_at DESC'
            );
            return rows;
        } catch (err) {
            throw new Error('Failed to fetch featured projects: ' + err.message);
        }
    }

    async getProjectsByCategory(category) {
        try {
            const { rows } = await pool.query(
                'SELECT * FROM website.projects WHERE category = $1 ORDER BY created_at DESC',
                [category]
            );
            return rows;
        } catch (err) {
            throw new Error('Failed to fetch projects by category: ' + err.message);
        }
    }
}

// Export a single instance
export default new ProjectService();