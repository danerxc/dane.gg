import statsService from '../services/stats.js';

export default class StatsController {
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