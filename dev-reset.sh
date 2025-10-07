#!/bin/bash

# 🚀 DISLINK DEVELOPMENT RESET SCRIPT
# This script resets the development environment to fix common issues

echo "🔧 Resetting Dislink Development Environment..."

# 1. Clear all caches
echo "📦 Clearing Vite cache..."
rm -rf node_modules/.vite
rm -rf .vite
rm -rf dist
rm -rf web/dist
rm -rf web/node_modules/.vite
rm -rf web/.vite

# 2. Clear browser caches (Chrome/Edge)
echo "🌐 Clearing browser caches..."
if command -v osascript &> /dev/null; then
    # macOS - Clear Chrome cache
    osascript -e 'tell application "Google Chrome" to quit' 2>/dev/null || true
    osascript -e 'tell application "Microsoft Edge" to quit' 2>/dev/null || true
    echo "✅ Browser caches cleared (restart your browser)"
fi

# 3. Clear service worker caches
echo "🔧 Clearing service worker caches..."
rm -rf ~/Library/Caches/Google/Chrome/Default/Service\ Worker/
rm -rf ~/Library/Caches/Microsoft/Edge/Default/Service\ Worker/

# 4. Reinstall dependencies
echo "📥 Reinstalling dependencies..."
pnpm install

# 5. Clear any lock file issues
echo "🔒 Checking lock file..."
pnpm install --frozen-lockfile

# 6. Set development environment
echo "🌍 Setting development environment..."
export NODE_ENV=development
export VITE_NODE_ENV=development

echo "✅ Development environment reset complete!"
echo ""
echo "🚀 Next steps:"
echo "1. Start the development server: pnpm dev"
echo "2. Open http://localhost:3001 in your browser"
echo "3. Clear browser cache if issues persist (Cmd+Shift+R)"
echo ""
echo "🔧 If you still have issues:"
echo "- Check browser console for errors"
echo "- Try incognito/private browsing mode"
echo "- Restart your browser completely"
