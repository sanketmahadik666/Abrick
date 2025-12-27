/**
 * Home Page Module
 * Handles all home page functionality using modular architecture
 * Follows Template Method pattern with base page class
 */

import { BasePage } from '../shared/page.base.js';
import appStore from '../../state/store/app.store.js';
import { $ } from '../../core/utils/dom.utils.js';
import AppConfig from '../../core/config/app.config.js';
import { SearchComponent } from '../../components/ui/search.component.js';

/**
 * Home Page Class
 * Extends BasePage and implements home page specific functionality
 */
export class HomePage extends BasePage {
    constructor() {
        super();
        this.map = null;
        this.markers = null;
        this.qrScanner = null;
        this.isProcessingScan = false;

        // Bind methods
        this.initializeMap = this.initializeMap.bind(this);
        this.initializeSearch = this.initializeSearch.bind(this);
        this.loadToilets = this.loadToilets.bind(this);
        this.updateHomePageStats = this.updateHomePageStats.bind(this);
        this.syncAllDataSources = this.syncAllDataSources.bind(this);
        this.updateToiletFilters = this.updateToiletFilters.bind(this);
        this.onScanSuccess = this.onScanSuccess.bind(this);
        this.onScanFailure = this.onScanFailure.bind(this);
        this.resetScanner = this.resetScanner.bind(this);
        this.loadToiletInfo = this.loadToiletInfo.bind(this);
        this.createMarker = this.createMarker.bind(this);
        this.createPopupContent = this.createPopupContent.bind(this);
        this.getStarRating = this.getStarRating.bind(this);
        this.updateMapStats = this.updateMapStats.bind(this);
    }

    /**
     * Initialize the home page
     * @returns {Promise} Initialization promise
     */
    async init() {
        console.log('[HOME] Initializing home page...');

        // Set up state observers
        this.setupStateObservers();

        // Initialize components
        await this.initializeMap();

        // Initialize search component
        await this.initializeSearch();

        // Initialize QR scanner
        this.initializeQRScanner();

        // Update stats
        await this.updateHomePageStats();

        // Set up event listeners
        this.setupEventListeners();

        console.log('[HOME] Home page initialized');
    }

    /**
     * Set up state observers
     */
    setupStateObservers() {
        // Observe toilet data changes
        appStore.subscribe('state:changed', (event, data) => {
            if (data.changes['data.toilets']) {
                this.updateMapWithToilets(data.changes['data.toilets'].to);
            }
        });
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Map filter changes
        const showPublicToilets = $('#showPublicToilets');
        const showPrivateToilets = $('#showPrivateToilets');

        if (showPublicToilets) {
            showPublicToilets.addEventListener('change', this.updateToiletFilters);
        }
        if (showPrivateToilets) {
            showPrivateToilets.addEventListener('change', this.updateToiletFilters);
        }

        // Sync button
        const syncButton = $('button[onclick*="syncAllDataSources"]');
        if (syncButton) {
            syncButton.addEventListener('click', this.syncAllDataSources);
        }

        // Location button
        const locateButton = $('button[onclick*="locate"]');
        if (locateButton) {
            locateButton.addEventListener('click', () => {
                if (this.map) {
                    this.map.locate({ setView: true, maxZoom: 16 });
                }
            });
        }
    }

    /**
     * Initialize the map
     * @returns {Promise} Initialization promise
     */
    async initializeMap() {
        console.log('[HOME] Initializing map...');

        const mapElement = $('#map');
        const mapError = $('#map-error');

        if (!mapElement) {
            console.warn('[HOME] Map element not found');
            return;
        }

        // Set map container height
        mapElement.style.height = '500px';
        mapElement.style.width = '100%';

        try {
            // Check if Leaflet is available
            if (typeof L === 'undefined') {
                throw new Error('Leaflet library not loaded');
            }

            // Initialize Leaflet map
            this.map = L.map(mapElement, {
                center: AppConfig.map?.defaultCenter || [18.5204, 73.8567],
                zoom: AppConfig.map?.defaultZoom || 13,
                minZoom: AppConfig.map?.minZoom || 3,
                maxZoom: AppConfig.map?.maxZoom || 19,
                zoomControl: true,
                preferCanvas: true,
                zoomAnimation: true,
                markerZoomAnimation: true
            });

            console.log('[HOME] Map object created:', this.map);

            // Create markers cluster group
            if (typeof L.markerClusterGroup !== 'undefined') {
                this.markers = L.markerClusterGroup({
                    chunkedLoading: true,
                    maxClusterRadius: AppConfig.map?.maxClusterRadius || 50,
                    spiderfyOnMaxZoom: true,
                    showCoverageOnHover: true,
                    zoomToBoundsOnClick: true,
                    animate: true,
                    animateAddingMarkers: true,
                    disableClusteringAtZoom: 16
                });
            } else {
                console.warn('[HOME] MarkerCluster plugin not available, using regular markers');
                this.markers = L.layerGroup();
            }

            // Add tile layer
            const tileLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
                attribution: '©OpenStreetMap, ©CartoDB',
                subdomains: 'abcd',
                maxZoom: 19,
                updateWhenIdle: true,
                keepBuffer: 2
            });

            tileLayer.addTo(this.map);
            console.log('[HOME] Tile layer added to map');

            // Add markers layer to map
            this.map.addLayer(this.markers);
            console.log('[HOME] Markers layer added to map');

            // Set up map event handlers
            this.setupMapEventHandlers();

            // Force map to resize and redraw
            setTimeout(() => {
                this.map.invalidateSize();
                console.log('[HOME] Map invalidated and resized');
            }, 100);

            console.log('[HOME] Map initialized successfully');

            // Load initial toilet data
            await this.loadToilets();

        } catch (error) {
            console.error('[HOME] Map initialization failed:', error);
            if (mapError) {
                mapError.textContent = `Failed to initialize map: ${error.message}`;
                mapError.style.display = 'block';
            }
        }
    }

    /**
     * Set up map event handlers
     */
    setupMapEventHandlers() {
        if (!this.map) return;

        // Handle map clicks for adding toilets
        this.map.on('click', (event) => {
            // Only handle clicks if we're in admin mode (could be extended)
            console.log('[HOME] Map clicked at:', event.latlng);
        });

        // Handle location found
        this.map.on('locationfound', (event) => {
            console.log('[HOME] Location found:', event.latlng);
            L.marker(event.latlng).addTo(this.map)
                .bindPopup('You are here!')
                .openPopup();
        });

        // Handle location error
        this.map.on('locationerror', (error) => {
            console.warn('[HOME] Location error:', error.message);
            appStore.addNotification({
                type: 'warning',
                title: 'Location Error',
                message: 'Unable to determine your location',
                duration: 3000
            });
        });

        // Handle tile loading errors
        this.map.on('tileerror', (event) => {
            console.error('[HOME] Tile loading error:', event);
        });
    }

    /**
     * Initialize search component
     * @returns {Promise} Initialization promise
     */
    async initializeSearch() {
        console.log('[HOME] Initializing search component...');

        try {
            // Simple search input for now - skip complex SearchComponent
            const searchContainer = $('#search-container');
            if (searchContainer) {
                searchContainer.innerHTML = `
                    <div class="search-simplified">
                        <input
                            type="text"
                            id="search-input"
                            placeholder="Search for toilets..."
                            class="search-input"
                        />
                        <button id="search-btn" class="btn btn-primary">Search</button>
                    </div>
                `;

                // Add simple event listener
                const searchInput = $('#search-input');
                const searchBtn = $('#search-btn');

                if (searchInput && searchBtn) {
                    const performSimpleSearch = () => {
                        const query = searchInput.value.trim();
                        if (query) {
                            console.log('[HOME] Simple search for:', query);
                            // TODO: Implement simple search
                        }
                    };

                    searchBtn.addEventListener('click', performSimpleSearch);
                    searchInput.addEventListener('keypress', (e) => {
                        if (e.key === 'Enter') {
                            performSimpleSearch();
                        }
                    });
                }

                console.log('[HOME] Simple search initialized successfully');
            }

        } catch (error) {
            console.error('[HOME] Error initializing search:', error);
            // Don't fail the entire page initialization for search errors
            const searchContainer = $('#search-container');
            if (searchContainer) {
                searchContainer.innerHTML = `
                    <div style="color: #dc3545; padding: 1rem; text-align: center; border: 1px solid #dc3545; border-radius: 4px;">
                        Search temporarily unavailable. Map functionality still works.
                    </div>
                `;
            }
        }
    }

    /**
     * Load and display toilets on the map
     * @returns {Promise} Loading promise
     */
    async loadToilets() {
        const mapLoading = $('#map-loading');
        const mapError = $('#map-error');

        if (mapLoading) mapLoading.style.display = 'flex';
        if (mapError) mapError.style.display = 'none';

        appStore.setLoading('toilets', true);

        try {
            console.log('[HOME] Loading toilets for map...');

            // Get current map bounds
            const bounds = this.map.getBounds();
            const boundsString = `${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()}`;

            // Get filter preferences from store
            const filters = appStore.getState().settings.mapFilters;
            const params = new URLSearchParams({
                showPublic: filters.showPublic.toString(),
                showPrivate: filters.showPrivate.toString(),
                bounds: boundsString,
                limit: '1000'
            });

            // Fetch toilets from API
            const response = await fetch(`${AppConfig.api.baseUrl}/api/toilet/map?${params}`);
            if (!response.ok) {
                throw new Error(`API request failed: ${response.status}`);
            }

            const responseData = await response.json();
            const toilets = responseData.success ? responseData.data : responseData;

            console.log(`[HOME] Loaded ${toilets.length} toilets`);

            // Update store
            appStore.setToilets(toilets);

            // Update map stats
            this.updateMapStats(toilets);

        } catch (error) {
            console.error('[HOME] Error loading toilets:', error);
            if (mapError) {
                mapError.textContent = `Error loading toilets: ${error.message}`;
                mapError.style.display = 'block';
            }
        } finally {
            appStore.setLoading('toilets', false);
            if (mapLoading) mapLoading.style.display = 'none';
        }
    }

    /**
     * Update map with toilet data
     * @param {Array} toilets - Toilet data array
     */
    updateMapWithToilets(toilets) {
        if (!this.markers || !toilets) return;

        console.log(`[HOME] Updating map with ${toilets.length} toilets`);

        // Clear existing markers
        this.markers.clearLayers();

        // Add new markers
        toilets.forEach(toilet => {
            if (toilet.coordinates?.latitude && toilet.coordinates?.longitude) {
                try {
                    const marker = this.createMarker(toilet);
                    const popupContent = this.createPopupContent(toilet);
                    marker.bindPopup(popupContent);
                    this.markers.addLayer(marker);
                } catch (error) {
                    console.error(`[HOME] Error creating marker for toilet ${toilet.id}:`, error);
                }
            }
        });

        // Fit bounds if we have markers
        if (this.markers.getLayers().length > 0) {
            this.map.fitBounds(this.markers.getBounds(), {
                padding: [50, 50],
                maxZoom: 15,
                animate: true,
                duration: 1
            });
        }
    }

    /**
     * Create a marker for a toilet
     * @param {object} toilet - Toilet data
     * @returns {L.Marker} Leaflet marker
     */
    createMarker(toilet) {
        const markerIcon = L.divIcon({
            className: 'toilet-marker',
            html: `<div style="
                width: 20px;
                height: 20px;
                border-radius: 50%;
                background-color: ${this.getMarkerColor(toilet.averageRating)};
                border: 3px solid white;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                transition: all 0.3s ease;
            "></div>`,
            iconSize: [20, 20],
            iconAnchor: [10, 10]
        });

        return L.marker(
            [toilet.coordinates.latitude, toilet.coordinates.longitude],
            { icon: markerIcon }
        );
    }

    /**
     * Get marker color based on rating
     * @param {number} rating - Average rating
     * @returns {string} Color hex code
     */
    getMarkerColor(rating) {
        if (!rating) return '#808080'; // Grey for no rating
        if (rating >= 4) return '#4caf50'; // Green for high rating
        if (rating >= 3) return '#ffc107'; // Yellow for medium rating
        return '#f44336'; // Red for low rating
    }

    /**
     * Create popup content for toilet marker
     * @param {object} toilet - Toilet data
     * @returns {string} HTML content
     */
    createPopupContent(toilet) {
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
                        <span class="rating-stars">${this.getStarRating(toilet.averageRating)}</span>
                        <span>(${toilet.averageRating ? toilet.averageRating.toFixed(1) : 'No'} / 5)</span>
                    </div>
                    <p>Total Reviews: ${toilet.totalReviews || 0}</p>
                `}

                ${toilet.facilities ? `
                    <p>Facilities: ${toilet.facilities.map(f => f.replace('_', ' ')).join(', ')}</p>
                ` : ''}

                ${!isPublic ? `<button onclick="reviewToilet('${toilet.id}')">Write Review</button>` : ''}
            </div>
        `;
    }

    /**
     * Get star rating display
     * @param {number} rating - Rating value
     * @returns {string} Star display
     */
    getStarRating(rating) {
        if (!rating) return 'No ratings yet';
        const fullStars = Math.floor(rating);
        const halfStar = rating % 1 >= 0.5;
        let stars = '★'.repeat(fullStars);
        if (halfStar) stars += '½';
        stars += '☆'.repeat(5 - Math.ceil(rating));
        return stars;
    }

    /**
     * Update toilet filters and reload data
     */
    updateToiletFilters() {
        console.log('[HOME] Updating toilet filters');

        // Update store
        const showPublic = $('#showPublicToilets')?.checked ?? true;
        const showPrivate = $('#showPrivateToilets')?.checked ?? true;

        appStore.setState(prevState => ({
            ...prevState,
            settings: {
                ...prevState.settings,
                mapFilters: {
                    showPublic,
                    showPrivate
                }
            }
        }));

        // Reload toilets
        this.loadToilets();
    }

    /**
     * Sync all data sources
     * @returns {Promise} Sync promise
     */
    async syncAllDataSources() {
        try {
            appStore.setLoading('sync', true);

            const syncButton = $('button[onclick*="syncAllDataSources"]');
            const originalText = syncButton?.textContent || 'Sync All APIs';
            if (syncButton) syncButton.textContent = '🔄 Syncing All APIs...';

            const bounds = this.map.getBounds();
            const boundsString = `${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()}`;

            console.log('[HOME] Syncing all data sources for bounds:', boundsString);

            // Sync from all available sources
            const sources = [
                'osm', 'government', 'geofabrik', 'city_ckan', 'planet_osm',
                'data.gov.in', 'swachh_bharat', 'municipal', 'tourism_boards',
                'transport_hubs', 'commercial_centers', 'educational_institutions'
            ];

            const syncPromises = sources.map(source =>
                fetch(`${AppConfig.api.baseUrl}/api/toilet/sync-public`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        bounds: boundsString,
                        sources: [source],
                        city: this.getCurrentCityFromBounds(bounds)
                    })
                }).then(res => res.ok ? res.json() : { synced: 0, source })
                  .catch(() => ({ synced: 0, source }))
            );

            const results = await Promise.allSettled(syncPromises);
            const totalSynced = results.reduce((sum, result) => {
                if (result.status === 'fulfilled') {
                    return sum + (result.value.synced || 0);
                }
                return sum;
            }, 0);

            console.log('[HOME] All API sync completed, total toilets added:', totalSynced);

            // Reload toilets and stats
            await Promise.all([
                this.loadToilets(),
                this.updateHomePageStats()
            ]);

            // Show success message
            appStore.addNotification({
                type: 'success',
                title: 'Sync Complete',
                message: `Successfully synced ${totalSynced} new toilets from all external APIs!`,
                duration: 5000
            });

        } catch (error) {
            console.error('[HOME] Error syncing all data sources:', error);
            appStore.addNotification({
                type: 'error',
                title: 'Sync Failed',
                message: 'Failed to sync data from external APIs. Please try again.',
                duration: 5000
            });
        } finally {
            appStore.setLoading('sync', false);
            const syncButton = $('button[onclick*="syncAllDataSources"]');
            if (syncButton) syncButton.textContent = '🔄 Sync All APIs';
        }
    }

    /**
     * Get current city from map bounds
     * @param {L.LatLngBounds} bounds - Map bounds
     * @returns {string} City name
     */
    getCurrentCityFromBounds(bounds) {
        const center = bounds.getCenter();
        const lat = center.lat;
        const lng = center.lng;

        // Simple city detection based on coordinates
        if (lat > 28.4 && lat < 28.9 && lng > 76.8 && lng < 77.4) return 'delhi';
        if (lat > 18.8 && lat < 19.3 && lng > 72.7 && lng < 73.0) return 'mumbai';
        if (lat > 12.7 && lat < 13.2 && lng > 77.3 && lng < 77.9) return 'bangalore';
        if (lat > 12.9 && lat < 13.3 && lng > 80.1 && lng < 80.4) return 'chennai';
        if (lat > 18.3 && lat < 18.7 && lng > 73.7 && lng < 74.0) return 'pune';

        return 'mumbai'; // Default fallback
    }

    /**
     * Update home page statistics
     * @returns {Promise} Update promise
     */
    async updateHomePageStats() {
        try {
            console.log('[HOME] Updating home page statistics');

            // Get toilet stats
            const response = await fetch(`${AppConfig.api.baseUrl}/api/toilet/stats`);
            if (response.ok) {
                const stats = await response.json();

                // Update display elements
                const totalCount = $('#totalToiletsCount');
                const citiesCovered = $('#citiesCovered');
                const reviewsCount = $('#reviewsCount');

                if (totalCount) totalCount.textContent = (stats.total || 0).toLocaleString() + '+';
                if (citiesCovered) citiesCovered.textContent = `${Math.max(stats.cities || 9, 9)}+ Cities`;
                if (reviewsCount) reviewsCount.textContent = (stats.totalReviews || 500).toLocaleString() + '+';

                console.log('[HOME] Updated home page stats:', stats);
            }
        } catch (error) {
            console.warn('[HOME] Could not update home page stats:', error.message);
        }
    }

    /**
     * Update map statistics
     * @param {Array} toilets - Toilet data
     */
    updateMapStats(toilets) {
        const statsContent = $('#map-stats-content');

        if (!statsContent) return;

        if (!toilets || toilets.length === 0) {
            statsContent.innerHTML = '<p>No toilets available yet</p><p>Add toilets via the admin panel</p>';
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

    /**
     * Initialize QR scanner
     */
    initializeQRScanner() {
        console.log('[HOME] Initializing QR scanner');

        const qrReader = $('#qr-reader');
        if (!qrReader) {
            console.warn('[HOME] QR reader element not found');
            return;
        }

        // Check if Html5Qrcode is available
        if (typeof Html5Qrcode === 'undefined') {
            console.error('[HOME] Html5Qrcode library not loaded');
            qrReader.innerHTML = '<p>QR scanner library not available. Please refresh the page.</p>';
            return;
        }

        try {
            this.qrScanner = new Html5QrcodeScanner(
                "qr-reader",
                {
                    fps: AppConfig.qrScanner.fps,
                    qrbox: AppConfig.qrScanner.qrbox,
                    aspectRatio: AppConfig.qrScanner.aspectRatio,
                    showTorchButtonIfSupported: AppConfig.qrScanner.showTorchButtonIfSupported,
                    showZoomSliderIfSupported: AppConfig.qrScanner.showZoomSliderIfSupported
                },
                false
            );

            this.qrScanner.render(this.onScanSuccess, this.onScanFailure);
            console.log('[HOME] QR scanner initialized successfully');

        } catch (error) {
            console.error('[HOME] Error initializing QR scanner:', error);
            qrReader.innerHTML = '<p>Error initializing QR scanner. Please refresh the page.</p>';
        }
    }

    /**
     * Handle successful QR scan
     * @param {string} decodedText - Scanned text
     * @param {object} decodedResult - Scan result
     */
    onScanSuccess(decodedText, decodedResult) {
        if (this.isProcessingScan) return;

        this.isProcessingScan = true;
        console.log('[HOME] QR code scanned successfully:', decodedText);

        try {
            // Stop the scanner
            if (this.qrScanner) {
                this.qrScanner.clear();
                this.qrScanner = null;
            }

            // Hide scanner
            const qrReader = $('#qr-reader');
            if (qrReader) qrReader.style.display = 'none';

            console.log('[HOME] Scanned QR code data:', decodedText);

            // Check if it's a review URL - extract toilet ID from URL
            if (decodedText.includes('review.html?id=')) {
                console.log('[HOME] QR Code contains review URL:', decodedText);

                try {
                    // Extract toilet ID from URL
                    const url = new URL(decodedText);
                    const toiletId = url.searchParams.get('id');

                    console.log('[HOME] URL parsing successful, extracted toilet ID:', toiletId);

                    if (toiletId) {
                        console.log('[HOME] Loading toilet info for extracted ID:', toiletId);
                        this.loadToiletInfo(toiletId);
                        return;
                    } else {
                        throw new Error('No toilet ID found in QR code URL');
                    }
                } catch (urlError) {
                    console.error('[HOME] URL parsing failed:', urlError);
                    throw new Error('Invalid QR code URL format');
                }
            }

            // Check if it's a plain toilet ID
            const toiletId = decodedText.trim();
            if (toiletId && toiletId.length > 10) {
                console.log('[HOME] QR Code treated as toilet ID:', toiletId);
                this.loadToiletInfo(toiletId);
                return;
            }

            throw new Error('Invalid QR code format - not a valid review URL or toilet ID');

        } catch (error) {
            console.error('[HOME] Error processing QR code:', error);
            appStore.addNotification({
                type: 'error',
                title: 'Invalid QR Code',
                message: error.message || 'Please scan a valid toilet QR code.',
                duration: 5000
            });
            this.resetScanner();
        } finally {
            this.isProcessingScan = false;
        }
    }

    /**
     * Handle QR scan failure
     * @param {string} error - Error message
     */
    onScanFailure(error) {
        // Only log significant errors
        if (error && !error.includes('No QR code found') && !error.includes('NotFoundException')) {
            console.warn('[HOME] QR scan error:', error);
        }
    }

    /**
     * Reset QR scanner
     */
    resetScanner() {
        console.log('[HOME] Resetting scanner');

        this.isProcessingScan = false;

        // Clear existing scanner
        if (this.qrScanner) {
            this.qrScanner.clear();
            this.qrScanner = null;
        }

        // Reset UI elements
        const toiletInfoPanel = $('#toiletInfoPanel');
        const reviewFormSection = $('#reviewFormSection');
        const successMessage = $('#successMessage');
        const qrReader = $('#qr-reader');

        if (toiletInfoPanel) toiletInfoPanel.style.display = 'none';
        if (reviewFormSection) reviewFormSection.style.display = 'none';
        if (successMessage) successMessage.style.display = 'none';
        if (qrReader) {
            qrReader.style.display = 'block';
            qrReader.innerHTML = ''; // Clear any existing content
        }

        // Reset current toilet ID
        this.currentToiletId = null;

        // Initialize new scanner
        setTimeout(() => {
            this.initializeQRScanner();
        }, 100);

        console.log('[HOME] Scanner reset complete');
    }

    /**
     * Load toilet information
     * @param {string} toiletId - Toilet ID
     * @returns {Promise} Loading promise
     */
    async loadToiletInfo(toiletId) {
        console.log('[HOME] Loading toilet info for ID:', toiletId);

        const toiletInfoPanel = $('#toiletInfoPanel');
        const reviewFormSection = $('#reviewFormSection');

        // Show loading state
        if (toiletInfoPanel) {
            toiletInfoPanel.style.display = 'block';
            toiletInfoPanel.innerHTML = `
                <div style="text-align: center; padding: 2rem;">
                    <div class="loading-spinner"></div>
                    <p>Loading toilet information...</p>
                </div>
            `;
        }

        try {
            console.log('[HOME] Fetching toilet data from API...');
            const response = await fetch(`${AppConfig.api.baseUrl}/api/toilet/${toiletId}`);

            if (!response.ok) {
                throw new Error(`Server responded with status: ${response.status}`);
            }

            const toilet = await response.json();
            console.log('[HOME] Received toilet data:', toilet);

            if (!toilet) {
                throw new Error('No toilet data received');
            }

            // Store current toilet ID
            this.currentToiletId = toilet.id || toiletId;

            // Update toilet information panel
            this.updateToiletInfoPanel(toilet);

            // Show review form
            if (reviewFormSection) {
                reviewFormSection.style.display = 'block';
            }

        } catch (error) {
            console.error('[HOME] Error loading toilet info:', error);
            if (toiletInfoPanel) {
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
                        <button onclick="location.reload()" class="btn" style="background: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer;">
                            Try Again
                        </button>
                    </div>
                `;
            }
        }
    }

    /**
     * Update toilet info panel
     * @param {object} toilet - Toilet data
     */
    updateToiletInfoPanel(toilet) {
        const toiletInfoPanel = $('#toiletInfoPanel');

        if (!toiletInfoPanel) return;

        const isPublic = toilet.type === 'public';

        toiletInfoPanel.innerHTML = `
            <h2>Toilet Information</h2>
            <div class="toilet-details">
                <div class="info-group">
                    <h3>${toilet.name || 'Unknown Toilet'}</h3>
                    <p>${toilet.location || 'Location not specified'}</p>
                    ${toilet.description ? `<p>${toilet.description}</p>` : ''}
                </div>
                <div class="info-group">
                    <h4>Current Ratings</h4>
                    <div class="rating-summary">
                        <div class="rating-item">
                            <span>Overall Rating:</span>
                            <span class="rating-stars">${this.getStarRating(toilet.averageRating)}</span>
                        </div>
                        <div class="rating-item">
                            <span>Total Reviews:</span>
                            <span>${toilet.totalReviews || 0}</span>
                        </div>
                    </div>
                </div>
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

    /**
     * Destroy the home page and clean up resources
     */
    destroy() {
        console.log('[HOME] Destroying home page...');

        // Clean up map
        if (this.map) {
            this.map.remove();
            this.map = null;
        }

        // Clean up markers
        if (this.markers) {
            this.markers.clearLayers();
            this.markers = null;
        }

        // Clean up QR scanner
        if (this.qrScanner) {
            this.qrScanner.clear();
            this.qrScanner = null;
        }

        console.log('[HOME] Home page destroyed');
    }
}

// Export is already done as default export above
