/**
 * API Constants
 * Centralizes all API-related constants
 * Follows DRY principle - single source of truth for API paths and settings
 */

export const API_ENDPOINTS = {
    // Toilet endpoints
    TOILETS: {
        MAP: 'toilet/map',
        STATS: 'toilet/stats',
        ADD_PRIVATE: 'toilet/add-private',
        SYNC_PUBLIC: 'toilet/sync-public',
        BY_ID: (id) => `toilet/${id}`,
        QR_CODE: (id) => `toilet/${id}/qr`
    },

    // Review endpoints
    REVIEWS: {
        SUBMIT: 'review/submit',
        ALL: 'review/all',
        BY_TOILET: (toiletId) => `review/toilet/${toiletId}`,
        BY_ID: (id) => `reviews/${id}`
    },

    // Authentication endpoints
    AUTH: {
        LOGIN: 'auth/login',
        REGISTER: 'auth/register',
        LOGOUT: 'auth/logout',
        ME: 'auth/me'
    },

    // Admin endpoints
    ADMIN: {
        LOGIN: 'admin/login',
        DASHBOARD: 'admin/dashboard',
        STATS: 'admin/stats'
    },

    // System endpoints
    SYSTEM: {
        SLO_METRICS: 'slo/metrics',
        CACHE_STATS: 'cache/stats',
        CACHE_INVALIDATE: 'cache/invalidate'
    }
};

export const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503
};

export const HTTP_METHODS = {
    GET: 'GET',
    POST: 'POST',
    PUT: 'PUT',
    DELETE: 'DELETE',
    PATCH: 'PATCH'
};

export const CONTENT_TYPES = {
    JSON: 'application/json',
    FORM_DATA: 'multipart/form-data',
    TEXT: 'text/plain',
    HTML: 'text/html'
};

export const CACHE_KEYS = {
    TOILETS: 'toilets',
    REVIEWS: 'reviews',
    STATS: 'stats',
    USER: 'user'
};

export const API_ERRORS = {
    NETWORK_ERROR: 'Network request failed',
    TIMEOUT_ERROR: 'Request timed out',
    PARSE_ERROR: 'Failed to parse response',
    AUTH_ERROR: 'Authentication required',
    PERMISSION_ERROR: 'Insufficient permissions',
    NOT_FOUND: 'Resource not found',
    SERVER_ERROR: 'Server error occurred'
};
