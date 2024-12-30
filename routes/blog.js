// =====================================================================
// ALL ROUTES WITHIN ARE PREFIXED WITH /BLOG
// =====================================================================
import express from 'express';
import BlogController from '../controllers/blogController.js';

const router = express.Router();
const blogController = new BlogController();

router.get('/:slug', blogController.getPostBySlug.bind(blogController));

export default router;