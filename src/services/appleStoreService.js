const { chromium } = require('playwright');
const config = require('../config/config');
const logger = require('../utils/logger');

/**
 * Service for interacting with Apple Store API using Playwright
 */
class AppleStoreService {
    constructor() {
        this.baseUrl = config.appleStore.baseUrl;
        this.params = config.appleStore.params;
        this.partNumber = config.appleStore.partNumber;
        this.storeNumber = config.appleStore.storeNumber;
        this.browser = null;
        this.context = null;
    }

    /**
     * Build the full API URL with query parameters
     */
    _buildUrl() {
        const url = new URL(this.baseUrl);

        // Add fixed params from config
        Object.entries(this.params).forEach(([key, value]) => {
            url.searchParams.append(key, value);
        });

        // Add dynamic params from environment
        url.searchParams.append('parts.0', this.partNumber);
        url.searchParams.append('store', this.storeNumber);

        return url.toString();
    }

    /**
     * Initialize browser instance with anti-detection measures
     */
    async _initBrowser() {
        if (!this.browser) {
            this.browser = await chromium.launch({
                headless: true,
                args: [
                    '--disable-blink-features=AutomationControlled',
                    '--disable-dev-shm-usage',
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-infobars',
                    '--window-size=1920,1080',
                    '--disable-web-security',
                    '--disable-features=IsolateOrigins,site-per-process',
                ],
            });

            // Use realistic browser fingerprint
            const userAgents = [
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
                'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
            ];
            const randomUA = userAgents[Math.floor(Math.random() * userAgents.length)];

            this.context = await this.browser.newContext({
                userAgent: randomUA,
                viewport: { width: 1920, height: 1080 },
                locale: 'en-US',
                timezoneId: 'Asia/Kuala_Lumpur',
                extraHTTPHeaders: {
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'Sec-Fetch-Dest': 'document',
                    'Sec-Fetch-Mode': 'navigate',
                    'Sec-Fetch-Site': 'none',
                    'Sec-Fetch-User': '?1',
                    'Upgrade-Insecure-Requests': '1',
                },
                javaScriptEnabled: true,
                bypassCSP: false,
                ignoreHTTPSErrors: false,
            });

            // Add comprehensive init scripts to mask automation
            await this.context.addInitScript(() => {
                // Override navigator.webdriver
                Object.defineProperty(navigator, 'webdriver', {
                    get: () => false,
                });

                // Add chrome object with more realistic properties
                window.chrome = {
                    runtime: {},
                    loadTimes: function() {},
                    csi: function() {},
                    app: {},
                };

                // Override plugins to appear more realistic
                Object.defineProperty(navigator, 'plugins', {
                    get: () => [1, 2, 3, 4, 5],
                });

                // Override languages
                Object.defineProperty(navigator, 'languages', {
                    get: () => ['en-US', 'en'],
                });

                // Mock permissions
                const originalQuery = window.navigator.permissions.query;
                window.navigator.permissions.query = (parameters) => (
                    parameters.name === 'notifications' ?
                        Promise.resolve({ state: Notification.permission }) :
                        originalQuery(parameters)
                );

                // Override battery API
                delete navigator.getBattery;

                // Add more realistic platform info
                Object.defineProperty(navigator, 'platform', {
                    get: () => 'Win32',
                });

                // Add connection info
                Object.defineProperty(navigator, 'connection', {
                    get: () => ({
                        effectiveType: '4g',
                        rtt: 50,
                        downlink: 10,
                        saveData: false,
                    }),
                });
            });
        }
    }

    /**
     * Close browser instance
     */
    async _closeBrowser() {
        if (this.context) {
            await this.context.close();
            this.context = null;
        }
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
        }
    }

    /**
     * Clean up browser resources (public method for external cleanup)
     */
    async cleanup() {
        await this._closeBrowser();
        logger.debug('Browser cleanup completed');
    }

    /**
     * Generate random delay for human-like behavior
     */
    _randomDelay(min = 2000, max = 5000) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /**
     * Simulate mouse movement for human-like behavior
     */
    async _simulateHumanBehavior(page) {
        try {
            // Random scroll
            await page.evaluate(() => {
                window.scrollBy(0, Math.random() * 300);
            });
            await page.waitForTimeout(500 + Math.random() * 500);

            // Random mouse movement
            const x = Math.floor(Math.random() * 1000);
            const y = Math.floor(Math.random() * 600);
            await page.mouse.move(x, y);
        } catch (error) {
            // Silently ignore errors in simulation
        }
    }

    /**
     * Fetch availability from Apple Store API using Playwright
     * @param {number} retryCount - Current retry attempt
     * @returns {Promise<{available: boolean, message: string, rawData: Object}>}
     */
    async checkAvailability(retryCount = 0) {
        const maxRetries = 3;
        let page = null;

        try {
            await this._initBrowser();

            const url = this._buildUrl();
            logger.debug(`Fetching availability from: ${url}`);

            page = await this.context.newPage();

            // Block unnecessary resources to reduce detection
            await page.route('**/*', (route) => {
                const resourceType = route.request().resourceType();
                if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
                    route.abort();
                } else {
                    route.continue();
                }
            });

            // Visit Apple homepage first to establish a session and get cookies
            logger.debug('Establishing session by visiting Apple homepage...');
            await page.goto('https://www.apple.com/my/', {
                waitUntil: 'domcontentloaded',
                timeout: 45000,
            });

            // Simulate human behavior on homepage
            await page.waitForTimeout(this._randomDelay(1500, 3000));
            await this._simulateHumanBehavior(page);

            // Navigate to iPhone shop page
            logger.debug('Navigating to iPhone shop page...');
            await page.goto('https://www.apple.com/my/shop/buy-iphone', {
                waitUntil: 'domcontentloaded',
                timeout: 45000,
            });

            // More human-like interaction
            await page.waitForTimeout(this._randomDelay(2000, 4000));
            await this._simulateHumanBehavior(page);

            // Set up request interception to capture the API response
            let apiResponse = null;
            page.on('response', async (response) => {
                if (response.url().includes('fulfillment-messages')) {
                    apiResponse = response;
                }
            });

            // Now navigate to the API endpoint
            logger.debug('Fetching stock availability...');
            await page.goto(url, {
                waitUntil: 'networkidle',
                timeout: 45000,
            });

            // Wait for the response to be fully captured
            await page.waitForTimeout(3000);

            if (!apiResponse) {
                throw new Error('No API response captured');
            }

            const statusCode = apiResponse.status();
            if (statusCode !== 200) {
                logger.error(`Apple API returned status ${statusCode}`);

                // If we get 541 (bot detection), retry with longer delay
                if (statusCode === 541 && retryCount < maxRetries) {
                    const retryDelay = (retryCount + 1) * 10000; // Exponential backoff: 10s, 20s, 30s
                    logger.warn(`Bot detected (541). Retrying in ${retryDelay / 1000}s (attempt ${retryCount + 1}/${maxRetries})...`);

                    // Close current page and browser to reset session
                    if (page) await page.close();
                    await this._closeBrowser();

                    // Wait before retry
                    await new Promise(resolve => setTimeout(resolve, retryDelay));

                    // Retry with fresh browser instance
                    return await this.checkAvailability(retryCount + 1);
                }

                throw new Error(`Apple API responded with status ${statusCode}`);
            }

            const data = await apiResponse.json();
            logger.info('Successfully fetched stock data');
            return this._parseResponse(data);

        } catch (error) {
            logger.error('Failed to fetch Apple Store API', error);

            // Retry logic for network errors
            if (!error.message.includes('status') && retryCount < maxRetries) {
                const retryDelay = (retryCount + 1) * 5000; // 5s, 10s, 15s
                logger.warn(`Network error. Retrying in ${retryDelay / 1000}s (attempt ${retryCount + 1}/${maxRetries})...`);

                if (page) await page.close();
                await this._closeBrowser();

                await new Promise(resolve => setTimeout(resolve, retryDelay));
                return await this.checkAvailability(retryCount + 1);
            }

            if (error.message.includes('status')) {
                throw error;
            } else if (error.message.includes('timeout')) {
                throw new Error('Request timeout - Apple API did not respond in time');
            } else {
                throw new Error(`Request failed: ${error.message}`);
            }
        } finally {
            if (page) {
                await page.close();
            }
        }
    }

    /**
     * Parse API response and extract availability status
     * @param {Object} data - API response data
     * @returns {Object} Parsed availability information
     */
    _parseResponse(data) {
        try {
            // Navigate through the response structure to find pickupSearchQuote
            const stores = data.body?.content?.pickupMessage?.stores || [];

            if (stores.length === 0) {
                logger.warn('No stores found in API response');
                return {
                    available: false,
                    message: 'No store data available',
                    rawData: data,
                };
            }

            // Get the first store's data (should match our store number)
            const store = stores[0];
            const partsAvailability = store.partsAvailability || {};
            const partData = partsAvailability[this.partNumber];

            if (!partData) {
                logger.warn(`Part ${this.partNumber} not found in response`);
                return {
                    available: false,
                    message: 'Part not found in store data',
                    rawData: data,
                };
            }

            // Extract pickupSearchQuote
            const pickupSearchQuote = partData.pickupSearchQuote || '';
            const storePickupQuote = partData.storePickupQuote || '';

            // Determine availability based on the quote
            const available = pickupSearchQuote.toLowerCase().includes('available today');

            logger.info(`Stock status: ${pickupSearchQuote || storePickupQuote}`);
            logger.info(`Available: ${available} (checking for "available today" in "${pickupSearchQuote.toLowerCase()}")`);

            return {
                available,
                message: pickupSearchQuote || storePickupQuote || 'Unknown status',
                storeName: store.storeName || 'Unknown Store',
                rawData: data,
            };
        } catch (error) {
            logger.error('Failed to parse API response', error);
            throw new Error(`Response parsing failed: ${error.message}`);
        }
    }
}

module.exports = new AppleStoreService();
