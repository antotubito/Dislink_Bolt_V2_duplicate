#!/bin/bash

# Fix Cosmic Classes Script
# This script replaces all old cosmic classes with proper Captamundi design system classes

echo "🔧 Fixing cosmic classes across all components..."

# Find all TypeScript/TSX files in src/components
find src/components -name "*.tsx" -o -name "*.ts" | while read file; do
    echo "Processing: $file"
    
    # Replace cosmic-gradient with proper gradient
    sed -i '' 's/bg-cosmic-gradient/from-purple-500 to-indigo-600/g' "$file"
    
    # Replace bg-cosmic-primary with proper primary button class
    sed -i '' 's/bg-cosmic-primary/btn-captamundi-primary/g' "$file"
    
    # Replace cosmic-glow with proper hover effects
    sed -i '' 's/hover:cosmic-glow/hover:shadow-lg hover:shadow-purple-500\/25/g' "$file"
    
    # Replace cosmic-secondary with proper secondary colors
    sed -i '' 's/ring-cosmic-secondary/ring-purple-500/g' "$file"
    sed -i '' 's/focus:ring-cosmic-secondary/focus:ring-purple-500/g' "$file"
    
    # Fix hover opacity classes
    sed -i '' 's/hover:bg-cosmic-primary hover:opacity-90/hover:shadow-lg hover:shadow-purple-500\/25/g' "$file"
    
    # Fix cosmic-primary/20 opacity classes
    sed -i '' 's/bg-cosmic-primary\/20/bg-purple-500\/20/g' "$file"
    sed -i '' 's/hover:bg-cosmic-primary\/20/hover:bg-purple-500\/20/g' "$file"
    
    echo "✅ Updated: $file"
done

echo "🎉 All cosmic classes have been updated to use the Captamundi design system!"
echo "📋 Summary of changes:"
echo "   - bg-cosmic-gradient → from-purple-500 to-indigo-600"
echo "   - bg-cosmic-primary → btn-captamundi-primary"
echo "   - hover:cosmic-glow → hover:shadow-lg hover:shadow-purple-500/25"
echo "   - ring-cosmic-secondary → ring-purple-500"
echo "   - bg-cosmic-primary/20 → bg-purple-500/20"
