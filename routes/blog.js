const express = require('express');
const router = express.Router();
const blogService = require('../services/blog');
const path = require('path');

// Get all posts
router.get('/posts', async (req, res) => {
    try {
        const posts = await blogService.getAllPosts();
        res.json(posts);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get blog post by slug
router.get('/:slug', async (req, res) => {
    try {
        console.log('slug:', req.params.slug);
        const post = await blogService.getPostBySlug(req.params.slug);
        console.log('post:', post);
        if (!post) {
            return res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
        }
        
        res.render('post', {
            title: post.title,
            content: post.content,
            date: new Date(post.created_at).toLocaleDateString(),
            date_iso: post.created_at,
            reading_time: Math.ceil(post.content.split(' ').length / 200)
        });
    } catch (err) {
        res.status(500).sendFile(path.join(__dirname, 'public', '500.html'));
    }
});

module.exports = router;