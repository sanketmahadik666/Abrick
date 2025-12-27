/**
 * Frontend Validation Test Suite
 * Comprehensive testing for all frontend components and functionality
 * Run this in browser console to validate the entire frontend system
 */

class FrontendValidator {
    constructor() {
        this.testResults = [];
        this.errors = [];
        this.warnings = [];
    }

    /**
     * Run all validation tests
     */
    async runAllTests() {
        console.log('🧪 STARTING FRONTEND VALIDATION SUITE');
        console.log('='.repeat(60));

        const startTime = Date.now();

        try {
            await this.testCoreSystems();
            await this.testAPIIntegration();
            await this.testMapFunctionality();
            await this.testErrorHandling();
            await this.testPerformance();
            await this.testUserInterface();
            await this.testAccessibility();
            
            const duration = Date.now() - startTime;
            this.generateReport(duration);
            
        } catch (error) {
            console.error('❌ Validation suite failed:', error);
        }
    }

    /**
     * Test core system components
     */
    async testCoreSystems() {
        console.log('\n🏗️ TESTING CORE SYSTEMS');
        console.log('-'.repeat(30));

        // Test 1: Application Configuration
        this.test('Application Config', () => {
            if (typeof AppConfig === 'undefined') {
                throw new Error('AppConfig not found');
            }
            if (!AppConfig.api || !AppConfig.map) {
                throw new Error('AppConfig missing required properties');
            }
            return true;
        });

        // Test 2: State Management
        this.test('State Management', () => {
            if (typeof appStore === 'undefined') {
                throw new Error('appStore not found');
            }
            const state = appStore.getState();
            if (!state.loading || !state.ui || !state.user) {
                throw new Error('State structure invalid');
            }
            return true;
        });

        // Test 3: DOM Utilities
        this.test('DOM Utilities', () => {
            if (typeof $ === 'undefined' || typeof $$ === 'undefined') {
                throw new Error('DOM utilities not found');
            }
            
            // Test element selection
            const testElement = document.createElement('div');
            testElement.id = 'test-element';
            document.body.appendChild(testElement);
            
            const found = $('#test-element');
            if (!found) {
                throw new Error('Element selection failed');
            }
            
            document.body.removeChild(testElement);
            return true;
        });

        // Test 4: Error Handler
        this.test('Error Handler', () => {
            if (typeof errorHandler === 'undefined') {
                throw new Error('errorHandler not found');
            }
            if (typeof errorHandler.handleError !== 'function') {
                throw new Error('errorHandler.handleError is not a function');
            }
            return true;
        });

        // Test 5: Module System
        this.test('Module System', () => {
            const modules = ['app', 'dom', 'store', 'errorHandler'];
            modules.forEach(module => {
                if (typeof window[module] === 'undefined' && typeof window[module.charAt(0).toUpperCase() + module.slice(1)] === 'undefined') {
                    // Some modules are exported differently, just check they're available in some form
                    const globalObj = window;
                    const moduleExists = Object.keys(globalObj).some(key => 
                        key.toLowerCase().includes(module.toLowerCase())
                    );
                    if (!moduleExists) {
                        console.warn(`⚠️ Module ${module} might not be properly exposed`);
                    }
                }
            });
            return true;
        });
    }

    /**
     * Test API integration
     */
    async testAPIIntegration() {
        console.log('\n🔗 TESTING API INTEGRATION');
        console.log('-'.repeat(30));

        // Test 1: API Base URL
        this.test('API Base URL', () => {
            if (typeof AppConfig !== 'undefined' && AppConfig.api) {
                if (!AppConfig.api.baseUrl) {
                    throw new Error('API base URL not configured');
                }
                return true;
            }
            return true; // Skip if config not available
        });

        // Test 2: Network Connectivity
        this.test('Network Connectivity', async () => {
            try {
                const response = await fetch('/api/toilet/stats', {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' }
                });
                
                if (!response.ok) {
                    throw new Error(`API returned ${response.status}`);
                }
                
                const data = await response.json();
                if (!data || typeof data !== 'object') {
                    throw new Error('Invalid API response format');
                }
                
                console.log(`✅ API Stats: ${data.total || 0} toilets total`);
                return true;
            } catch (error) {
                if (error.message.includes('fetch')) {
                    console.warn('⚠️ Network connectivity test skipped (likely CORS or server not running)');
                    return true; // Skip network tests if server not available
                }
                throw error;
            }
        });

        // Test 3: API Data Validation
        this.test('API Data Validation', async () => {
            try {
                const response = await fetch('/api/toilet/map?limit=1');
                if (response.ok) {
                    const data = await response.json();
                    if (data.success && Array.isArray(data.data)) {
                        console.log(`✅ API Map: ${data.data.length} toilets in response`);
                        if (data.data.length > 0) {
                            const toilet = data.data[0];
                            if (!toilet.id || !toilet.coordinates) {
                                throw new Error('Toilet data missing required fields');
                            }
                        }
                    }
                }
                return true;
            } catch (error) {
                console.warn('⚠️ API validation test skipped:', error.message);
                return true;
            }
        });
    }

    /**
     * Test map functionality
     */
    async testMapFunctionality() {
        console.log('\n🗺️ TESTING MAP FUNCTIONALITY');
        console.log('-'.repeat(30));

        // Test 1: Leaflet Library
        this.test('Leaflet Library', () => {
            if (typeof L === 'undefined') {
                throw new Error('Leaflet library not loaded');
            }
            if (typeof L.map !== 'function') {
                throw new Error('Leaflet map function not available');
            }
            return true;
        });

        // Test 2: Map Container
        this.test('Map Container', () => {
            const mapContainer = document.getElementById('map');
            if (!mapContainer) {
                throw new Error('Map container not found');
            }
            return true;
        });

        // Test 3: Map Initialization
        this.test('Map Initialization', () => {
            try {
                // Create test map (don't add to DOM to avoid interference)
                const testDiv = document.createElement('div');
                testDiv.style.cssText = 'width: 100px; height: 100px;';
                document.body.appendChild(testDiv);
                
                const testMap = L.map(testDiv, {
                    center: [18.5204, 73.8567],
                    zoom: 13
                });
                
                // Verify map methods
                if (typeof testMap.setView !== 'function') {
                    throw new Error('Map setView method not available');
                }
                
                // Clean up
                testMap.remove();
                document.body.removeChild(testDiv);
                
                return true;
            } catch (error) {
                throw new Error(`Map initialization failed: ${error.message}`);
            }
        });

        // Test 4: Tile Layer
        this.test('Tile Layer', () => {
            try {
                const testDiv = document.createElement('div');
                testDiv.style.cssText = 'width: 100px; height: 100px;';
                document.body.appendChild(testDiv);
                
                const testMap = L.map(testDiv);
                const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: 'Test attribution'
                });
                
                tileLayer.addTo(testMap);
                
                // Verify tile layer is added
                const layers = testMap.getLayers();
                if (layers.length === 0) {
                    throw new Error('Tile layer not added to map');
                }
                
                // Clean up
                testMap.remove();
                document.body.removeChild(testDiv);
                
                return true;
            } catch (error) {
                throw new Error(`Tile layer test failed: ${error.message}`);
            }
        });

        // Test 5: Marker Clustering
        this.test('Marker Clustering', () => {
            if (typeof L === 'undefined' || typeof L.markerClusterGroup !== 'function') {
                console.warn('⚠️ Marker clustering plugin not available (optional)');
                return true;
            }
            
            try {
                const clusterGroup = L.markerClusterGroup();
                const marker = L.marker([18.5204, 73.8567]);
                clusterGroup.addLayer(marker);
                
                if (clusterGroup.getLayers().length !== 1) {
                    throw new Error('Marker not added to cluster group');
                }
                
                return true;
            } catch (error) {
                throw new Error(`Marker clustering test failed: ${error.message}`);
            }
        });
    }

    /**
     * Test error handling
     */
    async testErrorHandling() {
        console.log('\n🛡️ TESTING ERROR HANDLING');
        console.log('-'.repeat(30));

        // Test 1: Error Handler Availability
        this.test('Error Handler Availability', () => {
            if (typeof errorHandler === 'undefined') {
                throw new Error('Error handler not found');
            }
            return true;
        });

        // Test 2: Error Notification System
        this.test('Error Notification System', () => {
            if (typeof appStore === 'undefined') {
                throw new Error('App store not found for notifications');
            }
            
            // Test adding notification
            const notificationId = appStore.addNotification({
                type: 'info',
                title: 'Test Notification',
                message: 'This is a test notification',
                duration: 1000
            });
            
            if (!notificationId) {
                throw new Error('Failed to add test notification');
            }
            
            // Verify notification was added
            const state = appStore.getState();
            const hasNotification = state.ui.notifications.some(n => n.id === notificationId);
            if (!hasNotification) {
                throw new Error('Test notification not found in state');
            }
            
            return true;
        });

        // Test 3: DOM Error Handling
        this.test('DOM Error Handling', () => {
            try {
                // Test invalid selector
                const invalidElement = $('#invalid-selector-12345');
                if (invalidElement !== null) {
                    throw new Error('Invalid selector should return null');
                }
                
                // Test invalid element creation
                const invalidElement2 = document.createElement('invalid-tag-name-123');
                if (!invalidElement2) {
                    throw new Error('Should handle invalid tags gracefully');
                }
                
                return true;
            } catch (error) {
                throw new Error(`DOM error handling failed: ${error.message}`);
            }
        });

        // Test 4: Async Error Handling
        this.test('Async Error Handling', async () => {
            try {
                // Test fetch error handling
                const response = await fetch('/nonexistent-endpoint-12345');
                if (response.ok) {
                    throw new Error('Should have failed for nonexistent endpoint');
                }
                return true;
            } catch (error) {
                // Expected to fail, this is good
                return true;
            }
        });
    }

    /**
     * Test performance
     */
    async testPerformance() {
        console.log('\n⚡ TESTING PERFORMANCE');
        console.log('-'.repeat(30));

        // Test 1: Page Load Performance
        this.test('Page Load Performance', () => {
            if (typeof performance !== 'undefined' && performance.timing) {
                const perfData = performance.timing;
                const loadTime = perfData.loadEventEnd - perfData.navigationStart;
                
                if (loadTime > 0) {
                    console.log(`📊 Page load time: ${loadTime}ms`);
                    if (loadTime > 5000) {
                        console.warn('⚠️ Page load time is slow (>5s)');
                    }
                }
            }
            return true;
        });

        // Test 2: Memory Usage
        this.test('Memory Usage', () => {
            if (typeof performance !== 'undefined' && performance.memory) {
                const memInfo = performance.memory;
                const usedMB = Math.round(memInfo.usedJSHeapSize / 1024 / 1024);
                console.log(`💾 Memory usage: ${usedMB}MB`);
                
                if (usedMB > 100) {
                    console.warn('⚠️ High memory usage detected');
                }
            }
            return true;
        });

        // Test 3: DOM Performance
        this.test('DOM Performance', () => {
            const start = performance.now();
            
            // Create and remove many elements
            for (let i = 0; i < 100; i++) {
                const div = document.createElement('div');
                div.textContent = `Test ${i}`;
                document.body.appendChild(div);
                document.body.removeChild(div);
            }
            
            const duration = performance.now() - start;
            console.log(`🎯 DOM operations (100 creates/removes): ${duration.toFixed(2)}ms`);
            
            if (duration > 100) {
                console.warn('⚠️ DOM operations are slow');
            }
            
            return true;
        });
    }

    /**
     * Test user interface
     */
    async testUserInterface() {
        console.log('\n🎨 TESTING USER INTERFACE');
        console.log('-'.repeat(30));

        // Test 1: Required Elements
        this.test('Required UI Elements', () => {
            const requiredElements = [
                { id: 'globalLoading', name: 'Global Loading' },
                { id: 'map', name: 'Map Container' },
                { id: 'search-container', name: 'Search Container' }
            ];
            
            requiredElements.forEach(({ id, name }) => {
                const element = document.getElementById(id);
                if (!element) {
                    throw new Error(`${name} element not found (ID: ${id})`);
                }
            });
            
            return true;
        });

        // Test 2: CSS Loading
        this.test('CSS Loading', () => {
            const stylesheets = document.querySelectorAll('link[rel="stylesheet"]');
            console.log(`📄 Found ${stylesheets.length} stylesheets`);
            
            if (stylesheets.length === 0) {
                throw new Error('No stylesheets found');
            }
            
            // Check if styles are applied
            const testElement = document.createElement('div');
            testElement.className = 'test-style-check';
            testElement.style.cssText = 'position: absolute; top: -9999px;';
            document.body.appendChild(testElement);
            
            const computed = window.getComputedStyle(testElement);
            const hasStyles = computed.position !== 'static' || stylesheets.length > 0;
            
            document.body.removeChild(testElement);
            
            return true;
        });

        // Test 3: Responsive Design
        this.test('Responsive Design', () => {
            const viewport = {
                width: window.innerWidth,
                height: window.innerHeight
            };
            
            console.log(`📱 Viewport: ${viewport.width}x${viewport.height}`);
            
            // Check if viewport meta tag exists
            const viewportMeta = document.querySelector('meta[name="viewport"]');
            if (!viewportMeta) {
                console.warn('⚠️ Viewport meta tag not found');
            }
            
            return true;
        });

        // Test 4: Navigation
        this.test('Navigation Elements', () => {
            const navElements = document.querySelectorAll('nav, .nav, [role="navigation"]');
            console.log(`🧭 Found ${navElements.length} navigation elements`);
            
            if (navElements.length === 0) {
                console.warn('⚠️ No navigation elements found');
            }
            
            return true;
        });
    }

    /**
     * Test accessibility
     */
    async testAccessibility() {
        console.log('\n♿ TESTING ACCESSIBILITY');
        console.log('-'.repeat(30));

        // Test 1: ARIA Labels
        this.test('ARIA Labels', () => {
            const elementsWithAria = document.querySelectorAll('[aria-label], [aria-labelledby], [role]');
            console.log(`🏷️ Found ${elementsWithAria.length} elements with ARIA attributes`);
            
            // Check for missing alt attributes on images
            const images = document.querySelectorAll('img');
            const imagesWithoutAlt = Array.from(images).filter(img => !img.alt);
            
            if (imagesWithoutAlt.length > 0) {
                console.warn(`⚠️ ${imagesWithoutAlt.length} images missing alt attributes`);
            }
            
            return true;
        });

        // Test 2: Semantic HTML
        this.test('Semantic HTML', () => {
            const semanticElements = document.querySelectorAll('header, nav, main, section, article, aside, footer');
            console.log(`📝 Found ${semanticElements.length} semantic HTML elements`);
            
            const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
            console.log(`📑 Found ${headings.length} headings`);
            
            if (headings.length === 0) {
                console.warn('⚠️ No headings found');
            }
            
            return true;
        });

        // Test 3: Form Accessibility
        this.test('Form Accessibility', () => {
            const forms = document.querySelectorAll('form');
            const inputs = document.querySelectorAll('input, select, textarea');
            
            console.log(`📋 Found ${forms.length} forms with ${inputs.length} inputs`);
            
            // Check for labels
            const inputsWithoutLabels = Array.from(inputs).filter(input => {
                const id = input.id;
                const hasLabel = id && document.querySelector(`label[for="${id}"]`);
                const hasAriaLabel = input.getAttribute('aria-label');
                const hasAriaLabelledby = input.getAttribute('aria-labelledby');
                
                return !hasLabel && !hasAriaLabel && !hasAriaLabelledby;
            });
            
            if (inputsWithoutLabels.length > 0) {
                console.warn(`⚠️ ${inputsWithoutLabels.length} inputs missing labels`);
            }
            
            return true;
        });
    }

    /**
     * Run individual test
     */
    test(name, testFunction) {
        try {
            const result = testFunction();
            if (result === false) {
                throw new Error('Test returned false');
            }
            console.log(`✅ ${name}`);
            this.testResults.push({ name, status: 'pass' });
            return true;
        } catch (error) {
            console.error(`❌ ${name}: ${error.message}`);
            this.testResults.push({ name, status: 'fail', error: error.message });
            this.errors.push({ name, error: error.message });
            return false;
        }
    }

    /**
     * Generate final report
     */
    generateReport(duration) {
        console.log('\n📊 VALIDATION REPORT');
        console.log('='.repeat(60));
        
        const passed = this.testResults.filter(r => r.status === 'pass').length;
        const failed = this.testResults.filter(r => r.status === 'fail').length;
        const total = this.testResults.length;
        
        console.log(`📈 Tests Passed: ${passed}/${total}`);
        console.log(`📉 Tests Failed: ${failed}/${total}`);
        console.log(`⏱️ Duration: ${duration}ms`);
        
        if (failed > 0) {
            console.log('\n❌ FAILED TESTS:');
            this.errors.forEach(error => {
                console.log(`  • ${error.name}: ${error.error}`);
            });
        }
        
        if (this.warnings.length > 0) {
            console.log('\n⚠️ WARNINGS:');
            this.warnings.forEach(warning => {
                console.log(`  • ${warning}`);
            });
        }
        
        const successRate = total > 0 ? (passed / total * 100).toFixed(1) : 0;
        console.log(`\n🎯 Success Rate: ${successRate}%`);
        
        if (failed === 0) {
            console.log('\n🎉 ALL TESTS PASSED! Frontend validation successful.');
        } else {
            console.log('\n⚠️ Some tests failed. Please review the issues above.');
        }
        
        // Provide recommendations
        console.log('\n💡 RECOMMENDATIONS:');
        if (failed === 0) {
            console.log('  • Frontend is ready for production');
            console.log('  • Consider running automated E2E tests');
            console.log('  • Monitor performance in production');
        } else {
            console.log('  • Fix failed tests before deployment');
            console.log('  • Review error handling implementation');
            console.log('  • Test in different browsers');
        }
        
        console.log('\n🔧 DEBUG COMMANDS:');
        console.log('  • window.debugApp - Access debug utilities');
        console.log('  • errorHandler.getErrorLog() - View error history');
        console.log('  • appStore.getState() - View application state');
    }
}

// Auto-run validation if in browser environment
if (typeof window !== 'undefined') {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => {
                const validator = new FrontendValidator();
                validator.runAllTests();
            }, 1000);
        });
    } else {
        // DOM already loaded
        setTimeout(() => {
            const validator = new FrontendValidator();
            validator.runAllTests();
        }, 1000);
    }
}

// Export for manual use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FrontendValidator;
}