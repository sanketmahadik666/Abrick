// Client-Side Caching System for Toilet Review System
// Provides efficient caching for map tiles, toilet data, and user preferences

class ClientCache {
    constructor() {
        this.storage = window.localStorage;
        this.memoryCache = new Map();
        this.maxMemorySize = 50; // Max items in memory cache
        
        // Cache TTL configurations (in milliseconds)
        this.cacheConfig = {
            TOILET_DATA: 15 * 60 * 1000, // 15 minutes
            MAP_TILES: 7 * 24 * 60 * 60 * 1000, // 7 days
            USER_PREFERENCES: 24 * 60 * 60 * 1000, // 24 hours
            SEARCH_RESULTS: 5 * 60 * 1000, // 5 minutes
            REVIEWS: 10 * 60 * 1000, // 10 minutes
            STATS: 30 * 60 * 1000, // 30 minutes
            QR_CODES: 24 * 60 * 60 * 1000 // 24 hours
        };
        
        this.init();
    }
    
    init() {
        console.log('[CLIENT-CACHE] Initializing client-side cache');
        
        // Clean up expired entries on initialization
        this.cleanup();
        
        // Set up periodic cleanup
        setInterval(() => this.cleanup(), 60 * 60 * 1000); // Every hour
    }
    
    // Generate cache keys
    static generateKey(type, identifier) {
        return `toilet-app:${type}:${identifier}`;
    }
    
    // Store data with TTL
    set(key, data, type = 'TOILET_DATA', customTTL = null) {
        const cacheKey = ClientCache.generateKey(type, key);
        const ttl = customTTL || this.cacheConfig[type] || this.cacheConfig.TOILET_DATA;
        const expiry = Date.now() + ttl;
        
        const cacheData = {
            data,
            expiry,
            type,
            created: Date.now()
        };
        
        try {
            // Store in localStorage
            this.storage.setItem(cacheKey, JSON.stringify(cacheData));
            
            // Store in memory cache for frequently accessed items
            if (this.memoryCache.size < this.maxMemorySize) {
                this.memoryCache.set(cacheKey, cacheData);
            } else {
                // Remove oldest entry from memory cache
                const firstKey = this.memoryCache.keys().next().value;
                this.memoryCache.delete(firstKey);
                this.memoryCache.set(cacheKey, cacheData);
            }
            
            console.log(`[CLIENT-CACHE] Stored: ${cacheKey} (TTL: ${ttl}ms)`);
            return true;
        } catch (error) {
            console.error('[CLIENT-CACHE] Storage error:', error);
            
            // Fallback: clear some space and retry
            this.evictOldest();
            try {
                this.storage.setItem(cacheKey, JSON.stringify(cacheData));
                return true;
            } catch (retryError) {
                console.error('[CLIENT-CACHE] Retry failed:', retryError);
                return false;
            }
        }
    }
    
    // Retrieve data from cache
    get(key, type = 'TOILET_DATA') {
        const cacheKey = ClientCache.generateKey(type, key);
        
        // Check memory cache first
        if (this.memoryCache.has(cacheKey)) {
            const cached = this.memoryCache.get(cacheKey);
            if (!this.isExpired(cached)) {
                console.log(`[CLIENT-CACHE] Memory hit: ${cacheKey}`);
                return cached.data;
            } else {
                this.memoryCache.delete(cacheKey);
            }
        }
        
        // Check localStorage
        try {
            const cached = this.storage.getItem(cacheKey);
            if (!cached) return null;
            
            const parsed = JSON.parse(cached);
            
            if (this.isExpired(parsed)) {
                this.delete(key, type);
                return null;
            }
            
            // Update memory cache
            if (this.memoryCache.size < this.maxMemorySize) {
                this.memoryCache.set(cacheKey, parsed);
            }
            
            console.log(`[CLIENT-CACHE] Storage hit: ${cacheKey}`);
            return parsed.data;
        } catch (error) {
            console.error('[CLIENT-CACHE] Retrieval error:', error);
            this.delete(key, type);
            return null;
        }
    }
    
    // Check if cached data is expired
    isExpired(cached) {
        return !cached || !cached.expiry || Date.now() > cached.expiry;
    }
    
    // Delete specific cache entry
    delete(key, type = 'TOILET_DATA') {
        const cacheKey = ClientCache.generateKey(type, key);
        
        this.memoryCache.delete(cacheKey);
        this.storage.removeItem(cacheKey);
        
        console.log(`[CLIENT-CACHE] Deleted: ${cacheKey}`);
    }
    
    // Clear all cache entries of a specific type
    clearType(type) {
        const prefix = `toilet-app:${type}:`;
        const keysToDelete = [];
        
        // Check memory cache
        for (const key of this.memoryCache.keys()) {
            if (key.startsWith(prefix)) {
                this.memoryCache.delete(key);
            }
        }
        
        // Check localStorage
        for (let i = 0; i < this.storage.length; i++) {
            const key = this.storage.key(i);
            if (key && key.startsWith(prefix)) {
                keysToDelete.push(key);
            }
        }
        
        keysToDelete.forEach(key => this.storage.removeItem(key));
        
        console.log(`[CLIENT-CACHE] Cleared type: ${type} (${keysToDelete.length} entries)`);
    }
    
    // Clear all cache
    clearAll() {
        this.memoryCache.clear();
        
        const keysToDelete = [];
        for (let i = 0; i < this.storage.length; i++) {
            const key = this.storage.key(i);
            if (key && key.startsWith('toilet-app:')) {
                keysToDelete.push(key);
            }
        }
        
        keysToDelete.forEach(key => this.storage.removeItem(key));
        
        console.log('[CLIENT-CACHE] Cleared all cache');
    }
    
    // Evict oldest entries to make space
    evictOldest() {
        const entries = [];
        
        // Collect all cache entries with timestamps
        for (let i = 0; i < this.storage.length; i++) {
            const key = this.storage.key(i);
            if (key && key.startsWith('toilet-app:')) {
                try {
                    const cached = JSON.parse(this.storage.getItem(key));
                    entries.push({ key, created: cached.created || 0 });
                } catch (error) {
                    // Remove corrupted entries
                    this.storage.removeItem(key);
                }
            }
        }
        
        // Sort by creation time and remove oldest 10%
        entries.sort((a, b) => a.created - b.created);
        const toRemove = Math.ceil(entries.length * 0.1);
        
        for (let i = 0; i < toRemove; i++) {
            this.storage.removeItem(entries[i].key);
        }
        
        console.log(`[CLIENT-CACHE] Evicted ${toRemove} oldest entries`);
    }
    
    // Clean up expired entries
    cleanup() {
        let cleaned = 0;
        
        // Clean localStorage
        const keysToDelete = [];
        for (let i = 0; i < this.storage.length; i++) {
            const key = this.storage.key(i);
            if (key && key.startsWith('toilet-app:')) {
                try {
                    const cached = JSON.parse(this.storage.getItem(key));
                    if (this.isExpired(cached)) {
                        keysToDelete.push(key);
                    }
                } catch (error) {
                    keysToDelete.push(key);
                }
            }
        }
        
        keysToDelete.forEach(key => {
            this.storage.removeItem(key);
            this.memoryCache.delete(key);
            cleaned++;
        });
        
        console.log(`[CLIENT-CACHE] Cleaned up ${cleaned} expired entries`);
    }
    
    // Get cache statistics
    getStats() {
        const stats = {
            memory: {
                size: this.memoryCache.size,
                maxSize: this.maxMemorySize
            },
            storage: {
                totalItems: 0,
                totalSize: 0,
                expiredItems: 0
            }
        };
        
        // Analyze localStorage
        for (let i = 0; i < this.storage.length; i++) {
            const key = this.storage.key(i);
            if (key && key.startsWith('toilet-app:')) {
                stats.storage.totalItems++;
                try {
                    const cached = JSON.parse(this.storage.getItem(key));
                    stats.storage.totalSize += JSON.stringify(cached).length;
                    if (this.isExpired(cached)) {
                        stats.storage.expiredItems++;
                    }
                } catch (error) {
                    stats.storage.expiredItems++;
                }
            }
        }
        
        return stats;
    }
    
    // Smart cache invalidation based on user actions
    invalidateOnAction(action, data) {
        switch (action) {
            case 'review_submitted':
                // Invalidate reviews and stats cache
                this.delete(data.toiletId, 'REVIEWS');
                this.clearType('STATS');
                break;
                
            case 'toilet_added':
                // Invalidate map data and search results
                this.clearType('TOILET_DATA');
                this.clearType('SEARCH_RESULTS');
                this.clearType('STATS');
                break;
                
            case 'location_changed':
                // Invalidate nearby toilets data
                this.clearType('TOILET_DATA');
                this.clearType('MAP_TILES');
                break;
                
            case 'search_performed':
                // Invalidate old search results
                this.clearType('SEARCH_RESULTS');
                break;
        }
        
        console.log(`[CLIENT-CACHE] Invalidated cache for action: ${action}`);
    }
}

// Specialized cache for map-related data
class MapCache extends ClientCache {
    constructor() {
        super();
        this.tileCache = new Map();
        this.geoJsonCache = new Map();
    }
    
    // Cache map tiles
    setTile(z, x, y, tileData) {
        const key = `${z}/${x}/${y}`;
        this.tileCache.set(key, {
            data: tileData,
            timestamp: Date.now()
        });
    }
    
    getTile(z, x, y) {
        const key = `${z}/${x}/${y}`;
        const cached = this.tileCache.get(key);
        
        if (cached && Date.now() - cached.timestamp < this.cacheConfig.MAP_TILES) {
            return cached.data;
        }
        
        this.tileCache.delete(key);
        return null;
    }
    
    // Cache GeoJSON data for map bounds
    setGeoJson(bounds, zoom, geoJsonData) {
        const key = `${bounds.toString()}:${zoom}`;
        this.geoJsonCache.set(key, {
            data: geoJsonData,
            timestamp: Date.now()
        });
    }
    
    getGeoJson(bounds, zoom) {
        const key = `${bounds.toString()}:${zoom}`;
        const cached = this.geoJsonCache.get(key);
        
        if (cached && Date.now() - cached.timestamp < this.cacheConfig.TOILET_DATA) {
            return cached.data;
        }
        
        this.geoJsonCache.delete(key);
        return null;
    }
}

// User preferences cache
class PreferencesCache extends ClientCache {
    constructor() {
        super();
        this.userPrefs = this.get('user_prefs', 'USER_PREFERENCES') || {};
    }
    
    getUserPreference(key, defaultValue = null) {
        return this.userPrefs[key] !== undefined ? this.userPrefs[key] : defaultValue;
    }
    
    setUserPreference(key, value) {
        this.userPrefs[key] = value;
        this.set('user_prefs', this.userPrefs, 'USER_PREFERENCES');
    }
    
    getAllPreferences() {
        return { ...this.userPrefs };
    }
}

// Create global instances
window.clientCache = new ClientCache();
window.mapCache = new MapCache();
window.preferencesCache = new PreferencesCache();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        ClientCache,
        MapCache,
        PreferencesCache
    };
}