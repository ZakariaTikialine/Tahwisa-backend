const pool = require('../config/db');

const getAllInscriptions = async (req, res) => {
    try {
        const query = `
            SELECT 
                i.*,
                e.nom as employee_name,
                s.nom as session_name,
                p.date_limite_inscription as deadline
            FROM inscription i
            LEFT JOIN employee e ON i.employee_id = e.id
            LEFT JOIN session s ON i.session_id = s.id
            LEFT JOIN periode p ON s.periode_id = p.id
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getInscriptionById = async (req, res) => {
    try {
        const query = `
            SELECT 
                i.*,
                e.nom as employee_name,
                s.nom as session_name,
                p.date_limite_inscription as deadline
            FROM inscription i
            LEFT JOIN employee e ON i.employee_id = e.id
            LEFT JOIN session s ON i.session_id = s.id
            LEFT JOIN periode p ON s.periode_id = p.id
            WHERE i.id = $1
        `;
        const result = await pool.query(query, [req.params.id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Inscription not found' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getInscriptionsByEmployee = async (req, res) => {
    try {
        const query = `
            SELECT 
                i.*,
                e.nom as employee_name,
                s.nom as session_name,
                p.date_limite_inscription as deadline
            FROM inscription i
            LEFT JOIN employee e ON i.employee_id = e.id
            LEFT JOIN session s ON i.session_id = s.id
            LEFT JOIN periode p ON s.periode_id = p.id
            WHERE i.employee_id = $1
        `;
        const result = await pool.query(query, [req.params.employeeId]);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getInscriptionsBySession = async (req, res) => {
    try {
        const query = `
            SELECT 
                i.*,
                e.nom as employee_name,
                s.nom as session_name,
                p.date_limite_inscription as deadline
            FROM inscription i
            LEFT JOIN employee e ON i.employee_id = e.id
            LEFT JOIN session s ON i.session_id = s.id
            LEFT JOIN periode p ON s.periode_id = p.id
            WHERE i.session_id = $1
        `;
        const result = await pool.query(query, [req.params.sessionId]);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const createInscription = async (req, res) => {
    try {
        const { employee_id, session_id, statut } = req.body;
        
        // Automatically set inscription date to current date/time
        const date_inscription = new Date();
        
        // Validate employee exists
        const employeeCheck = await pool.query('SELECT id FROM employee WHERE id = $1', [employee_id]);
        if (employeeCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Employee not found' });
        }
        
        // Validate session exists and get deadline
        const sessionCheck = await pool.query(`
            SELECT s.id, p.date_limite_inscription 
            FROM session s
            LEFT JOIN periode p ON s.periode_id = p.id
            WHERE s.id = $1
        `, [session_id]);
        
        if (sessionCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Session not found' });
        }
        
        // Check deadline
        const deadline = sessionCheck.rows[0].date_limite_inscription;
        
        if (deadline && date_inscription > new Date(deadline)) {
            return res.status(400).json({ 
                error: 'Registration deadline has passed',
                deadline: deadline
            });
        }
        
        // Check if inscription already exists
        const existingInscription = await pool.query(
            'SELECT id FROM inscription WHERE employee_id = $1 AND session_id = $2',
            [employee_id, session_id]
        );
        
        if (existingInscription.rows.length > 0) {
            return res.status(409).json({ error: 'Employee is already registered for this session' });
        }
        
        // Create inscription with automatic date
        const insertQuery = `
            INSERT INTO inscription (employee_id, session_id, date_inscription, statut)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `;
        
        const result = await pool.query(insertQuery, [
            employee_id,
            session_id,
            date_inscription,
            statut || 'active'
        ]);
        
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updateInscription = async (req, res) => {
    try {
        const { employee_id, session_id, date_inscription, statut } = req.body;
        
        // Check if inscription exists
        const existingInscription = await pool.query('SELECT * FROM inscription WHERE id = $1', [req.params.id]);
        if (existingInscription.rows.length === 0) {
            return res.status(404).json({ error: 'Inscription not found' });
        }
        
        // If updating employee_id or session_id, validate them
        if (employee_id) {
            const employeeCheck = await pool.query('SELECT id FROM employee WHERE id = $1', [employee_id]);
            if (employeeCheck.rows.length === 0) {
                return res.status(404).json({ error: 'Employee not found' });
            }
        }
        
        if (session_id) {
            const sessionCheck = await pool.query(`
                SELECT s.id, p.date_limite_inscription 
                FROM session s
                LEFT JOIN periode p ON s.periode_id = p.id
                WHERE s.id = $1
            `, [session_id]);
            
            if (sessionCheck.rows.length === 0) {
                return res.status(404).json({ error: 'Session not found' });
            }
            
            // Check deadline for session change
            const deadline = sessionCheck.rows[0].date_limite_inscription;
            const updateDate = new Date();
            
            if (deadline && updateDate > new Date(deadline)) {
                return res.status(400).json({ 
                    error: 'Cannot update: registration deadline has passed for this session',
                    deadline: deadline
                });
            }
        }
        
        // Check for duplicate inscription if changing employee_id or session_id
        const finalEmployeeId = employee_id || existingInscription.rows[0].employee_id;
        const finalSessionId = session_id || existingInscription.rows[0].session_id;
        
        if (employee_id || session_id) {
            const duplicateCheck = await pool.query(
                'SELECT id FROM inscription WHERE employee_id = $1 AND session_id = $2 AND id != $3',
                [finalEmployeeId, finalSessionId, req.params.id]
            );
            
            if (duplicateCheck.rows.length > 0) {
                return res.status(409).json({ error: 'Employee is already registered for this session' });
            }
        }
        
        // Update inscription
        const updateQuery = `
            UPDATE inscription 
            SET employee_id = $1, session_id = $2, date_inscription = $3, statut = $4
            WHERE id = $5
            RETURNING *
        `;
        
        const result = await pool.query(updateQuery, [
            finalEmployeeId,
            finalSessionId,
            date_inscription || existingInscription.rows[0].date_inscription,
            statut || existingInscription.rows[0].statut,
            req.params.id
        ]);
        
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const deleteInscription = async (req, res) => {
    try {
        // Check deadline before allowing deletion
        const inscriptionCheck = await pool.query(`
            SELECT i.*, p.date_limite_inscription
            FROM inscription i
            LEFT JOIN session s ON i.session_id = s.id
            LEFT JOIN periode p ON s.periode_id = p.id
            WHERE i.id = $1
        `, [req.params.id]);
        
        if (inscriptionCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Inscription not found' });
        }
        
        const deadline = inscriptionCheck.rows[0].date_limite_inscription;
        if (deadline && new Date() > new Date(deadline)) {
            return res.status(400).json({ 
                error: 'Cannot delete: registration deadline has passed',
                deadline: deadline
            });
        }
        
        await pool.query('DELETE FROM inscription WHERE id = $1', [req.params.id]);
        res.json({ message: 'Inscription deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getAllInscriptions,
    getInscriptionById,
    getInscriptionsByEmployee,
    getInscriptionsBySession,
    createInscription,
    updateInscription,
    deleteInscription
};
