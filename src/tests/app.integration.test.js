/**
 * Application Integration Tests
 * Tests the complete application initialization and basic functionality
 */

describe('Application Integration', () => {
  beforeEach(() => {
    // Reset DOM for each test
    document.body.innerHTML = `
      <div id="globalLoading" class="global-loading">
        <div class="global-loading-spinner"></div>
        <div class="global-loading-text">Loading Toilet Review System...</div>
      </div>
      <div id="search-container"></div>
      <div id="map"></div>
    `;

    // Mock window.location
    delete window.location;
    window.location = { pathname: '/', href: 'http://localhost:3000/' };

    // Mock fetch
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('CSS Loading', () => {
    test('should load CSS files correctly', () => {
      const cssLinks = document.querySelectorAll('link[rel="stylesheet"]');
      expect(cssLinks.length).toBeGreaterThan(0);
    });

    test('should have base CSS variables defined', () => {
      const root = document.documentElement;
      const primaryColor = getComputedStyle(root).getPropertyValue('--color-primary');
      expect(primaryColor).toBeTruthy();
    });
  });

  describe('DOM Structure', () => {
    test('should have required containers', () => {
      expect(document.getElementById('search-container')).toBeInTheDocument();
      expect(document.getElementById('map')).toBeInTheDocument();
      expect(document.getElementById('globalLoading')).toBeInTheDocument();
    });

    test('should have proper semantic structure', () => {
      const main = document.querySelector('main');
      expect(main).toBeInTheDocument();
      expect(main.getAttribute('role')).toBe('main');
    });
  });

  describe('External Libraries', () => {
    test('should have Leaflet available', () => {
      expect(typeof L).toBe('object');
      expect(L.map).toBeDefined();
    });

    test('should have Html5Qrcode available', () => {
      expect(typeof Html5Qrcode).toBe('function');
    });
  });

  describe('Application Initialization', () => {
    test('should initialize without errors', async () => {
      // Mock successful API responses
      global.fetch.mockImplementation((url) => {
        if (url.includes('/api/toilet/map')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ data: [] })
          });
        }
        if (url.includes('/api/toilet/stats')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ total: 0 })
          });
        }
        return Promise.resolve({
          ok: false,
          status: 404
        });
      });

      // Import and initialize app
      const { default: toiletReviewApp } = await import('../app.js');

      // Should not throw during initialization
      await expect(toiletReviewApp.init()).resolves.not.toThrow();

      // Should have initialized flag
      expect(toiletReviewApp.initialized).toBe(true);
    });

    test('should handle initialization errors gracefully', async () => {
      // Mock failed API responses
      global.fetch.mockRejectedValue(new Error('Network error'));

      const { default: toiletReviewApp } = await import('../app.js');

      // Should handle errors gracefully
      await expect(toiletReviewApp.init()).resolves.not.toThrow();

      // Should still be marked as initialized
      expect(toiletReviewApp.initialized).toBe(true);
    });
  });

  describe('Component Loading', () => {
    test('should load home page components', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: [] })
      });

      const { default: toiletReviewApp } = await import('../app.js');
      await toiletReviewApp.init();

      // Should have loaded home page
      expect(toiletReviewApp.currentPage).toBe('home');
      expect(toiletReviewApp.modules.has('homePage')).toBe(true);
    });

    test('should handle component loading errors', async () => {
      // Mock dynamic import failure
      const originalImport = window.import;
      window.import = jest.fn().mockRejectedValue(new Error('Import failed'));

      const { default: toiletReviewApp } = await import('../app.js');
      await toiletReviewApp.init();

      // Should handle import errors gracefully
      expect(toiletReviewApp.initialized).toBe(true);

      // Restore original import
      window.import = originalImport;
    });
  });

  describe('State Management', () => {
    test('should initialize app store', async () => {
      const { appStore } = await import('../state/store/app.store.js');

      expect(appStore).toBeDefined();
      expect(typeof appStore.getState).toBe('function');
      expect(typeof appStore.setState).toBe('function');
    });

    test('should handle state changes', async () => {
      const { appStore } = await import('../state/store/app.store.js');

      const mockCallback = jest.fn();
      appStore.subscribe('state:changed', mockCallback);

      appStore.setState({ test: 'value' });

      expect(mockCallback).toHaveBeenCalled();
    });
  });

  describe('API Services', () => {
    test('should initialize API services', async () => {
      const { toiletApiService } = await import('../services/api/toilet-api.service.js');
      const { reviewApiService } = await import('../services/api/review-api.service.js');

      expect(toiletApiService).toBeDefined();
      expect(reviewApiService).toBeDefined();
      expect(typeof toiletApiService.getMapData).toBe('function');
      expect(typeof reviewApiService.submitReview).toBe('function');
    });

    test('should handle API errors gracefully', async () => {
      global.fetch.mockRejectedValue(new Error('API Error'));

      const { toiletApiService } = await import('../services/api/toilet-api.service.js');

      await expect(toiletApiService.getMapData()).rejects.toThrow();
    });
  });
});
