import { readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';
import pool from '../db.js';
import requestIp from 'request-ip';
import geoip from 'geoip-lite';
import isbot from 'isbot';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectsDir = join(__dirname, '..', 'public', 'projects');
const projectCategories = readdirSync(projectsDir)
    .filter(dir => !dir.includes('.'))
    .map(dir => `/projects/${dir}`);

// TRACKABLE PAGES
const TRACKABLE_PAGES = [
    '/',
    '/index.html',
    '/about',
    '/about.html',
    '/blog',
    '/blog.html',
    '/projects',
    '/projects.html',
    '/contact',
    '/contact.html',
    ...projectCategories
];

export const trackPageView = async (req, res, next) => {
    res.on('finish', async () => {
        try {
            const is304NotModified = res.statusCode === 304;
            const isSuccessful = (res.statusCode >= 200 && res.statusCode < 300) || is304NotModified;
            
            const fullPath = req.originalUrl || req.url;
            
            const isBlogPost = fullPath.startsWith('/blog/') && !fullPath.endsWith('.html') || !fullPath === '/blog/rss';
            const isProjectPage = fullPath.startsWith('/projects/') && !fullPath.includes('.');
            const isTrackablePage = TRACKABLE_PAGES.includes(fullPath);

            if ((!isTrackablePage && !isBlogPost && !isProjectPage) || 
                !isSuccessful ||
                req.method !== 'GET' || 
                req.path.startsWith('/api/') ||
                req.path.startsWith('/assets/') ||
                isbot(req.get('user-agent'))) {
                return;
            }

            const visitorId = req.cookies.vid || crypto.randomUUID();
            const clientIp = requestIp.getClientIp(req);
            const geo = geoip.lookup(clientIp);
            const referrer = req.get('referrer') || req.get('referer') || null;

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
                VALUES ($1, $2, $3, $4, $5, $6) 
                RETURNING id`,
                [
                    fullPath,
                    visitorId,
                    clientIp,
                    req.get('user-agent'),
                    geo?.country || null,
                    referrer
                ]
            );

        } catch (err) {
            console.error('Error tracking view:', err);
        }
    });

    next();
};

export default trackPageView;