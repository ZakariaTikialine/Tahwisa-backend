const pool = require('../config/db');

// Create a new periode
const createPeriode = async (req, res) => {
    const { nom, date_debut_periode, date_fin_periode, date_limite_inscription, statut } = req.body;

    if (!nom || !date_debut_periode || !date_fin_periode || !date_limite_inscription || !statut) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    if (new Date(date_debut_periode) >= new Date(date_fin_periode)) {
        return res.status(400).json({ message: 'date_debut_periode must be before date_fin_periode' });
    }

    try {
        const result = await pool.query(
            `INSERT INTO periode (nom, date_debut_periode, date_fin_periode, date_limite_inscription, statut)
            VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [nom, date_debut_periode, date_fin_periode, date_limite_inscription, statut]
        );
        res.status(201).json({ message: 'Periode created successfully', periode: result.rows[0] });
    } catch (error) {
        console.error('Error creating periode:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Get all periodes
const getAllPeriodes = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM periode ORDER BY date_debut_periode');
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error fetching periodes:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Get periode by ID
const getPeriodeById = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('SELECT * FROM periode WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Periode not found' });
        }
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching periode:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Update periode
const updatePeriode = async (req, res) => {
    const { id } = req.params;
    const { nom, date_debut_periode, date_fin_periode, date_limite_inscription, statut } = req.body;

    if (!nom || !date_debut_periode || !date_fin_periode || !date_limite_inscription || !statut) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    if (new Date(date_debut_periode) >= new Date(date_fin_periode)) {
        return res.status(400).json({ message: 'date_debut_periode must be before date_fin_periode' });
    }

    try {
        const result = await pool.query(
            `UPDATE periode 
            SET nom = $1, date_debut_periode = $2, date_fin_periode = $3, 
                date_limite_inscription = $4, statut = $5
            WHERE id = $6
             RETURNING *`,
            [nom, date_debut_periode, date_fin_periode, date_limite_inscription, statut, id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Periode not found' });
        }

        res.status(200).json({ message: 'Periode updated successfully', periode: result.rows[0] });
    } catch (error) {
        console.error('Error updating periode:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Delete periode
const deletePeriode = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('DELETE FROM periode WHERE id = $1 RETURNING id', [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Periode not found' });
        }
        res.status(200).json({ message: 'Periode deleted successfully' });
    } catch (error) {
        console.error('Error deleting periode:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const checkRegistrationStatus = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query(
            'SELECT date_limite_inscription, statut FROM periode WHERE id = $1',
            [id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Periode not found' });
        }

        const { date_limite_inscription, statut } = result.rows[0];
        const today = new Date().toISOString().split('T')[0];

        const isOpen = statut === 'open' && today <= date_limite_inscription;

        return res.status(200).json({ isRegistrationOpen: isOpen });
    } catch (error) {
        console.error('Error checking registration status:', error.message);
        return res.status(500).json({ message: 'Server error' });
    }
};


module.exports = {
    createPeriode,
    getAllPeriodes,
    getPeriodeById,
    updatePeriode,
    deletePeriode,
    checkRegistrationStatus
};