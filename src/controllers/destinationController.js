const pool = require('../config/db');

const allowedTypes = ['externe', 'naftal_interne']; // Valid enum values

// CREATE
const createDestination = async (req, res) => {
    const { nom, localisation, capacité, type, description } = req.body;

    if (!nom || !localisation || !capacité || !type || !description) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    if (!allowedTypes.includes(type)) {
        return res.status(400).json({ message: 'Invalid destination type' });
    }

    try {
        const existing = await pool.query(
            'SELECT 1 FROM destination WHERE LOWER(nom) = LOWER($1)',
            [nom]
        );
        if (existing.rowCount > 0) {
            return res.status(409).json({ message: 'Destination name already exists' });
        }

        const result = await pool.query(
            `INSERT INTO destination (nom, localisation, capacité, type, description)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *`,
            [nom, localisation, capacité, type, description]
        );
        return res.status(201).json({ message: 'Destination created successfully', destination: result.rows[0] });
    } catch (error) {
        console.error('Error creating destination:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// READ ALL
const getAllDestinations = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM destination ORDER BY id');
        return res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error fetching destinations:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// READ BY ID
const getDestinationById = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('SELECT * FROM destination WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Destination not found' });
        }
        return res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching destination:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// UPDATE
const updateDestination = async (req, res) => {
    const { id } = req.params;
    const { nom, localisation, capacité, type, description } = req.body;

    if (!nom || !localisation || !capacité || !type || !description) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    if (!allowedTypes.includes(type)) {
        return res.status(400).json({ message: 'Invalid destination type' });
    }

    try {
        const result = await pool.query(
            `UPDATE destination 
            SET nom = $1, localisation = $2, capacité = $3, type = $4, description = $5
            WHERE id = $6
             RETURNING *`,
            [nom, localisation, capacité, type, description, id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Destination not found' });
        }

        return res.status(200).json({ message: 'Destination updated successfully', destination: result.rows[0] });
    } catch (error) {
        console.error('Error updating destination:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// DELETE
const deleteDestination = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('DELETE FROM destination WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Destination not found' });
        }
        return res.status(200).json({ message: 'Destination deleted successfully' });
    } catch (error) {
        console.error('Error deleting destination:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = {
    createDestination,
    getAllDestinations,
    getDestinationById,
    updateDestination,
    deleteDestination
};
