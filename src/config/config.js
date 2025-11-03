const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
require('dotenv').config();

/**
 * Load and merge configuration from config.yml and environment variables
 */
function loadConfig() {
    try {
        // Load YAML config
        const configPath = path.join(__dirname, '..', '..', 'config.yml');
        const fileContents = fs.readFileSync(configPath, 'utf8');
        const yamlConfig = yaml.load(fileContents);

        // Merge with environment variables
        const config = {
            appleStore: {
                baseUrl: yamlConfig.appleStore.baseUrl,
                params: yamlConfig.appleStore.params,
                partNumber: process.env.PART_NUMBER,
                storeNumber: process.env.STORE_NUMBER,
            },
            monitoring: {
                intervalMs: yamlConfig.monitoring.intervalMs,
            },
            pushover: {
                apiUrl: yamlConfig.pushover.apiUrl,
                apiKey: process.env.PUSHOVER_API_KEY,
                userKey: process.env.PUSHOVER_USER_KEY,
            },
            server: {
                port: process.env.PORT || 3000,
            },
            logging: yamlConfig.logging,
        };

        // Validate required environment variables
        const requiredEnvVars = [
            'PUSHOVER_API_KEY',
            'PUSHOVER_USER_KEY',
            'PART_NUMBER',
            'STORE_NUMBER',
        ];

        const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
        if (missingVars.length > 0) {
            throw new Error(
                `Missing required environment variables: ${missingVars.join(', ')}\n` +
                'Please create a .env file based on .env.example'
            );
        }

        return config;
    } catch (error) {
        if (error.code === 'ENOENT') {
            throw new Error('config.yml not found. Please create it in the project root.');
        }
        throw error;
    }
}

module.exports = loadConfig();
