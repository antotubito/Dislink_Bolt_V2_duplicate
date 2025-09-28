#!/bin/bash

# Script to update import paths in web app to use shared package
# Run this from the root directory of the monorepo

echo "🔄 Updating import paths in web app..."

cd web/src

# Update type imports
echo "📝 Updating type imports..."
find . -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's|from.*types/|from "@dislink/shared/types"|g'
find . -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's|from.*types"|from "@dislink/shared/types"|g'

# Update lib imports
echo "📝 Updating library imports..."
find . -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's|from.*lib/|from "@dislink/shared/lib"|g'
find . -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's|from.*lib"|from "@dislink/shared/lib"|g'

# Update hook imports
echo "📝 Updating hook imports..."
find . -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's|from.*hooks/|from "@dislink/shared/hooks"|g'
find . -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's|from.*hooks"|from "@dislink/shared/hooks"|g'

# Update component imports
echo "📝 Updating component imports..."
find . -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's|from.*components/common/|from "@dislink/shared/components"|g'
find . -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's|from.*components/common"|from "@dislink/shared/components"|g'

# Update config imports
echo "📝 Updating config imports..."
find . -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's|from.*config/|from "@dislink/shared/constants"|g'
find . -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's|from.*config"|from "@dislink/shared/constants"|g'

# Update data imports
echo "📝 Updating data imports..."
find . -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's|from.*data/|from "@dislink/shared/constants"|g'
find . -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's|from.*data"|from "@dislink/shared/constants"|g'

echo "✅ Import path updates complete!"
echo ""
echo "🔍 Please review the changes and test the application:"
echo "   pnpm install"
echo "   pnpm dev"
echo ""
echo "⚠️  You may need to manually fix some import paths that couldn't be automatically updated."
