const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Routes
const authRoutes = require('./routes/auth');
const toiletRoutes = require('./routes/toilets');
const reviewRoutes = require('./routes/reviews');

// Services
const SLOService = require('./services/SLOService');
const sloServiceInstance = SLOService; // This is the singleton instance
const { middleware } = SLOService;

// Models for sample data
const storage = require('./models/storage');
const Toilet = require('./models/Toilet');

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

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', authRoutes);
app.use('/api/toilet', toiletRoutes);
app.use('/api/review', reviewRoutes);

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

// Serve frontend for any other routes
app.get('*', (req, res) => {
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

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(`[ERROR] ${req.method} ${req.path}`);
    console.error(`[ERROR] Stack:`, err.stack);
    console.error(`[ERROR] Message:`, err.message);
    res.status(500).json({ message: 'Something went wrong!' });
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
