import bcrypt from 'bcrypt';
import pool from '../db.js';

export default class UsersController {
    // =======================
    // ADMIN-ONLY USER MANAGEMENT ROUTES
    // =======================
    async getUsers(req, res) {
        if (!req.user.is_admin) {
            return res.status(403).json({ message: 'Access denied' });
        }

        try {
            const { rows } = await pool.query(
                'SELECT id, username, is_admin, created_at, totp_enabled FROM website.users ORDER BY created_at DESC'
            );
            res.json(rows);
        } catch (err) {
            console.error('Error fetching users:', err);
            res.status(500).json({ message: 'Error fetching users' });
        }
    }

    async createUser(req, res) {
        if (!req.user.is_admin) {
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
    }

    async updateUser(req, res) {
        if (!req.user.is_admin) {
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
    }

    async deleteUser(req, res) {
        if (!req.user.is_admin) {
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
    }
}