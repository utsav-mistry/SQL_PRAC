import http from 'http';
import app from './app.js';
import { config } from './config/env.js';
import { shutdownPools } from './db/index.js';

const server = http.createServer(app);

const onClose = async () => {
    console.log('Shutting down server...');
    server.close(() => {
        console.log('HTTP server closed');
    });
    await shutdownPools();
    process.exit(0);
};

process.on('SIGTERM', onClose);
process.on('SIGINT', onClose);

process.on('uncaughtException', (err) => {
    console.error('Uncaught exception', err);
    process.exit(1);
});

process.on('unhandledRejection', (reason) => {
    console.error('Unhandled rejection', reason);
});

server.listen(config.port, () => {
    console.log(`SQL Practice backend listening on port ${config.port}`);
});
