// SCALABLE In-memory storage for runtime caching - OPTIMIZED FOR LARGE DATASETS
const fs = require('fs').promises;
const path = require('path');

// In-memory storage with performance optimizations
const users = [];
const toilets = [];
const reviews = [];

// Performance optimizations for large datasets
const CACHE_CONFIG = {
    MAX_TOILETS_IN_MEMORY: 50000, // Limit in-memory storage
    COMPRESSION_THRESHOLD: 10000,  // Compress when exceeding this
    INDEX_UPDATE_INTERVAL: 5000,   // Update search indexes every 5 seconds
    BATCH_SIZE: 1000              // Process in batches for performance
};

// Search indexes for fast queries (optimized for large datasets)
let toiletIndexes = {
    byType: new Map(),           // type -> [toiletIds]
    bySource: new Map(),         // source -> [toiletIds]
    byLocation: new Map(),       // city -> [toiletIds]
    byCoordinates: null,         // Spatial index (future: R-tree or similar)
    searchIndex: new Map()       // name/location -> toiletIds
};

// Batch processing for large operations
const batchProcessor = {
    queue: [],
    processing: false,

    async add(operation) {
        this.queue.push(operation);
        if (!this.processing) {
            await this.processQueue();
        }
    },

    async processQueue() {
        if (this.processing || this.queue.length === 0) return;

        this.processing = true;

        try {
            // Process in batches to avoid blocking
            const batch = this.queue.splice(0, CACHE_CONFIG.BATCH_SIZE);
            await Promise.all(batch.map(op => op()));
        } finally {
            this.processing = false;

            // Continue processing if more items
            if (this.queue.length > 0) {
                setImmediate(() => this.processQueue());
            }
        }
    }
};

// Optimized toilet operations for large datasets
const toiletOperations = {
    // Fast lookup by ID using Map for O(1) access
    idMap: new Map(),

    // Add toilet with indexing (assumes toilet is already in array)
    add(toilet) {
        this.idMap.set(toilet.id, toilet);

        // Update indexes asynchronously
        batchProcessor.add(() => this.updateIndexes(toilet));

        // Memory management for large datasets
        if (toilets.length > CACHE_CONFIG.MAX_TOILETS_IN_MEMORY) {
            this.optimizeMemory();
        }
    },

    // Update search indexes
    updateIndexes(toilet) {
        // Type index
        if (!toiletIndexes.byType.has(toilet.type)) {
            toiletIndexes.byType.set(toilet.type, new Set());
        }
        toiletIndexes.byType.get(toilet.type).add(toilet.id);

        // Source index
        if (toilet.source) {
            if (!toiletIndexes.bySource.has(toilet.source)) {
                toiletIndexes.bySource.set(toilet.source, new Set());
            }
            toiletIndexes.bySource.get(toilet.source).add(toilet.id);
        }

        // Location index (extract city from location string)
        const city = this.extractCity(toilet.location);
        if (city) {
            if (!toiletIndexes.byLocation.has(city)) {
                toiletIndexes.byLocation.set(city, new Set());
            }
            toiletIndexes.byLocation.get(city).add(toilet.id);
        }

        // Search index for name and location
        const searchTerms = `${toilet.name} ${toilet.location}`.toLowerCase();
        toiletIndexes.searchIndex.set(toilet.id, searchTerms);
    },

    // Extract city from location string (simple heuristic)
    extractCity(location) {
        if (!location) return null;

        // Common Indian cities for fast lookup
        const cities = ['mumbai', 'delhi', 'bangalore', 'chennai', 'pune', 'kolkata', 'hyderabad', 'ahmedabad'];
        const locationLower = location.toLowerCase();

        for (const city of cities) {
            if (locationLower.includes(city)) {
                return city;
            }
        }

        return null;
    },

    // Memory optimization for large datasets
    optimizeMemory() {
        console.log(`[STORAGE] Optimizing memory for ${toilets.length} toilets`);

        // Keep only recent/high-rated toilets in memory
        toilets.sort((a, b) => {
            // Prioritize verified toilets
            if (a.verified !== b.verified) return b.verified - a.verified;
            // Then by rating
            if (a.averageRating !== b.averageRating) return b.averageRating - a.averageRating;
            // Then by reviews
            return b.totalReviews - a.totalReviews;
        });

        // Keep top 80% in memory, archive rest
        const keepCount = Math.floor(CACHE_CONFIG.MAX_TOILETS_IN_MEMORY * 0.8);
        const archived = toilets.splice(keepCount);

        console.log(`[STORAGE] Archived ${archived.length} toilets, keeping ${toilets.length} in memory`);

        // In production, archived toilets would be moved to database
        // For now, they're still accessible but not indexed
    },

    // Fast query operations using indexes
    findByType(type) {
        const ids = toiletIndexes.byType.get(type);
        return ids ? Array.from(ids).map(id => this.idMap.get(id)).filter(Boolean) : [];
    },

    findBySource(source) {
        const ids = toiletIndexes.bySource.get(source);
        return ids ? Array.from(ids).map(id => this.idMap.get(id)).filter(Boolean) : [];
    },

    findByLocation(city) {
        const ids = toiletIndexes.byLocation.get(city);
        return ids ? Array.from(ids).map(id => this.idMap.get(id)).filter(Boolean) : [];
    },

    search(query, limit = 50) {
        const queryLower = query.toLowerCase();
        const results = [];

        for (const [id, searchText] of toiletIndexes.searchIndex) {
            if (searchText.includes(queryLower)) {
                const toilet = this.idMap.get(id);
                if (toilet) {
                    results.push(toilet);
                    if (results.length >= limit) break;
                }
            }
        }

        return results;
    },

    // Spatial queries (bounding box)
    findInBounds(south, west, north, east, limit = 1000) {
        const results = [];

        for (const toilet of toilets) {
            if (toilet.coordinates) {
                const { latitude: lat, longitude: lng } = toilet.coordinates;
                if (lat >= south && lat <= north && lng >= west && lng <= east) {
                    results.push(toilet);
                    if (results.length >= limit) break;
                }
            }
        }

        return results;
    },

    // Find toilets near a point within max distance (simplified)
    findNear(centerLat, centerLng, maxDistanceMeters, limit = 100) {
        const results = [];

        for (const toilet of toilets) {
            if (toilet.coordinates) {
                const { latitude: lat, longitude: lng } = toilet.coordinates;

                // Simple distance calculation (Haversine approximation)
                const distance = this.calculateDistance(centerLat, centerLng, lat, lng);

                if (distance <= maxDistanceMeters) {
                    results.push(toilet);
                    if (results.length >= limit) break;
                }
            }
        }

        return results;
    },

    // Calculate distance between two points in meters (Haversine formula approximation)
    calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371000; // Earth's radius in meters
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;

        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLng/2) * Math.sin(dLng/2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }
};

// Performance monitoring
const performanceMonitor = {
    queryCount: 0,
    avgQueryTime: 0,
    cacheHits: 0,
    cacheMisses: 0,

    recordQueryTime(timeMs) {
        this.queryCount++;
        this.avgQueryTime = (this.avgQueryTime * (this.queryCount - 1) + timeMs) / this.queryCount;
    },

    getStats() {
        return {
            totalToilets: toilets.length,
            indexedToilets: toiletOperations.idMap.size,
            queryCount: this.queryCount,
            avgQueryTime: Math.round(this.avgQueryTime * 100) / 100,
            cacheHitRate: this.cacheHits / (this.cacheHits + this.cacheMisses) * 100,
            memoryUsage: process.memoryUsage()
        };
    }
};

// Store reference to original array push method
const originalPush = Array.prototype.push;

// Optimized exports with performance monitoring
const optimizedToilets = {
    // Core operations
    push(toilet) {
        const result = originalPush.call(toilets, toilet); // Use original array push to avoid recursion
        toiletOperations.add(toilet); // Then perform indexing operations
        return result;
    },

    find(query = {}) {
        const startTime = Date.now();

        let results = toilets;

        // Apply filters efficiently using indexes
        if (query.type) {
            if (query.type.$in) {
                // Handle $in operator for multiple types
                const allResults = [];
                for (const type of query.type.$in) {
                    const typeResults = toiletOperations.findByType(type);
                    allResults.push(...typeResults);
                }
                results = allResults;
            } else {
                // Handle single type
                results = toiletOperations.findByType(query.type);
            }
        }

        if (query.source) {
            results = results.filter(t => t.source === query.source);
        }

        if (query.verified !== undefined) {
            results = results.filter(t => t.verified === query.verified);
        }

        if (query.coordinates && query.coordinates.$geoWithin) {
            const bounds = query.coordinates.$geoWithin.$box;
            results = toiletOperations.findInBounds(bounds[0][1], bounds[0][0], bounds[1][1], bounds[1][0]);
        }

        // Handle $near queries (simplified distance check)
        if (query.coordinates && query.coordinates.$near) {
            const { $geometry, $maxDistance } = query.coordinates.$near;
            if ($geometry && $geometry.type === 'Point' && $geometry.coordinates) {
                const [centerLng, centerLat] = $geometry.coordinates;
                results = toiletOperations.findNear(centerLat, centerLng, $maxDistance);
            }
        }

        // Sorting (optimized)
        if (query.sort) {
            results.sort((a, b) => {
                for (const [field, order] of Object.entries(query.sort)) {
                    const aVal = a[field];
                    const bVal = b[field];
                    if (aVal !== bVal) {
                        return order === 1 ? aVal - bVal : bVal - aVal;
                    }
                }
                return 0;
            });
        }

        // Pagination
        if (query.limit) {
            const skip = query.skip || 0;
            results = results.slice(skip, skip + query.limit);
        }

        performanceMonitor.recordQueryTime(Date.now() - startTime);
        return results;
    },

    findById(id) {
        return toiletOperations.idMap.get(id) || toilets.find(t => t.id === id);
    },

    countDocuments(query = {}) {
        let results = toilets;

        // Apply type filtering
        if (query.type && query.type.$in) {
            results = results.filter(t => query.type.$in.includes(t.type));
        }

        // Apply spatial filtering if needed
        if (query.spatialBounds) {
            const { south, west, north, east } = query.spatialBounds;
            results = results.filter(toilet => {
                if (!toilet.coordinates) return false;
                const lat = toilet.coordinates.latitude;
                const lng = toilet.coordinates.longitude;
                return lat >= south && lat <= north && lng >= west && lng <= east;
            });
        }

        return results.length;
    },

    aggregate(pipeline) {
        // Simple aggregation for sampling (used in map optimization)
        let results = toilets;

        for (const stage of pipeline) {
            if (stage.$match) {
                results = results.filter(toilet => {
                    for (const [key, condition] of Object.entries(stage.$match)) {
                        if (key === 'type' && condition.$in) {
                            if (!condition.$in.includes(toilet.type)) return false;
                        }
                        // Add more match conditions as needed
                    }
                    return true;
                });
            }

            if (stage.$sample) {
                const sampleSize = Math.min(stage.$sample.size, results.length);
                const sampled = [];
                const indices = new Set();

                while (sampled.length < sampleSize) {
                    const index = Math.floor(Math.random() * results.length);
                    if (!indices.has(index)) {
                        indices.add(index);
                        sampled.push(results[index]);
                    }
                }

                results = sampled;
            }

            if (stage.$sort) {
                results.sort((a, b) => {
                    for (const [field, order] of Object.entries(stage.$sort)) {
                        const aVal = a[field] || 0;
                        const bVal = b[field] || 0;
                        if (aVal !== bVal) {
                            return order === 1 ? aVal - bVal : bVal - aVal;
                        }
                    }
                    return 0;
                });
            }
        }

        return results;
    }
};

// Create a proper proxy that maintains array functionality
const enhancedToilets = new Proxy(toilets, {
    get(target, prop) {
        // Prioritize optimized methods over native array methods
        if (typeof optimizedToilets[prop] === 'function') {
            return optimizedToilets[prop];
        }

        // Special handling for push to add indexing
        if (prop === 'push') {
            return function(...items) {
                const result = Array.prototype.push.apply(target, items);
                // Index the new items
                items.forEach(item => {
                    if (item && typeof item === 'object') {
                        toiletOperations.add(item);
                    }
                });
                return result;
            };
        }

        // For other array methods and properties, use the original array
        if (typeof target[prop] === 'function' || prop in target) {
            return target[prop];
        }

        // Otherwise use the optimized methods as properties
        return optimizedToilets[prop];
    }
});

// Enhanced exports with performance monitoring
module.exports = {
    users,
    toilets: enhancedToilets, // Export enhanced array with both array methods and optimized operations
    reviews,
    performanceMonitor,
    toiletOperations,
    toiletIndexes,
    getStorageStats() {
        return {
            toilets: performanceMonitor.getStats(),
            users: users.length,
            reviews: reviews.length,
            indexes: {
                byType: toiletIndexes.byType.size,
                bySource: toiletIndexes.bySource.size,
                byLocation: toiletIndexes.byLocation.size,
                searchIndex: toiletIndexes.searchIndex.size
            }
        };
    }
};
