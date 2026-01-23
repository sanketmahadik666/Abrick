/**
 * UI Utility Module
 * Provides common UI manipulation helpers.
 */
export const UI = {
    /**
     * Show loading state on a button.
     * Adds 'loading' class and disables the button.
     * @param {HTMLElement} button - The button element.
     */
    showLoading(button) {
        if (button) {
            button.classList.add('loading');
            button.disabled = true;
        }
    },

    /**
     * Hide loading state from a button.
     * Removes 'loading' class and enables the button.
     * @param {HTMLElement} button - The button element.
     */
    hideLoading(button) {
        if (button) {
            button.classList.remove('loading');
            button.disabled = false;
        }
    },

    /**
     * Show the global loading overlay.
     * @param {string} [overlayId='globalLoading'] - The ID of the overlay element.
     */
    showGlobalLoading(overlayId = 'globalLoading') {
        const overlay = document.getElementById(overlayId);
        if (overlay) overlay.classList.remove('hidden');
    },

    /**
     * Hide the global loading overlay.
     * @param {string} [overlayId='globalLoading'] - The ID of the overlay element.
     */
    hideGlobalLoading(overlayId = 'globalLoading') {
        const overlay = document.getElementById(overlayId);
        if (overlay) overlay.classList.add('hidden');
    },

    /**
     * Display an error message in a specific container.
     * Fallbacks to alert() if container not found.
     * @param {string} message - The error message text.
     * @param {string} [containerId='errorContainer'] - The ID of the error container.
     */
    showError(message, containerId = 'errorContainer') {
        const container = document.getElementById(containerId);
        if (container) {
            container.textContent = message;
            container.style.display = 'block';
        } else {
            alert(message);
        }
    },

    /**
     * Hide the error message container.
     * @param {string} [containerId='errorContainer'] - The ID of the error container.
     */
    hideError(containerId = 'errorContainer') {
        const container = document.getElementById(containerId);
        if (container) container.style.display = 'none';
    },

    /**
     * Generate HTML for a star rating display.
     * @param {number} rating - The numeric rating (0-5).
     * @returns {string} HTML string containing star characters.
     */
    generateStarRating(rating) {
        if (!rating || rating === 0) return '☆☆☆☆☆';
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - Math.ceil(rating);
        return '★'.repeat(fullStars) + (hasHalfStar ? '½' : '') + '☆'.repeat(emptyStars);
    },

    /**
     * Format a date string into a readable locale string.
     * @param {string|Date} dateStr - The date to format.
     * @returns {string} Formatted date string (Date + Time).
     */
    formatDate(dateStr) {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleDateString() + ' ' + new Date(dateStr).toLocaleTimeString();
    }
};
