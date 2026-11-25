import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../db';
import { RowDataPacket } from 'mysql2';

const router = express.Router();

router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        res.status(400).json({
            message: 'Email and password are required'
        });
        return;
    }

    try {
        const [users] = await pool.execute<RowDataPacket[]>(
            'SELECT * FROM users WHERE email = ? AND is_active = 1',
            [email]
        );

        if (users.length === 0) {
            res.status(401).json({
                message: 'Invalid email or password'
            });
            return;
        }

        const user = users[0];

        const validPassword = await bcrypt.compare(
            password, user.password_hash
        );

        if (!validPassword) {
            res.status(401).json({
                message: 'Invalid email or password'
            });
            return;
        }

        const secret = process.env.JWT_SECRET;

        if (!secret) {
            throw new Error('JWT_SECRET is missing');
        }

        const token = jwt.sign(
            {
                user_id: user.user_id,
                role: user.role
            },
            secret,
            { expiresIn: '8h' }
        );

        res.json({
            message: 'Login successful',
            token: token,
            user_id: user.user_id,
            full_name: user.full_name,
            role: user.role
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Server error'
        });
    }
});

export default router;
