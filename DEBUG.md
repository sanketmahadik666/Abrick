# 🐛 Toilet Review System - Debug & Testing Guide

This comprehensive guide provides everything a developer or AI needs to understand, test, and debug the Toilet Review System.

## 📋 Project Overview

### Architecture
- **Backend**: Node.js + Express with in-memory storage (no database required)
- **Frontend**: Vanilla JavaScript with Leaflet maps and QR scanning
- **Testing**: Jest framework with comprehensive test suites
- **Deployment**: Single-command setup with sample data

### Key Components
- **Models**: User, Toilet, Review (in-memory storage)
- **Routes**: RESTful API endpoints with JWT authentication
- **Frontend**: Progressive web app with responsive design
- **Testing**: Unit tests for models, integration tests for routes

## 🧪 Testing Framework Setup

### Prerequisites
```bash
# Install dependencies
cd backend
npm install

# Run tests
npm test
npm run test:coverage
```

### Test Structure
```
backend/tests/
├── setup.js              # Test environment setup
├── models/
│   ├── User.test.js      # User model tests
│   ├── Toilet.test.js    # Toilet model tests
│   └── Review.test.js    # Review model tests
└── routes/
    └── auth.test.js      # Authentication route tests
```

### Running Tests
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npx jest tests/models/User.test.js

# Run tests in watch mode
npm run test:watch
```

## 🔍 Understanding the Codebase

### Backend Models

#### User Model (`backend/models/User.js`)
```javascript
const User = require('./models/User');

// Create user
const user = new User({
  email: 'test@example.com',
  password: 'password123',
  role: 'admin' // or 'user'
});

// Save user (hashes password automatically)
await user.save();

// Authenticate
const isValid = await user.comparePassword('password123');

// Find users
const foundUser = await User.findOne({ email: 'test@example.com' });
const userById = await User.findById(userId);
```

**Key Methods:**
- `save()`: Hashes password and stores user
- `comparePassword(candidate)`: Verifies password
- `findOne(query)`: Find user by criteria
- `findById(id)`: Find user by ID
- `toObject()`: Returns user data (excludes password)

#### Toilet Model (`backend/models/Toilet.js`)
```javascript
const Toilet = require('./models/Toilet');

// Create toilet
const toilet = new Toilet({
  name: 'Central Park Toilet',
  location: 'Central Park, NYC',
  coordinates: { latitude: 40.7829, longitude: -73.9654 },
  facilities: ['handicap', 'baby_change'],
  description: 'Modern facility'
});

// Save and find
await toilet.save();
const found = await Toilet.findById(toiletId);
const allToilets = await Toilet.find();
```

**Key Methods:**
- `save()`: Stores toilet with timestamp updates
- `remove()`: Deletes toilet from storage
- `find(query)`: Find toilets (supports geospatial queries)
- `findById(id)`: Find specific toilet
- `findByIdAndUpdate(id, update)`: Update and return toilet

#### Review Model (`backend/models/Review.js`)
```javascript
const Review = require('./models/Review');

// Create review
const review = new Review({
  toiletId: 'toilet123',
  rating: 5,
  cleanliness: 4,
  maintenance: 5,
  accessibility: 4,
  comment: 'Great facility!'
});

// Save and query
await review.save();
const toiletReviews = await Review.find({ toiletId: 'toilet123' });
const totalReviews = await Review.countDocuments();
```

**Key Methods:**
- `save()`: Stores review
- `remove()`: Deletes review
- `find(query)`: Find reviews with sorting
- `countDocuments()`: Get total count
- `aggregate(pipeline)`: Perform aggregations

### API Routes

#### Authentication Routes (`/api/auth/*`)
```javascript
// Register
POST /api/auth/register
{
  "email": "admin@example.com",
  "password": "securepassword"
}

// Login
POST /api/auth/login
{
  "email": "admin@example.com",
  "password": "securepassword"
}

// Get current user (requires auth)
GET /api/auth/me
Headers: { "Authorization": "Bearer <token>" }
```

#### Toilet Routes (`/api/toilet/*`)
```javascript
// Get all toilets
GET /api/toilet/map

// Get specific toilet
GET /api/toilet/:id

// Add toilet (admin only)
POST /api/toilet/add
Headers: { "Authorization": "Bearer <token>" }
{
  "name": "Toilet Name",
  "location": "Location",
  "coordinates": { "latitude": 40.7128, "longitude": -74.0060 },
  "facilities": ["handicap", "baby_change"],
  "description": "Description"
}

// Update toilet (admin only)
PUT /api/toilet/:id
Headers: { "Authorization": "Bearer <token>" }

// Delete toilet (admin only)
DELETE /api/toilet/:id
Headers: { "Authorization": "Bearer <token>" }
```

#### Review Routes (`/api/review/*`)
```javascript
// Submit review
POST /api/review/submit
{
  "toiletId": "toilet_id",
  "rating": 5,
  "cleanliness": 4,
  "maintenance": 5,
  "accessibility": 4,
  "comment": "Great facility!"
}

// Get reviews for toilet
GET /api/review/toilet/:toiletId

// Get all reviews (admin only)
GET /api/review/all
Headers: { "Authorization": "Bearer <token>" }

// Delete review (admin only)
DELETE /api/review/:id
Headers: { "Authorization": "Bearer <token>" }

// Get review statistics (admin only)
GET /api/review/stats
Headers: { "Authorization": "Bearer <token>" }
```

### Frontend Architecture

#### Shared Utilities (`js/utils.js`)
```javascript
// Get API URL
const apiUrl = ToiletReviewUtils.getApiUrl();

// Make authenticated request
const data = await ToiletReviewUtils.makeAuthenticatedRequest('/api/toilet/map');

// Show loading on button
ToiletReviewUtils.setButtonLoading(buttonElement, true);

// Show/hide loading overlays
ToiletReviewUtils.showLoadingOverlay();
ToiletReviewUtils.hideLoadingOverlay();

// Validate email
const isValid = ToiletReviewUtils.isValidEmail('test@example.com');

// Show errors
ToiletReviewUtils.showError('Error message');
ToiletReviewUtils.hideError();

// Format dates and ratings
const formattedDate = ToiletReviewUtils.formatDate(new Date());
const stars = ToiletReviewUtils.generateStarRating(4.5);
```

#### Key Frontend Patterns
- **Tagged Logging**: `[MAP]`, `[ADMIN]`, `[REVIEW]`, `[API]` prefixes
- **Error Boundaries**: Try-catch blocks with user-friendly messages
- **Loading States**: Consistent loading indicators across components
- **Responsive Design**: Mobile-first approach with CSS Grid/Flexbox

## 🧪 Writing Tests

### Model Test Template
```javascript
const Model = require('../models/Model');
const { storage } = require('../models/storage');

describe('Model Name', () => {
    beforeEach(() => {
        // Clear storage
        storage.length = 0;
    });

    describe('Constructor', () => {
        test('should create instance with correct properties', () => {
            const instance = new Model(testData);
            expect(instance.property).toBe(expectedValue);
        });
    });

    describe('Methods', () => {
        test('should perform operation correctly', async () => {
            // Setup
            const instance = new Model(testData);
            await instance.save();

            // Test
            const result = await Model.findById(instance.id);
            expect(result).toBe(instance);
        });
    });
});
```

### Route Test Template
```javascript
const request = require('supertest');
const express = require('express');
const route = require('../routes/route');

// Create test app
const app = express();
app.use(express.json());
app.use('/api', route);

describe('Route Name', () => {
    beforeEach(() => {
        // Reset storage/state
    });

    describe('GET /api/endpoint', () => {
        test('should return data', async () => {
            const response = await request(app)
                .get('/api/endpoint')
                .expect(200);

            expect(response.body).toHaveProperty('data');
        });
    });

    describe('POST /api/endpoint', () => {
        test('should create resource', async () => {
            const response = await request(app)
                .post('/api/endpoint')
                .send(testData)
                .expect(201);

            expect(response.body).toHaveProperty('id');
        });
    });
});
```

### Frontend Test Template
```javascript
// Test utility functions
describe('Utility Functions', () => {
    test('should validate email correctly', () => {
        expect(ToiletReviewUtils.isValidEmail('test@example.com')).toBe(true);
        expect(ToiletReviewUtils.isValidEmail('invalid')).toBe(false);
    });

    test('should generate star ratings', () => {
        expect(ToiletReviewUtils.generateStarRating(5)).toBe('★★★★★');
        expect(ToiletReviewUtils.generateStarRating(3.5)).toBe('★★★½☆☆');
    });
});

// Test DOM interactions
describe('DOM Interactions', () => {
    beforeEach(() => {
        // Setup DOM elements
        document.body.innerHTML = '<div id="test"></div>';
    });

    test('should show error message', () => {
        ToiletReviewUtils.showError('Test error', 'test');
        const element = document.getElementById('test');
        expect(element.textContent).toBe('Test error');
        expect(element.style.display).toBe('block');
    });
});
```

## 🔧 Debugging Checklist

### Backend Issues
- [ ] Check server logs for `[INIT]`, `[SERVER]` messages
- [ ] Verify `.env` file has `JWT_SECRET`
- [ ] Run `npm test` to check model functionality
- [ ] Check API responses with Postman/curl

### Frontend Issues
- [ ] Open browser DevTools (F12)
- [ ] Check Console tab for `[API]`, `[ADMIN]` messages
- [ ] Verify Network tab shows successful API calls
- [ ] Test with `test.html` first

### Authentication Issues
- [ ] Clear localStorage: `localStorage.clear()`
- [ ] Check JWT token in browser storage
- [ ] Verify server is running on correct port
- [ ] Test login endpoint directly

### Database/Memory Issues
- [ ] Check sample data initialization logs
- [ ] Verify storage arrays are populated
- [ ] Test model methods individually
- [ ] Check for circular dependencies

## 🚀 Deployment & Production

### Environment Setup
```bash
# Production environment
NODE_ENV=production
JWT_SECRET=your_super_secure_secret_here
PORT=3000
```

### Performance Optimization
- **Memory Management**: Monitor storage array sizes
- **API Rate Limiting**: Consider implementing rate limits
- **Caching**: Add Redis for production caching
- **Logging**: Use structured logging (Winston, Pino)

### Security Checklist
- [ ] Change default JWT secret
- [ ] Implement HTTPS in production
- [ ] Add input validation middleware
- [ ] Rate limiting for API endpoints
- [ ] CORS configuration for production domains

## 📊 Monitoring & Maintenance

### Key Metrics to Monitor
- **Memory Usage**: Storage array sizes
- **API Response Times**: Track slow endpoints
- **Error Rates**: Monitor 4xx/5xx responses
- **User Activity**: Login attempts, reviews submitted

### Regular Maintenance
- **Data Cleanup**: Remove old/invalid data
- **Log Rotation**: Manage log file sizes
- **Backup Strategy**: Export important data
- **Update Dependencies**: Keep packages updated

### Troubleshooting Commands
```bash
# Check server status
curl http://localhost:3000/api/toilet/map

# View server logs
tail -f server.log

# Run health check
curl http://localhost:3000/health

# Clear all data (development only)
curl -X POST http://localhost:3000/api/admin/reset
```

## 🤖 AI Development Guidelines

### Understanding the Project
1. **Start with `README.md`** for high-level overview
2. **Read `DEBUG.md`** for technical details
3. **Run tests** to understand expected behavior
4. **Check `test.html`** for integration testing

### Code Patterns to Follow
- **Tagged Logging**: Use consistent prefixes for debugging
- **Error Handling**: Always provide user-friendly error messages
- **Input Validation**: Validate data before processing
- **Consistent APIs**: Follow RESTful conventions

### Testing Strategy
- **Unit Tests**: Test individual functions/methods
- **Integration Tests**: Test API endpoints
- **UI Tests**: Test user interactions
- **Error Cases**: Test edge cases and error conditions

### Development Workflow
1. **Write Tests First**: TDD approach for new features
2. **Run Tests Frequently**: Ensure no regressions
3. **Check Code Coverage**: Aim for >80% coverage
4. **Debug with Logs**: Use tagged logging for troubleshooting

This guide provides everything needed to understand, test, debug, and extend the Toilet Review System. The comprehensive test suite and debugging tools ensure maintainable, reliable code.