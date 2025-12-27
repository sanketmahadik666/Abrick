/**
 * Main Application Entry Point
 * Orchestrates all modules and initializes the application
 * Follows the Facade Pattern - provides single interface to complex system
 */

import AppConfig from './core/config/app.config.js';
import appStore from './state/store/app.store.js';
import { baseApiService } from './services/api/base-api.service.js';
import { $ } from './core/utils/dom.utils.js';

/**
 * Main Application Class
 * Coordinates all modules and manages application lifecycle
 */
export class ToiletReviewApp {
    constructor() {
        this.modules = new Map();
        this.initialized = false;
        this.currentPage = null;

        // Bind methods
        this.init = this.init.bind(this);
        this.destroy = this.destroy.bind(this);
        this.navigateTo = this.navigateTo.bind(this);
        this.handleGlobalError = this.handleGlobalError.bind(this);
        this.handleUnhandledRejection = this.handleUnhandledRejection.bind(this);

        console.log('[APP] Toilet Review Application created');
    }

    /**
     * Initialize the application
     * @returns {Promise} Initialization promise
     */
    async init() {
        try {
            console.log('[APP] Initializing Toilet Review Application...');

            // Set up global error handlers
            this.setupGlobalErrorHandlers();

            // Initialize core systems
            await this.initializeCoreSystems();

            // Load page-specific modules based on current page
            await this.initializePageModules();

            // Set up global event listeners
            this.setupGlobalEventListeners();

            this.initialized = true;
            console.log('[APP] Application initialized successfully');

            // Dispatch app ready event
            window.dispatchEvent(new CustomEvent('app:ready', {
                detail: { app: this, config: AppConfig }
            }));

        } catch (error) {
            console.error('[APP] Initialization failed:', error);
            this.handleInitializationError(error);
        }
    }

    /**
     * Set up global error handlers
     */
    setupGlobalErrorHandlers() {
        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', this.handleUnhandledRejection);

        // Handle global errors
        window.addEventListener('error', this.handleGlobalError);

        // Handle app-specific errors
        appStore.subscribe('app:error', (event, data) => {
            console.error('[APP] Application error:', data);
            this.showErrorNotification(data.message || 'An application error occurred');
        });
    }

    /**
     * Handle unhandled promise rejections
     * @param {PromiseRejectionEvent} event - Rejection event
     */
    handleUnhandledRejection(event) {
        console.error('[APP] Unhandled promise rejection:', event.reason);
        event.preventDefault();

        appStore.addNotification({
            type: 'error',
            title: 'Application Error',
            message: 'An unexpected error occurred. Please refresh the page.',
            duration: 0 // Don't auto-remove critical errors
        });
    }

    /**
     * Handle global errors
     * @param {ErrorEvent} event - Error event
     */
    handleGlobalError(event) {
        console.error('[APP] Global error:', event.error);

        // Only show notification for non-script errors
        if (!event.filename || !event.filename.includes('.js')) {
            appStore.addNotification({
                type: 'error',
                title: 'Application Error',
                message: 'Something went wrong. Please try again.',
                duration: 5000
            });
        }
    }

    /**
     * Initialize core systems
     * @returns {Promise} Initialization promise
     */
    async initializeCoreSystems() {
        console.log('[APP] Initializing core systems...');

        // Initialize API service with authentication interceptor
        this.initializeApiService();

        // Initialize state management
        this.initializeStateManagement();

        // Initialize performance monitoring
        this.initializePerformanceMonitoring();

        console.log('[APP] Core systems initialized');
    }

    /**
     * Initialize API service with interceptors
     */
    initializeApiService() {
        // Add authentication request interceptor
        baseApiService.addRequestInterceptor(async (options) => {
            const token = appStore.getState().user.token;
            if (token) {
                options.headers = {
                    ...options.headers,
                    'Authorization': `Bearer ${token}`
                };
            }
            return options;
        });

        // Add response interceptor for error handling
        baseApiService.addResponseInterceptor(async (data, response) => {
            // Handle common API response patterns
            if (data && typeof data === 'object') {
                // Handle nested success/data pattern
                if (data.success === false && data.message) {
                    throw new Error(data.message);
                }

                // Extract data from response wrapper
                if (data.success && data.data) {
                    return data.data;
                }
            }
            return data;
        });

        // Add loading state management
        baseApiService.addRequestInterceptor(async (options) => {
            appStore.setLoading('api', true);
            return options;
        });

        baseApiService.addResponseInterceptor(async (data, response) => {
            appStore.setLoading('api', false);
            return data;
        });
    }

    /**
     * Initialize state management
     */
    initializeStateManagement() {
        // Set up state change observers
        appStore.subscribe('state:changed', (event, data) => {
            console.log('[APP] State changed:', data.changes);
            this.handleStateChange(data);
        });

        // Initialize user authentication state from localStorage
        const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
        if (token) {
            try {
                // Validate token format (basic check)
                if (token.split('.').length === 3) {
                    appStore.setUser(true, null, token);
                    console.log('[APP] Restored authentication from localStorage');
                }
            } catch (error) {
                console.warn('[APP] Invalid token in localStorage, clearing');
                localStorage.removeItem('adminToken');
                localStorage.removeItem('token');
            }
        }
    }

    /**
     * Handle state changes
     * @param {object} changeData - State change data
     */
    handleStateChange(changeData) {
        // Handle authentication state changes
        if (changeData.changes['user.isAuthenticated']) {
            this.handleAuthenticationChange(changeData.changes['user.isAuthenticated'].to);
        }

        // Handle loading state changes
        if (changeData.changes['loading.global']) {
            this.handleLoadingChange(changeData.changes['loading.global'].to);
        }
    }

    /**
     * Handle authentication state changes
     * @param {boolean} isAuthenticated - New authentication state
     */
    handleAuthenticationChange(isAuthenticated) {
        if (isAuthenticated) {
            console.log('[APP] User authenticated');
            // Update UI for authenticated user
            this.updateAuthenticatedUI(true);
        } else {
            console.log('[APP] User logged out');
            // Update UI for unauthenticated user
            this.updateAuthenticatedUI(false);
        }
    }

    /**
     * Handle loading state changes
     * @param {boolean} isLoading - New loading state
     */
    handleLoadingChange(isLoading) {
        const loadingOverlay = $('#globalLoading');
        if (loadingOverlay) {
            if (isLoading) {
                loadingOverlay.classList.remove('hidden');
            } else {
                loadingOverlay.classList.add('hidden');
            }
        }
    }

    /**
     * Update UI based on authentication state
     * @param {boolean} isAuthenticated - Authentication state
     */
    updateAuthenticatedUI(isAuthenticated) {
        // Update navigation elements
        const adminLinks = document.querySelectorAll('.admin-link');
        const logoutButtons = document.querySelectorAll('.logout-btn');

        adminLinks.forEach(link => {
            link.style.display = isAuthenticated ? 'inline' : 'none';
        });

        logoutButtons.forEach(button => {
            button.style.display = isAuthenticated ? 'inline' : 'none';
        });
    }

    /**
     * Initialize performance monitoring
     */
    initializePerformanceMonitoring() {
        // Monitor page load performance
        if (window.performance && window.performance.timing) {
            window.addEventListener('load', () => {
                const perfData = window.performance.timing;
                const loadTime = perfData.loadEventEnd - perfData.navigationStart;

                console.log(`[PERF] Page load time: ${loadTime}ms`);

                // Track performance metrics if enabled
                if (AppConfig.features.enableAnalytics) {
                    // Could send to analytics service
                    appStore.notify('performance:pageLoad', { loadTime });
                }
            });
        }

        // Monitor memory usage (if supported)
        if (window.performance && window.performance.memory) {
            setInterval(() => {
                const memInfo = window.performance.memory;
                console.log(`[PERF] Memory: ${Math.round(memInfo.usedJSHeapSize / 1024 / 1024)}MB used`);
            }, 30000); // Every 30 seconds
        }
    }

    /**
     * Initialize page-specific modules
     * @returns {Promise} Initialization promise
     */
    async initializePageModules() {
        const currentPath = window.location.pathname;

        console.log('[APP] Initializing page modules for path:', currentPath);

        // Determine which page we're on
        if (currentPath === '/' || currentPath === '/index.html') {
            await this.initializeHomePage();
        } else if (currentPath === '/admin.html') {
            await this.initializeAdminPage();
        } else if (currentPath === '/review.html') {
            await this.initializeReviewPage();
        }

        console.log('[APP] Page modules initialized');
    }

    /**
     * Initialize home page modules
     * @returns {Promise} Initialization promise
     */
    async initializeHomePage() {
        this.currentPage = 'home';
        console.log('[APP] Initializing home page modules');

        // Dynamic import for code splitting
        try {
            const { HomePage } = await import('./pages/home/home.page.js');
            const homePage = new HomePage();
            await homePage.init();

            this.modules.set('homePage', homePage);
            console.log('[APP] Home page initialized');
        } catch (error) {
            console.error('[APP] Failed to load home page module:', error);
        }
    }

    /**
     * Initialize admin page modules
     * @returns {Promise} Initialization promise
     */
    async initializeAdminPage() {
        this.currentPage = 'admin';
        console.log('[APP] Initializing admin page modules');

        try {
            const { AdminPage } = await import('./pages/admin/admin.page.js');
            const adminPage = new AdminPage();
            await adminPage.init();

            this.modules.set('adminPage', adminPage);
            console.log('[APP] Admin page initialized');
        } catch (error) {
            console.error('[APP] Failed to load admin page module:', error);
        }
    }

    /**
     * Initialize review page modules
     * @returns {Promise} Initialization promise
     */
    async initializeReviewPage() {
        this.currentPage = 'review';
        console.log('[APP] Initializing review page modules');

        try {
            const { ReviewPage } = await import('./pages/review/review.page.js');
            const reviewPage = new ReviewPage();
            await reviewPage.init();

            this.modules.set('reviewPage', reviewPage);
            console.log('[APP] Review page initialized');
        } catch (error) {
            console.error('[APP] Failed to load review page module:', error);
        }
    }

    /**
     * Set up global event listeners
     */
    setupGlobalEventListeners() {
        // Handle navigation
        document.addEventListener('click', (event) => {
            if (event.target.matches('[data-navigate]')) {
                event.preventDefault();
                const target = event.target.getAttribute('data-navigate');
                this.navigateTo(target);
            }
        });

        // Handle form submissions globally
        document.addEventListener('submit', (event) => {
            // Let individual components handle their forms
            // This is just for global form handling if needed
        });

        // Handle keyboard shortcuts
        document.addEventListener('keydown', (event) => {
            // ESC key handling
            if (event.key === 'Escape') {
                // Close modals, clear selections, etc.
                appStore.setState(prevState => ({
                    ...prevState,
                    ui: {
                        ...prevState.ui,
                        activeModal: null
                    }
                }));
            }
        });

        // Handle online/offline status
        window.addEventListener('online', () => {
            appStore.addNotification({
                type: 'success',
                title: 'Connection Restored',
                message: 'You are back online',
                duration: 3000
            });
        });

        window.addEventListener('offline', () => {
            appStore.addNotification({
                type: 'warning',
                title: 'Connection Lost',
                message: 'You are currently offline',
                duration: 0 // Don't auto-remove
            });
        });
    }

    /**
     * Navigate to a different page or section
     * @param {string} target - Navigation target
     */
    navigateTo(target) {
        console.log('[APP] Navigating to:', target);

        // Handle different navigation types
        if (target.startsWith('http')) {
            window.location.href = target;
        } else if (target === 'home') {
            window.location.href = '/';
        } else if (target === 'admin') {
            window.location.href = '/admin.html';
        } else if (target === 'review') {
            window.location.href = '/review.html';
        } else {
            // Handle in-page navigation (scrolling, modals, etc.)
            this.handleInPageNavigation(target);
        }
    }

    /**
     * Handle in-page navigation
     * @param {string} target - Navigation target
     */
    handleInPageNavigation(target) {
        if (target.startsWith('#')) {
            // Handle anchor links
            const element = $(target);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
            }
        } else {
            // Handle other in-page navigation
            console.log('[APP] In-page navigation to:', target);
        }
    }

    /**
     * Show error notification
     * @param {string} message - Error message
     */
    showErrorNotification(message) {
        appStore.addNotification({
            type: 'error',
            title: 'Error',
            message: message,
            duration: 5000
        });
    }

    /**
     * Handle initialization errors
     * @param {Error} error - Initialization error
     */
    handleInitializationError(error) {
        console.error('[APP] Initialization error:', error);

        // Show error in UI
        const loadingOverlay = $('#globalLoading');
        if (loadingOverlay) {
            loadingOverlay.innerHTML = `
                <div class="global-loading-spinner"></div>
                <div class="global-loading-text">
                    Failed to initialize application.<br>
                    <small>${error.message}</small><br><br>
                    <button onclick="window.location.reload()" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        Reload Page
                    </button>
                </div>
            `;
        }
    }

    /**
     * Destroy the application and clean up resources
     */
    destroy() {
        console.log('[APP] Destroying application...');

        // Remove event listeners
        window.removeEventListener('unhandledrejection', this.handleUnhandledRejection);
        window.removeEventListener('error', this.handleGlobalError);

        // Destroy modules
        this.modules.forEach((module, name) => {
            if (typeof module.destroy === 'function') {
                try {
                    module.destroy();
                    console.log(`[APP] Destroyed module: ${name}`);
                } catch (error) {
                    console.error(`[APP] Error destroying module ${name}:`, error);
                }
            }
        });

        // Clear modules map
        this.modules.clear();

        // Reset store
        appStore.resetState();

        this.initialized = false;
        console.log('[APP] Application destroyed');
    }

    /**
     * Get application info
     * @returns {object} Application information
     */
    getInfo() {
        return {
            name: AppConfig.name,
            version: AppConfig.version,
            initialized: this.initialized,
            currentPage: this.currentPage,
            modules: Array.from(this.modules.keys()),
            environment: AppConfig.environment
        };
    }
}

// Create singleton instance
export const toiletReviewApp = new ToiletReviewApp();

// Auto-initialize when DOM is ready (if not using manual initialization)
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        toiletReviewApp.init().catch(error => {
            console.error('[APP] Auto-initialization failed:', error);
        });
    });
} else {
    // DOM already loaded
    toiletReviewApp.init().catch(error => {
        console.error('[APP] Auto-initialization failed:', error);
    });
}

// Export default
export default toiletReviewApp;
