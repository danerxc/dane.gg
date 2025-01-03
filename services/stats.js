import { raw } from 'express';
import pool from '../db.js';

class StatsService {
    async getVisitorStats(period = '7d') {
        try {
            const periodMap = {
                '24h': 'interval \'24 hours\'',
                '7d': 'interval \'7 days\'',
                '30d': 'interval \'30 days\'',
                'all': 'interval \'100 years\''
            };

            const interval = periodMap[period] || periodMap['7d'];

            const stats = await pool.query(`
                WITH stats AS (
                    SELECT 
                        COUNT(DISTINCT visitor_id) as unique_visitors,
                        COUNT(*) as total_views,
                        COUNT(DISTINCT page_path) as pages_viewed,
                        COUNT(DISTINCT DATE_TRUNC('day', created_at)) as active_days
                    FROM website.page_views 
                    WHERE created_at > (NOW() - ${interval})::timestamp
                )
                SELECT 
                    s.*,
                    (
                        SELECT json_agg(pp)
                        FROM (
                            SELECT page_path, COUNT(*) as views
                            FROM website.page_views
                            WHERE created_at > (NOW() - ${interval})::timestamp
                            GROUP BY page_path
                            ORDER BY COUNT(*) DESC
                            LIMIT 10
                        ) pp
                    ) as popular_pages,
                    (
                        SELECT json_agg(c)
                        FROM (
                            SELECT country_code as country, COUNT(*) as visits
                            FROM website.page_views
                            WHERE created_at > (NOW() - ${interval})::timestamp
                            AND country_code IS NOT NULL
                            GROUP BY country_code
                            ORDER BY COUNT(*) DESC
                        ) c
                    ) as countries,
                    (
                        SELECT json_agg(bp)
                        FROM (
                            SELECT page_path, COUNT(*) as views
                            FROM website.page_views
                            WHERE created_at > (NOW() - ${interval})::timestamp
                            AND page_path LIKE '/blog/%'
                            GROUP BY page_path
                            ORDER BY COUNT(*) DESC
                            LIMIT 10
                        ) bp
                    ) as blog_posts,
                    (
                        SELECT json_agg(dv)
                        FROM (
                            SELECT 
                                DATE_TRUNC('day', created_at)::date as date,
                                COUNT(*) as views,
                                COUNT(DISTINCT visitor_id) as visitors
                            FROM website.page_views
                            WHERE created_at > (NOW() - ${interval})::timestamp
                            GROUP BY DATE_TRUNC('day', created_at)
                            ORDER BY date
                        ) dv
                    ) as daily_views,
                    (
                        SELECT json_agg(ua)
                        FROM (
                            SELECT 
                                user_agent,
                                COUNT(*) as count
                            FROM website.page_views
                            WHERE created_at > (NOW() - ${interval})::timestamp
                            GROUP BY user_agent
                            ORDER BY COUNT(*) DESC
                            LIMIT 10
                        ) ua
                    ) as user_agents,
                    (
                        SELECT json_agg(raw)
                        FROM (
                            SELECT created_at, visitor_id, page_path, country_code, user_agent
                            FROM website.page_views
                            WHERE created_at > (NOW() - ${interval})::timestamp
                            ORDER BY created_at DESC
                            LIMIT 100
                        ) raw
                    ) as raw_data
                FROM stats s;
            `);
            return stats.rows[0] || {
                unique_visitors: 0,
                total_views: 0,
                pages_viewed: 0,
                active_days: 0,
                popular_pages: [],
                blog_posts: [],
                countries: [],
                daily_views: [],
                user_agents: [],
                raw_data: []
            };
        } catch (error) {
            console.error('Stats Service Error:', error);
            throw error;
        }
    }

    async getPublicStats() {
        try {
            const stats = await pool.query(`
                SELECT 
                    COUNT(DISTINCT visitor_id) as unique_visitors,
                    COUNT(*) as total_views
                FROM website.page_views;
            `);
            return stats.rows[0] || {
                unique_visitors: 0,
                total_views: 0,
            };
        } catch (error) {
            console.error('Stats Service Error:', error);
            throw error;
        }
    }
}

export default new StatsService();
