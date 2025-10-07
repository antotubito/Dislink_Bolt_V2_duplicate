#!/bin/bash

# Dislink Deployment Script
# This script ensures a reliable deployment to Netlify

set -e  # Exit on any error

echo "🚀 Starting Dislink deployment process..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SITE_ID="4ab48331-d98a-4d0b-a76b-06f66f307897"
PROJECT_NAME="dislinkboltv2duplicate"

echo -e "${BLUE}📋 Deployment Configuration:${NC}"
echo "  Site ID: $SITE_ID"
echo "  Project: $PROJECT_NAME"
echo "  Build Directory: web/dist"
echo ""

# Step 1: Verify Netlify CLI is authenticated
echo -e "${YELLOW}🔐 Checking Netlify authentication...${NC}"
if ! npx netlify status > /dev/null 2>&1; then
    echo -e "${RED}❌ Not authenticated with Netlify. Please run: npx netlify login${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Netlify authentication verified${NC}"

# Step 2: Clean and build the project
echo -e "${YELLOW}🔨 Building project...${NC}"
echo "  Cleaning previous build..."
rm -rf web/dist

echo "  Installing dependencies..."
pnpm install

echo "  Building web application..."
pnpm --filter web build

# Verify build output
if [ ! -f "web/dist/index.html" ]; then
    echo -e "${RED}❌ Build failed - index.html not found in web/dist${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build completed successfully${NC}"
echo "  Build size: $(du -sh web/dist | cut -f1)"

# Step 3: Deploy to Netlify
echo -e "${YELLOW}🚀 Deploying to Netlify...${NC}"
echo "  Site: https://$PROJECT_NAME.netlify.app"
echo "  Admin: https://app.netlify.com/sites/$PROJECT_NAME"

# Deploy with explicit site ID to avoid interactive prompts
npx netlify deploy --prod --dir=web/dist --site=$SITE_ID

echo ""
echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo -e "${BLUE}📱 Your app is live at: https://$PROJECT_NAME.netlify.app${NC}"
echo -e "${BLUE}🔧 Admin panel: https://app.netlify.com/sites/$PROJECT_NAME${NC}"
echo ""
echo -e "${YELLOW}💡 Next steps:${NC}"
echo "  1. Test the live application"
echo "  2. Check browser console for any errors"
echo "  3. Verify authentication and registration flows"
echo ""
