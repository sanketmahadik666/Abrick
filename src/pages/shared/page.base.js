/**
 * Base Page Class
 * Template Method Pattern implementation for page management
 * Provides common page lifecycle and functionality
 */

import appStore from '../../state/store/app.store.js';
import { $ } from '../../core/utils/dom.utils.js';
import AppConfig from '../../core/config/app.config.js';

/**
 * Base Page Class
 * Implements Template Method pattern for consistent page behavior
 */
export class BasePage {
    constructor(options = {}) {
        this.options = {
            requiresAuth: false,
            requiredRole: null,
            ...options
        };

        this.initialized = false;
        this.destroyed = false;
        this.eventListeners = new Map();

        // Bind methods to preserve context
        this.init = this.init.bind(this);
        this.destroy = this.destroy.bind(this);
        this.render = this.render.bind(this);
        this.update = this.update.bind(this);
        this.show = this.show.bind(this);
        this.hide = this.hide.bind(this);

        console.log(`[PAGE] ${this.constructor.name} created`);
    }

    /**
     * Template Method: Initialize the page
     * @returns {Promise} Initialization promise
     */
    async init() {
        if (this.initialized) {
            console.warn(`[PAGE] ${this.constructor.name} already initialized`);
            return;
        }

        console.log(`[PAGE] Initializing ${this.constructor.name}...`);

        try {
            // Check authentication if required
            if (this.options.requiresAuth) {
                await this.checkAuthentication();
            }

            // Template method calls
            await this.preInitialize();
            await this.setupData();
            await this.setupEventListeners();
            await this.setupStateObservers();
            await this.render();
            await this.postInitialize();

            this.initialized = true;
            console.log(`[PAGE] ${this.constructor.name} initialized successfully`);

        } catch (error) {
            console.error(`[PAGE] ${this.constructor.name} initialization failed:`, error);
            await this.handleInitializationError(error);
            throw error;
        }
    }

    /**
     * Template Method: Destroy the page
     */
    destroy() {
        if (this.destroyed) {
            console.warn(`[PAGE] ${this.constructor.name} already destroyed`);
            return;
        }

        console.log(`[PAGE] Destroying ${this.constructor.name}...`);

        try {
            // Template method calls
            this.preDestroy();
            this.cleanupEventListeners();
            this.cleanupStateObservers();
            this.cleanupDOM();
            this.postDestroy();

            this.destroyed = true;
            console.log(`[PAGE] ${this.constructor.name} destroyed successfully`);

        } catch (error) {
            console.error(`[PAGE] ${this.constructor.name} destruction failed:`, error);
        }
    }

    /**
     * Template Method: Render the page
     * @returns {Promise} Render promise
     */
    async render() {
        console.log(`[PAGE] Rendering ${this.constructor.name}...`);

        try {
            await this.preRender();
            await this.renderContent();
            await this.renderComponents();
            await this.postRender();

            console.log(`[PAGE] ${this.constructor.name} rendered successfully`);
        } catch (error) {
            console.error(`[PAGE] ${this.constructor.name} render failed:`, error);
            throw error;
        }
    }

    /**
     * Template Method: Update the page
     * @param {object} data - Update data
     * @returns {Promise} Update promise
     */
    async update(data) {
        console.log(`[PAGE] Updating ${this.constructor.name}...`, data);

        try {
            await this.preUpdate(data);
            await this.updateContent(data);
            await this.updateComponents(data);
            await this.postUpdate(data);

            console.log(`[PAGE] ${this.constructor.name} updated successfully`);
        } catch (error) {
            console.error(`[PAGE] ${this.constructor.name} update failed:`, error);
            throw error;
        }
    }

    /**
     * Show the page
     */
    show() {
        console.log(`[PAGE] Showing ${this.constructor.name}`);
        this.setVisibility(true);
        this.onShow();
    }

    /**
     * Hide the page
     */
    hide() {
        console.log(`[PAGE] Hiding ${this.constructor.name}`);
        this.setVisibility(false);
        this.onHide();
    }

    // === HOOK METHODS (Override in subclasses) ===

    /**
     * Pre-initialization hook
     */
    async preInitialize() {
        // Override in subclass
    }

    /**
     * Setup data for the page
     */
    async setupData() {
        // Override in subclass
    }

    /**
     * Setup event listeners
     */
    async setupEventListeners() {
        // Override in subclass
    }

    /**
     * Setup state observers
     */
    async setupStateObservers() {
        // Override in subclass
    }

    /**
     * Post-initialization hook
     */
    async postInitialize() {
        // Override in subclass
    }

    /**
     * Pre-render hook
     */
    async preRender() {
        // Override in subclass
    }

    /**
     * Render page content
     */
    async renderContent() {
        // Override in subclass
    }

    /**
     * Render page components
     */
    async renderComponents() {
        // Override in subclass
    }

    /**
     * Post-render hook
     */
    async postRender() {
        // Override in subclass
    }

    /**
     * Pre-update hook
     */
    async preUpdate(data) {
        // Override in subclass
    }

    /**
     * Update page content
     */
    async updateContent(data) {
        // Override in subclass
    }

    /**
     * Update page components
     */
    async updateComponents(data) {
        // Override in subclass
    }

    /**
     * Post-update hook
     */
    async postUpdate(data) {
        // Override in subclass
    }

    /**
     * Pre-destroy hook
     */
    preDestroy() {
        // Override in subclass
    }

    /**
     * Cleanup event listeners
     */
    cleanupEventListeners() {
        this.eventListeners.forEach((listener, key) => {
            if (typeof listener.cleanup === 'function') {
                listener.cleanup();
            }
        });
        this.eventListeners.clear();
    }

    /**
     * Cleanup state observers
     */
    cleanupStateObservers() {
        // Override in subclass if needed
    }

    /**
     * Cleanup DOM elements
     */
    cleanupDOM() {
        // Override in subclass if needed
    }

    /**
     * Post-destroy hook
     */
    postDestroy() {
        // Override in subclass
    }

    /**
     * On show callback
     */
    onShow() {
        // Override in subclass
    }

    /**
     * On hide callback
     */
    onHide() {
        // Override in subclass
    }

    // === UTILITY METHODS ===

    /**
     * Check authentication requirements
     * @throws {Error} Authentication error
     */
    async checkAuthentication() {
        const user = appStore.getState().user;

        if (!user.isAuthenticated) {
            throw new Error('Authentication required');
        }

        if (this.options.requiredRole) {
            const userRole = user.data?.role || 'user';
            if (userRole !== this.options.requiredRole && userRole !== 'admin') {
                throw new Error(`Required role: ${this.options.requiredRole}`);
            }
        }
    }

    /**
     * Handle initialization error
     * @param {Error} error - Initialization error
     */
    async handleInitializationError(error) {
        console.error(`[PAGE] ${this.constructor.name} initialization error:`, error);

        // Show error notification
        appStore.addNotification({
            type: 'error',
            title: 'Page Load Error',
            message: `${this.constructor.name} failed to load: ${error.message}`,
            duration: 5000
        });

        // Attempt graceful degradation
        this.renderErrorState(error);
    }

    /**
     * Render error state
     * @param {Error} error - Error that occurred
     */
    renderErrorState(error) {
        const pageContainer = this.getPageContainer();
        if (pageContainer) {
            pageContainer.innerHTML = `
                <div class="page-error">
                    <h2>Page Load Error</h2>
                    <p>Sorry, we encountered an error while loading this page.</p>
                    <p><strong>Error:</strong> ${error.message}</p>
                    <button onclick="window.location.reload()" class="btn">
                        Reload Page
                    </button>
                </div>
            `;
        }
    }

    /**
     * Set page visibility
     * @param {boolean} visible - Visibility state
     */
    setVisibility(visible) {
        const pageContainer = this.getPageContainer();
        if (pageContainer) {
            pageContainer.style.display = visible ? 'block' : 'none';
        }
    }

    /**
     * Get page container element
     * @returns {Element|null} Page container element
     */
    getPageContainer() {
        // Override in subclass to return specific container
        return null;
    }

    /**
     * Add event listener with automatic cleanup
     * @param {Element} element - Target element
     * @param {string} event - Event type
     * @param {Function} handler - Event handler
     * @param {object} options - Event options
     * @returns {string} Listener ID for removal
     */
    addEventListener(element, event, handler, options = {}) {
        // Import synchronously since dom.utils is already loaded
        const { addEventListener: addListener } = require('../../core/utils/dom.utils.js');
        const cleanup = addListener(element, event, handler, options);

        const listenerId = `${event}_${Date.now()}_${Math.random()}`;
        this.eventListeners.set(listenerId, { cleanup, element, event, handler });

        return listenerId;
    }

    /**
     * Remove event listener
     * @param {string} listenerId - Listener ID
     */
    removeEventListener(listenerId) {
        const listener = this.eventListeners.get(listenerId);
        if (listener && typeof listener.cleanup === 'function') {
            listener.cleanup();
            this.eventListeners.delete(listenerId);
        }
    }

    /**
     * Subscribe to state changes
     * @param {string} event - State event
     * @param {Function} observer - Observer function
     * @returns {Function} Unsubscribe function
     */
    subscribeToState(event, observer) {
        return appStore.subscribe(event, observer);
    }

    /**
     * Show loading state
     * @param {string} key - Loading key
     */
    showLoading(key = 'page') {
        appStore.setLoading(key, true);
    }

    /**
     * Hide loading state
     * @param {string} key - Loading key
     */
    hideLoading(key = 'page') {
        appStore.setLoading(key, false);
    }

    /**
     * Show notification
     * @param {object} notification - Notification config
     * @returns {string} Notification ID
     */
    showNotification(notification) {
        return appStore.addNotification(notification);
    }

    /**
     * Get current user from state
     * @returns {object|null} User object
     */
    getCurrentUser() {
        return appStore.getState().user;
    }

    /**
     * Check if user is authenticated
     * @returns {boolean} Authentication status
     */
    isAuthenticated() {
        return appStore.getState().user.isAuthenticated;
    }

    /**
     * Get configuration value
     * @param {string} path - Configuration path (dot notation)
     * @returns {*} Configuration value
     */
    getConfig(path) {
        const keys = path.split('.');
        let value = AppConfig;

        for (const key of keys) {
            if (value && typeof value === 'object' && key in value) {
                value = value[key];
            } else {
                console.warn(`[PAGE] Configuration path not found: ${path}`);
                return null;
            }
        }

        return value;
    }

    /**
     * Get page name for logging
     * @returns {string} Page name
     */
    getPageName() {
        return this.constructor.name.replace('Page', '').toLowerCase();
    }

    /**
     * Log page event
     * @param {string} event - Event description
     * @param {*} data - Additional data
     */
    logEvent(event, data = null) {
        const pageName = this.getPageName();
        console.log(`[PAGE-${pageName.toUpperCase()}] ${event}`, data || '');
    }

    /**
     * Log page error
     * @param {string} error - Error description
     * @param {*} data - Additional data
     */
    logError(error, data = null) {
        const pageName = this.getPageName();
        console.error(`[PAGE-${pageName.toUpperCase()}] ${error}`, data || '');
    }
}

// Export is already done as class export above
