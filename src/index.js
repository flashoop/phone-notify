const express = require('express');
const { setRoutes } = require('./routes');
const config = require('./config/config');
const logger = require('./utils/logger');
const monitoringService = require('./services/monitoringService');

const app = express();
const PORT = config.server.port;

// Middleware
app.use(express.json());

// Set up routes
setRoutes(app);

// Start Express server
app.listen(PORT, () => {
    logger.info(`Server is running on http://localhost:${PORT}`);
    logger.info(`Health check: http://localhost:${PORT}/health`);
    logger.info(`Monitoring status: http://localhost:${PORT}/status`);

    // Start monitoring service automatically
    logger.info('Initializing stock monitoring service...');
    monitoringService.start();
});

// Graceful shutdown
process.on('SIGINT', async () => {
    logger.info('Received SIGINT, shutting down gracefully...');
    await monitoringService.stop();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    logger.info('Received SIGTERM, shutting down gracefully...');
    await monitoringService.stop();
    process.exit(0);
});
