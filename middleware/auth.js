import jwt from 'jsonwebtoken';
import pool from '../db.js';

export const authenticateToken = async (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Access denied' });

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        req.user = verified;

        const { rows } = await pool.query(
            'SELECT totp_enabled FROM website.users WHERE id = $1',
            [verified.id]
        );

        if (rows[0]?.totp_enabled && !verified.totpVerified) {
            return res.status(401).json({ 
                message: '2FA required',
                requires2FA: true 
            });
        }

        next();
    } catch (err) {
        res.status(400).json({ message: 'Invalid token' });
    }
};