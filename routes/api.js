const express = require('express');
const router = express.Router();
const blogService = require('../services/blog');
const path = require('path');

// Status
router.get('/status', (req, res) => {
    res.json({ status: 'online' });
});

// Now playing
router.get('/now-playing', (req, res) => {
    res.json({
        track: 'Track Name',
        artist: 'Artist Name',
        album: 'Album Name'
    });
});

module.exports = router;