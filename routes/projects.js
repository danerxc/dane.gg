import express from 'express';
import ProjectService from '../services/projects.js';

const router = express.Router();

router.get('/', async (req, res, next) => {
    try {
        const projects = await ProjectService.getAllProjects();
        res.json(projects);
    } catch (err) {
        next(err);
    }
});

router.get('/category/:category', async (req, res, next) => {
    try {
        const projects = await ProjectService.getProjectsByCategory(req.params.category);
        res.json(projects);
    } catch (err) {
        next(err);
    }
});

router.get('/featured', async (req, res, next) => {
    try {
        const projects = await ProjectService.getFeaturedProjects();
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

export default router;