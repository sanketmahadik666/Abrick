const request = require('supertest');
const express = require('express');
const authRoutes = require('../../routes/auth');
const { users } = require('../../models/storage');

// Create test app
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Auth Routes', () => {
    beforeEach(() => {
        // Clear users array completely
        users.splice(0, users.length);
        // Set test JWT secret
        process.env.JWT_SECRET = 'test_jwt_secret_for_auth_testing';
    });

    afterEach(() => {
        // Clean up after each test
        users.splice(0, users.length);
        delete process.env.JWT_SECRET;
    });

    describe('POST /api/auth/register', () => {
        test('should register a new user successfully', async () => {
            const userData = {
                email: 'test@example.com',
                password: 'password123'
            };

            const response = await request(app)
                .post('/api/auth/register')
                .send(userData)
                .expect(201);

            expect(response.body.token).toBeDefined();
            expect(response.body.user.email).toBe('test@example.com');
            expect(response.body.user.role).toBe('admin'); // Default for registration
            expect(response.body.user.id).toBeDefined();
        });

        test('should return 400 for duplicate email', async () => {
            // First registration
            await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'test@example.com',
                    password: 'password123'
                });

            // Second registration with same email
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'test@example.com',
                    password: 'password456'
                })
                .expect(400);

            expect(response.body.message).toContain('already exists');
        });

        test('should validate required fields - missing password', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({ email: 'test@example.com' }) // Missing password
                .expect(400);

            expect(response.body.message).toContain('required');
        });

        test('should validate required fields - missing email', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({ password: 'password123' }) // Missing email
                .expect(400);

            expect(response.body.message).toContain('required');
        });

        test('should validate required fields - empty strings', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({ email: '', password: '' }) // Empty strings
                .expect(400);

            expect(response.body.message).toContain('required');
        });

        test('should validate email format', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({ email: 'invalid-email', password: 'password123' })
                .expect(400);

            expect(response.body.message).toBeDefined();
        });

        test('should handle extremely long email', async () => {
            const longEmail = 'a'.repeat(200) + '@example.com';
            const response = await request(app)
                .post('/api/auth/register')
                .send({ email: longEmail, password: 'password123' })
                .expect(400);

            expect(response.body.message).toBeDefined();
        });
    });

    describe('POST /api/auth/login', () => {
        beforeEach(async () => {
            // Register a user for login tests
            await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'test@example.com',
                    password: 'password123'
                });
        });

        test('should login successfully with correct credentials', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'password123'
                })
                .expect(200);

            expect(response.body.token).toBeDefined();
            expect(response.body.user.email).toBe('test@example.com');
            expect(response.body.user.role).toBe('admin');
        });

        test('should return 401 for wrong password', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'wrongpassword'
                })
                .expect(401);

            expect(response.body.message).toContain('Invalid credentials');
        });

        test('should return 401 for non-existent user', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'nonexistent@example.com',
                    password: 'password123'
                })
                .expect(401);

            expect(response.body.message).toContain('Invalid credentials');
        });

        test('should validate login required fields - missing email', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({ password: 'password123' })
                .expect(400);

            expect(response.body.message).toContain('required');
        });

        test('should validate login required fields - missing password', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({ email: 'test@example.com' })
                .expect(400);

            expect(response.body.message).toContain('required');
        });

        test('should handle case-sensitive email login', async () => {
            // Register with lowercase email
            await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'test@example.com',
                    password: 'password123'
                });

            // Try login with uppercase email
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'TEST@EXAMPLE.COM',
                    password: 'password123'
                })
                .expect(401);

            expect(response.body.message).toContain('Invalid credentials');
        });
    });

    describe('GET /api/auth/me', () => {
        let token;

        beforeEach(async () => {
            // Register and login to get token
            const registerResponse = await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'test@example.com',
                    password: 'password123'
                });

            token = registerResponse.body.token;
        });

        test('should return current user info with valid token', async () => {
            const response = await request(app)
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            expect(response.body.email).toBe('test@example.com');
            expect(response.body.role).toBe('admin');
            expect(response.body.id).toBeDefined();
            expect(response.body.password).toBeUndefined(); // Should not include password
        });

        test('should return 401 without token', async () => {
            const response = await request(app)
                .get('/api/auth/me')
                .expect(401);

            expect(response.body.message).toContain('Not authorized');
        });

        test('should return 401 with invalid token', async () => {
            const response = await request(app)
                .get('/api/auth/me')
                .set('Authorization', 'Bearer invalid_token')
                .expect(401);

            expect(response.body.message).toContain('Not authorized');
        });
    });
});