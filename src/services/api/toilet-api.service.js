/**
 * Toilet API Service
 * Handles all toilet-related API operations
 * Follows Single Responsibility Principle - only handles toilet API calls
 */

import { baseApiService } from './base-api.service.js';
import { API_ENDPOINTS } from '../../core/constants/api.constants.js';

/**
 * Toilet API Service Class
 * Extends BaseApiService with toilet-specific operations
 */
export class ToiletApiService {
    constructor() {
        this.baseService = baseApiService;
    }

    /**
     * Get map data for toilets
     * @param {object} filters - Filter options
     * @param {boolean} filters.showPublic - Include public toilets
     * @param {boolean} filters.showPrivate - Include private toilets
     * @param {object} filters.bounds - Map bounds for spatial filtering
     * @param {number} filters.limit - Maximum results
     * @param {number} filters.offset - Pagination offset
     * @returns {Promise} Map data response
     */
    async getMapData(filters = {}) {
        console.log('[TOILET-API] Fetching map data with filters:', filters);

        const params = new URLSearchParams();
        if (filters.showPublic !== undefined) params.append('showPublic', filters.showPublic);
        if (filters.showPrivate !== undefined) params.append('showPrivate', filters.showPrivate);
        if (filters.bounds) {
            const boundsStr = `${filters.bounds.south},${filters.bounds.west},${filters.bounds.north},${filters.bounds.east}`;
            params.append('bounds', boundsStr);
        }
        if (filters.limit) params.append('limit', filters.limit);
        if (filters.offset) params.append('offset', filters.offset);

        const endpoint = `${API_ENDPOINTS.TOILETS.MAP}?${params}`;
        const response = await this.baseService.get(endpoint);

        console.log(`[TOILET-API] Retrieved ${response.data?.length || 0} toilets for map`);
        return response;
    }

    /**
     * Get toilet statistics
     * @returns {Promise} Statistics response
     */
    async getStatistics() {
        console.log('[TOILET-API] Fetching toilet statistics');

        const response = await this.baseService.get(API_ENDPOINTS.TOILETS.STATS);
        console.log('[TOILET-API] Retrieved toilet statistics');
        return response;
    }

    /**
     * Get single toilet by ID
     * @param {string} toiletId - Toilet ID
     * @returns {Promise} Toilet data response
     */
    async getToiletById(toiletId) {
        console.log('[TOILET-API] Fetching toilet:', toiletId);

        const response = await this.baseService.get(API_ENDPOINTS.TOILETS.BY_ID(toiletId));
        console.log('[TOILET-API] Retrieved toilet data');
        return response;
    }

    /**
     * Add a new private toilet (admin only)
     * @param {object} toiletData - Toilet data
     * @param {string} toiletData.name - Toilet name
     * @param {string} toiletData.location - Toilet location
     * @param {object} toiletData.coordinates - Lat/lng coordinates
     * @param {Array} toiletData.facilities - Available facilities
     * @param {string} toiletData.description - Optional description
     * @returns {Promise} Creation response
     */
    async addPrivateToilet(toiletData) {
        console.log('[TOILET-API] Adding private toilet:', toiletData.name);

        // Validate required fields
        this.validateToiletData(toiletData);

        const response = await this.baseService.post(API_ENDPOINTS.TOILETS.ADD_PRIVATE, {
            name: toiletData.name,
            location: toiletData.location,
            coordinates: toiletData.coordinates,
            facilities: toiletData.facilities || [],
            description: toiletData.description?.trim() || ''
        });

        console.log('[TOILET-API] Private toilet added successfully');
        return response;
    }

    /**
     * Sync public toilet data from external APIs
     * @param {object} options - Sync options
     * @param {object} options.bounds - Map bounds to sync
     * @param {Array} options.sources - Data sources to use
     * @param {string} options.city - City to focus on
     * @returns {Promise} Sync response
     */
    async syncPublicData(options = {}) {
        console.log('[TOILET-API] Syncing public toilet data:', options);

        const syncData = {
            bounds: options.bounds,
            sources: options.sources || ['osm', 'government'],
            city: options.city || 'mumbai'
        };

        const response = await this.baseService.post(API_ENDPOINTS.TOILETS.SYNC_PUBLIC, syncData);
        console.log(`[TOILET-API] Sync completed, ${response.synced || 0} toilets added`);
        return response;
    }

    /**
     * Generate QR code for toilet
     * @param {string} toiletId - Toilet ID
     * @returns {Promise} QR code response
     */
    async generateQRCode(toiletId) {
        console.log('[TOILET-API] Generating QR code for toilet:', toiletId);

        const response = await this.baseService.get(API_ENDPOINTS.TOILETS.QR_CODE(toiletId));
        console.log('[TOILET-API] QR code generated successfully');
        return response;
    }

    /**
     * Update toilet information (admin only)
     * @param {string} toiletId - Toilet ID
     * @param {object} updateData - Data to update
     * @returns {Promise} Update response
     */
    async updateToilet(toiletId, updateData) {
        console.log('[TOILET-API] Updating toilet:', toiletId);

        const response = await this.baseService.put(API_ENDPOINTS.TOILETS.BY_ID(toiletId), updateData);
        console.log('[TOILET-API] Toilet updated successfully');
        return response;
    }

    /**
     * Delete a toilet (admin only)
     * @param {string} toiletId - Toilet ID
     * @returns {Promise} Delete response
     */
    async deleteToilet(toiletId) {
        console.log('[TOILET-API] Deleting toilet:', toiletId);

        const response = await this.baseService.delete(API_ENDPOINTS.TOILETS.BY_ID(toiletId));
        console.log('[TOILET-API] Toilet deleted successfully');
        return response;
    }

    /**
     * Search toilets by location or name
     * @param {string} query - Search query
     * @param {object} options - Search options
     * @returns {Promise} Search results
     */
    async searchToilets(query, options = {}) {
        console.log('[TOILET-API] Searching toilets with query:', query);

        const params = new URLSearchParams();
        params.append('q', query);
        if (options.limit) params.append('limit', options.limit);
        if (options.type) params.append('type', options.type);

        const endpoint = `${API_ENDPOINTS.TOILETS.MAP}/search?${params}`;
        const response = await this.baseService.get(endpoint);

        console.log(`[TOILET-API] Search completed, ${response.data?.length || 0} results`);
        return response;
    }

    /**
     * Get toilets near a location
     * @param {object} center - Center coordinates
     * @param {number} center.lat - Latitude
     * @param {number} center.lng - Longitude
     * @param {number} radius - Search radius in meters
     * @param {object} options - Additional options
     * @returns {Promise} Nearby toilets
     */
    async getNearbyToilets(center, radius = 1000, options = {}) {
        console.log('[TOILET-API] Finding nearby toilets:', center, `radius: ${radius}m`);

        const params = new URLSearchParams();
        params.append('lat', center.lat);
        params.append('lng', center.lng);
        params.append('radius', radius);
        if (options.limit) params.append('limit', options.limit);
        if (options.type) params.append('type', options.type);

        const endpoint = `${API_ENDPOINTS.TOILETS.MAP}/nearby?${params}`;
        const response = await this.baseService.get(endpoint);

        console.log(`[TOILET-API] Found ${response.data?.length || 0} nearby toilets`);
        return response;
    }

    /**
     * Validate toilet data before submission
     * @param {object} toiletData - Toilet data to validate
     * @throws {Error} Validation error
     */
    validateToiletData(toiletData) {
        if (!toiletData) {
            throw new Error('Toilet data is required');
        }

        if (!toiletData.name || typeof toiletData.name !== 'string') {
            throw new Error('Valid toilet name is required');
        }

        if (!toiletData.location || typeof toiletData.location !== 'string') {
            throw new Error('Valid location is required');
        }

        if (!toiletData.coordinates ||
            typeof toiletData.coordinates.lat !== 'number' ||
            typeof toiletData.coordinates.lng !== 'number') {
            throw new Error('Valid coordinates are required');
        }

        // Validate coordinate ranges
        if (toiletData.coordinates.lat < -90 || toiletData.coordinates.lat > 90) {
            throw new Error('Latitude must be between -90 and 90');
        }

        if (toiletData.coordinates.lng < -180 || toiletData.coordinates.lng > 180) {
            throw new Error('Longitude must be between -180 and 180');
        }

        if (toiletData.facilities && !Array.isArray(toiletData.facilities)) {
            throw new Error('Facilities must be an array');
        }

        if (toiletData.description && typeof toiletData.description !== 'string') {
            throw new Error('Description must be a string');
        }
    }

    /**
     * Calculate distance between two coordinates
     * @param {object} coord1 - First coordinate
     * @param {object} coord2 - Second coordinate
     * @returns {number} Distance in meters
     */
    calculateDistance(coord1, coord2) {
        const R = 6371e3; // Earth's radius in meters
        const φ1 = coord1.lat * Math.PI / 180;
        const φ2 = coord2.lat * Math.PI / 180;
        const Δφ = (coord2.lat - coord1.lat) * Math.PI / 180;
        const Δλ = (coord2.lng - coord1.lng) * Math.PI / 180;

        const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                  Math.cos(φ1) * Math.cos(φ2) *
                  Math.sin(Δλ/2) * Math.sin(Δλ/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

        return R * c;
    }

    /**
     * Format toilet data for display
     * @param {object} toilet - Raw toilet data
     * @returns {object} Formatted toilet data
     */
    formatToiletData(toilet) {
        return {
            id: toilet.id || toilet._id,
            name: toilet.name || 'Unknown Toilet',
            location: toilet.location || 'Location not specified',
            coordinates: toilet.coordinates,
            facilities: toilet.facilities || [],
            type: toilet.type || 'private',
            averageRating: toilet.averageRating || 0,
            totalReviews: toilet.totalReviews || 0,
            verified: toilet.verified || false,
            source: toilet.source || 'manual',
            description: toilet.description || '',
            lastSynced: toilet.lastSynced,
            createdAt: toilet.createdAt,
            updatedAt: toilet.updatedAt
        };
    }

    /**
     * Get toilet type display name
     * @param {string} type - Toilet type
     * @returns {string} Display name
     */
    getTypeDisplayName(type) {
        const typeNames = {
            public: 'Public Facility',
            private: 'Private Toilet'
        };
        return typeNames[type] || 'Unknown Type';
    }

    /**
     * Get facility display name
     * @param {string} facility - Facility code
     * @returns {string} Display name
     */
    getFacilityDisplayName(facility) {
        const facilityNames = {
            handicap: 'Handicap Accessible',
            baby_change: 'Baby Change Station',
            shower: 'Shower',
            bidet: 'Bidet',
            paper_towel: 'Paper Towels',
            hand_dryer: 'Hand Dryer',
            unisex: 'Unisex',
            fee_required: 'Fee Required'
        };
        return facilityNames[facility] || facility.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
}

// Create singleton instance
export const toiletApiService = new ToiletApiService();
