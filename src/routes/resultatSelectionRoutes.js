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
    getResultatSelectionsByEmployee,
    generateWinnersForExpiredSessions,
    getEligibleEmployees
} = require('../controllers/resultatSelectionController');
const verifyToken = require('../middlewares/authMiddleware');
const isAdmin = require('../middlewares/isAdminMiddleware');

router.post('/', verifyToken, createResultatSelection);
router.get('/', verifyToken, getAllResultatSelections);
router.get('/eligible-employees', verifyToken, getEligibleEmployees);
router.get('/:id', verifyToken, getResultatSelectionById);
router.put('/:id', verifyToken, updateResultatSelection);
router.delete('/:id', verifyToken, isAdmin, deleteResultatSelection);
router.post('/selection/generate/:session_id', verifyToken, generateSelectionForSession);
router.get('/session/:session_id', verifyToken, getResultatSelectionsBySession);
router.get('/employee/:employee_id', verifyToken, getResultatSelectionsByEmployee);
router.post('/winners/generate', verifyToken, isAdmin, generateWinnersForExpiredSessions);

module.exports = router;