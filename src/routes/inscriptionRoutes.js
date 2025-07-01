const express = require('express');
const router = express.Router();
const {
    createInscription,
    getAllInscriptions,
    getInscriptionById,
    getInscriptionsByEmployee,
    getInscriptionsBySession,
    updateInscription,
    deleteInscription
} = require('../controllers/inscriptionController');
const verifyToken = require('../middlewares/authMiddleware');
const isAdmin = require('../middlewares/isAdminMiddleware');

router.post('/', verifyToken, createInscription);
router.get('/', verifyToken, getAllInscriptions);
router.get('/:id', verifyToken, getInscriptionById);
router.get('/employee/:employeeId', verifyToken, getInscriptionsByEmployee);
router.get('/session/:sessionId', verifyToken, getInscriptionsBySession);
router.put('/:id', verifyToken, updateInscription);
router.delete('/:id', verifyToken, isAdmin, deleteInscription);

module.exports = router;    