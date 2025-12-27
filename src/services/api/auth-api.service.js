/**
 * Authentication API Service
 * Handles all authentication-related API operations
 * Follows Single Responsibility Principle - only authentication concerns
 */

import { baseApiService } from './base-api.service.js';
import { API_ENDPOINTS, HTTP_METHODS } from '../../core/constants/api.constants.js';

/**
 * Authentication API Service Class
 * Extends BaseApiService with authentication-specific operations
 */
export class AuthApiService {
    constructor() {
        this.baseService = baseApiService;
    }

    /**
     * Login user
     * @param {object} credentials - User credentials
     * @param {string} credentials.email - User email
     * @param {string} credentials.password - User password
     * @returns {Promise} Login response
     */
    async login(credentials) {
        console.log('[AUTH-API] Attempting login for:', credentials.email);

        const response = await this.baseService.post(API_ENDPOINTS.AUTH.LOGIN, {
            email: credentials.email,
            password: credentials.password
        });

        console.log('[AUTH-API] Login successful');
        return response;
    }

    /**
     * Register new user
     * @param {object} userData - User registration data
     * @param {string} userData.email - User email
     * @param {string} userData.password - User password
     * @param {string} userData.role - User role (optional)
     * @returns {Promise} Registration response
     */
    async register(userData) {
        console.log('[AUTH-API] Attempting registration for:', userData.email);

        const response = await this.baseService.post(API_ENDPOINTS.AUTH.REGISTER, {
            email: userData.email,
            password: userData.password,
            role: userData.role || 'user'
        });

        console.log('[AUTH-API] Registration successful');
        return response;
    }

    /**
     * Get current user profile
     * @returns {Promise} User profile response
     */
    async getCurrentUser() {
        console.log('[AUTH-API] Fetching current user profile');

        const response = await this.baseService.get(API_ENDPOINTS.AUTH.ME);
        console.log('[AUTH-API] Current user profile retrieved');
        return response;
    }

    /**
     * Logout user (client-side token removal)
     * @returns {Promise} Logout response
     */
    async logout() {
        console.log('[AUTH-API] Logging out user');

        // Clear local storage
        localStorage.removeItem('adminToken');
        localStorage.removeItem('token');

        // Optional: Call server logout endpoint if implemented
        try {
            await this.baseService.post(API_ENDPOINTS.AUTH.LOGOUT, {});
        } catch (error) {
            // Server logout might not be implemented, ignore
            console.log('[AUTH-API] Server logout not available, continuing');
        }

        console.log('[AUTH-API] Logout completed');
        return { success: true };
    }

    /**
     * Refresh authentication token
     * @returns {Promise} Token refresh response
     */
    async refreshToken() {
        console.log('[AUTH-API] Refreshing authentication token');

        // Implementation depends on server-side token refresh mechanism
        // For now, return current token status
        const token = localStorage.getItem('adminToken') || localStorage.getItem('token');

        if (!token) {
            throw new Error('No token available to refresh');
        }

        // Validate token format (basic check)
        if (token.split('.').length === 3) {
            console.log('[AUTH-API] Token validation successful');
            return { token, valid: true };
        } else {
            throw new Error('Invalid token format');
        }
    }

    /**
     * Validate authentication token
     * @param {string} token - Token to validate
     * @returns {Promise} Validation response
     */
    async validateToken(token) {
        console.log('[AUTH-API] Validating authentication token');

        if (!token) {
            return { valid: false, reason: 'No token provided' };
        }

        try {
            // Basic JWT format validation
            const parts = token.split('.');
            if (parts.length !== 3) {
                return { valid: false, reason: 'Invalid token format' };
            }

            // Try to decode header and payload (without verification)
            const header = JSON.parse(atob(parts[0]));
            const payload = JSON.parse(atob(parts[1]));

            // Check expiration
            if (payload.exp && Date.now() >= payload.exp * 1000) {
                return { valid: false, reason: 'Token expired' };
            }

            console.log('[AUTH-API] Token validation successful');
            return {
                valid: true,
                payload: payload,
                expiresAt: payload.exp ? new Date(payload.exp * 1000) : null
            };

        } catch (error) {
            console.error('[AUTH-API] Token validation failed:', error);
            return { valid: false, reason: 'Token parsing failed' };
        }
    }

    /**
     * Check if user has required role/permission
     * @param {string} requiredRole - Required role
     * @param {string} userRole - User's current role
     * @returns {boolean} Permission status
     */
    hasPermission(requiredRole, userRole) {
        const roleHierarchy = {
            'user': 1,
            'admin': 2,
            'superadmin': 3
        };

        const requiredLevel = roleHierarchy[requiredRole] || 0;
        const userLevel = roleHierarchy[userRole] || 0;

        return userLevel >= requiredLevel;
    }

    /**
     * Get stored authentication token
     * @returns {string|null} Authentication token
     */
    getToken() {
        return localStorage.getItem('adminToken') || localStorage.getItem('token');
    }

    /**
     * Set authentication token
     * @param {string} token - Authentication token
     */
    setToken(token) {
        localStorage.setItem('adminToken', token);
        localStorage.setItem('token', token); // Backup
        console.log('[AUTH-API] Authentication token stored');
    }

    /**
     * Clear authentication token
     */
    clearToken() {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('token');
        console.log('[AUTH-API] Authentication token cleared');
    }

    /**
     * Check if user is currently authenticated
     * @returns {Promise<boolean>} Authentication status
     */
    async isAuthenticated() {
        const token = this.getToken();

        if (!token) {
            return false;
        }

        try {
            const validation = await this.validateToken(token);
            return validation.valid;
        } catch (error) {
            console.warn('[AUTH-API] Authentication check failed:', error);
            return false;
        }
    }

    /**
     * Get user role from token
     * @returns {string|null} User role
     */
    getUserRole() {
        const token = this.getToken();

        if (!token) {
            return null;
        }

        try {
            const parts = token.split('.');
            if (parts.length === 3) {
                const payload = JSON.parse(atob(parts[1]));
                return payload.role || 'user';
            }
        } catch (error) {
            console.error('[AUTH-API] Failed to get user role:', error);
        }

        return null;
    }
}

// Create singleton instance
export const authApiService = new AuthApiService();
