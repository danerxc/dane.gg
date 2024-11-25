// routes/api.js
const express = require('express');
const router = express.Router();

// Status endpoint
router.get('/status', (req, res) => {
    res.json({ status: 'online' });
});

// Now playing endpoint
router.get('/now-playing', (req, res) => {
    res.json({
        track: 'Track Name',
        artist: 'Artist Name',
        album: 'Album Name'
    });
});

module.exports = router;