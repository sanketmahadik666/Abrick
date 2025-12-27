/**
 * Base API Service
 * Template Method Pattern - provides common API functionality
 * Dependency Inversion Principle - high-level modules depend on this abstraction
 */

import AppConfig from '../../core/config/app.config.js';

/**
 * Base API Service Class
 * Implements Template Method pattern for API operations
 */
export class BaseApiService {
    constructor(baseUrl = AppConfig.api.baseUrl) {
        this.baseUrl = baseUrl;
        this.defaultHeaders = {
            'Content-Type': 'application/json'
        };
        this.requestInterceptors = [];
        this.responseInterceptors = [];
    }

    /**
     * Add request interceptor
     * @param {Function} interceptor - Request interceptor function
     */
    addRequestInterceptor(interceptor) {
        this.requestInterceptors.push(interceptor);
    }

    /**
     * Add response interceptor
     * @param {Function} interceptor - Response interceptor function
     */
    addResponseInterceptor(interceptor) {
        this.responseInterceptors.push(interceptor);
    }

    /**
     * Template method for making HTTP requests
     * @param {string} endpoint - API endpoint
     * @param {object} options - Fetch options
     * @returns {Promise} API response
     */
    async request(endpoint, options = {}) {
        const url = this.buildUrl(endpoint);
        const requestOptions = this.buildRequestOptions(options);

        // Apply request interceptors
        let processedOptions = requestOptions;
        for (const interceptor of this.requestInterceptors) {
            processedOptions = await interceptor(processedOptions);
        }

        try {
            console.log(`[API] ${processedOptions.method || 'GET'} ${url}`);

            const response = await this.makeRequest(url, processedOptions);
            const result = await this.handleResponse(response);

            // Apply response interceptors
            let processedResult = result;
            for (const interceptor of this.responseInterceptors) {
                processedResult = await interceptor(processedResult, response);
            }

            return processedResult;
        } catch (error) {
            console.error(`[API] Request failed:`, error);
            throw this.handleError(error);
        }
    }

    /**
     * Build full URL from endpoint
     * @param {string} endpoint - API endpoint
     * @returns {string} Full URL
     */
    buildUrl(endpoint) {
        // Remove leading slash if present
        const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
        return `${this.baseUrl}/api/${cleanEndpoint}`;
    }

    /**
     * Build request options with defaults
     * @param {object} options - Custom options
     * @returns {object} Complete request options
     */
    buildRequestOptions(options) {
        return {
            method: 'GET',
            headers: { ...this.defaultHeaders },
            timeout: AppConfig.api.timeout,
            ...options,
            headers: {
                ...this.defaultHeaders,
                ...options.headers
            }
        };
    }

    /**
     * Make the actual HTTP request with timeout and retry logic
     * @param {string} url - Request URL
     * @param {object} options - Request options
     * @param {number} retryCount - Current retry attempt
     * @returns {Promise<Response>} Fetch response
     */
    async makeRequest(url, options, retryCount = 0) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), options.timeout);

            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });

            clearTimeout(timeoutId);
            return response;
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('Request timeout');
            }

            // Retry logic
            if (retryCount < AppConfig.api.retries) {
                console.log(`[API] Retrying request (${retryCount + 1}/${AppConfig.api.retries})`);
                await this.delay(AppConfig.api.retryDelay * (retryCount + 1));
                return this.makeRequest(url, options, retryCount + 1);
            }

            throw error;
        }
    }

    /**
     * Handle API response
     * @param {Response} response - Fetch response
     * @returns {Promise} Parsed response data
     */
    async handleResponse(response) {
        const contentType = response.headers.get('content-type');

        let data;
        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            data = await response.text();
        }

        if (!response.ok) {
            const error = new Error(data.message || `HTTP ${response.status}`);
            error.status = response.status;
            error.data = data;
            throw error;
        }

        return data;
    }

    /**
     * Handle API errors
     * @param {Error} error - Error object
     * @returns {Error} Processed error
     */
    handleError(error) {
        // Enhance error with more context
        if (error.status) {
            switch (error.status) {
                case 400:
                    error.message = 'Bad request - please check your input';
                    break;
                case 401:
                    error.message = 'Authentication required';
                    break;
                case 403:
                    error.message = 'Access denied';
                    break;
                case 404:
                    error.message = 'Resource not found';
                    break;
                case 429:
                    error.message = 'Too many requests - please try again later';
                    break;
                case 500:
                    error.message = 'Server error - please try again later';
                    break;
            }
        }

        return error;
    }

    /**
     * Utility delay function
     * @param {number} ms - Milliseconds to delay
     * @returns {Promise} Delay promise
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * GET request
     * @param {string} endpoint - API endpoint
     * @param {object} options - Additional options
     * @returns {Promise} API response
     */
    get(endpoint, options = {}) {
        return this.request(endpoint, { ...options, method: 'GET' });
    }

    /**
     * POST request
     * @param {string} endpoint - API endpoint
     * @param {object} data - Request data
     * @param {object} options - Additional options
     * @returns {Promise} API response
     */
    post(endpoint, data, options = {}) {
        return this.request(endpoint, {
            ...options,
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    /**
     * PUT request
     * @param {string} endpoint - API endpoint
     * @param {object} data - Request data
     * @param {object} options - Additional options
     * @returns {Promise} API response
     */
    put(endpoint, data, options = {}) {
        return this.request(endpoint, {
            ...options,
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    /**
     * DELETE request
     * @param {string} endpoint - API endpoint
     * @param {object} options - Additional options
     * @returns {Promise} API response
     */
    delete(endpoint, options = {}) {
        return this.request(endpoint, { ...options, method: 'DELETE' });
    }
}

// Create singleton instance
export const baseApiService = new BaseApiService();
