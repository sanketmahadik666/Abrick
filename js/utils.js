// Shared utilities for the Toilet Review System

/**
 * Get the API base URL based on the current environment
 * @returns {string} The API base URL
 */
function getApiUrl() {
    const isLocalhost = window.location.hostname === 'localhost' ||
                       window.location.hostname === '127.0.0.1';

    return isLocalhost ? 'http://localhost:3000' : window.location.origin;
}

/**
 * Make an authenticated API request
 * @param {string} endpoint - API endpoint (without base URL)
 * @param {object} options - Fetch options
 * @returns {Promise} Fetch response promise
 */
async function makeAuthenticatedRequest(endpoint, options = {}) {
    const token = localStorage.getItem('adminToken');
    const defaultHeaders = {
        'Content-Type': 'application/json',
    };

    if (token) {
        defaultHeaders['Authorization'] = `Bearer ${token}`;
    }

    try {
        const apiUrl = getApiUrl();
        const fullUrl = `${apiUrl}${endpoint}`;
        console.log(`[API] Making request to: ${fullUrl}`);
        console.log(`[API] Method: ${options.method || 'GET'}`);
        console.log(`[API] Has token: ${!!token}`);

        if (options.body) {
            console.log(`[API] Request body:`, JSON.parse(options.body));
        }

        // Merge headers correctly - options headers should not override defaults
        const headers = {
            ...defaultHeaders,
            ...(options.headers || {}),
        };
        
        // Ensure Authorization is set if token exists
        if (token && !headers['Authorization']) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        console.log(`[API] Headers:`, { 'Content-Type': headers['Content-Type'], 'Authorization': headers['Authorization'] ? '***set***' : 'not set' });

        const fetchOptions = {
            ...options,
            headers,
        };

        console.log(`[API] Fetching...`);
        const response = await fetch(fullUrl, fetchOptions);

        console.log(`[API] Response status: ${response.status} ${response.statusText}`);

        let data;
        const contentType = response.headers.get('content-type');

        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
            console.log('[API] Response JSON:', data);
        } else {
            data = await response.text();
            console.log('[API] Response text:', data);
        }

        if (!response.ok) {
            const errorMsg = (data && data.message) || data || `HTTP ${response.status}: ${response.statusText}`;
            console.error(`[API] Request failed: ${errorMsg}`);
            throw new Error(errorMsg);
        }

        console.log(`[API] Request successful`);
        return data;
    } catch (error) {
        console.error('[API] Request error:', error);
        console.error('[API] Error details:', error.message);
        console.error('[API] Error type:', error.name);
        // Provide more helpful error message
        if (error.message === 'Failed to fetch') {
            console.error('[API] This usually means: CORS issue, server not responding, or network error');
        }
        throw error;
    }
}

/**
 * Show loading state on a button
 * @param {HTMLElement} button - The button element
 * @param {boolean} loading - Whether to show loading state
 */
function setButtonLoading(button, loading) {
    if (!button) return;

    if (loading) {
        button.classList.add('loading');
        button.disabled = true;
    } else {
        button.classList.remove('loading');
        button.disabled = false;
    }
}

/**
 * Hide loading overlay
 * @param {string} overlayId - ID of the loading overlay element
 */
function hideLoadingOverlay(overlayId = 'globalLoading') {
    const overlay = document.getElementById(overlayId);
    if (overlay) {
        overlay.classList.add('hidden');
    }
}

/**
 * Show loading overlay
 * @param {string} overlayId - ID of the loading overlay element
 */
function showLoadingOverlay(overlayId = 'globalLoading') {
    const overlay = document.getElementById(overlayId);
    if (overlay) {
        overlay.classList.remove('hidden');
    }
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} Whether email is valid
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Show error message to user
 * @param {string} message - Error message to display
 * @param {string} containerId - ID of container to show error in
 */
function showError(message, containerId = 'errorContainer') {
    const container = document.getElementById(containerId);
    if (container) {
        container.textContent = message;
        container.style.display = 'block';
        container.style.color = '#dc3545';
        container.style.background = '#f8d7da';
        container.style.padding = '10px';
        container.style.borderRadius = '4px';
        container.style.margin = '10px 0';
    } else {
        alert(message); // Fallback
    }
}

/**
 * Hide error message
 * @param {string} containerId - ID of container to hide
 */
function hideError(containerId = 'errorContainer') {
    const container = document.getElementById(containerId);
    if (container) {
        container.style.display = 'none';
    }
}

/**
 * Format date for display
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date string
 */
function formatDate(date) {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
}

/**
 * Generate star rating display
 * @param {number} rating - Rating value (0-5)
 * @returns {string} HTML string with stars
 */
function generateStarRating(rating) {
    if (!rating || rating === 0) return '☆☆☆☆☆';

    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - Math.ceil(rating);

    return '★'.repeat(fullStars) +
           (hasHalfStar ? '½' : '') +
           '☆'.repeat(emptyStars);
}

// Export functions for use in other files
window.ToiletReviewUtils = {
    getApiUrl,
    makeAuthenticatedRequest,
    setButtonLoading,
    hideLoadingOverlay,
    showLoadingOverlay,
    isValidEmail,
    showError,
    hideError,
    formatDate,
    generateStarRating
};