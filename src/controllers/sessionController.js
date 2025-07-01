const pool = require('../config/db');

// GET session by ID
const getSessionById = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(
            `SELECT session.*, 
                    destination.nom AS destination_nom,
                    periode.nom AS periode_nom
                FROM session 
                JOIN destination ON session.destination_id = destination.id
                JOIN periode ON session.periode_id = periode.id
                WHERE session.id = $1`,
            [id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Session not found' });
        }
        return res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching session:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// UPDATE session
const updateSession = async (req, res) => {
    const { id } = req.params;
    const { nom, date_debut, date_fin, destination_id, periode_id } = req.body;

    if (!nom || !date_debut || !date_fin || !destination_id || !periode_id) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    if (new Date(date_debut) >= new Date(date_fin)) {
        return res.status(400).json({ message: 'date_debut must be before date_fin' });
    }

    const destCheck = await pool.query('SELECT 1 FROM destination WHERE id = $1', [destination_id]);
    if (destCheck.rowCount === 0) {
        return res.status(400).json({ message: 'Invalid destination_id: destination not found' });
    }

    const periodeCheck = await pool.query('SELECT 1 FROM periode WHERE id = $1', [periode_id]);
    if (periodeCheck.rowCount === 0) {
        return res.status(400).json({ message: 'Invalid periode_id: periode not found' });
    }

    try {
        const result = await pool.query(
            `UPDATE session 
                SET nom = $1, date_debut = $2, date_fin = $3, destination_id = $4, periode_id = $5
                WHERE id = $6
                RETURNING id, nom, date_debut, date_fin, destination_id, periode_id`,
            [nom, date_debut, date_fin, destination_id, periode_id, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Session not found' });
        }
        return res.status(200).json({ message: 'Session updated successfully', session: result.rows[0] });
    } catch (error) {
        console.error('Error updating session:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// DELETE session
const deleteSession = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('DELETE FROM session WHERE id = $1 RETURNING id', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Session not found' });
        }
        return res.status(200).json({ message: 'Session deleted successfully' });
    } catch (error) {
        console.error('Error deleting session:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// CREATE session
const createSession = async (req, res) => {
    const { nom, date_debut, date_fin, destination_id, periode_id } = req.body;

    if (!nom || !date_debut || !date_fin || !destination_id || !periode_id) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    if (new Date(date_debut) >= new Date(date_fin)) {
        return res.status(400).json({ message: 'date_debut must be before date_fin' });
    }

    try {
        // Check if destination exists
        const destCheck = await pool.query('SELECT 1 FROM destination WHERE id = $1', [destination_id]);
        if (destCheck.rowCount === 0) {
            return res.status(400).json({ message: 'Invalid destination_id' });
        }

        // Check if periode exists
        const periodeCheck = await pool.query('SELECT 1 FROM periode WHERE id = $1', [periode_id]);
        if (periodeCheck.rowCount === 0) {
            return res.status(400).json({ message: 'Invalid periode_id' });
        }

        // Check for overlapping session
        const overlapCheck = await pool.query(
            `SELECT 1 FROM session 
            WHERE destination_id = $1 
            AND NOT ($3 < date_debut OR $2 > date_fin)`,
            [destination_id, date_debut, date_fin]
        );

        if (overlapCheck.rowCount > 0) {
            return res.status(409).json({ message: 'Another session already exists at this destination during this time period' });
        }

        const result = await pool.query(
            `INSERT INTO session (nom, date_debut, date_fin, destination_id, periode_id)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, nom, date_debut, date_fin, destination_id, periode_id`,
            [nom, date_debut, date_fin, destination_id, periode_id]
        );

        res.status(201).json({ message: 'Session created successfully', session: result.rows[0] });
    } catch (error) {
        console.error('Error creating session:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// GET all sessions
const getAllSessions = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT session.*, 
                    destination.nom AS destination_nom,
                    periode.nom AS periode_nom
                FROM session 
                JOIN destination ON session.destination_id = destination.id
                JOIN periode ON session.periode_id = periode.id
                ORDER BY session.id`
        );
        return res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error fetching sessions:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = {
    getSessionById,
    updateSession,
    deleteSession,
    createSession,
    getAllSessions
};
