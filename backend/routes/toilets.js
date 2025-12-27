const express = require('express');
const router = express.Router();
const Toilet = require('../models/Toilet');
const PublicToiletService = require('../services/PublicToiletService');
const { protect, admin } = require('../middleware/auth');
const qrcode = require('qrcode');

// Get toilet statistics
router.get('/stats', async (req, res) => {
    try {
        const stats = await PublicToiletService.getStats();
        res.json(stats);
    } catch (err) {
        console.error('[TOILET] Error getting stats:', err.message);
        res.status(500).json({ success: false, message: 'Error fetching toilet statistics' });
    }
});

// Generate QR code for toilet
router.get('/:id/qr', async (req, res) => {
    try {
        const toilet = await Toilet.findById(req.params.id);
        if (!toilet) {
            return res.status(404).json({ success: false, message: 'Toilet not found' });
        }

        // Create QR code data - just the URL directly (simpler for scanning)
        const reviewUrl = `${req.protocol}://${req.get('host')}/review.html?id=${toilet.id}`;

        console.log(`[QR] Generating QR code for toilet: ${toilet.name} (${toilet.id})`);
        console.log(`[QR] Review URL: ${reviewUrl}`);
        console.log(`[QR] Protocol: ${req.protocol}, Host: ${req.get('host')}`);
        console.log(`[QR] Full URL length: ${reviewUrl.length} characters`);

        // Generate QR code as data URL using just the URL
        const qrCodeDataURL = await qrcode.toDataURL(reviewUrl, {
            errorCorrectionLevel: 'M',
            type: 'image/png',
            quality: 0.92,
            margin: 1,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        });

        res.json({
            success: true,
            data: {
                toiletId: toilet.id,
                toiletName: toilet.name,
                qrCode: qrCodeDataURL,
                reviewUrl: reviewUrl
            }
        });

    } catch (err) {
        console.error('[QR] Error generating QR code:', err.message);
        res.status(500).json({ success: false, message: 'Error generating QR code' });
    }
});

// Get toilets for map display (hybrid public/private system) - SCALABLE VERSION
router.get('/map', async (req, res) => {
    try {
        const {
            showPublic = 'true',
            showPrivate = 'true',
            bounds,
            limit = '1000', // Default limit for performance
            offset = '0',
            zoom, // Map zoom level for optimization
            clusters = 'true' // Enable clustering for large datasets
        } = req.query;

        console.log('[TOILET] Fetching toilets for map - Public:', showPublic, 'Private:', showPrivate, 'Limit:', limit);

        const typesToInclude = [];

        // Build types array based on query params
        if (showPublic === 'true') typesToInclude.push('public');
        if (showPrivate === 'true') typesToInclude.push('private');

        if (typesToInclude.length === 0) {
            console.log('[TOILET] No toilet types selected');
            return res.json([]);
        }

        let query = { type: { $in: typesToInclude } };
        let toilets = [];

        // Apply spatial filtering for bounds (viewport optimization)
        if (bounds) {
            const boundsArray = bounds.split(',').map(Number);
            if (boundsArray.length === 4) {
                const [south, west, north, east] = boundsArray;

                // Add spatial filter to query
                query.spatialBounds = { south, west, north, east };
            }
        }

        // Get toilets with optimized in-memory filtering
        const limitNum = Math.min(parseInt(limit), 1000);
        const offsetNum = parseInt(offset);

        toilets = await Toilet.find(query);

        // Apply spatial filtering if bounds provided
        if (query.spatialBounds) {
            const { south, west, north, east } = query.spatialBounds;
            toilets = toilets.filter(toilet => {
                if (!toilet.coordinates) return false;
                const lat = toilet.coordinates.latitude;
                const lng = toilet.coordinates.longitude;
                return lat >= south && lat <= north && lng >= west && lng <= east;
            });
        }

        // Apply sorting (verified first, then rating, then reviews)
        toilets.sort((a, b) => {
            if (a.verified !== b.verified) return b.verified - a.verified;
            if (a.averageRating !== b.averageRating) return (b.averageRating || 0) - (a.averageRating || 0);
            return (b.totalReviews || 0) - (a.totalReviews || 0);
        });

        // Apply pagination
        const startIndex = offsetNum;
        const endIndex = startIndex + limitNum;
        toilets = toilets.slice(startIndex, endIndex);

        console.log(`[TOILET] Returning ${toilets.length} toilets (${typesToInclude.join('+')})`);

        // If requesting public toilets and bounds provided, trigger background sync
        if (showPublic === 'true' && bounds && typesToInclude.includes('public')) {
            try {
                const boundsArray = bounds.split(',').map(Number);
                if (boundsArray.length === 4) {
                    const [south, west, north, east] = boundsArray;
                    const boundsString = `(${south},${west},${north},${east})`;

                    // Background sync for data freshness (non-blocking)
                    setImmediate(async () => {
                        try {
                            await PublicToiletService.syncPublicData(boundsString);
                        } catch (error) {
                            console.warn('[TOILET] Background sync failed:', error.message);
                        }
                    });
                }
            } catch (error) {
                console.warn('[TOILET] Bounds parsing failed:', error.message);
            }
        }

        // Optimize response payload for large datasets
        const optimizedToilets = toilets.map(t => ({
            id: t.id || t._id,
            name: t.name,
            location: t.location,
            coordinates: t.coordinates,
            facilities: t.facilities,
            averageRating: t.averageRating,
            totalReviews: t.totalReviews,
            type: t.type,
            source: t.source,
            verified: t.verified,
            // Exclude heavy fields for map display
            // description: t.description, // Commented out for performance
            // lastSynced: t.lastSynced  // Commented out for performance
        }));

        // Standardize response format
        const { toilets: storage } = require('../models/storage');
        const totalCount = storage.countDocuments(query);

        const response = {
            success: true,
            data: optimizedToilets,
            metadata: {
                total: totalCount,
                limit: parseInt(limit),
                offset: parseInt(offset),
                hasMore: optimizedToilets.length === parseInt(limit),
                returned: optimizedToilets.length
            }
        };

        res.json(response);

    } catch (err) {
        console.error('[TOILET] Error fetching toilets for map:', err.message);
        res.status(500).json({ message: 'Error fetching toilets' });
    }
});

// Get single toilet by ID (supports both public and private)
router.get('/:id', async (req, res) => {
    try {
        const toilet = await Toilet.findById(req.params.id);
        if (!toilet) {
            return res.status(404).json({ success: false, message: 'Toilet not found' });
        }
        res.json({ success: true, data: toilet.toObject() });
    } catch (err) {
        console.error('Error fetching toilet:', err);
        res.status(500).json({ success: false, message: 'Error fetching toilet details' });
    }
});

// Add private toilet (admin only - requires authentication)
router.post('/add-private', protect, admin, async (req, res) => {
    try {
        console.log('[TOILET] Add private toilet request:', req.body.name);

        const toiletData = {
            ...req.body,
            type: 'private',
            verified: true
        };

        const toilet = new Toilet(toiletData);
        await toilet.save();

        console.log('[TOILET] Successfully added private toilet:', toilet.name, 'with ID:', toilet.id);
        res.status(201).json(toilet.toObject());

    } catch (err) {
        console.error('[TOILET] Error adding private toilet:', err.message);
        res.status(500).json({ message: 'Error adding private toilet' });
    }
});

// Sync public toilet data (public endpoint for map auto-loading)
router.post('/sync-public', async (req, res) => {
    try {
        const { bounds, sources = ['osm', 'government'] } = req.body;

        console.log('[TOILET] Syncing public data for bounds:', bounds);

        if (!bounds) {
            return res.status(400).json({ message: 'Bounds parameter required' });
        }

        const result = await PublicToiletService.syncPublicData(bounds);
        res.json({
            success: true,
            message: `Synced ${result.synced} new public toilets`,
            synced: result.synced
        });

    } catch (err) {
        console.error('[TOILET] Error syncing public data:', err.message);
        res.status(500).json({ message: 'Error syncing public toilet data' });
    }
});

// Legacy route for backward compatibility - NO AUTH required for easier testing
router.post('/add', async (req, res) => {
    try {
        console.log('[TOILET] Legacy add toilet request:', req.body.name);

        const toiletData = {
            ...req.body,
            type: req.body.type || 'private',
            verified: true
        };

        const toilet = new Toilet(toiletData);
        await toilet.save();

        console.log('[TOILET] Successfully added private toilet (legacy):', toilet.name, 'with ID:', toilet.id);
        res.status(201).json({ success: true, data: toilet.toObject() });

    } catch (err) {
        console.error('[TOILET] Error adding toilet (legacy):', err.message);
        res.status(500).json({ success: false, message: 'Error adding toilet' });
    }
});

// Legacy PUT route for backward compatibility (REQUIRES AUTH)
router.put('/:id', protect, admin, async (req, res) => {
    try {
        const toilet = await Toilet.findById(req.params.id);
        if (!toilet) {
            return res.status(404).json({ success: false, message: 'Toilet not found' });
        }

        Object.assign(toilet, req.body);
        toilet.updatedAt = new Date();
        await toilet.save();

        res.json({ success: true, data: toilet.toObject() });
    } catch (err) {
        console.error('Error updating toilet (legacy):', err);
        res.status(500).json({ success: false, message: 'Error updating toilet' });
    }
});

// Legacy DELETE route for backward compatibility (REQUIRES AUTH)
router.delete('/:id', protect, admin, async (req, res) => {
    try {
        const toilet = await Toilet.findById(req.params.id);
        if (!toilet) {
            return res.status(404).json({ success: false, message: 'Toilet not found' });
        }

        await toilet.remove();
        res.json({ success: true, message: 'Toilet deleted successfully' });
    } catch (err) {
        console.error('Error deleting toilet (legacy):', err);
        res.status(500).json({ success: false, message: 'Error deleting toilet' });
    }
});

// Debug endpoint to check stored data
router.get('/debug/all', async (req, res) => {
    try {
        console.log('[DEBUG] Fetching all toilets from storage...');
        const { toilets: storage } = require('../models/storage');
        
        // Get all toilets directly from storage
        const allToilets = storage.find({});
        console.log('[DEBUG] Found toilets:', allToilets.length);
        
        // Show types distribution
        const typeCount = {};
        allToilets.forEach(toilet => {
            typeCount[toilet.type] = (typeCount[toilet.type] || 0) + 1;
        });
        console.log('[DEBUG] Type distribution:', typeCount);
        
        res.json({
            success: true,
            data: allToilets,
            metadata: {
                total: allToilets.length,
                typeCount: typeCount
            }
        });
    } catch (err) {
        console.error('[DEBUG] Error fetching all toilets:', err.message);
        res.status(500).json({ success: false, message: 'Error fetching debug data' });
    }
});

module.exports = router;
