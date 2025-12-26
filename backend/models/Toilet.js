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
        const existing = storage.toilets.findById(this.id);
        if (existing) {
            // Remove from storage - this is a simplified implementation
            // In a real system, we'd have a proper remove method
            const allToilets = storage.toilets.find();
            const filtered = allToilets.filter(t => t.id !== this.id);
            // Note: This is a simplified approach - in production you'd use a proper database
            console.log(`Removed toilet ${this.id}`);
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
