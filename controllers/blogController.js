import blogService from '../services/blog.js';
import { fileURLToPath } from 'url';
import path, { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default class BlogController {

    // =================
    // PUBLIC ROUTES 
    // =================

    async getPublishedPosts(req, res) {
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

    async getPostBySlug(req, res) {
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

    // =================
    // PROTECTED MANAGEMENT ROUTES
    // =================

    async getPosts(req, res) {
        try {
          const result = await blogService.getAllPostsAdmin();
          res.json(result);
        } catch (err) {
          res.status(500).json({ error: err.message });
        }
      }
      
      async createPost(req, res) {
        try {
          const { title, content, slug, thumbnail, published } = req.body;
          const post = await blogService.createPost({ title, content, slug, thumbnail, published });
          res.status(201).json(post);
        } catch (err) {
          res.status(500).json({ error: err.message });
        }
      }
      
      async updatePost(req, res) {
        try {
          const { title, content, thumbnail, published } = req.body;
          const post = await blogService.updatePost(req.params.slug, { title, content, thumbnail, published });
          if (!post) {
            return res.status(404).json({ error: 'Post not found' });
          }
          res.json(post);
        } catch (err) {
          res.status(500).json({ error: err.message });
        }
      }
      
      async deletePost(req, res) {
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
}