const express = require('express');
const router = express.Router();
const { 
    createSession, 
    getAllSessions, 
    getSessionById, 
    updateSession, 
    deleteSession 
} = require('../controllers/sessionController');
const verifyToken = require('../middlewares/authMiddleware');
const isAdmin = require('../middlewares/isAdminMiddleware');

router.post('/', verifyToken, createSession);
router.get('/', verifyToken, getAllSessions);
router.get('/:id', verifyToken, getSessionById);
router.put('/:id', verifyToken, updateSession);
router.delete('/:id', verifyToken, isAdmin, deleteSession);

module.exports = router;