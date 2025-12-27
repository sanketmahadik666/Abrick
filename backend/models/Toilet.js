const storage = require('./storage');

class Toilet {
    constructor(data) {
        this.id = data.id || Date.now().toString() + Math.random().toString(36).substr(2, 9);
        this.name = data.name.trim();
        this.location = data.location.trim();
        this.description = data.description ? data.description.trim() : '';
        this.coordinates = data.coordinates;
        this.facilities = data.facilities || [];
        this.averageRating = data.averageRating || 0;
        this.totalReviews = data.totalReviews || 0;
        this.createdAt = data.createdAt || new Date();
        this.updatedAt = data.updatedAt || new Date();

        // New fields for hybrid system
        this.type = data.type || 'private'; // 'public' | 'private'
        this.source = data.source || null; // API source for public toilets ('osm', 'government', etc.)
        this.sourceId = data.sourceId || null; // External ID from data source
        this.lastSynced = data.lastSynced || null; // Last sync timestamp
        this.verified = data.verified || (data.type === 'private'); // Private toilets are verified by default
    }

    async save() {
        this.updatedAt = new Date();
        // Check if toilet exists
        const existing = storage.toilets.findById(this.id);
        if (existing) {
            // Update existing toilet
            Object.assign(existing, this);
        } else {
            // Add new toilet
            storage.toilets.push(this);
        }
        return this;
    }

    async remove() {
        try {
            const existing = storage.toilets.findById(this.id);
            if (existing) {
                // Get the toilets array reference from storage
                const { toilets: storageToilets } = require('./storage');
                
                // Remove from main array
                const index = storageToilets.findIndex(t => t.id === this.id);
                if (index > -1) {
                    storageToilets.splice(index, 1);
                    
                    // Update indexes if available
                    if (storage.performanceMonitor && storage.toiletOperations) {
                        const { toiletIndexes } = require('./storage');
                        
                        // Remove from type index
                        if (toiletIndexes.byType.has(this.type)) {
                            toiletIndexes.byType.get(this.type).delete(this.id);
                        }
                        
                        // Remove from source index
                        if (this.source && toiletIndexes.bySource.has(this.source)) {
                            toiletIndexes.bySource.get(this.source).delete(this.id);
                        }
                        
                        // Extract city and update location index
                        const { toiletOperations } = require('./storage');
                        const city = toiletOperations.extractCity(this.location);
                        if (city && toiletIndexes.byLocation.has(city)) {
                            toiletIndexes.byLocation.get(city).delete(this.id);
                        }
                        
                        // Remove from search index
                        toiletIndexes.searchIndex.delete(this.id);
                        
                        // Remove from ID map
                        if (storage.toiletOperations && storage.toiletOperations.idMap) {
                            storage.toiletOperations.idMap.delete(this.id);
                        }
                    }
                    
                    console.log(`[TOILET] Successfully removed toilet ${this.id} from storage`);
                    return true;
                }
            }
            console.log(`[TOILET] Toilet ${this.id} not found for removal`);
            return false;
        } catch (error) {
            console.error(`[TOILET] Error removing toilet ${this.id}:`, error.message);
            throw error;
        }
    }

    toObject() {
        return {
            id: this.id,
            name: this.name,
            location: this.location,
            description: this.description,
            coordinates: this.coordinates,
            facilities: this.facilities,
            averageRating: this.averageRating,
            totalReviews: this.totalReviews,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            type: this.type,
            source: this.source,
            sourceId: this.sourceId,
            lastSynced: this.lastSynced,
            verified: this.verified
        };
    }

    static async find(query = {}) {
        let results = storage.toilets.find(query);

        // Handle sorting if specified in query
        if (query.sort) {
            results.sort((a, b) => {
                for (const [field, order] of Object.entries(query.sort)) {
                    const aVal = a[field] || 0;
                    const bVal = b[field] || 0;
                    if (aVal !== bVal) {
                        return order === 1 ? aVal - bVal : bVal - aVal;
                    }
                }
                return 0;
            });
        }

        // Handle limiting
        if (query.limit) {
            const skip = query.skip || 0;
            results = results.slice(skip, skip + query.limit);
        }

        return results;
    }

    static async findById(id) {
        return storage.toilets.findById(id);
    }

    static async findOne(query = {}) {
        const results = await storage.toilets.find(query);
        return results.length > 0 ? results[0] : null;
    }

    static async findByIdAndUpdate(id, update) {
        const toilet = storage.toilets.findById(id);
        if (toilet) {
            Object.assign(toilet, update);
            toilet.updatedAt = new Date();
            return toilet;
        }
        return null;
    }
}

module.exports = Toilet;
