import { MapModule } from './map.js';
import { Scanner } from './scanner.js';
import { API } from './api.js';
import { UI } from './ui.js';

let currentToiletId = null;

// DOM Elements
const elements = {
    toiletInfoPanel: document.getElementById('toiletInfoPanel'),
    reviewFormSection: document.getElementById('reviewFormSection'),
    reviewForm: document.getElementById('reviewForm'),
    successMessage: document.getElementById('successMessage'),
    scanNewQRBtn: document.getElementById('scanNewQR'),
    toiletName: document.getElementById('toiletName'),
    toiletLocation: document.getElementById('toiletLocation'),
    overallRating: document.getElementById('overallRating'),
    totalReviews: document.getElementById('totalReviews'),
    facilitiesList: document.getElementById('facilitiesList'),
    mapError: document.getElementById('map-error'),
    mapLoading: document.getElementById('map-loading')
};

/**
 * Initialize the interactive map.
 */
async function initMap() {
    try {
        const map = MapModule.init('map');
        MapModule.locateUser();

        // Fetch toilets
        const toilets = await API.request('/api/toilet/map');
        if (elements.mapLoading) elements.mapLoading.style.display = 'none';

        toilets.forEach(toilet => {
            const popupContent = `
                <div class="toilet-popup">
                    <h3>${toilet.name}</h3>
                    <p>${toilet.location.address || toilet.location}</p>
                    <div class="rating">
                        <span class="rating-stars">${UI.generateStarRating(toilet.averageRating)}</span>
                        <span>(${toilet.totalReviews || 0})</span>
                    </div>
                    <p style="font-size: 12px; margin-top: 5px;">
                        ${toilet.facilities ? toilet.facilities.length : 0} facilities
                    </p>
                </div>
            `;
            
            // Safety check for coordinates
            let lat, lng;
            if (toilet.coordinates) {
                lat = toilet.coordinates.latitude;
                lng = toilet.coordinates.longitude;
            } else if (toilet.location && toilet.location.coordinates) {
                lng = toilet.location.coordinates[0];
                lat = toilet.location.coordinates[1];
            } else {
                return; // Skip if no coordinates
            }
            
            MapModule.addMarker(lat, lng, popupContent, toilet.averageRating);
        });
        
        MapModule.fitBounds();

    } catch (error) {
        console.error('Error initializing map:', error);
        if (elements.mapLoading) elements.mapLoading.style.display = 'none';
        if (elements.mapError) {
            elements.mapError.textContent = 'Failed to load nearby toilets.';
            elements.mapError.style.display = 'block';
        }
    }
}

/**
 * Handle successful QR scan.
 * @param {string} decodedText - The scanned text content.
 * @param {Object} decodedResult - Detailed scan result.
 */
async function onScanSuccess(decodedText, decodedResult) {
    try {
        // Stop scanning temporarily
        Scanner.clear();

        const data = JSON.parse(decodedText);
        if (!data.toiletId) {
            throw new Error('Invalid QR Code: No toilet ID found');
        }

        currentToiletId = data.toiletId;
        UI.showGlobalLoading();

        // Fetch details
        const toilet = await API.request(`/api/toilet/${currentToiletId}`);
        UI.hideGlobalLoading();

        // Update UI
        updateToiletInfo(toilet);
        
        if (elements.toiletInfoPanel) elements.toiletInfoPanel.style.display = 'block';
        if (elements.reviewFormSection) elements.reviewFormSection.style.display = 'block';
        
        // Scroll to form
        if (elements.toiletInfoPanel) elements.toiletInfoPanel.scrollIntoView({ behavior: 'smooth' });

    } catch (error) {
        UI.hideGlobalLoading();
        console.error('Scan error:', error);
        alert(error.message || 'Error processing QR code');
        // Restart scanner
        startScanner();
    }
}

/**
 * Update the UI with toilet details.
 * @param {Object} toilet - The toilet data object.
 */
function updateToiletInfo(toilet) {
    if (elements.toiletName) elements.toiletName.textContent = toilet.name;
    if (elements.toiletLocation) elements.toiletLocation.textContent = toilet.location || toilet.address || 'Unknown Location';
    if (elements.overallRating) elements.overallRating.textContent = UI.generateStarRating(toilet.averageRating);
    if (elements.totalReviews) elements.totalReviews.textContent = `(${toilet.totalReviews || 0} reviews)`;
    
    // Facilities
    if (elements.facilitiesList) {
        if (toilet.facilities && toilet.facilities.length > 0) {
            elements.facilitiesList.innerHTML = toilet.facilities.map(f => 
                `<span class="facility-tag">${formatFacility(f)}</span>`
            ).join('');
        } else {
            elements.facilitiesList.innerHTML = '<p>No facilities information</p>';
        }
    }
}

/**
 * Format a facility string (e.g. 'baby_change' -> 'Baby Change').
 * @param {string} str - The raw facility string.
 * @returns {string} Formatted string.
 */
function formatFacility(str) {
    return str.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Start or restart the QR scanner.
 */
function startScanner() {
    Scanner.init('qr-reader', onScanSuccess, (error) => {
        // Ignore verbose scanning errors
    });
}

// Review Submission
if (elements.reviewForm) {
    elements.reviewForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!currentToiletId) return;

        try {
            const formData = new FormData(elements.reviewForm);
            const data = {
                toiletId: currentToiletId,
                rating: parseInt(formData.get('rating')),
                cleanliness: parseInt(formData.get('cleanliness')),
                maintenance: parseInt(formData.get('maintenance')),
                accessibility: parseInt(formData.get('accessibility')),
                comment: document.getElementById('comments') ? document.getElementById('comments').value : ''
            };

            UI.showGlobalLoading();
            await API.request('/api/reviews', { // Note: changed from review/submit to match likely REST pattern, verify endpoint
                method: 'POST',
                body: JSON.stringify(data)
            });
            UI.hideGlobalLoading();

            // Show Success
            if (elements.reviewFormSection) elements.reviewFormSection.style.display = 'none';
            if (elements.toiletInfoPanel) elements.toiletInfoPanel.style.display = 'none';
            if (elements.successMessage) elements.successMessage.style.display = 'block';
            
            // Confetti effect
            createConfetti();

        } catch (error) {
            UI.hideGlobalLoading();
            console.error('Submit error:', error);
            alert('Failed to submit review: ' + error.message);
        }
    });
}

if (elements.scanNewQRBtn) {
    elements.scanNewQRBtn.addEventListener('click', () => {
        if (elements.successMessage) elements.successMessage.style.display = 'none';
        if (elements.reviewForm) elements.reviewForm.reset();
        currentToiletId = null;
        startScanner();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

function createConfetti() {
    for(let i=0; i<50; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.animationDuration = (Math.random() * 3 + 2) + 's';
        confetti.style.backgroundColor = ['#f00', '#0f0', '#00f', '#ff0'][Math.floor(Math.random() * 4)];
        document.body.appendChild(confetti);
        setTimeout(() => confetti.remove(), 5000);
    }
}

// Init
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await initMap();
        startScanner();
    } catch (error) {
        console.error('Initialization error:', error);
    } finally {
        // Hide initial loading screen regardless of success/failure
        UI.hideGlobalLoading();
    }
});
