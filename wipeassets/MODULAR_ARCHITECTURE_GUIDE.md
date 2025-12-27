# 🏗️ Modular Frontend Architecture Guide

## Overview

This document provides comprehensive guidance for the **modular frontend architecture** implemented in the Toilet Review System. The architecture follows **SOLID principles**, **design patterns**, and **industry best practices** for scalable, maintainable web applications.

## 📁 Architecture Structure

```
src/
├── 📁 core/                          # Core application logic
│   ├── 📁 config/                    # Configuration management
│   │   └── app.config.js            # App-wide configuration
│   ├── 📁 utils/                     # Utility functions
│   │   └── dom.utils.js             # DOM manipulation utilities
│   └── 📁 constants/                 # Application constants
│       └── api.constants.js         # API endpoints & constants
│
├── 📁 services/                      # Service layer (API communication)
│   ├── 📁 api/                       # API service implementations
│   │   ├── base-api.service.js       # Base API service (Template Method)
│   │   ├── auth-api.service.js       # Authentication operations
│   │   ├── toilet-api.service.js     # Toilet operations
│   │   └── review-api.service.js     # Review operations
│   └── 📁 storage/                   # Local storage services
│
├── 📁 state/                         # State management (Observer Pattern)
│   └── 📁 store/                     # Application state stores
│       └── app.store.js             # Global app state
│
├── 📁 components/                    # UI Components (Component Pattern)
│   ├── 📁 base/                      # Base components
│   │   └── base.component.js         # Base component class
│   └── 📁 ui/                        # UI components
│       ├── button.component.js       # Reusable buttons
│       └── modal.component.js        # Modal dialogs
│
├── 📁 pages/                         # Page modules (Template Method Pattern)
│   ├── 📁 home/                      # Home page module
│   │   └── home.page.js             # Home page implementation
│   ├── 📁 admin/                     # Admin page module
│   │   └── admin.page.js            # Admin page implementation
│   └── 📁 shared/                    # Shared page functionality
│       └── page.base.js             # Base page class
│
└── 📁 app.js                         # Main application entry point
```

## 🏛️ SOLID Principles Implementation

### 1. Single Responsibility Principle (SRP)

Each module has one clear, focused responsibility:

```javascript
// ❌ Bad: Multiple responsibilities in one file
class MixedUtility {
    validateEmail(email) { /* ... */ }
    makeApiCall(endpoint) { /* ... */ }
    renderButton() { /* ... */ }
    saveToLocalStorage(data) { /* ... */ }
}

// ✅ Good: Single responsibility per module
// dom.utils.js - Only DOM operations
export function $(selector) { /* ... */ }

// api.service.js - Only API communication
export class BaseApiService { /* ... */ }

// button.component.js - Only button functionality
export class ButtonComponent { /* ... */ }
```

### 2. Open/Closed Principle (OCP)

Modules are open for extension but closed for modification:

```javascript
// Base component can be extended without modification
export class BaseComponent {
    constructor(options = {}) {
        this.options = { ...this.defaultOptions, ...options };
    }

    // Hook methods for subclasses to override
    async preRender() { /* Default implementation */ }
    async renderContent() { /* Override in subclass */ }
    async postRender() { /* Default implementation */ }
}

// Extension without modifying base class
export class ButtonComponent extends BaseComponent {
    async renderContent() {
        // Custom button rendering
        this.element.innerHTML = `<button>${this.options.text}</button>`;
    }
}
```

### 3. Liskov Substitution Principle (LSP)

Subtypes can replace base types without breaking functionality:

```javascript
// All page classes follow the same interface
export class BasePage {
    async init() { /* Template method */ }
    async render() { /* Template method */ }
    destroy() { /* Cleanup */ }
}

// Any page can replace another
const pages = {
    home: new HomePage(),
    admin: new AdminPage(),
    review: new ReviewPage()
};

// All work identically
for (const [name, page] of Object.entries(pages)) {
    await page.init();     // ✅ Same interface
    await page.render();   // ✅ Same interface
    page.destroy();        // ✅ Same interface
}
```

### 4. Interface Segregation Principle (ISP)

Clients depend only on methods they use:

```javascript
// ❌ Bad: Large interface with unused methods
class FullApiService {
    get() { /* ... */ }
    post() { /* ... */ }
    put() { /* ... */ }
    delete() { /* ... */ }
    validateToken() { /* ... */ }
    refreshToken() { /* ... */ }
    uploadFile() { /* ... */ }
    downloadFile() { /* ... */ }
    // ... many more methods
}

// ✅ Good: Focused interfaces
class BaseApiService {
    get(endpoint) { /* ... */ }
    post(endpoint, data) { /* ... */ }
}

class AuthApiService {
    login(credentials) { /* ... */ }      // Only auth methods
    logout() { /* ... */ }
    validateToken(token) { /* ... */ }
}

class ToiletApiService {
    getMapData(filters) { /* ... */ }     // Only toilet methods
    addPrivateToilet(data) { /* ... */ }
    syncPublicData(options) { /* ... */ }
}
```

### 5. Dependency Inversion Principle (DIP)

High-level modules depend on abstractions, not concretions:

```javascript
// ❌ Bad: Direct dependency on implementation
import { AuthApiService } from './auth-api.service.js';

class LoginPage {
    constructor() {
        this.authService = new AuthApiService(); // Direct instantiation
    }
}

// ✅ Good: Dependency injection with abstraction
class LoginPage {
    constructor(authService) {
        this.authService = authService; // Injected dependency
    }
}

// Usage with dependency injection
const authService = new AuthApiService();
const loginPage = new LoginPage(authService);
```

## 🏭 Design Patterns Used

### Observer Pattern (State Management)

```javascript
import appStore from './state/store/app.store.js';

// Subscribe to state changes
const unsubscribe = appStore.subscribe('state:changed', (event, data) => {
    console.log('State changed:', data.changes);
    // React to state changes
});

// Update state (notifies all observers)
appStore.setUser(true, userData, token);

// Cleanup
unsubscribe();
```

### Template Method Pattern (Page Lifecycle)

```javascript
export class BasePage {
    async init() {
        await this.preInitialize();
        await this.setupData();
        await this.setupEventListeners();
        await this.setupStateObservers();
        await this.render();
        await this.postInitialize();
    }
}

// Custom page implementation
export class HomePage extends BasePage {
    async setupData() {
        // Custom data setup
        this.toilets = await toiletApiService.getMapData();
    }

    async renderContent() {
        // Custom rendering
        this.element.innerHTML = this.getHomeTemplate();
    }
}
```

### Factory Pattern (Component Creation)

```javascript
// Component factory
export class ComponentFactory {
    static create(type, options) {
        switch(type) {
            case 'button':
                return new ButtonComponent(options);
            case 'modal':
                return new ModalComponent(options);
            case 'form':
                return new FormComponent(options);
            default:
                throw new Error(`Unknown component type: ${type}`);
        }
    }
}

// Usage
const button = ComponentFactory.create('button', {
    text: 'Click me',
    onClick: handleClick
});
```

### Module Pattern (Encapsulation)

```javascript
// Service module with private/public interface
const ApiService = (function() {
    // Private variables and methods
    let baseUrl = '/api';
    let requestQueue = [];

    function processQueue() {
        // Private method
    }

    // Public interface
    return {
        get: (endpoint) => makeRequest('GET', endpoint),
        post: (endpoint, data) => makeRequest('POST', endpoint, data),
        // Only expose necessary methods
    };
})();

export default ApiService;
```

## 🚀 Usage Guide

### Creating a New Page

1. **Create page directory structure:**
   ```
   src/pages/newpage/
   └── newpage.page.js
   ```

2. **Implement the page class:**
   ```javascript
   import { BasePage } from '../shared/page.base.js';

   export class NewPage extends BasePage {
       constructor() {
           super({
               requiresAuth: false,
               requiredRole: null
           });
       }

       async setupData() {
           // Load page-specific data
           this.data = await someApiService.getData();
       }

       async renderContent() {
           // Render page content
           this.element.innerHTML = `
               <h1>New Page</h1>
               <div class="content">${this.data.content}</div>
           `;
       }

       async setupEventListeners() {
           // Set up event listeners
           this.addEventListener('click', '.action-btn', this.handleAction);
       }
   }
   ```

3. **Register with the app:**
   ```javascript
   // In src/app.js
   async initializeNewPage() {
       const { NewPage } = await import('./pages/newpage/newpage.page.js');
       const newPage = new NewPage();
       await newPage.init();
       this.modules.set('newPage', newPage);
   }
   ```

### Creating a New Component

1. **Create component file:**
   ```javascript
   import { BaseComponent } from '../base/base.component.js';

   export class CustomComponent extends BaseComponent {
       getTagName() {
           return 'div';
       }

       getClassName() {
           return 'custom-component';
       }

       getTemplate() {
           return `
               <div class="custom-content">
                   <h3>${this.options.title}</h3>
                   <p>${this.options.description}</p>
               </div>
           `;
       }

       async setupEventListeners() {
           this.addEventListener('click', '.custom-content', () => {
               console.log('Custom component clicked');
           });
       }
   }
   ```

2. **Use the component:**
   ```javascript
   const component = new CustomComponent({
       title: 'My Component',
       description: 'Component description'
   });

   await component.init();
   await component.attachToDOM();
   ```

### Adding a New API Service

1. **Create service file:**
   ```javascript
   import { baseApiService } from './base-api.service.js';

   export class NewApiService {
       constructor() {
           this.baseService = baseApiService;
       }

       async getData(id) {
           return await this.baseService.get(`/new/${id}`);
       }

       async createData(data) {
           return await this.baseService.post('/new', data);
       }
   }

   export const newApiService = new NewApiService();
   ```

2. **Use in components/pages:**
   ```javascript
   import { newApiService } from '../services/api/new-api.service.js';

   // In a component or page
   async setupData() {
       this.data = await newApiService.getData(this.id);
   }
   ```

## 🔧 Development Workflow

### Setting Up Development Environment

```bash
# Install dependencies
npm install

# Start development server with hot reload
npm run serve

# Build for production
npm run build

# Build and watch for changes
npm run build:watch
```

### Code Organization Guidelines

1. **File Naming:**
   - Use kebab-case for directories: `toilet-api.service.js`
   - Use camelCase for classes: `ToiletApiService`
   - Use lowercase for files: `toilet-api.service.js`

2. **Import Order:**
   ```javascript
   // 1. External dependencies
   import { something } from 'external-library';

   // 2. Internal core modules
   import AppConfig from '../core/config/app.config.js';

   // 3. Internal services
   import { toiletApiService } from '../services/api/toilet-api.service.js';

   // 4. Internal components/utilities
   import { BaseComponent } from '../components/base/base.component.js';
   ```

3. **Error Handling:**
   ```javascript
   try {
       const data = await apiService.getData();
       // Process data
   } catch (error) {
       console.error('[COMPONENT] Failed to load data:', error);
       this.showError('Failed to load data. Please try again.');
   }
   ```

### Testing Guidelines

1. **Unit Tests:**
   ```javascript
   // Test individual functions/methods
   describe('ToiletApiService', () => {
       test('getMapData returns formatted data', async () => {
           const service = new ToiletApiService();
           const data = await service.getMapData({});
           expect(data).toBeDefined();
           expect(Array.isArray(data)).toBe(true);
       });
   });
   ```

2. **Integration Tests:**
   ```javascript
   // Test component interactions
   describe('HomePage Integration', () => {
       test('loads toilets and renders map', async () => {
           const page = new HomePage();
           await page.init();

           expect(page.map).toBeDefined();
           expect(page.allToilets.length).toBeGreaterThan(0);
       });
   });
   ```

## 📊 Performance Optimizations

### Code Splitting
The architecture supports automatic code splitting:

```javascript
// Dynamic imports for lazy loading
async initializeAdminPage() {
    const { AdminPage } = await import('./pages/admin/admin.page.js');
    // Only loads when needed
}
```

### Bundle Optimization
Webpack configuration provides:

- **Vendor chunking** - Separate third-party libraries
- **Core chunking** - Separate core application code
- **Component chunking** - Separate reusable components
- **Asset optimization** - Minified CSS/JS with source maps

### Memory Management
Automatic cleanup prevents memory leaks:

```javascript
// Components automatically clean up
await component.destroy(); // Removes event listeners, clears references

// Pages automatically clean up
page.destroy(); // Cleans up all child components and listeners
```

## 🔍 Debugging and Monitoring

### State Debugging
```javascript
// Monitor all state changes
appStore.subscribe('state:changed', (event, data) => {
    console.log('State changed:', data.changes);
});

// Get current state
const currentState = appStore.getState();

// Get state history
const history = appStore.getHistory();
```

### Performance Monitoring
```javascript
// Automatic performance tracking
appStore.subscribe('performance:pageLoad', (event, data) => {
    console.log(`Page loaded in ${data.loadTime}ms`);
});
```

### Error Tracking
```javascript
// Global error handling
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    // Send to error tracking service
});
```

## 🚀 Deployment

### Production Build
```bash
# Create optimized production build
npm run build

# Preview production build
npm run serve:prod
```

### Build Output
```
dist/
├── js/
│   ├── app.[hash].js          # Main application bundle
│   ├── home.[hash].js         # Home page chunk
│   ├── admin.[hash].js        # Admin page chunk
│   ├── core.[hash].js         # Core modules chunk
│   ├── services.[hash].js     # Services chunk
│   └── components.[hash].js   # Components chunk
├── css/
│   └── style.css              # Optimized styles
├── assets/                    # Optimized assets
└── *.html                     # Updated HTML files
```

## 📚 API Reference

### Core Modules

#### AppConfig
```javascript
import AppConfig from './core/config/app.config.js';

// Get API base URL
const baseUrl = AppConfig.api.baseUrl;

// Get feature flags
const cachingEnabled = AppConfig.features.enableCaching;
```

#### DOM Utilities
```javascript
import { $, createElement, addEventListener } from './core/utils/dom.utils.js';

// Safe element selection
const element = $('selector');

// Create elements safely
const button = createElement('button', { className: 'btn' }, 'Click me');

// Add event listeners with cleanup
const cleanup = addEventListener(element, 'click', handler);
```

### Services

#### API Services
```javascript
import { toiletApiService } from './services/api/toilet-api.service.js';

// Get map data
const toilets = await toiletApiService.getMapData({
    showPublic: true,
    showPrivate: true
});

// Add new toilet
await toiletApiService.addPrivateToilet({
    name: 'New Toilet',
    location: 'Location',
    coordinates: { latitude: 12.34, longitude: 56.78 }
});
```

#### State Management
```javascript
import appStore from './state/store/app.store.js';

// Subscribe to changes
const unsubscribe = appStore.subscribe('state:changed', (event, data) => {
    console.log('State changed');
});

// Update state
appStore.setLoading('toilets', true);
appStore.setToilets(toiletData);
appStore.addNotification({
    type: 'success',
    title: 'Success',
    message: 'Operation completed'
});
```

### Components

#### Creating Components
```javascript
import { ButtonComponent } from './components/ui/button.component.js';

const button = new ButtonComponent({
    text: 'Click me',
    variant: 'primary',
    onClick: handleClick
});

await button.init();
await button.attachToDOM();
```

#### Creating Pages
```javascript
import { BasePage } from './pages/shared/page.base.js';

class CustomPage extends BasePage {
    async setupData() {
        this.data = await loadData();
    }

    async renderContent() {
        this.element.innerHTML = getTemplate(this.data);
    }
}
```

## 🎯 Best Practices

### Code Quality
- **Consistent naming** - Use clear, descriptive names
- **JSDoc comments** - Document all public APIs
- **Error handling** - Always handle errors gracefully
- **Performance** - Optimize for speed and memory usage

### Architecture Guidelines
- **Single responsibility** - One job per module
- **Dependency injection** - Inject dependencies, don't instantiate
- **Interface consistency** - Follow established patterns
- **Testability** - Write testable, isolated code

### Performance Tips
- **Lazy loading** - Load code only when needed
- **Memoization** - Cache expensive operations
- **Efficient DOM** - Minimize DOM manipulations
- **Bundle splitting** - Split code for optimal loading

## 🆘 Troubleshooting

### Common Issues

1. **Module not found:**
   ```javascript
   // Check import paths
   import { BaseComponent } from '../base/base.component.js'; // Correct
   import { BaseComponent } from './base/base.component.js';   // Wrong
   ```

2. **State not updating:**
   ```javascript
   // Use proper state updates
   appStore.setState(prevState => ({
       ...prevState,
       user: { ...prevState.user, name: 'New Name' }
   }));
   ```

3. **Memory leaks:**
   ```javascript
   // Always clean up
   await component.destroy();
   unsubscribe();
   ```

### Debug Tools

```javascript
// Enable debug logging
AppConfig.features.enableDebugLogging = true;

// Monitor state changes
appStore.subscribe('state:changed', console.log);

// Check app info
const info = toiletReviewApp.getInfo();
console.log('App info:', info);
```

## 📞 Support

For questions about the modular architecture:

1. **Check this guide** - Comprehensive documentation
2. **Review examples** - Look at existing implementations
3. **Check console logs** - Detailed error messages and debugging
4. **Follow patterns** - Consistent code organization

## 🎉 Conclusion

This modular architecture provides a **solid foundation** for scalable, maintainable web applications. By following **SOLID principles** and **design patterns**, the codebase remains **clean**, **testable**, and **extensible**.

The architecture supports:
- ✅ **Scalable development** - Easy to add new features
- ✅ **Team collaboration** - Clear module boundaries
- ✅ **Performance optimization** - Efficient loading and rendering
- ✅ **Maintainability** - Clean, organized code structure
- ✅ **Testability** - Isolated, testable modules

**Welcome to professional-grade frontend architecture! 🚀**
