export const UI = {
    showLoading(button) {
        if (button) {
            button.classList.add('loading');
            button.disabled = true;
        }
    },

    hideLoading(button) {
        if (button) {
            button.classList.remove('loading');
            button.disabled = false;
        }
    },

    showGlobalLoading(overlayId = 'globalLoading') {
        const overlay = document.getElementById(overlayId);
        if (overlay) overlay.classList.remove('hidden');
    },

    hideGlobalLoading(overlayId = 'globalLoading') {
        const overlay = document.getElementById(overlayId);
        if (overlay) overlay.classList.add('hidden');
    },

    showError(message, containerId = 'errorContainer') {
        const container = document.getElementById(containerId);
        if (container) {
            container.textContent = message;
            container.style.display = 'block';
        } else {
            alert(message);
        }
    },

    hideError(containerId = 'errorContainer') {
        const container = document.getElementById(containerId);
        if (container) container.style.display = 'none';
    },

    generateStarRating(rating) {
        if (!rating || rating === 0) return '☆☆☆☆☆';
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - Math.ceil(rating);
        return '★'.repeat(fullStars) + (hasHalfStar ? '½' : '') + '☆'.repeat(emptyStars);
    },

    formatDate(dateStr) {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleDateString() + ' ' + new Date(dateStr).toLocaleTimeString();
    }
};
