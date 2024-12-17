import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import projectService from '../services/projects.js';

const router = express.Router();

router.get('/', async (req, res, next) => {
    try {
        const projects = await projectService.getAllProjects();
        res.json(projects);
    } catch (err) {
        next(err);
    }
});

router.get('/category/:categoryId', async (req, res, next) => {
    try {
        const projects = await projectService.getProjectsByCategory(req.params.categoryId);
        res.json(projects);
    } catch (err) {
        next(err);
    }
});

router.get('/featured', async (req, res, next) => {
    try {
        const projects = await projectService.getFeaturedProjects();
        res.json(projects);
    } catch (err) {
        next(err);
    }
});

// Protected routes
router.post('/', authenticateToken, async (req, res) => {
    if (!req.user.isAdmin) {
        return res.status(403).json({ message: 'Access denied' });
    }
    try {
        const project = await projectService.createProject(req.body);
        res.status(201).json(project);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/:id', authenticateToken, async (req, res) => {
    if (!req.user.isAdmin) {
        return res.status(403).json({ message: 'Access denied' });
    }
    try {
        const project = await projectService.updateProject(req.params.id, req.body);
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        res.json(project);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/:id', authenticateToken, async (req, res) => {
    if (!req.user.isAdmin) {
        return res.status(403).json({ message: 'Access denied' });
    }
    try {
        const success = await projectService.deleteProject(req.params.id);
        if (!success) {
            return res.status(404).json({ error: 'Project not found' });
        }
        res.json({ message: 'Project deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/categories', authenticateToken, async (req, res) => {
    if (!req.user.isAdmin) {
        return res.status(403).json({ message: 'Access denied' });
    }
    try {
        const categories = await projectService.getCategories();
        res.json(categories);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/category', authenticateToken, async (req, res) => {
    if (!req.user.isAdmin) {
        return res.status(403).json({ message: 'Access denied' });
    }
    try {
        const category = await projectService.createCategory(req.body.name);
        res.status(201).json(category);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/category/:id', authenticateToken, async (req, res) => {
    if (!req.user.isAdmin) {
        return res.status(403).json({ message: 'Access denied' });
    }
    try {
        const category = await projectService.updateCategory(req.params.id, req.body.name);
        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }
        res.json(category);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/category/:id', authenticateToken, async (req, res) => {
    if (!req.user.isAdmin) {
        return res.status(403).json({ message: 'Access denied' });
    }
    try {
        const success = await projectService.deleteCategory(req.params.id);
        if (!success) {
            return res.status(404).json({ error: 'Category not found' });
        }
        res.json({ message: 'Category deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;