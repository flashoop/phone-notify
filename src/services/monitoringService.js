const appleStoreService = require('./appleStoreService');
const pushoverService = require('./pushoverService');
const config = require('../config/config');
const logger = require('../utils/logger');

/**
 * Core monitoring service for iPhone stock availability
 */
class MonitoringService {
    constructor() {
        this.intervalMs = config.monitoring.intervalMs;
        this.isRunning = false;
        this.intervalId = null;
        this.lastKnownStatus = null;
        this.checkCount = 0;
    }

    /**
     * Start the monitoring service
     */
    start() {
        if (this.isRunning) {
            logger.warn('Monitoring service is already running');
            return;
        }

        logger.info(`Starting monitoring service with ${this.intervalMs}ms interval`);
        logger.info(`Monitoring Part: ${config.appleStore.partNumber} at Store: ${config.appleStore.storeNumber}`);

        this.isRunning = true;

        // Run first check immediately
        this._performCheck();

        // Schedule periodic checks
        this.intervalId = setInterval(() => {
            this._performCheck();
        }, this.intervalMs);
    }

    /**
     * Stop the monitoring service
     */
    async stop() {
        if (!this.isRunning) {
            logger.warn('Monitoring service is not running');
            return;
        }

        logger.info('Stopping monitoring service');
        this.isRunning = false;

        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }

        // Clean up browser resources
        await appleStoreService.cleanup();
        logger.info('Browser resources cleaned up');
    }

    /**
     * Perform a single availability check
     */
    async _performCheck() {
        try {
            this.checkCount++;
            logger.info(`--- Check #${this.checkCount} ---`);

            const stockData = await appleStoreService.checkAvailability();

            // Detect status change
            const statusChanged = this._detectStatusChange(stockData);
            const isFirstCheck = this.lastKnownStatus === null;

            // Send notification if:
            // 1. Status changed from unavailable to available, OR
            // 2. First check AND stock is available (to catch immediate availability)
            if (statusChanged) {
                logger.info('Stock status changed!');
                await this._handleStatusChange(stockData);
            } else if (isFirstCheck && stockData.available) {
                logger.info('First check - stock is AVAILABLE!');
                await this._handleStatusChange(stockData);
            } else {
                logger.info('No status change detected');
            }

            // Update last known status
            this.lastKnownStatus = {
                available: stockData.available,
                message: stockData.message,
                timestamp: new Date().toISOString(),
            };

            // Clean up browser after each check to avoid detection patterns
            // This makes each check appear as a fresh session
            await appleStoreService.cleanup();
            logger.debug('Browser cleanup after check');

        } catch (error) {
            logger.error(`Check #${this.checkCount} failed`, error);

            // Clean up browser even on error
            try {
                await appleStoreService.cleanup();
            } catch (cleanupError) {
                logger.error('Failed to cleanup browser', cleanupError);
            }

            // Continue monitoring despite errors
        }
    }

    /**
     * Detect if stock status has changed
     * @param {Object} currentStock - Current stock data
     * @returns {boolean} True if status changed
     */
    _detectStatusChange(currentStock) {
        // First check - no previous status
        if (this.lastKnownStatus === null) {
            logger.info('First check - establishing baseline status');
            return false;
        }

        // Check if availability status changed
        const availabilityChanged =
            this.lastKnownStatus.available !== currentStock.available;

        // Check if message changed
        const messageChanged =
            this.lastKnownStatus.message !== currentStock.message;

        if (availabilityChanged || messageChanged) {
            logger.info(
                `Status change detected:\n` +
                `  Previous: ${this.lastKnownStatus.message} (available: ${this.lastKnownStatus.available})\n` +
                `  Current: ${currentStock.message} (available: ${currentStock.available})`
            );
            return true;
        }

        return false;
    }

    /**
     * Handle status change
     * @param {Object} stockData - New stock data
     */
    async _handleStatusChange(stockData) {
        // Only send notification if stock becomes available
        if (stockData.available) {
            logger.info('Stock is now AVAILABLE - sending notification');
            const success = await pushoverService.notifyStockAvailable(stockData);

            if (success) {
                logger.info('Notification sent successfully');
            } else {
                logger.error('Failed to send notification');
            }
        } else {
            logger.info('Stock became unavailable - no notification sent');
        }
    }

    /**
     * Get current monitoring status
     */
    getStatus() {
        return {
            isRunning: this.isRunning,
            intervalMs: this.intervalMs,
            checkCount: this.checkCount,
            lastKnownStatus: this.lastKnownStatus,
            partNumber: config.appleStore.partNumber,
            storeNumber: config.appleStore.storeNumber,
        };
    }
}

module.exports = new MonitoringService();
