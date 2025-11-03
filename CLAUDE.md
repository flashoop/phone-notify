# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an iPhone stock monitoring application that checks Apple Store API for product availability and sends Pushover notifications when stock becomes available. Built with Node.js and Express.

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and fill in your credentials:
```bash
cp .env.example .env
```

Required variables:
- `PUSHOVER_API_KEY` - Your Pushover application API key
- `PUSHOVER_USER_KEY` - Your Pushover user key
- `PART_NUMBER` - Apple product part number (e.g., MFYM4X/A)
- `STORE_NUMBER` - Apple store number (e.g., R742)

### 3. Run the Application
```bash
npm start
```

The monitoring service starts automatically when the server launches.

## Architecture

### Service-Based Design

The application follows a modular service-oriented architecture:

- **src/config/** - Configuration loader (merges config.yml + .env)
- **src/services/** - Business logic services:
  - `appleStoreService.js` - Fetches and parses Apple Store API
  - `pushoverService.js` - Sends Pushover notifications
  - `monitoringService.js` - Core monitoring orchestrator with interval checks
- **src/controllers/** - HTTP request handlers
- **src/routes/** - Express route definitions
- **src/utils/** - Shared utilities (logger)

### Monitoring Flow

1. Server starts → Load config → Auto-start monitoring service
2. Service runs every N seconds (default: 300000ms = 5 minutes)
3. Each cycle: Fetch Apple API → Parse `pickupSearchQuote` field → Compare with previous state
4. If stock changes from unavailable to available → Send Pushover notification
5. State is tracked in-memory (resets on server restart)

### API Endpoints

- `GET /` or `GET /health` - Health check
- `GET /status` - View monitoring status and last known stock state

### Configuration

- **config.yml** - Non-sensitive settings (API URLs, intervals, default params)
- **.env** - Sensitive credentials and dynamic params (API keys, part/store numbers)

The monitoring interval can be adjusted in `config.yml` under `monitoring.intervalMs`.
