export const MapModule = {
    map: null,
    markers: [],
    markerClusterGroup: null,

    init(containerId, center = [51.505, -0.09], zoom = 13) {
        if (this.map) return; // Already initialized

        this.map = L.map(containerId).setView(center, zoom);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(this.map);

        this.markerClusterGroup = L.markerClusterGroup();
        this.map.addLayer(this.markerClusterGroup);

        return this.map;
    },

    clearMarkers() {
        if (this.markerClusterGroup) {
            this.markerClusterGroup.clearLayers();
        }
        this.markers = [];
    },

    addMarker(lat, lng, popupContent) {
        if (!this.map || !this.markerClusterGroup) return;

        const marker = L.marker([lat, lng]);
        
        if (popupContent) {
            marker.bindPopup(popupContent);
        }

        this.markerClusterGroup.addLayer(marker);
        this.markers.push(marker);
        return marker;
    },

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
