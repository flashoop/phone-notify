# iPhone Stock Monitor

An automated Node.js application that monitors Apple Store product availability and sends instant Pushover notifications when your desired iPhone model becomes available at your local store.

## Features

- Real-time monitoring of Apple Store API for product availability
- Automatic notifications via Pushover when stock becomes available
- Configurable monitoring intervals
- In-memory state tracking to detect status changes
- RESTful API endpoints for health checks and monitoring status
- Graceful shutdown handling

## Prerequisites

- Node.js (version 14 or higher)
- npm (Node package manager)
- Pushover account (for notifications)
  - Sign up at [pushover.net](https://pushover.net)
  - Create an application to get your API key
  - Note your user key from your dashboard

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd my-node-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   ```bash
   cp .env.example .env
   ```

4. Edit `.env` file with your credentials:
   ```
   PUSHOVER_API_KEY=your_pushover_api_key_here
   PUSHOVER_USER_KEY=your_pushover_user_key_here
   PART_NUMBER=MFYM4X/A
   STORE_NUMBER=R742
   ```

   To find your Apple Store part number and store number:
   - Visit Apple's website and select your desired product
   - Choose "Check availability" and select your store
   - Inspect the API request in browser developer tools to find the part number and store code

## Usage

### Start the Monitor

```bash
npm start
```

The monitoring service starts automatically and will:
- Check stock availability every 5 minutes (configurable in `config.yml`)
- Log each check to the console with timestamp
- Send a Pushover notification when stock becomes available

### Configuration

Edit `config.yml` to customize:

```yaml
monitoring:
  intervalMs: 300000  # Check every 5 minutes (300000ms)
```

### API Endpoints

Once running, you can access:

- **Health Check**: `http://localhost:3000/health`
- **Monitoring Status**: `http://localhost:3000/status` - View current monitoring state and last known stock status

## Folder Structure

```
my-node-app/
├── src/
│   ├── index.js                      # Application entry point
│   ├── config/
│   │   └── config.js                 # Configuration loader
│   ├── controllers/
│   │   └── monitorController.js      # Request handlers
│   ├── routes/
│   │   └── index.js                  # Route definitions
│   ├── services/
│   │   ├── appleStoreService.js      # Apple API integration
│   │   ├── monitoringService.js      # Core monitoring logic
│   │   └── pushoverService.js        # Notification service
│   └── utils/
│       └── logger.js                 # Logging utility
├── config.yml                        # Non-sensitive configuration
├── .env                              # Environment variables (not in git)
├── .env.example                      # Environment template
├── package.json                      # Dependencies and scripts
└── README.md                         # This file
```

## How It Works

1. **Initialization**: When you run `npm start`, the Express server starts and automatically launches the monitoring service
2. **Monitoring Loop**: Every N seconds (default: 5 minutes):
   - Fetches product availability from Apple Store API
   - Parses the `pickupSearchQuote` field to determine stock status
   - Compares with previous status to detect changes
3. **Notification**: When stock status changes from "Currently unavailable" to "Available Today":
   - Sends a high-priority Pushover notification to your device
   - Logs the event with timestamp
4. **Continuous Operation**: The service continues monitoring until you stop the application (Ctrl+C)

## Troubleshooting

**Missing environment variables error:**
- Ensure you've created `.env` file from `.env.example`
- Verify all required variables are filled in

**No notifications received:**
- Check your Pushover credentials are correct
- Test your Pushover setup at [pushover.net](https://pushover.net)
- View logs for any error messages

**API errors:**
- Verify the part number and store number are correct
- Check your internet connection
- Apple's API may have rate limits

## License

This project is licensed under the ISC License.