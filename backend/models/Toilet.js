const mongoose = require('mongoose');

const toiletSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    location: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    coordinates: {
        latitude: {
            type: Number,
            required: true
        },
        longitude: {
            type: Number,
            required: true
        }
    },
    facilities: [{
        type: String,
        enum: ['handicap', 'baby_change', 'shower', 'bidet', 'paper_towel', 'hand_dryer']
    }],
    averageRating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    totalReviews: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt timestamp before saving
toiletSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Add indexes for better query performance
toiletSchema.index({ coordinates: '2dsphere' });
toiletSchema.index({ name: 'text', location: 'text' });

module.exports = mongoose.model('Toilet', toiletSchema); 