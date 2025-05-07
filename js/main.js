// DOM Elements
const homeSection = document.getElementById('homeSection');
const adminLoginSection = document.getElementById('adminLoginSection');
const adminDashboardSection = document.getElementById('adminDashboardSection');
const reviewFormSection = document.getElementById('reviewFormSection');

const homeLink = document.getElementById('homeLink');
const adminLoginLink = document.getElementById('adminLoginLink');
const adminDashboardLink = document.getElementById('adminDashboardLink');

const adminLoginForm = document.getElementById('adminLoginForm');
const reviewForm = document.getElementById('reviewForm');
const addToiletBtn = document.getElementById('addToiletBtn');
const viewToiletsBtn = document.getElementById('viewToiletsBtn');
const viewReviewsBtn = document.getElementById('viewReviewsBtn');
const logoutBtn = document.getElementById('logoutBtn');

// State
let currentToiletId = null;
let token = localStorage.getItem('adminToken');

// Navigation
function showSection(section) {
    [homeSection, adminLoginSection, adminDashboardSection, reviewFormSection].forEach(s => {
        s.style.display = 'none';
    });
    section.style.display = 'block';
}

homeLink.addEventListener('click', (e) => {
    e.preventDefault();
    showSection(homeSection);
    if (token) {
        adminDashboardLink.style.display = 'inline';
    }
});

adminLoginLink.addEventListener('click', (e) => {
    e.preventDefault();
    showSection(adminLoginSection);
});

adminDashboardLink.addEventListener('click', (e) => {
    e.preventDefault();
    showSection(adminDashboardSection);
    loadDashboard();
});

// Admin Authentication
adminLoginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('/api/admin/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();
        if (response.ok) {
            token = data.token;
            localStorage.setItem('adminToken', token);
            adminDashboardLink.style.display = 'inline';
            showSection(adminDashboardSection);
            loadDashboard();
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Login failed. Please try again.');
    }
});

logoutBtn.addEventListener('click', () => {
    token = null;
    localStorage.removeItem('adminToken');
    adminDashboardLink.style.display = 'none';
    showSection(homeSection);
});

// Dashboard Functions
async function loadDashboard() {
    const dashboardContent = document.getElementById('dashboardContent');
    dashboardContent.innerHTML = '<h3>Select an action from above</h3>';
}

addToiletBtn.addEventListener('click', () => {
    const dashboardContent = document.getElementById('dashboardContent');
    dashboardContent.innerHTML = `
        <form id="addToiletForm">
            <input type="text" id="toiletName" placeholder="Toilet Name" required>
            <input type="text" id="toiletLocation" placeholder="Location" required>
            <textarea id="toiletDescription" placeholder="Description"></textarea>
            <button type="submit">Add Toilet</button>
        </form>
    `;

    document.getElementById('addToiletForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const toiletData = {
            name: document.getElementById('toiletName').value,
            location: document.getElementById('toiletLocation').value,
            description: document.getElementById('toiletDescription').value
        };

        try {
            const response = await fetch('/api/toilet/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(toiletData)
            });

            const data = await response.json();
            if (response.ok) {
                alert('Toilet added successfully!');
                loadToilets();
            } else {
                alert(data.message);
            }
        } catch (error) {
            console.error('Error adding toilet:', error);
            alert('Failed to add toilet. Please try again.');
        }
    });
});

viewToiletsBtn.addEventListener('click', loadToilets);
viewReviewsBtn.addEventListener('click', loadReviews);

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

// Update loadToilets with debugging
async function loadToilets() {
    debug.log('Loading toilets from API');
    try {
        const response = await fetch('/api/toilet/map');
        const toilets = await response.json();

        if (!response.ok) {
            throw new Error(toilets.message || 'Failed to load toilets');
        }

        debug.log('Toilets loaded:', toilets);

        // Clear existing markers
        markers.forEach(marker => marker.remove());
        markers = [];

        // Add markers for each toilet
        toilets.forEach(toilet => {
            const marker = L.marker([toilet.location.coordinates[1], toilet.location.coordinates[0]])
                .bindPopup(`
                    <strong>${toilet.name}</strong><br>
                    ${toilet.location.address}<br>
                    Rating: ${toilet.averageRating?.toFixed(1) || 'No ratings'} ⭐
                `);
            marker.addTo(map);
            markers.push(marker);
        });

        // Update toilet list
        updateToiletList(toilets);
    } catch (error) {
        debug.error('Error loading toilets:', error);
        alert('Failed to load toilets. Please try again later.');
    }
}

async function loadReviews() {
    try {
        const response = await fetch('/api/reviews', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const reviews = await response.json();
        
        const dashboardContent = document.getElementById('dashboardContent');
        dashboardContent.innerHTML = reviews.map(review => `
            <div class="review-card">
                <h3>Review for ${review.toiletId}</h3>
                <p>Rating: ${review.rating}/5</p>
                <p>Cleanliness: ${review.cleanliness}/5</p>
                <p>Maintenance: ${review.maintenance}/5</p>
                <p>Accessibility: ${review.accessibility}/5</p>
                <p>Comment: ${review.comment}</p>
                <p>Date: ${new Date(review.createdAt).toLocaleDateString()}</p>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading reviews:', error);
        alert('Failed to load reviews. Please try again.');
    }
}

async function editToilet(id) {
    try {
        const response = await fetch(`/api/toilet/${id}`);
        const toilet = await response.json();
        
        const dashboardContent = document.getElementById('dashboardContent');
        dashboardContent.innerHTML = `
            <form id="editToiletForm">
                <input type="text" id="editToiletName" value="${toilet.name}" required>
                <input type="text" id="editToiletLocation" value="${toilet.location}" required>
                <textarea id="editToiletDescription">${toilet.description}</textarea>
                <button type="submit">Update Toilet</button>
                <button type="button" onclick="loadToilets()">Cancel</button>
            </form>
        `;

        document.getElementById('editToiletForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const toiletData = {
                name: document.getElementById('editToiletName').value,
                location: document.getElementById('editToiletLocation').value,
                description: document.getElementById('editToiletDescription').value
            };

            try {
                const updateResponse = await fetch(`/api/toilet/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(toiletData)
                });

                if (updateResponse.ok) {
                    alert('Toilet updated successfully!');
                    loadToilets();
                } else {
                    const data = await updateResponse.json();
                    alert(data.message);
                }
            } catch (error) {
                console.error('Error updating toilet:', error);
                alert('Failed to update toilet. Please try again.');
            }
        });
    } catch (error) {
        console.error('Error loading toilet details:', error);
        alert('Failed to load toilet details. Please try again.');
    }
}

async function deleteToilet(id) {
    if (!confirm('Are you sure you want to delete this toilet?')) return;

    try {
        const response = await fetch(`/api/toilet/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            alert('Toilet deleted successfully!');
            loadToilets();
        } else {
            const data = await response.json();
            alert(data.message);
        }
    } catch (error) {
        console.error('Error deleting toilet:', error);
        alert('Failed to delete toilet. Please try again.');
    }
}

// QR Code Scanner
let scanner = null;

function startScanner() {
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    
    video.style.display = 'block';
    canvas.style.display = 'block';

    scanner = new QRScanner(video, result => {
        try {
            const data = JSON.parse(result);
            currentToiletId = data.toiletId;
            showSection(reviewFormSection);
        } catch (error) {
            console.error('Invalid QR code:', error);
            alert('Invalid QR code. Please try again.');
        }
    });
}

function stopScanner() {
    if (scanner) {
        scanner.destroy();
        scanner = null;
    }
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    video.style.display = 'none';
    canvas.style.display = 'none';
}

// Review Form
reviewForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentToiletId) {
        alert('No toilet selected. Please scan a QR code first.');
        return;
    }

    const reviewData = {
        toiletId: currentToiletId,
        rating: parseInt(document.getElementById('rating').value),
        cleanliness: parseInt(document.getElementById('cleanliness').value),
        maintenance: parseInt(document.getElementById('maintenance').value),
        accessibility: parseInt(document.getElementById('accessibility').value),
        comment: document.getElementById('comment').value
    };

    try {
        const response = await fetch('/api/reviews', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(reviewData)
        });

        if (response.ok) {
            alert('Review submitted successfully!');
            showSection(homeSection);
            reviewForm.reset();
            currentToiletId = null;
        } else {
            const data = await response.json();
            alert(data.message);
        }
    } catch (error) {
        console.error('Error submitting review:', error);
        alert('Failed to submit review. Please try again.');
    }
});

// Add registration form to admin login section
adminLoginSection.innerHTML = `
    <h2>Admin Login</h2>
    <form id="adminLoginForm">
        <input type="text" id="username" placeholder="Username" required>
        <input type="password" id="password" placeholder="Password" required>
        <button type="submit">Login</button>
    </form>
    <div class="register-section">
        <h3>New Admin? Register here</h3>
        <form id="adminRegisterForm">
            <input type="text" id="registerUsername" placeholder="Username" required>
            <input type="password" id="registerPassword" placeholder="Password" required>
            <button type="submit">Register</button>
        </form>
    </div>
`;

// Handle admin registration
document.getElementById('adminRegisterForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('registerUsername').value;
    const password = document.getElementById('registerPassword').value;

    try {
        const response = await fetch('/api/admin/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();
        if (response.ok) {
            token = data.token;
            localStorage.setItem('adminToken', token);
            adminDashboardLink.style.display = 'inline';
            showSection(adminDashboardSection);
            loadDashboard();
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error('Registration error:', error);
        alert('Registration failed. Please try again.');
    }
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    if (token) {
        adminDashboardLink.style.display = 'inline';
    }
    startScanner();
}); 