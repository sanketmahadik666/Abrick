const { toilets } = require('./storage');

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
    }

    async save() {
        this.updatedAt = new Date();
        const index = toilets.findIndex(t => t.id === this.id);
        if (index > -1) {
            toilets[index] = this;
        } else {
            toilets.push(this);
        }
        return this;
    }

    async remove() {
        const index = toilets.findIndex(t => t.id === this.id);
        if (index > -1) {
            toilets.splice(index, 1);
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
            updatedAt: this.updatedAt
        };
    }

    static async find(query = {}) {
        let results = toilets.slice();
        if (query.coordinates && query.coordinates.$near) {
            // Simple distance calculation (not accurate, but for demo)
            const { coordinates } = query.coordinates.$near.$geometry;
            const maxDistance = query.coordinates.$near.$maxDistance / 1000; // convert to km
            results = results.filter(t => {
                const dist = Math.sqrt(
                    Math.pow(t.coordinates.latitude - coordinates[1], 2) +
                    Math.pow(t.coordinates.longitude - coordinates[0], 2)
                );
                return dist <= maxDistance;
            });
        }
        return results;
    }

    static async findById(id) {
        return toilets.find(t => t.id === id);
    }

    static async findByIdAndUpdate(id, update) {
        const toilet = toilets.find(t => t.id === id);
        if (toilet) {
            Object.assign(toilet, update);
            toilet.updatedAt = new Date();
            return toilet;
        }
        return null;
    }
}

module.exports = Toilet; 