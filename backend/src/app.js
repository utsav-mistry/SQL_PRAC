import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { config } from './config/env.js';
import sqlRouter from './routes/sqlRoutes.js';
import authRouter from './routes/authRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';
import { authenticate } from './middleware/auth.js';

const app = express();

app.set('trust proxy', 1);

app.use(helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false
}));

app.use(express.json({ limit: '1mb' }));

const corsOptions = config.clientOrigin
    ? { origin: config.clientOrigin, optionsSuccessStatus: 200, credentials: true }
    : { origin: true, optionsSuccessStatus: 200 };
app.use(cors(corsOptions));

app.use(
    rateLimit({
        windowMs: config.rateLimit.windowMs,
        max: config.rateLimit.max,
        standardHeaders: true,
        legacyHeaders: false
    })
);

app.use(requestLogger);

app.use('/auth', authRouter);
app.use('/api', authenticate, sqlRouter);
app.use("/logs", express.static("/logs"));


app.use(errorHandler);

export default app;
