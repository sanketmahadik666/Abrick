/**
 * Application State Store
 * Observer Pattern implementation for global app state
 * Manages application-wide state changes and notifications
 */

import AppConfig from '../../core/config/app.config.js';

/**
 * Application Store Class
 * Manages global application state using Observer pattern
 */
export class AppStore {
    constructor() {
        this.state = {
            // Loading states
            loading: {
                global: false,
                toilets: false,
                reviews: false,
                auth: false
            },

            // UI states
            ui: {
                activeModal: null,
                notifications: [],
                sidebarOpen: false,
                theme: 'light'
            },

            // User state
            user: {
                isAuthenticated: false,
                data: null,
                token: null
            },

            // Application data
            data: {
                toilets: [],
                reviews: [],
                stats: null
            },

            // Application settings
            settings: {
                mapFilters: {
                    showPublic: true,
                    showPrivate: true
                },
                qrScanner: {
                    active: false,
                    lastScan: null
                }
            }
        };

        this.observers = new Map();
        this.history = [];
        this.maxHistorySize = 10;

        // Bind methods
        this.subscribe = this.subscribe.bind(this);
        this.unsubscribe = this.unsubscribe.bind(this);
        this.notify = this.notify.bind(this);
        this.getState = this.getState.bind(this);
        this.setState = this.setState.bind(this);
        this.resetState = this.resetState.bind(this);

        console.log('[STORE] App store initialized');
    }

    /**
     * Subscribe to state changes
     * @param {string} event - Event type to subscribe to
     * @param {Function} observer - Observer function
     * @returns {Function} Unsubscribe function
     */
    subscribe(event, observer) {
        if (!this.observers.has(event)) {
            this.observers.set(event, new Set());
        }

        this.observers.get(event).add(observer);

        // Return unsubscribe function
        return () => this.unsubscribe(event, observer);
    }

    /**
     * Unsubscribe from state changes
     * @param {string} event - Event type
     * @param {Function} observer - Observer function
     */
    unsubscribe(event, observer) {
        if (this.observers.has(event)) {
            this.observers.get(event).delete(observer);
        }
    }

    /**
     * Notify observers of state changes
     * @param {string} event - Event type
     * @param {*} data - Event data
     */
    notify(event, data) {
        if (this.observers.has(event)) {
            this.observers.get(event).forEach(observer => {
                try {
                    observer(event, data, this.getState());
                } catch (error) {
                    console.error(`[STORE] Observer error for event ${event}:`, error);
                }
            });
        }
    }

    /**
     * Get current state (immutable copy)
     * @returns {object} Current state
     */
    getState() {
        return JSON.parse(JSON.stringify(this.state));
    }

    /**
     * Update state and notify observers
     * @param {Function|object} updater - State updater function or partial state object
     * @param {object} options - Update options
     */
    setState(updater, options = {}) {
        const prevState = this.getState();
        let newState;

        if (typeof updater === 'function') {
            newState = updater(prevState);
        } else if (typeof updater === 'object') {
            newState = this.deepMerge(prevState, updater);
        } else {
            console.warn('[STORE] Invalid updater provided to setState');
            return;
        }

        // Validate state structure
        if (!this.validateState(newState)) {
            console.error('[STORE] Invalid state structure');
            return;
        }

        this.state = newState;

        // Add to history
        this.addToHistory(prevState, newState, options);

        // Notify observers
        if (options.silent !== true) {
            this.notify('state:changed', {
                prevState,
                newState,
                changes: this.getStateChanges(prevState, newState)
            });
        }

        console.log(`[STORE] State updated:`, options.description || 'State change');
    }

    /**
     * Deep merge objects
     * @param {object} target - Target object
     * @param {object} source - Source object
     * @returns {object} Merged object
     */
    deepMerge(target, source) {
        const result = { ...target };

        Object.keys(source).forEach(key => {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                result[key] = this.deepMerge(target[key] || {}, source[key]);
            } else {
                result[key] = source[key];
            }
        });

        return result;
    }

    /**
     * Validate state structure
     * @param {object} state - State to validate
     * @returns {boolean} Is valid
     */
    validateState(state) {
        const requiredKeys = ['loading', 'ui', 'user', 'data', 'settings'];
        return requiredKeys.every(key => key in state);
    }

    /**
     * Get state changes between two states
     * @param {object} prevState - Previous state
     * @param {object} newState - New state
     * @returns {object} Changes object
     */
    getStateChanges(prevState, newState) {
        const changes = {};

        const findChanges = (obj1, obj2, path = '') => {
            Object.keys(obj2).forEach(key => {
                const currentPath = path ? `${path}.${key}` : key;

                if (!(key in obj1)) {
                    changes[currentPath] = { from: undefined, to: obj2[key] };
                } else if (obj1[key] !== obj2[key]) {
                    if (typeof obj1[key] === 'object' && typeof obj2[key] === 'object') {
                        findChanges(obj1[key], obj2[key], currentPath);
                    } else {
                        changes[currentPath] = { from: obj1[key], to: obj2[key] };
                    }
                }
            });
        };

        findChanges(prevState, newState);
        return changes;
    }

    /**
     * Add state change to history
     * @param {object} prevState - Previous state
     * @param {object} newState - New state
     * @param {object} options - Change options
     */
    addToHistory(prevState, newState, options) {
        this.history.push({
            timestamp: new Date(),
            prevState,
            newState,
            description: options.description || 'State change',
            changes: this.getStateChanges(prevState, newState)
        });

        // Limit history size
        if (this.history.length > this.maxHistorySize) {
            this.history.shift();
        }
    }

    /**
     * Reset state to initial values
     */
    resetState() {
        const initialState = {
            loading: {
                global: false,
                toilets: false,
                reviews: false,
                auth: false
            },
            ui: {
                activeModal: null,
                notifications: [],
                sidebarOpen: false,
                theme: 'light'
            },
            user: {
                isAuthenticated: false,
                data: null,
                token: null
            },
            data: {
                toilets: [],
                reviews: [],
                stats: null
            },
            settings: {
                mapFilters: {
                    showPublic: true,
                    showPrivate: true
                },
                qrScanner: {
                    active: false,
                    lastScan: null
                }
            }
        };

        this.setState(initialState, { description: 'State reset' });
    }

    /**
     * Get state history
     * @returns {Array} State history
     */
    getHistory() {
        return [...this.history];
    }

    // Convenience methods for common state updates

    /**
     * Set loading state
     * @param {string} key - Loading key
     * @param {boolean} value - Loading value
     */
    setLoading(key, value) {
        this.setState(prevState => ({
            ...prevState,
            loading: {
                ...prevState.loading,
                [key]: value
            }
        }), { description: `Loading ${key}: ${value}` });
    }

    /**
     * Set user authentication state
     * @param {boolean} isAuthenticated - Authentication status
     * @param {object} userData - User data
     * @param {string} token - Auth token
     */
    setUser(isAuthenticated, userData = null, token = null) {
        this.setState(prevState => ({
            ...prevState,
            user: {
                isAuthenticated,
                data: userData,
                token
            }
        }), { description: `User authentication: ${isAuthenticated}` });
    }

    /**
     * Add notification
     * @param {object} notification - Notification object
     */
    addNotification(notification) {
        const id = Date.now().toString();
        const notificationWithId = { ...notification, id };

        this.setState(prevState => ({
            ...prevState,
            ui: {
                ...prevState.ui,
                notifications: [...prevState.ui.notifications, notificationWithId]
            }
        }), { description: 'Notification added' });

        // Auto-remove notification after duration
        if (notification.duration !== 0) {
            setTimeout(() => {
                this.removeNotification(id);
            }, notification.duration || AppConfig.ui.toastDuration);
        }

        return id;
    }

    /**
     * Remove notification
     * @param {string} id - Notification ID
     */
    removeNotification(id) {
        this.setState(prevState => ({
            ...prevState,
            ui: {
                ...prevState.ui,
                notifications: prevState.ui.notifications.filter(n => n.id !== id)
            }
        }), { description: 'Notification removed' });
    }

    /**
     * Update toilet data
     * @param {Array} toilets - Toilet array
     */
    setToilets(toilets) {
        this.setState(prevState => ({
            ...prevState,
            data: {
                ...prevState.data,
                toilets: toilets || []
            }
        }), { description: 'Toilets updated' });
    }

    /**
     * Update review data
     * @param {Array} reviews - Review array
     */
    setReviews(reviews) {
        this.setState(prevState => ({
            ...prevState,
            data: {
                ...prevState.data,
                reviews: reviews || []
            }
        }), { description: 'Reviews updated' });
    }
}

// Create singleton instance
export const appStore = new AppStore();

// Export default
export default appStore;
