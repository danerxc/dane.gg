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
              return res.status(404).render('404');
          }
  
          const { prev_post, next_post } = await blogService.getAdjacentPosts(
              post.created_at,
              post.id
          );
          
          res.render('post', {
              title: post.title,
              content: post.content,
              date: new Date(post.created_at).toLocaleDateString(),
              date_iso: post.created_at,
              reading_time: Math.ceil(post.content.split(' ').length / 200),
              tags: post.tags,
              prev_post,
              next_post
          });
      } catch (err) {
          console.error(err);
          res.status(500).render('500');
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
          const { title, content, slug, thumbnail, published, tags } = req.body;
          const post = await blogService.createPost({ 
            title, 
            content, 
            slug, 
            thumbnail, 
            published,
            tags: tags?.map(t => t.id)
          });
          res.status(201).json(post);
        } catch (err) {
          res.status(500).json({ error: err.message });
        }
      }
      
      async updatePost(req, res) {
        try {
          const { title, content, thumbnail, published, tags } = req.body;
          const post = await blogService.updatePost(req.params.slug, { 
            title, 
            content, 
            thumbnail, 
            published,
            tags: tags?.map(t => t.id)
          });
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

      async getTags(req, res) {
        try {
            const tags = await blogService.getAllTags();
            res.json(tags);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    async createTag(req, res) {
        try {
            const tag = await blogService.createTag(req.body.name);
            res.status(201).json(tag);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    async assignTagsToPost(req, res) {
        try {
            await blogService.assignTagsToPost(req.params.postId, req.body.tagIds);
            res.json({ message: 'Tags assigned successfully' });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    async deleteTag(req, res) {
      try {
          const { id } = req.params;
          await blogService.deleteTag(id);
          res.json({ message: 'Tag deleted successfully' });
      } catch (err) {
          console.error('Error deleting tag:', err);
          res.status(500).json({ error: err.message });
      }
  }
}