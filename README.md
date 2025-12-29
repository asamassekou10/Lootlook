# LootLook

A mobile application that scans items with your camera to instantly identify them and estimate their market value. Built with React Native, Expo, and powered by AI.

## Overview

LootLook is designed for collectors, resellers, and curious individuals who want to quickly understand the value of items around them. Simply point your camera at any item, and the app will identify it and provide real-time market valuations from trusted sources.

## Features

### Core Functionality
- **Instant Item Recognition**: AI-powered image analysis identifies items in real-time
- **Market Valuation**: Aggregates pricing data from multiple trusted sources
- **Portfolio Management**: Save scanned items to track your collection's total value
- **Condition Assessment**: AI evaluates item condition to refine valuations

### Monetization System
- **Free Tier**: 5 scans per month
- **Credit Packs**: Purchase additional scans (20 for $2.99, 100 for $9.99)
- **Pro Subscription**: Unlimited scans ($14.99/month or $119.99/year)
- **Rewarded Ads**: Watch a video to earn 1 bonus scan

### User Experience
- **Premium Dark Theme**: OLED-optimized interface with minimalist luxury aesthetic
- **Onboarding Flow**: Professional first-time user experience with camera permission primer
- **Haptic Feedback**: Tactile responses throughout the app
- **Smooth Animations**: Polished transitions and micro-interactions

## Tech Stack

### Frontend
- **Framework**: React Native with Expo SDK 54
- **Navigation**: Expo Router (file-based routing)
- **State Management**: Zustand with AsyncStorage persistence
- **UI Components**: Custom design system with consistent theming
- **Icons**: Lucide React Native

### Backend
- **Runtime**: Node.js with Express
- **AI Integration**: Google Gemini Vision API for item identification
- **Market Data**: SerpApi for real-time pricing aggregation
- **Image Processing**: Sharp for optimization

### Monetization
- **In-App Purchases**: expo-in-app-purchases (StoreKit for iOS)
- **Advertising**: Google Mobile Ads (AdMob)

## Project Structure

```
Lootlook/
├── frontend/
│   ├── app/                    # Expo Router screens
│   │   ├── (tabs)/            # Tab navigation screens
│   │   │   ├── index.tsx      # Scanner (camera) screen
│   │   │   ├── stash.tsx      # Portfolio/saved items
│   │   │   └── profile.tsx    # User profile and settings
│   │   ├── onboarding.tsx     # First-time user experience
│   │   ├── result.tsx         # Scan result modal
│   │   └── _layout.tsx        # Root navigation layout
│   ├── src/
│   │   ├── api/               # API client and queries
│   │   ├── components/        # Reusable UI components
│   │   ├── services/          # IAP and Ad services
│   │   ├── stores/            # Zustand state stores
│   │   ├── theme/             # Design system tokens
│   │   └── utils/             # Utility functions
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── routes/            # API endpoints
│   │   ├── services/          # Business logic
│   │   └── index.ts           # Server entry point
│   └── package.json
└── README.md
```

## Getting Started

### Prerequisites
- Node.js 18 or higher
- npm or yarn
- Expo Go app (iOS/Android) for development
- Google Cloud account (for Gemini API)
- SerpApi account (for market data)

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment file:
   ```bash
   cp .env.example .env
   ```

4. Add your API keys to `.env`:
   ```
   GEMINI_API_KEY=your_gemini_api_key
   SERPAPI_KEY=your_serpapi_key
   PORT=3000
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start Expo development server:
   ```bash
   npx expo start
   ```

4. Scan the QR code with Expo Go to run on your device.

## Configuration

### API Keys

| Service | Purpose | Required |
|---------|---------|----------|
| Gemini API | Image analysis and item identification | Yes |
| SerpApi | Market price aggregation | Yes |
| AdMob | Advertising (rewarded and native ads) | Production only |

### In-App Purchase Products

Configure these products in App Store Connect:

| Product ID | Type | Description |
|------------|------|-------------|
| `com.lootlook.credits.weekend20` | Consumable | 20 scan credits |
| `com.lootlook.credits.hunter100` | Consumable | 100 scan credits |
| `com.lootlook.sub.pro.monthly` | Auto-renewable | Monthly Pro subscription |
| `com.lootlook.sub.pro.yearly` | Auto-renewable | Yearly Pro subscription |

## Development

### Running in Expo Go

The app runs in Expo Go for rapid development. Some features are simulated:
- In-app purchases show mock dialogs
- Ads display placeholder UI
- Camera works on physical devices only

### Creating a Development Build

For testing real IAP and ads:

```bash
# Install development client
npx expo install expo-dev-client

# Generate native projects
npx expo prebuild

# Build for iOS
npx expo run:ios

# Build for Android
npx expo run:android
```

### Testing Monetization

Use the Dev Tools in the Profile screen to test different user states:
- Exhaust free scans to trigger paywall
- Simulate Pack Holder status
- Simulate Pro Subscriber status
- Reset onboarding flow

## Deployment

### App Store Submission Checklist

1. Configure App Store Connect with IAP products
2. Set up Sandbox tester accounts
3. Replace AdMob test IDs with production IDs
4. Create production build with EAS Build
5. Complete App Store privacy questionnaire
6. Submit for review

### Environment Variables (Production)

```
GEMINI_API_KEY=production_key
SERPAPI_KEY=production_key
ADMOB_APP_ID=ca-app-pub-XXXXX
ADMOB_REWARDED_UNIT_ID=ca-app-pub-XXXXX/XXXXX
ADMOB_NATIVE_UNIT_ID=ca-app-pub-XXXXX/XXXXX
```

## Architecture Decisions

### State Management
Zustand was chosen for its simplicity and excellent TypeScript support. Stores are persisted to AsyncStorage for offline-first functionality.

### Navigation
Expo Router provides file-based routing similar to Next.js, making the navigation structure intuitive and maintainable.

### Monetization
A hybrid "arcade model" balances user acquisition (free tier) with revenue (credit packs and subscriptions). Ads are shown only to free-tier users.

### Design System
Custom theme tokens ensure visual consistency. OLED-optimized colors reduce battery consumption on modern displays.

## License

Proprietary - All rights reserved.

## Support

For issues and feature requests, please open an issue on GitHub.
