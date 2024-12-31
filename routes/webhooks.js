// =====================================================================
// ALL ROUTES WITHIN ARE PREFIXED WITH /WEBHOOKS
// =====================================================================

import express from 'express';
import WebhooksController from '../controllers/webhooksController.js';

const router = express.Router();
const webhooksController = new WebhooksController();

// =======================
// SERVICE STATUS WEBHOOK
// =======================
router.post('/services/update', 
    webhooksController.validateAuth.bind(webhooksController),
    webhooksController.updateServiceStatus.bind(webhooksController)
);

// =======================
// DISCORD STATUS WEBHOOK
// =======================
router.post('/status/update',
    webhooksController.validateAuth.bind(webhooksController),
    webhooksController.updateDiscordStatus.bind(webhooksController)
);

// =======================
// TWITTER STATUS WEBHOOK
// =======================
router.post('/twitter/update',
    webhooksController.validateAuth.bind(webhooksController),
    webhooksController.updateTwitter.bind(webhooksController)
);

export default router;