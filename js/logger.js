/**
 * Frontend Logging Utility
 * Provides structured logging with timestamps and prefixes for debugging
 */

const Logger = {
    // Log levels
    levels: {
        INFO: 'INFO',
        WARN: 'WARN',
        ERROR: 'ERROR',
        DEBUG: 'DEBUG',
        SUCCESS: 'SUCCESS'
    },

    // Color codes for console
    colors: {
        INFO: '%c',
        WARN: '%c',
        ERROR: '%c',
        DEBUG: '%c',
        SUCCESS: '%c'
    },

    colorStyles: {
        INFO: 'color: #0066cc; font-weight: bold;',
        WARN: 'color: #ff9900; font-weight: bold;',
        ERROR: 'color: #ff0000; font-weight: bold;',
        DEBUG: 'color: #666666; font-weight: bold;',
        SUCCESS: 'color: #00aa00; font-weight: bold;'
    },

    /**
     * Format timestamp
     */
    getTimestamp() {
        const now = new Date();
        return now.toLocaleTimeString('en-US', { 
            hour12: false, 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit',
            fractionalSecondDigits: 3
        });
    },

    /**
     * Generic log function
     */
    log(level, category, message, data = null) {
        const timestamp = this.getTimestamp();
        const prefix = `[${timestamp}] [${level}] [${category}]`;
        const style = this.colorStyles[level] || '';

        if (data) {
            console.log(`${this.colors[level]}${prefix}%c ${message}`, style, '', data);
        } else {
            console.log(`${this.colors[level]}${prefix}%c ${message}`, style, '');
        }
    },

    // Convenience methods
    info(category, message, data = null) {
        this.log(this.levels.INFO, category, message, data);
    },

    warn(category, message, data = null) {
        this.log(this.levels.WARN, category, message, data);
    },

    error(category, message, data = null) {
        this.log(this.levels.ERROR, category, message, data);
    },

    debug(category, message, data = null) {
        this.log(this.levels.DEBUG, category, message, data);
    },

    success(category, message, data = null) {
        this.log(this.levels.SUCCESS, category, message, data);
    },

    // API logging
    apiRequest(method, endpoint, body = null) {
        this.info('API', `${method} ${endpoint}`, body);
    },

    apiResponse(status, endpoint, data = null) {
        if (status >= 200 && status < 300) {
            this.success('API', `Response ${status} from ${endpoint}`, data);
        } else {
            this.error('API', `Response ${status} from ${endpoint}`, data);
        }
    },

    apiError(endpoint, error) {
        this.error('API', `Error calling ${endpoint}`, error);
    },

    // Event logging
    event(eventName, details = null) {
        this.info('EVENT', eventName, details);
    },

    // DOM logging
    dom(message, element = null) {
        this.debug('DOM', message, element);
    },

    // Auth logging
    auth(message, details = null) {
        this.info('AUTH', message, details);
    },

    // Form logging
    form(message, data = null) {
        this.info('FORM', message, data);
    }
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Logger;
}
