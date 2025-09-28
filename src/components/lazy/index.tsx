// Lazy-loaded components for better bundle optimization
import { lazy } from 'react';
import React from 'react';

// Heavy components that should be lazy-loaded
export const LazyCityAutocomplete = lazy(() => 
  import('../common/CityAutocomplete').then(module => ({ 
    default: module.CityAutocomplete 
  }))
);

export const LazyQRScanner = lazy(() => 
  import('../qr/QRScanner').then(module => ({ 
    default: module.QRScanner 
  }))
);

export const LazyQRModal = lazy(() => 
  import('../qr/QRModal').then(module => ({ 
    default: module.QRModal 
  }))
);

export const LazyConnectionConfirmation = lazy(() => 
  import('../qr/ConnectionConfirmation').then(module => ({ 
    default: module.ConnectionConfirmation 
  }))
);

export const LazyLocationStep = lazy(() => 
  import('../onboarding/LocationStep').then(module => ({ 
    default: module.LocationStep 
  }))
);

export const LazyEnhancedSocialPlatforms = lazy(() => 
  import('../onboarding/EnhancedSocialPlatforms').then(module => ({ 
    default: module.EnhancedSocialPlatforms 
  }))
);

export const LazyProfileImageUpload = lazy(() => 
  import('../profile/ProfileImageUpload').then(module => ({ 
    default: module.ProfileImageUpload 
  }))
);

export const LazyJobTitleInput = lazy(() => 
  import('../profile/JobTitleInput').then(module => ({ 
    default: module.JobTitleInput 
  }))
);

export const LazyIndustrySelect = lazy(() => 
  import('../profile/IndustrySelect').then(module => ({ 
    default: module.IndustrySelect 
  }))
);

export const LazyCodeInvitationModal = lazy(() => 
  import('../onboarding/CodeInvitationModal').then(module => ({ 
    default: module.CodeInvitationModal 
  }))
);

export const LazyWaitlistForm = lazy(() => 
  import('../waitlist/WaitlistForm').then(module => ({ 
    default: module.WaitlistForm 
  }))
);

export const LazyGoogleSheetsTest = lazy(() => 
  import('../waitlist/GoogleSheetsTest').then(module => ({ 
    default: module.GoogleSheetsTest 
  }))
);

export const LazyNotificationDropdown = lazy(() => 
  import('../notifications/NotificationDropdown').then(module => ({ 
    default: module.NotificationDropdown 
  }))
);

export const LazyFaceVerification = lazy(() => 
  import('../verification/FaceVerification').then(module => ({ 
    default: module.FaceVerification 
  }))
);

// Additional heavy components from Home page
export const LazyContactCard = lazy(() => 
  import('../contacts/ContactCard').then(module => ({ 
    default: module.default 
  }))
);

export const LazyConnectionStats = lazy(() => 
  import('../contacts/ConnectionStats').then(module => ({ 
    default: module.ConnectionStats 
  }))
);

export const LazyWorldwideStats = lazy(() => 
  import('../contacts/WorldwideStats').then(module => ({ 
    default: module.WorldwideStats 
  }))
);

export const LazyFollowUpCalendar = lazy(() => 
  import('../home/FollowUpCalendar').then(module => ({ 
    default: module.FollowUpCalendar 
  }))
);

export const LazyDailyNeedSection = lazy(() => 
  import('../home/DailyNeedSection').then(module => ({ 
    default: module.default 
  }))
);

// Modal components that can be lazy-loaded
export const LazyLocationSelectionModal = lazy(() => 
  import('../contacts/LocationSelectionModal').then(module => ({ 
    default: module.LocationSelectionModal 
  }))
);

export const LazyTagSelectionModal = lazy(() => 
  import('../contacts/TagSelectionModal').then(module => ({ 
    default: module.TagSelectionModal 
  }))
);

export const LazySocialSharingModal = lazy(() => 
  import('../contacts/SocialSharingModal').then(module => ({ 
    default: module.SocialSharingModal 
  }))
);

export const LazyMutualConnectionsModal = lazy(() => 
  import('../contacts/MutualConnectionsModal').then(module => ({ 
    default: module.MutualConnectionsModal 
  }))
);

export const LazyMeetingNoteModal = lazy(() => 
  import('../contacts/MeetingNoteModal').then(module => ({ 
    default: module.MeetingNoteModal 
  }))
);

export const LazyCelebrationConfetti = lazy(() => 
  import('../contacts/CelebrationConfetti').then(module => ({ 
    default: module.CelebrationConfetti 
  }))
);

export const LazyBadgeSelectionModal = lazy(() => 
  import('../contacts/BadgeSelectionModal').then(module => ({ 
    default: module.BadgeSelectionModal 
  }))
);

export const LazyTierModal = lazy(() => 
  import('../contacts/TierModal').then(module => ({ 
    default: module.TierModal 
  }))
);

// Need-related components
export const LazyNeedStory = lazy(() => 
  import('../home/NeedStory').then(module => ({ 
    default: module.NeedStory 
  }))
);

export const LazyNeedStoryModal = lazy(() => 
  import('../home/NeedStoryModal').then(module => ({ 
    default: module.NeedStoryModal 
  }))
);

// Loading fallback component
export const LazyLoadingFallback = () => (
  <div className="flex items-center justify-center p-4">
    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
    <span className="ml-2 text-sm text-gray-600">Loading...</span>
  </div>
);

// Error fallback component
export const LazyErrorFallback = ({ componentName }: { componentName: string }) => (
  <div className="flex items-center justify-center p-4 bg-red-50 border border-red-200 rounded-lg">
    <div className="text-center">
      <p className="text-sm text-red-600 mb-2">Failed to load {componentName}</p>
      <button
        onClick={() => window.location.reload()}
        className="text-xs text-red-500 hover:text-red-700 underline"
      >
        Reload page
      </button>
    </div>
  </div>
);
