// authRoutes.js - Corrected example
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController'); // Verify this path

// Make sure these functions exist in your authController
router.post('/register', authController.register); 
router.post('/login', authController.login);
router.get('/me', authController.getMe);

// New routes - ensure these functions exist
router.post('/verify-email', authController.verifyEmail);
router.post('/resend-verification', authController.resendVerificationEmail);
router.post('/request-password-reset', authController.requestPasswordReset);
router.post('/reset-password', authController.resetPassword);

module.exports = router;