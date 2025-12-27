const { reviews } = require('./storage');

class Review {
    constructor(data) {
        this.id = data.id || Date.now().toString() + Math.random().toString(36).substr(2, 9);
        this.toiletId = data.toiletId;
        this.rating = data.rating;
        this.cleanliness = data.cleanliness;
        this.maintenance = data.maintenance;
        this.accessibility = data.accessibility;
        this.comment = data.comment ? data.comment.trim() : '';
        this.createdAt = data.createdAt || new Date();
    }

    async save() {
        const index = reviews.findIndex(r => r.id === this.id);
        if (index > -1) {
            reviews[index] = this;
        } else {
            reviews.push(this);
        }
        return this;
    }

    async remove() {
        const index = reviews.findIndex(r => r.id === this.id);
        if (index > -1) {
            reviews.splice(index, 1);
            return true;
        }
        return false;
    }

    toObject() {
        return {
            id: this.id,
            toiletId: this.toiletId,
            rating: this.rating,
            cleanliness: this.cleanliness,
            maintenance: this.maintenance,
            accessibility: this.accessibility,
            comment: this.comment,
            createdAt: this.createdAt
        };
    }

    static async find(query = {}) {
        return reviews.filter(r => {
            for (let key in query) {
                if (r[key] !== query[key]) return false;
            }
            return true;
        }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    static async findById(id) {
        return reviews.find(r => r.id === id);
    }

    static async countDocuments() {
        return reviews.length;
    }

    static async aggregate(pipeline) {
        // Simple aggregation for average ratings
        if (pipeline[0].$group) {
            const group = pipeline[0].$group;
            if (group._id === null) {
                const result = {
                    avgRating: reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length || 0,
                    avgCleanliness: reviews.reduce((sum, r) => sum + r.cleanliness, 0) / reviews.length || 0,
                    avgMaintenance: reviews.reduce((sum, r) => sum + r.maintenance, 0) / reviews.length || 0,
                    avgAccessibility: reviews.reduce((sum, r) => sum + r.accessibility, 0) / reviews.length || 0
                };
                return [result];
            }
        }
        return [];
    }
}

module.exports = Review;
