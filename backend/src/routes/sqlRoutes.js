import { Router } from 'express';
import { executeQuery, getHierarchy, resetSandbox } from '../services/sqlService.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/execute', authenticate, async (req, res, next) => {
    try {
        const { sql } = req.body ?? {};

        if (typeof sql !== 'string' || !sql.trim()) {
            return res.status(400).json({ error: 'SQL statement is required' });
        }

        const result = await executeQuery(sql, req.user);
        res.json(result);
    } catch (error) {
        next(error);
    }
});

router.post('/reset', authenticate, async (req, res, next) => {
    try {
        await resetSandbox();
        res.status(200).json({ message: 'Sandbox reset successfully' });
    } catch (error) {
        next(error);
    }
});

router.get('/hierarchy', authenticate, async (req, res, next) => {
    try {
        const hierarchy = await getHierarchy();
        res.status(200).json(hierarchy);
    } catch (error) {
        next(error);
    }
});

export default router;
