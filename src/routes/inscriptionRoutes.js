const express = require('express');
const router = express.Router();
const {
    createInscription,
    getAllInscriptions,
    getInscriptionById,
    getInscriptionsByEmployee,
    getInscriptionsBySession,
    updateInscription,
    deleteInscription,
    getInscriptionsHistory,
    getInscriptionsWithResultat
} = require('../controllers/inscriptionController');
const verifyToken = require('../middlewares/authMiddleware');
const isAdmin = require('../middlewares/isAdminMiddleware');

router.post('/', verifyToken, createInscription);
router.get('/', verifyToken, getAllInscriptions);
router.get('/history', verifyToken, isAdmin, getInscriptionsHistory);
router.get('/full-history', verifyToken, isAdmin, getInscriptionsWithResultat);
router.get('/employee/:employeeId', verifyToken, getInscriptionsByEmployee);
router.get('/session/:sessionId', verifyToken, getInscriptionsBySession);
router.get('/:id', verifyToken, getInscriptionById);
router.put('/:id', verifyToken, updateInscription);
router.delete('/:id', verifyToken, isAdmin, deleteInscription);

module.exports = router;