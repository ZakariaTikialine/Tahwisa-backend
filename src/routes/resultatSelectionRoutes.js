const express = require('express');
const router = express.Router();
const { 
    createResultatSelection,
    getAllResultatSelections,
    getResultatSelectionById,
    updateResultatSelection,
    deleteResultatSelection,
    generateSelectionForSession,
    getResultatSelectionsBySession,
    getResultatSelectionsByEmployee
} = require('../controllers/resultatSelectionController');
const verifyToken = require('../middlewares/authMiddleware');
const isAdmin = require('../middlewares/isAdminMiddleware');

router.post('/', verifyToken, createResultatSelection);
router.get('/', verifyToken, getAllResultatSelections);
router.get('/:id', verifyToken, getResultatSelectionById);
router.put('/:id', verifyToken, updateResultatSelection);
router.delete('/:id', verifyToken, isAdmin, deleteResultatSelection);
router.post('/selection/generate/:session_id', verifyToken, generateSelectionForSession);
router.get('/session/:session_id', verifyToken, getResultatSelectionsBySession);
router.get('/employee/:employee_id', verifyToken, getResultatSelectionsByEmployee);

module.exports = router;