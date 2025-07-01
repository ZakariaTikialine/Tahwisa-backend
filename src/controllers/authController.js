const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { validateName, validateEmail, validatePassword, validatePhone, validateMatricule, validateDepartment } = require('../utils/validators');

const register = async (req, res) => {
    const { nom, prénom, email, password, téléphone, matricule, department } = req.body;

    if (!nom || !prénom || !email || !password || !téléphone || !matricule || !department) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    // Validate all fields
    if (!validateName(nom)) {
        return res.status(400).json({ message: 'Invalid nom: must be 2-50 characters, letters and spaces only' });
    }

    if (!validateName(prénom)) {
        return res.status(400).json({ message: 'Invalid prénom: must be 2-50 characters, letters and spaces only' });
    }

    if (!validateEmail(email)) {
        return res.status(400).json({ message: 'Invalid email format' });
    }

    if (!validatePassword(password)) {
        return res.status(400).json({ message: 'Invalid password: must be 8+ characters with uppercase, lowercase, and number' });
    }

    if (!validatePhone(téléphone)) {
        return res.status(400).json({ message: 'Invalid phone: must be 10-15 digits' });
    }

    if (!validateMatricule(matricule)) {
        return res.status(400).json({ message: 'Invalid matricule: must be 3-20 alphanumeric characters' });
    }

    if (!validateDepartment(department)) {
        return res.status(400).json({ message: 'Invalid department: must be one of IT, HR, Finance, Marketing, Operations, Sales' });
    }

    try {
        // Check for existing employee with same email or matricule in a single query
        const existingEmployee = await pool.query(
            'SELECT email, matricule FROM employee WHERE email = $1 OR matricule = $2',
            [email, matricule]
        );

        if (existingEmployee.rowCount > 0) {
            const existing = existingEmployee.rows[0];
            if (existing.email === email) {
                return res.status(409).json({ message: 'Email already in use' });
            }
            if (existing.matricule === matricule) {
                return res.status(409).json({ message: 'Matricule already in use' });
            }
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await pool.query(
            `INSERT INTO employee (nom, prénom, email, password, téléphone, matricule, department)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id, nom, prénom, email, téléphone, matricule, department`,
            [nom, prénom, email, hashedPassword, téléphone, matricule, department]
        );

        const employee = result.rows[0];

        const token = jwt.sign(
            { id: employee.id, email: employee.email, role: employee.role },
            process.env.JWT_SECRET,
            { expiresIn: '2h' }
            );


        res.status(201).json({ message: 'Employee registered successfully', token, employee });
    } catch (error) {
        console.error('Register Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Missing email or password' });
    }

    if (!validateEmail(email)) {
        return res.status(400).json({ message: 'Invalid email format' });
    }

    try {
        const result = await pool.query('SELECT * FROM employee WHERE email = $1', [email]);

        if (result.rowCount === 0) {
            return res.status(401).json({ message: 'Invalid email' });
        }

        const employee = result.rows[0];
        const passwordMatch = await bcrypt.compare(password, employee.password);

        if (!passwordMatch) {
            return res.status(401).json({ message: 'Invalid password' });
        }

        const token = jwt.sign(
            { id: employee.id, email: employee.email , role: employee.role },
            process.env.JWT_SECRET,
            { expiresIn: '2h' }
        );

        res.status(200).json({ message: 'Login successful', token, employee });
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getMe = async (req, res) => {
const token = req.cookies.token // or req.headers.authorization

if (!token) {
    return res.status(401).json({ message: 'No token, unauthorized' })
}

try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    const result = await pool.query('SELECT * FROM employee WHERE id = $1', [decoded.id])

    if (result.rows.length === 0) {
    return res.status(404).json({ message: 'User not found' })
    }

    const user = result.rows[0]
    delete user.password // never send password

    res.json(user)
} catch (err) {
    console.error(err)
    res.status(401).json({ message: 'Invalid token' })
}
}

module.exports = { register, login, getMe };
