const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { addHours } = require('date-fns');
const { sendEmail } = require('../services/emailService');
const { validateName, validateEmail, validatePassword, validatePhone, validateMatricule, validateDepartment } = require('../utils/validators');

// Updated register function
const register = async (req, res) => {
    const { nom, prénom, email, password, téléphone, matricule, department } = req.body;

    if (!nom || !prénom || !email || !password || !téléphone || !matricule || !department) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

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
        const verificationToken = uuidv4();
        const verificationTokenExpires = addHours(new Date(), 24);

        const result = await pool.query(
            `INSERT INTO employee 
            (nom, prénom, email, password, téléphone, matricule, department, 
            email_verification_token, email_verification_token_expires)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING id, nom, prénom, email, téléphone, matricule, department`,
            [nom, prénom, email, hashedPassword, téléphone, matricule, department, 
            verificationToken, verificationTokenExpires]
        );

        const employee = result.rows[0];

        // Send verification email
        await sendEmail({
            to: email,
            subject: 'Verify Your Email - Naftal HR System',
            html: `
                <h2>Welcome to Naftal HR System</h2>
                <p>Please verify your email by clicking the link below:</p>
                <a href="${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}">
                    Verify Email
                </a>
                <p>This link will expire in 24 hours.</p>
            `
        });

        res.status(201).json({ 
            message: 'Registration successful. Please check your email to verify your account.',
            employee
        });
    } catch (error) {
        console.error('Register Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Updated login function
const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Missing email or password' });
    }
    if (!validateEmail(email)) {
        return res.status(400).json({ message: 'Invalid email format' });
    }

    try {
        const result = await pool.query(
            'SELECT * FROM employee WHERE email = $1', 
            [email]
        );

        if (result.rowCount === 0) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const employee = result.rows[0];
        const passwordMatch = await bcrypt.compare(password, employee.password);

        if (!passwordMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        if (!employee.email_verified) {
            return res.status(403).json({ 
                code: 'EMAIL_NOT_VERIFIED',
                message: 'Please verify your email before logging in'
            });
        }

        const token = jwt.sign(
            { id: employee.id, email: employee.email, role: employee.role },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.status(200).json({ 
            message: 'Login successful',
            token,
            employee: {
                id: employee.id,
                nom: employee.nom,
                prénom: employee.prénom,
                email: employee.email,
                department: employee.department
            }
        });
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getMe = async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'No token, unauthorized' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const result = await pool.query('SELECT * FROM employee WHERE id = $1', [decoded.id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const user = result.rows[0];
        delete user.password;
        res.json(user);
    } catch (err) {
        console.error(err);
        res.status(401).json({ message: 'Invalid token' });
    }
};

// Email verification functions
const verifyEmail = async (req, res) => {
    try {
        const { token } = req.body;

        const result = await pool.query(
            `UPDATE employee 
            SET email_verified = true,
                email_verification_token = NULL,
                email_verification_token_expires = NULL
            WHERE email_verification_token = $1 
            AND email_verification_token_expires > NOW()
            RETURNING *`,
            [token]
        );

        if (result.rowCount === 0) {
            return res.status(400).json({ 
                message: 'Invalid or expired verification token' 
            });
        }

        res.status(200).json({ 
            message: 'Email verified successfully' 
        });
    } catch (error) {
        console.error('Verify Email Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const resendVerificationEmail = async (req, res) => {
    try {
        const { email } = req.body;

        const result = await pool.query(
            'SELECT * FROM employee WHERE email = $1',
            [email]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const employee = result.rows[0];

        if (employee.email_verified) {
            return res.status(400).json({ 
                message: 'Email is already verified' 
            });
        }

        const verificationToken = uuidv4();
        const verificationTokenExpires = addHours(new Date(), 24);

        await pool.query(
            `UPDATE employee
            SET email_verification_token = $1,
                email_verification_token_expires = $2
            WHERE email = $3`,
            [verificationToken, verificationTokenExpires, email]
        );

        await sendEmail({
            to: email,
            subject: 'Verify Your Email - Naftal HR System',
            html: `
                <h2>Email Verification</h2>
                <p>Please verify your email by clicking the link below:</p>
                <a href="${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}">
                    Verify Email
                </a>
                <p>This link will expire in 24 hours.</p>
            `
        });

        res.status(200).json({ 
            message: 'Verification email resent successfully' 
        });
    } catch (error) {
        console.error('Resend Verification Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Password reset functions
const requestPasswordReset = async (req, res) => {
    try {
        const { email } = req.body;

        const result = await pool.query(
            'SELECT * FROM employee WHERE email = $1',
            [email]
        );

        if (result.rowCount > 0) {
            const employee = result.rows[0];
            const resetToken = uuidv4();
            const resetTokenExpires = addHours(new Date(), 1);

            await pool.query(
                `UPDATE employee
                SET password_reset_token = $1,
                    password_reset_token_expires = $2
                WHERE email = $3`,
                [resetToken, resetTokenExpires, email]
            );

            await sendEmail({
                to: email,
                subject: 'Password Reset Request - Naftal HR System',
                html: `
                    <h2>Password Reset</h2>
                    <p>You requested to reset your password. Click the link below to proceed:</p>
                    <a href="${process.env.FRONTEND_URL}/reset-password?token=${resetToken}">
                        Reset Password
                    </a>
                    <p>This link will expire in 1 hour.</p>
                    <p>If you didn't request this, please ignore this email.</p>
                `
            });
        }

        // Always return success to prevent email enumeration
        res.status(200).json({ 
            message: 'If an account exists with this email, a password reset link has been sent' 
        });
    } catch (error) {
        console.error('Request Password Reset Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        if (!validatePassword(newPassword)) {
            return res.status(400).json({ 
                message: 'Password must be at least 8 characters with uppercase, lowercase, and number' 
            });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        const result = await pool.query(
            `UPDATE employee
            SET password = $1,
                password_reset_token = NULL,
                password_reset_token_expires = NULL
            WHERE password_reset_token = $2
            AND password_reset_token_expires > NOW()
            RETURNING *`,
            [hashedPassword, token]
        );

        if (result.rowCount === 0) {
            return res.status(400).json({ 
                message: 'Invalid or expired password reset token' 
            });
        }

        res.status(200).json({ 
            message: 'Password reset successfully' 
        });
    } catch (error) {
        console.error('Reset Password Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    register,
    login,
    getMe,
    verifyEmail,
    resendVerificationEmail,
    requestPasswordReset,
    resetPassword
};
