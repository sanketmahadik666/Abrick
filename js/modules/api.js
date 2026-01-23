import { Auth } from './auth.js';

/**
 * API Module
 * Handles all HTTP requests to the backend with automatic token injection.
 */
export const API = {
    /**
     * Get the base URL for the API.
     * @returns {string} The base URL (e.g., http://localhost:3000).
     */
    getBaseUrl() {
        const isLocalhost = window.location.hostname === 'localhost' ||
                           window.location.hostname === '127.0.0.1';
        return isLocalhost ? 'http://localhost:3000' : window.location.origin;
    },

    /**
     * Make an authenticated HTTP request.
     * @param {string} endpoint - The API endpoint (e.g., '/api/toilets').
     * @param {Object} [options={}] - Fetch options (method, headers, body, etc.).
     * @returns {Promise<any>} The parsed JSON response or text.
     * @throws {Error} If the request fails.
     */
    async request(endpoint, options = {}) {
        const token = Auth.getToken();
        const defaultHeaders = {
            'Content-Type': 'application/json',
        };

        if (token) {
            defaultHeaders['Authorization'] = `Bearer ${token}`;
        }

        const headers = {
            ...defaultHeaders,
            ...(options.headers || {}),
        };

        const config = {
            ...options,
            headers,
        };

        const fullUrl = `${this.getBaseUrl()}${endpoint}`;

        try {
            const response = await fetch(fullUrl, config);
            let data;
            const contentType = response.headers.get('content-type');

            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                data = await response.text();
            }

            if (!response.ok) {
                throw new Error((data && data.message) || data || `HTTP ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('[API Error]', error);
            throw error;
        }
    }
};
