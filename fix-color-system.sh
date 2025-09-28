#!/bin/bash

# ==============================================
# DISLINK COLOR SYSTEM FIX SCRIPT
# ==============================================
# This script fixes the color system conflicts
# Run this from the project root directory

echo "🎨 Starting Dislink Color System Fix..."

# Step 1: Backup current files
echo "📁 Creating backups..."
cp src/index.css src/index.css.backup
cp tailwind.config.js tailwind.config.js.backup

# Step 2: Find and replace conflicting color classes
echo "🔍 Finding conflicting color classes..."

# Find files with conflicting colors
echo "Files with conflicting colors:"
grep -r "from-pink-500\|to-purple-600\|text-gray-300\|bg-indigo-600" src/ --include="*.tsx" --include="*.ts" | head -10

# Step 3: Replace common conflicting patterns
echo "🔄 Replacing conflicting color patterns..."

# Replace gradient patterns
find src/ -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's/from-pink-500 to-purple-600/bg-cosmic-gradient/g'
find src/ -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's/from-indigo-500 to-purple-500/bg-cosmic-gradient/g'

# Replace text colors
find src/ -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's/text-gray-300/text-cosmic-neutral/g'
find src/ -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's/text-gray-400/text-cosmic-neutral/g'

# Replace background colors
find src/ -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's/bg-indigo-600/bg-cosmic-primary/g'
find src/ -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's/bg-pink-500/bg-cosmic-secondary/g'

# Replace border colors
find src/ -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's/border-indigo-300/border-cosmic-secondary/g'
find src/ -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's/border-pink-300/border-cosmic-secondary/g'

# Step 4: Remove conflicting CSS imports
echo "🗑️ Removing conflicting CSS imports..."
sed -i '' '/@import.*design-system.css/d' src/index.css
sed -i '' '/@import.*vibrant.css/d' src/index.css

# Step 5: Check for remaining conflicts
echo "🔍 Checking for remaining conflicts..."
REMAINING_CONFLICTS=$(grep -r "from-pink-500\|to-purple-600\|text-gray-300\|bg-indigo-600" src/ --include="*.tsx" --include="*.ts" | wc -l)

if [ $REMAINING_CONFLICTS -gt 0 ]; then
    echo "⚠️  Found $REMAINING_CONFLICTS remaining conflicts:"
    grep -r "from-pink-500\|to-purple-600\|text-gray-300\|bg-indigo-600" src/ --include="*.tsx" --include="*.ts"
else
    echo "✅ No remaining conflicts found!"
fi

# Step 6: Verify Tailwind config
echo "🔧 Verifying Tailwind configuration..."
if grep -q "cosmic:" tailwind.config.js; then
    echo "✅ Cosmic colors found in Tailwind config"
else
    echo "⚠️  Cosmic colors not found in Tailwind config - manual update needed"
fi

# Step 7: Test build
echo "🏗️ Testing build..."
if npm run build > /dev/null 2>&1; then
    echo "✅ Build successful!"
else
    echo "❌ Build failed - check for errors"
    echo "Run 'npm run build' to see detailed errors"
fi

echo "🎉 Color system fix complete!"
echo ""
echo "Next steps:"
echo "1. Review the changes made"
echo "2. Test the application: npm run dev"
echo "3. Check all pages for color consistency"
echo "4. If issues found, restore from backups:"
echo "   cp src/index.css.backup src/index.css"
echo "   cp tailwind.config.js.backup tailwind.config.js"
