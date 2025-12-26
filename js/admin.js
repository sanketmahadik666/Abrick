// DOM Elements
const loginSection = document.getElementById('loginSection');
const dashboardSection = document.getElementById('dashboard');
const adminLoginForm = document.getElementById('adminLoginForm');
const adminRegisterForm = document.getElementById('adminRegisterForm');
const logoutBtn = document.getElementById('logoutBtn');
const addToiletBtn = document.getElementById('addToiletBtn');
const viewToiletsBtn = document.getElementById('viewToiletsBtn');
const viewReviewsBtn = document.getElementById('viewReviewsBtn');
const dashboardContent = document.getElementById('dashboardContent');

// State
let token = localStorage.getItem('adminToken');

// Check authentication on page load
document.addEventListener('DOMContentLoaded', () => {
    if (token) {
        showDashboard();
    } else {
        showLogin();
    }
});

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

// Update makeApiRequest with debugging
async function makeApiRequest(endpoint, options = {}) {
    const token = localStorage.getItem('adminToken');
    const defaultHeaders = {
        'Content-Type': 'application/json',
    };

    if (token) {
        defaultHeaders['Authorization'] = `Bearer ${token}`;
    }

    try {
        debug.log(`Making API request to: ${API_URL}${endpoint}`);
        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers: {
                ...defaultHeaders,
                ...options.headers,
            },
        });

        debug.log(`Response status: ${response.status}`);
        let data;
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
            debug.log('Response data:', data);
        } else {
            data = await response.text();
            debug.log('Response text:', data);
        }

        if (!response.ok) {
            throw new Error((data && data.message) || data || 'API request failed');
        }

        return data;
    } catch (error) {
        debug.error('API request error:', error);
        throw error;
    }
}

// Admin Authentication
adminLoginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const loginError = document.getElementById('loginError');

    debug.log('Attempting login with email:', email);

    try {
        const data = await makeApiRequest('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });

        if (data.token && data.user.role === 'admin') {
            debug.log('Login successful, saving token');
            localStorage.setItem('adminToken', data.token);
            localStorage.setItem('adminEmail', data.user.email);
            showDashboard();
        } else {
            throw new Error('Unauthorized access. Admin privileges required.');
        }
    } catch (error) {
        debug.error('Login failed:', error);
        loginError.textContent = error.message || 'Login failed. Please check your credentials.';
        loginError.style.display = 'block';
    }
});

// Admin Registration
adminRegisterForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;

    try {
        console.log('Attempting registration with email:', email);

        const response = await fetch(`${API_URL}/api/admin/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        console.log('Registration response:', data);

        if (response.ok && data.token) {
            console.log('Registration successful, saving token');
            token = data.token;
            localStorage.setItem('token', token);
            showDashboard();
            alert('Registration successful! You are now logged in.');
        } else {
            console.error('Registration failed:', data.message);
            throw new Error(data.message || 'Registration failed');
        }
    } catch (error) {
        console.error('Registration error:', error);
        alert(error.message || 'Registration failed. Please try again.');
        // Clear password field on error
        document.getElementById('registerPassword').value = '';
    }
});

// Logout
logoutBtn.addEventListener('click', logout);

// Dashboard Functions
function showDashboard() {
    if (loginSection && dashboardSection) {
        loginSection.style.display = 'none';
        dashboardSection.style.display = 'block';
        if (dashboardContent) {
            dashboardContent.innerHTML = '<h3>Select an action from above</h3>';
        }
    } else {
        console.error('Dashboard or login section not found');
    }
}

function showLogin() {
    if (loginSection && dashboardSection) {
        loginSection.style.display = 'block';
        dashboardSection.style.display = 'none';
    } else {
        console.error('Dashboard or login section not found');
    }
}

// Add Toilet
addToiletBtn.addEventListener('click', () => {
    dashboardContent.innerHTML = `
        <form id="addToiletForm">
            <input type="text" id="toiletName" placeholder="Toilet Name" required>
            <input type="text" id="toiletLocation" placeholder="Location" required>
            <textarea id="toiletDescription" placeholder="Description"></textarea>
            <input type="number" id="latitude" placeholder="Latitude" step="any" required>
            <input type="number" id="longitude" placeholder="Longitude" step="any" required>
            <div class="facilities-checkboxes">
                <label><input type="checkbox" name="facilities" value="handicap"> Handicap Accessible</label>
                <label><input type="checkbox" name="facilities" value="baby_change"> Baby Change</label>
                <label><input type="checkbox" name="facilities" value="shower"> Shower</label>
                <label><input type="checkbox" name="facilities" value="bidet"> Bidet</label>
                <label><input type="checkbox" name="facilities" value="paper_towel"> Paper Towel</label>
                <label><input type="checkbox" name="facilities" value="hand_dryer"> Hand Dryer</label>
            </div>
            <button type="submit">Add Toilet</button>
        </form>
    `;

    document.getElementById('addToiletForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const facilities = Array.from(document.querySelectorAll('input[name="facilities"]:checked'))
            .map(checkbox => checkbox.value);

        const toiletData = {
            name: document.getElementById('toiletName').value,
            location: document.getElementById('toiletLocation').value,
            description: document.getElementById('toiletDescription').value,
            coordinates: {
                latitude: parseFloat(document.getElementById('latitude').value),
                longitude: parseFloat(document.getElementById('longitude').value)
            },
            facilities
        };

        try {
            const response = await fetch('/api/admin/toilet/add', {
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

// View Toilets
viewToiletsBtn.addEventListener('click', loadToilets);

async function loadToilets() {
    try {
        const response = await fetch('/api/toilet');
        const toilets = await response.json();
        
        dashboardContent.innerHTML = toilets.map(toilet => `
            <div class="toilet-card">
                <h3>${toilet.name}</h3>
                <p>Location: ${toilet.location}</p>
                <p>Description: ${toilet.description}</p>
                <p>Average Rating: ${toilet.averageRating.toFixed(1)}</p>
                <p>Total Reviews: ${toilet.totalReviews}</p>
                <div class="qr-code-container">
                    <img src="${toilet.qrCode}" alt="QR Code" class="qr-code">
                    <a href="${toilet.qrCode}" download class="download-qr">Download QR Code</a>
                </div>
                <div class="toilet-actions">
                    <button onclick="editToilet('${toilet._id}')">Edit</button>
                    <button onclick="deleteToilet('${toilet._id}')">Delete</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading toilets:', error);
        alert('Failed to load toilets. Please try again.');
    }
}

// View Reviews
viewReviewsBtn.addEventListener('click', loadReviews);

async function loadReviews() {
    try {
        const response = await fetch('/api/admin/reviews', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const reviews = await response.json();
        
        dashboardContent.innerHTML = reviews.map(review => `
            <div class="review-card">
                <h3>Review for ${review.toiletId.name}</h3>
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

// Edit Toilet
async function editToilet(id) {
    try {
        const response = await fetch(`/api/toilet/${id}`);
        const toilet = await response.json();
        
        dashboardContent.innerHTML = `
            <form id="editToiletForm">
                <input type="text" id="editToiletName" value="${toilet.name}" required>
                <input type="text" id="editToiletLocation" value="${toilet.location}" required>
                <textarea id="editToiletDescription">${toilet.description}</textarea>
                <input type="number" id="editLatitude" value="${toilet.coordinates.latitude}" step="any" required>
                <input type="number" id="editLongitude" value="${toilet.coordinates.longitude}" step="any" required>
                <div class="facilities-checkboxes">
                    ${['handicap', 'baby_change', 'shower', 'bidet', 'paper_towel', 'hand_dryer'].map(facility => `
                        <label>
                            <input type="checkbox" name="editFacilities" value="${facility}"
                                ${toilet.facilities.includes(facility) ? 'checked' : ''}>
                            ${facility.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </label>
                    `).join('')}
                </div>
                <button type="submit">Update Toilet</button>
                <button type="button" onclick="loadToilets()">Cancel</button>
            </form>
        `;

        document.getElementById('editToiletForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const facilities = Array.from(document.querySelectorAll('input[name="editFacilities"]:checked'))
                .map(checkbox => checkbox.value);

            const toiletData = {
                name: document.getElementById('editToiletName').value,
                location: document.getElementById('editToiletLocation').value,
                description: document.getElementById('editToiletDescription').value,
                coordinates: {
                    latitude: parseFloat(document.getElementById('editLatitude').value),
                    longitude: parseFloat(document.getElementById('editLongitude').value)
                },
                facilities
            };

            try {
                const updateResponse = await fetch(`/api/admin/toilet/${id}`, {
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

// Delete Toilet
async function deleteToilet(id) {
    if (!confirm('Are you sure you want to delete this toilet?')) return;

    try {
        const response = await fetch(`/api/admin/toilet/${id}`, {
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

// Logout Function
function logout() {
    console.log('Logging out...');
    localStorage.removeItem('token');
    token = null;
    
    // Clear any sensitive form data
    if (document.getElementById('loginPassword')) {
        document.getElementById('loginPassword').value = '';
    }
    if (document.getElementById('registerPassword')) {
        document.getElementById('registerPassword').value = '';
    }
    
    showLogin();
    console.log('Logout complete');
} 