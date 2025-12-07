import pkg from 'pg';
const { Pool, Client } = pkg;
import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';

const COMMON_POOL_OPTIONS = {
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000
};

const buildConnectionStringForDb = (connectionString, databaseName) => {
    const url = new URL(connectionString);
    url.pathname = `/${databaseName}`;
    return url.toString();
};

const shouldUseSSL = (connectionString) => {
    try {
        const url = new URL(connectionString);
        const sslMode = url.searchParams.get('sslmode');
        if (sslMode) {
            return sslMode.toLowerCase() !== 'disable';
        }

        return /render\.com$/i.test(url.hostname ?? '');
    } catch (error) {
        logger.warn('Failed to determine SSL requirement from connection string', { error: error.message });
        return false;
    }
};

const createPool = (connectionString, applicationName, options = {}) => {
    const useSSL = shouldUseSSL(connectionString);
    const pool = new Pool({
        connectionString,
        statement_timeout: 15000,
        application_name: applicationName,
        ssl: useSSL ? { rejectUnauthorized: false } : undefined,
        ...COMMON_POOL_OPTIONS
    });

    pool.on('connect', async (pgClient) => {
        logger.debug('Pool connection established', { applicationName });

        if (options.searchPath) {
            try {
                await pgClient.query(`SET search_path TO ${options.searchPath}`);
                logger.debug('Applied search_path for client', { applicationName, searchPath: options.searchPath });
            } catch (error) {
                logger.warn('Failed to apply search_path', { applicationName, error: error.message });
            }
        }
    });

    pool.on('error', (err) => {
        logger.error('Pool error', { applicationName, error: err.message });
    });

    pool.on('remove', () => {
        logger.debug('Pool client removed', { applicationName });
    });

    return pool;
};

const practicePool = createPool(config.db.practiceUrl, 'sql-practice-app', { searchPath: 'playground' });
const adminPool = createPool(config.db.adminUrl, 'sql-practice-admin');
const adminSandboxPool = createPool(
    buildConnectionStringForDb(config.db.adminUrl, config.db.sandboxDbName),
    'sql-practice-admin-sandbox',
    { searchPath: 'sql_playground' }
);

export const getPracticeClient = async () => {
    const client = await practicePool.connect();
    logger.debug('Acquired practice client');
    return client;
};

export const getAdminClient = async () => {
    const client = await adminPool.connect();
    logger.debug('Acquired admin client');
    return client;
};

export const getAdminSandboxClient = async () => {
    const client = await adminSandboxPool.connect();
    logger.debug('Acquired admin sandbox client');
    return client;
};

export const createDirectClient = async (connectionString, applicationName, username, password) => {
    logger.info('Creating direct client', { applicationName, username });
    const useSSL = shouldUseSSL(connectionString);
    const client = new Client({
        connectionString,
        user: username,
        password,
        statement_timeout: 15000,
        application_name: applicationName,
        ssl: useSSL ? { rejectUnauthorized: false } : undefined
    });
    await client.connect();
    return client;
};

export const shutdownPools = async () => {
    logger.info('Shutting down pools');
    await Promise.all([practicePool.end(), adminPool.end(), adminSandboxPool.end()]);
};
