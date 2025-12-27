// Enhanced review.js for Hybrid Public/Private Toilet System
// Updated to work with modern API endpoints and review functionality

// DOM Elements - Enhanced for hybrid system
const reviewForm = document.getElementById('reviewForm');
const reviewFormSection = document.getElementById('reviewFormSection');
const successMessage = document.getElementById('successMessage');
const scanNewQRButton = document.getElementById('scanNewQR');
const toiletInfoPanel = document.getElementById('toiletInfoPanel');

// State - Enhanced for hybrid system
let currentToiletId = null;
let currentToiletData = null;
let scanner = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    console.log('[REVIEW] Initializing review.js...');

    // Check if we're on a page with review functionality
    if (reviewForm) {
        console.log('[REVIEW] Review form found, attaching listeners');
        attachReviewFormListeners();
    }

    // Check if QR scanner is needed
    if (document.getElementById('qr-reader')) {
        console.log('[REVIEW] QR scanner found, initializing...');
        initializeQRScanner();
    }

    console.log('[REVIEW] Initialization complete');
});

// Enhanced API request utility
async function makeApiRequest(endpoint, options = {}) {
    try {
        const API_URL = ToiletReviewUtils.getApiUrl();
        const fullUrl = `${API_URL}${endpoint}`;
        console.log(`[REVIEW-API] Making request to: ${fullUrl}`);
        const response = await fetch(fullUrl, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });

        console.log(`[REVIEW-API] Response status: ${response.status}`);

        let data;
        const contentType = response.headers.get('content-type');

        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
            console.log('[REVIEW-API] Response data:', data);
        } else {
            data = await response.text();
            console.log('[REVIEW-API] Response text:', data);
        }

        if (!response.ok) {
            throw new Error((data && data.message) || data || 'API request failed');
        }

        return data;
    } catch (error) {
        console.error('[REVIEW-API] Request error:', error);
        throw error;
    }
}

// Attach review form listeners
function attachReviewFormListeners() {
    if (reviewForm) {
        reviewForm.addEventListener('submit', handleReviewSubmission);
        console.log('[REVIEW] Review form listener attached');
    }

    if (scanNewQRButton) {
        scanNewQRButton.addEventListener('click', resetScanner);
        console.log('[REVIEW] Scan new QR button listener attached');
    }
}

// Handle review form submission - Enhanced for hybrid system
async function handleReviewSubmission(e) {
    e.preventDefault();

    console.log('[REVIEW] Processing review submission...');

    if (!currentToiletId) {
        console.error('[REVIEW] No toilet ID found');
        alert('No toilet selected. Please scan a QR code first.');
        return;
    }

    // Get form data from radio button groups
    const reviewData = {
        toiletId: currentToiletId,
        rating: parseInt(document.querySelector('input[name="rating"]:checked').value),
        cleanliness: parseInt(document.querySelector('input[name="cleanliness"]:checked').value),
        maintenance: parseInt(document.querySelector('input[name="maintenance"]:checked').value),
        accessibility: parseInt(document.querySelector('input[name="accessibility"]:checked').value),
        comment: document.getElementById('comments').value.trim()
    };

    console.log('[REVIEW] Review data:', reviewData);

    // Validation
    if (!reviewData.rating || !reviewData.cleanliness || !reviewData.maintenance || !reviewData.accessibility) {
        console.error('[REVIEW] Validation failed: Missing required ratings');
        alert('Please provide ratings for all categories.');
        return;
    }

    if (reviewData.rating < 1 || reviewData.rating > 5 ||
        reviewData.cleanliness < 1 || reviewData.cleanliness > 5 ||
        reviewData.maintenance < 1 || reviewData.maintenance > 5 ||
        reviewData.accessibility < 1 || reviewData.accessibility > 5) {
        console.error('[REVIEW] Validation failed: Invalid rating ranges');
        alert('All ratings must be between 1 and 5.');
        return;
    }

    // Submit button state
    const submitButton = reviewForm.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = 'Submitting...';

    try {
        console.log('[REVIEW] Submitting review to API...');
        const data = await makeApiRequest('/api/review/submit', {
            method: 'POST',
            body: JSON.stringify(reviewData)
        });

        console.log('[REVIEW] Review submitted successfully:', data);

        // Show success message and confetti
        showSuccessMessage();

        // Reset form
        reviewForm.reset();
        currentToiletId = null;
        currentToiletData = null;

    } catch (error) {
        console.error('[REVIEW] Submission failed:', error);
        alert(error.message || 'Failed to submit review. Please try again.');
    } finally {
        // Reset button state
        submitButton.disabled = false;
        submitButton.textContent = originalText;
    }
}

// Show success message with animation
function showSuccessMessage() {
    console.log('[REVIEW] Showing success message');

    if (reviewFormSection) reviewFormSection.style.display = 'none';
    if (toiletInfoPanel) toiletInfoPanel.style.display = 'none';
    if (successMessage) successMessage.style.display = 'block';

    // Create confetti animation
    createConfetti();

    // Auto-hide success message after 5 seconds
    setTimeout(() => {
        if (successMessage) successMessage.style.display = 'none';
    }, 5000);
}

// Create confetti animation
function createConfetti() {
    console.log('[REVIEW] Creating confetti animation');

    const colors = ['#ff69b4', '#ffd700', '#00ff00', '#ff0000', '#0000ff'];
    const confettiCount = 50;

    for (let i = 0; i < confettiCount; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.animationDelay = Math.random() * 2 + 's';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        document.body.appendChild(confetti);

        // Remove confetti after animation
        setTimeout(() => {
            if (confetti.parentNode) {
                confetti.parentNode.removeChild(confetti);
            }
        }, 5000);
    }
}

// Load toilet information - Enhanced for hybrid system
async function loadToiletInfo(toiletId) {
    console.log('[REVIEW] Loading toilet info for ID:', toiletId);

    if (!toiletInfoPanel) {
        console.error('[REVIEW] Toilet info panel not found');
        return;
    }

    // Show loading state
    toiletInfoPanel.style.display = 'block';
    toiletInfoPanel.innerHTML = `
        <div style="text-align: center; padding: 2rem;">
            <div class="loading-spinner"></div>
            <p>Loading toilet information...</p>
        </div>
    `;

    try {
        console.log('[REVIEW] Fetching toilet data from API...');
        const response = await makeApiRequest(`/api/toilet/${toiletId}`);
        
        console.log('[REVIEW] Toilet response received:', response);

        // Handle both object and direct response formats
        const toilet = response && response.success ? response.data : 
                      (Array.isArray(response) ? response[0] : response);

        if (!toilet) {
            throw new Error('No toilet data received');
        }

        console.log('[REVIEW] Processed toilet data:', toilet);

        // Store toilet data and ID
        currentToiletId = toilet.id || toiletId; // Use extracted ID as fallback
        currentToiletData = toilet;

        // Update info panel
        updateToiletInfoPanel(toilet);

        // Show review form
        if (reviewFormSection) {
            reviewFormSection.style.display = 'block';
        }

    } catch (error) {
        console.error('[REVIEW] Error loading toilet info:', error);
        toiletInfoPanel.innerHTML = `
            <div style="color: #dc3545; text-align: center; padding: 2rem;">
                <h3>Error Loading Toilet Information</h3>
                <p>${error.message}</p>
                <p>Please make sure:</p>
                <ul style="text-align: left; margin: 1rem 0;">
                    <li>The backend server is running</li>
                    <li>You have a stable internet connection</li>
                    <li>The toilet ID is valid</li>
                </ul>
                <button onclick="resetScanner()" class="btn">Try Again</button>
            </div>
        `;
    }
}

// Update toilet info panel - Enhanced for hybrid system
function updateToiletInfoPanel(toilet) {
    console.log('[REVIEW] Updating toilet info panel for:', toilet.name);

    const isPublic = toilet.type === 'public';

    toiletInfoPanel.innerHTML = `
        <h2>Toilet Information</h2>
        <div class="toilet-details">
            <div class="info-group">
                <h3>${toilet.name || 'Unknown Toilet'}</h3>
                <div class="toilet-type-badge ${isPublic ? 'public-badge' : 'private-badge'}">
                    ${isPublic ? '🏛️ Public Facility' : '🏢 Private Toilet'}
                </div>
                <p><strong>Location:</strong> ${toilet.location || 'Location not specified'}</p>
                ${toilet.description ? `<p><strong>Description:</strong> ${toilet.description}</p>` : ''}
            </div>

            ${!isPublic ? `
                <div class="info-group">
                    <h4>Current Ratings</h4>
                    <div class="rating-summary">
                        <div class="rating-item">
                            <span>Overall Rating:</span>
                            <span class="rating-stars">${getStarRating(toilet.averageRating)}</span>
                        </div>
                        <div class="rating-item">
                            <span>Total Reviews:</span>
                            <span>${toilet.totalReviews || 0}</span>
                        </div>
                    </div>
                </div>
            ` : `
                <div class="info-group">
                    <div class="public-notice">
                        ℹ️ <strong>Public Facility Notice:</strong><br>
                        This is a public toilet facility. Information is provided for reference only.
                        Reviews and ratings are not available for public facilities.
                    </div>
                </div>
            `}

            <div class="info-group">
                <h4>Facilities</h4>
                <div class="facilities-list">
                    ${toilet.facilities && toilet.facilities.length > 0
                        ? toilet.facilities.map(facility => `
                            <span class="facility-tag">
                                ${facility.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </span>
                        `).join('')
                        : '<p>No facilities listed</p>'
                    }
                </div>
            </div>
        </div>
    `;
}

// Helper function to create star rating display
function getStarRating(rating) {
    if (!rating) return 'No ratings yet';
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    let stars = '★'.repeat(fullStars);
    if (halfStar) stars += '½';
    stars += '☆'.repeat(5 - Math.ceil(rating));
    return stars;
}

// Initialize QR Scanner - Enhanced for hybrid system
function initializeQRScanner() {
    console.log('[REVIEW] Initializing QR scanner...');

    const qrReader = document.getElementById('qr-reader');
    if (!qrReader) {
        console.warn('[REVIEW] QR reader element not found');
        return;
    }

    // Check if Html5Qrcode is available
    if (typeof Html5Qrcode === 'undefined') {
        console.error('[REVIEW] Html5Qrcode library not loaded');
        qrReader.innerHTML = '<p>QR scanner library not available. Please refresh the page.</p>';
        return;
    }

    try {
        scanner = new Html5QrcodeScanner(
            "qr-reader",
            {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0,
                showTorchButtonIfSupported: true,
                showZoomSliderIfSupported: true
            },
            false
        );

        scanner.render(onScanSuccess, onScanFailure);
        console.log('[REVIEW] QR scanner initialized successfully');

    } catch (error) {
        console.error('[REVIEW] Error initializing QR scanner:', error);
        qrReader.innerHTML = '<p>Error initializing QR scanner. Please refresh the page.</p>';
    }
}

// Handle successful QR scan - Enhanced for hybrid system
function onScanSuccess(decodedText, decodedResult) {
    console.log('[REVIEW] QR code scanned successfully:', decodedText);

    if (!decodedText || decodedText.trim() === '') {
        console.error('[REVIEW] Empty QR code data');
        alert('Invalid QR code. Please scan a valid toilet QR code.');
        return;
    }

    try {
        console.log('[REVIEW] Scanned QR code data:', decodedText);

        // Check if it's a review URL - extract toilet ID from URL
        if (decodedText.includes('review.html?id=')) {
            console.log('[REVIEW] QR Code contains review URL:', decodedText);

            try {
                // Extract toilet ID from URL
                const url = new URL(decodedText);
                const toiletId = url.searchParams.get('id');

                console.log('[REVIEW] URL parsing successful, extracted toilet ID:', toiletId);

                if (toiletId) {
                    console.log('[REVIEW] Loading toilet info for extracted ID:', toiletId);
                    loadToiletInfo(toiletId);
                    return;
                } else {
                    throw new Error('No toilet ID found in QR code URL');
                }
            } catch (urlError) {
                console.error('[REVIEW] URL parsing failed:', urlError);
                throw new Error('Invalid QR code URL format');
            }
        }

        // Check if it's a plain toilet ID
        const toiletId = decodedText.trim();
        if (toiletId && toiletId.length > 10) { // Basic validation for toilet ID
            console.log('[REVIEW] QR Code treated as toilet ID:', toiletId);
            loadToiletInfo(toiletId);
            return;
        }

        throw new Error('Invalid QR code format - not a valid review URL or toilet ID');

    } catch (error) {
        console.error('[REVIEW] Error processing QR code:', error);
        alert('Invalid QR code. Please scan a valid toilet QR code.');
        resetScanner();
    }
}

// Handle scan failure
function onScanFailure(error) {
    // Only log errors that aren't "No QR code found" to avoid spam
    if (error && !error.includes('No QR code found') && !error.includes('NotFoundException')) {
        console.warn('[REVIEW] QR scan error:', error);
    }
}

// Reset scanner function
function resetScanner() {
    console.log('[REVIEW] Resetting scanner...');

    // Stop current scanner
    if (scanner) {
        scanner.clear();
        scanner = null;
    }

    // Reset UI elements
    if (toiletInfoPanel) toiletInfoPanel.style.display = 'none';
    if (reviewFormSection) reviewFormSection.style.display = 'none';
    if (successMessage) successMessage.style.display = 'none';
    if (reviewForm) reviewForm.reset();

    const qrReader = document.getElementById('qr-reader');
    if (qrReader) {
        qrReader.style.display = 'block';
        qrReader.innerHTML = ''; // Clear any existing content
    }

    // Reset current toilet data
    currentToiletId = null;
    currentToiletData = null;

    // Initialize new scanner
    setTimeout(() => {
        initializeQRScanner();
    }, 100);

    console.log('[REVIEW] Scanner reset complete');
}

// Utility function for debugging
function debugLog(message, data) {
    if (process.env.NODE_ENV === 'development') {
        console.log(`[REVIEW-DEBUG] ${message}`, data || '');
    }
}

// Export functions for global access (if needed)
window.loadToiletInfo = loadToiletInfo;
window.resetScanner = resetScanner;

// Initialize if this script is loaded directly
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        loadToiletInfo,
        resetScanner,
        makeApiRequest
    };
}
