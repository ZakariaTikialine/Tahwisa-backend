const express = require('express');
const router = express.Router();
const { 
    createDestination,
    getAllDestinations,
    getDestinationById,
    updateDestination,
    deleteDestination
} = require('../controllers/destinationController');
const verifyToken = require('../middlewares/authMiddleware');
const isAdmin = require('../middlewares/isAdminMiddleware');

router.post('/', verifyToken, isAdmin, createDestination);
router.get('/', verifyToken, getAllDestinations);
router.get('/:id', verifyToken, getDestinationById);
router.put('/:id', verifyToken, isAdmin, updateDestination);
router.delete('/:id', verifyToken, isAdmin, deleteDestination);

module.exports = router;