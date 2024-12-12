import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import blogService from '../services/blog.js';

const router = express.Router();

router.get('/posts', authenticateToken, getPosts);
router.get('/posts/published', getPublishedPosts);
router.post('/posts', authenticateToken, createPost);
router.put('/posts/:slug', authenticateToken, updatePost);
router.delete('/posts/:slug', authenticateToken, deletePost);

async function getPosts(req, res) {
  try {
    const result = await blogService.getAllPostsAdmin();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getPublishedPosts(req, res) {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;
    const result = await blogService.getPublishedPosts(limit, offset);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function createPost(req, res) {
  try {
    const { title, content, slug, published } = req.body;
    const post = await blogService.createPost({ title, content, slug, published });
    res.status(201).json(post);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function updatePost(req, res) {
  try {
    const { title, content, published } = req.body;
    const post = await blogService.updatePost(req.params.slug, { title, content, published });
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function deletePost(req, res) {
  try {
    const success = await blogService.deletePost(req.params.slug);
    if (!success) {
      return res.status(404).json({ error: 'Post not found' });
    }
    res.json({ message: 'Post deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export default router;