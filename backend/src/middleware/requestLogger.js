import { logger } from '../utils/logger.js';

export const requestLogger = (req, res, next) => {
    const start = Date.now();
    const { method, originalUrl } = req;
    const user = req.user ? { username: req.user.username, role: req.user.role } : null;

    logger.info('Incoming request', { method, url: originalUrl, user });

    res.on('finish', () => {
        const durationMs = Date.now() - start;
        logger.info('Completed request', {
            method,
            url: originalUrl,
            status: res.statusCode,
            durationMs
        });
    });

    next();
};
