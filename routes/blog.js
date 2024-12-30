import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import blogService from '../services/blog.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

router.get('/:slug', getPostBySlug);

async function getPostBySlug(req, res) {
  try {
    const post = await blogService.getPostBySlug(req.params.slug);
    if (!post) {
      return res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
    }

    res.locals.blogSlug = post.slug;
    
    res.render('post', {
      thumbnail: post.thumbnail,
      title: post.title,
      content: post.content,
      date: new Date(post.created_at).toLocaleDateString(),
      date_iso: post.created_at,
      reading_time: Math.ceil(post.content.split(' ').length / 200)
    });
  } catch (err) {
    res.status(500).sendFile(path.join(__dirname, 'public', '500.html')); 
  }
}

export default router;