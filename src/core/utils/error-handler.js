/**
 * Enhanced Error Handler
 * Provides comprehensive error handling and fallback mechanisms
 * Follows Single Responsibility Principle - only handles errors
 */

import AppConfig from '../config/app.config.js';
import appStore from '../../state/store/app.store.js';

/**
 * Error types enumeration
 */
export const ErrorTypes = {
    NETWORK: 'network',
    API: 'api',
    VALIDATION: 'validation',
    PERMISSION: 'permission',
    SYSTEM: 'system',
    USER: 'user',
    UNKNOWN: 'unknown'
};

/**
 * Error severity levels
 */
export const ErrorSeverity = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical'
};

/**
 * Enhanced Error Handler Class
 */
export class ErrorHandler {
    constructor() {
        this.errorLog = [];
        this.maxLogSize = 100;
        this.fallbackUI = null;
        this.retryAttempts = new Map();
        this.maxRetries = 3;

        this.setupGlobalHandlers();
        this.initializeFallbackUI();
    }

    /**
     * Set up global error handlers
     */
    setupGlobalHandlers() {
        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.handleError(event.reason, {
                type: ErrorTypes.SYSTEM,
                severity: ErrorSeverity.HIGH,
                source: 'unhandledrejection',
                fatal: true
            });
        });

        // Handle global JavaScript errors
        window.addEventListener('error', (event) => {
            this.handleError(event.error || new Error(event.message), {
                type: ErrorTypes.SYSTEM,
                severity: ErrorSeverity.MEDIUM,
                source: 'global-error',
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno
            });
        });

        // Handle resource loading errors
        window.addEventListener('error', (event) => {
            if (event.target !== window) {
                this.handleError(new Error(`Failed to load resource: ${event.target.src || event.target.href}`), {
                    type: ErrorTypes.SYSTEM,
                    severity: ErrorSeverity.MEDIUM,
                    source: 'resource-error',
                    resource: event.target.src || event.target.href
                });
            }
        }, true);
    }

    /**
     * Initialize fallback UI
     */
    initializeFallbackUI() {
        this.fallbackUI = {
            showOfflineMessage: () => {
                if (!navigator.onLine) {
                    this.showNotification('You are currently offline. Some features may not work.', 'warning');
                }
            },

            showAPIError: (message) => {
                this.showNotification(`Connection error: ${message}`, 'error');
            },

            showValidationError: (message) => {
                this.showNotification(`Please check your input: ${message}`, 'warning');
            },

            showSystemError: (message) => {
                this.showNotification(`System error: ${message}`, 'error');
                this.logErrorForSupport(message);
            }
        };
    }

    /**
     * Handle and process errors
     * @param {Error|string} error - Error object or message
     * @param {object} context - Error context
     */
    handleError(error, context = {}) {
        const errorInfo = this.normalizeError(error, context);
        
        // Log error
        this.logError(errorInfo);
        
        // Show user notification if appropriate
        this.showUserNotification(errorInfo);
        
        // Execute fallback mechanisms
        this.executeFallback(errorInfo);
        
        // Report to monitoring service if enabled
        if (AppConfig.features.enableAnalytics) {
            this.reportError(errorInfo);
        }
    }

    /**
     * Normalize error information
     * @param {Error|string} error - Error object or message
     * @param {object} context - Error context
     * @returns {object} Normalized error info
     */
    normalizeError(error, context) {
        const timestamp = new Date().toISOString();
        const errorId = this.generateErrorId();

        return {
            id: errorId,
            message: error instanceof Error ? error.message : error,
            stack: error instanceof Error ? error.stack : null,
            type: context.type || ErrorTypes.UNKNOWN,
            severity: context.severity || ErrorSeverity.MEDIUM,
            source: context.source || 'unknown',
            timestamp,
            fatal: context.fatal || false,
            retryable: context.retryable || false,
            userMessage: this.getUserMessage(error, context),
            metadata: {
                url: window.location.href,
                userAgent: navigator.userAgent,
                online: navigator.onLine,
                ...context.metadata
            }
        };
    }

    /**
     * Get user-friendly error message
     * @param {Error|string} error - Error object or message
     * @param {object} context - Error context
     * @returns {string} User message
     */
    getUserMessage(error, context) {
        const message = error instanceof Error ? error.message : error;
        
        switch (context.type) {
            case ErrorTypes.NETWORK:
                return 'Connection problem. Please check your internet and try again.';
            
            case ErrorTypes.API:
                return 'Server error. Please try again in a moment.';
            
            case ErrorTypes.VALIDATION:
                return message || 'Please check your input and try again.';
            
            case ErrorTypes.PERMISSION:
                return 'You do not have permission to perform this action.';
            
            case ErrorTypes.SYSTEM:
                return 'Something went wrong. Please refresh the page.';
            
            case ErrorTypes.USER:
                return message;
            
            default:
                return 'An unexpected error occurred. Please try again.';
        }
    }

    /**
     * Log error for support/debugging
     * @param {object} errorInfo - Error information
     */
    logError(errorInfo) {
        // Add to in-memory log
        this.errorLog.push(errorInfo);
        
        // Limit log size
        if (this.errorLog.length > this.maxLogSize) {
            this.errorLog.shift();
        }

        // Log to console based on severity
        switch (errorInfo.severity) {
            case ErrorSeverity.CRITICAL:
                console.error('[ERROR-CRITICAL]', errorInfo);
                break;
            case ErrorSeverity.HIGH:
                console.error('[ERROR]', errorInfo);
                break;
            case ErrorSeverity.MEDIUM:
                console.warn('[WARNING]', errorInfo);
                break;
            default:
                console.info('[INFO]', errorInfo);
        }
    }

    /**
     * Show user notification
     * @param {object} errorInfo - Error information
     */
    showUserNotification(errorInfo) {
        // Don't show notifications for low severity errors
        if (errorInfo.severity === ErrorSeverity.LOW) {
            return;
        }

        // Don't show notifications for certain sources
        if (errorInfo.source === 'resource-error' && errorInfo.severity === ErrorSeverity.MEDIUM) {
            return;
        }

        appStore.addNotification({
            type: this.getNotificationType(errorInfo.severity),
            title: this.getNotificationTitle(errorInfo.type),
            message: errorInfo.userMessage,
            duration: this.getNotificationDuration(errorInfo),
            actions: this.getNotificationActions(errorInfo)
        });
    }

    /**
     * Get notification type based on error severity
     * @param {string} severity - Error severity
     * @returns {string} Notification type
     */
    getNotificationType(severity) {
        switch (severity) {
            case ErrorSeverity.CRITICAL:
            case ErrorSeverity.HIGH:
                return 'error';
            case ErrorSeverity.MEDIUM:
                return 'warning';
            default:
                return 'info';
        }
    }

    /**
     * Get notification title
     * @param {string} type - Error type
     * @returns {string} Title
     */
    getNotificationTitle(type) {
        switch (type) {
            case ErrorTypes.NETWORK:
                return 'Connection Issue';
            case ErrorTypes.API:
                return 'Server Error';
            case ErrorTypes.VALIDATION:
                return 'Invalid Input';
            case ErrorTypes.PERMISSION:
                return 'Access Denied';
            case ErrorTypes.SYSTEM:
                return 'System Error';
            default:
                return 'Error';
        }
    }

    /**
     * Get notification duration
     * @param {object} errorInfo - Error information
     * @returns {number} Duration in ms
     */
    getNotificationDuration(errorInfo) {
        if (errorInfo.fatal) return 0; // Don't auto-remove fatal errors
        if (errorInfo.severity === ErrorSeverity.HIGH) return 10000; // 10 seconds
        if (errorInfo.severity === ErrorSeverity.MEDIUM) return 5000; // 5 seconds
        return 3000; // 3 seconds default
    }

    /**
     * Get notification actions
     * @param {object} errorInfo - Error information
     * @returns {Array} Action buttons
     */
    getNotificationActions(errorInfo) {
        const actions = [];

        if (errorInfo.retryable) {
            actions.push({
                label: 'Retry',
                action: () => this.retryOperation(errorInfo)
            });
        }

        if (errorInfo.severity === ErrorSeverity.CRITICAL) {
            actions.push({
                label: 'Reload Page',
                action: () => window.location.reload()
            });
        }

        actions.push({
            label: 'Report Issue',
            action: () => this.reportIssue(errorInfo)
        });

        return actions;
    }

    /**
     * Execute fallback mechanisms
     * @param {object} errorInfo - Error information
     */
    executeFallback(errorInfo) {
        switch (errorInfo.type) {
            case ErrorTypes.NETWORK:
                this.handleNetworkError(errorInfo);
                break;
            case ErrorTypes.API:
                this.handleAPIError(errorInfo);
                break;
            case ErrorTypes.SYSTEM:
                this.handleSystemError(errorInfo);
                break;
        }
    }

    /**
     * Handle network errors
     * @param {object} errorInfo - Error information
     */
    handleNetworkError(errorInfo) {
        // Update app state to reflect offline status
        appStore.setState(prevState => ({
            ...prevState,
            ui: {
                ...prevState.ui,
                offline: !navigator.onLine
            }
        }));

        // Show offline UI if needed
        if (!navigator.onLine) {
            this.showOfflineUI();
        }
    }

    /**
     * Handle API errors
     * @param {object} errorInfo - Error information
     */
    handleAPIError(errorInfo) {
        // Retry logic for certain API errors
        if (errorInfo.retryable && this.shouldRetry(errorInfo)) {
            setTimeout(() => {
                this.retryOperation(errorInfo);
            }, 1000 * Math.pow(2, this.getRetryCount(errorInfo))); // Exponential backoff
        }

        // Clear cached data if server is unavailable
        if (errorInfo.message.includes('503') || errorInfo.message.includes('500')) {
            this.clearCache();
        }
    }

    /**
     * Handle system errors
     * @param {object} errorInfo - Error information
     */
    handleSystemError(errorInfo) {
        if (errorInfo.fatal) {
            this.showFatalErrorUI(errorInfo);
        }
    }

    /**
     * Show offline UI
     */
    showOfflineUI() {
        const offlineBanner = document.createElement('div');
        offlineBanner.id = 'offline-banner';
        offlineBanner.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: #ff9800;
            color: white;
            padding: 10px;
            text-align: center;
            z-index: 10000;
            font-weight: bold;
        `;
        offlineBanner.textContent = 'You are offline. Some features may not work.';
        document.body.appendChild(offlineBanner);
    }

    /**
     * Show fatal error UI
     * @param {object} errorInfo - Error information
     */
    showFatalErrorUI(errorInfo) {
        const errorPage = document.createElement('div');
        errorPage.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: #f44336;
            color: white;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            font-family: Arial, sans-serif;
        `;
        errorPage.innerHTML = `
            <h1>Something went wrong</h1>
            <p>We're sorry, but something unexpected happened.</p>
            <p>Error ID: ${errorInfo.id}</p>
            <button onclick="window.location.reload()" style="
                padding: 10px 20px;
                background: white;
                color: #f44336;
                border: none;
                border-radius: 4px;
                font-weight: bold;
                cursor: pointer;
                margin-top: 20px;
            ">Reload Page</button>
        `;
        document.body.appendChild(errorPage);
    }

    /**
     * Check if operation should be retried
     * @param {object} errorInfo - Error information
     * @returns {boolean} Should retry
     */
    shouldRetry(errorInfo) {
        const retryCount = this.getRetryCount(errorInfo);
        return retryCount < this.maxRetries;
    }

    /**
     * Get retry count for error
     * @param {object} errorInfo - Error information
     * @returns {number} Retry count
     */
    getRetryCount(errorInfo) {
        if (!this.retryAttempts.has(errorInfo.id)) {
            this.retryAttempts.set(errorInfo.id, 0);
        }
        return this.retryAttempts.get(errorInfo.id);
    }

    /**
     * Retry operation
     * @param {object} errorInfo - Error information
     */
    retryOperation(errorInfo) {
        const currentCount = this.getRetryCount(errorInfo);
        this.retryAttempts.set(errorInfo.id, currentCount + 1);
        
        // Emit retry event for components to handle
        window.dispatchEvent(new CustomEvent('error-retry', {
            detail: { errorInfo, attempt: currentCount + 1 }
        }));
    }

    /**
     * Clear application cache
     */
    clearCache() {
        // Clear localStorage
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('toilet-review-')) {
                localStorage.removeItem(key);
            }
        });

        // Clear sessionStorage
        Object.keys(sessionStorage).forEach(key => {
            if (key.startsWith('toilet-review-')) {
                sessionStorage.removeItem(key);
            }
        });

        appStore.addNotification({
            type: 'info',
            title: 'Cache Cleared',
            message: 'Temporary data has been cleared. Please try again.',
            duration: 3000
        });
    }

    /**
     * Report issue to support
     * @param {object} errorInfo - Error information
     */
    reportIssue(errorInfo) {
        const subject = encodeURIComponent(`Bug Report: ${errorInfo.type} - ${errorInfo.id}`);
        const body = encodeURIComponent(`
Error ID: ${errorInfo.id}
Type: ${errorInfo.type}
Severity: ${errorInfo.severity}
Message: ${errorInfo.message}
Time: ${errorInfo.timestamp}
URL: ${errorInfo.metadata.url}

Please describe what you were doing when this error occurred:
[Please add your description here]
        `);
        
        window.open(`mailto:support@example.com?subject=${subject}&body=${body}`);
    }

    /**
     * Report error to monitoring service
     * @param {object} errorInfo - Error information
     */
    reportError(errorInfo) {
        // In a real application, this would send to a monitoring service
        console.log('[MONITORING] Reporting error:', errorInfo);
        
        // Could implement services like:
        // - Sentry
        // - LogRocket
        // - Custom analytics
    }

    /**
     * Generate unique error ID
     * @returns {string} Error ID
     */
    generateErrorId() {
        return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Get error log
     * @returns {Array} Error log
     */
    getErrorLog() {
        return [...this.errorLog];
    }

    /**
     * Clear error log
     */
    clearErrorLog() {
        this.errorLog = [];
        this.retryAttempts.clear();
    }

    /**
     * Show notification (wrapper for appStore)
     * @param {string} message - Notification message
     * @param {string} type - Notification type
     */
    showNotification(message, type = 'info') {
        appStore.addNotification({
            type,
            title: 'Notification',
            message,
            duration: 5000
        });
    }
}

// Create singleton instance
export const errorHandler = new ErrorHandler();

// Export default
export default errorHandler;