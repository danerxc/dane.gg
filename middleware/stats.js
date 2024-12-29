import pool from '../db.js';
import requestIp from 'request-ip';
import geoip from 'geoip-lite';
import isbot from 'isbot';

export const trackPageView = async (req, res, next) => {
    try {
        if (!req.path.match(/\/$|^\/[^.]*$|\.html$/) ||
            req.path.startsWith('/api/') ||
            req.path.startsWith('/admin/') ||
            req.path.startsWith('/assets/')) {
            return next();
        }

        if (isbot(req.get('user-agent'))) {
            return next();
        }

        const visitorId = req.cookies.vid || crypto.randomUUID();
        const clientIp = requestIp.getClientIp(req);
        const geo = geoip.lookup(clientIp);

        if (!req.cookies.vid) {
            res.cookie('vid', visitorId, {
                maxAge: 365 * 24 * 60 * 60 * 1000,
                httpOnly: true,
                sameSite: 'strict'
            });
        }

        await pool.query(
            `INSERT INTO website.page_views 
            (page_path, visitor_id, ip_address, user_agent, country_code, referrer) 
            VALUES ($1, $2, $3, $4, $5, $6)`,
            [
                req.path,
                visitorId,
                clientIp,
                req.get('user-agent'),
                geo?.country || null,
                req.get('referrer')
            ]
        );

        next();
    } catch (err) {
        console.error('Error tracking page view:', err);
        next();
    }
};