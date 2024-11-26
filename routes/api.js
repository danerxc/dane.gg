// routes/api.js
const express = require('express');
const router = express.Router();
const blogService = require('../services/blog');

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

// Get all posts
router.get('/posts', async (req, res) => {
    try {
        const posts = await blogService.getAllPosts();
        res.json(posts);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get single post
router.get('/posts/:slug', async (req, res) => {
    try {
        const post = await blogService.getPostBySlug(req.params.slug);
        if (!post) return res.status(404).json({ error: 'Post not found' });
        res.json(post);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;