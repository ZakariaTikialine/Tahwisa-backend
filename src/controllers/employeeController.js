const pool = require('../config/db');
const bcrypt = require('bcrypt');

// Get all employees
const getAllEmployees = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM employee');
        res.json(result.rows);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get one employee
const getEmployeeById = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('SELECT * FROM employee WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Employee not found' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Update employee
const updateEmployee = async (req, res) => {
    const { id } = req.params;
    const { nom, prénom, email, password, téléphone, matricule, structure } = req.body;

    // Validate required fields
    if (!nom || !prénom || !email || !password || !téléphone || !matricule || !structure) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        // Check if email is used by another employee
        const emailCheck = await pool.query(
            'SELECT 1 FROM employee WHERE email = $1 AND id != $2',
            [email, id]
        );
        if (emailCheck.rowCount > 0) {
            return res.status(409).json({ message: 'Email already in use by another employee' });
        }

        // Check if matricule is used by another employee
        const matriculeCheck = await pool.query(
            'SELECT 1 FROM employee WHERE matricule = $1 AND id != $2',
            [matricule, id]
        );
        if (matriculeCheck.rowCount > 0) {
            return res.status(409).json({ message: 'Matricule already in use by another employee' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Perform the update
        const result = await pool.query(
            `UPDATE employee 
            SET nom = $1, prénom = $2, email = $3, password = $4, téléphone = $5, matricule = $6, structure = $7 
            WHERE id = $8 
            RETURNING id, nom, prénom, email, téléphone, matricule, structure`,
            [nom, prénom, email, hashedPassword, téléphone, matricule, structure, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        res.status(200).json({ message: 'Employee updated successfully', employee: result.rows[0] });
    } catch (error) {
        console.error('Update Error:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete employee
const deleteEmployee = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('DELETE FROM employee WHERE id = $1 RETURNING *', [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Employee not found' });
        }
        res.json({ message: 'Employee deleted successfully', employee: result.rows[0] });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Server error' });
    }
};


module.exports = {
    getAllEmployees,
    getEmployeeById,
    updateEmployee,
    deleteEmployee
};
