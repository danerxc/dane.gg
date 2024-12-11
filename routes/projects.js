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

export default router;