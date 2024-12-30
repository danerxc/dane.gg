// =====================================================================
// ALL ROUTES WITHIN ARE PREFIXED WITH /AUTH
// =====================================================================

import express from 'express';
import { 
  login, 
  getCurrentUser,
  checkUsernameAvailability,
  updateAccountUsername,
  updateAccountPassword,
  generateTOTPSecret,
  verifyAndEnableTOTP,
  disableTOTP,
  resetUserTOTP,
} from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// =======================
// AUTHENTICATION ROUTES
// =======================
router.post('/login', login);

// =======================
// USER-ONLY MANAGEMENT ROUTES
// =======================
router.get('/account/me', authenticateToken, getCurrentUser);
router.get('/account/check-username', authenticateToken, checkUsernameAvailability);
router.put('/account/username', authenticateToken, updateAccountUsername);
router.put('/account/password', authenticateToken, updateAccountPassword);

// =======================
// USER-ONLY 2FA ROUTES
// =======================
router.post('/account/2fa/generate', authenticateToken, generateTOTPSecret);
router.post('/account/2fa/verify', authenticateToken, verifyAndEnableTOTP);
router.post('/account/2fa/disable', authenticateToken, disableTOTP);
router.post('/account/:userId/reset-2fa', authenticateToken, resetUserTOTP);

export default router;