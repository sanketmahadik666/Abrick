const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Routes
const authRoutes = require('./routes/auth');
const toiletRoutes = require('./routes/toilets');
const reviewRoutes = require('./routes/reviews');

// Models for sample data
const { toilets } = require('./models/storage');
const Toilet = require('./models/Toilet');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
app.use('/api/toilet', toiletRoutes);
app.use('/api/review', reviewRoutes);

// Serve frontend for any other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../index.html'));
});

// Initialize sample data if no toilets exist
function initializeSampleData() {
    console.log('[INIT] Checking if sample data needs to be initialized...');

    if (toilets.length === 0) {
        console.log('[INIT] No toilets found, adding sample data...');

        const sampleToilets = [
            {
                name: 'Central Park Restroom',
                location: 'Central Park, New York',
                description: 'Modern facility with full amenities in the heart of Central Park',
                coordinates: { latitude: 40.7829, longitude: -73.9654 },
                facilities: ['handicap', 'baby_change', 'shower', 'paper_towel'],
                averageRating: 4.2,
                totalReviews: 15
            },
            {
                name: 'Times Square Public Toilet',
                location: 'Times Square, Manhattan',
                description: 'Busy location with quick access facilities',
                coordinates: { latitude: 40.7580, longitude: -73.9855 },
                facilities: ['handicap', 'paper_towel', 'hand_dryer'],
                averageRating: 3.8,
                totalReviews: 23
            },
            {
                name: 'Brooklyn Bridge Facility',
                location: 'Brooklyn Bridge Park',
                description: 'Scenic location with clean, well-maintained facilities',
                coordinates: { latitude: 40.7017, longitude: -73.9950 },
                facilities: ['handicap', 'baby_change', 'bidet', 'paper_towel'],
                averageRating: 4.5,
                totalReviews: 8
            },
            {
                name: 'Grand Central Terminal',
                location: 'Grand Central Terminal, Midtown',
                description: 'High-traffic area with multiple facilities',
                coordinates: { latitude: 40.7527, longitude: -73.9772 },
                facilities: ['handicap', 'shower', 'bidet', 'paper_towel', 'hand_dryer'],
                averageRating: 4.0,
                totalReviews: 31
            },
            {
                name: 'Battery Park Comfort Station',
                location: 'Battery Park, Lower Manhattan',
                description: 'Waterfront location with modern amenities',
                coordinates: { latitude: 40.7033, longitude: -74.0170 },
                facilities: ['handicap', 'baby_change', 'shower', 'bidet'],
                averageRating: 3.5,
                totalReviews: 12
            }
        ];

        sampleToilets.forEach((toiletData, index) => {
            try {
                const toilet = new Toilet(toiletData);
                toilet.save();
                console.log(`[INIT] Added sample toilet: ${toilet.name}`);
            } catch (error) {
                console.error(`[INIT] Error adding sample toilet ${index}:`, error);
            }
        });

        console.log(`[INIT] Successfully added ${sampleToilets.length} sample toilets`);
    } else {
        console.log(`[INIT] Found ${toilets.length} existing toilets, skipping sample data initialization`);
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

// Initialize sample data
initializeSampleData();

app.listen(PORT, () => {
    console.log(`\n[SERVER] ✓ Toilet Review System server is running on port ${PORT}`);
    console.log(`[SERVER] ✓ Access the application at: http://localhost:${PORT}`);
    console.log(`[SERVER] ✓ Admin panel available at: http://localhost:${PORT}/admin.html`);
    console.log(`[SERVER] ✓ Ready to accept connections\n`);
}); 