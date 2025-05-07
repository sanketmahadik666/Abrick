// DOM Elements
const toiletInfo = document.getElementById('toiletInfo');
const reviewForm = document.getElementById('reviewForm');
const reviewFormSection = document.getElementById('reviewFormSection');
const successMessage = document.getElementById('successMessage');
const scanNewQRButton = document.getElementById('scanNewQR');
const qrReaderSection = document.getElementById('qr-reader-section');

let currentToiletId = null;
let qrScanner = null;

// Add debugging utility
const debug = {
    log: (message, data) => {
        if (process.env.NODE_ENV === 'development') {
            console.log(`[DEBUG] ${message}`, data || '');
        }
    },
    error: (message, error) => {
        console.error(`[ERROR] ${message}`, error);
    }
};

// Initialize QR Scanner
function initializeQRScanner() {
    debug.log('Initializing QR Scanner');
    qrReaderSection.style.display = 'block';
    const html5QrCode = new Html5Qrcode("qr-reader");
    
    // Check for camera permissions first
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        debug.error('Camera access not supported');
        alert("Camera access is not supported in your browser. Please use a modern browser with camera support.");
        return null;
    }

    html5QrCode.start(
        { facingMode: "environment" },
        {
            fps: 10,
            qrbox: { width: 250, height: 250 }
        },
        (decodedText) => {
            debug.log('QR Code scanned:', decodedText);
            
            // Stop scanning after successful scan
            html5QrCode.stop();
            
            // Hide scanner after successful scan
            qrReaderSection.style.display = 'none';
            
            // Extract toilet ID from QR code
            try {
                // Try parsing as JSON first
                const parsedData = JSON.parse(decodedText);
                if (parsedData && parsedData.toiletId) {
                    currentToiletId = parsedData.toiletId;
                    debug.log('Parsed toilet ID from JSON:', currentToiletId);
                } else {
                    throw new Error('Invalid QR code format');
                }
            } catch (e) {
                debug.error('Error parsing QR code data:', e);
                // If not JSON or invalid format, try using the raw text as ID
                if (decodedText && decodedText.trim()) {
                    currentToiletId = decodedText.trim();
                    debug.log('Using raw text as toilet ID:', currentToiletId);
                } else {
                    throw new Error('Invalid QR code content');
                }
            }

            // Clean the ID - remove any quotes or extra whitespace
            currentToiletId = currentToiletId.replace(/['"]/g, '').trim();
            
            if (!currentToiletId) {
                throw new Error('No toilet ID found in QR code');
            }
            
            loadToiletInfo(currentToiletId);
        },
        (error) => {
            // Log scan errors for debugging
            debug.error('QR Scan error:', error);
        }
    ).catch((err) => {
        debug.error('QR Scanner initialization error:', err);
        if (err.name === 'NotAllowedError') {
            alert("Camera access was denied. Please allow camera access to scan QR codes.");
        } else if (err.name === 'NotFoundError') {
            alert("No camera found. Please connect a camera to scan QR codes.");
        } else {
            alert("Could not start QR scanner. Please check camera permissions and try again.");
        }
    });

    return html5QrCode;
}

// Load toilet information
async function loadToiletInfo(toiletId) {
    debug.log('Loading toilet info for ID:', toiletId);
    try {
        const response = await fetch(`/api/toilet/${toiletId}`);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to load toilet information');
        }

        debug.log('Toilet data loaded:', data);

        toiletInfo.innerHTML = `
            <h2>${data.name}</h2>
            <p><strong>Location:</strong> ${data.location}</p>
            <p>${data.description || ''}</p>
            <div class="ratings-summary">
                <p><strong>Average Rating:</strong> ${data.averageRating?.toFixed(1) || 'No ratings yet'} ⭐</p>
                <p><strong>Total Reviews:</strong> ${data.totalReviews || 0}</p>
            </div>
        `;

        // Show toilet info and review form
        toiletInfo.style.display = 'block';
        reviewFormSection.style.display = 'block';
    } catch (error) {
        debug.error('Error loading toilet info:', error);
        alert('Could not load toilet information. Please try scanning again.');
        // Show scanner again if loading fails
        qrReaderSection.style.display = 'block';
    }
}

// Add this function at the top with other functions
function createConfetti() {
    const confettiContainer = document.getElementById('confettiContainer');
    const colors = ['#ff69b4', '#ffd700', '#00ff00', '#ff0000', '#0000ff'];
    
    // Create 50 confetti pieces
    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.animationDelay = Math.random() * 2 + 's';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confettiContainer.appendChild(confetti);
        
        // Remove confetti after animation
        setTimeout(() => {
            confetti.remove();
        }, 5000);
    }
}

// Handle review submission
reviewForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Disable form while submitting
    const submitButton = reviewForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = 'Submitting...';

    try {
        const reviewData = {
            toiletId: currentToiletId,
            rating: parseInt(document.querySelector('input[name="rating"]:checked').value),
            cleanliness: parseInt(document.querySelector('input[name="cleanliness"]:checked').value),
            maintenance: parseInt(document.querySelector('input[name="maintenance"]:checked').value),
            accessibility: parseInt(document.querySelector('input[name="accessibility"]:checked').value),
            comment: document.getElementById('comments').value
        };

        // Validate all required fields
        if (!reviewData.rating || !reviewData.cleanliness || !reviewData.maintenance || !reviewData.accessibility) {
            throw new Error('Please provide all ratings');
        }

        const response = await fetch('/api/reviews', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(reviewData)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to submit review');
        }

        // Hide review form and toilet info
        reviewFormSection.style.display = 'none';
        toiletInfo.style.display = 'none';
        
        // Show success message with animations
        successMessage.style.display = 'block';
        createConfetti();

    } catch (error) {
        console.error('Error submitting review:', error);
        alert(error.message || 'Failed to submit review. Please try again.');
    } finally {
        // Re-enable form
        submitButton.disabled = false;
        submitButton.textContent = 'Submit Review';
    }
});

// Handle "Scan New QR" button click
scanNewQRButton.addEventListener('click', () => {
    // Reset the form
    reviewForm.reset();
    
    // Hide all sections except scanner
    successMessage.style.display = 'none';
    reviewFormSection.style.display = 'none';
    toiletInfo.style.display = 'none';
    
    // Initialize new QR scanner
    if (qrScanner) {
        qrScanner.stop();
    }
    qrScanner = initializeQRScanner();
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    // Get toilet ID from URL if present
    const urlParams = new URLSearchParams(window.location.search);
    const toiletId = urlParams.get('id');

    if (toiletId) {
        // Hide scanner if we have a toilet ID
        qrReaderSection.style.display = 'none';
        currentToiletId = toiletId;
        loadToiletInfo(toiletId);
    } else {
        // Initialize QR scanner if no toilet ID in URL
        qrScanner = initializeQRScanner();
    }
}); 