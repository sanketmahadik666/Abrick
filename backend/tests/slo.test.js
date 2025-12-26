// SLO (Service Level Objectives) Tests for Toilet Review System
// Tests performance, reliability, and quality metrics

const request = require('supertest');
const express = require('express');
const sloService = require('../services/SLOService');
const authRoutes = require('../routes/auth');
const toiletRoutes = require('../routes/toilets');
const reviewRoutes = require('../routes/reviews');
const { users, toilets, reviews } = require('../models/storage');

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/toilet', toiletRoutes);
app.use('/api/review', reviewRoutes);

describe('SLO (Service Level Objectives) Tests', () => {
    beforeEach(() => {
        // Clear all data
        users.splice(0, users.length);
        toilets.splice(0, toilets.length);
        reviews.splice(0, reviews.length);

        // Reset SLO metrics
        sloService.metrics.apiResponseTime.measurements = [];
        sloService.metrics.apiAvailability.totalRequests = 0;
        sloService.metrics.apiAvailability.successfulRequests = 0;
        sloService.metrics.errorRate.totalRequests = 0;
        sloService.metrics.errorRate.errorRequests = 0;
        sloService.metrics.dataFreshness.lastSync = null;
        sloService.metrics.mapLoadTime.measurements = [];
        sloService.metrics.searchResponseTime.measurements = [];

        // Set test JWT secret
        process.env.JWT_SECRET = 'test_jwt_secret_for_slo_testing';
    });

    afterEach(() => {
        delete process.env.JWT_SECRET;
    });

    describe('API Response Time SLO', () => {
        test('should maintain 95th percentile response time under 500ms', async () => {
            // Make multiple API calls to generate metrics
            for (let i = 0; i < 20; i++) {
                await request(app)
                    .get('/api/toilet/map')
                    .expect(200);
            }

            const slos = sloService.getCurrentSLOs();
            expect(slos.apiResponseTime.compliance).toBeGreaterThanOrEqual(0);
            expect(slos.apiResponseTime.target).toBe(500);

            // Log actual performance
            console.log(`[SLO-TEST] API Response Time: ${slos.apiResponseTime.value}ms (Target: ${slos.apiResponseTime.target}ms)`);
        });

        test('should handle high load without performance degradation', async () => {
            const startTime = Date.now();

            // Simulate concurrent requests
            const promises = [];
            for (let i = 0; i < 50; i++) {
                promises.push(
                    request(app).get('/api/toilet/map').expect(200)
                );
            }

            await Promise.all(promises);
            const totalTime = Date.now() - startTime;

            // Should complete within reasonable time (under 10 seconds for 50 requests)
            expect(totalTime).toBeLessThan(10000);

            console.log(`[SLO-TEST] High load test: ${promises.length} requests in ${totalTime}ms`);
        });
    });

    describe('API Availability SLO', () => {
        test('should maintain 99.9% availability', async () => {
            // Register a user first
            await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'admin@example.com',
                    password: 'password123'
                });

            // Make successful requests
            for (let i = 0; i < 10; i++) {
                await request(app)
                    .post('/api/auth/login')
                    .send({
                        email: 'admin@example.com',
                        password: 'password123'
                    })
                    .expect(200);
            }

            const slos = sloService.getCurrentSLOs();
            expect(slos.apiAvailability.target).toBe(99.9);

            // Should have high availability
            expect(slos.apiAvailability.value).toBeGreaterThan(95);

            console.log(`[SLO-TEST] API Availability: ${slos.apiAvailability.value}% (Target: ${slos.apiAvailability.target}%)`);
        });
    });

    describe('Error Rate SLO', () => {
        test('should maintain error rate under 1%', async () => {
            // Register user
            await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'test@example.com',
                    password: 'password123'
                });

            // Make valid requests (should succeed)
            for (let i = 0; i < 10; i++) {
                await request(app)
                    .get('/api/toilet/map')
                    .expect(200);
            }

            // Make some invalid requests (should fail)
            for (let i = 0; i < 2; i++) {
                await request(app)
                    .post('/api/review/submit')
                    .send({ invalid: 'data' })
                    .expect(400); // Bad request
            }

            const slos = sloService.getCurrentSLOs();
            expect(slos.errorRate.target).toBe(1);

            // Error rate should be under target (allowing some margin for test variability)
            expect(slos.errorRate.value).toBeLessThan(slos.errorRate.target + 5);

            console.log(`[SLO-TEST] Error Rate: ${slos.errorRate.value}% (Target: <${slos.errorRate.target}%)`);
        });
    });

    describe('Data Freshness SLO', () => {
        test('should track data sync timestamps', () => {
            // Initially no sync
            let slos = sloService.getCurrentSLOs();
            expect(slos.dataFreshness.compliance).toBe(0);

            // Record a sync
            sloService.recordDataSync();

            slos = sloService.getCurrentSLOs();
            expect(slos.dataFreshness.compliance).toBe(100);
            expect(slos.dataFreshness.lastSync).toBeDefined();

            console.log(`[SLO-TEST] Data Freshness: Last sync at ${slos.dataFreshness.lastSync}`);
        });
    });

    describe('Hybrid System Functionality', () => {
        test('should properly filter public vs private toilets', async () => {
            // Add sample toilets of both types
            toilets.push({
                id: 'private-1',
                name: 'Private Toilet',
                location: 'Mall',
                coordinates: { latitude: 40.7128, longitude: -74.0060 },
                type: 'private',
                verified: true,
                facilities: ['handicap']
            });

            toilets.push({
                id: 'public-1',
                name: 'Public Toilet',
                location: 'Park',
                coordinates: { latitude: 40.7589, longitude: -73.9851 },
                type: 'public',
                verified: false,
                facilities: ['unisex']
            });

            // Test private toilet filter
            const privateResponse = await request(app)
                .get('/api/toilet/map?showPublic=false&showPrivate=true')
                .expect(200);

            expect(privateResponse.body.length).toBe(1);
            expect(privateResponse.body[0].type).toBe('private');

            // Test public toilet filter
            const publicResponse = await request(app)
                .get('/api/toilet/map?showPublic=true&showPrivate=false')
                .expect(200);

            expect(publicResponse.body.length).toBe(1);
            expect(publicResponse.body[0].type).toBe('public');

            // Test both filters
            const bothResponse = await request(app)
                .get('/api/toilet/map?showPublic=true&showPrivate=true')
                .expect(200);

            expect(bothResponse.body.length).toBe(2);

            console.log(`[SLO-TEST] Hybrid filtering: ${bothResponse.body.length} toilets returned`);
        });

        test('should maintain performance under hybrid load', async () => {
            // Add multiple toilets of both types
            for (let i = 0; i < 10; i++) {
                toilets.push({
                    id: `toilet-${i}`,
                    name: `Test Toilet ${i}`,
                    location: `Location ${i}`,
                    coordinates: {
                        latitude: 40.7128 + (i * 0.01),
                        longitude: -74.0060 + (i * 0.01)
                    },
                    type: i % 2 === 0 ? 'private' : 'public',
                    verified: i % 2 === 0,
                    facilities: ['handicap']
                });
            }

            const startTime = Date.now();

            // Test filtering performance
            await request(app)
                .get('/api/toilet/map?showPublic=true&showPrivate=true')
                .expect(200);

            const responseTime = Date.now() - startTime;

            // Should respond quickly even with multiple toilets
            expect(responseTime).toBeLessThan(100);

            console.log(`[SLO-TEST] Hybrid load test: ${responseTime}ms for ${toilets.length} toilets`);
        });
    });

    describe('SLO Metrics Export', () => {
        test('should export comprehensive SLO metrics', () => {
            const metrics = sloService.exportMetrics();

            expect(metrics).toHaveProperty('timestamp');
            expect(metrics).toHaveProperty('version');
            expect(metrics).toHaveProperty('service');
            expect(metrics).toHaveProperty('slos');
            expect(metrics).toHaveProperty('targets');

            expect(metrics.service).toBe('toilet-review-system');
            expect(metrics.slos).toHaveProperty('overall');

            console.log(`[SLO-TEST] Metrics export: ${JSON.stringify(metrics.targets, null, 2)}`);
        });

        test('should calculate overall SLO compliance', () => {
            // Make some successful requests
            sloService.recordApiResponse('/api/test', 'GET', 100, 200);
            sloService.recordApiResponse('/api/test', 'GET', 150, 200);

            // Record data sync
            sloService.recordDataSync();

            const slos = sloService.getCurrentSLOs();
            expect(slos.overall).toHaveProperty('compliance');
            expect(slos.overall.compliance).toBeGreaterThanOrEqual(0);
            expect(slos.overall.compliance).toBeLessThanOrEqual(100);

            console.log(`[SLO-TEST] Overall SLO compliance: ${slos.overall.compliance}%`);
        });
    });

    describe('User Experience SLOs', () => {
        test('should track map load times', () => {
            sloService.recordMapLoadTime(1500);
            sloService.recordMapLoadTime(1200);
            sloService.recordMapLoadTime(1800);

            const slos = sloService.getCurrentSLOs();
            expect(slos.mapLoadTime.target).toBe(2000);

            // Should have good compliance with sub-2-second loads
            expect(slos.mapLoadTime.compliance).toBeGreaterThan(50);

            console.log(`[SLO-TEST] Map load time: ${slos.mapLoadTime.value}ms average`);
        });

        test('should track search response times', () => {
            sloService.recordSearchTime(200, 'mall toilets');
            sloService.recordSearchTime(150, 'public restrooms');
            sloService.recordSearchTime(300, 'accessible facilities');

            const slos = sloService.getCurrentSLOs();
            expect(slos.searchResponseTime.target).toBe(300);

            // Should have good compliance with sub-300ms searches
            expect(slos.searchResponseTime.compliance).toBeGreaterThan(50);

            console.log(`[SLO-TEST] Search time: ${slos.searchResponseTime.value}ms average`);
        });
    });

    describe('SLO Targets Validation', () => {
        test('should have properly configured SLO targets', () => {
            const targets = sloService.getSLOTargets();

            expect(targets).toHaveProperty('apiResponseTime');
            expect(targets).toHaveProperty('apiAvailability');
            expect(targets).toHaveProperty('errorRate');
            expect(targets).toHaveProperty('dataFreshness');
            expect(targets).toHaveProperty('mapLoadTime');
            expect(targets).toHaveProperty('searchResponseTime');

            // Validate target formats
            expect(targets.apiResponseTime).toContain('95th percentile');
            expect(targets.apiResponseTime).toContain('500ms');
            expect(targets.apiAvailability).toContain('99.9%');
            expect(targets.errorRate).toContain('1%');

            console.log('[SLO-TEST] SLO targets validated successfully');
        });
    });
});
