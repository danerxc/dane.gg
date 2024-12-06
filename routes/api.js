import express from 'express';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import blogService from '../services/blog.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

let lastCheck = 0;
let cachedLastfm = {};

const STATUS_FILE = path.join(__dirname, '../data/serviceStatus.json');
const DISCORD_STATUS_FILE = path.join(__dirname, '../data/discordStatus.json');
const LATEST_TWEET_FILE = path.join(__dirname, '../data/latestTweet.json');

let lastStatusCheck = 0;
let cachedDiscordStatus = { status: 0, lastUpdate: null };

let lastServicesCheck = 0;
let cachedServices = { services: {} };

let cachedTweet = null;
let lastTweetCheck = 0;

// Discord Status
router.get('/status', async (req, res) => {
  try {
    if (Date.now() - lastStatusCheck > 7500) {
      lastStatusCheck = Date.now();
      try {
        const data = JSON.parse(await fs.readFile(DISCORD_STATUS_FILE, 'utf8'));
        cachedDiscordStatus = data;
      } catch (err) {
        if (err.code !== 'ENOENT') throw err;
      }
    }
    res.json(cachedDiscordStatus);
  } catch (err) {
    console.error('Discord status fetch error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Services Status
router.get('/services/status', async (req, res) => {
  try {
    if (Date.now() - lastServicesCheck > 7500) {
      lastServicesCheck = Date.now();
      try {
        const data = JSON.parse(await fs.readFile(STATUS_FILE, 'utf8'));
        cachedServices = data;
      } catch (err) {
        if (err.code !== 'ENOENT') throw err;
      }
    }
    res.json(cachedServices.services);
  } catch (err) {
    console.error('Status fetch error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Now playing
router.get('/nowplaying', (req, res) => {
    res.header('Access-Control-Allow-Origin', '*');
    if (Date.now() - lastCheck > 7500) {
        lastCheck = Date.now();
        const username = process.env.LASTFM_USERNAME;
        const apiKey = process.env.LASTFM_API_KEY;
        fetch(`http://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${username}&api_key=${apiKey}&format=json`)
            .then(response => response.json())
            .then(({ recenttracks }) => {
                if (typeof recenttracks !== 'object') return res.json(cachedLastfm);
                cachedLastfm = recenttracks.track[0];
                res.json(cachedLastfm);
            })
            .catch(err => {
                console.error(err);
                res.status(500).json({ error: 'Failed to fetch data from Last.fm' });
            });
    } else {
        res.json(cachedLastfm);
    }
});

// Latest tweet endpoint
router.get('/latest-tweet', async (req, res) => {
  try {
    // Only return cached tweet if it exists AND cache isn't expired
    if (cachedTweet && Date.now() - lastTweetCheck < 60000) {
      return res.json(cachedTweet);
    }

    // Cache is expired or doesn't exist, read from file
    const data = await fs.readFile(LATEST_TWEET_FILE, 'utf8');
    const tweet = JSON.parse(data);

    // Update cache and timestamp
    cachedTweet = tweet;
    lastTweetCheck = Date.now();

    res.json(tweet);
  } catch (err) {
    console.error('Failed to fetch tweet:', err);
    if (cachedTweet) {
      res.json(cachedTweet);
    } else {
      res.status(500).json({ error: 'Failed to fetch tweet' });
    }
  }
});

export default router;