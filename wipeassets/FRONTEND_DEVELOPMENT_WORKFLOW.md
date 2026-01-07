# Frontend Development Workflow Guide

## Overview
This guide provides comprehensive documentation for developing, maintaining, and deploying the Toilet Review System frontend. It covers architecture, development practices, testing, and deployment procedures.

## Table of Contents
1. [Project Architecture](#project-architecture)
2. [Development Environment](#development-environment)
3. [Code Organization](#code-organization)
4. [Development Workflow](#development-workflow)
5. [Error Handling](#error-handling)
6. [Testing Guidelines](#testing-guidelines)
7. [Build and Deployment](#build-and-deployment)
8. [Performance Optimization](#performance-optimization)
9. [Troubleshooting](#troubleshooting)

## Project Architecture

### High-Level Architecture
```
Frontend (ES6 Modules)
├── src/
│   ├── core/           # Core utilities and configuration
│   ├── components/     # Reusable UI components
│   ├── pages/          # Page-specific modules
│   ├── services/       # API and external services
│   ├── state/          # State management
│   └── assets/         # Static assets
├── dist/               # Built application
└── public/             # Public assets
```

### Core Principles
- **Modularity**: Each module has a single responsibility
- **Separation of Concerns**: UI, logic, and data are separated
- **Error Handling**: Comprehensive error handling at all levels
- **Performance**: Optimized for speed and user experience
- **Maintainability**: Clean, documented, and testable code

## Development Environment

### Prerequisites
- Node.js 16+ 
- npm or yarn
- Modern browser with ES6 support
- Git

### Setup Instructions
```bash
# Clone repository
git clone <repository-url>
cd toilet-review-system-frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm test
```

### Development Scripts
```json
{
  "dev": "webpack serve --mode development",
  "build": "webpack --mode production",
  "build:analyze": "webpack --mode production --analyze",
  "test": "jest",
  "test:watch": "jest --watch",
  "lint": "eslint src/",
  "lint:fix": "eslint src/ --fix",
  "format": "prettier --write src/"
}
```

## Code Organization

### Directory Structure
```
src/
├── app.js                 # Main application entry point
├── core/                  # Core functionality
│   ├── config/           # Application configuration
│   │   └── app.config.js
│   ├── constants/        # Application constants
│   │   └── api.constants.js
│   ├── types/           # TypeScript definitions (if using TS)
│   └── utils/           # Core utilities
│       ├── dom.utils.js
│       ├── error-handler.js
│       └── logger.js
├── components/           # Reusable UI components
│   ├── base/            # Base component classes
│   ├── forms/           # Form components
│   ├── layout/          # Layout components
│   └── ui/              # UI components
├── pages/               # Page-specific modules
│   ├── home/            # Home page
│   ├── admin/           # Admin page
│   ├── review/          # Review page
│   └── shared/          # Shared page utilities
├── services/            # Business logic and API
│   ├── api/             # API services
│   ├── external/        # External service integrations
│   └── storage/         # Storage utilities
├── state/               # State management
│   ├── actions/         # Action creators
│   └── store/           # State store
└── assets/              # Static assets
    ├── fonts/
    ├── images/
    └── styles/
```

### File Naming Conventions
- **Components**: PascalCase (e.g., `SearchComponent.js`)
- **Services**: camelCase with service suffix (e.g., `toiletApiService.js`)
- **Utilities**: camelCase (e.g., `domUtils.js`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `API_ENDPOINTS.js`)
- **Pages**: camelCase with page suffix (e.g., `homePage.js`)

### Code Style Guidelines

#### JavaScript ES6+ Standards
```javascript
// Use const/let instead of var
const API_BASE_URL = 'https://api.example.com';
let currentUser = null;

// Use arrow functions
const handleSubmit = (event) => {
  event.preventDefault();
  // Handle form submission
};

// Use template literals
const welcomeMessage = `Welcome, ${user.name}!`;

// Use destructuring
const { name, email, role } = user;

// Use spread operator
const newUser = { ...user, updatedAt: new Date() };

// Use async/await
async function fetchUserData(userId) {
  try {
    const response = await api.getUser(userId);
    return response.data;
  } catch (error) {
    errorHandler.handleError(error, {
      type: ErrorTypes.API,
      severity: ErrorSeverity.HIGH
    });
  }
}
```

#### Component Structure
```javascript
/**
 * Component Description
 * Brief description of what this component does
 */

import { BaseComponent } from '../base/base.component.js';
import { eventHandler } from '../../core/utils/event-handler.js';

/**
 * Component Class
 * Extends BaseComponent following Template Method pattern
 */
export class MyComponent extends BaseComponent {
  constructor() {
    super();
    this.state = {
      loading: false,
      data: null,
      error: null
    };
    
    // Bind methods
    this.handleClick = this.handleClick.bind(this);
  }

  /**
   * Initialize component
   */
  async init() {
    try {
      await this.loadData();
      this.setupEventListeners();
      this.render();
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    this.element.addEventListener('click', this.handleClick);
  }

  /**
   * Handle click events
   */
  handleClick(event) {
    // Handle click logic
  }

  /**
   * Render component
   */
  render() {
    // Render component HTML
  }

  /**
   * Clean up resources
   */
  destroy() {
    // Remove event listeners
    // Clean up resources
    super.destroy();
  }
}
```

## Development Workflow

### 1. Feature Development Process

#### Step 1: Planning
- Create feature branch from main
- Write feature specification
- Identify components and services needed
- Plan error handling strategy

#### Step 2: Implementation
- Implement core functionality
- Add error handling
- Write unit tests
- Update documentation

#### Step 3: Testing
- Run local tests
- Test in different browsers
- Perform integration testing
- Test error scenarios

#### Step 4: Code Review
- Self-review code
- Submit pull request
- Address review feedback
- Merge to main branch

### 2. Branching Strategy
```
main                    # Production-ready code
├── develop            # Integration branch
├── feature/*          # Feature development
├── hotfix/*           # Emergency fixes
└── release/*          # Release preparation
```

### 3. Commit Message Format
```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Build process or auxiliary tool changes

Examples:
```
feat(map): add marker clustering for toilet locations
fix(api): handle timeout errors in toilet data fetching
docs(readme): update installation instructions
```

## Error Handling

### Error Handling Strategy

#### 1. Error Classification
```javascript
import { ErrorTypes, ErrorSeverity } from '../utils/error-handler.js';

// Network errors
errorHandler.handleError(networkError, {
  type: ErrorTypes.NETWORK,
  severity: ErrorSeverity.MEDIUM,
  retryable: true
});

// API errors
errorHandler.handleError(apiError, {
  type: ErrorTypes.API,
  severity: ErrorSeverity.HIGH,
  retryable: true
});

// Validation errors
errorHandler.handleError(validationError, {
  type: ErrorTypes.VALIDATION,
  severity: ErrorSeverity.LOW
});
```

#### 2. Fallback Mechanisms
```javascript
// API fallback
async function fetchToiletData() {
  try {
    return await api.getToilets();
  } catch (error) {
    // Fallback to cached data
    const cachedData = localStorage.getItem('toilet-cache');
    if (cachedData) {
      return JSON.parse(cachedData);
    }
    
    // Show user-friendly error
    errorHandler.handleError(error, {
      type: ErrorTypes.API,
      severity: ErrorSeverity.HIGH
    });
    
    throw error;
  }
}
```

#### 3. User Experience
- Always show user-friendly error messages
- Provide retry mechanisms when appropriate
- Implement offline functionality
- Log detailed errors for debugging

### Error Monitoring
```javascript
// Automatic error reporting
errorHandler.reportError(errorInfo);

// Manual error reporting
errorHandler.logError({
  message: 'Custom error message',
  type: ErrorTypes.USER,
  severity: ErrorSeverity.MEDIUM,
  metadata: { userId: '123', action: 'submit_review' }
});
```

## Testing Guidelines

### Testing Strategy

#### 1. Unit Testing
```javascript
// Example unit test
import { ToiletApiService } from '../../../src/services/api/toilet-api.service.js';

describe('ToiletApiService', () => {
  let service;
  
  beforeEach(() => {
    service = new ToiletApiService();
  });
  
  describe('getMapData', () => {
    it('should fetch toilet data with correct parameters', async () => {
      const filters = {
        showPublic: true,
        showPrivate: false,
        bounds: { south: 18, west: 72, north: 19, east: 74 }
      };
      
      const result = await service.getMapData(filters);
      
      expect(result).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
    });
    
    it('should handle API errors gracefully', async () => {
      // Mock API error
      global.fetch = jest.fn(() => 
        Promise.reject(new Error('Network error'))
      );
      
      await expect(service.getMapData({}))
        .rejects.toThrow('Network error');
    });
  });
});
```

#### 2. Integration Testing
```javascript
// Example integration test
import { setupTestEnvironment, cleanupTestEnvironment } from '../helpers/test-utils.js';

describe('Map Integration', () => {
  beforeAll(async () => {
    await setupTestEnvironment();
  });
  
  afterAll(async () => {
    await cleanupTestEnvironment();
  });
  
  it('should display toilet markers on map', async () => {
    const map = L.map('test-map').setView([18.5204, 73.8567], 13);
    const homePage = new HomePage();
    
    await homePage.initializeMap();
    
    // Verify markers are added
    const markers = map.getLayers().filter(layer => 
      layer instanceof L.Marker
    );
    
    expect(markers.length).toBeGreaterThan(0);
  });
});
```

#### 3. End-to-End Testing
```javascript
// Example E2E test with Playwright
import { test, expect } from '@playwright/test';

test.describe('Toilet Review Flow', () => {
  test('should complete review submission', async ({ page }) => {
    // Navigate to home page
    await page.goto('/');
    
    // Wait for map to load
    await page.waitForSelector('#map');
    
    // Scan QR code
    await page.click('#qr-reader');
    
    // Fill review form
    await page.selectOption('input[name="rating"]', '5');
    await page.fill('textarea[name="comments"]', 'Great facility!');
    
    // Submit review
    await page.click('button[type="submit"]');
    
    // Verify success
    await expect(page.locator('.success-message')).toBeVisible();
  });
});
```

### Test Configuration
```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.js'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/tests/**'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

## Build and Deployment

### Webpack Configuration

#### Development Build
```javascript
// webpack.config.js (development)
module.exports = {
  mode: 'development',
  devtool: 'eval-cheap-module-source-map',
  devServer: {
    contentBase: path.join(__dirname, 'dist'),
    hot: true,
    port: 8080,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
};
```

#### Production Build
```javascript
// webpack.config.js (production)
module.exports = {
  mode: 'production',
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all'
        }
      }
    },
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: true,
            drop_debugger: true
          }
        }
      })
    ]
  }
};
```

### Build Scripts
```json
{
  "scripts": {
    "build": "webpack --mode production",
    "build:analyze": "npm run build && npx webpack-bundle-analyzer dist/bundle.js",
    "build:serve": "serve -s dist -l 3000"
  }
}
```

### Deployment Process

#### 1. Pre-deployment Checklist
- [ ] All tests passing
- [ ] No console errors
- [ ] Performance audit completed
- [ ] Accessibility audit completed
- [ ] Security audit completed

#### 2. Deployment Steps
```bash
# Build production version
npm run build

# Run tests
npm test

# Deploy to staging
npm run deploy:staging

# Run E2E tests on staging
npm run test:e2e:staging

# Deploy to production
npm run deploy:production
```

#### 3. Environment Configuration
```javascript
// config/environments.js
export const environments = {
  development: {
    apiBaseUrl: 'http://localhost:3000',
    enableDebugging: true,
    enableAnalytics: false
  },
  staging: {
    apiBaseUrl: 'https://staging-api.example.com',
    enableDebugging: true,
    enableAnalytics: false
  },
  production: {
    apiBaseUrl: 'https://api.example.com',
    enableDebugging: false,
    enableAnalytics: true
  }
};
```

## Performance Optimization

### Performance Monitoring
```javascript
// Performance monitoring
import { errorHandler } from '../utils/error-handler.js';

class PerformanceMonitor {
  static measurePageLoad() {
    window.addEventListener('load', () => {
      const perfData = performance.getEntriesByType('navigation')[0];
      const loadTime = perfData.loadEventEnd - perfData.fetchStart;
      
      if (loadTime > 3000) {
        errorHandler.logError({
          message: `Slow page load: ${loadTime}ms`,
          type: 'performance',
          severity: 'medium',
          metadata: { loadTime }
        });
      }
    });
  }
  
  static measureApiCalls() {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const start = performance.now();
      try {
        const response = await originalFetch(...args);
        const duration = performance.now() - start;
        
        if (duration > 5000) {
          errorHandler.logError({
            message: `Slow API call: ${duration}ms`,
            type: 'performance',
            severity: 'medium',
            metadata: { url: args[0], duration }
          });
        }
        
        return response;
      } catch (error) {
        throw error;
      }
    };
  }
}
```

### Optimization Techniques

#### 1. Code Splitting
```javascript
// Dynamic imports for code splitting
const loadAdminPage = () => import('./pages/admin/admin.page.js');

// Lazy loading
const AdminPage = lazy(loadAdminPage);
```

#### 2. Image Optimization
```javascript
// Responsive images
const ResponsiveImage = ({ src, alt, sizes }) => (
  <picture>
    <source media="(min-width: 768px)" srcSet={`${src}-desktop.webp`} type="image/webp" />
    <source media="(min-width: 768px)" srcSet={`${src}-desktop.jpg`} type="image/jpeg" />
    <source srcSet={`${src}-mobile.webp`} type="image/webp" />
    <source srcSet={`${src}-mobile.jpg`} type="image/jpeg" />
    <img src={`${src}-mobile.jpg`} alt={alt} sizes={sizes} />
  </picture>
);
```

#### 3. Caching Strategy
```javascript
// Service worker for caching
const CACHE_NAME = 'toilet-review-v1';
const urlsToCache = [
  '/',
  '/static/css/main.css',
  '/static/js/main.js',
  '/api/toilet/map'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});
```

## Troubleshooting

### Common Issues and Solutions

#### 1. JavaScript Bundle Loading Errors
**Problem:** Multiple bundles causing conflicts
**Solution:** 
```html
<!-- Remove conflicting legacy bundles -->
<!-- <script src="js/legacy.js"></script> -->

<!-- Use only modern webpack bundles -->
<script src="js/app.[hash].js"></script>
```

#### 2. Map Not Displaying
**Problem:** Leaflet not loading or API errors
**Solution:**
```javascript
// Check Leaflet availability
if (typeof L === 'undefined') {
  errorHandler.handleError(new Error('Leaflet library not loaded'), {
    type: ErrorTypes.SYSTEM,
    severity: ErrorSeverity.HIGH
  });
  return;
}

// Check API connectivity
try {
  const response = await fetch('/api/toilet/map');
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
} catch (error) {
  errorHandler.handleError(error, {
    type: ErrorTypes.API,
    severity: ErrorSeverity.HIGH
  });
}
```

#### 3. State Management Issues
**Problem:** State not updating correctly
**Solution:**
```javascript
// Use immutable state updates
appStore.setState(prevState => ({
  ...prevState,
  data: {
    ...prevState.data,
    toilets: newToilets
  }
}));

// Subscribe to state changes
appStore.subscribe('state:changed', (event, data) => {
  console.log('State changed:', data.changes);
});
```

### Debug Tools

#### 1. Development Console
```javascript
// Enable debug mode
if (AppConfig.features.enableDebugLogging) {
  window.debugApp = {
    store: appStore,
    errorLog: errorHandler.getErrorLog(),
    clearCache: () => localStorage.clear(),
    reload: () => window.location.reload()
  };
}
```

#### 2. Performance Profiling
```javascript
// Performance profiling
const profileFunction = (fn, name) => {
  return async (...args) => {
    const start = performance.now();
    try {
      const result = await fn(...args);
      const duration = performance.now() - start;
      console.log(`${name} took ${duration}ms`);
      return result;
    } catch (error) {
      console.error(`${name} failed:`, error);
      throw error;
    }
  };
};
```

### Getting Help

#### 1. Documentation
- [MDN Web Docs](https://developer.mozilla.org/)
- [Webpack Documentation](https://webpack.js.org/)
- [Leaflet Documentation](https://leafletjs.com/)

#### 2. Tools
- **Browser DevTools**: For debugging and profiling
- **Webpack Bundle Analyzer**: For analyzing bundle size
- **Lighthouse**: For performance auditing
- **ESLint**: For code quality

#### 3. Support Channels
- Create GitHub issues for bugs
- Use internal chat for quick questions
- Schedule pair programming sessions for complex issues

---

**Last Updated:** December 27, 2024  
**Version:** 1.0.0  
**Maintainer:** Development Team