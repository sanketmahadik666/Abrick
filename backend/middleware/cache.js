// Advanced In-Memory Caching System for Toilet Review System
// Supports both server-side and client-side caching with multiple strategies

const LRU = require('lru-cache');
const NodeCache = require('node-cache');

// Server-side LRU Cache for frequent data
const { LRUCache } = require('lru-cache');
const serverCache = new LRUCache({
    max: 1000, // Maximum number of items
    ttl: 1000 * 60 * 30, // 30 minutes default TTL
    updateAgeOnGet: true, // Update age when accessing
    allowStale: false, // Don't return stale values
    dispose: (value, key) => {
        console.log(`[CACHE] Disposing cache entry: ${key}`);
    }
});

// NodeCache for temporary data and counters
const tempCache = new NodeCache({
    stdTTL: 600, // 10 minutes default
    checkperiod: 120, // Check for expired keys every 2 minutes
    useClones: false // Don't clone objects for performance
});

// Cache strategies for different data types
const cacheStrategies = {
    // Static data that changes rarely (toilet types, facilities)
    STATIC: {
        ttl: 1000 * 60 * 60 * 24, // 24 hours
        maxSize: 100
    },
    
    // User sessions and authentication data
    SESSION: {
        ttl: 1000 * 60 * 60 * 8, // 8 hours
        maxSize: 500
    },
    
    // Toilet data - medium TTL as it can change
    TOILET_DATA: {
        ttl: 1000 * 60 * 15, // 15 minutes
        maxSize: 2000
    },
    
    // Public toilet API responses - longer TTL as data is external
    PUBLIC_API: {
        ttl: 1000 * 60 * 60 * 6, // 6 hours
        maxSize: 500
    },
    
    // Search results - shorter TTL
    SEARCH: {
        ttl: 1000 * 60 * 5, // 5 minutes
        maxSize: 1000
    },
    
    // Review data - medium TTL
    REVIEWS: {
        ttl: 1000 * 60 * 10, // 10 minutes
        maxSize: 2000
    },
    
    // Statistics - can be cached longer
    STATS: {
        ttl: 1000 * 60 * 30, // 30 minutes
        maxSize: 100
    }
};

// Cache key generators
const cacheKeys = {
    toilets: (bounds, filters) => `toilets:${bounds}:${JSON.stringify(filters)}`,
    toilet: (id) => `toilet:${id}`,
    reviews: (toiletId, page) => `reviews:${toiletId}:${page}`,
    stats: (type) => `stats:${type}`,
    search: (query, filters) => `search:${query}:${JSON.stringify(filters)}`,
    api: (endpoint, params) => `api:${endpoint}:${JSON.stringify(params)}`,
    session: (token) => `session:${token}`,
    geojson: (bounds, zoom) => `geojson:${bounds}:${zoom}`
};

// Cache wrapper functions
class CacheManager {
    
    // Get data from cache or execute function and cache result
    static async getOrSet(key, fetcher, strategy = 'TOILET_DATA') {
        const cacheConfig = cacheStrategies[strategy] || cacheStrategies.TOILET_DATA;
        
        // Try server cache first (LRU)
        let value = serverCache.get(key);
        if (value !== undefined) {
            console.log(`[CACHE] Hit: ${key}`);
            return value;
        }
        
        console.log(`[CACHE] Miss: ${key}`);
        
        try {
            // Execute fetcher function
            const data = await fetcher();
            
            // Cache the result
            this.set(key, data, strategy);
            
            return data;
        } catch (error) {
            console.error(`[CACHE] Error fetching data for key ${key}:`, error.message);
            
            // Try to return stale data if available
            const staleValue = tempCache.get(key);
            if (staleValue) {
                console.log(`[CACHE] Returning stale data for key: ${key}`);
                return staleValue;
            }
            
            throw error;
        }
    }
    
    // Set data in cache
    static set(key, data, strategy = 'TOILET_DATA') {
        const cacheConfig = cacheStrategies[strategy] || cacheStrategies.TOILET_DATA;
        
        // Store in LRU cache
        serverCache.set(key, data, { ttl: cacheConfig.ttl });
        
        // Store in temp cache for backup
        tempCache.set(key, data, cacheConfig.ttl / 1000);
        
        console.log(`[CACHE] Set: ${key} (${strategy})`);
    }
    
    // Delete specific key
    static delete(key) {
        serverCache.delete(key);
        tempCache.del(key);
        console.log(`[CACHE] Deleted: ${key}`);
    }
    
    // Clear cache by pattern
    static clearPattern(pattern) {
        const keys = [...serverCache.keys()];
        const regex = new RegExp(pattern);
        
        keys.forEach(key => {
            if (regex.test(key)) {
                this.delete(key);
            }
        });
    }
    
    // Invalidate related caches when data changes
    static invalidateRelated(type, id) {
        const patterns = {
            toilet: [`toilet:${id}`, `reviews:${id}`, `stats:*`],
            review: [`reviews:${id}`, `stats:*`],
            user: [`session:*`]
        };
        
        const patternsToClear = patterns[type] || [];
        patternsToClear.forEach(pattern => {
            this.clearPattern(pattern);
        });
    }
    
    // Get cache statistics
    static getStats() {
        return {
            server: {
                size: serverCache.size,
                maxSize: serverCache.max,
                ttl: serverCache.ttl,
                entries: [...serverCache.keys()].length
            },
            temp: {
                keys: tempCache.keys().length,
                stats: tempCache.getStats()
            }
        };
    }
    
    // Cleanup expired entries
    static cleanup() {
        // LRU cache handles this automatically
        tempCache.flushAll();
        console.log('[CACHE] Cleanup completed');
    }
}

// Cache middleware for Express routes
const cacheMiddleware = (strategy = 'TOILET_DATA', keyGenerator = null) => {
    return async (req, res, next) => {
        try {
            const key = keyGenerator ? keyGenerator(req) : req.originalUrl;
            const cached = serverCache.get(key);
            
            if (cached) {
                console.log(`[CACHE] Serving cached response: ${key}`);
                res.set('X-Cache', 'HIT');
                return res.json(cached);
            }
            
            // Override res.json to cache the response
            const originalJson = res.json;
            res.json = function(data) {
                CacheManager.set(key, data, strategy);
                res.set('X-Cache', 'MISS');
                return originalJson.call(this, data);
            };
            
            next();
        } catch (error) {
            console.error('[CACHE] Middleware error:', error);
            next();
        }
    };
};

// Background cache warming for critical data
class CacheWarming {
    static async warmCriticalData() {
        console.log('[CACHE] Starting cache warming...');
        
        try {
            // Warm toilet statistics
            await CacheManager.getOrSet(
                cacheKeys.stats('toilets'),
                async () => {
                    const PublicToiletService = require('../services/PublicToiletService');
                    return await PublicToiletService.getStats();
                },
                'STATS'
            );
            
            // Warm review statistics
            await CacheManager.getOrSet(
                cacheKeys.stats('reviews'),
                async () => {
                    const Review = require('../models/Review');
                    const totalReviews = await Review.countDocuments();
                    const averages = await Review.aggregate([
                        {
                            $group: {
                                _id: null,
                                avgRating: { $avg: '$rating' },
                                avgCleanliness: { $avg: '$cleanliness' },
                                avgMaintenance: { $avg: '$maintenance' },
                                avgAccessibility: { $avg: '$accessibility' }
                            }
                        }
                    ]);
                    
                    return {
                        totalReviews,
                        averages: averages[0] || {
                            avgRating: 0,
                            avgCleanliness: 0,
                            avgMaintenance: 0,
                            avgAccessibility: 0
                        }
                    };
                },
                'STATS'
            );
            
            console.log('[CACHE] Cache warming completed');
        } catch (error) {
            console.error('[CACHE] Cache warming failed:', error);
        }
    }
}

// Start cache warming periodically
setInterval(() => {
    CacheWarming.warmCriticalData();
}, 30 * 60 * 1000); // Every 30 minutes

module.exports = {
    CacheManager,
    CacheWarming,
    cacheMiddleware,
    cacheKeys,
    cacheStrategies
};