import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import path, { dirname } from 'path';
import ALLOWED_SERVICES from '../config/service_monitoring.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default class WebhooksController {
    constructor() {
        this.STATUS_FILE = path.join(__dirname, '../data/serviceStatus.json');
        this.DISCORD_STATUS_FILE = path.join(__dirname, '../data/discordStatus.json');
        this.LATEST_TWEET_FILE = path.join(__dirname, '../data/latestTweet.json');
    }

    validateAuth(req, res, next) {
        const authHeader = req.headers.authorization;
        const expectedToken = process.env.WEBHOOK_AUTH_TOKEN;
        const expectedAuth = `Bearer ${expectedToken}`;

        if (!authHeader || authHeader !== expectedAuth) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        next();
    }

    async updateServiceStatus(req, res) {
        try {
            const { heartbeat, monitor } = req.body;
    
            if (!monitor || !heartbeat) {
                return res.status(400).json({ error: 'Invalid payload format' });
            }
    
            const service = monitor.name.toLowerCase();
            const status = heartbeat.status;
    
            if (!ALLOWED_SERVICES.includes(service)) {
                return res.status(400).json({ error: 'Service not allowed' });
            }
    
            let data;
            try {
                data = JSON.parse(await fs.readFile(this.STATUS_FILE, 'utf8'));
            } catch {
                data = {
                    services: {},
                    lastUpdated: new Date().toISOString()
                };
            }
    
            if (!data.services) data.services = {};
    
            data.services[service] = {
                status: status === 1 ? 1 : 0,
                lastUpdate: heartbeat.time || new Date().toISOString(),
            };
    
            data.lastUpdated = new Date().toISOString();
            await fs.writeFile(this.STATUS_FILE, JSON.stringify(data, null, 2));
            res.json({ success: true });
        } catch (err) {
            console.error('Webhook error:', err);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async updateDiscordStatus(req, res) {
        try {
            const { status } = req.body;

            if (typeof status !== 'number' || ![0, 1].includes(status)) {
                return res.status(400).json({ error: 'Status must be 0 or 1' });
            }

            let data = { status: 0, lastUpdate: null };
            try {
                data = JSON.parse(await fs.readFile(this.DISCORD_STATUS_FILE, 'utf8'));
            } catch (err) {
                if (err.code !== 'ENOENT') throw err;
            }

            data = {
                status,
                lastUpdate: new Date().toISOString()
            };

            await fs.writeFile(this.DISCORD_STATUS_FILE, JSON.stringify(data, null, 2));
            res.json({ success: true });
        } catch (err) {
            console.error('Discord status webhook error:', err);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async updateTwitter(req, res) {
        try {
            const { accountName, username, profilePicture, caption, postedTime } = req.body;

            if (!accountName || !username || !caption || !postedTime) {
                return res.status(400).json({ error: 'Invalid payload format' });
            }

            const tweetData = {
                accountName,
                username,
                profilePicture,
                text: caption,
                created_at: postedTime,
                lastUpdate: new Date().toISOString()
            };

            await fs.writeFile(this.LATEST_TWEET_FILE, JSON.stringify(tweetData, null, 2));
            res.json({ success: true });
        } catch (err) {
            console.error('Tweet webhook error:', err);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}