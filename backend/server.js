const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Routes
const authRoutes = require('./routes/auth');
const toiletRoutes = require('./routes/toilets');
const reviewRoutes = require('./routes/reviews');
const maximumDataRoutes = require('./routes/maximumData');

// Services
const SLOService = require('./services/SLOService');
const sloServiceInstance = SLOService; // This is the singleton instance
const { middleware } = SLOService;

// Middleware
const { authLimiter, apiLimiter, syncLimiter } = require('./middleware/rateLimiter');
const { CacheManager, CacheWarming } = require('./middleware/cache');

// Models for sample data
const storage = require('./models/storage');
const Toilet = require('./models/Toilet');

// Auth middleware
const { protect, admin } = require('./middleware/auth');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// SLO Monitoring Middleware
app.use(middleware);

// Request logging middleware
app.use((req, res, next) => {
    const startTime = Date.now();
    console.log(`[REQUEST] ${req.method} ${req.path} - IP: ${req.ip}`);

    if (req.method !== 'GET' && Object.keys(req.body).length > 0) {
        console.log(`[REQUEST] Body:`, JSON.stringify(req.body, null, 2));
    }

    const originalJson = res.json;
    res.json = function(data) {
        const duration = Date.now() - startTime;
        console.log(`[RESPONSE] ${req.method} ${req.path} - Status: ${res.statusCode} - Duration: ${duration}ms`);
        return originalJson.call(this, data);
    };

    next();
});

// Serve static files from the frontend
app.use(express.static(path.join(__dirname, '../')));

// API Routes with rate limiting
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/admin', authLimiter, authRoutes);
app.use('/api/toilet', apiLimiter, toiletRoutes);
app.use('/api/review', apiLimiter, reviewRoutes);
app.use('/api/maximum', apiLimiter, maximumDataRoutes);

// Special rate limiting for sync operations
app.use('/api/toilet/sync-public', syncLimiter);

// SLO Metrics Endpoint
app.get('/api/slo/metrics', (req, res) => {
    try {
        const metrics = sloServiceInstance.exportMetrics();
        res.json(metrics);
    } catch (error) {
        console.error('[SLO] Error getting metrics:', error.message);
        res.status(500).json({ message: 'Error fetching SLO metrics' });
    }
});

// Cache Statistics Endpoint
app.get('/api/cache/stats', (req, res) => {
    try {
        const cacheStats = CacheManager.getStats();
        res.json({
            success: true,
            data: cacheStats,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('[CACHE] Error getting cache stats:', error.message);
        res.status(500).json({ message: 'Error fetching cache statistics' });
    }
});

// Cache Invalidation Endpoint (Admin only)
app.post('/api/cache/invalidate', protect, admin, (req, res) => {
    try {
        const { pattern, type } = req.body;
        
        if (pattern) {
            CacheManager.clearPattern(pattern);
            console.log(`[CACHE] Invalidated cache pattern: ${pattern}`);
        }
        
        if (type) {
            // Implement type-based invalidation
            switch (type) {
                case 'toilets':
                    CacheManager.clearPattern('toilets:*');
                    break;
                case 'reviews':
                    CacheManager.clearPattern('reviews:*');
                    break;
                case 'stats':
                    CacheManager.clearPattern('stats:*');
                    break;
            }
            console.log(`[CACHE] Invalidated cache type: ${type}`);
        }
        
        res.json({ success: true, message: 'Cache invalidated successfully' });
    } catch (error) {
        console.error('[CACHE] Error invalidating cache:', error.message);
        res.status(500).json({ message: 'Error invalidating cache' });
    }
});

// Serve frontend for any other routes (excluding static files and API routes)
app.get('*', (req, res) => {
    // Don't serve index.html for API routes, static files, or known assets
    const requestPath = req.path.toLowerCase();
    const isStaticFile = /\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/.test(requestPath);
    const isApiRoute = requestPath.startsWith('/api/');

    if (isStaticFile || isApiRoute) {
        return res.status(404).json({ error: 'Not found' });
    }

    res.sendFile(path.join(__dirname, '../index.html'));
});

// Initialize system with dynamic data fetching capabilities and seed data
async function initializeDynamicDataSystem() {
    console.log('[INIT] Initializing dynamic Indian toilet data system...');

    try {
        // Check existing toilets
        const existingToilets = storage.toilets.find();
        console.log(`[INIT] Found ${existingToilets.length} existing toilets`);

        if (existingToilets.length < 100) {
            console.log('[INIT] Adding seed data for demonstration...');

            // Add some initial seed data for demonstration
            const seedToilets = [
                {
                    name: 'Central Park Restroom',
                    location: 'Central Park, New York',
                    coordinates: { latitude: 40.7829, longitude: -73.9654 },
                    facilities: ['handicap', 'baby_change', 'shower', 'paper_towel'],
                    type: 'private',
                    verified: true
                },
                {
                    name: 'Times Square Public Toilet',
                    location: 'Times Square, Manhattan',
                    coordinates: { latitude: 40.7580, longitude: -73.9855 },
                    facilities: ['handicap', 'paper_towel', 'hand_dryer'],
                    type: 'private',
                    verified: true
                },
                {
                    name: 'Mumbai Central Railway Station',
                    location: 'Mumbai Central, Dadar, Mumbai',
                    coordinates: { latitude: 18.9700, longitude: 72.8200 },
                    facilities: ['unisex', 'handicap', 'fee_required'],
                    type: 'public',
                    source: 'railway_station',
                    verified: true
                },
                {
                    name: 'Chhatrapati Shivaji Terminus',
                    location: 'CST, Fort, Mumbai',
                    coordinates: { latitude: 18.9398, longitude: 72.8354 },
                    facilities: ['unisex', 'handicap', 'baby_change'],
                    type: 'public',
                    source: 'railway_station',
                    verified: true
                },
                {
                    name: 'Phoenix Mall Public Toilets',
                    location: 'Phoenix Mall, Lower Parel, Mumbai',
                    coordinates: { latitude: 18.9944, longitude: 72.8259 },
                    facilities: ['unisex', 'handicap', 'baby_change'],
                    type: 'public',
                    source: 'shopping_mall',
                    verified: true
                },
                {
                    name: 'New Delhi Railway Station',
                    location: 'New Delhi Railway Station',
                    coordinates: { latitude: 28.6425, longitude: 77.2197 },
                    facilities: ['unisex', 'handicap'],
                    type: 'public',
                    source: 'railway_station',
                    verified: true
                },
                {
                    name: 'Indira Gandhi International Airport',
                    location: 'Palam, Delhi',
                    coordinates: { latitude: 28.5562, longitude: 77.1000 },
                    facilities: ['unisex', 'handicap', 'baby_change', 'shower'],
                    type: 'public',
                    source: 'airport',
                    verified: true
                }
            ];

            // Save seed data
            for (const toiletData of seedToilets) {
                try {
                    const toilet = new Toilet(toiletData);
                    await toilet.save();
                    console.log(`[INIT] Added seed toilet: ${toilet.name}`);
                } catch (error) {
                    console.error(`[INIT] Error adding seed toilet ${toiletData.name}:`, error.message);
                }
            }

            console.log('[INIT] Seed data initialization complete');
        }

        console.log('[INIT] System ready for dynamic API data fetching!');
        console.log('[INIT] Available data sources: Overpass API, Geofabrik, City CKAN, Government APIs, Tourism Boards, Transport Hubs, Commercial Centers, Educational Institutions');
        console.log('[INIT] Zoom-based loading and real-time sync enabled!');

    } catch (error) {
        console.error('[INIT] Error during initialization:', error);
    }
}

// Enhanced error handling middleware
app.use((err, req, res, next) => {
    const timestamp = new Date().toISOString();
    const errorId = Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    
    console.error(`[ERROR] ${errorId} ${req.method} ${req.path}`);
    console.error(`[ERROR] ${errorId} Stack:`, err.stack);
    console.error(`[ERROR] ${errorId} Message:`, err.message);
    
    // Don't expose internal error details in production
    const isDevelopment = process.env.NODE_ENV !== 'production';
    
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal server error';
    
    // Handle specific error types
    if (err.name === 'ValidationError') {
        statusCode = 400;
        message = 'Validation error';
    } else if (err.name === 'CastError') {
        statusCode = 400;
        message = 'Invalid data format';
    } else if (err.code === 'ENOENT') {
        statusCode = 404;
        message = 'Resource not found';
    }
    
    const errorResponse = {
        error: {
            id: errorId,
            message,
            timestamp,
            path: req.path,
            method: req.method
        }
    };
    
    if (isDevelopment) {
        errorResponse.error.stack = err.stack;
        errorResponse.error.details = err;
    }
    
    res.status(statusCode).json(errorResponse);
});

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;

// Validate environment variables
if (!JWT_SECRET) {
    console.error('[ERROR] JWT_SECRET is not set in .env file');
    process.exit(1);
}

console.log('[CONFIG] PORT:', PORT);
console.log('[CONFIG] JWT_SECRET:', JWT_SECRET ? '***configured***' : 'NOT SET');
console.log('[CONFIG] NODE_ENV:', process.env.NODE_ENV || 'development');

// Initialize dynamic data fetching system with seed data
initializeDynamicDataSystem().catch(console.error);

// Start cache warming
CacheWarming.warmCriticalData().catch(console.error);

app.listen(PORT, () => {
    console.log(`\n[SERVER] ✓ Toilet Review System server is running on port ${PORT}`);
    console.log(`[SERVER] ✓ Access the application at: http://localhost:${PORT}`);
    console.log(`[SERVER] ✓ Admin panel available at: http://localhost:${PORT}/admin.html`);
    console.log(`[SERVER] ✓ SLO monitoring active`);
    console.log(`[SERVER] ✓ Ready to accept connections\n`);

    // Log SLO targets on startup
    console.log('[SLO] Service Level Objectives:');
    console.log('[SLO]', JSON.stringify(sloServiceInstance.getSLOTargets(), null, 2));
    console.log('');
});
