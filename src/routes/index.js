const monitorController = require('../controllers/monitorController');

/**
 * Set up application routes
 */
function setRoutes(app) {
    // Health check endpoint
    app.get('/', monitorController.healthCheck);
    app.get('/health', monitorController.healthCheck);

    // Monitoring status endpoint
    app.get('/status', monitorController.getStatus);
}

module.exports = { setRoutes };
