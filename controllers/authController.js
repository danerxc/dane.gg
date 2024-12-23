import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../db.js';

export const login = async (req, res) => {
    const { username, password } = req.body;

    try {
        const { rows } = await pool.query('SELECT * FROM website.users WHERE username = $1', [username]);
        const user = rows[0];

        if (!user || !(await bcrypt.compare(password, user.password_hash))) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user.id, isAdmin: user.is_admin }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.json({ token });
    } catch (err) {
        console.error('Error logging in:', err);
        res.status(500).json({ message: 'Error logging in' });
    }
};

export const getUsers = async (req, res) => {
    if (!req.user.isAdmin) {
        return res.status(403).json({ message: 'Access denied' });
    }

    try {
        const { rows } = await pool.query(
            'SELECT id, username, is_admin, created_at FROM website.users ORDER BY created_at DESC'
        );
        res.json(rows);
    } catch (err) {
        console.error('Error fetching users:', err);
        res.status(500).json({ message: 'Error fetching users' });
    }
};

export const createUser = async (req, res) => {
    if (!req.user.isAdmin) {
        return res.status(403).json({ message: 'Access denied' });
    }

    const { username, password, isAdmin } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        await pool.query(
            'INSERT INTO website.users (username, password_hash, is_admin) VALUES ($1, $2, $3)',
            [username, hashedPassword, isAdmin]
        );
        res.status(201).json({ message: 'User created successfully' });
    } catch (err) {
        console.error('Error creating user:', err);
        res.status(500).json({ message: 'Error creating user' });
    }
};

export const updateUser = async (req, res) => {
    if (!req.user.isAdmin) {
        return res.status(403).json({ message: 'Access denied' });
    }

    const { id } = req.params;
    const { username, password, isAdmin } = req.body;

    try {
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            await pool.query(
                'UPDATE website.users SET username = $1, password_hash = $2, is_admin = $3 WHERE id = $4',
                [username, hashedPassword, isAdmin, id]
            );
        } else {
            await pool.query(
                'UPDATE website.users SET username = $1, is_admin = $2 WHERE id = $3',
                [username, isAdmin, id]
            );
        }
        res.json({ message: 'User updated successfully' });
    } catch (err) {
        console.error('Error updating user:', err);
        res.status(500).json({ message: 'Error updating user' });
    }
};

export const deleteUser = async (req, res) => {
    if (!req.user.isAdmin) {
        return res.status(403).json({ message: 'Access denied' });
    }

    const { id } = req.params;

    try {
        await pool.query('DELETE FROM website.users WHERE id = $1', [id]);
        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        console.error('Error deleting user:', err);
        res.status(500).json({ message: 'Error deleting user' });
    }
};

export const getCurrentUser = async (req, res) => {
    const userId = req.user.id;
    
    try {
        const { rows } = await pool.query(
            'SELECT username, is_admin FROM website.users WHERE id = $1',
            [userId]
        );
        
        if (rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        res.json({
            username: rows[0].username,
            is_admin: rows[0].is_admin
        });
    } catch (err) {
        console.error('Error fetching current user:', err);
        res.status(500).json({ message: 'Error fetching user data' });
    }
};

export const updateAccountPassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    try {
        const { rows } = await pool.query('SELECT password_hash FROM website.users WHERE id = $1', [userId]);
        const user = rows[0];

        if (!(await bcrypt.compare(currentPassword, user.password_hash))) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await pool.query('UPDATE website.users SET password_hash = $1 WHERE id = $2', 
            [hashedPassword, userId]
        );

        res.json({ message: 'Password updated successfully' });
    } catch (err) {
        console.error('Error updating password:', err);
        res.status(500).json({ message: 'Error updating password' });
    }
};

export const updateAccountUsername = async (req, res) => {
    const { username } = req.body;
    const userId = req.user.id;

    try {
        await pool.query('UPDATE website.users SET username = $1 WHERE id = $2',
            [username, userId]
        );
        res.json({ message: 'Username updated successfully' });
    } catch (err) {
        console.error('Error updating username:', err);
        res.status(500).json({ message: 'Error updating username' });
    }
};

export const checkUsernameAvailability = async (req, res) => {
    const { username } = req.query;
    const userId = req.user.id;

    try {
        const { rows } = await pool.query(
            'SELECT COUNT(*) FROM website.users WHERE username = $1 AND id != $2',
            [username, userId]
        );
        const isAvailable = parseInt(rows[0].count) === 0;
        res.json({ available: isAvailable });
    } catch (err) {
        console.error('Error checking username:', err);
        res.status(500).json({ message: 'Error checking username' });
    }
};

