import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import path, { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default class WidgetsController {
    constructor() {
        this.STATUS_FILE = path.join(__dirname, '../data/serviceStatus.json');
        this.DISCORD_STATUS_FILE = path.join(__dirname, '../data/discordStatus.json');
        this.LATEST_TWEET_FILE = path.join(__dirname, '../data/latestTweet.json');
        
        // Cache variables
        this.lastCheck = 0;
        this.cachedLastfm = {};
        this.lastStatusCheck = 0;
        this.cachedDiscordStatus = { status: 0, lastUpdate: null };
        this.lastServicesCheck = 0;
        this.cachedServices = { services: {} };
        this.cachedTweet = null;
        this.lastTweetCheck = 0;
    }

    async getDiscordStatus(req, res) {
        try {
            if (Date.now() - this.lastStatusCheck > 7500) {
                this.lastStatusCheck = Date.now();
                try {
                    const data = JSON.parse(await fs.readFile(this.DISCORD_STATUS_FILE, 'utf8'));
                    this.cachedDiscordStatus = data;
                } catch (err) {
                    if (err.code !== 'ENOENT') throw err;
                }
            }
            res.json(this.cachedDiscordStatus);
        } catch (err) {
            console.error('Discord status fetch error:', err);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async getServicesStatus(req, res) {
        try {
            if (Date.now() - this.lastServicesCheck > 7500) {
                this.lastServicesCheck = Date.now();
                try {
                    const data = JSON.parse(await fs.readFile(this.STATUS_FILE, 'utf8'));
                    this.cachedServices = data;
                } catch (err) {
                    if (err.code !== 'ENOENT') throw err;
                }
            }
            res.json(this.cachedServices.services);
        } catch (err) {
            console.error('Status fetch error:', err);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async getNowPlaying(req, res) {
        res.header('Access-Control-Allow-Origin', '*');
        if (Date.now() - this.lastCheck > 7500) {
            this.lastCheck = Date.now();
            const username = process.env.LASTFM_USERNAME;
            const apiKey = process.env.LASTFM_API_KEY;
            try {
                const response = await fetch(`http://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${username}&api_key=${apiKey}&format=json`);
                const { recenttracks } = await response.json();
                if (typeof recenttracks !== 'object') return res.json(this.cachedLastfm);
                this.cachedLastfm = recenttracks.track[0];
                res.json(this.cachedLastfm);
            } catch (err) {
                console.error(err);
                res.status(500).json({ error: 'Failed to fetch data from Last.fm' });
            }
        } else {
            res.json(this.cachedLastfm);
        }
    }

    async getLatestTweet(req, res) {
        try {
            if (this.cachedTweet && Date.now() - this.lastTweetCheck < 60000) {
                return res.json(this.cachedTweet);
            }

            const data = await fs.readFile(this.LATEST_TWEET_FILE, 'utf8');
            const tweet = JSON.parse(data);

            this.cachedTweet = tweet;
            this.lastTweetCheck = Date.now();

            res.json(tweet);
        } catch (err) {
            console.error('Failed to fetch tweet:', err);
            if (this.cachedTweet) {
                res.json(this.cachedTweet);
            } else {
                res.status(500).json({ error: 'Failed to fetch tweet' });
            }
        }
    }

    getWeatherConfig(req, res) {
        const defaultWeather = (process.env.DEFAULT_WEATHER || 'rain').toLowerCase();
        res.json({ defaultWeather });
    }
}