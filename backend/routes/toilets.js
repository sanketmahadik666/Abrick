const express = require('express');
const router = express.Router();
const Toilet = require('../models/Toilet');
const { protect, admin } = require('../middleware/auth');

// Get all toilets (public)
router.get('/map', async (req, res) => {
    try {
        const toilets = await Toilet.find()
            .select('name location description coordinates facilities averageRating totalReviews');
        res.json(toilets);
    } catch (err) {
        console.error('Error fetching toilets:', err);
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
        res.json(toilet);
    } catch (err) {
        console.error('Error fetching toilet:', err);
        res.status(500).json({ message: 'Error fetching toilet details' });
    }
});

// Add new toilet (admin only)
router.post('/add', protect, admin, async (req, res) => {
    try {
        const { name, location, description, coordinates, facilities } = req.body;

        const toilet = new Toilet({
            name,
            location,
            description,
            coordinates,
            facilities
        });

        await toilet.save();
        res.status(201).json({ success: true, toilet });
    } catch (err) {
        console.error('Error adding toilet:', err);
        res.status(500).json({ message: 'Error adding toilet' });
    }
});

// Update toilet (admin only)
router.put('/:id', protect, admin, async (req, res) => {
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
        res.json({ success: true, toilet });
    } catch (err) {
        console.error('Error updating toilet:', err);
        res.status(500).json({ message: 'Error updating toilet' });
    }
});

// Delete toilet (admin only)
router.delete('/:id', protect, admin, async (req, res) => {
    try {
        const toilet = await Toilet.findById(req.params.id);
        if (!toilet) {
            return res.status(404).json({ message: 'Toilet not found' });
        }

        await toilet.remove();
        res.json({ success: true, message: 'Toilet removed' });
    } catch (err) {
        console.error('Error deleting toilet:', err);
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