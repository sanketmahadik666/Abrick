/**
 * Review Page Component
 * Handles QR code scanning and review submission functionality
 */

import { BasePage } from '../shared/page.base.js';
import appStore from '../../state/store/app.store.js';
import { toiletApiService } from '../../services/api/toilet-api.service.js';
import { reviewApiService } from '../../services/api/review-api.service.js';
import { $ } from '../../core/utils/dom.utils.js';

/**
 * ReviewPage Class
 * Handles QR code scanning and review submission functionality
 */
export class ReviewPage extends BasePage {
    constructor() {
        super();
        this.currentToiletId = null;
        this.qrReader = null;
    }

    /**
     * Initialize the review page
     */
    async init() {
        console.log('[ReviewPage] Initializing review page...');

        try {
            // Set up loading states
            this.setupLoadingStates();

            // Initialize QR scanner
            this.initializeQRScanner();

            // Set up form handlers
            this.setupFormHandlers();

            console.log('[ReviewPage] Review page initialized successfully');

        } catch (error) {
            console.error('[ReviewPage] Error initializing review page:', error);
            this.showError('Failed to initialize review page. Please refresh and try again.');
        }
    }

    /**
     * Set up loading states for the page
     */
    setupLoadingStates() {
        const loadingOverlay = document.getElementById('reviewLoading');
        if (loadingOverlay) {
            // Hide loading overlay after a short delay
            setTimeout(() => {
                loadingOverlay.classList.add('hidden');
            }, 500);
        }
    }

    /**
     * Initialize QR code scanner
     */
    async initializeQRScanner() {
        console.log('[ReviewPage] Initializing QR scanner...');

        const qrReaderSection = document.getElementById('qr-reader-section');
        const qrReader = document.getElementById('qr-reader');

        if (!qrReader) {
            console.warn('[ReviewPage] QR reader element not found');
            return;
        }

        try {
            // Check if Html5Qrcode is available
            if (typeof Html5Qrcode === 'undefined') {
                throw new Error('QR scanner library not loaded');
            }

            // Initialize QR scanner
            this.qrReader = new Html5Qrcode('qr-reader', {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0
            });

            // Start scanning
            await this.qrReader.start(
                { facingMode: 'environment' }, // Use back camera
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 }
                },
                this.onQRCodeScanned.bind(this),
                this.onQRScanError.bind(this)
            );

            console.log('[ReviewPage] QR scanner initialized successfully');

        } catch (error) {
            console.error('[ReviewPage] Error initializing QR scanner:', error);
            this.showScannerError('Failed to initialize camera. Please ensure camera permissions are granted.');
        }
    }

    /**
     * Handle successful QR code scan
     */
    async onQRCodeScanned(decodedText, decodedResult) {
        console.log('[ReviewPage] QR code scanned:', decodedText);

        try {
            // Stop scanning
            if (this.qrReader) {
                await this.qrReader.stop();
                this.qrReader = null;
            }

            // Hide scanner section
            const qrReaderSection = document.getElementById('qr-reader-section');
            if (qrReaderSection) {
                qrReaderSection.style.display = 'none';
            }

            // Process the scanned data
            await this.processScannedData(decodedText);

        } catch (error) {
            console.error('[ReviewPage] Error processing QR code:', error);
            this.showError('Failed to process QR code. Please try again.');
            this.resetScanner();
        }
    }

    /**
     * Handle QR scan errors
     */
    onQRScanError(error) {
        // Only log significant errors, not "No QR code found"
        if (error && !error.includes('No QR code found')) {
            console.warn('[ReviewPage] QR scan error:', error);
        }
    }

    /**
     * Process scanned QR code data
     */
    async processScannedData(scannedData) {
        console.log('[ReviewPage] Processing scanned data:', scannedData);

        try {
            let toiletId = null;

            // Check if it's a review URL
            if (scannedData.includes('review.html?id=')) {
                const url = new URL(scannedData);
                toiletId = url.searchParams.get('id');
            } else {
                // Treat as direct toilet ID
                toiletId = scannedData.trim();
            }

            if (!toiletId) {
                throw new Error('Invalid QR code format - no toilet ID found');
            }

            // Load toilet information
            await this.loadToiletInfo(toiletId);

        } catch (error) {
            console.error('[ReviewPage] Error processing scanned data:', error);
            this.showError('Invalid QR code. Please scan a valid toilet QR code.');
            this.resetScanner();
        }
    }

    /**
     * Load toilet information for review
     */
    async loadToiletInfo(toiletId) {
        console.log('[ReviewPage] Loading toilet info for ID:', toiletId);

        const toiletInfo = document.getElementById('toiletInfo');
        if (!toiletInfo) return;

        try {
            // Show loading state
            toiletInfo.innerHTML = `
                <div class="toilet-info__loading" role="status" aria-live="polite">
                    <div class="loading-spinner" aria-hidden="true"></div>
                    <p>Loading toilet information...</p>
                </div>
            `;
            toiletInfo.style.display = 'block';

            // Fetch toilet data
            const toilet = await this.toiletApiService.getToiletById(toiletId);

            if (!toilet) {
                throw new Error('Toilet not found');
            }

            // Store current toilet ID
            this.currentToiletId = toiletId;

            // Display toilet information
            this.displayToiletInfo(toilet);

            // Show review form
            const reviewFormSection = document.getElementById('reviewFormSection');
            if (reviewFormSection) {
                reviewFormSection.style.display = 'block';
            }

        } catch (error) {
            console.error('[ReviewPage] Error loading toilet info:', error);
            toiletInfo.innerHTML = `
                <div class="toilet-info__error" role="alert">
                    <h3>Error Loading Toilet Information</h3>
                    <p>${error.message}</p>
                    <button onclick="window.location.reload()" class="btn btn-primary">Try Again</button>
                </div>
            `;
        }
    }

    /**
     * Display toilet information
     */
    displayToiletInfo(toilet) {
        const toiletInfo = document.getElementById('toiletInfo');

        const facilitiesHtml = toilet.facilities && toilet.facilities.length > 0
            ? toilet.facilities.map(facility =>
                `<span class="toilet-info__facility">${facility.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>`
            ).join('')
            : '<span class="toilet-info__facility">No facilities listed</span>';

        toiletInfo.innerHTML = `
            <h2 class="toilet-info__title">Toilet Information</h2>
            <div class="toilet-info__content">
                <div class="toilet-info__group">
                    <h3 class="toilet-info__value">${toilet.name || 'Unnamed Toilet'}</h3>
                    <p class="toilet-info__value">${toilet.location || 'Location not specified'}</p>
                </div>
                <div class="toilet-info__group">
                    <h4 class="toilet-info__label">Current Rating</h4>
                    <p class="toilet-info__rating">${toilet.averageRating ? `${toilet.averageRating.toFixed(1)} ⭐` : 'No ratings yet'}</p>
                    <p class="toilet-info__value">${toilet.totalReviews || 0} reviews</p>
                </div>
                <div class="toilet-info__group">
                    <h4 class="toilet-info__label">Facilities</h4>
                    <div class="toilet-info__facilities">${facilitiesHtml}</div>
                </div>
            </div>
        `;
    }

    /**
     * Set up form event handlers
     */
    setupFormHandlers() {
        const reviewForm = document.getElementById('reviewForm');
        const scanNewQRBtn = document.getElementById('scanNewQR');

        if (reviewForm) {
            reviewForm.addEventListener('submit', this.handleReviewSubmit.bind(this));
        }

        if (scanNewQRBtn) {
            scanNewQRBtn.addEventListener('click', this.resetScanner.bind(this));
        }
    }

    /**
     * Handle review form submission
     */
    async handleReviewSubmit(event) {
        event.preventDefault();

        if (!this.currentToiletId) {
            this.showError('No toilet selected. Please scan a QR code first.');
            return;
        }

        const submitBtn = event.target.querySelector('button[type="submit"]');
        this.setButtonLoading(submitBtn, true);

        try {
            // Collect form data
            const formData = new FormData(event.target);
            const reviewData = {
                toiletId: this.currentToiletId,
                rating: parseInt(formData.get('rating')),
                cleanliness: parseInt(formData.get('cleanliness')),
                maintenance: parseInt(formData.get('maintenance')),
                accessibility: parseInt(formData.get('accessibility')),
                comment: formData.get('comments')?.trim() || ''
            };

            // Validate required fields
            if (!reviewData.rating || !reviewData.cleanliness || !reviewData.maintenance || !reviewData.accessibility) {
                throw new Error('Please fill in all required rating fields');
            }

            console.log('[ReviewPage] Submitting review:', reviewData);

            // Submit review
            await this.reviewApiService.submitReview(reviewData);

            // Show success message
            this.showSuccess();

        } catch (error) {
            console.error('[ReviewPage] Error submitting review:', error);
            this.showError(error.message || 'Failed to submit review. Please try again.');
        } finally {
            this.setButtonLoading(submitBtn, false);
        }
    }

    /**
     * Show success message
     */
    showSuccess() {
        // Hide form sections
        const toiletInfo = document.getElementById('toiletInfo');
        const reviewFormSection = document.getElementById('reviewFormSection');

        if (toiletInfo) toiletInfo.style.display = 'none';
        if (reviewFormSection) reviewFormSection.style.display = 'none';

        // Show success message
        const successMessage = document.getElementById('successMessage');
        if (successMessage) {
            successMessage.style.display = 'block';

            // Create confetti effect
            this.createConfetti();
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        // Simple alert for now - could be enhanced with a proper error UI
        alert(`Error: ${message}`);
    }

    /**
     * Show scanner error
     */
    showScannerError(message) {
        const qrReaderSection = document.getElementById('qr-reader-section');
        if (qrReaderSection) {
            qrReaderSection.innerHTML = `
                <div class="scanner-section__error" role="alert">
                    <h2 class="scanner-section__title">Camera Error</h2>
                    <p>${message}</p>
                    <button onclick="window.location.reload()" class="btn btn-primary">Retry</button>
                </div>
            `;
        }
    }

    /**
     * Reset scanner to initial state
     */
    resetScanner() {
        console.log('[ReviewPage] Resetting scanner...');

        // Stop current scanner
        if (this.qrReader) {
            this.qrReader.stop().catch(console.error);
            this.qrReader = null;
        }

        // Hide all sections
        const sections = ['toiletInfo', 'reviewFormSection', 'successMessage'];
        sections.forEach(sectionId => {
            const element = document.getElementById(sectionId);
            if (element) element.style.display = 'none';
        });

        // Reset form
        const reviewForm = document.getElementById('reviewForm');
        if (reviewForm) reviewForm.reset();

        // Show scanner section
        const qrReaderSection = document.getElementById('qr-reader-section');
        if (qrReaderSection) {
            qrReaderSection.style.display = 'block';
            qrReaderSection.innerHTML = `
                <h2 class="scanner-section__title">Scan QR Code</h2>
                <div id="qr-reader" class="scanner-section__reader" role="application" aria-label="QR code scanner"></div>
                <div class="scanner-section__instructions">
                    <h3 class="scanner-section__instructions-title">How to Scan</h3>
                    <p class="scanner-section__instructions-text">Point your camera at the toilet's QR code to begin your review.</p>
                </div>
            `;

            // Reinitialize scanner
            setTimeout(() => this.initializeQRScanner(), 100);
        }

        // Reset current toilet ID
        this.currentToiletId = null;
    }

    /**
     * Create confetti effect for success
     */
    createConfetti() {
        const confettiContainer = document.getElementById('confettiContainer') || document.createElement('div');
        confettiContainer.id = 'confettiContainer';
        confettiContainer.className = 'confetti-container';

        const colors = ['#ff69b4', '#ffd700', '#00ff00', '#ff0000', '#0000ff'];

        for (let i = 0; i < 50; i++) {
            const confetti = document.createElement('div');
            confetti.style.cssText = `
                position: absolute;
                width: 10px;
                height: 10px;
                background-color: ${colors[Math.floor(Math.random() * colors.length)]};
                left: ${Math.random() * 100}%;
                animation: fall ${3 + Math.random() * 2}s linear forwards;
                z-index: 1000;
            `;

            confettiContainer.appendChild(confetti);

            // Remove confetti after animation
            setTimeout(() => {
                if (confetti.parentNode) {
                    confetti.parentNode.removeChild(confetti);
                }
            }, 5000);
        }

        const successMessage = document.getElementById('successMessage');
        if (successMessage && !successMessage.contains(confettiContainer)) {
            successMessage.appendChild(confettiContainer);
        }
    }

    /**
     * Set button loading state
     */
    setButtonLoading(button, loading) {
        if (!button) return;

        button.disabled = loading;
        button.textContent = loading ? 'Submitting...' : 'Submit Review';

        if (loading) {
            button.classList.add('loading');
        } else {
            button.classList.remove('loading');
        }
    }

    /**
     * Cleanup when page is destroyed
     */
    destroy() {
        console.log('[ReviewPage] Destroying review page...');

        // Stop QR scanner
        if (this.qrReader) {
            this.qrReader.stop().catch(console.error);
            this.qrReader = null;
        }

        // Clear current toilet ID
        this.currentToiletId = null;

        console.log('[ReviewPage] Review page destroyed');
    }
}
