const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Toilet = require('../models/Toilet');
const { protect, admin } = require('../middleware/auth');

// Submit a review (public)
router.post('/submit', async (req, res) => {
    try {
        const { toiletId, rating, cleanliness, maintenance, accessibility, comment } = req.body;

        // Validate required fields
        if (!toiletId || !rating || !cleanliness || !maintenance || !accessibility) {
            return res.status(400).json({ message: 'All rating fields are required' });
        }

        // Validate rating values
        const ratings = [rating, cleanliness, maintenance, accessibility];
        if (ratings.some(r => r < 1 || r > 5)) {
            return res.status(400).json({ message: 'Ratings must be between 1 and 5' });
        }

        // Check if toilet exists
        const toilet = await Toilet.findById(toiletId);
        if (!toilet) {
            return res.status(404).json({ message: 'Toilet not found' });
        }

        // Create new review
        const review = new Review({
            toiletId,
            rating,
            cleanliness,
            maintenance,
            accessibility,
            comment
        });

        await review.save();

        // Update toilet's average rating and total reviews
        const reviews = await Review.find({ toiletId });
        const totalReviews = reviews.length;
        
        // Calculate average rating considering all rating aspects
        const averageRating = reviews.reduce((acc, review) => {
            return acc + (review.rating + review.cleanliness + review.maintenance + review.accessibility) / 4;
        }, 0) / totalReviews;

        // Update toilet with new ratings
        await Toilet.findByIdAndUpdate(toiletId, {
            averageRating: averageRating.toFixed(1),
            totalReviews
        });

        res.status(201).json({ 
            success: true, 
            review,
            message: 'Review submitted successfully'
        });
    } catch (err) {
        console.error('Error submitting review:', err);
        res.status(500).json({ 
            message: 'Error submitting review',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});

// Get all reviews for a toilet (public)
router.get('/toilet/:toiletId', async (req, res) => {
    try {
        const reviews = await Review.find({ toiletId: req.params.toiletId })
            .sort({ createdAt: -1 });
        res.json(reviews);
    } catch (err) {
        console.error('Error fetching reviews:', err);
        res.status(500).json({ message: 'Error fetching reviews' });
    }
});

// Get all reviews (admin only)
router.get('/all', protect, admin, async (req, res) => {
    try {
        const reviews = await Review.find()
            .populate('toiletId', 'name location')
            .sort({ createdAt: -1 });
        res.json(reviews);
    } catch (err) {
        console.error('Error fetching all reviews:', err);
        res.status(500).json({ message: 'Error fetching reviews' });
    }
});

// Delete a review (admin only)
router.delete('/:id', protect, admin, async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);
        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }

        await review.remove();

        // Update toilet's average rating and total reviews
        const toiletId = review.toiletId;
        const reviews = await Review.find({ toiletId });
        const totalReviews = reviews.length;

        if (totalReviews === 0) {
            await Toilet.findByIdAndUpdate(toiletId, {
                averageRating: 0,
                totalReviews: 0
            });
        } else {
            const averageRating = reviews.reduce((acc, review) => {
                return acc + (review.rating + review.cleanliness + review.maintenance + review.accessibility) / 4;
            }, 0) / totalReviews;

            await Toilet.findByIdAndUpdate(toiletId, {
                averageRating: averageRating.toFixed(1),
                totalReviews
            });
        }

        res.json({ success: true, message: 'Review deleted' });
    } catch (err) {
        console.error('Error deleting review:', err);
        res.status(500).json({ message: 'Error deleting review' });
    }
});

// Get review statistics (admin only)
router.get('/stats', protect, admin, async (req, res) => {
    try {
        const totalReviews = await Review.countDocuments();
        const averageRating = await Review.aggregate([
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

        res.json({
            totalReviews,
            averages: averageRating[0] || {
                avgRating: 0,
                avgCleanliness: 0,
                avgMaintenance: 0,
                avgAccessibility: 0
            }
        });
    } catch (err) {
        console.error('Error fetching review stats:', err);
        res.status(500).json({ message: 'Error fetching review statistics' });
    }
});

module.exports = router; 