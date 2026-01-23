import { Auth } from './auth.js';
import { API } from './api.js';
import { UI } from './ui.js';
import { MapModule } from './map.js';

// DOM Elements
const sections = {
    login: document.getElementById('loginForm'),
    dashboard: document.getElementById('adminDashboard'),
    qrCodes: document.getElementById('qrCodesSection'),
    reviews: document.getElementById('reviewsSection')
};

const navBtns = {
    dashboard: document.getElementById('showDashboardBtn'),
    reviews: document.getElementById('showReviewsBtn'),
    qrCodes: document.getElementById('showQRCodesBtn'),
    logout: document.getElementById('logoutBtn')
};

// State
let toilets = [];

/**
 * Check authentication status and redirect/show content accordingly.
 */
function checkAuth() {
    if (!Auth.isAuthenticated()) {
        showSection('login');
        if (navBtns.logout) navBtns.logout.style.display = 'none';
        document.querySelectorAll('.nav-btn').forEach(b => b.style.display = 'none');
    } else {
        showSection('dashboard');
        if (navBtns.logout) navBtns.logout.style.display = 'block';
        document.querySelectorAll('.nav-btn').forEach(b => b.style.display = 'inline-block');
        loadDashboard();
    }
}

/**
 * Switch visible section.
 * @param {string} sectionName - Key of the section to show (login, dashboard, reviews, qrCodes).
 */
function showSection(sectionName) {
    Object.values(sections).forEach(el => {
        if (el) el.style.display = 'none';
    });
    if (sections[sectionName]) sections[sectionName].style.display = 'block';

    // Update nav active state
    Object.values(navBtns).forEach(btn => {
        if(btn && btn.classList) btn.classList.remove('active');
    });
    const activeBtnKey = sectionName === 'login' ? null : sectionName;
    if (activeBtnKey && navBtns[activeBtnKey]) navBtns[activeBtnKey].classList.add('active');
}

// Login
const loginForm = document.getElementById('adminLoginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const loginBtn = e.target.querySelector('button');

        try {
            UI.showLoading(loginBtn);
            await Auth.login(email, password);
            checkAuth();
        } catch (error) {
            UI.showError('Login failed: ' + error.message, 'loginError');
        } finally {
            UI.hideLoading(loginBtn);
        }
    });
}

// Logout
if (navBtns.logout) {
    navBtns.logout.addEventListener('click', () => {
        Auth.logout();
    });
}

// Navigation
if (navBtns.dashboard) navBtns.dashboard.addEventListener('click', () => {
    showSection('dashboard');
    loadDashboard();
});

if (navBtns.reviews) navBtns.reviews.addEventListener('click', () => {
    showSection('reviews');
    loadReviews();
});

if (navBtns.qrCodes) navBtns.qrCodes.addEventListener('click', () => {
    showSection('qrCodes');
    loadQRCodes();
});

/**
 * Load dashboard data (toilets list and map).
 */
async function loadDashboard() {
    try {
        UI.showGlobalLoading('adminGlobalLoading');
        
        // Load toilets
        const data = await API.request('/api/toilet/map');
        toilets = data;
        
        renderToiletList();
        
        // Init map if not
        setTimeout(() => {
            // Re-init map logic here or rely on map module to handle singleton
            // Note: Admin map might need a different container ID, e.g. 'adminMap' vs 'map'
            // Check admin.html for container ID.
            // Earlier view showed <div id="map"> inside dashboard.
            const map = MapModule.init('map'); 
            MapModule.clearMarkers();
            
            toilets.forEach(t => {
                let lat, lng;
                if (t.coordinates) {
                    lat = t.coordinates.latitude;
                    lng = t.coordinates.longitude;
                } else if (t.location && t.location.coordinates) {
                    lng = t.location.coordinates[0];
                    lat = t.location.coordinates[1];
                }
                
                if (lat && lng) {
                    MapModule.addMarker(lat, lng, `<b>${t.name}</b>`, t.averageRating);
                }
            });
            MapModule.fitBounds();
        }, 100);

    } catch (error) {
        console.error('Dashboard load error:', error);
        UI.showError('Failed to load dashboard data');
    } finally {
        UI.hideGlobalLoading('adminGlobalLoading');
    }
}

/**
 * Render the list of toilets.
 */
function renderToiletList() {
    const list = document.getElementById('toiletList');
    if (!list) return;
    
    if (toilets.length === 0) {
        list.innerHTML = '<p class="no-reviews">No toilets found.</p>';
        return;
    }

    list.innerHTML = toilets.map(t => `
        <div class="toilet-item">
            <div class="toilet-info">
                <h3>${t.name}</h3>
                <p>${t.location.address || t.location}</p>
                <div class="rating-stars">${UI.generateStarRating(t.averageRating)} (${t.totalReviews || 0})</div>
            </div>
            <div class="toilet-actions">
                <button class="button button--edit" data-action="edit" data-id="${t.id}">Edit</button>
                <button class="button button--delete" data-action="delete" data-id="${t.id}">Delete</button>
            </div>
        </div>
    `).join('');
}

// Event Delegation for Toilet List
const toiletList = document.getElementById('toiletList');
if (toiletList) {
    toiletList.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;
        
        const action = btn.dataset.action;
        const id = btn.dataset.id;
        
        if (action === 'delete') {
            deleteToilet(id);
        } else if (action === 'edit') {
            window.editToilet(id); // Using window global for now or implement edit modal
        }
    });
}

/**
 * Delete a toilet facility.
 * @param {string} id - Toilet ID.
 */
async function deleteToilet(id) {
    if (!confirm('Are you sure?')) return;
    try {
        await API.request(`/api/toilet/${id}`, { method: 'DELETE' });
        loadDashboard();
        // UI.showError('Toilet deleted', 'dashboardError'); // Reuse error for success notification pattern
    } catch (error) {
        alert(error.message);
    }
}

// Placeholders for other sections
function loadReviews() {
    console.log('Loading reviews...');
}

function loadQRCodes() {
    console.log('Loading QR codes...');
}

// Expose globals if needed for inline onclicks (though we moved to event delegation)
window.deleteToilet = deleteToilet;

document.addEventListener('DOMContentLoaded', checkAuth);
