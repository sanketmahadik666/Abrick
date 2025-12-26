// Test setup file for Jest
const { users, toilets, reviews } = require('../models/storage');

// Mock console methods to reduce noise during testing
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

beforeAll(() => {
    // Silence console logs during tests unless explicitly needed
    console.log = jest.fn();
    console.error = jest.fn();
});

// Reset in-memory storage before each test
beforeEach(() => {
    // Clear all data completely
    users.splice(0, users.length);
    toilets.splice(0, toilets.length);
    reviews.splice(0, reviews.length);

    // Reset any environment variables that might affect tests
    delete process.env.JWT_SECRET;
    process.env.NODE_ENV = 'test';
});

// Clean up after all tests
afterAll(() => {
    // Final cleanup
    users.splice(0, users.length);
    toilets.splice(0, toilets.length);
    reviews.splice(0, reviews.length);

    // Reset environment
    delete process.env.JWT_SECRET;
    delete process.env.NODE_ENV;

    // Restore console methods
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
});