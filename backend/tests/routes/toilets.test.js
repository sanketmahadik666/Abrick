const request = require('supertest');
const express = require('express');
const toiletRoutes = require('../../routes/toilets');
const { toilets } = require('../../models/storage');

// Create test app
const app = express();
app.use(express.json());
app.use('/api/toilet', toiletRoutes);

describe('Toilet Routes', () => {
    beforeEach(() => {
        // Clear toilets array completely
        toilets.splice(0, toilets.length);
        // Clear reviews to avoid interference
        reviews.splice(0, reviews.length);

        // Add sample toilet for testing
        toilets.push({
            id: 'test-toilet-1',
            name: 'Test Toilet',
            location: 'Test Location',
            description: 'Test Description',
            coordinates: { latitude: 40.7128, longitude: -74.0060 },
            facilities: ['handicap', 'baby_change'],
            averageRating: 4.5,
            totalReviews: 10,
            createdAt: new Date(),
            updatedAt: new Date()
        });
    });

    afterEach(() => {
        // Clean up after each test
        toilets.splice(0, toilets.length);
        reviews.splice(0, reviews.length);
    });

    describe('GET /api/toilet/map', () => {
        test('should return all toilets for map display', async () => {
            const response = await request(app)
                .get('/api/toilet/map')
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBe(1);
            expect(response.body[0].name).toBe('Test Toilet');
            expect(response.body[0].coordinates).toBeDefined();
        });
    });

    describe('GET /api/toilet/:id', () => {
        test('should return toilet details by id', async () => {
            const response = await request(app)
                .get('/api/toilet/test-toilet-1')
                .expect(200);

            expect(response.body.id).toBe('test-toilet-1');
            expect(response.body.name).toBe('Test Toilet');
            expect(response.body.facilities).toEqual(['handicap', 'baby_change']);
        });

        test('should return 404 for non-existent toilet', async () => {
            const response = await request(app)
                .get('/api/toilet/non-existent')
                .expect(404);

            expect(response.body.message).toContain('not found');
        });
    });

    describe('POST /api/toilet/add', () => {
        test('should add new toilet (no auth required for demo)', async () => {
            const newToilet = {
                name: 'New Test Toilet',
                location: 'New Location',
                description: 'New Description',
                coordinates: { latitude: 40.7589, longitude: -73.9851 },
                facilities: ['shower']
            };

            const response = await request(app)
                .post('/api/toilet/add')
                .send(newToilet)
                .expect(201);

            expect(response.body.id).toBeDefined();
            expect(response.body.name).toBe('New Test Toilet');
            expect(response.body.facilities).toEqual(['shower']);
        });

        test('should validate required fields - missing name', async () => {
            const response = await request(app)
                .post('/api/toilet/add')
                .send({
                    location: 'Test Location',
                    description: 'Test Description',
                    coordinates: { latitude: 40.7128, longitude: -74.0060 }
                })
                .expect(400);

            expect(response.body.message).toBeDefined();
        });

        test('should validate required fields - missing location', async () => {
            const response = await request(app)
                .post('/api/toilet/add')
                .send({
                    name: 'Test Toilet',
                    description: 'Test Description',
                    coordinates: { latitude: 40.7128, longitude: -74.0060 }
                })
                .expect(400);

            expect(response.body.message).toBeDefined();
        });

        test('should validate required fields - missing coordinates', async () => {
            const response = await request(app)
                .post('/api/toilet/add')
                .send({
                    name: 'Test Toilet',
                    location: 'Test Location',
                    description: 'Test Description'
                })
                .expect(400);

            expect(response.body.message).toBeDefined();
        });

        test('should validate coordinates format', async () => {
            const response = await request(app)
                .post('/api/toilet/add')
                .send({
                    name: 'Test Toilet',
                    location: 'Test Location',
                    description: 'Test Description',
                    coordinates: { lat: 40.7128, lng: -74.0060 } // Wrong property names
                })
                .expect(400);

            expect(response.body.message).toBeDefined();
        });

        test('should validate coordinate ranges', async () => {
            const response = await request(app)
                .post('/api/toilet/add')
                .send({
                    name: 'Test Toilet',
                    location: 'Test Location',
                    description: 'Test Description',
                    coordinates: { latitude: 91, longitude: -74.0060 } // Invalid latitude
                })
                .expect(400);

            expect(response.body.message).toBeDefined();
        });

        test('should handle empty facilities array', async () => {
            const response = await request(app)
                .post('/api/toilet/add')
                .send({
                    name: 'Test Toilet',
                    location: 'Test Location',
                    description: 'Test Description',
                    coordinates: { latitude: 40.7128, longitude: -74.0060 },
                    facilities: []
                })
                .expect(201);

            expect(response.body.facilities).toEqual([]);
        });
    });

    describe('PUT /api/toilet/:id', () => {
        test('should update toilet (no auth required for demo)', async () => {
            const updates = {
                name: 'Updated Test Toilet',
                description: 'Updated Description'
            };

            const response = await request(app)
                .put('/api/toilet/test-toilet-1')
                .send(updates)
                .expect(200);

            expect(response.body.name).toBe('Updated Test Toilet');
            expect(response.body.description).toBe('Updated Description');
        });

        test('should return 404 for non-existent toilet update', async () => {
            const response = await request(app)
                .put('/api/toilet/non-existent')
                .send({ name: 'Updated Name' })
                .expect(404);

            expect(response.body.message).toContain('not found');
        });
    });

    describe('DELETE /api/toilet/:id', () => {
        test('should delete toilet (no auth required for demo)', async () => {
            const response = await request(app)
                .delete('/api/toilet/test-toilet-1')
                .expect(200);

            expect(response.body.message).toContain('deleted');

            // Verify toilet is gone
            const checkResponse = await request(app)
                .get('/api/toilet/test-toilet-1')
                .expect(404);
        });

        test('should return 404 for non-existent toilet deletion', async () => {
            const response = await request(app)
                .delete('/api/toilet/non-existent')
                .expect(404);

            expect(response.body.message).toContain('not found');
        });
    });
});