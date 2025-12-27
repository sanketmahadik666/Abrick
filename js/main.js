// Enhanced main.js for Hybrid Public/Private Toilet System
// Compatible with modern responsive design and API architecture

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

// Map and filter elements
const showPublicToilets = document.getElementById('showPublicToilets');
const showPrivateToilets = document.getElementById('showPrivateToilets');
const syncPublicDataBtn = document.querySelector('button[onclick="syncPublicData()"]');

// Global state
let currentToiletId = null;
let token = localStorage.getItem('adminToken');
let map = null;
let markers = L.markerClusterGroup();
let currentFilters = {
    showPublic: true,
    showPrivate: true
};

// Initialize map
function initializeMap() {
    if (!document.getElementById('map')) {
        console.warn('Map container not found, skipping map initialization');
        return;
    }

    console.log('[MAP] Initializing map...');

    map = L.map('map', {
        center: [18.5204, 73.8567],
        zoom: 13,
        minZoom: 3,
        maxZoom: 18,
        zoomControl: true,
        preferCanvas: true,
        zoomAnimation: true,
        markerZoomAnimation: true
    });

    // Add tile layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '©OpenStreetMap, ©CartoDB',
        subdomains: 'abcd',
        maxZoom: 19,
        updateWhenIdle: true,
        keepBuffer: 2
    }).addTo(map);

    console.log('[MAP] Map initialized successfully');
}

// Navigation functions
function showSection(section) {
    [homeSection, adminLoginSection, adminDashboardSection, reviewFormSection].forEach(s => {
        if (s) s.style.display = 'none';
    });
    if (section) section.style.display = 'block';
}

// Event listeners for navigation
if (homeLink) {
    homeLink.addEventListener('click', (e) => {
        e.preventDefault();
        showSection(homeSection);
        if (token) {
            if (adminDashboardLink) adminDashboardLink.style.display = 'inline';
        }
    });
}

if (adminLoginLink) {
    adminLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        showSection(adminLoginSection);
    });
}

if (adminDashboardLink) {
    adminDashboardLink.addEventListener('click', (e) => {
        e.preventDefault();
        showSection(adminDashboardSection);
        loadDashboard();
    });
}

// Admin Authentication
if (adminLoginForm) {
    adminLoginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email')?.value;
        const password = document.getElementById('password')?.value;

        if (!email || !password) {
            alert('Email and password are required');
            return;
        }

        try {
            const response = await fetch('/api/admin/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();
            if (response.ok && data.token) {
                token = data.token;
                localStorage.setItem('adminToken', token);
                if (adminDashboardLink) adminDashboardLink.style.display = 'inline';
                showSection(adminDashboardSection);
                loadDashboard();
            } else {
                alert(data.message || 'Login failed');
            }
        } catch (error) {
            console.error('[AUTH] Login error:', error);
            alert('Login failed. Please try again.');
        }
    });
}

// Logout
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        token = null;
        localStorage.removeItem('adminToken');
        if (adminDashboardLink) adminDashboardLink.style.display = 'none';
        showSection(homeSection);
    });
}

// Dashboard functions
async function loadDashboard() {
    const dashboardContent = document.getElementById('dashboardContent');
    if (dashboardContent) {
        dashboardContent.innerHTML = `
            <div class="dashboard-welcome">
                <h3>Admin Dashboard</h3>
                <p>Welcome to the Toilet Review System administration panel.</p>
                <div class="dashboard-stats">
                    <div class="stat-card">
                        <h4>Total Toilets</h4>
                        <span id="totalToilets">--</span>
                    </div>
                    <div class="stat-card">
                        <h4>Public Toilets</h4>
                        <span id="publicToilets">--</span>
                    </div>
                    <div class="stat-card">
                        <h4>Private Toilets</h4>
                        <span id="privateToilets">--</span>
                    </div>
                </div>
            </div>
        `;

        // Load statistics
        loadDashboardStats();
    }
}

async function loadDashboardStats() {
    try {
        const response = await fetch('/api/toilet/stats');
        if (response.ok) {
            const stats = await response.json();
            document.getElementById('totalToilets').textContent = stats.total || 0;
            document.getElementById('publicToilets').textContent = stats.public || 0;
            document.getElementById('privateToilets').textContent = stats.private || 0;
        }
    } catch (error) {
        console.error('[STATS] Error loading dashboard stats:', error);
    }
}

// Add toilet functionality
if (addToiletBtn) {
    addToiletBtn.addEventListener('click', () => {
        const dashboardContent = document.getElementById('dashboardContent');
        if (dashboardContent) {
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
                        <div class="facilities-group">
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
                    const response = await fetch('/api/toilet/add-private', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify(toiletData)
                    });

                    const data = await response.json();
                    if (response.ok) {
                        alert('Private toilet added successfully!');
                        loadDashboard();
                    } else {
                        alert(data.message || 'Failed to add toilet');
                    }
                } catch (error) {
                    console.error('[TOILET] Error adding toilet:', error);
                    alert('Failed to add toilet. Please try again.');
                }
            });
        }
    });
}

// View toilets
if (viewToiletsBtn) {
    viewToiletsBtn.addEventListener('click', loadToilets);
}

// View reviews
if (viewReviewsBtn) {
    viewReviewsBtn.addEventListener('click', loadReviews);
}

// Enhanced toilet loading with hybrid support
async function loadToilets() {
    const dashboardContent = document.getElementById('dashboardContent');
    if (!dashboardContent) return;

    dashboardContent.innerHTML = '<div class="loading">Loading toilets...</div>';

    try {
        const response = await fetch('/api/toilet/map?showPublic=true&showPrivate=true');
        if (!response.ok) {
            throw new Error('Failed to fetch toilets');
        }

        const responseData = await response.json();
        const toilets = responseData.success ? responseData.data : responseData;

        if (toilets.length === 0) {
            dashboardContent.innerHTML = '<p>No toilets found. Add some toilets to get started.</p>';
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
        `;

    } catch (error) {
        console.error('[TOILETS] Error loading toilets:', error);
        dashboardContent.innerHTML = '<p>Error loading toilets. Please try again.</p>';
    }
}

// Load reviews
async function loadReviews() {
    const dashboardContent = document.getElementById('dashboardContent');
    if (!dashboardContent) return;

    dashboardContent.innerHTML = '<div class="loading">Loading reviews...</div>';

    try {
        const response = await fetch('/api/reviews/all');
        if (!response.ok) {
            throw new Error('Failed to fetch reviews');
        }

        const reviews = await response.json();

        if (reviews.length === 0) {
            dashboardContent.innerHTML = '<p>No reviews found.</p>';
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
        `;

    } catch (error) {
        console.error('[REVIEWS] Error loading reviews:', error);
        dashboardContent.innerHTML = '<p>Error loading reviews. Please try again.</p>';
    }
}

// Edit toilet
async function editToilet(id) {
    try {
        const response = await fetch(`/api/toilet/${id}`);
        if (!response.ok) {
            throw new Error('Failed to fetch toilet details');
        }

        const toilet = await response.json();
        const dashboardContent = document.getElementById('dashboardContent');

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
                    <div class="facilities-group">
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
                const response = await fetch(`/api/toilet/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(toiletData)
                });

                if (response.ok) {
                    alert('Toilet updated successfully!');
                    loadToilets();
                } else {
                    const data = await response.json();
                    alert(data.message || 'Failed to update toilet');
                }
            } catch (error) {
                console.error('[TOILET] Error updating toilet:', error);
                alert('Failed to update toilet. Please try again.');
            }
        });

    } catch (error) {
        console.error('[TOILET] Error loading toilet details:', error);
        alert('Failed to load toilet details. Please try again.');
    }
}

// Delete toilet
async function deleteToilet(id) {
    if (!confirm('Are you sure you want to delete this toilet? This action cannot be undone.')) return;

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
            alert(data.message || 'Failed to delete toilet');
        }
    } catch (error) {
        console.error('[TOILET] Error deleting toilet:', error);
        alert('Failed to delete toilet. Please try again.');
    }
}

// Delete review
async function deleteReview(id) {
    if (!confirm('Are you sure you want to delete this review?')) return;

    try {
        const response = await fetch(`/api/reviews/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            alert('Review deleted successfully!');
            loadReviews();
        } else {
            const data = await response.json();
            alert(data.message || 'Failed to delete review');
        }
    } catch (error) {
        console.error('[REVIEW] Error deleting review:', error);
        alert('Failed to delete review. Please try again.');
    }
}

// Update toilet filters and reload map
function updateToiletFilters() {
    console.log('[FILTER] Updating toilet filters');
    if (map) {
        loadToiletsToMap();
    }
}

// Sync public toilet data
async function syncPublicData() {
    try {
        const syncButton = document.querySelector('button[onclick="syncPublicData()"]');
        const originalText = syncButton.textContent;
        syncButton.textContent = '🔄 Syncing...';
        syncButton.disabled = true;

        const response = await fetch('/api/toilet/sync-public', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                bounds: '((18.4,73.8,18.6,73.9))',
                sources: ['osm', 'government']
            })
        });

        if (!response.ok) {
            throw new Error(`Sync failed: ${response.status}`);
        }

        const result = await response.json();
        console.log('[SYNC] Sync completed:', result);

        // Reload toilets to show new data
        if (map) {
            loadToiletsToMap();
        }

        alert(`Successfully synced ${result.synced} new public toilets!`);

    } catch (error) {
        console.error('[SYNC] Error syncing public data:', error);
        alert('Failed to sync public toilet data. Please try again.');
    } finally {
        const syncButton = document.querySelector('button[onclick="syncPublicData()"]');
        syncButton.textContent = '🔄 Sync Public Data';
        syncButton.disabled = false;
    }
}

// Global variables for zoom-based loading and clustering
let currentBounds = null;
let isLoadingData = false;
let loadTimeout = null;
let loadedBounds = new Set(); // Track loaded areas to prevent duplicate loading
let markerClusters = L.markerClusterGroup({
    chunkedLoading: true,
    chunkSize: 100, // Process markers in chunks for performance
    maxClusterRadius: 50, // Cluster radius in pixels
    spiderfyOnMaxZoom: true,
    showCoverageOnHover: false,
    zoomToBoundsOnClick: true,
    removeOutsideVisibleBounds: true, // Performance optimization
    animate: false // Disable animations for better performance with large datasets
});

// Load toilets to map (separate from dashboard loading)
async function loadToiletsToMap(forceReload = false) {
    if (!map || isLoadingData) return;

    try {
        isLoadingData = true;
        console.log('[MAP] Loading toilets for map display...');

        const bounds = map.getBounds();
        const boundsKey = `${bounds.getSouth().toFixed(4)}_${bounds.getWest().toFixed(4)}_${bounds.getNorth().toFixed(4)}_${bounds.getEast().toFixed(4)}`;

        // Check if we've already loaded this area (unless force reload)
        if (!forceReload && loadedBounds.has(boundsKey)) {
            console.log('[MAP] Area already loaded, skipping...');
            isLoadingData = false;
            return;
        }

        // Clear existing markers only if force reload or significant bounds change
        if (forceReload || !currentBounds || !bounds.intersects(currentBounds)) {
            markers.clearLayers();
            loadedBounds.clear(); // Reset loaded areas on major bounds change
        }

        // Get filter preferences
        const showPublic = showPublicToilets?.checked ?? true;
        const showPrivate = showPrivateToilets?.checked ?? true;

        console.log(`[MAP] Filters - Public: ${showPublic}, Private: ${showPrivate}`);

        // Build query parameters
        const params = new URLSearchParams({
            showPublic: showPublic.toString(),
            showPrivate: showPrivate.toString()
        });

        // Add map bounds for potential public data sync
        const boundsString = `${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()}`;
        params.append('bounds', boundsString);

        // Show loading indicator
        showMapLoadingIndicator();

        const response = await fetch(`/api/toilet/map?${params}`);
        if (!response.ok) {
            throw new Error('Failed to fetch toilets');
        }

        const responseData = await response.json();
        const toilets = responseData.success ? responseData.data : responseData; // Handle both old and new response formats
        console.log(`[MAP] Loaded ${toilets.length} toilets for map display`);

        // Add markers with different styling for public vs private
        let newMarkersAdded = 0;
        toilets.forEach((toilet) => {
            if (!toilet.coordinates?.latitude || !toilet.coordinates?.longitude) {
                console.warn(`[MAP] Invalid coordinates for toilet ${toilet.id}`);
                return;
            }

            // Check if marker already exists for this toilet
            const existingMarker = markers.getLayers().find(marker =>
                marker.toiletId === toilet.id
            );

            if (!existingMarker) {
                const marker = createToiletMarker(toilet);
                markers.addLayer(marker);
                newMarkersAdded++;
            }
        });

        console.log(`[MAP] Added ${newMarkersAdded} new markers`);

        // Only add layer if not already added
        if (!map.hasLayer(markers)) {
            map.addLayer(markers);
        }

        // Mark this area as loaded
        loadedBounds.add(boundsKey);
        currentBounds = bounds;

        // Update map stats
        updateMapStats(toilets);

        // Trigger public data sync for new areas (background)
        triggerPublicDataSync(boundsString);

    } catch (error) {
        console.error('[MAP] Error loading toilets:', error);
        // Don't show alert for automatic loads, only for manual triggers
        if (forceReload) {
            alert('Failed to load toilets on map. Please try again.');
        }
    } finally {
        isLoadingData = false;
        hideMapLoadingIndicator();
    }
}

// Show loading indicator on map
function showMapLoadingIndicator() {
    let indicator = document.getElementById('map-loading-indicator');
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'map-loading-indicator';
        indicator.innerHTML = `
            <div style="
                position: absolute;
                top: 10px;
                right: 10px;
                background: rgba(255, 255, 255, 0.9);
                padding: 8px 12px;
                border-radius: 4px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                z-index: 1000;
                font-size: 12px;
                color: #666;
            ">
                <div style="
                    display: inline-block;
                    width: 12px;
                    height: 12px;
                    border: 2px solid #f3f3f3;
                    border-top: 2px solid #007bff;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin-right: 8px;
                "></div>
                Loading toilets...
            </div>
        `;
        document.getElementById('map').appendChild(indicator);
    }
    indicator.style.display = 'block';
}

// Hide loading indicator
function hideMapLoadingIndicator() {
    const indicator = document.getElementById('map-loading-indicator');
    if (indicator) {
        indicator.style.display = 'none';
    }
}

// Trigger public data sync in background
async function triggerPublicDataSync(boundsString) {
    try {
        // Debounce the sync requests
        if (loadTimeout) {
            clearTimeout(loadTimeout);
        }

        loadTimeout = setTimeout(async () => {
            console.log('[MAP] Triggering background public data sync...');

            // Extract city from bounds (rough approximation)
            const bounds = boundsString.split(',').map(Number);
            const centerLat = (bounds[0] + bounds[2]) / 2; // Average lat
            const centerLng = (bounds[1] + bounds[3]) / 2; // Average lng

            let city = 'mumbai'; // Default
            if (centerLat > 28 && centerLng > 77) {
                city = 'delhi';
            } else if (centerLat > 12 && centerLat < 14 && centerLng > 77 && centerLng < 81) {
                city = 'bangalore';
            } else if (centerLat > 12 && centerLat < 14 && centerLng > 79 && centerLng < 81) {
                city = 'chennai';
            } else if (centerLat > 18 && centerLat < 19 && centerLng > 73 && centerLng < 74) {
                city = 'pune';
            }

            const response = await fetch('/api/toilet/sync-public', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : undefined
                },
                body: JSON.stringify({
                    bounds: boundsString,
                    sources: ['osm', 'government'],
                    city: city
                })
            });

            if (response.ok) {
                const result = await response.json();
                if (result.synced > 0) {
                    console.log(`[MAP] Background sync added ${result.synced} new toilets`);
                    // Reload map to show new data
                    setTimeout(() => loadToiletsToMap(true), 1000);
                }
            }
        }, 2000); // Wait 2 seconds after user stops moving/zooming

    } catch (error) {
        console.log('[MAP] Background sync failed:', error.message);
    }
}

// Enhanced map event handlers for zoom-based loading
function setupMapEventHandlers() {
    if (!map) return;

    // Debounced function to prevent excessive API calls
    let moveTimeout;
    const debouncedLoad = () => {
        if (moveTimeout) {
            clearTimeout(moveTimeout);
        }
        moveTimeout = setTimeout(() => {
            loadToiletsToMap();
        }, 500); // Wait 500ms after user stops moving
    };

    // Map move events (drag, pan)
    map.on('moveend', () => {
        console.log('[MAP] Map moved, checking for new data...');
        debouncedLoad();
    });

    // Zoom events
    map.on('zoomend', () => {
        console.log('[MAP] Map zoomed, checking for new data...');
        debouncedLoad();
    });

    // Initial load
    map.on('load', () => {
        console.log('[MAP] Map loaded, performing initial data load...');
        loadToiletsToMap(true);
    });

    console.log('[MAP] Map event handlers set up for dynamic loading');
}

// Create marker for toilet with appropriate styling
function createToiletMarker(toilet) {
    const isPublic = toilet.type === 'public';

    // Different colors for public vs private
    const markerColor = isPublic ? '#2196F3' : '#9C27B0'; // Blue for public, purple for private
    const markerRadius = isPublic ? 8 : 10;

    const marker = L.circleMarker(
        [toilet.coordinates.latitude, toilet.coordinates.longitude],
        {
            radius: markerRadius,
            fillColor: getMarkerColor(toilet.averageRating),
            color: markerColor,
            weight: isPublic ? 2 : 3,
            opacity: 1,
            fillOpacity: 0.9,
            className: `toilet-marker ${isPublic ? 'public-toilet' : 'private-toilet'}`
        }
    );

    // Create popup content
    const popupContent = createPopupContent(toilet);
    marker.bindPopup(popupContent);

    return marker;
}

// Create popup content based on toilet type
function createPopupContent(toilet) {
    const isPublic = toilet.type === 'public';

    return `
        <div class="toilet-popup ${isPublic ? 'public-popup' : 'private-popup'}">
            <h3>${toilet.name}</h3>
            <div class="toilet-type ${isPublic ? 'public-badge' : 'private-badge'}">
                ${isPublic ? '🏛️ Public Facility' : '🏢 Private Toilet'}
            </div>
            <p>${toilet.location}</p>
            ${toilet.description ? `<p>${toilet.description}</p>` : ''}

            ${isPublic ? `
                <div class="public-notice">
                    ℹ️ Public facility - General information only
                </div>
            ` : `
                <div class="rating">
                    <span class="rating-stars">${getStarRating(toilet.averageRating)}</span>
                    <span>(${toilet.averageRating ? toilet.averageRating.toFixed(1) : 'No'} / 5)</span>
                </div>
                <p>Total Reviews: ${toilet.totalReviews || 0}</p>
            `}

            ${toilet.facilities && toilet.facilities.length > 0 ? `
                <p>Facilities: ${toilet.facilities.map(f => f.replace('_', ' ')).join(', ')}</p>
            ` : ''}

            ${!isPublic ? `<button onclick="reviewToilet('${toilet.id}')">Write Review</button>` : ''}
        </div>
    `;
}

// Helper function to get marker color based on rating
function getMarkerColor(rating) {
    if (!rating) return '#808080'; // Grey for no rating
    if (rating >= 4) return '#4CAF50'; // Green for high rating
    if (rating >= 3) return '#FFC107'; // Yellow for medium rating
    return '#F44336'; // Red for low rating
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

// Update map statistics
function updateMapStats(toilets) {
    const statsContent = document.getElementById('map-stats-content');
    if (!statsContent) return;

    if (!toilets || toilets.length === 0) {
        statsContent.innerHTML = '<p>No toilets available</p>';
        return;
    }

    const totalToilets = toilets.length;
    const avgRating = toilets.reduce((sum, t) => sum + (t.averageRating || 0), 0) / totalToilets;
    const highRated = toilets.filter(t => t.averageRating >= 4).length;
    const reviewedToilets = toilets.filter(t => t.totalReviews > 0).length;

    statsContent.innerHTML = `
        <p>Total Toilets: ${totalToilets}</p>
        <p>Average Rating: ${avgRating.toFixed(1)} ⭐</p>
        <p>High Rated (4+): ${highRated}</p>
        <p>Reviewed: ${reviewedToilets}/${totalToilets}</p>
    `;
}

// Placeholder function for reviewing private toilets
function reviewToilet(toiletId) {
    alert(`Review functionality for toilet ${toiletId} would open here.\n\nIn a full implementation, this would redirect to the review page or open a review modal.`);
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('[MAIN] Initializing main.js...');

    // Initialize map if container exists
    if (document.getElementById('map')) {
        initializeMap();

        // Set up filter listeners
        if (showPublicToilets) {
            showPublicToilets.addEventListener('change', updateToiletFilters);
        }
        if (showPrivateToilets) {
            showPrivateToilets.addEventListener('change', updateToiletFilters);
        }

        // Load toilets when map is ready and set up event handlers
        if (map) {
            map.whenReady(() => {
                loadToiletsToMap(true); // Force initial load
                setupMapEventHandlers(); // Set up zoom/drag loading
            });
        }
    }

    // Show appropriate section based on authentication
    if (token) {
        if (adminDashboardLink) adminDashboardLink.style.display = 'inline';
    }

    console.log('[MAIN] Initialization complete');
});
