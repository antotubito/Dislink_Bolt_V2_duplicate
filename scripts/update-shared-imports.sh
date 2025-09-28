#!/bin/bash

# Script to update import paths in web app to use shared components
# Run this from the root directory of the monorepo

echo "🔄 Updating import paths in web app to use shared components..."

cd web/src

# Update library imports
echo "📝 Updating library imports..."
find . -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's|from.*lib/analytics|from "@dislink/shared/lib/analytics"|g'
find . -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's|from.*lib/apiService|from "@dislink/shared/lib/apiService"|g'
find . -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's|from.*lib/notifications|from "@dislink/shared/lib/notifications"|g'
find . -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's|from.*lib/sessionManager|from "@dislink/shared/lib/sessionManager"|g'
find . -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's|from.*lib/channelManager|from "@dislink/shared/lib/channelManager"|g'
find . -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's|from.*lib/dataIsolation|from "@dislink/shared/lib/dataIsolation"|g'
find . -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's|from.*lib/emailService|from "@dislink/shared/lib/emailService"|g'
find . -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's|from.*lib/geolocation|from "@dislink/shared/lib/geolocation"|g'
find . -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's|from.*lib/googleSheetsService|from "@dislink/shared/lib/googleSheetsService"|g'
find . -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's|from.*lib/mobileOptimized|from "@dislink/shared/lib/mobileOptimized"|g'
find . -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's|from.*lib/mobileUtils|from "@dislink/shared/lib/mobileUtils"|g'
find . -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's|from.*lib/monitoring|from "@dislink/shared/lib/monitoring"|g'
find . -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's|from.*lib/nominatimService|from "@dislink/shared/lib/nominatimService"|g'
find . -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's|from.*lib/qr|from "@dislink/shared/lib/qr"|g'
find . -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's|from.*lib/qrConnectionHandler|from "@dislink/shared/lib/qrConnectionHandler"|g'
find . -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's|from.*lib/qrEnhanced|from "@dislink/shared/lib/qrEnhanced"|g'
find . -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's|from.*lib/sentry|from "@dislink/shared/lib/sentry"|g'
find . -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's|from.*lib/socialLinksUtils|from "@dislink/shared/lib/socialLinksUtils"|g'
find . -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's|from.*lib/supabaseClient|from "@dislink/shared/lib/supabaseClient"|g'
find . -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's|from.*lib/userPreferences|from "@dislink/shared/lib/userPreferences"|g'

# Update component imports
echo "📝 Updating component imports..."

# UI Components
find . -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's|from.*components/onboarding/AnimatedButton|from "@dislink/shared/components/ui/AnimatedButton"|g'
find . -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's|from.*components/onboarding/AnimatedInput|from "@dislink/shared/components/ui/AnimatedInput"|g'

# Form Components
find . -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's|from.*components/profile/IndustrySelect|from "@dislink/shared/components/forms/IndustrySelect"|g'
find . -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's|from.*components/profile/JobTitleInput|from "@dislink/shared/components/forms/JobTitleInput"|g'
find . -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's|from.*components/profile/InterestsInput|from "@dislink/shared/components/forms/InterestsInput"|g'
find . -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's|from.*components/profile/SocialLinksInput|from "@dislink/shared/components/forms/SocialLinksInput"|g'
find . -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's|from.*components/onboarding/SocialLinkInput|from "@dislink/shared/components/forms/SocialLinkInput"|g'
find . -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's|from.*components/contacts/ContactForm|from "@dislink/shared/components/forms/ContactForm"|g'

# Modal Components
find . -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's|from.*components/onboarding/CodeInvitationModal|from "@dislink/shared/components/modals/CodeInvitationModal"|g'
find . -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's|from.*components/contacts/TagSelectionModal|from "@dislink/shared/components/modals/TagSelectionModal"|g'
find . -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's|from.*components/contacts/LocationSelectionModal|from "@dislink/shared/components/modals/LocationSelectionModal"|g'
find . -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's|from.*components/contacts/MeetingNoteModal|from "@dislink/shared/components/modals/MeetingNoteModal"|g'
find . -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's|from.*components/contacts/MutualConnectionsModal|from "@dislink/shared/components/modals/MutualConnectionsModal"|g'
find . -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's|from.*components/contacts/SocialSharingModal|from "@dislink/shared/components/modals/SocialSharingModal"|g'
find . -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's|from.*components/contacts/SharingSettingsModal|from "@dislink/shared/components/modals/SharingSettingsModal"|g'
find . -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's|from.*components/contacts/BadgeSelectionModal|from "@dislink/shared/components/modals/BadgeSelectionModal"|g'
find . -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's|from.*components/contacts/TierModal|from "@dislink/shared/components/modals/TierModal"|g'

# Onboarding Components
find . -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's|from.*components/onboarding/OnboardingStep|from "@dislink/shared/components/onboarding/OnboardingStep"|g'
find . -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's|from.*components/onboarding/SocialPlatformSelector|from "@dislink/shared/components/onboarding/SocialPlatformSelector"|g'
find . -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's|from.*components/onboarding/SocialPlatformsWithLogos|from "@dislink/shared/components/onboarding/SocialPlatformsWithLogos"|g'

# Profile Components
find . -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's|from.*components/profile/TierNotificationToggle|from "@dislink/shared/components/profile/TierNotificationToggle"|g'

# Contact Components
find . -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's|from.*components/contacts/ContactFilters|from "@dislink/shared/components/contacts/ContactFilters"|g'
find . -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's|from.*components/contacts/TierSelector|from "@dislink/shared/components/contacts/TierSelector"|g'
find . -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's|from.*components/contacts/CelebrationConfetti|from "@dislink/shared/components/contacts/CelebrationConfetti"|g'

# Notification Components
find . -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's|from.*components/notifications/ConnectionNotification|from "@dislink/shared/components/notifications/ConnectionNotification"|g'
find . -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's|from.*components/notifications/NotificationDropdown|from "@dislink/shared/components/notifications/NotificationDropdown"|g'

# QR Components
find . -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's|from.*components/qr/QRCode|from "@dislink/shared/components/qr/QRCode"|g'
find . -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's|from.*components/qr/ConnectionConfirmation|from "@dislink/shared/components/qr/ConnectionConfirmation"|g'

# Verification Components
find . -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's|from.*components/verification/FaceVerification|from "@dislink/shared/components/verification/FaceVerification"|g'

# Waitlist Components
find . -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's|from.*components/waitlist/WaitlistForm|from "@dislink/shared/components/waitlist/WaitlistForm"|g'
find . -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's|from.*components/waitlist/GoogleSheetsTest|from "@dislink/shared/components/waitlist/GoogleSheetsTest"|g'

echo "✅ Import path updates complete!"
echo ""
echo "🔍 Please review the changes and test the application:"
echo "   pnpm install"
echo "   pnpm dev"
echo ""
echo "⚠️  You may need to manually fix some import paths that couldn't be automatically updated."
echo "⚠️  Some components may need mobile adaptation for React Native compatibility."
