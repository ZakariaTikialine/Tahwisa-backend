const pool = require('../config/db');

// ✅ Get All Resultat Selections (with employee & session info)
const getAllResultatSelections = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                rs.*, 
                e.nom AS employee_nom, e.prénom AS employee_prenom, 
                s.nom AS session_nom
            FROM resultat_selection rs
            JOIN employee e ON rs.employee_id = e.id
            JOIN session s ON rs.session_id = s.id
            ORDER BY rs.session_id, rs.ordre_priorite
        `);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ✅ Get Resultat Selection By ID
const getResultatSelectionById = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM resultat_selection WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Resultat selection not found' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ✅ Create Resultat Selection (with validation)
const createResultatSelection = async (req, res) => {
    const { session_id, employee_id, type_selection, ordre_priorite, date_selection } = req.body;

    if (!session_id || !employee_id || !type_selection || !ordre_priorite || !date_selection) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    const allowedTypes = ['officiel', 'suppléant'];
    if (!allowedTypes.includes(type_selection)) {
        return res.status(400).json({ message: 'Invalid type_selection' });
    }

    try {
        const sessionCheck = await pool.query('SELECT 1 FROM session WHERE id = $1', [session_id]);
        if (sessionCheck.rowCount === 0) return res.status(400).json({ message: 'Invalid session_id' });

        const employeeCheck = await pool.query('SELECT 1 FROM employee WHERE id = $1', [employee_id]);
        if (employeeCheck.rowCount === 0) return res.status(400).json({ message: 'Invalid employee_id' });

        const duplicateCheck = await pool.query(
            'SELECT 1 FROM resultat_selection WHERE session_id = $1 AND employee_id = $2',
            [session_id, employee_id]
        );
        if (duplicateCheck.rowCount > 0) {
            return res.status(409).json({ message: 'Employee already selected for this session' });
        }

        const result = await pool.query(
            `INSERT INTO resultat_selection (session_id, employee_id, type_selection, ordre_priorite, date_selection)
            VALUES ($1, $2, $3, $4, $5) RETURNING id`,
            [session_id, employee_id, type_selection, ordre_priorite, date_selection]
        );

        res.status(201).json({ id: result.rows[0].id, message: 'Resultat selection created successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ✅ Update Resultat Selection (with validation)
const updateResultatSelection = async (req, res) => {
    const { session_id, employee_id, type_selection, ordre_priorite, date_selection } = req.body;

    if (!session_id || !employee_id || !type_selection || !ordre_priorite || !date_selection) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    try {
        const result = await pool.query(
            `UPDATE resultat_selection 
            SET session_id = $1, employee_id = $2, type_selection = $3, ordre_priorite = $4, date_selection = $5 
            WHERE id = $6 RETURNING id`,
            [session_id, employee_id, type_selection, ordre_priorite, date_selection, req.params.id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Resultat selection not found' });
        }

        res.json({ message: 'Resultat selection updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ✅ Delete Resultat Selection
const deleteResultatSelection = async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM resultat_selection WHERE id = $1 RETURNING id', [req.params.id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Resultat selection not found' });
        }
        res.json({ message: 'Resultat selection deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const generateSelectionForSession = async (req, res) => {
    const { session_id } = req.params;

    try {
        // Step 1: Fetch all inscriptions for this session
        const inscriptionsRes = await pool.query(
            'SELECT employee_id FROM inscription WHERE session_id = $1 AND statut = $2',
            [session_id, 'active']
        );

        const inscriptions = inscriptionsRes.rows;

        if (inscriptions.length < 3) {
            return res.status(400).json({ message: 'Not enough inscriptions to generate selection (minimum 3 required)' });
        }

        // Step 2: Shuffle randomly
        const shuffled = inscriptions.sort(() => Math.random() - 0.5);

        // Step 3: Remove existing selections
        await pool.query('DELETE FROM resultat_selection WHERE session_id = $1', [session_id]);

        const date_selection = new Date();

        // Step 4: Insert new selection
        for (let i = 0; i < Math.min(7, shuffled.length); i++) {
            const type_selection = i < 3 ? 'officiel' : 'suppléant';
            await pool.query(
                `INSERT INTO resultat_selection (session_id, employee_id, type_selection, ordre_priorite, date_selection)
                VALUES ($1, $2, $3, $4, $5)`,
                [session_id, shuffled[i].employee_id, type_selection, i + 1, date_selection]
            );
        }

        return res.status(201).json({ message: 'Selection generated successfully', session_id });
    } catch (error) {
        console.error('Error generating selection:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ✅ Get Resultat Selections By Session ID
const getResultatSelectionsBySession = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                rs.*, 
                e.nom AS employee_nom, e.prénom AS employee_prenom
            FROM resultat_selection rs
            JOIN employee e ON rs.employee_id = e.id
            WHERE rs.session_id = $1
            ORDER BY rs.ordre_priorite
        `, [req.params.session_id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'No resultat selections found for this session' });
        }
        
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ✅ Get Resultat Selections By Employee ID
const getResultatSelectionsByEmployee = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                rs.*, 
                s.nom AS session_nom
            FROM resultat_selection rs
            JOIN session s ON rs.session_id = s.id
            WHERE rs.employee_id = $1
            ORDER BY rs.date_selection DESC
        `, [req.params.employee_id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'No resultat selections found for this employee' });
        }
        
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const generateWinnersForExpiredSessions = async (req, res) => {
try {
    // Step 1: Find sessions whose deadline has passed and winners not yet generated
    const expiredSessionsRes = await pool.query(`
    SELECT s.id AS session_id
    FROM session s
    JOIN periode p ON s.periode_id = p.id
    WHERE p.date_limite_inscription < NOW()
    AND NOT EXISTS (
        SELECT 1 FROM resultat_selection rs WHERE rs.session_id = s.id
    )
    `);

    const expiredSessions = expiredSessionsRes.rows;

    if (expiredSessions.length === 0) {
    return res.status(200).json({ message: "No sessions eligible for winner generation" });
    }

    const date_selection = new Date();

    for (const session of expiredSessions) {
    const session_id = session.session_id;

    // Step 2: Get all active inscriptions for this session
    const inscriptionsRes = await pool.query(
        'SELECT employee_id FROM inscription WHERE session_id = $1 AND statut = $2',
        [session_id, 'active']
    );
    const inscriptions = inscriptionsRes.rows;

    if (inscriptions.length < 3) {
        console.log(`Skipping session ${session_id}: not enough inscriptions`);
        continue;
    }

    // Step 3: Shuffle and pick 3 official, 4 alternates
    const shuffled = inscriptions.sort(() => Math.random() - 0.5);

    for (let i = 0; i < Math.min(7, shuffled.length); i++) {
        const type_selection = i < 3 ? 'officiel' : 'suppléant';
        const employee_id = shuffled[i].employee_id;

        await pool.query(
        `INSERT INTO resultat_selection (session_id, employee_id, type_selection, ordre_priorite, date_selection)
        VALUES ($1, $2, $3, $4, $5)`,
        [session_id, employee_id, type_selection, i + 1, date_selection]
        );
    }
    console.log("📢 Generating winners for session", session_id)
    console.log("🎯 Selected winners:", {
    employee_id: shuffled[i].employee_id,
    type_selection,
    ordre_priorite: i + 1,
    })
    if (shuffled.length === 0) {
        console.log(`⚠️ No inscriptions for session ${session_id}, skipping...`)
    }
    }

    return res.status(201).json({ message: "Winners generated successfully." });

} catch (error) {
    console.error("Error generating winners:", error);
    res.status(500).json({ message: "Internal server error" });
}
};



module.exports = {
    getAllResultatSelections,
    getResultatSelectionById,
    getResultatSelectionsBySession,
    getResultatSelectionsByEmployee,
    createResultatSelection,
    updateResultatSelection,
    deleteResultatSelection,
    generateSelectionForSession,
    generateWinnersForExpiredSessions
};
