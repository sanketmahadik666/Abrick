// DOM Elements
const toiletInfo = document.getElementById('toiletInfo');
const reviewForm = document.getElementById('reviewForm');
const reviewFormSection = document.getElementById('reviewFormSection');
const successMessage = document.getElementById('successMessage');
const scanNewQRButton = document.getElementById('scanNewQR');
const qrReaderSection = document.getElementById('qr-reader-section');

let currentToiletId = null;
let qrScanner = null;

// Initialize QR Scanner
function initializeQRScanner() {
    qrReaderSection.style.display = 'block';
    const html5QrCode = new Html5Qrcode("qr-reader");
    html5QrCode.start(
        { facingMode: "environment" },
        {
            fps: 10,
            qrbox: { width: 250, height: 250 }
        },
        (decodedText) => {
            // Stop scanning after successful scan
            html5QrCode.stop();
            
            // Hide scanner after successful scan
            qrReaderSection.style.display = 'none';
            
            // Extract toilet ID from QR code
            try {
                // Try parsing as JSON first
                const parsedData = JSON.parse(decodedText);
                currentToiletId = parsedData.toiletId;
            } catch (e) {
                // If not JSON, use the raw text as ID
                currentToiletId = decodedText;
            }

            // Clean the ID - remove any quotes or extra whitespace
            currentToiletId = currentToiletId.replace(/['"]/g, '').trim();
            
            loadToiletInfo(currentToiletId);
        },
        (error) => {
            // Handle scan error silently
        }
    ).catch((err) => {
        console.error("QR Scanner error:", err);
        alert("Could not start QR scanner. Please check camera permissions.");
    });

    return html5QrCode;
}

// Load toilet information
async function loadToiletInfo(toiletId) {
    try {
        const response = await fetch(`/api/toilet/${toiletId}`);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to load toilet information');
        }

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
        console.error('Error loading toilet info:', error);
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

    const reviewData = {
        toiletId: currentToiletId,
        rating: parseInt(document.querySelector('input[name="rating"]:checked').value),
        cleanliness: parseInt(document.querySelector('input[name="cleanliness"]:checked').value),
        maintenance: parseInt(document.querySelector('input[name="maintenance"]:checked').value),
        accessibility: parseInt(document.querySelector('input[name="accessibility"]:checked').value),
        comment: document.getElementById('comments').value
    };

    try {
        const response = await fetch('/api/review/submit', {
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

        // Play celebration sound (optional)
    } catch (error) {
        console.error('Error submitting review:', error);
        alert('Failed to submit review. Please try again.');
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