const express = require('express');
const router = express.Router();
const Toilet = require('../models/Toilet');
const { protect, admin } = require('../middleware/auth');

// Get all toilets (public)
router.get('/map', async (req, res) => {
    try {
        console.log('[TOILET] Fetching all toilets for map');
        const toilets = await Toilet.find();
        console.log('[TOILET] Found', toilets.length, 'toilets');
        res.json(toilets.map(t => ({
            id: t.id,
            name: t.name,
            location: t.location,
            description: t.description,
            coordinates: t.coordinates,
            facilities: t.facilities,
            averageRating: t.averageRating,
            totalReviews: t.totalReviews
        })));
    } catch (err) {
        console.error('[TOILET] Error fetching toilets:', err.message);
        res.status(500).json({ message: 'Error fetching toilets' });
    }
});

// Get single toilet (public)
router.get('/:id', async (req, res) => {
    try {
        const toilet = await Toilet.findById(req.params.id);
        if (!toilet) {
            return res.status(404).json({ message: 'Toilet not found' });
        }
        res.json(toilet.toObject());
    } catch (err) {
        console.error('Error fetching toilet:', err);
        res.status(500).json({ message: 'Error fetching toilet details' });
    }
});

// Add new toilet (public for demo)
router.post('/add', async (req, res) => {
    try {
        console.log('[TOILET] Add toilet request:', req.body.name);
        const { name, location, description, coordinates, facilities } = req.body;

        // Validate required fields
        if (!name || !location || !coordinates || !coordinates.latitude || !coordinates.longitude) {
            console.log('[TOILET] Add failed: Missing required fields');
            return res.status(400).json({ message: 'Name, location, and coordinates (latitude, longitude) are required' });
        }

        // Validate coordinate ranges
        if (coordinates.latitude < -90 || coordinates.latitude > 90 ||
            coordinates.longitude < -180 || coordinates.longitude > 180) {
            console.log('[TOILET] Add failed: Invalid coordinates');
            return res.status(400).json({ message: 'Invalid coordinate values' });
        }

        const toilet = new Toilet({
            name,
            location,
            description,
            coordinates,
            facilities: facilities || []
        });

        await toilet.save();
        console.log('[TOILET] Successfully added toilet:', name, 'with ID:', toilet.id);
        res.status(201).json(toilet.toObject());
    } catch (err) {
        console.error('[TOILET] Error adding toilet:', err.message);
        res.status(500).json({ message: 'Error adding toilet' });
    }
});

// Update toilet (public for demo)
router.put('/:id', async (req, res) => {
    try {
        const { name, location, description, coordinates, facilities } = req.body;

        const toilet = await Toilet.findById(req.params.id);
        if (!toilet) {
            return res.status(404).json({ message: 'Toilet not found' });
        }

        toilet.name = name || toilet.name;
        toilet.location = location || toilet.location;
        toilet.description = description || toilet.description;
        toilet.coordinates = coordinates || toilet.coordinates;
        toilet.facilities = facilities || toilet.facilities;

        await toilet.save();
        res.json({ success: true, toilet: toilet.toObject() });
    } catch (err) {
        console.error('Error updating toilet:', err);
        res.status(500).json({ message: 'Error updating toilet' });
    }
});

// Delete toilet (public for demo)
router.delete('/:id', async (req, res) => {
    try {
        console.log('[TOILET] Delete request for toilet ID:', req.params.id);
        const toilet = await Toilet.findById(req.params.id);
        if (!toilet) {
            console.log('[TOILET] Delete failed: Toilet not found:', req.params.id);
            return res.status(404).json({ message: 'Toilet not found' });
        }

        const toiletName = toilet.name;
        await toilet.remove();
        console.log('[TOILET] Successfully deleted toilet:', toiletName);
        res.json({ success: true, message: 'Toilet removed' });
    } catch (err) {
        console.error('[TOILET] Error deleting toilet:', err.message);
        res.status(500).json({ message: 'Error deleting toilet' });
    }
});

// Search toilets by location (public)
router.get('/search/nearby', async (req, res) => {
    try {
        const { lat, lng, radius = 5000 } = req.query; // radius in meters, default 5km

        const toilets = await Toilet.find({
            coordinates: {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [parseFloat(lng), parseFloat(lat)]
                    },
                    $maxDistance: parseInt(radius)
                }
            }
        });

        res.json(toilets);
    } catch (err) {
        console.error('Error searching toilets:', err);
        res.status(500).json({ message: 'Error searching toilets' });
    }
});

module.exports = router; 