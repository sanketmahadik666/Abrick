const request = require('supertest');
const express = require('express');
const authRoutes = require('../routes/auth');
const toiletRoutes = require('../routes/toilets');
const reviewRoutes = require('../routes/reviews');
const { users, toilets, reviews } = require('../models/storage');

// Create test app with all routes
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/toilet', toiletRoutes);
app.use('/api/review', reviewRoutes);

describe('Integration Tests - Full Application Flow', () => {
    beforeAll(() => {
        // Set test environment
        process.env.JWT_SECRET = 'integration_test_secret';
        process.env.NODE_ENV = 'test';
    });

    beforeEach(() => {
        // Clear all data completely
        users.splice(0, users.length);
        toilets.splice(0, toilets.length);
        reviews.splice(0, reviews.length);
    });

    afterEach(() => {
        // Clean up after each test
        users.splice(0, users.length);
        toilets.splice(0, toilets.length);
        reviews.splice(0, reviews.length);
    });

    afterAll(() => {
        // Clean up environment
        delete process.env.JWT_SECRET;
        delete process.env.NODE_ENV;
    });

    describe('Complete User Journey', () => {
        test('should complete full toilet review workflow', async () => {
            // 1. Register a user
            const registerResponse = await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'user@example.com',
                    password: 'password123'
                })
                .expect(201);

            expect(registerResponse.body.token).toBeDefined();
            expect(registerResponse.body.user.email).toBe('user@example.com');

            // 2. Login with the user
            const loginResponse = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'user@example.com',
                    password: 'password123'
                })
                .expect(200);

            expect(loginResponse.body.token).toBeDefined();
            const token = loginResponse.body.token;

            // 3. Add a new toilet
            const toiletData = {
                name: 'Central Park Toilet',
                location: 'Central Park, New York',
                description: 'Modern facility with excellent amenities',
                coordinates: { latitude: 40.7829, longitude: -73.9654 },
                facilities: ['handicap', 'baby_change', 'shower']
            };

            const addToiletResponse = await request(app)
                .post('/api/toilet/add')
                .send(toiletData)
                .expect(201);

            expect(addToiletResponse.body.id).toBeDefined();
            const toiletId = addToiletResponse.body.id;

            // 4. Get toilet details
            const getToiletResponse = await request(app)
                .get(`/api/toilet/${toiletId}`)
                .expect(200);

            expect(getToiletResponse.body.name).toBe('Central Park Toilet');
            expect(getToiletResponse.body.averageRating).toBe(0);
            expect(getToiletResponse.body.totalReviews).toBe(0);

            // 5. Submit a review for the toilet
            const reviewData = {
                toiletId: toiletId,
                rating: 5,
                cleanliness: 4,
                maintenance: 5,
                accessibility: 5,
                comment: 'Excellent facility, very clean and accessible!'
            };

            const submitReviewResponse = await request(app)
                .post('/api/review/submit')
                .send(reviewData)
                .expect(201);

            expect(submitReviewResponse.body.id).toBeDefined();
            const reviewId = submitReviewResponse.body.id;

            // 6. Check that toilet stats were updated
            const updatedToiletResponse = await request(app)
                .get(`/api/toilet/${toiletId}`)
                .expect(200);

            expect(updatedToiletResponse.body.averageRating).toBe(4.8); // (5+4+5+5)/4 = 4.75, rounded to 4.8
            expect(updatedToiletResponse.body.totalReviews).toBe(1);

            // 7. Get reviews for the toilet
            const getReviewsResponse = await request(app)
                .get(`/api/review/toilet/${toiletId}`)
                .expect(200);

            expect(getReviewsResponse.body).toHaveLength(1);
            expect(getReviewsResponse.body[0].comment).toBe('Excellent facility, very clean and accessible!');

            // 8. Get all toilets for map display
            const mapResponse = await request(app)
                .get('/api/toilet/map')
                .expect(200);

            expect(mapResponse.body).toHaveLength(1);
            expect(mapResponse.body[0].name).toBe('Central Park Toilet');

            // 9. Get review statistics
            const statsResponse = await request(app)
                .get('/api/review/stats')
                .expect(200);

            expect(statsResponse.body.totalReviews).toBe(1);
            expect(statsResponse.body.averages.avgRating).toBe(5);

            // 10. Get current user info
            const meResponse = await request(app)
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            expect(meResponse.body.email).toBe('user@example.com');
            expect(meResponse.body.role).toBe('admin');

            // 11. Submit another review
            const reviewData2 = {
                toiletId: toiletId,
                rating: 3,
                cleanliness: 3,
                maintenance: 2,
                accessibility: 4,
                comment: 'Decent but could be cleaner'
            };

            await request(app)
                .post('/api/review/submit')
                .send(reviewData2)
                .expect(201);

            // 12. Verify updated stats
            const finalToiletResponse = await request(app)
                .get(`/api/toilet/${toiletId}`)
                .expect(200);

            expect(finalToiletResponse.body.totalReviews).toBe(2);
            // Average should be updated

            // 13. Get all reviews
            const allReviewsResponse = await request(app)
                .get('/api/review/all')
                .expect(200);

            expect(allReviewsResponse.body).toHaveLength(2);

            // 14. Delete a review
            await request(app)
                .delete(`/api/review/${reviewId}`)
                .expect(200);

            // 15. Verify review was deleted and stats updated
            const finalReviewsResponse = await request(app)
                .get('/api/review/toilet/${toiletId}')
                .expect(200);

            expect(finalReviewsResponse.body).toHaveLength(1);
        });

        test('should handle concurrent operations safely', async () => {
            // Add a toilet
            const toiletResponse = await request(app)
                .post('/api/toilet/add')
                .send({
                    name: 'Test Toilet',
                    location: 'Test Location',
                    coordinates: { latitude: 0, longitude: 0 }
                })
                .expect(201);

            const toiletId = toiletResponse.body.id;

            // Submit multiple reviews concurrently
            const reviewPromises = [1, 2, 3, 4, 5].map(i =>
                request(app)
                    .post('/api/review/submit')
                    .send({
                        toiletId,
                        rating: i,
                        cleanliness: i,
                        maintenance: i,
                        accessibility: i,
                        comment: `Review ${i}`
                    })
            );

            const results = await Promise.all(reviewPromises);
            results.forEach(result => expect(result.status).toBe(201));

            // Verify all reviews were added
            const reviewsResponse = await request(app)
                .get(`/api/review/toilet/${toiletId}`)
                .expect(200);

            expect(reviewsResponse.body).toHaveLength(5);
        });

        test('should handle edge cases gracefully', async () => {
            // Test with invalid data that should be rejected
            await request(app)
                .post('/api/toilet/add')
                .send({ invalid: 'data' })
                .expect(400);

            await request(app)
                .post('/api/review/submit')
                .send({ invalid: 'data' })
                .expect(400);

            // Test accessing non-existent resources
            await request(app)
                .get('/api/toilet/nonexistent')
                .expect(404);

            await request(app)
                .get('/api/review/toilet/nonexistent')
                .expect(200); // Should return empty array

            await request(app)
                .delete('/api/review/nonexistent')
                .expect(404);
        });
    });
});