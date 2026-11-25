import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import pool from '../db';
import { RowDataPacket } from 'mysql2';

export async function authenticate(
    req: Request,
    res: Response,
    next: NextFunction
) {
    const authHeader = req.headers.authorization;
    const secret = process.env.JWT_SECRET;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ message: 'Token is required' });
        return;
    }

    if (!secret) {
        res.status(500).json({ message: 'Server configuration error' });
        return;
    }

    const token = authHeader.split(' ')[1];

    let decoded;

    try {
        decoded = jwt.verify(token, secret) as jwt.JwtPayload;
    } catch {
        res.status(401).json({ message: 'Invalid or expired token' });
        return;
    }

    try {
        const [users] = await pool.execute<RowDataPacket[]>(
            'SELECT user_id, role FROM users WHERE user_id = ? AND is_active = 1',
            [decoded.user_id]
        );

        if (users.length === 0) {
            res.status(401).json({ message: 'User is not active' });
            return;
        }

        res.locals.user = users[0];
        next();

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
}

export function requireAdmin(
    req: Request,
    res: Response,
    next: NextFunction
) {
    if (res.locals.user?.role !== 'Admin') {
        res.status(403).json({
            message: 'Access denied'
        });
        return;
    }

    next();
}