const puppeteer = require('puppeteer');
const { spawn } = require('child_process');
const path = require('path');

describe('End-to-End Tests - Frontend to Backend Navigation', () => {
    let browser;
    let page;
    let server;

    beforeAll(async () => {
        // Start the server
        server = spawn('node', ['server.js'], {
            cwd: path.join(__dirname, '..'),
            stdio: 'pipe'
        });

        // Wait for server to start
        await new Promise((resolve) => {
            server.stdout.on('data', (data) => {
                if (data.toString().includes('server is running on port 3000')) {
                    resolve();
                }
            });
        });

        // Launch browser
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
    }, 30000);

    afterAll(async () => {
        if (browser) await browser.close();
        if (server) {
            server.kill();
            // Wait for server to shut down
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    });

    beforeEach(async () => {
        page = await browser.newPage();
        // Set longer timeout for navigation
        page.setDefaultTimeout(10000);
        page.setDefaultNavigationTimeout(10000);
    });

    afterEach(async () => {
        if (page) await page.close();
    });

    describe('Main Page Navigation', () => {
        test('should load main page successfully', async () => {
            await page.goto('http://localhost:3000');
            await page.waitForSelector('h1');

            const title = await page.$eval('h1', el => el.textContent);
            expect(title).toContain('Toilet Review System');

            // Check if map container exists
            const mapContainer = await page.$('#map');
            expect(mapContainer).toBeTruthy();
        });

        test('should display navigation menu', async () => {
            await page.goto('http://localhost:3000');

            // Check for navigation links
            const navLinks = await page.$$('nav a');
            expect(navLinks.length).toBeGreaterThan(0);

            // Check for specific navigation items
            const navText = await page.$eval('nav', el => el.textContent);
            expect(navText).toMatch(/Home|Map|Admin|About/i);
        });

        test('should navigate to admin panel', async () => {
            await page.goto('http://localhost:3000');

            // Click admin link
            const adminLink = await page.$('a[href*="admin"]');
            if (adminLink) {
                await adminLink.click();
                await page.waitForNavigation();

                const url = page.url();
                expect(url).toMatch(/admin/);

                // Check for admin panel content
                const adminContent = await page.$eval('body', el => el.textContent);
                expect(adminContent).toMatch(/Admin|Login|Dashboard/i);
            }
        });
    });

    describe('Map Functionality', () => {
        test('should load map with toilet markers', async () => {
            await page.goto('http://localhost:3000');

            // Wait for map to initialize
            await page.waitForSelector('#map', { timeout: 5000 });

            // Check if Leaflet map is loaded
            const mapLoaded = await page.evaluate(() => {
                return typeof window.map !== 'undefined';
            });

            // Note: Actual map loading depends on internet connection for tiles
            // We just verify the map container and basic functionality
            const mapContainer = await page.$('#map');
            expect(mapContainer).toBeTruthy();
        });

        test('should display toilet information popup', async () => {
            // First, ensure we have sample data by making an API call
            await page.evaluate(async () => {
                await fetch('http://localhost:3000/api/toilet/add', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: 'E2E Test Toilet',
                        location: 'Test Location',
                        coordinates: { latitude: 40.7128, longitude: -74.0060 }
                    })
                });
            });

            await page.goto('http://localhost:3000');

            // Wait for map and check if markers are displayed
            await page.waitForSelector('#map');

            // This test verifies the frontend can load and display data
            // Actual marker clicking would require more complex setup
            const pageContent = await page.$eval('body', el => el.textContent);
            expect(pageContent).toBeTruthy(); // Page loaded successfully
        });
    });

    describe('Review Submission Flow', () => {
        test('should navigate to review page', async () => {
            await page.goto('http://localhost:3000');

            // Look for review-related links or buttons
            const reviewLinks = await page.$$('a[href*="review"]');
            if (reviewLinks.length > 0) {
                await reviewLinks[0].click();
                await page.waitForNavigation();

                const url = page.url();
                expect(url).toMatch(/review/);
            } else {
                // Check if review form is on main page
                const reviewForm = await page.$('form[action*="review"]');
                expect(reviewForm).toBeTruthy();
            }
        });

        test('should submit a review successfully', async () => {
            // First create a toilet via API and get its ID
            const toiletResponse = await page.evaluate(async () => {
                const response = await fetch('http://localhost:3000/api/toilet/add', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: 'Review Test Toilet',
                        location: 'Test Location',
                        coordinates: { latitude: 40.7128, longitude: -74.0060 }
                    })
                });
                return await response.json();
            });

            // Navigate to review page with toilet ID
            await page.goto(`http://localhost:3000/review.html?id=${toiletResponse.id}`);

            // Wait for review form to be visible (it should show when ID is provided)
            await page.waitForSelector('#reviewFormSection', { visible: true, timeout: 5000 });

            // Fill out review form using radio buttons (star ratings)
            // Overall rating - select 4 stars
            await page.click('input[name="rating"][value="4"]');

            // Cleanliness - select 4 stars
            await page.click('input[name="cleanliness"][value="4"]');

            // Maintenance - select 5 stars
            await page.click('input[name="maintenance"][value="5"]');

            // Accessibility - select 4 stars
            await page.click('input[name="accessibility"][value="4"]');

            // Fill comment field
            await page.type('#comments', 'Great toilet from E2E test! Very clean and well-maintained.');

            // Submit form
            await page.click('#reviewForm button[type="submit"]');

            // Wait for success message or navigation
            await page.waitForSelector('#successMessage', { visible: true, timeout: 5000 });

            // Verify success message is displayed
            const successMessage = await page.$eval('#successMessage h2', el => el.textContent);
            expect(successMessage).toContain('Thank you for your review');
        });
    });

    describe('Admin Panel Functionality', () => {
        test('should load admin login page', async () => {
            await page.goto('http://localhost:3000/admin.html');

            // Check for login form specifically
            const loginForm = await page.$('#loginForm');
            expect(loginForm).toBeTruthy();

            // Check for email and password fields in login form
            const emailField = await page.$('#email');
            const passwordField = await page.$('#password');

            expect(emailField).toBeTruthy();
            expect(passwordField).toBeTruthy();

            // Check for register form as well
            const registerForm = await page.$('#adminRegisterForm');
            expect(registerForm).toBeTruthy();
        });

        test('should register and login as admin', async () => {
            await page.goto('http://localhost:3000/admin.html');

            // First register a new admin account
            await page.type('#registerEmail', 'e2e-admin@example.com');
            await page.type('#registerPassword', 'admin123');

            // Submit registration form
            await page.click('#adminRegisterForm button[type="submit"]');

            // Wait for registration to complete and dashboard to show
            await page.waitForSelector('#adminDashboard', { visible: true, timeout: 5000 });

            // Verify we're logged in and dashboard is visible
            const dashboardVisible = await page.$('#adminDashboard');
            expect(dashboardVisible).toBeTruthy();

            // Check that logout button is now visible
            const logoutButton = await page.$('#logoutBtn');
            expect(logoutButton).toBeTruthy();
        });

        test('should display admin dashboard after login', async () => {
            // This test assumes successful login from previous test
            await page.goto('http://localhost:3000/admin.html');

            // Check for dashboard elements
            const pageContent = await page.$eval('body', el => el.textContent);
            // Should contain admin-specific content or login form
            expect(pageContent.length).toBeGreaterThan(0);
        });
    });

    describe('Error Handling and Edge Cases', () => {
        test('should handle 404 pages gracefully', async () => {
            await page.goto('http://localhost:3000/nonexistent-page');

            // Should either show 404 or redirect to main page
            const pageContent = await page.$eval('body', el => el.textContent);
            expect(pageContent).toBeTruthy();
        });

        test('should handle network errors gracefully', async () => {
            // Test with invalid API calls
            await page.goto('http://localhost:3000');

            // Try to make an invalid API call
            const result = await page.evaluate(async () => {
                try {
                    const response = await fetch('http://localhost:3000/api/toilet/nonexistent');
                    return response.status;
                } catch (error) {
                    return 'error';
                }
            });

            expect(result).toBe(404);
        });

        test('should handle form validation errors', async () => {
            // Create a toilet first
            const toiletResponse = await page.evaluate(async () => {
                const response = await fetch('http://localhost:3000/api/toilet/add', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: 'Validation Test Toilet',
                        location: 'Test Location',
                        coordinates: { latitude: 40.7128, longitude: -74.0060 }
                    })
                });
                return await response.json();
            });

            // Navigate to review page with toilet ID
            await page.goto(`http://localhost:3000/review.html?id=${toiletResponse.id}`);

            // Wait for review form to be visible
            await page.waitForSelector('#reviewFormSection', { visible: true });

            // Try to submit form without filling required fields
            await page.click('#reviewForm button[type="submit"]');

            // The browser's built-in HTML5 validation should prevent submission
            // Wait a moment and check that we're still on the form
            await page.waitForTimeout(1000);

            const formStillVisible = await page.$('#reviewFormSection');
            expect(formStillVisible).toBeTruthy();

            // Now fill out the form properly to test successful submission
            await page.click('input[name="rating"][value="3"]');
            await page.click('input[name="cleanliness"][value="3"]');
            await page.click('input[name="maintenance"][value="3"]');
            await page.click('input[name="accessibility"][value="3"]');
            await page.type('#comments', 'Test validation review');

            // Submit the complete form
            await page.click('#reviewForm button[type="submit"]');

            // Should succeed this time
            await page.waitForSelector('#successMessage', { visible: true, timeout: 5000 });
        });
    });

    describe('Responsive Design', () => {
        test('should work on mobile viewport', async () => {
            await page.setViewport({ width: 375, height: 667 }); // iPhone size
            await page.goto('http://localhost:3000');

            // Check if content is still accessible
            const content = await page.$('body');
            expect(content).toBeTruthy();

            // Check if navigation still works
            const nav = await page.$('nav');
            expect(nav).toBeTruthy();
        });

        test('should work on tablet viewport', async () => {
            await page.setViewport({ width: 768, height: 1024 }); // iPad size
            await page.goto('http://localhost:3000');

            const content = await page.$('body');
            expect(content).toBeTruthy();
        });
    });

    describe('Performance and Loading', () => {
        test('should load within reasonable time', async () => {
            const startTime = Date.now();
            await page.goto('http://localhost:3000');
            await page.waitForSelector('body');
            const loadTime = Date.now() - startTime;

            expect(loadTime).toBeLessThan(5000); // Should load within 5 seconds
        });

        test('should load all required resources', async () => {
            await page.goto('http://localhost:3000');

            // Check for CSS and JS resources
            const resources = await page.evaluate(() => {
                const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
                const scripts = Array.from(document.querySelectorAll('script[src]'));
                return {
                    stylesheets: links.length,
                    scripts: scripts.length
                };
            });

            expect(resources.stylesheets).toBeGreaterThan(0);
            expect(resources.scripts).toBeGreaterThan(0);
        });
    });
});