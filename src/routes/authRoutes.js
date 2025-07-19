const express = require('express');
const router = express.Router();
const { 
    register,
    login ,
    getMe,
    sendVerificationEmail,
    verifyEmail,
    requestPasswordReset,
    resetPassword
} = require('../controllers/authController');
const authenticateToken = require('../middlewares/authMiddleware');

router.post('/register', register);
router.post('/login', login);

router.get('/me', authenticateToken, getMe);
router.post('/send-verification-email', sendVerificationEmail);
router.post('/verify-email', verifyEmail);
router.post('/request-password-reset', requestPasswordReset);
router.post('/reset-password', resetPassword);
module.exports = router;