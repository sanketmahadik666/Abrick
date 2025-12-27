const request = require('supertest');
const express = require('express');
const reviewRoutes = require('../../routes/reviews');
const { reviews, toilets } = require('../../models/storage');

// Create test app
const app = express();
app.use(express.json());
app.use('/api/review', reviewRoutes);

describe('Review Routes', () => {
    beforeEach(() => {
        // Clear arrays completely
        reviews.splice(0, reviews.length);
        toilets.splice(0, toilets.length);

        // Add sample toilet for testing
        toilets.push({
            id: 'test-toilet-1',
            name: 'Test Toilet',
            location: 'Test Location',
            description: 'Test Description',
            coordinates: { latitude: 40.7128, longitude: -74.0060 },
            facilities: ['handicap'],
            averageRating: 4.0,
            totalReviews: 2,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        // Add sample reviews
        reviews.push({
            id: 'review-1',
            toiletId: 'test-toilet-1',
            rating: 5,
            cleanliness: 4,
            maintenance: 5,
            accessibility: 4,
            comment: 'Great toilet!',
            createdAt: new Date()
        });
        reviews.push({
            id: 'review-2',
            toiletId: 'test-toilet-1',
            rating: 3,
            cleanliness: 3,
            maintenance: 2,
            accessibility: 4,
            comment: 'Could be cleaner',
            createdAt: new Date()
        });
    });

    afterEach(() => {
        // Clean up after each test
        reviews.splice(0, reviews.length);
        toilets.splice(0, toilets.length);
    });

    describe('POST /api/review/submit', () => {
        test('should submit a new review successfully', async () => {
            const reviewData = {
                toiletId: 'test-toilet-1',
                rating: 4,
                cleanliness: 4,
                maintenance: 4,
                accessibility: 5,
                comment: 'Very clean and accessible'
            };

            const response = await request(app)
                .post('/api/review/submit')
                .send(reviewData)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.review).toBeDefined();
            expect(response.body.review.id).toBeDefined();
            expect(response.body.review.rating).toBe(4);
            expect(response.body.review.comment).toBe('Very clean and accessible');
        });

        test('should validate required fields - missing toiletId', async () => {
            const response = await request(app)
                .post('/api/review/submit')
                .send({
                    rating: 4,
                    cleanliness: 4,
                    maintenance: 4,
                    accessibility: 5,
                    comment: 'Test review'
                })
                .expect(400);

            expect(response.body.message).toBeDefined();
        });

        test('should validate required fields - missing rating', async () => {
            const response = await request(app)
                .post('/api/review/submit')
                .send({
                    toiletId: 'test-toilet-1',
                    cleanliness: 4,
                    maintenance: 4,
                    accessibility: 5,
                    comment: 'Test review'
                })
                .expect(400);

            expect(response.body.message).toBeDefined();
        });

        test('should validate rating range - too low', async () => {
            const response = await request(app)
                .post('/api/review/submit')
                .send({
                    toiletId: 'test-toilet-1',
                    rating: 0, // Invalid rating
                    cleanliness: 4,
                    maintenance: 4,
                    accessibility: 5,
                    comment: 'Test review'
                })
                .expect(400);

            expect(response.body.message).toBeDefined();
        });

        test('should validate rating range - too high', async () => {
            const response = await request(app)
                .post('/api/review/submit')
                .send({
                    toiletId: 'test-toilet-1',
                    rating: 6, // Invalid rating
                    cleanliness: 4,
                    maintenance: 4,
                    accessibility: 5,
                    comment: 'Test review'
                })
                .expect(400);

            expect(response.body.message).toBeDefined();
        });

        test('should validate cleanliness range', async () => {
            const response = await request(app)
                .post('/api/review/submit')
                .send({
                    toiletId: 'test-toilet-1',
                    rating: 4,
                    cleanliness: 6, // Invalid cleanliness
                    maintenance: 4,
                    accessibility: 5,
                    comment: 'Test review'
                })
                .expect(400);

            expect(response.body.message).toBeDefined();
        });

        test('should handle missing optional comment', async () => {
            const response = await request(app)
                .post('/api/review/submit')
                .send({
                    toiletId: 'test-toilet-1',
                    rating: 4,
                    cleanliness: 4,
                    maintenance: 4,
                    accessibility: 5
                    // No comment - should be optional
                })
                .expect(201);

            expect(response.body.review.comment).toBeUndefined();
        });

        test('should handle empty comment', async () => {
            const response = await request(app)
                .post('/api/review/submit')
                .send({
                    toiletId: 'test-toilet-1',
                    rating: 4,
                    cleanliness: 4,
                    maintenance: 4,
                    accessibility: 5,
                    comment: ''
                })
                .expect(201);

            expect(response.body.review.comment).toBe('');
        });

        test('should handle very long comments', async () => {
            const longComment = 'A'.repeat(1000);
            const response = await request(app)
                .post('/api/review/submit')
                .send({
                    toiletId: 'test-toilet-1',
                    rating: 4,
                    cleanliness: 4,
                    maintenance: 4,
                    accessibility: 5,
                    comment: longComment
                })
                .expect(201);

            expect(response.body.review.comment).toBe(longComment);
        });

        test('should return 404 for non-existent toilet', async () => {
            const reviewData = {
                toiletId: 'non-existent-toilet',
                rating: 4,
                cleanliness: 4,
                maintenance: 4,
                accessibility: 5,
                comment: 'Test review'
            };

            const response = await request(app)
                .post('/api/review/submit')
                .send(reviewData)
                .expect(404);

            expect(response.body.message).toContain('not found');
        });
    });

    describe('GET /api/review/toilet/:toiletId', () => {
        test('should return all reviews for a toilet', async () => {
            const response = await request(app)
                .get('/api/review/toilet/test-toilet-1')
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBe(2);
            expect(response.body[0].rating).toBeDefined();
            expect(response.body[0].comment).toBeDefined();
        });

        test('should return empty array for toilet with no reviews', async () => {
            const response = await request(app)
                .get('/api/review/toilet/empty-toilet')
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBe(0);
        });
    });

    describe('GET /api/review/all', () => {
        test('should return all reviews (no auth required for demo)', async () => {
            const response = await request(app)
                .get('/api/review/all')
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBe(2);
        });
    });

    describe('DELETE /api/review/:id', () => {
        test('should delete review (no auth required for demo)', async () => {
            const response = await request(app)
                .delete('/api/review/review-1')
                .expect(200);

            expect(response.body.message).toContain('deleted');

            // Verify review is gone
            const allReviews = await request(app)
                .get('/api/review/all')
                .expect(200);

            expect(allReviews.body.length).toBe(1);
            expect(allReviews.body.find(r => r.id === 'review-1')).toBeUndefined();
        });

        test('should return 404 for non-existent review deletion', async () => {
            const response = await request(app)
                .delete('/api/review/non-existent-review')
                .expect(404);

            expect(response.body.message).toContain('not found');
        });
    });

    describe('GET /api/review/stats', () => {
        test('should return review statistics (no auth required for demo)', async () => {
            const response = await request(app)
                .get('/api/review/stats')
                .expect(200);

            expect(response.body.totalReviews).toBeDefined();
            expect(response.body.averages).toBeDefined();
            expect(response.body.averages.avgRating).toBeDefined();
            expect(response.body.averages.avgCleanliness).toBeDefined();
            expect(response.body.averages.avgMaintenance).toBeDefined();
            expect(response.body.averages.avgAccessibility).toBeDefined();
        });
    });
});
