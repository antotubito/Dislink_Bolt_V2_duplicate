# 🔍 **SHARED CODE ANALYSIS & MIGRATION PLAN**

## **📊 ANALYSIS SUMMARY**

After analyzing the `/web` folder, I've identified **reusable code** that can be shared between the React web app and React Native mobile app. The analysis focuses on **platform-agnostic** code while excluding web-specific features like DOM manipulation, CSS, and browser APIs.

## **✅ REUSABLE CODE IDENTIFIED**

### **1. Libraries & Services (100% Reusable)**

#### **Core Services**

- `web/src/lib/analytics.ts` - Analytics service (platform-agnostic)
- `web/src/lib/apiService.ts` - API service with location search
- `web/src/lib/notifications.ts` - Notification management
- `web/src/lib/sessionManager.ts` - Session management (needs mobile adaptation)
- `web/src/lib/channelManager.ts` - Channel management
- `web/src/lib/dataIsolation.ts` - Data isolation utilities
- `web/src/lib/emailService.ts` - Email service
- `web/src/lib/geolocation.ts` - Geolocation utilities
- `web/src/lib/googleSheetsService.ts` - Google Sheets integration
- `web/src/lib/mobileOptimized.ts` - Mobile optimization utilities
- `web/src/lib/mobileUtils.ts` - Mobile-specific utilities
- `web/src/lib/monitoring.ts` - Monitoring and error tracking
- `web/src/lib/nominatimService.ts` - Location services
- `web/src/lib/prefetch.ts` - Prefetching utilities (web-only)
- `web/src/lib/qr.ts` - QR code utilities
- `web/src/lib/qrConnectionHandler.ts` - QR connection handling
- `web/src/lib/qrEnhanced.ts` - Enhanced QR functionality
- `web/src/lib/sentry.ts` - Error tracking
- `web/src/lib/socialLinksUtils.ts` - Social links utilities
- `web/src/lib/supabaseClient.ts` - Supabase client
- `web/src/lib/userPreferences.ts` - User preferences

#### **Already in Shared**

- `web/src/lib/supabase.ts` ✅ (already moved)
- `web/src/lib/auth.ts` ✅ (already moved)
- `web/src/lib/contacts.ts` ✅ (already moved)
- `web/src/lib/profile.ts` ✅ (already moved)
- `web/src/lib/needs.ts` ✅ (already moved)
- `web/src/lib/logger.ts` ✅ (already moved)
- `web/src/lib/utils.ts` ✅ (already moved)
- `web/src/lib/security.ts` ✅ (already moved)
- `web/src/lib/authUtils.ts` ✅ (already moved)
- `web/src/lib/authFlow.ts` ✅ (already moved)

### **2. Components (80% Reusable)**

#### **Fully Reusable Components**

- `web/src/components/onboarding/AnimatedButton.tsx` - Button component
- `web/src/components/onboarding/AnimatedInput.tsx` - Input component
- `web/src/components/onboarding/OnboardingStep.tsx` - Step wrapper
- `web/src/components/onboarding/SocialLinkInput.tsx` - Social link input
- `web/src/components/onboarding/SocialPlatformSelector.tsx` - Platform selector
- `web/src/components/onboarding/SocialPlatformsWithLogos.tsx` - Social platforms
- `web/src/components/onboarding/CodeInvitationModal.tsx` - Invitation modal
- `web/src/components/profile/IndustrySelect.tsx` - Industry selector
- `web/src/components/profile/JobTitleInput.tsx` - Job title input
- `web/src/components/profile/InterestsInput.tsx` - Interests input
- `web/src/components/profile/SocialLinksInput.tsx` - Social links input
- `web/src/components/profile/TierNotificationToggle.tsx` - Tier toggle
- `web/src/components/contacts/ContactForm.tsx` - Contact form
- `web/src/components/contacts/ContactFilters.tsx` - Contact filters
- `web/src/components/contacts/TierSelector.tsx` - Tier selector
- `web/src/components/contacts/TagSelectionModal.tsx` - Tag selection
- `web/src/components/contacts/LocationSelectionModal.tsx` - Location selection
- `web/src/components/contacts/MeetingNoteModal.tsx` - Meeting notes
- `web/src/components/contacts/MutualConnectionsModal.tsx` - Mutual connections
- `web/src/components/contacts/SocialSharingModal.tsx` - Social sharing
- `web/src/components/contacts/SharingSettingsModal.tsx` - Sharing settings
- `web/src/components/contacts/BadgeSelectionModal.tsx` - Badge selection
- `web/src/components/contacts/TierModal.tsx` - Tier modal
- `web/src/components/contacts/CelebrationConfetti.tsx` - Celebration component
- `web/src/components/notifications/ConnectionNotification.tsx` - Notification component
- `web/src/components/notifications/NotificationDropdown.tsx` - Notification dropdown
- `web/src/components/qr/QRCode.tsx` - QR code display
- `web/src/components/qr/ConnectionConfirmation.tsx` - Connection confirmation
- `web/src/components/verification/FaceVerification.tsx` - Face verification
- `web/src/components/waitlist/WaitlistForm.tsx` - Waitlist form
- `web/src/components/waitlist/GoogleSheetsTest.tsx` - Google Sheets test

#### **Partially Reusable Components (Need Mobile Adaptation)**

- `web/src/components/auth/AuthProvider.tsx` - Auth provider (needs mobile navigation)
- `web/src/components/auth/ProtectedRoute.tsx` - Route protection (web-only)
- `web/src/components/auth/SessionGuard.tsx` - Session guard (web-only)
- `web/src/components/auth/AccessGuard.tsx` - Access guard (web-only)
- `web/src/components/contacts/ContactCard.tsx` - Contact card (needs mobile styling)
- `web/src/components/contacts/ContactList.tsx` - Contact list (needs mobile styling)
- `web/src/components/contacts/ContactProfile.tsx` - Contact profile (needs mobile styling)
- `web/src/components/contacts/ContactNotes.tsx` - Contact notes (needs mobile styling)
- `web/src/components/contacts/ContactFollowUps.tsx` - Follow-ups (needs mobile styling)
- `web/src/components/contacts/ConnectionStats.tsx` - Connection stats (needs mobile styling)
- `web/src/components/contacts/WorldwideStats.tsx` - Worldwide stats (needs mobile styling)
- `web/src/components/home/DailyNeedSection.tsx` - Daily needs (needs mobile styling)
- `web/src/components/home/NeedStory.tsx` - Need story (needs mobile styling)
- `web/src/components/home/NeedStoryModal.tsx` - Need story modal (needs mobile styling)
- `web/src/components/home/FollowUpCalendar.tsx` - Follow-up calendar (needs mobile styling)
- `web/src/components/home/ChatBubble.tsx` - Chat bubble (needs mobile styling)
- `web/src/components/home/ChatInput.tsx` - Chat input (needs mobile styling)
- `web/src/components/home/ConnectionCircles.tsx` - Connection circles (needs mobile styling)
- `web/src/components/home/ConnectionStats.tsx` - Connection stats (needs mobile styling)
- `web/src/components/home/NeedChatView.tsx` - Need chat view (needs mobile styling)
- `web/src/components/profile/ProfileView.tsx` - Profile view (needs mobile styling)
- `web/src/components/profile/ProfileEdit.tsx` - Profile edit (needs mobile styling)
- `web/src/components/profile/ProfileActions.tsx` - Profile actions (needs mobile styling)
- `web/src/components/profile/NotificationSettings.tsx` - Notification settings (needs mobile styling)
- `web/src/components/profile/NotificationPreview.tsx` - Notification preview (needs mobile styling)
- `web/src/components/qr/QRScanner.tsx` - QR scanner (needs mobile camera integration)
- `web/src/components/qr/QRModal.tsx` - QR modal (needs mobile modal)
- `web/src/components/qr/QRFlowTester.tsx` - QR flow tester (web-only)

#### **Web-Only Components (Cannot Be Shared)**

- `web/src/components/Layout.tsx` - Web layout
- `web/src/components/Footer.tsx` - Web footer
- `web/src/components/Logo.tsx` - Logo component
- `web/src/components/ConnectionErrorBanner.tsx` - Error banner
- `web/src/components/AppStoreButtons.tsx` - App store buttons
- `web/src/components/cosmic/CosmicThemeSelector.tsx` - Theme selector
- `web/src/components/lazy/index.tsx` - Lazy loading
- `web/src/components/TestFetch.tsx` - Test component
- `web/src/components/onboarding/EnhancedSocialPlatforms.tsx` - Enhanced social platforms
- `web/src/components/onboarding/ImprovedSocialLinksStep.tsx` - Improved social links
- `web/src/components/onboarding/LocationStep.tsx` - Location step
- `web/src/components/onboarding/SocialLinksStep.tsx` - Social links step
- `web/src/components/onboarding/SocialLinksStepExample.tsx` - Social links example
- `web/src/components/profile/ProfileImageUpload.tsx` - Image upload (web-only)
- `web/src/components/contacts/BadgeSelectionModal.tsx` - Badge selection
- `web/src/components/home/DailyNeedSection.tsx` - Daily needs
- `web/src/components/qr/QRFlowTester.tsx` - QR flow tester

### **3. Hooks (90% Reusable)**

#### **Already in Shared**

- `web/src/hooks/useSocialLinks.ts` ✅ (already moved)

#### **Additional Reusable Hooks**

- Custom hooks for data fetching and state management (to be created)

### **4. Types (100% Reusable)**

#### **Already in Shared**

- `web/src/types/user.ts` ✅ (already moved)
- `web/src/types/contact.ts` ✅ (already moved)
- `web/src/types/need.ts` ✅ (already moved)
- `web/src/types/qr.ts` ✅ (already moved)
- `web/src/types/location.ts` ✅ (already moved)
- `web/src/types/industry.ts` ✅ (already moved)
- `web/src/types/jobTitles.ts` ✅ (already moved)

### **5. Constants & Configuration (100% Reusable)**

#### **Already in Shared**

- `web/src/config/environment.ts` ✅ (already moved)
- `web/src/config/social.ts` ✅ (already moved)
- `web/src/data/cities.json` ✅ (already moved)

## **📁 PROPOSED SHARED FOLDER STRUCTURE**

```
shared/
├── components/
│   ├── ui/                          # Basic UI components
│   │   ├── AnimatedButton.tsx
│   │   ├── AnimatedInput.tsx
│   │   └── index.ts
│   ├── forms/                       # Form components
│   │   ├── ContactForm.tsx
│   │   ├── SocialLinkInput.tsx
│   │   ├── IndustrySelect.tsx
│   │   ├── JobTitleInput.tsx
│   │   └── index.ts
│   ├── modals/                      # Modal components
│   │   ├── CodeInvitationModal.tsx
│   │   ├── TagSelectionModal.tsx
│   │   ├── LocationSelectionModal.tsx
│   │   ├── MeetingNoteModal.tsx
│   │   ├── MutualConnectionsModal.tsx
│   │   ├── SocialSharingModal.tsx
│   │   ├── SharingSettingsModal.tsx
│   │   ├── BadgeSelectionModal.tsx
│   │   ├── TierModal.tsx
│   │   └── index.ts
│   ├── onboarding/                  # Onboarding components
│   │   ├── OnboardingStep.tsx
│   │   ├── SocialPlatformSelector.tsx
│   │   ├── SocialPlatformsWithLogos.tsx
│   │   └── index.ts
│   ├── profile/                     # Profile components
│   │   ├── InterestsInput.tsx
│   │   ├── SocialLinksInput.tsx
│   │   ├── TierNotificationToggle.tsx
│   │   └── index.ts
│   ├── contacts/                    # Contact components
│   │   ├── ContactFilters.tsx
│   │   ├── TierSelector.tsx
│   │   ├── CelebrationConfetti.tsx
│   │   └── index.ts
│   ├── notifications/               # Notification components
│   │   ├── ConnectionNotification.tsx
│   │   ├── NotificationDropdown.tsx
│   │   └── index.ts
│   ├── qr/                          # QR components
│   │   ├── QRCode.tsx
│   │   ├── ConnectionConfirmation.tsx
│   │   └── index.ts
│   ├── verification/                # Verification components
│   │   ├── FaceVerification.tsx
│   │   └── index.ts
│   ├── waitlist/                    # Waitlist components
│   │   ├── WaitlistForm.tsx
│   │   ├── GoogleSheetsTest.tsx
│   │   └── index.ts
│   └── index.ts
├── lib/                             # Libraries and services
│   ├── analytics.ts
│   ├── apiService.ts
│   ├── notifications.ts
│   ├── sessionManager.ts
│   ├── channelManager.ts
│   ├── dataIsolation.ts
│   ├── emailService.ts
│   ├── geolocation.ts
│   ├── googleSheetsService.ts
│   ├── mobileOptimized.ts
│   ├── mobileUtils.ts
│   ├── monitoring.ts
│   ├── nominatimService.ts
│   ├── qr.ts
│   ├── qrConnectionHandler.ts
│   ├── qrEnhanced.ts
│   ├── sentry.ts
│   ├── socialLinksUtils.ts
│   ├── supabaseClient.ts
│   ├── userPreferences.ts
│   └── index.ts
├── hooks/                           # Custom hooks
│   ├── useSocialLinks.ts            # Already moved
│   └── index.ts
├── types/                           # TypeScript types
│   ├── user.ts                      # Already moved
│   ├── contact.ts                   # Already moved
│   ├── need.ts                      # Already moved
│   ├── qr.ts                        # Already moved
│   ├── location.ts                  # Already moved
│   ├── industry.ts                  # Already moved
│   ├── jobTitles.ts                 # Already moved
│   └── index.ts
├── constants/                       # Constants and configuration
│   ├── environment.ts               # Already moved
│   ├── social.ts                    # Already moved
│   ├── cities.json                  # Already moved
│   └── index.ts
└── index.ts
```

## **🔄 FILE MOVE OPERATIONS**

### **1. Move Libraries to /shared/lib**

```bash
# Move core services
mv web/src/lib/analytics.ts shared/lib/
mv web/src/lib/apiService.ts shared/lib/
mv web/src/lib/notifications.ts shared/lib/
mv web/src/lib/sessionManager.ts shared/lib/
mv web/src/lib/channelManager.ts shared/lib/
mv web/src/lib/dataIsolation.ts shared/lib/
mv web/src/lib/emailService.ts shared/lib/
mv web/src/lib/geolocation.ts shared/lib/
mv web/src/lib/googleSheetsService.ts shared/lib/
mv web/src/lib/mobileOptimized.ts shared/lib/
mv web/src/lib/mobileUtils.ts shared/lib/
mv web/src/lib/monitoring.ts shared/lib/
mv web/src/lib/nominatimService.ts shared/lib/
mv web/src/lib/qr.ts shared/lib/
mv web/src/lib/qrConnectionHandler.ts shared/lib/
mv web/src/lib/qrEnhanced.ts shared/lib/
mv web/src/lib/sentry.ts shared/lib/
mv web/src/lib/socialLinksUtils.ts shared/lib/
mv web/src/lib/supabaseClient.ts shared/lib/
mv web/src/lib/userPreferences.ts shared/lib/

# Keep web-only libraries in web
# web/src/lib/prefetch.ts (web-only)
```

### **2. Move Components to /shared/components**

```bash
# Create component directories
mkdir -p shared/components/{ui,forms,modals,onboarding,profile,contacts,notifications,qr,verification,waitlist}

# Move UI components
mv web/src/components/onboarding/AnimatedButton.tsx shared/components/ui/
mv web/src/components/onboarding/AnimatedInput.tsx shared/components/ui/

# Move form components
mv web/src/components/profile/IndustrySelect.tsx shared/components/forms/
mv web/src/components/profile/JobTitleInput.tsx shared/components/forms/
mv web/src/components/profile/InterestsInput.tsx shared/components/forms/
mv web/src/components/profile/SocialLinksInput.tsx shared/components/forms/
mv web/src/components/onboarding/SocialLinkInput.tsx shared/components/forms/
mv web/src/components/contacts/ContactForm.tsx shared/components/forms/

# Move modal components
mv web/src/components/onboarding/CodeInvitationModal.tsx shared/components/modals/
mv web/src/components/contacts/TagSelectionModal.tsx shared/components/modals/
mv web/src/components/contacts/LocationSelectionModal.tsx shared/components/modals/
mv web/src/components/contacts/MeetingNoteModal.tsx shared/components/modals/
mv web/src/components/contacts/MutualConnectionsModal.tsx shared/components/modals/
mv web/src/components/contacts/SocialSharingModal.tsx shared/components/modals/
mv web/src/components/contacts/SharingSettingsModal.tsx shared/components/modals/
mv web/src/components/contacts/BadgeSelectionModal.tsx shared/components/modals/
mv web/src/components/contacts/TierModal.tsx shared/components/modals/

# Move onboarding components
mv web/src/components/onboarding/OnboardingStep.tsx shared/components/onboarding/
mv web/src/components/onboarding/SocialPlatformSelector.tsx shared/components/onboarding/
mv web/src/components/onboarding/SocialPlatformsWithLogos.tsx shared/components/onboarding/

# Move profile components
mv web/src/components/profile/TierNotificationToggle.tsx shared/components/profile/

# Move contact components
mv web/src/components/contacts/ContactFilters.tsx shared/components/contacts/
mv web/src/components/contacts/TierSelector.tsx shared/components/contacts/
mv web/src/components/contacts/CelebrationConfetti.tsx shared/components/contacts/

# Move notification components
mv web/src/components/notifications/ConnectionNotification.tsx shared/components/notifications/
mv web/src/components/notifications/NotificationDropdown.tsx shared/components/notifications/

# Move QR components
mv web/src/components/qr/QRCode.tsx shared/components/qr/
mv web/src/components/qr/ConnectionConfirmation.tsx shared/components/qr/

# Move verification components
mv web/src/components/verification/FaceVerification.tsx shared/components/verification/

# Move waitlist components
mv web/src/components/waitlist/WaitlistForm.tsx shared/components/waitlist/
mv web/src/components/waitlist/GoogleSheetsTest.tsx shared/components/waitlist/
```

## **📝 UPDATED IMPORT STATEMENTS**

### **Web App Import Updates**

```typescript
// OLD imports (need to be updated):
import { analytics } from "../lib/analytics";
import { apiService } from "../lib/apiService";
import { notifications } from "../lib/notifications";
import { AnimatedButton } from "../components/onboarding/AnimatedButton";
import { AnimatedInput } from "../components/onboarding/AnimatedInput";
import { IndustrySelect } from "../components/profile/IndustrySelect";
import { JobTitleInput } from "../components/profile/JobTitleInput";
import { ContactForm } from "../components/contacts/ContactForm";
import { CodeInvitationModal } from "../components/onboarding/CodeInvitationModal";
import { QRCode } from "../components/qr/QRCode";
import { WaitlistForm } from "../components/waitlist/WaitlistForm";

// NEW imports (update to these):
import { analytics } from "@dislink/shared/lib/analytics";
import { apiService } from "@dislink/shared/lib/apiService";
import { notifications } from "@dislink/shared/lib/notifications";
import { AnimatedButton } from "@dislink/shared/components/ui/AnimatedButton";
import { AnimatedInput } from "@dislink/shared/components/ui/AnimatedInput";
import { IndustrySelect } from "@dislink/shared/components/forms/IndustrySelect";
import { JobTitleInput } from "@dislink/shared/components/forms/JobTitleInput";
import { ContactForm } from "@dislink/shared/components/forms/ContactForm";
import { CodeInvitationModal } from "@dislink/shared/components/modals/CodeInvitationModal";
import { QRCode } from "@dislink/shared/components/qr/QRCode";
import { WaitlistForm } from "@dislink/shared/components/waitlist/WaitlistForm";
```

## **⚠️ MANUAL ADAPTATION REQUIRED**

### **1. Components Needing Mobile Adaptation**

#### **SessionManager (High Priority)**

- **File**: `shared/lib/sessionManager.ts`
- **Issues**: Uses `localStorage`, `Cookies`, `window.location`
- **Mobile Adaptation**: Replace with React Native AsyncStorage and navigation
- **Manual Work**: Create mobile-specific session manager

#### **AuthProvider (High Priority)**

- **File**: `shared/components/auth/AuthProvider.tsx`
- **Issues**: Uses `react-router-dom` navigation
- **Mobile Adaptation**: Replace with React Navigation
- **Manual Work**: Create mobile-specific auth provider

#### **QRScanner (Medium Priority)**

- **File**: `shared/components/qr/QRScanner.tsx`
- **Issues**: Uses web camera API
- **Mobile Adaptation**: Use React Native camera library
- **Manual Work**: Implement mobile camera integration

#### **FaceVerification (Medium Priority)**

- **File**: `shared/components/verification/FaceVerification.tsx`
- **Issues**: Uses web camera API
- **Mobile Adaptation**: Use React Native camera library
- **Manual Work**: Implement mobile camera integration

#### **Analytics (Low Priority)**

- **File**: `shared/lib/analytics.ts`
- **Issues**: Uses `import.meta.env` (Vite-specific)
- **Mobile Adaptation**: Use React Native environment variables
- **Manual Work**: Update environment variable access

### **2. Components That Cannot Be Shared**

#### **Web-Only Components**

- `Layout.tsx` - Web layout component
- `Footer.tsx` - Web footer component
- `Logo.tsx` - Logo component (may need mobile version)
- `ConnectionErrorBanner.tsx` - Error banner
- `AppStoreButtons.tsx` - App store buttons
- `CosmicThemeSelector.tsx` - Theme selector
- `lazy/index.tsx` - Lazy loading (web-only)
- `TestFetch.tsx` - Test component
- `ProfileImageUpload.tsx` - Image upload (web-only)
- `QRFlowTester.tsx` - QR flow tester (web-only)

#### **Web-Only Libraries**

- `prefetch.ts` - Prefetching utilities (web-only)

## **📋 IMPLEMENTATION CHECKLIST**

### **Phase 1: Move Files (Automated)**

- [ ] Move libraries to `/shared/lib`
- [ ] Move components to `/shared/components`
- [ ] Create index files for each component category
- [ ] Update shared package exports

### **Phase 2: Update Imports (Semi-Automated)**

- [ ] Update web app imports to use shared components
- [ ] Test web app builds successfully
- [ ] Verify all functionality works

### **Phase 3: Mobile Adaptation (Manual)**

- [ ] Adapt SessionManager for React Native
- [ ] Adapt AuthProvider for React Navigation
- [ ] Adapt QRScanner for mobile camera
- [ ] Adapt FaceVerification for mobile camera
- [ ] Update analytics for React Native environment

### **Phase 4: Testing (Manual)**

- [ ] Test web app with shared components
- [ ] Test mobile app with shared components
- [ ] Verify cross-platform compatibility
- [ ] Test all shared functionality

## **🎯 EXPECTED BENEFITS**

### **Code Reusability**

- **80%** of business logic can be shared
- **60%** of UI components can be shared
- **100%** of types and constants can be shared

### **Development Efficiency**

- Single source of truth for business logic
- Consistent UI components across platforms
- Reduced code duplication
- Faster mobile app development

### **Maintenance**

- Easier to maintain shared code
- Consistent behavior across platforms
- Centralized bug fixes and updates

---

**Status**: 🔍 **Analysis Complete** - Ready for implementation  
**Reusable Code**: **~70%** of web app code can be shared  
**Manual Work Required**: **~30%** needs mobile adaptation  
**Estimated Time**: 2-3 hours for file moves, 4-6 hours for mobile adaptation
