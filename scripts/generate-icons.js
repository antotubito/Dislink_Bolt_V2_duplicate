#!/usr/bin/env node

// 🎨 ICON GENERATOR FOR DISLINK MOBILE APP
// Generates all required app icons for iOS and Android

import fs from 'fs';
import path from 'path';

// Icon sizes for different platforms
const ICON_SIZES = {
  // PWA Icons
  pwa: [72, 96, 128, 144, 152, 192, 384, 512],
  // iOS Icons
  ios: [29, 40, 58, 60, 80, 87, 120, 152, 167, 180, 1024],
  // Android Icons
  android: [36, 48, 72, 96, 144, 192, 512],
  // Additional sizes
  other: [16, 32, 64, 128, 256]
};

// SVG template for Dislink logo
const DISLINK_LOGO_SVG = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#4F46E5"/>
      <stop offset="100%" style="stop-color:#7C3AED"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-opacity="0.3"/>
    </filter>
  </defs>
  
  <!-- Background Circle -->
  <circle cx="256" cy="256" r="240" fill="url(#gradient)" filter="url(#shadow)"/>
  
  <!-- Connection Symbol - Two interlocked circles -->
  <g transform="translate(256,256)">
    <!-- First circle -->
    <circle cx="-40" cy="-20" r="60" fill="none" stroke="white" stroke-width="12" opacity="0.9"/>
    <!-- Second circle -->
    <circle cx="40" cy="20" r="60" fill="none" stroke="white" stroke-width="12" opacity="0.9"/>
    
    <!-- Connection Link -->
    <path d="M -10 -10 Q 0 0 10 10" stroke="white" stroke-width="8" fill="none" stroke-linecap="round"/>
    
    <!-- Center dot for emphasis -->
    <circle cx="0" cy="0" r="8" fill="white"/>
  </g>
  
  <!-- Subtle "D" for Dislink -->
  <text x="256" y="380" font-family="Arial, sans-serif" font-size="60" font-weight="bold" 
        text-anchor="middle" fill="white" opacity="0.8">D</text>
</svg>
`;

// QR Icon SVG
const QR_ICON_SVG = `
<svg width="96" height="96" viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg">
  <rect width="96" height="96" fill="#4F46E5" rx="12"/>
  <g transform="translate(16,16)" fill="white">
    <!-- QR Code pattern -->
    <rect x="0" y="0" width="20" height="20" rx="2"/>
    <rect x="4" y="4" width="12" height="12" rx="1" fill="#4F46E5"/>
    <rect x="8" y="8" width="4" height="4" fill="white"/>
    
    <rect x="44" y="0" width="20" height="20" rx="2"/>
    <rect x="48" y="4" width="12" height="12" rx="1" fill="#4F46E5"/>
    <rect x="52" y="8" width="4" height="4" fill="white"/>
    
    <rect x="0" y="44" width="20" height="20" rx="2"/>
    <rect x="4" y="48" width="12" height="12" rx="1" fill="#4F46E5"/>
    <rect x="8" y="52" width="4" height="4" fill="white"/>
    
    <!-- Pattern dots -->
    <rect x="28" y="8" width="4" height="4"/>
    <rect x="36" y="8" width="4" height="4"/>
    <rect x="28" y="16" width="4" height="4"/>
    <rect x="36" y="16" width="4" height="4"/>
    
    <rect x="8" y="28" width="4" height="4"/>
    <rect x="16" y="28" width="4" height="4"/>
    <rect x="8" y="36" width="4" height="4"/>
    <rect x="16" y="36" width="4" height="4"/>
    
    <rect x="28" y="28" width="4" height="4"/>
    <rect x="36" y="28" width="4" height="4"/>
    <rect x="44" y="28" width="4" height="4"/>
    <rect x="52" y="28" width="4" height="4"/>
    <rect x="60" y="28" width="4" height="4"/>
    
    <rect x="28" y="36" width="4" height="4"/>
    <rect x="36" y="36" width="4" height="4"/>
    <rect x="44" y="36" width="4" height="4"/>
    <rect x="52" y="36" width="4" height="4"/>
    <rect x="60" y="36" width="4" height="4"/>
    
    <rect x="28" y="52" width="4" height="4"/>
    <rect x="36" y="52" width="4" height="4"/>
    <rect x="44" y="52" width="4" height="4"/>
    <rect x="52" y="52" width="4" height="4"/>
    <rect x="60" y="52" width="4" height="4"/>
    
    <rect x="28" y="60" width="4" height="4"/>
    <rect x="36" y="60" width="4" height="4"/>
    <rect x="44" y="60" width="4" height="4"/>
    <rect x="52" y="60" width="4" height="4"/>
    <rect x="60" y="60" width="4" height="4"/>
  </g>
</svg>
`;

// Contacts Icon SVG
const CONTACTS_ICON_SVG = `
<svg width="96" height="96" viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg">
  <rect width="96" height="96" fill="#4F46E5" rx="12"/>
  <g transform="translate(48,48)" fill="white">
    <!-- Person 1 -->
    <circle cx="-16" cy="-8" r="8"/>
    <ellipse cx="-16" cy="8" rx="12" ry="8"/>
    
    <!-- Person 2 -->
    <circle cx="16" cy="-8" r="8"/>
    <ellipse cx="16" cy="8" rx="12" ry="8"/>
    
    <!-- Connection line -->
    <line x1="-4" y1="0" x2="4" y2="0" stroke="white" stroke-width="3" stroke-linecap="round"/>
  </g>
</svg>
`;

// Share Icon SVG
const SHARE_ICON_SVG = `
<svg width="96" height="96" viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg">
  <rect width="96" height="96" fill="#4F46E5" rx="12"/>
  <g transform="translate(48,48)" fill="white">
    <!-- Share nodes -->
    <circle cx="0" cy="-20" r="8"/>
    <circle cx="-20" cy="15" r="8"/>
    <circle cx="20" cy="15" r="8"/>
    
    <!-- Connection lines -->
    <line x1="-6" y1="-14" x2="-14" y2="9" stroke="white" stroke-width="3"/>
    <line x1="6" y1="-14" x2="14" y2="9" stroke="white" stroke-width="3"/>
    
    <!-- Share arrow -->
    <path d="M 0 -28 L -4 -20 L 4 -20 Z" fill="white"/>
  </g>
</svg>
`;

function createIconFiles() {
  console.log('🎨 Creating Dislink app icons...\n');
  
  const iconsDir = path.join(process.cwd(), 'public', 'icons');
  
  // Create main app icons
  fs.writeFileSync(path.join(iconsDir, 'app-icon.svg'), DISLINK_LOGO_SVG);
  console.log('✅ Created app-icon.svg');
  
  // Create shortcut icons
  fs.writeFileSync(path.join(iconsDir, 'qr-icon-96x96.svg'), QR_ICON_SVG);
  fs.writeFileSync(path.join(iconsDir, 'contacts-icon-96x96.svg'), CONTACTS_ICON_SVG);
  fs.writeFileSync(path.join(iconsDir, 'share-icon-96x96.svg'), SHARE_ICON_SVG);
  console.log('✅ Created shortcut icons');
  
  // Create PNG placeholders (in a real scenario, you'd convert SVG to PNG)
  const pngPlaceholder = `
<!-- PNG Icon Placeholder -->
<!-- To convert SVG to PNG, use: -->
<!-- npm install -g svg2png-cli -->
<!-- svg2png app-icon.svg --width=512 --height=512 --output=icon-512x512.png -->
  `;
  
  // Generate placeholder files for all required sizes
  const allSizes = [
    ...ICON_SIZES.pwa,
    ...ICON_SIZES.ios,
    ...ICON_SIZES.android,
    ...ICON_SIZES.other
  ];
  
  const uniqueSizes = [...new Set(allSizes)].sort((a, b) => a - b);
  
  uniqueSizes.forEach(size => {
    const filename = `icon-${size}x${size}.png`;
    const placeholderFile = path.join(iconsDir, `${filename}.placeholder`);
    fs.writeFileSync(placeholderFile, pngPlaceholder);
  });
  
  console.log(`✅ Created placeholders for ${uniqueSizes.length} icon sizes`);
  
  // Create conversion script
  const conversionScript = `#!/bin/bash
# 🎨 Convert SVG icons to PNG for mobile apps
# Requires: npm install -g svg2png-cli

echo "🎨 Converting Dislink icons to PNG..."

cd public/icons

# Main app icons
${uniqueSizes.map(size => 
  `svg2png app-icon.svg --width=${size} --height=${size} --output=icon-${size}x${size}.png`
).join('\n')}

# Shortcut icons
svg2png qr-icon-96x96.svg --width=96 --height=96 --output=qr-icon-96x96.png
svg2png contacts-icon-96x96.svg --width=96 --height=96 --output=contacts-icon-96x96.png
svg2png share-icon-96x96.svg --width=96 --height=96 --output=share-icon-96x96.png

echo "✅ Icon conversion complete!"
echo "📱 Icons ready for mobile app deployment"
`;
  
  const scriptPath = path.join(process.cwd(), 'scripts', 'convert-icons.sh');
  fs.writeFileSync(scriptPath, conversionScript);
  
  console.log('✅ Created icon conversion script');
  
  // Make script executable
  try {
    fs.chmodSync(scriptPath, '755');
  } catch (error) {
    console.log('⚠️  Could not make script executable (run: chmod +x scripts/convert-icons.sh)');
  }
}

function createAppStoreAssets() {
  console.log('\n📱 Creating app store assets...\n');
  
  const screenshotsDir = path.join(process.cwd(), 'public', 'screenshots');
  
  // App store description
  const appStoreDescription = `
# 📱 DISLINK - APP STORE ASSETS

## App Description (Short)
Build meaningful professional connections with smart contact management and QR networking.

## App Description (Long)
Transform how you build and maintain professional relationships with Dislink, the intelligent networking app designed for modern professionals.

### Key Features:
🤝 **Smart Contact Management** - Never forget important details about your connections
📱 **QR Code Networking** - Instantly connect by scanning unique QR codes  
📍 **Location Memory** - Remember exactly where and when you met
📝 **Smart Notes & Follow-ups** - Stay organized with automated reminders
🎯 **Relationship Tiers** - Organize contacts by relationship strength
✉️ **Email Integration** - Send connection invites seamlessly
🌐 **Offline Support** - Works without internet connection
🔔 **Smart Notifications** - Get reminded about important follow-ups

Perfect for:
• Business professionals and entrepreneurs
• Conference attendees and networking events
• Sales teams and relationship managers
• Anyone who values meaningful connections

Join thousands of professionals who never lose track of valuable relationships with Dislink.

## Keywords
networking, contacts, professional, business, QR code, CRM, relationships, follow-up, meetings, connections

## App Category
Business / Productivity

## Target Age
17+ (Business use)

## Privacy Policy URL
https://dislinkboltv2duplicate.netlify.app/privacy

## Support URL
https://dislinkboltv2duplicate.netlify.app/support

## Marketing URL
https://dislinkboltv2duplicate.netlify.app
`;
  
  fs.writeFileSync(path.join(screenshotsDir, 'app-store-assets.md'), appStoreDescription);
  console.log('✅ Created app store description');
  
  // Screenshot placeholders
  const screenshotPlaceholders = [
    'desktop-home.png - Main dashboard view',
    'mobile-contacts.png - Contact management on mobile',
    'mobile-qr.png - QR code scanning feature',
    'mobile-profile.png - User profile editing',
    'mobile-notes.png - Adding notes and follow-ups'
  ];
  
  screenshotPlaceholders.forEach(placeholder => {
    fs.writeFileSync(
      path.join(screenshotsDir, `${placeholder.split(' - ')[0]}.placeholder`),
      `# ${placeholder}`
    );
  });
  
  console.log('✅ Created screenshot placeholders');
}

function printInstructions() {
  console.log('\n📋 NEXT STEPS FOR MOBILE DEPLOYMENT\n');
  console.log('1. 🎨 CONVERT ICONS TO PNG:');
  console.log('   npm install -g svg2png-cli');
  console.log('   chmod +x scripts/convert-icons.sh');
  console.log('   ./scripts/convert-icons.sh');
  console.log('');
  console.log('2. 📱 SET UP MOBILE DEVELOPMENT:');
  console.log('   npm run cap:add:android');
  console.log('   npm run cap:add:ios');
  console.log('   npm run cap:doctor');
  console.log('');
  console.log('3. 🔨 BUILD MOBILE APPS:');
  console.log('   npm run build:android');
  console.log('   npm run build:ios');
  console.log('');
  console.log('4. 🏪 PREPARE FOR APP STORES:');
  console.log('   - Take screenshots of your app');
  console.log('   - Update app-store-assets.md with your details');
  console.log('   - Create developer accounts (Google Play & App Store)');
  console.log('   - Generate signing certificates');
  console.log('');
  console.log('5. 🚀 DEPLOY:');
  console.log('   - Upload to Google Play Console');
  console.log('   - Upload to App Store Connect');
  console.log('   - Submit for review');
}

// Main execution
console.log('🚀 DISLINK MOBILE ASSETS GENERATOR\n');
createIconFiles();
createAppStoreAssets();
printInstructions();
console.log('\n🎉 Mobile assets created successfully!');
console.log('📁 Check public/icons/ and public/screenshots/ directories');
