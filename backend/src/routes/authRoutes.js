import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

const router = Router();

router.post('/login', (req, res) => {
    const { username, password } = req.body ?? {};

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    const user = config.auth.users.find((candidate) => candidate.username === username);

    if (!user || user.password !== password) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
        { username: user.username, role: user.role },
        config.auth.jwtSecret,
        { expiresIn: config.auth.tokenExpiry }
    );

    return res.status(200).json({ token, role: user.role });
});

export default router;
