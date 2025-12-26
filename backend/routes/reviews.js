const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Toilet = require('../models/Toilet');
const { protect, admin } = require('../middleware/auth');

// Submit a review (public)
router.post('/submit', async (req, res) => {
    try {
        console.log('[REVIEW] Submit review request for toilet ID:', req.body.toiletId, 'Rating:', req.body.rating);
        const { toiletId, rating, cleanliness, maintenance, accessibility, comment } = req.body;

        // Validate required fields
        if (!toiletId || rating === undefined || cleanliness === undefined ||
            maintenance === undefined || accessibility === undefined) {
            console.log('[REVIEW] Submit failed: Missing required fields');
            return res.status(400).json({ message: 'toiletId, rating, cleanliness, maintenance, and accessibility are required' });
        }

        // Validate rating ranges (1-5)
        if (rating < 1 || rating > 5 || cleanliness < 1 || cleanliness > 5 ||
            maintenance < 1 || maintenance > 5 || accessibility < 1 || accessibility > 5) {
            console.log('[REVIEW] Submit failed: Invalid rating ranges');
            return res.status(400).json({ message: 'All ratings must be between 1 and 5' });
        }

        // Check if toilet exists
        const toilet = await Toilet.findById(toiletId);
        if (!toilet) {
            console.log('[REVIEW] Submit failed: Toilet not found:', toiletId);
            return res.status(404).json({ message: 'Toilet not found' });
        }

        const review = new Review({
            toiletId,
            rating: parseInt(rating),
            cleanliness: parseInt(cleanliness),
            maintenance: parseInt(maintenance),
            accessibility: parseInt(accessibility),
            comment: comment || ''
        });

        await review.save();
        console.log('[REVIEW] Successfully submitted review for toilet:', toilet.name);

        // Update toilet's average rating and total reviews
        const reviews = await Review.find({ toiletId });
        const totalReviews = reviews.length;
        const averageRating = reviews.reduce((acc, review) => {
            return acc + (review.rating + review.cleanliness + review.maintenance + review.accessibility) / 4;
        }, 0) / totalReviews;

        toilet.averageRating = parseFloat(averageRating.toFixed(1));
        toilet.totalReviews = totalReviews;
        await toilet.save();
        console.log('[REVIEW] Updated toilet stats - Average Rating:', toilet.averageRating, 'Total Reviews:', totalReviews);

        res.status(201).json({ success: true, review: review.toObject() });
    } catch (err) {
        console.error('[REVIEW] Error submitting review:', err.message);
        res.status(500).json({ message: 'Error submitting review' });
    }
});

// Get all reviews for a toilet (public)
router.get('/toilet/:toiletId', async (req, res) => {
    try {
        const reviews = await Review.find({ toiletId: req.params.toiletId });
        res.json(reviews.map(r => r.toObject()));
    } catch (err) {
        console.error('Error fetching reviews:', err);
        res.status(500).json({ message: 'Error fetching reviews' });
    }
});

// Get all reviews (public for demo)
router.get('/all', async (req, res) => {
    try {
        console.log('[REVIEW] Fetching all reviews');
        const reviews = await Review.find();
        console.log('[REVIEW] Found', reviews.length, 'reviews');
        // For simplicity, return reviews without populate
        res.json(reviews.map(r => r.toObject()));
    } catch (err) {
        console.error('[REVIEW] Error fetching all reviews:', err.message);
        res.status(500).json({ message: 'Error fetching reviews' });
    }
});

// Delete a review (public for demo)
router.delete('/:id', async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);
        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }

        const toiletId = review.toiletId;
        await review.remove();

        // Update toilet's average rating and total reviews
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
                averageRating: parseFloat(averageRating.toFixed(1)),
                totalReviews
            });
        }

        res.json({ success: true, message: 'Review deleted' });
    } catch (err) {
        console.error('Error deleting review:', err);
        res.status(500).json({ message: 'Error deleting review' });
    }
});

// Get review statistics (public for demo)
router.get('/stats', async (req, res) => {
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