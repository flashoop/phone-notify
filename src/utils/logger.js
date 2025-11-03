const config = require('../config/config');

/**
 * Simple logger utility with timestamps
 */
class Logger {
    constructor() {
        this.enabled = config.logging.enabled;
        this.level = config.logging.level;
    }

    _formatMessage(level, message) {
        const timestamp = new Date().toISOString();
        return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    }

    info(message) {
        if (this.enabled) {
            console.log(this._formatMessage('info', message));
        }
    }

    error(message, error = null) {
        if (this.enabled) {
            console.error(this._formatMessage('error', message));
            if (error) {
                console.error(error);
            }
        }
    }

    warn(message) {
        if (this.enabled) {
            console.warn(this._formatMessage('warn', message));
        }
    }

    debug(message) {
        if (this.enabled && this.level === 'debug') {
            console.log(this._formatMessage('debug', message));
        }
    }
}

module.exports = new Logger();
