#!/bin/bash

# Fix Remaining Cosmic Classes Script
# This script fixes all remaining cosmic classes with proper Captamundi design system classes

echo "🔧 Fixing remaining cosmic classes..."

# Find all TypeScript/TSX files in src
find src -name "*.tsx" -o -name "*.ts" | while read file; do
    echo "Processing: $file"
    
    # Replace cosmic text colors
    sed -i '' 's/text-cosmic-primary/text-gray-900/g' "$file"
    sed -i '' 's/text-cosmic-secondary/text-purple-600/g' "$file"
    sed -i '' 's/text-cosmic-neutral/text-gray-600/g' "$file"
    sed -i '' 's/text-cosmic-accent/text-indigo-600/g' "$file"
    sed -i '' 's/text-cosmic-pop/text-pink-600/g' "$file"
    
    # Replace cosmic background colors
    sed -i '' 's/bg-cosmic-neutral/bg-gray-50/g' "$file"
    sed -i '' 's/bg-cosmic-secondary/bg-purple-600/g' "$file"
    sed -i '' 's/bg-cosmic-accent/bg-indigo-600/g' "$file"
    sed -i '' 's/bg-cosmic-pop/bg-pink-600/g' "$file"
    
    # Replace cosmic border colors
    sed -i '' 's/border-cosmic-secondary/border-purple-600/g' "$file"
    sed -i '' 's/border-cosmic-accent/border-indigo-600/g' "$file"
    sed -i '' 's/hover:border-cosmic-secondary/hover:border-purple-600/g' "$file"
    sed -i '' 's/hover:border-cosmic-accent/hover:border-indigo-600/g' "$file"
    
    # Replace cosmic ring colors
    sed -i '' 's/ring-cosmic-secondary/ring-purple-600/g' "$file"
    sed -i '' 's/ring-cosmic-accent/ring-indigo-600/g' "$file"
    sed -i '' 's/focus:ring-cosmic-secondary/focus:ring-purple-600/g' "$file"
    sed -i '' 's/focus:ring-cosmic-accent/focus:ring-indigo-600/g' "$file"
    sed -i '' 's/focus:border-cosmic-secondary/focus:border-purple-600/g' "$file"
    sed -i '' 's/focus:border-cosmic-accent/focus:border-indigo-600/g' "$file"
    
    # Replace cosmic shadow colors
    sed -i '' 's/shadow-cosmic-secondary/shadow-purple-600/g' "$file"
    sed -i '' 's/hover:shadow-cosmic-secondary/hover:shadow-purple-600/g' "$file"
    
    # Replace cosmic opacity classes
    sed -i '' 's/bg-cosmic-secondary\/10/bg-purple-600\/10/g' "$file"
    sed -i '' 's/bg-cosmic-accent\/10/bg-indigo-600\/10/g' "$file"
    sed -i '' 's/border-cosmic-secondary\/10/border-purple-600\/10/g' "$file"
    sed -i '' 's/border-cosmic-accent\/10/border-indigo-600\/10/g' "$file"
    
    # Replace cosmic glow effects
    sed -i '' 's/cosmic-glow/hover:shadow-lg hover:shadow-purple-500\/25/g' "$file"
    
    # Replace cosmic gradient classes
    sed -i '' 's/cosmic-gradient/from-purple-500 to-indigo-600/g' "$file"
    
    echo "✅ Updated: $file"
done

echo "🎉 All remaining cosmic classes have been updated!"
echo "📋 Summary of changes:"
echo "   - text-cosmic-primary → text-gray-900"
echo "   - text-cosmic-secondary → text-purple-600"
echo "   - text-cosmic-neutral → text-gray-600"
echo "   - bg-cosmic-neutral → bg-gray-50"
echo "   - border-cosmic-secondary → border-purple-600"
echo "   - ring-cosmic-secondary → ring-purple-600"
echo "   - cosmic-glow → hover:shadow-lg hover:shadow-purple-500/25"
echo "   - cosmic-gradient → from-purple-500 to-indigo-600"
