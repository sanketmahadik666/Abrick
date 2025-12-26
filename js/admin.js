// Enhanced admin.js for Hybrid Public/Private Toilet System
// Updated to work with modern API endpoints and hybrid functionality

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

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    if (token) {
        showDashboard();
    } else {
        showLogin();
    }
});

// Enhanced API request utility
async function makeApiRequest(endpoint, options = {}) {
    const token = localStorage.getItem('adminToken');
    const defaultHeaders = {
        'Content-Type': 'application/json',
    };

    if (token) {
        defaultHeaders['Authorization'] = `Bearer ${token}`;
    }

    try {
        console.log(`[ADMIN-API] Making request to: ${endpoint}`);
        const response = await fetch(endpoint, {
            ...options,
            headers: {
                ...defaultHeaders,
                ...options.headers,
            },
        });

        console.log(`[ADMIN-API] Response status: ${response.status}`);

        let data;
        const contentType = response.headers.get('content-type');

        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
            console.log('[ADMIN-API] Response data:', data);
        } else {
            data = await response.text();
            console.log('[ADMIN-API] Response text:', data);
        }

        if (!response.ok) {
            throw new Error((data && data.message) || data || 'API request failed');
        }

        return data;
    } catch (error) {
        console.error('[ADMIN-API] Request error:', error);
        throw error;
    }
}

// Admin Authentication - Updated for new auth endpoints
adminLoginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    console.log('[ADMIN] Attempting login with email:', email);

    try {
        const data = await makeApiRequest('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });

        if (data.token && data.user.role === 'admin') {
            console.log('[ADMIN] Login successful, saving token');
            localStorage.setItem('adminToken', data.token);
            localStorage.setItem('adminEmail', data.user.email);
            showDashboard();
        } else {
            throw new Error('Unauthorized access. Admin privileges required.');
        }
    } catch (error) {
        console.error('[ADMIN] Login failed:', error);
        const loginError = document.getElementById('loginError');
        if (loginError) {
            loginError.textContent = error.message || 'Login failed. Please check your credentials.';
            loginError.style.display = 'block';
        }
    }
});

// Admin Registration
if (adminRegisterForm) {
    adminRegisterForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('registerEmail').value.trim();
        const password = document.getElementById('registerPassword').value;

        try {
            console.log('[ADMIN] Attempting registration with email:', email);

            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();
            console.log('[ADMIN] Registration response:', data);

            if (response.ok && data.token) {
                console.log('[ADMIN] Registration successful, saving token');
                token = data.token;
                localStorage.setItem('adminToken', token);
                showDashboard();
                alert('Registration successful! You are now logged in.');
            } else {
                console.error('[ADMIN] Registration failed:', data.message);
                throw new Error(data.message || 'Registration failed');
            }
        } catch (error) {
            console.error('[ADMIN] Registration error:', error);
            alert(error.message || 'Registration failed. Please try again.');
            // Clear password field on error
            document.getElementById('registerPassword').value = '';
        }
    });
}

// Logout
if (logoutBtn) {
    logoutBtn.addEventListener('click', logout);
}

// Dashboard Functions
function showDashboard() {
    if (loginSection && dashboardSection) {
        loginSection.style.display = 'none';
        dashboardSection.style.display = 'block';
        if (dashboardContent) {
            dashboardContent.innerHTML = '<h3>Loading dashboard...</h3>';
            loadDashboard();
        }
    } else {
        console.error('[ADMIN] Dashboard or login section not found');
    }
}

function showLogin() {
    if (loginSection && dashboardSection) {
        loginSection.style.display = 'block';
        dashboardSection.style.display = 'none';
    } else {
        console.error('[ADMIN] Dashboard or login section not found');
    }
}

// Enhanced dashboard with hybrid statistics
async function loadDashboard() {
    try {
        if (!dashboardContent) return;

        dashboardContent.innerHTML = `
            <div class="dashboard-header">
                <h3>Admin Dashboard</h3>
                <p>Manage the Toilet Review System</p>
            </div>

            <div class="dashboard-stats">
                <div class="stat-card">
                    <h4>📊 Total Toilets</h4>
                    <span id="totalToilets">--</span>
                </div>
                <div class="stat-card">
                    <h4>🏛️ Public Toilets</h4>
                    <span id="publicToilets">--</span>
                </div>
                <div class="stat-card">
                    <h4>🏢 Private Toilets</h4>
                    <span id="privateToilets">--</span>
                </div>
                <div class="stat-card">
                    <h4>⭐ Total Reviews</h4>
                    <span id="totalReviews">--</span>
                </div>
            </div>

            <div class="dashboard-actions">
                <button id="addToiletBtn" class="btn">➕ Add Private Toilet</button>
                <button id="viewToiletsBtn" class="btn">📋 View All Toilets</button>
                <button id="viewReviewsBtn" class="btn">⭐ View Reviews</button>
                <button id="syncPublicBtn" class="btn">🔄 Sync Public Data</button>
            </div>
        `;

        // Reattach event listeners
        attachDashboardListeners();

        // Load statistics
        await loadDashboardStats();

    } catch (error) {
        console.error('[ADMIN] Error loading dashboard:', error);
        dashboardContent.innerHTML = '<h3>Error loading dashboard</h3><p>Please refresh the page.</p>';
    }
}

async function loadDashboardStats() {
    try {
        // Get toilet statistics
        const toiletStats = await makeApiRequest('/api/toilet/stats');

        document.getElementById('totalToilets').textContent = toiletStats.total || 0;
        document.getElementById('publicToilets').textContent = toiletStats.public || 0;
        document.getElementById('privateToilets').textContent = toiletStats.private || 0;

        // Get review statistics
        const reviewStats = await makeApiRequest('/api/reviews/stats');
        document.getElementById('totalReviews').textContent = reviewStats.totalReviews || 0;

        console.log('[ADMIN] Dashboard stats loaded successfully');

    } catch (error) {
        console.error('[ADMIN] Error loading dashboard stats:', error);
        // Set defaults
        document.getElementById('totalToilets').textContent = '0';
        document.getElementById('publicToilets').textContent = '0';
        document.getElementById('privateToilets').textContent = '0';
        document.getElementById('totalReviews').textContent = '0';
    }
}

function attachDashboardListeners() {
    // Reattach button listeners
    const addToiletBtn = document.getElementById('addToiletBtn');
    const viewToiletsBtn = document.getElementById('viewToiletsBtn');
    const viewReviewsBtn = document.getElementById('viewReviewsBtn');
    const syncPublicBtn = document.getElementById('syncPublicBtn');

    if (addToiletBtn) addToiletBtn.addEventListener('click', () => showAddToiletForm());
    if (viewToiletsBtn) viewToiletsBtn.addEventListener('click', () => loadToilets());
    if (viewReviewsBtn) viewReviewsBtn.addEventListener('click', () => loadReviews());
    if (syncPublicBtn) syncPublicBtn.addEventListener('click', () => syncPublicData());
}

// Add Toilet Form - Enhanced for hybrid system
function showAddToiletForm() {
    if (!dashboardContent) return;

    dashboardContent.innerHTML = `
        <form id="addToiletForm">
            <h3>Add New Private Toilet</h3>

            <div class="form-group">
                <label for="toiletName">Toilet Name:</label>
                <input type="text" id="toiletName" placeholder="Enter toilet name" required>
            </div>

            <div class="form-group">
                <label for="toiletLocation">Location:</label>
                <input type="text" id="toiletLocation" placeholder="Enter location address" required>
            </div>

            <div class="form-group">
                <label for="toiletDescription">Description:</label>
                <textarea id="toiletDescription" placeholder="Describe the toilet facility" rows="3"></textarea>
            </div>

            <div class="coordinates-group">
                <div class="form-group">
                    <label for="latitude">Latitude:</label>
                    <input type="number" id="latitude" step="any" placeholder="18.5204" required>
                </div>
                <div class="form-group">
                    <label for="longitude">Longitude:</label>
                    <input type="number" id="longitude" step="any" placeholder="73.8567" required>
                </div>
            </div>

            <div class="form-group">
                <label>Facilities:</label>
                <div class="facilities-checkboxes">
                    <label><input type="checkbox" name="facilities" value="handicap"> Handicap Accessible</label>
                    <label><input type="checkbox" name="facilities" value="baby_change"> Baby Change</label>
                    <label><input type="checkbox" name="facilities" value="shower"> Shower</label>
                    <label><input type="checkbox" name="facilities" value="bidet"> Bidet</label>
                    <label><input type="checkbox" name="facilities" value="paper_towel"> Paper Towel</label>
                    <label><input type="checkbox" name="facilities" value="hand_dryer"> Hand Dryer</label>
                </div>
            </div>

            <div class="form-actions">
                <button type="submit">Add Private Toilet</button>
                <button type="button" onclick="loadDashboard()">Cancel</button>
            </div>
        </form>
    `;

    document.getElementById('addToiletForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const facilities = Array.from(document.querySelectorAll('input[name="facilities"]:checked'))
            .map(checkbox => checkbox.value);

        const toiletData = {
            name: document.getElementById('toiletName').value.trim(),
            location: document.getElementById('toiletLocation').value.trim(),
            description: document.getElementById('toiletDescription').value.trim(),
            coordinates: {
                latitude: parseFloat(document.getElementById('latitude').value),
                longitude: parseFloat(document.getElementById('longitude').value)
            },
            facilities
        };

        // Validation
        if (!toiletData.name || !toiletData.location) {
            alert('Name and location are required');
            return;
        }

        if (isNaN(toiletData.coordinates.latitude) || isNaN(toiletData.coordinates.longitude)) {
            alert('Valid coordinates are required');
            return;
        }

        try {
            const data = await makeApiRequest('/api/toilet/add-private', {
                method: 'POST',
                body: JSON.stringify(toiletData)
            });

            console.log('[ADMIN] Toilet added successfully:', data);
            alert('Private toilet added successfully!');
            loadDashboard();

        } catch (error) {
            console.error('[ADMIN] Error adding toilet:', error);
            alert(error.message || 'Failed to add toilet. Please try again.');
        }
    });
}

// Enhanced toilet loading for hybrid system
async function loadToilets() {
    if (!dashboardContent) return;

    dashboardContent.innerHTML = '<div class="loading">Loading toilets...</div>';

    try {
        const toilets = await makeApiRequest('/api/toilet/map?showPublic=true&showPrivate=true');

        if (toilets.length === 0) {
            dashboardContent.innerHTML = '<h3>No toilets found</h3><p>Add some toilets to get started.</p>';
            return;
        }

        dashboardContent.innerHTML = `
            <h3>All Toilets (${toilets.length})</h3>
            <div class="toilets-grid">
                ${toilets.map(toilet => `
                    <div class="toilet-card">
                        <div class="toilet-header">
                            <h4>${toilet.name}</h4>
                            <span class="toilet-type ${toilet.type === 'public' ? 'public-badge' : 'private-badge'}">
                                ${toilet.type === 'public' ? '🏛️ Public' : '🏢 Private'}
                            </span>
                        </div>
                        <p><strong>Location:</strong> ${toilet.location}</p>
                        <p><strong>Rating:</strong> ${toilet.averageRating ? `${toilet.averageRating.toFixed(1)} ⭐` : 'No ratings'}</p>
                        <p><strong>Reviews:</strong> ${toilet.totalReviews || 0}</p>
                        ${toilet.facilities && toilet.facilities.length > 0 ?
                            `<p><strong>Facilities:</strong> ${toilet.facilities.join(', ')}</p>` : ''}
                        <div class="toilet-actions">
                            <button onclick="editToilet('${toilet.id}')">Edit</button>
                            <button onclick="deleteToilet('${toilet.id}')">Delete</button>
                        </div>
                    </div>
                `).join('')}
            </div>
            <div class="dashboard-actions">
                <button onclick="loadDashboard()">← Back to Dashboard</button>
            </div>
        `;

    } catch (error) {
        console.error('[ADMIN] Error loading toilets:', error);
        dashboardContent.innerHTML = '<h3>Error loading toilets</h3><p>Please try again.</p>';
    }
}

// Load reviews
async function loadReviews() {
    if (!dashboardContent) return;

    dashboardContent.innerHTML = '<div class="loading">Loading reviews...</div>';

    try {
        const reviews = await makeApiRequest('/api/reviews/all');

        if (reviews.length === 0) {
            dashboardContent.innerHTML = '<h3>No reviews found</h3>';
            return;
        }

        dashboardContent.innerHTML = `
            <h3>All Reviews (${reviews.length})</h3>
            <div class="reviews-grid">
                ${reviews.map(review => `
                    <div class="review-card">
                        <div class="review-header">
                            <span class="review-rating">${'★'.repeat(review.rating)}${'☆'.repeat(5-review.rating)}</span>
                            <span class="review-date">${new Date(review.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div class="review-details">
                            <p><strong>Cleanliness:</strong> ${review.cleanliness}/5</p>
                            <p><strong>Maintenance:</strong> ${review.maintenance}/5</p>
                            <p><strong>Accessibility:</strong> ${review.accessibility}/5</p>
                            ${review.comment ? `<p><strong>Comment:</strong> ${review.comment}</p>` : ''}
                        </div>
                        <div class="review-actions">
                            <button onclick="deleteReview('${review.id}')">Delete Review</button>
                        </div>
                    </div>
                `).join('')}
            </div>
            <div class="dashboard-actions">
                <button onclick="loadDashboard()">← Back to Dashboard</button>
            </div>
        `;

    } catch (error) {
        console.error('[ADMIN] Error loading reviews:', error);
        dashboardContent.innerHTML = '<h3>Error loading reviews</h3><p>Please try again.</p>';
    }
}

// Sync public toilet data
async function syncPublicData() {
    try {
        const syncBtn = document.getElementById('syncPublicBtn');
        const originalText = syncBtn.textContent;
        syncBtn.textContent = '🔄 Syncing...';
        syncBtn.disabled = true;

        console.log('[ADMIN] Starting public data sync...');

        const result = await makeApiRequest('/api/toilet/sync-public', {
            method: 'POST',
            body: JSON.stringify({
                bounds: '((18.4,73.8,18.6,73.9))', // Sample bounds for Mumbai area
                sources: ['osm', 'government']
            })
        });

        console.log('[ADMIN] Sync completed:', result);
        alert(`Successfully synced ${result.synced} new public toilets!`);

        // Reload dashboard to show updated stats
        loadDashboard();

    } catch (error) {
        console.error('[ADMIN] Error syncing public data:', error);
        alert('Failed to sync public toilet data. Please try again.');
    } finally {
        const syncBtn = document.getElementById('syncPublicBtn');
        syncBtn.textContent = '🔄 Sync Public Data';
        syncBtn.disabled = false;
    }
}

// Edit toilet
async function editToilet(id) {
    try {
        const toilet = await makeApiRequest(`/api/toilet/${id}`);
        if (!dashboardContent) return;

        dashboardContent.innerHTML = `
            <form id="editToiletForm">
                <h3>Edit Toilet</h3>

                <div class="form-group">
                    <label for="editToiletName">Toilet Name:</label>
                    <input type="text" id="editToiletName" value="${toilet.name}" required>
                </div>

                <div class="form-group">
                    <label for="editToiletLocation">Location:</label>
                    <input type="text" id="editToiletLocation" value="${toilet.location}" required>
                </div>

                <div class="form-group">
                    <label for="editToiletDescription">Description:</label>
                    <textarea id="editToiletDescription" rows="3">${toilet.description || ''}</textarea>
                </div>

                <div class="coordinates-group">
                    <div class="form-group">
                        <label for="editLatitude">Latitude:</label>
                        <input type="number" id="editLatitude" value="${toilet.coordinates.latitude}" step="any" required>
                    </div>
                    <div class="form-group">
                        <label for="editLongitude">Longitude:</label>
                        <input type="number" id="editLongitude" value="${toilet.coordinates.longitude}" step="any" required>
                    </div>
                </div>

                <div class="form-group">
                    <label>Facilities:</label>
                    <div class="facilities-checkboxes">
                        ${['handicap', 'baby_change', 'shower', 'bidet', 'paper_towel', 'hand_dryer'].map(facility => `
                            <label>
                                <input type="checkbox" name="editFacilities" value="${facility}"
                                    ${toilet.facilities && toilet.facilities.includes(facility) ? 'checked' : ''}>
                                ${facility.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </label>
                        `).join('')}
                    </div>
                </div>

                <div class="form-actions">
                    <button type="submit">Update Toilet</button>
                    <button type="button" onclick="loadToilets()">Cancel</button>
                </div>
            </form>
        `;

        document.getElementById('editToiletForm').addEventListener('submit', async (e) => {
            e.preventDefault();

            const facilities = Array.from(document.querySelectorAll('input[name="editFacilities"]:checked'))
                .map(checkbox => checkbox.value);

            const toiletData = {
                name: document.getElementById('editToiletName').value.trim(),
                location: document.getElementById('editToiletLocation').value.trim(),
                description: document.getElementById('editToiletDescription').value.trim(),
                coordinates: {
                    latitude: parseFloat(document.getElementById('editLatitude').value),
                    longitude: parseFloat(document.getElementById('editLongitude').value)
                },
                facilities
            };

            try {
                await makeApiRequest(`/api/toilet/${id}`, {
                    method: 'PUT',
                    body: JSON.stringify(toiletData)
                });

                alert('Toilet updated successfully!');
                loadToilets();

            } catch (error) {
                console.error('[ADMIN] Error updating toilet:', error);
                alert(error.message || 'Failed to update toilet. Please try again.');
            }
        });

    } catch (error) {
        console.error('[ADMIN] Error loading toilet details:', error);
        alert('Failed to load toilet details. Please try again.');
    }
}

// Delete toilet
async function deleteToilet(id) {
    if (!confirm('Are you sure you want to delete this toilet? This action cannot be undone.')) return;

    try {
        await makeApiRequest(`/api/toilet/${id}`, {
            method: 'DELETE'
        });

        alert('Toilet deleted successfully!');
        loadToilets();

    } catch (error) {
        console.error('[ADMIN] Error deleting toilet:', error);
        alert(error.message || 'Failed to delete toilet. Please try again.');
    }
}

// Delete review
async function deleteReview(id) {
    if (!confirm('Are you sure you want to delete this review?')) return;

    try {
        await makeApiRequest(`/api/reviews/${id}`, {
            method: 'DELETE'
        });

        alert('Review deleted successfully!');
        loadReviews();

    } catch (error) {
        console.error('[ADMIN] Error deleting review:', error);
        alert(error.message || 'Failed to delete review. Please try again.');
    }
}

// Logout Function
function logout() {
    console.log('[ADMIN] Logging out...');
    localStorage.removeItem('adminToken');
    token = null;

    // Clear any sensitive form data
    const passwordField = document.getElementById('password');
    if (passwordField) passwordField.value = '';

    showLogin();
    console.log('[ADMIN] Logout complete');
}

// Initialize dashboard listeners on page load
document.addEventListener('DOMContentLoaded', () => {
    // Attach initial dashboard listeners if dashboard is shown
    if (token && dashboardSection && dashboardSection.style.display !== 'none') {
        attachDashboardListeners();
    }
});
