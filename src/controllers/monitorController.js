const monitoringService = require('../services/monitoringService');

/**
 * Controller for monitoring-related endpoints
 */
class MonitorController {
    /**
     * Get monitoring status
     */
    getStatus(req, res) {
        try {
            const status = monitoringService.getStatus();
            res.json({
                success: true,
                data: status,
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message,
            });
        }
    }

    /**
     * Health check endpoint
     */
    healthCheck(req, res) {
        res.json({
            success: true,
            message: 'iPhone Stock Monitor is running',
            timestamp: new Date().toISOString(),
        });
    }
}

module.exports = new MonitorController();
