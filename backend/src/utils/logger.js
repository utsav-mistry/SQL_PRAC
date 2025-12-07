import fs from 'fs';
import path from 'path';

const LEVELS = ['error', 'warn', 'info', 'debug'];

const normalizeLevel = (level) => {
    if (!level) return 'info';
    const lower = level.toLowerCase();
    return LEVELS.includes(lower) ? lower : 'info';
};

const logLevel = normalizeLevel(process.env.LOG_LEVEL);
const LOG_DIRECTORY = path.join('/tmp/logs');
const LOG_FILE_PATH = path.join(LOG_DIRECTORY, 'app.log');

let logStream;

const ensureLogStream = () => {
    if (logStream) {
        return logStream;
    }

    try {
        fs.mkdirSync(LOG_DIRECTORY, { recursive: true });
        logStream = fs.createWriteStream(LOG_FILE_PATH, { flags: 'a' });
    } catch (error) {
        console.error('[LOGGER] Failed to initialize log file stream', error);
        logStream = null;
    }

    return logStream;
};

const shouldLog = (level) => LEVELS.indexOf(level) <= LEVELS.indexOf(logLevel);

const formatMessage = (level, message, meta) => {
    const timestamp = new Date().toISOString();
    const serializedMeta = meta ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${serializedMeta}`;
};

const createLogger = (level, consoleMethod) => (message, meta) => {
    if (!shouldLog(level)) {
        return;
    }

    const formatted = formatMessage(level, message, meta);
    consoleMethod(formatted);

    const stream = ensureLogStream();
    if (stream) {
        stream.write(`${formatted}\n`);
    }
};

export const logger = {
    error: createLogger('error', console.error.bind(console)),
    warn: createLogger('warn', console.warn.bind(console)),
    info: createLogger('info', console.log.bind(console)),
    debug: createLogger('debug', console.debug.bind(console))
};
