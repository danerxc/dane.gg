import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import statsService from '../services/stats.js';

const router = express.Router();

router.get('/stats', authenticateToken, async (req, res) => {
    try {
        const stats = await statsService.getVisitorStats(req.query.period);
        res.json(stats);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;