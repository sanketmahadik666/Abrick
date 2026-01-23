/**
 * Map Module
 * Wraps Leaflet.js functionality for map initialization, marker management, and user location.
 */
export const MapModule = {
    map: null,
    markers: [],
    markerClusterGroup: null,

    /**
     * Initialize the Leaflet map.
     * @param {string} containerId - DOM ID of the map container.
     * @param {number[]} [center=[18.5204, 73.8567]] - Initial center coordinates [lat, lng].
     * @param {number} [zoom=13] - Initial zoom level.
     * @returns {L.Map} The initialized Leaflet map instance.
     */
    init(containerId, center = [18.5204, 73.8567], zoom = 13) {
        if (this.map) return this.map;

        this.map = L.map(containerId, {
            center: center,
            zoom: zoom,
            minZoom: 3,
            maxZoom: 18,
            zoomControl: true,
            preferCanvas: true,
            zoomAnimation: true,
            markerZoomAnimation: true
        });

        // Use CartoDB Light tiles for better aesthetics
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            attribution: '©OpenStreetMap, ©CartoDB',
            subdomains: 'abcd',
            maxZoom: 19,
            updateWhenIdle: true,
            keepBuffer: 2
        }).addTo(this.map);

        // Advanced clustering config
        this.markerClusterGroup = L.markerClusterGroup({
            chunkedLoading: true,
            maxClusterRadius: 50,
            spiderfyOnMaxZoom: true,
            showCoverageOnHover: true,
            zoomToBoundsOnClick: true,
            animate: true,
            animateAddingMarkers: true,
            disableClusteringAtZoom: 16
        });
        
        this.map.addLayer(this.markerClusterGroup);
        return this.map;
    },

    /**
     * Clear all markers from the map.
     */
    clearMarkers() {
        if (this.markerClusterGroup) {
            this.markerClusterGroup.clearLayers();
        }
        this.markers = [];
    },

    /**
     * Get marker color based on rating.
     * @param {number} rating - Rating value (0-5).
     * @returns {string} Hex color string.
     */
    getMarkerColor(rating) {
        if (!rating) return '#808080'; // Grey
        if (rating >= 4) return '#4caf50'; // Green
        if (rating >= 3) return '#ffc107'; // Yellow
        return '#f44336'; // Red
    },

    /**
     * Add a marker to the map.
     * @param {number} lat - Latitude.
     * @param {number} lng - Longitude.
     * @param {string} [popupContent] - HTML content for the popup.
     * @param {number} [rating=0] - Tilet rating for marker coloring.
     * @returns {L.CircleMarker|undefined} The created marker or undefined if map not initialized.
     */
    addMarker(lat, lng, popupContent, rating = 0) {
        if (!this.map || !this.markerClusterGroup) return;

        const color = this.getMarkerColor(rating);
        
        // Use CircleMarker for better performance and aesthetics
        const marker = L.circleMarker([lat, lng], {
            radius: 10,
            fillColor: color,
            color: '#ffffff',
            weight: 3,
            opacity: 1,
            fillOpacity: 0.9,
            className: 'toilet-marker'
        });

        // Add hover effects
        marker.on('mouseover', function() {
            this.setStyle({ radius: 12, weight: 4 });
        });
        
        marker.on('mouseout', function() {
            this.setStyle({ radius: 10, weight: 3 });
        });
        
        if (popupContent) {
            marker.bindPopup(popupContent);
        }

        this.markerClusterGroup.addLayer(marker);
        this.markers.push(marker);
        return marker;
    },

    /**
     * Fit map bounds to show all markers.
     */
    fitBounds() {
        if (this.markers.length > 0 && this.markerClusterGroup) {
            this.map.fitBounds(this.markerClusterGroup.getBounds(), {
                padding: [50, 50],
                maxZoom: 15,
                animate: true
            });
        }
    },

    /**
     * Locate the user and show their position on the map.
     */
    locateUser() {
        if (!this.map) return;
        
        this.map.locate({setView: true, maxZoom: 16});
        
        this.map.on('locationfound', (e) => {
            L.circle(e.latlng, {
                radius: e.accuracy / 2,
                color: '#4285F4',
                fillColor: '#4285F4',
                fillOpacity: 0.1
            }).addTo(this.map);
        });

        this.map.on('locationerror', (e) => {
            console.warn('Location access denied or failed', e);
        });
    }
};
