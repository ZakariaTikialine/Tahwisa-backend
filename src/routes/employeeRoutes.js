const express = require('express');
const router = express.Router();
const {
    getAllEmployees,
    getEmployeeById,
    updateEmployee,
    deleteEmployee
} = require('../controllers/employeeController');
const verifyToken = require('../middlewares/authMiddleware');
const isAdmin = require('../middlewares/isAdminMiddleware');

router.get('/', verifyToken, getAllEmployees);
router.get('/:id', verifyToken, getEmployeeById);
router.put('/:id', verifyToken, updateEmployee);
router.delete('/:id', verifyToken, isAdmin, deleteEmployee);

module.exports = router;
