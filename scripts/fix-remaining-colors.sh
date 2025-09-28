#!/bin/bash

# ==============================================
# DISLINK REMAINING COLOR CONFLICTS FIX
# ==============================================
# This script fixes the remaining 32 color conflicts

echo "🎨 Fixing remaining color conflicts..."

# Step 1: Fix specific gradient patterns
echo "🔄 Fixing gradient patterns..."

# Replace indigo-purple gradients with cosmic gradients
find src/ -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's/from-indigo-600 to-purple-600/bg-cosmic-gradient/g'
find src/ -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's/from-indigo-700 to-purple-700/bg-cosmic-gradient hover:opacity-90/g'

# Replace pink-purple gradients with cosmic gradients
find src/ -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's/from-pink-500 to-purple-600/bg-cosmic-gradient/g'
find src/ -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's/from-pink-500\/20 to-purple-600\/20/bg-cosmic-gradient\/20/g'
find src/ -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's/from-pink-500\/10 to-purple-600\/10/bg-cosmic-gradient\/10/g'

# Replace pink-purple-aqua gradients with cosmic gradients
find src/ -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's/from-pink-500 via-purple-500 to-aqua-500/bg-cosmic-gradient/g'
find src/ -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's/from-pink-500\/20 via-purple-500\/20 to-aqua-500\/20/bg-cosmic-gradient\/20/g'
find src/ -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's/from-pink-500\/10 via-purple-500\/10 to-aqua-500\/10/bg-cosmic-gradient\/10/g'

# Step 2: Fix specific color classes
echo "🔄 Fixing specific color classes..."

# Replace indigo colors with cosmic colors
find src/ -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's/bg-indigo-600/bg-cosmic-primary/g'
find src/ -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's/bg-indigo-700/bg-cosmic-primary hover:opacity-90/g'
find src/ -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's/bg-indigo-200/bg-cosmic-primary\/20/g'
find src/ -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's/border-indigo-500/border-cosmic-secondary/g'
find src/ -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's/ring-indigo-500/ring-cosmic-secondary/g'

# Replace pink colors with cosmic colors
find src/ -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's/bg-pink-500/bg-cosmic-secondary/g'
find src/ -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's/border-pink-500\/30/border-cosmic-secondary\/30/g'
find src/ -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's/text-pink-300/text-cosmic-neutral/g'

# Replace gray colors with cosmic colors
find src/ -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's/text-gray-300/text-cosmic-neutral/g'
find src/ -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's/text-gray-900/text-cosmic-primary/g'

# Step 3: Fix specific patterns
echo "🔄 Fixing specific patterns..."

# Fix the NeedStory component
find src/ -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's/from-pink-500 to-pink-300/bg-cosmic-gradient/g'

# Fix hover states
find src/ -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's/hover:from-indigo-600 hover:to-purple-600/hover:opacity-90/g'
find src/ -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's/hover:from-indigo-700 hover:to-purple-700/hover:opacity-80/g'

# Step 4: Check for remaining conflicts
echo "🔍 Checking for remaining conflicts..."
REMAINING_CONFLICTS=$(grep -r "from-pink-500\|to-purple-600\|text-gray-300\|bg-indigo-600\|from-indigo-600" src/ --include="*.tsx" --include="*.ts" | wc -l)

if [ $REMAINING_CONFLICTS -gt 0 ]; then
    echo "⚠️  Found $REMAINING_CONFLICTS remaining conflicts:"
    grep -r "from-pink-500\|to-purple-600\|text-gray-300\|bg-indigo-600\|from-indigo-600" src/ --include="*.tsx" --include="*.ts"
else
    echo "✅ No remaining conflicts found!"
fi

# Step 5: Test build
echo "🏗️ Testing build..."
if npm run build > /dev/null 2>&1; then
    echo "✅ Build successful!"
else
    echo "❌ Build failed - check for errors"
    echo "Run 'npm run build' to see detailed errors"
fi

echo "🎉 Remaining color conflicts fix complete!"
echo ""
echo "Next steps:"
echo "1. Review the changes made"
echo "2. Test the application: npm run dev"
echo "3. Check all pages for color consistency"
echo "4. If issues found, restore from backups:"
echo "   cp src/index.css.backup src/index.css"
echo "   cp tailwind.config.js.backup tailwind.config.js"
