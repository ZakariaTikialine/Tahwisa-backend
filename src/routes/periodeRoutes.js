const express = require('express');
const router = express.Router();
const { 
    createPeriode, 
    getAllPeriodes, 
    getPeriodeById, 
    updatePeriode, 
    deletePeriode,
    checkRegistrationStatus
} = require('../controllers/periodeController');
const verifyToken = require('../middlewares/authMiddleware');
const isAdmin = require('../middlewares/isAdminMiddleware');

router.post('/', verifyToken, isAdmin, createPeriode);
router.get('/', verifyToken, getAllPeriodes);
router.get('/:id', verifyToken, getPeriodeById);
router.put('/:id', verifyToken, isAdmin, updatePeriode);
router.delete('/:id', verifyToken, isAdmin, deletePeriode);
router.get('/:id/registration-status', verifyToken, checkRegistrationStatus);

module.exports = router;
