const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const ALLOWED_SERVICES = require('../config/service_monitoring');

const STATUS_FILE = path.join(__dirname, '../data/serviceStatus.json');
const DISCORD_STATUS_FILE = path.join(__dirname, '../data/discordStatus.json');

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const expectedToken = process.env.WEBHOOK_AUTH_TOKEN;
  const expectedAuth = `Bearer ${expectedToken}`;

  if (!authHeader || authHeader !== expectedAuth) {
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

router.post('/status/update', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;

    console.log(status);
    
    if (typeof status !== 'number' || ![0, 1].includes(status)) {
      return res.status(400).json({ error: 'Status must be 0 or 1' });
    }

    let data = { status: 0, lastUpdate: null };
    console.log(data);
    try {
      data = JSON.parse(await fs.readFile(DISCORD_STATUS_FILE, 'utf8'));
    } catch (err) {
      if (err.code !== 'ENOENT') throw err;
    }

    data = {
      status,
      lastUpdate: new Date().toISOString()
    };

    await fs.writeFile(DISCORD_STATUS_FILE, JSON.stringify(data, null, 2));

    res.json({ success: true });
  } catch (err) {
    console.error('Discord status webhook error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;