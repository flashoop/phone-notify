const https = require('https');
const { URL } = require('url');
const config = require('../config/config');
const logger = require('../utils/logger');

/**
 * Service for sending notifications via Pushover API
 */
class PushoverService {
    constructor() {
        this.apiUrl = config.pushover.apiUrl;
        this.apiKey = config.pushover.apiKey;
        this.userKey = config.pushover.userKey;
    }

    /**
     * Send a notification via Pushover
     * @param {string} title - Notification title
     * @param {string} message - Notification message
     * @param {string} priority - Priority level (normal, high)
     * @returns {Promise<boolean>} Success status
     */
    async sendNotification(title, message, priority = 'normal') {
        try {
            const priorityMap = {
                low: -1,
                normal: 0,
                high: 1,
            };

            const payload = JSON.stringify({
                token: this.apiKey,
                user: this.userKey,
                title,
                message,
                priority: priorityMap[priority] || 0,
            });

            logger.debug(`Sending Pushover notification: ${title}`);

            const url = new URL(this.apiUrl);
            const options = {
                hostname: url.hostname,
                port: url.port || 443,
                path: url.pathname,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(payload),
                },
                timeout: 10000, // 10 second timeout
            };

            const response = await this._makeRequest(options, payload);

            if (response.status === 1) {
                logger.info('Pushover notification sent successfully');
                return true;
            } else {
                logger.error('Pushover API returned error', response);
                return false;
            }
        } catch (error) {
            logger.error('Failed to send Pushover notification', error);
            return false;
        }
    }

    /**
     * Make HTTPS request
     * @param {Object} options - Request options
     * @param {string} payload - Request body
     * @returns {Promise<Object>} Response data
     */
    _makeRequest(options, payload) {
        return new Promise((resolve, reject) => {
            const req = https.request(options, (res) => {
                let data = '';

                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', () => {
                    try {
                        const parsed = JSON.parse(data);
                        resolve(parsed);
                    } catch (error) {
                        logger.error('Failed to parse Pushover response', error);
                        reject(new Error('Invalid JSON response'));
                    }
                });
            });

            req.on('error', (error) => {
                reject(error);
            });

            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });

            req.write(payload);
            req.end();
        });
    }

    /**
     * Send stock availability notification
     * @param {Object} stockData - Stock availability data
     */
    async notifyStockAvailable(stockData) {
        const title = `iPhone Stock Available!`;
        const message =
            `Part: ${config.appleStore.partNumber}\n` +
            `Store: ${stockData.storeName || config.appleStore.storeNumber}\n` +
            `Status: ${stockData.message}\n\n` +
            `Check now: https://www.apple.com/my/shop`;

        return await this.sendNotification(title, message, 'high');
    }
}

module.exports = new PushoverService();
