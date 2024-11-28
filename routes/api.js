const express = require('express');
const router = express.Router();
const blogService = require('../services/blog');
const fs = require('fs').promises;
const path = require('path');

let lastCheck = 0;
let cachedLastfm = {};

const STATUS_FILE = path.join(__dirname, '../data/serviceStatus.json');

// Status
router.get('/status', (req, res) => {
    res.json({ status: 'online' });
});

// Services Status
router.get('/services/status', async (req, res) => {
  try {
    const data = JSON.parse(await fs.readFile(STATUS_FILE, 'utf8'));
    res.json(data.services);
  } catch (err) {
    console.error('Status fetch error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

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

module.exports = router;