#!/bin/bash
# 🎨 Convert SVG icons to PNG for mobile apps
# Requires: npm install -g svg2png-cli

echo "🎨 Converting Dislink icons to PNG..."

cd public/icons

# Main app icons
svg2png app-icon.svg --width=16 --height=16 --output=icon-16x16.png
svg2png app-icon.svg --width=29 --height=29 --output=icon-29x29.png
svg2png app-icon.svg --width=32 --height=32 --output=icon-32x32.png
svg2png app-icon.svg --width=36 --height=36 --output=icon-36x36.png
svg2png app-icon.svg --width=40 --height=40 --output=icon-40x40.png
svg2png app-icon.svg --width=48 --height=48 --output=icon-48x48.png
svg2png app-icon.svg --width=58 --height=58 --output=icon-58x58.png
svg2png app-icon.svg --width=60 --height=60 --output=icon-60x60.png
svg2png app-icon.svg --width=64 --height=64 --output=icon-64x64.png
svg2png app-icon.svg --width=72 --height=72 --output=icon-72x72.png
svg2png app-icon.svg --width=80 --height=80 --output=icon-80x80.png
svg2png app-icon.svg --width=87 --height=87 --output=icon-87x87.png
svg2png app-icon.svg --width=96 --height=96 --output=icon-96x96.png
svg2png app-icon.svg --width=120 --height=120 --output=icon-120x120.png
svg2png app-icon.svg --width=128 --height=128 --output=icon-128x128.png
svg2png app-icon.svg --width=144 --height=144 --output=icon-144x144.png
svg2png app-icon.svg --width=152 --height=152 --output=icon-152x152.png
svg2png app-icon.svg --width=167 --height=167 --output=icon-167x167.png
svg2png app-icon.svg --width=180 --height=180 --output=icon-180x180.png
svg2png app-icon.svg --width=192 --height=192 --output=icon-192x192.png
svg2png app-icon.svg --width=256 --height=256 --output=icon-256x256.png
svg2png app-icon.svg --width=384 --height=384 --output=icon-384x384.png
svg2png app-icon.svg --width=512 --height=512 --output=icon-512x512.png
svg2png app-icon.svg --width=1024 --height=1024 --output=icon-1024x1024.png

# Shortcut icons
svg2png qr-icon-96x96.svg --width=96 --height=96 --output=qr-icon-96x96.png
svg2png contacts-icon-96x96.svg --width=96 --height=96 --output=contacts-icon-96x96.png
svg2png share-icon-96x96.svg --width=96 --height=96 --output=share-icon-96x96.png

echo "✅ Icon conversion complete!"
echo "📱 Icons ready for mobile app deployment"
