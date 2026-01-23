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

// Initialize Map
async function initMap() {
    try {
        const map = MapModule.init('map');
        MapModule.locateUser();

        // Fetch toilets
        const toilets = await API.request('/api/toilet/map');
        elements.mapLoading.style.display = 'none';

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
            // Note: API returns coordinates as object {latitude, longitude} or array?
            // Checking admin.html/index.html previous code... 
            // index.html previous logic used `toilet.location.coordinates[1], toilet.location.coordinates[0]` 
            // if location was an object with coordinates array [long, lat]? 
            // Wait, previous `main.js` (line 170) used `toilet.location.coordinates[1], toilet.location.coordinates[0]`.
            // But `admin.html` sample data or `index.html` logic?
            // Let's assume standard GeoJSON [lng, lat] for now, so Leaflet needs [lat, lng].
            
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
            
            MapModule.addMarker(lat, lng, popupContent);
        });

    } catch (error) {
        console.error('Error initializing map:', error);
        elements.mapLoading.style.display = 'none';
        elements.mapError.textContent = 'Failed to load nearby toilets.';
        elements.mapError.style.display = 'block';
    }
}

// Scanner Handler
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
        
        elements.toiletInfoPanel.style.display = 'block';
        elements.reviewFormSection.style.display = 'block';
        
        // Scroll to form
        elements.toiletInfoPanel.scrollIntoView({ behavior: 'smooth' });

    } catch (error) {
        UI.hideGlobalLoading();
        console.error('Scan error:', error);
        alert(error.message || 'Error processing QR code');
        // Restart scanner
        startScanner();
    }
}

function updateToiletInfo(toilet) {
    elements.toiletName.textContent = toilet.name;
    elements.toiletLocation.textContent = toilet.location || toilet.address || 'Unknown Location';
    elements.overallRating.textContent = UI.generateStarRating(toilet.averageRating);
    elements.totalReviews.textContent = `(${toilet.totalReviews || 0} reviews)`;
    
    // Facilities
    if (toilet.facilities && toilet.facilities.length > 0) {
        elements.facilitiesList.innerHTML = toilet.facilities.map(f => 
            `<span class="facility-tag">${formatFacility(f)}</span>`
        ).join('');
    } else {
        elements.facilitiesList.innerHTML = '<p>No facilities information</p>';
    }
}

function formatFacility(str) {
    return str.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function startScanner() {
    Scanner.init('qr-reader', onScanSuccess, (error) => {
        // Ignore verbose scanning errors
    });
}

// Review Submission
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
            comment: document.getElementById('comments').value // Textarea might not be in FormData if not 'name' attribute... check html
        };
        
        // Check html for textarea name
        // <textarea id="comments" ...> NO NAME ATTRIBUTE in previous html 
        // will rely on id

        UI.showGlobalLoading();
        await API.request('/api/review/submit', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        UI.hideGlobalLoading();

        // Show Success
        elements.reviewFormSection.style.display = 'none';
        elements.toiletInfoPanel.style.display = 'none';
        elements.successMessage.style.display = 'block';
        
        // Confetti effect (simple CSS one)
        createConfetti();

    } catch (error) {
        UI.hideGlobalLoading();
        console.error('Submit error:', error);
        alert('Failed to submit review: ' + error.message);
    }
});

elements.scanNewQRBtn.addEventListener('click', () => {
    elements.successMessage.style.display = 'none';
    elements.reviewForm.reset();
    currentToiletId = null;
    startScanner();
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

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
document.addEventListener('DOMContentLoaded', () => {
    initMap();
    startScanner();
});
