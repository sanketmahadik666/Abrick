/**
 * Application Configuration
 * Centralizes all app-wide configuration settings
 * Follows Single Responsibility Principle - only handles configuration
 */

const AppConfig = {
    // Application metadata
    name: 'Toilet Review System',
    version: '1.0.0',
    author: 'Sanket',

    // API Configuration
    api: {
        baseUrl: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
            ? 'http://localhost:3000'
            : window.location.origin,
        timeout: 10000, // 10 seconds
        retries: 3,
        retryDelay: 1000
    },

    // UI Configuration
    ui: {
        loadingDelay: 300, // Minimum loading time in ms
        toastDuration: 3000, // Toast message duration
        modalAnimationDuration: 300,
        debounceDelay: 250
    },

    // Map Configuration
    map: {
        defaultCenter: [18.5204, 73.8567], // Pune, India
        defaultZoom: 12,
        maxZoom: 18,
        minZoom: 3,
        clusterRadius: 50,
        maxClusterRadius: 100
    },

    // QR Scanner Configuration
    qrScanner: {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        showTorchButtonIfSupported: true,
        showZoomSliderIfSupported: true
    },

    // Cache Configuration
    cache: {
        defaultTTL: 3600000, // 1 hour in milliseconds
        maxSize: 50, // Maximum cache entries
        compressionThreshold: 1000 // Compress data larger than this
    },

    // Validation Rules
    validation: {
        minPasswordLength: 8,
        maxPasswordLength: 128,
        emailRegex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        maxCommentLength: 500
    },

    // Rating Configuration
    rating: {
        minValue: 1,
        maxValue: 5,
        categories: ['overall', 'cleanliness', 'maintenance', 'accessibility']
    },

    // Environment detection
    environment: {
        isDevelopment: window.location.hostname === 'localhost' ||
                      window.location.hostname === '127.0.0.1' ||
                      window.location.port === '3000',
        isProduction: window.location.protocol === 'https:' &&
                     window.location.hostname !== 'localhost',
        userAgent: navigator.userAgent,
        supportsTouch: 'ontouchstart' in window,
        supportsGeolocation: 'geolocation' in navigator
    },

    // Feature flags
    features: {
        enableCaching: true,
        enableOfflineMode: false,
        enablePushNotifications: false,
        enableAnalytics: false,
        enableDebugLogging: true
    },

    // Performance settings
    performance: {
        enableLazyLoading: true,
        enableImageOptimization: true,
        enableCodeSplitting: false,
        bundleSizeLimit: 500 * 1024 // 500KB
    }
};

// Freeze configuration to prevent accidental modifications
Object.freeze(AppConfig);
Object.freeze(AppConfig.api);
Object.freeze(AppConfig.ui);
Object.freeze(AppConfig.map);
Object.freeze(AppConfig.qrScanner);
Object.freeze(AppConfig.cache);
Object.freeze(AppConfig.validation);
Object.freeze(AppConfig.rating);
Object.freeze(AppConfig.environment);
Object.freeze(AppConfig.features);
Object.freeze(AppConfig.performance);

export default AppConfig;
