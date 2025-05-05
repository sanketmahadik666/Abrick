const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    toiletId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Toilet',
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    cleanliness: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    maintenance: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    accessibility: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Update toilet average rating after saving a review
reviewSchema.post('save', async function() {
    const Toilet = mongoose.model('Toilet');
    
    const reviews = await this.constructor.find({ toiletId: this.toiletId });
    const totalReviews = reviews.length;
    
    const averageRating = reviews.reduce((acc, review) => {
        return acc + (review.rating + review.cleanliness + review.maintenance + review.accessibility) / 4;
    }, 0) / totalReviews;

    await Toilet.findByIdAndUpdate(this.toiletId, {
        averageRating: averageRating.toFixed(1),
        totalReviews
    });
});

// Update toilet average rating after deleting a review
reviewSchema.post('remove', async function() {
    const Toilet = mongoose.model('Toilet');
    
    const reviews = await this.constructor.find({ toiletId: this.toiletId });
    const totalReviews = reviews.length;
    
    if (totalReviews === 0) {
        await Toilet.findByIdAndUpdate(this.toiletId, {
            averageRating: 0,
            totalReviews: 0
        });
        return;
    }

    const averageRating = reviews.reduce((acc, review) => {
        return acc + (review.rating + review.cleanliness + review.maintenance + review.accessibility) / 4;
    }, 0) / totalReviews;

    await Toilet.findByIdAndUpdate(this.toiletId, {
        averageRating: averageRating.toFixed(1),
        totalReviews
    });
});

module.exports = mongoose.model('Review', reviewSchema); 