import { isHttpError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export const errorHandler = (err, req, res, next) => { // eslint-disable-line no-unused-vars
    logger.error('Unhandled error', {
        message: err.message,
        stack: err.stack,
        code: err.code,
        url: req?.originalUrl,
        method: req?.method
    });

    if (isHttpError(err)) {
        return res.status(err.status).json({ error: err.message, details: err.details });
    }

    return res.status(500).json({ error: 'Internal server error' });
};
