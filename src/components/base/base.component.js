/**
 * Base Component Class
 * Factory Pattern implementation for reusable UI components
 * Provides common component functionality and lifecycle management
 */

import appStore from '../../state/store/app.store.js';
import { createElement, addEventListener } from '../../core/utils/dom.utils.js';
import AppConfig from '../../core/config/app.config.js';

/**
 * Base Component Class
 * Implements common component patterns and lifecycle
 */
export class BaseComponent {
    constructor(options = {}) {
        this.options = {
            id: null,
            className: '',
            styles: {},
            data: {},
            events: {},
            ...options
        };

        this.element = null;
        this.children = new Map();
        this.eventListeners = new Map();
        this.destroyed = false;

        // Bind methods
        this.init = this.init.bind(this);
        this.destroy = this.destroy.bind(this);
        this.render = this.render.bind(this);
        this.update = this.update.bind(this);
        this.show = this.show.bind(this);
        this.hide = this.hide.bind(this);

        console.log(`[COMPONENT] ${this.constructor.name} created`);
    }

    /**
     * Initialize the component
     * @returns {Promise} Initialization promise
     */
    async init() {
        console.log(`[COMPONENT] Initializing ${this.constructor.name}...`);

        try {
            await this.preInit();
            await this.setupData();
            await this.setupEventListeners();
            await this.setupStateObservers();
            await this.createElement();
            await this.render();
            await this.attachToDOM();
            await this.postInit();

            console.log(`[COMPONENT] ${this.constructor.name} initialized`);
        } catch (error) {
            console.error(`[COMPONENT] ${this.constructor.name} initialization failed:`, error);
            throw error;
        }
    }

    /**
     * Destroy the component
     */
    destroy() {
        if (this.destroyed) {
            console.warn(`[COMPONENT] ${this.constructor.name} already destroyed`);
            return;
        }

        console.log(`[COMPONENT] Destroying ${this.constructor.name}...`);

        try {
            this.preDestroy();
            this.cleanupEventListeners();
            this.cleanupStateObservers();
            this.cleanupChildren();
            this.detachFromDOM();
            this.postDestroy();

            this.destroyed = true;
            console.log(`[COMPONENT] ${this.constructor.name} destroyed`);
        } catch (error) {
            console.error(`[COMPONENT] ${this.constructor.name} destruction failed:`, error);
        }
    }

    /**
     * Render the component
     * @returns {Promise} Render promise
     */
    async render() {
        console.log(`[COMPONENT] Rendering ${this.constructor.name}...`);

        try {
            await this.preRender();
            await this.renderContent();
            await this.renderChildren();
            await this.applyStyles();
            await this.postRender();

            console.log(`[COMPONENT] ${this.constructor.name} rendered`);
        } catch (error) {
            console.error(`[COMPONENT] ${this.constructor.name} render failed:`, error);
            throw error;
        }
    }

    /**
     * Update the component
     * @param {object} data - Update data
     * @returns {Promise} Update promise
     */
    async update(data) {
        console.log(`[COMPONENT] Updating ${this.constructor.name}...`, data);

        try {
            await this.preUpdate(data);
            await this.updateContent(data);
            await this.updateChildren(data);
            await this.postUpdate(data);

            console.log(`[COMPONENT] ${this.constructor.name} updated`);
        } catch (error) {
            console.error(`[COMPONENT] ${this.constructor.name} update failed:`, error);
            throw error;
        }
    }

    /**
     * Show the component
     */
    show() {
        if (this.element) {
            this.element.style.display = '';
            this.onShow();
        }
    }

    /**
     * Hide the component
     */
    hide() {
        if (this.element) {
            this.element.style.display = 'none';
            this.onHide();
        }
    }

    // === HOOK METHODS (Override in subclasses) ===

    /**
     * Pre-initialization hook
     */
    async preInit() {
        // Override in subclass
    }

    /**
     * Setup component data
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
     * Create the root element
     */
    async createElement() {
        this.element = createElement(this.getTagName(), {
            id: this.options.id,
            className: this.getClassName(),
            ...this.getAttributes()
        });
    }

    /**
     * Attach component to DOM
     */
    async attachToDOM() {
        // Override in subclass to specify where to attach
    }

    /**
     * Post-initialization hook
     */
    async postInit() {
        // Override in subclass
    }

    /**
     * Pre-render hook
     */
    async preRender() {
        // Override in subclass
    }

    /**
     * Render component content
     */
    async renderContent() {
        if (this.element) {
            this.element.innerHTML = this.getTemplate();
        }
    }

    /**
     * Render child components
     */
    async renderChildren() {
        // Override in subclass
    }

    /**
     * Apply component styles
     */
    async applyStyles() {
        if (this.element && this.options.styles) {
            Object.assign(this.element.style, this.options.styles);
        }
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
     * Update component content
     */
    async updateContent(data) {
        // Override in subclass
    }

    /**
     * Update child components
     */
    async updateChildren(data) {
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
     * Cleanup child components
     */
    cleanupChildren() {
        this.children.forEach((child, name) => {
            if (child && typeof child.destroy === 'function') {
                child.destroy();
            }
        });
        this.children.clear();
    }

    /**
     * Detach from DOM
     */
    detachFromDOM() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
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

    // === CONFIGURATION METHODS ===

    /**
     * Get the HTML tag name for this component
     * @returns {string} Tag name
     */
    getTagName() {
        return 'div'; // Default tag
    }

    /**
     * Get CSS class name for this component
     * @returns {string} Class name
     */
    getClassName() {
        return `component ${this.constructor.name.toLowerCase()} ${this.options.className}`.trim();
    }

    /**
     * Get additional attributes for the element
     * @returns {object} Attributes object
     */
    getAttributes() {
        return {};
    }

    /**
     * Get the HTML template for this component
     * @returns {string} HTML template
     */
    getTemplate() {
        return ''; // Override in subclass
    }

    // === UTILITY METHODS ===

    /**
     * Add child component
     * @param {string} name - Child name
     * @param {BaseComponent} component - Child component
     */
    addChild(name, component) {
        if (this.children.has(name)) {
            console.warn(`[COMPONENT] Child ${name} already exists, replacing`);
            this.removeChild(name);
        }

        this.children.set(name, component);
        console.log(`[COMPONENT] Added child: ${name}`);
    }

    /**
     * Remove child component
     * @param {string} name - Child name
     */
    removeChild(name) {
        const child = this.children.get(name);
        if (child) {
            if (typeof child.destroy === 'function') {
                child.destroy();
            }
            this.children.delete(name);
            console.log(`[COMPONENT] Removed child: ${name}`);
        }
    }

    /**
     * Get child component
     * @param {string} name - Child name
     * @returns {BaseComponent|null} Child component
     */
    getChild(name) {
        return this.children.get(name) || null;
    }

    /**
     * Add event listener with automatic cleanup
     * @param {string} event - Event type
     * @param {Function} handler - Event handler
     * @param {object} options - Event options
     * @returns {string} Listener ID
     */
    addEventListener(event, handler, options = {}) {
        if (!this.element) {
            console.warn(`[COMPONENT] Cannot add event listener: element not created`);
            return null;
        }

        const cleanup = addEventListener(this.element, event, handler, options);
        const listenerId = `${event}_${Date.now()}_${Math.random()}`;
        this.eventListeners.set(listenerId, { cleanup, event, handler });

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
     * Set component data
     * @param {object} data - Data object
     */
    setData(data) {
        this.options.data = { ...this.options.data, ...data };
        this.update(data);
    }

    /**
     * Get component data
     * @param {string} key - Data key (optional)
     * @returns {*} Data value or all data
     */
    getData(key = null) {
        return key ? this.options.data[key] : this.options.data;
    }

    /**
     * Get configuration value
     * @param {string} path - Configuration path
     * @returns {*} Configuration value
     */
    getConfig(path) {
        const keys = path.split('.');
        let value = AppConfig;

        for (const key of keys) {
            if (value && typeof value === 'object' && key in value) {
                value = value[key];
            } else {
                console.warn(`[COMPONENT] Configuration path not found: ${path}`);
                return null;
            }
        }

        return value;
    }

    /**
     * Show loading state
     */
    showLoading() {
        if (this.element) {
            this.element.classList.add('loading');
        }
    }

    /**
     * Hide loading state
     */
    hideLoading() {
        if (this.element) {
            this.element.classList.remove('loading');
        }
    }

    /**
     * Get component name for logging
     * @returns {string} Component name
     */
    getComponentName() {
        return this.constructor.name.replace('Component', '').toLowerCase();
    }

    /**
     * Log component event
     * @param {string} event - Event description
     * @param {*} data - Additional data
     */
    logEvent(event, data = null) {
        const componentName = this.getComponentName();
        console.log(`[COMPONENT-${componentName.toUpperCase()}] ${event}`, data || '');
    }

    /**
     * Log component error
     * @param {string} error - Error description
     * @param {*} data - Additional data
     */
    logError(error, data = null) {
        const componentName = this.getComponentName();
        console.error(`[COMPONENT-${componentName.toUpperCase()}] ${error}`, data || '');
    }
}

// Export the base class
export { BaseComponent };
