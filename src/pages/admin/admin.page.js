/**
 * Admin Page Module
 * Handles all admin page functionality using modular architecture
 * Includes authentication, toilet management, QR codes, and reviews
 */

import { BasePage } from '../shared/page.base.js';
import appStore from '../../state/store/app.store.js';
import { authApiService } from '../../services/api/auth-api.service.js';
import { toiletApiService } from '../../services/api/toilet-api.service.js';
import { reviewApiService } from '../../services/api/review-api.service.js';
import { $ } from '../../core/utils/dom.utils.js';
import AppConfig from '../../core/config/app.config.js';

/**
 * Admin Page Class
 * Extends BasePage and implements admin-specific functionality
 */
export class AdminPage extends BasePage {
    constructor() {
        super({
            requiresAuth: false, // We'll handle login form ourselves
            requiredRole: 'admin'
        });

        this.map = null;
        this.markers = null;
        this.qrScanner = null;
        this.currentToiletId = null;
        this.allToilets = [];
        this.allReviews = [];
        this.currentView = 'dashboard'; // dashboard, reviews, qrcodes

        // Bind methods
        this.handleLogin = this.handleLogin.bind(this);
        this.handleRegister = this.handleRegister.bind(this);
        this.handleLogout = this.handleLogout.bind(this);
        this.showDashboard = this.showDashboard.bind(this);
        this.showReviews = this.showReviews.bind(this);
        this.showQRCodes = this.showQRCodes.bind(this);
        this.loadToilets = this.loadToilets.bind(this);
        this.addToilet = this.addToilet.bind(this);
        this.updateToilet = this.updateToilet.bind(this);
        this.deleteToilet = this.deleteToilet.bind(this);
        this.loadReviews = this.loadReviews.bind(this);
        this.loadQRCodes = this.loadQRCodes.bind(this);
        this.generateQRCode = this.generateQRCode.bind(this);
        this.downloadQR = this.downloadQR.bind(this);
        this.filterReviews = this.filterReviews.bind(this);
    }

    /**
     * Initialize the admin page
     * @returns {Promise} Initialization promise
     */
    async init() {
        console.log('[ADMIN] Initializing admin page...');

        // Check if user is already authenticated
        const token = localStorage.getItem('adminToken');
        if (token && await this.validateStoredToken()) {
            await this.showDashboard();
        } else {
            this.showLoginForm();
        }

        console.log('[ADMIN] Admin page initialized');
    }

    /**
     * Validate stored authentication token
     * @returns {Promise<boolean>} Token validity
     */
    async validateStoredToken() {
        try {
            const validation = await authApiService.validateToken(
                localStorage.getItem('adminToken')
            );
            return validation.valid;
        } catch (error) {
            console.warn('[ADMIN] Token validation failed:', error);
            localStorage.removeItem('adminToken');
            localStorage.removeItem('token');
            return false;
        }
    }

    /**
     * Show login form
     */
    showLoginForm() {
        const loginForm = $('#loginForm');
        const adminDashboard = $('#adminDashboard');

        if (loginForm) loginForm.style.display = 'block';
        if (adminDashboard) adminDashboard.style.display = 'none';

        // Set up login form handlers
        this.setupLoginForm();
    }

    /**
     * Set up login form event handlers
     */
    setupLoginForm() {
        const loginForm = $('#adminLoginForm');
        const registerForm = $('#adminRegisterForm');

        if (loginForm) {
            loginForm.addEventListener('submit', this.handleLogin);
        }

        if (registerForm) {
            registerForm.addEventListener('submit', this.handleRegister);
        }
    }

    /**
     * Handle login form submission
     * @param {Event} event - Form submit event
     */
    async handleLogin(event) {
        event.preventDefault();

        const email = $('#email').value.trim();
        const password = $('#password').value;

        if (!email || !password) {
            this.showLoginError('Please enter both email and password');
            return;
        }

        appStore.setLoading('auth', true);

        try {
            const response = await authApiService.login({ email, password });

            if (response.token) {
                // Store token
                authApiService.setToken(response.token);

                // Update store
                appStore.setUser(true, response.user, response.token);

                // Show dashboard
                await this.showDashboard();
            } else {
                throw new Error('Invalid login response');
            }
        } catch (error) {
            console.error('[ADMIN] Login failed:', error);
            this.showLoginError(error.message || 'Login failed. Please try again.');
        } finally {
            appStore.setLoading('auth', false);
        }
    }

    /**
     * Handle registration form submission
     * @param {Event} event - Form submit event
     */
    async handleRegister(event) {
        event.preventDefault();

        const email = $('#registerEmail').value.trim();
        const password = $('#registerPassword').value;

        if (!email || !password) {
            this.showRegisterError('Please enter both email and password');
            return;
        }

        if (password.length < AppConfig.validation.minPasswordLength) {
            this.showRegisterError(`Password must be at least ${AppConfig.validation.minPasswordLength} characters long`);
            return;
        }

        appStore.setLoading('auth', true);

        try {
            const response = await authApiService.register({
                email,
                password,
                role: 'admin'
            });

            if (response.token) {
                // Store token
                authApiService.setToken(response.token);

                // Update store
                appStore.setUser(true, response.user, response.token);

                // Show dashboard
                await this.showDashboard();
            } else {
                throw new Error('Invalid registration response');
            }
        } catch (error) {
            console.error('[ADMIN] Registration failed:', error);
            this.showRegisterError(error.message || 'Registration failed. Please try again.');
        } finally {
            appStore.setLoading('auth', false);
        }
    }

    /**
     * Handle logout
     */
    async handleLogout() {
        try {
            await authApiService.logout();
            appStore.setUser(false);
            this.showLoginForm();
        } catch (error) {
            console.error('[ADMIN] Logout error:', error);
            // Force logout even if API call fails
            localStorage.removeItem('adminToken');
            localStorage.removeItem('token');
            appStore.setUser(false);
            this.showLoginForm();
        }
    }

    /**
     * Show login error message
     * @param {string} message - Error message
     */
    showLoginError(message) {
        const errorElement = $('#loginError');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
    }

    /**
     * Show registration error message
     * @param {string} message - Error message
     */
    showRegisterError(message) {
        const errorElement = $('#registerError');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
    }

    /**
     * Show admin dashboard
     * @returns {Promise} Dashboard initialization promise
     */
    async showDashboard() {
        console.log('[ADMIN] Showing admin dashboard');

        // Hide login form and show dashboard
        const loginForm = $('#loginForm');
        const adminDashboard = $('#adminDashboard');
        const logoutBtn = $('#logoutBtn');

        if (loginForm) loginForm.style.display = 'none';
        if (adminDashboard) adminDashboard.style.display = 'block';
        if (logoutBtn) logoutBtn.style.display = 'inline-block';

        // Set current view
        this.currentView = 'dashboard';

        // Update navigation
        this.updateNavigation();

        // Initialize dashboard components
        await this.initializeDashboard();
    }

    /**
     * Initialize dashboard components
     * @returns {Promise} Initialization promise
     */
    async initializeDashboard() {
        // Initialize map
        await this.initializeMap();

        // Load initial data
        await Promise.all([
            this.loadToilets(),
            this.loadDashboardStats()
        ]);

        // Set up dashboard event listeners
        this.setupDashboardEventListeners();
    }

    /**
     * Initialize map for admin dashboard
     * @returns {Promise} Map initialization promise
     */
    async initializeMap() {
        console.log('[ADMIN] Initializing admin map');

        const mapElement = $('#map');
        if (!mapElement) {
            console.warn('[ADMIN] Map element not found');
            return;
        }

        try {
            this.map = L.map(mapElement, {
                center: AppConfig.map.defaultCenter,
                zoom: AppConfig.map.defaultZoom,
                minZoom: AppConfig.map.minZoom,
                maxZoom: AppConfig.map.maxZoom
            });

            this.markers = L.markerClusterGroup({
                maxClusterRadius: AppConfig.map.maxClusterRadius
            });

            L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
                attribution: '©OpenStreetMap, ©CartoDB'
            }).addTo(this.map);

            this.map.addLayer(this.markers);

            // Add click handler for adding toilets
            this.map.on('click', (event) => {
                const { lat, lng } = event.latlng;
                this.handleMapClick(lat, lng);
            });

        } catch (error) {
            console.error('[ADMIN] Map initialization failed:', error);
        }
    }

    /**
     * Handle map click for toilet placement
     * @param {number} lat - Latitude
     * @param {number} lng - Longitude
     */
    handleMapClick(lat, lng) {
        // Update coordinate fields
        const latField = $('#latitude');
        const lngField = $('#longitude');

        if (latField) latField.value = lat;
        if (lngField) lngField.value = lng;

        // Add/update marker
        if (this.currentMarker) {
            this.currentMarker.setLatLng([lat, lng]);
        } else {
            this.currentMarker = L.marker([lat, lng]).addTo(this.map);
        }
    }

    /**
     * Load toilets for admin view
     * @returns {Promise} Loading promise
     */
    async loadToilets() {
        appStore.setLoading('toilets', true);

        try {
            const response = await toiletApiService.getMapData({
                showPublic: true,
                showPrivate: true,
                limit: 1000
            });

            this.allToilets = response.data || [];
            this.updateToiletsList();
            this.updateMapWithToilets();

        } catch (error) {
            console.error('[ADMIN] Failed to load toilets:', error);
            appStore.addNotification({
                type: 'error',
                title: 'Load Error',
                message: 'Failed to load toilets data'
            });
        } finally {
            appStore.setLoading('toilets', false);
        }
    }

    /**
     * Update toilets list in UI
     */
    updateToiletsList() {
        const toiletList = $('#toiletList');
        if (!toiletList) return;

        let html = '<h2>Registered Toilets</h2>';

        if (this.allToilets.length === 0) {
            html += '<p>No toilets registered yet.</p>';
        } else {
            this.allToilets.forEach(toilet => {
                const isPublic = toilet.type === 'public';
                html += `
                    <div class="toilet-item">
                        <div class="toilet-info">
                            <h3>${toilet.name}</h3>
                            <p>${toilet.location}</p>
                            <p>Rating: ${toilet.averageRating ? toilet.averageRating.toFixed(1) : 'No ratings'} ⭐</p>
                        </div>
                        <div class="toilet-actions">
                            <button class="btn edit-btn" onclick="adminPage.editToilet('${toilet.id}')">Edit</button>
                            <button class="btn delete-btn" onclick="adminPage.deleteToilet('${toilet.id}')">Delete</button>
                        </div>
                    </div>
                `;
            });
        }

        toiletList.innerHTML = html;
    }

    /**
     * Update map with toilet markers
     */
    updateMapWithToilets() {
        if (!this.markers || !this.allToilets) return;

        this.markers.clearLayers();

        this.allToilets.forEach(toilet => {
            if (toilet.coordinates?.latitude && toilet.coordinates?.longitude) {
                const marker = L.marker([
                    toilet.coordinates.latitude,
                    toilet.coordinates.longitude
                ]);

                const popupContent = `
                    <div class="toilet-popup">
                        <h3>${toilet.name}</h3>
                        <p>${toilet.location}</p>
                        <p>Type: ${toilet.type}</p>
                        <p>Rating: ${toilet.averageRating || 'No ratings'}</p>
                        <button onclick="adminPage.editToilet('${toilet.id}')">Edit</button>
                        <button onclick="adminPage.deleteToilet('${toilet.id}')">Delete</button>
                    </div>
                `;

                marker.bindPopup(popupContent);
                this.markers.addLayer(marker);
            }
        });
    }

    /**
     * Add new toilet
     * @param {Event} event - Form submit event
     */
    async addToilet(event) {
        event.preventDefault();

        const formData = {
            name: $('#toiletName').value.trim(),
            location: $('#toiletLocation').value.trim(),
            description: $('#toiletDescription').value.trim(),
            coordinates: {
                latitude: parseFloat($('#latitude').value),
                longitude: parseFloat($('#longitude').value)
            },
            facilities: Array.from(document.querySelectorAll('input[name="facilities"]:checked'))
                .map(cb => cb.value)
        };

        // Validation
        if (!formData.name || !formData.location) {
            this.showToiletError('Name and location are required');
            return;
        }

        if (isNaN(formData.coordinates.latitude) || isNaN(formData.coordinates.longitude)) {
            this.showToiletError('Please select a location on the map');
            return;
        }

        appStore.setLoading('toilet', true);

        try {
            await toiletApiService.addPrivateToilet(formData);

            // Reset form
            event.target.reset();
            if (this.currentMarker) {
                this.map.removeLayer(this.currentMarker);
                this.currentMarker = null;
            }

            // Refresh data
            await this.loadToilets();

            appStore.addNotification({
                type: 'success',
                title: 'Success',
                message: 'Toilet added successfully'
            });

        } catch (error) {
            console.error('[ADMIN] Failed to add toilet:', error);
            this.showToiletError(error.message || 'Failed to add toilet');
        } finally {
            appStore.setLoading('toilet', false);
        }
    }

    /**
     * Edit existing toilet
     * @param {string} toiletId - Toilet ID to edit
     */
    editToilet(toiletId) {
        const toilet = this.allToilets.find(t => t.id === toiletId);
        if (!toilet) return;

        // Populate form with toilet data
        $('#toiletName').value = toilet.name;
        $('#toiletLocation').value = toilet.location;
        $('#toiletDescription').value = toilet.description || '';
        $('#latitude').value = toilet.coordinates.latitude;
        $('#longitude').value = toilet.coordinates.longitude;

        // Set facilities checkboxes
        document.querySelectorAll('input[name="facilities"]').forEach(cb => {
            cb.checked = toilet.facilities?.includes(cb.value) || false;
        });

        // Update marker position
        if (this.currentMarker) {
            this.currentMarker.setLatLng([
                toilet.coordinates.latitude,
                toilet.coordinates.longitude
            ]);
        } else {
            this.currentMarker = L.marker([
                toilet.coordinates.latitude,
                toilet.coordinates.longitude
            ]).addTo(this.map);
        }

        this.currentToiletId = toiletId;
    }

    /**
     * Delete toilet
     * @param {string} toiletId - Toilet ID to delete
     */
    async deleteToilet(toiletId) {
        if (!confirm('Are you sure you want to delete this toilet?')) return;

        appStore.setLoading('toilet', true);

        try {
            await toiletApiService.deleteToilet(toiletId);

            // Refresh data
            await this.loadToilets();

            appStore.addNotification({
                type: 'success',
                title: 'Success',
                message: 'Toilet deleted successfully'
            });

        } catch (error) {
            console.error('[ADMIN] Failed to delete toilet:', error);
            appStore.addNotification({
                type: 'error',
                title: 'Delete Error',
                message: 'Failed to delete toilet'
            });
        } finally {
            appStore.setLoading('toilet', false);
        }
    }

    /**
     * Show reviews section
     * @returns {Promise} Reviews loading promise
     */
    async showReviews() {
        this.currentView = 'reviews';
        this.updateNavigation();

        const adminDashboard = $('#adminDashboard');
        const reviewsSection = $('#reviewsSection');
        const qrCodesSection = $('#qrCodesSection');

        if (adminDashboard) adminDashboard.style.display = 'none';
        if (qrCodesSection) qrCodesSection.style.display = 'none';
        if (reviewsSection) reviewsSection.style.display = 'block';

        await this.loadReviews();
    }

    /**
     * Load reviews data
     * @returns {Promise} Loading promise
     */
    async loadReviews() {
        appStore.setLoading('reviews', true);

        try {
            const response = await reviewApiService.getAllReviews({ limit: 1000 });
            this.allReviews = response || [];

            this.updateReviewsDisplay();

        } catch (error) {
            console.error('[ADMIN] Failed to load reviews:', error);
            appStore.addNotification({
                type: 'error',
                title: 'Load Error',
                message: 'Failed to load reviews data'
            });
        } finally {
            appStore.setLoading('reviews', false);
        }
    }

    /**
     * Update reviews display
     */
    updateReviewsDisplay() {
        const reviewList = $('.review-list');
        if (!reviewList) return;

        if (this.allReviews.length === 0) {
            reviewList.innerHTML = '<div class="no-reviews">No reviews found.</div>';
            return;
        }

        reviewList.innerHTML = this.allReviews.map(review => `
            <div class="review-card">
                <div class="review-header">
                    <div class="review-toilet-name">${review.toiletName || 'Unknown Toilet'}</div>
                    <div class="review-rating">
                        ${'★'.repeat(review.rating)}${'☆'.repeat(5-review.rating)}
                    </div>
                </div>
                <div class="review-comment">${review.comment || 'No comment'}</div>
                <div class="review-meta">
                    <div>Posted: ${new Date(review.createdAt).toLocaleString()}</div>
                    <div>${review.rating}/5 stars</div>
                </div>
            </div>
        `).join('');
    }

    /**
     * Show QR codes section
     * @returns {Promise} QR codes loading promise
     */
    async showQRCodes() {
        this.currentView = 'qrcodes';
        this.updateNavigation();

        const adminDashboard = $('#adminDashboard');
        const reviewsSection = $('#reviewsSection');
        const qrCodesSection = $('#qrCodesSection');

        if (adminDashboard) adminDashboard.style.display = 'none';
        if (reviewsSection) reviewsSection.style.display = 'none';
        if (qrCodesSection) qrCodesSection.style.display = 'block';

        await this.loadQRCodes();
    }

    /**
     * Load QR codes for all toilets
     * @returns {Promise} Loading promise
     */
    async loadQRCodes() {
        const qrGrid = $('.qr-grid');
        if (!qrGrid) return;

        qrGrid.innerHTML = '<div class="loading">Loading QR Codes...</div>';

        try {
            const qrPromises = this.allToilets.map(async (toilet) => {
                try {
                    const qrResponse = await toiletApiService.generateQRCode(toilet.id);
                    return { toilet, qrData: qrResponse };
                } catch (error) {
                    return { toilet, error: true };
                }
            });

            const qrResults = await Promise.all(qrPromises);

            qrGrid.innerHTML = '';
            qrResults.forEach(({ toilet, qrData, error }) => {
                const qrCard = document.createElement('div');
                qrCard.className = 'qr-card';

                if (error) {
                    qrCard.innerHTML = `
                        <h3>${toilet.name}</h3>
                        <p>${toilet.location}</p>
                        <div style="color: #dc3545; text-align: center; padding: 20px;">
                            Error generating QR code
                        </div>
                    `;
                } else {
                    qrCard.innerHTML = `
                        <h3>${toilet.name}</h3>
                        <p>${toilet.location}</p>
                        <img src="${qrData.qrCode}" alt="QR Code for ${toilet.name}">
                        <button class="download-btn" onclick="adminPage.downloadQR('${qrData.qrCode}', '${toilet.name}')">
                            Download QR Code
                        </button>
                    `;
                }

                qrGrid.appendChild(qrCard);
            });

        } catch (error) {
            console.error('[ADMIN] Failed to load QR codes:', error);
            qrGrid.innerHTML = '<div class="error-message">Error loading QR codes</div>';
        }
    }

    /**
     * Download QR code
     * @param {string} dataURL - QR code data URL
     * @param {string} toiletName - Toilet name
     */
    downloadQR(dataURL, toiletName) {
        fetch(dataURL)
            .then(res => res.blob())
            .then(blob => {
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `${toiletName.replace(/[^a-zA-Z0-9]/g, '_')}_QR.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            })
            .catch(error => {
                console.error('[ADMIN] Error downloading QR code:', error);
                appStore.addNotification({
                    type: 'error',
                    title: 'Download Error',
                    message: 'Failed to download QR code'
                });
            });
    }

    /**
     * Update navigation active states
     */
    updateNavigation() {
        const navButtons = $$('[data-nav-view]');
        navButtons.forEach(button => {
            const view = button.getAttribute('data-nav-view');
            button.classList.toggle('active', view === this.currentView);
        });
    }

    /**
     * Setup dashboard event listeners
     */
    setupDashboardEventListeners() {
        // Add toilet form
        const addToiletForm = $('#addToiletForm');
        if (addToiletForm) {
            addToiletForm.addEventListener('submit', this.addToilet);
        }

        // Navigation buttons
        const showDashboardBtn = $('#showDashboardBtn');
        const showReviewsBtn = $('#showReviewsBtn');
        const showQRCodesBtn = $('#showQRCodesBtn');
        const logoutBtn = $('#logoutBtn');

        if (showDashboardBtn) showDashboardBtn.addEventListener('click', () => this.showDashboard());
        if (showReviewsBtn) showReviewsBtn.addEventListener('click', () => this.showReviews());
        if (showQRCodesBtn) showQRCodesBtn.addEventListener('click', () => this.showQRCodes());
        if (logoutBtn) logoutBtn.addEventListener('click', this.handleLogout);

        // Review filters
        const toiletFilter = $('#toiletFilter');
        const ratingFilter = $('#ratingFilter');

        if (toiletFilter) toiletFilter.addEventListener('change', this.filterReviews);
        if (ratingFilter) ratingFilter.addEventListener('change', this.filterReviews);
    }

    /**
     * Filter reviews based on current filters
     */
    filterReviews() {
        const toiletFilter = $('#toiletFilter')?.value;
        const ratingFilter = $('#ratingFilter')?.value;

        let filteredReviews = [...this.allReviews];

        if (toiletFilter) {
            filteredReviews = filteredReviews.filter(review => review.toiletId === toiletFilter);
        }

        if (ratingFilter) {
            filteredReviews = filteredReviews.filter(review => review.rating === parseInt(ratingFilter));
        }

        // Update display with filtered reviews
        this.displayFilteredReviews(filteredReviews);
    }

    /**
     * Display filtered reviews
     * @param {Array} reviews - Filtered reviews
     */
    displayFilteredReviews(reviews) {
        const reviewList = $('.review-list');
        if (!reviewList) return;

        if (reviews.length === 0) {
            reviewList.innerHTML = '<div class="no-reviews">No reviews match the current filters.</div>';
            return;
        }

        reviewList.innerHTML = reviews.map(review => `
            <div class="review-card">
                <div class="review-header">
                    <div class="review-toilet-name">${review.toiletName || 'Unknown Toilet'}</div>
                    <div class="review-rating">
                        ${'★'.repeat(review.rating)}${'☆'.repeat(5-review.rating)}
                    </div>
                </div>
                <div class="review-comment">${review.comment || 'No comment'}</div>
                <div class="review-meta">
                    <div>Posted: ${new Date(review.createdAt).toLocaleString()}</div>
                    <div>${review.rating}/5 stars</div>
                </div>
            </div>
        `).join('');
    }

    /**
     * Load dashboard statistics
     * @returns {Promise} Loading promise
     */
    async loadDashboardStats() {
        try {
            const stats = await toiletApiService.getStatistics();
            console.log('[ADMIN] Dashboard stats loaded:', stats);
            // Could display stats in dashboard
        } catch (error) {
            console.warn('[ADMIN] Failed to load dashboard stats:', error);
        }
    }

    /**
     * Show toilet form error
     * @param {string} message - Error message
     */
    showToiletError(message) {
        const errorElement = $('#addToiletError');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
    }

    /**
     * Get page container element
     * @returns {Element} Page container
     */
    getPageContainer() {
        return document.body; // Admin page uses full body
    }

    /**
     * Destroy the admin page
     */
    destroy() {
        console.log('[ADMIN] Destroying admin page');

        // Clean up map
        if (this.map) {
            this.map.remove();
            this.map = null;
        }

        // Clean up markers
        if (this.markers) {
            this.markers.clearLayers();
            this.markers = null;
        }

        // Clean up current marker
        if (this.currentMarker) {
            this.map.removeLayer(this.currentMarker);
            this.currentMarker = null;
        }

        // Call parent destroy
        super.destroy();
    }
}

// Create global instance for backward compatibility
window.adminPage = new AdminPage();
