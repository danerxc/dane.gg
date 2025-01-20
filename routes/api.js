// =====================================================================
// ALL ROUTES WITHIN ARE PREFIXED WITH /API
// =====================================================================

import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import WidgetsController from '../controllers/widgetsController.js';
import UploadController from '../controllers/uploadController.js';
import BlogController from '../controllers/blogController.js';
import ProjectsController from '../controllers/projectsController.js';
import UsersController from '../controllers/usersController.js';
import StatsController from '../controllers/statsController.js';

const router = express.Router();
const widgetsController = new WidgetsController();
const uploadController = new UploadController();
const blogController = new BlogController();
const projectsController = new ProjectsController();
const usersController = new UsersController();
const statsController = new StatsController();

// =======================
// WIDGET ROUTES 
// =======================
router.get('/status', widgetsController.getDiscordStatus.bind(widgetsController));
router.get('/services/status', widgetsController.getServicesStatus.bind(widgetsController));
router.get('/nowplaying', widgetsController.getNowPlaying.bind(widgetsController));
router.get('/latest-tweet', widgetsController.getLatestTweet.bind(widgetsController));
router.get('/config/weather', widgetsController.getWeatherConfig.bind(widgetsController));

// =======================
// FILE MANAGEMENT ROUTES
// =======================
router.post('/upload', authenticateToken, UploadController.handleFileUpload.bind(uploadController));

// =======================
// USER MANAGEMENT ROUTES
// =======================
router.get('/admin/users', authenticateToken, usersController.getUsers.bind(usersController));
router.post('/admin/users', authenticateToken, usersController.createUser.bind(usersController));
router.put('/admin/users/:id', authenticateToken, usersController.updateUser.bind(usersController));
router.delete('/admin/users/:id', authenticateToken, usersController.deleteUser.bind(usersController));

// =======================
// BLOG ROUTES
// =======================
router.get('/blog/posts/published', blogController.getPublishedPosts.bind(blogController));
router.get('/blog/posts', authenticateToken, blogController.getPosts.bind(blogController));
router.post('/blog/posts', authenticateToken, blogController.createPost.bind(blogController));
router.put('/blog/posts/:slug', authenticateToken, blogController.updatePost.bind(blogController));
router.delete('/blog/posts/:slug', authenticateToken, blogController.deletePost.bind(blogController));
router.get('/blog/tags', blogController.getTags.bind(blogController));
router.post('/blog/tags', authenticateToken, blogController.createTag.bind(blogController));
router.post('/blog/posts/:postId/tags', authenticateToken, blogController.assignTagsToPost.bind(blogController));
router.delete('/blog/tags/:id', authenticateToken, blogController.deleteTag.bind(blogController));

// =======================
// PROJECT ROUTES 
// =======================
router.get('/projects/', projectsController.getAllProjects.bind(projectsController));
router.get('/projects/category/:categoryId', projectsController.getProjectsByCategory.bind(projectsController));
router.get('/projects/featured', projectsController.getFeaturedProjects.bind(projectsController));

// - PROJECT MANAGEMENT ROUTES
router.get('/projects/admin', authenticateToken, projectsController.getAllProjectsAdmin.bind(projectsController));
router.post('/projects/', authenticateToken, projectsController.createProject.bind(projectsController));
router.put('/projects/:id', authenticateToken, projectsController.updateProject.bind(projectsController));
router.delete('/projects/:id', authenticateToken, projectsController.deleteProject.bind(projectsController));
router.put('/projects/:id/order', authenticateToken, projectsController.updateProjectOrder.bind(projectsController));
router.put('/projects/:id/category-order', authenticateToken, projectsController.updateProjectCategoryAndOrder.bind(projectsController));

// - CATEGORY MANAGEMENT ROUTES
router.get('/projects/categories', projectsController.getCategories.bind(projectsController));
router.post('/projects/category', authenticateToken, projectsController.createCategory.bind(projectsController));
router.put('/projects/category/:id', authenticateToken, projectsController.updateCategory.bind(projectsController));
router.delete('/projects/category/:id', authenticateToken, projectsController.deleteCategory.bind(projectsController));

// - TAG MANAGEMENT ROUTES
router.get('/projects/tags', projectsController.getTags.bind(projectsController));
router.post('/projects/tags', authenticateToken, projectsController.createTag.bind(projectsController));
router.put('/projects/tags/:id', authenticateToken, projectsController.updateTag.bind(projectsController));
router.delete('/projects/tags/:id', authenticateToken, projectsController.deleteTag.bind(projectsController));

// - PROJECT TAG ASSIGNMENT ROUTES
router.post('/projects/:projectId/tags', authenticateToken, projectsController.assignTagsToProject.bind(projectsController));
router.delete('/projects/:projectId/tags/:tagId', authenticateToken, projectsController.removeTagFromProject.bind(projectsController));

// =======================
// STATS ROUTES
// =======================
router.get('/web-stats', statsController.getPublicStats.bind(statsController));
router.get('/stats', authenticateToken, statsController.getStats.bind(statsController));

export default router;