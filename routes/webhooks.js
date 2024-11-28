const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const ALLOWED_SERVICES = require('../config/services');

const STATUS_FILE = path.join(__dirname, '../data/serviceStatus.json');

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const expectedToken = process.env.WEBHOOK_AUTH_TOKEN;

  if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

router.post('/services/update', authMiddleware, async (req, res) => {
  try {
    const { heartbeat, monitor } = req.body;
    
    if (!monitor || !heartbeat) {
      return res.status(400).json({ error: 'Invalid payload format' });
    }

    const service = monitor.name.toLowerCase().replace(/\s+\(website\)/i, '');
    const status = heartbeat.status;

    if (!ALLOWED_SERVICES.includes(service)) {
      return res.status(400).json({ error: 'Service not allowed' });
    }

    const data = JSON.parse(await fs.readFile(STATUS_FILE, 'utf8'));
    
    data.services[service] = {
      status: status === 1 ? 1 : 0,
      lastUpdate: new Date().toISOString(),
      message: heartbeat.msg
    };

    await fs.writeFile(STATUS_FILE, JSON.stringify(data, null, 2));

    res.json({ success: true });
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;