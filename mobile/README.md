# Dislink Mobile

This is the React Native mobile application for Dislink.

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- React Native development environment setup

### Installation

```bash
# Install dependencies
pnpm install

# For iOS
cd ios && pod install && cd ..

# Start Metro bundler
pnpm start

# Run on Android
pnpm android

# Run on iOS
pnpm ios
```

## Development

This app uses the shared code from the `@dislink/shared` package, which contains:

- Shared types and interfaces
- Common utilities and services
- Reusable components (when adapted for React Native)

## Project Structure

```
mobile/
├── App.tsx              # Main app component
├── index.js             # App entry point
├── app.json             # App configuration
├── package.json         # Dependencies and scripts
├── tsconfig.json        # TypeScript configuration
├── metro.config.js      # Metro bundler configuration
├── babel.config.js      # Babel configuration
└── README.md           # This file
```

## Shared Code

The app imports shared code using the `@dislink/shared` alias:

```typescript
import { User } from '@dislink/shared/types';
import { logger } from '@dislink/shared/lib';
```
