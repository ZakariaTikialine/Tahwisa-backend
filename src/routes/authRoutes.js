const express = require('express');
const router = express.Router();
const { 
    register,
    login 
} = require('../controllers/authController');
const authenticateToken = require('../middlewares/authMiddleware');

router.post('/register', register);
router.post('/login', login);

router.get('/me', authenticateToken ,(req, res) => {
    res.json({
        message: 'This is a protected route',
        employee: req.employee 
    });
});

module.exports = router;
