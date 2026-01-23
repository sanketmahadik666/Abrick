/**
 * Authentication Module
 * Handles token management and login/register operations.
 */
export const Auth = {
    TOKEN_KEY: 'adminToken',

    /**
     * Retrieve the stored authentication token.
     * @returns {string|null} The JWT token or null if not found.
     */
    getToken() {
        return localStorage.getItem(this.TOKEN_KEY);
    },

    /**
     * Store the authentication token.
     * @param {string} token - The JWT token to store.
     */
    setToken(token) {
        localStorage.setItem(this.TOKEN_KEY, token);
    },

    /**
     * Remove the stored authentication token.
     */
    clearToken() {
        localStorage.removeItem(this.TOKEN_KEY);
    },

    /**
     * Check if the user is currently authenticated.
     * @returns {boolean} True if a token is present.
     */
    isAuthenticated() {
        return !!this.getToken();
    },

    /**
     * Authenticate a user with email and password.
     * @param {string} email - User email.
     * @param {string} password - User password.
     * @returns {Promise<Object>} The response data containing user info and token.
     * @throws {Error} If login fails.
     */
    async login(email, password) {
        const response = await fetch('/api/admin/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Login failed');
        }
        
        this.setToken(data.token);
        return data;
    },

    /**
     * Register a new admin user.
     * @param {string} email - User email.
     * @param {string} password - User password.
     * @returns {Promise<Object>} The response data containing user info and token.
     * @throws {Error} If registration fails.
     */
    async register(email, password) {
        const response = await fetch('/api/admin/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Registration failed');
        }

        this.setToken(data.token);
        return data;
    },

    /**
     * Log out the user and reload the page.
     */
    logout() {
        this.clearToken();
        window.location.reload();
    }
};
