import statsService from '../services/stats.js';

export default class StatsController {
    // =================
    // PUBLIC ROUTES 
    // =================
    async getPublicStats(req, res) {
        try {
            const stats = await statsService.getPublicStats();
            res.json(stats);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // =================
    // PROTECTED ROUTES 
    // =================
    async getStats(req, res) {
        try {
            const stats = await statsService.getVisitorStats(req.query.period);
            res.json(stats);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
}