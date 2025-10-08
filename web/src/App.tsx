import { StrictMode, Suspense, lazy, Component, ErrorInfo, ReactNode } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './components/auth/AuthProvider';
import { SessionGuard } from './components/auth/SessionGuard';
import { AccessGuard } from './components/auth/AccessGuard';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
// import { AnalyticsProvider } from './components/analytics/AnalyticsProvider';
// import './utils/accessibilityTest'; // Load accessibility testing utilities - DISABLED (might be causing errors)
import { ConnectionErrorBanner } from './components/ConnectionErrorBanner';
import { PreloadManager } from './components/lazy/PreloadManager';
import { isMobileApp } from "@dislink/shared/lib/mobileUtils";
import { captureError, captureMessage } from "@dislink/shared/lib/sentry";
import { SecureErrorBoundary } from './components/security/SecureErrorBoundary';
import { logSecurityEvent, isSecureEnvironment } from './components/security/SecurityUtils';
import { performanceBudgetManager } from './lib/performance/PerformanceBudgets';
import { redisCache } from './lib/cache/RedisCache';
import { backupManager } from './lib/backup/BackupManager';
// Temporarily import LandingPage directly to avoid lazy loading issues
import { LandingPage } from './pages/LandingPage';
import { TestLanding } from './pages/TestLanding';

// Legacy error boundary removed - using SecureErrorBoundary instead

// Lazy load heavy components with error handling
const createLazyComponent = (importFn: () => Promise<any>, componentName: string) => {
  return lazy(() =>
    importFn().catch(error => {
      console.error(`❌ Failed to load ${componentName}:`, error);
      // Return a fallback component
      return {
        default: () => (
          <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to load {componentName}</h2>
              <p className="text-gray-600 mb-4">There was an error loading this page.</p>
              <button
                onClick={() => window.location.reload()}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Reload Page
              </button>
            </div>
          </div>
        )
      };
    })
  );
};

// Critical components - loaded immediately (Home is the main landing page)
const Home = createLazyComponent(() => import('./pages/Home').then(module => ({ default: module.Home })), 'Home');
const Contacts = createLazyComponent(() => import('./pages/Contacts').then(module => ({ default: module.Contacts })), 'Contacts');
const ContactProfile = createLazyComponent(() => import('./pages/ContactProfile').then(module => ({ default: module.ContactProfile })), 'ContactProfile');
const Profile = createLazyComponent(() => import('./pages/Profile').then(module => ({ default: module.Profile })), 'Profile');
const Settings = createLazyComponent(() => import('./pages/Settings').then(module => ({ default: module.Settings })), 'Settings');
const Login = createLazyComponent(() => import('./pages/Login').then(module => ({ default: module.Login })), 'Login');
const ResetPassword = createLazyComponent(() => import('./pages/ResetPassword').then(module => ({ default: module.ResetPassword })), 'ResetPassword');
const Demo = createLazyComponent(() => import('./pages/Demo').then(module => ({ default: module.Demo })), 'Demo');
const EmailConfirmationUnified = createLazyComponent(() => import('./pages/EmailConfirmationUnified').then(module => ({ default: module.EmailConfirmationUnified })), 'EmailConfirmationUnified');
const Confirmed = createLazyComponent(() => import('./pages/Confirmed').then(module => ({ default: module.Confirmed })), 'Confirmed');
const PublicProfileUnified = createLazyComponent(() => import('./pages/PublicProfileUnified').then(module => ({ default: module.PublicProfileUnified })), 'PublicProfileUnified');
const RegistrationWithInvitation = createLazyComponent(() => import('./components/auth/RegistrationWithInvitation').then(module => ({ default: module.RegistrationWithInvitation })), 'RegistrationWithInvitation');
const Onboarding = createLazyComponent(() => import('./pages/Onboarding').then(module => ({ default: module.Onboarding })), 'Onboarding');
const WaitlistNew = createLazyComponent(() => import('./pages/WaitlistNew').then(module => ({ default: module.WaitlistNew })), 'WaitlistNew');
// const LandingPage = createLazyComponent(() => import('./pages/LandingPage').then(module => ({ default: module.LandingPage })), 'LandingPage');
const TermsConditions = createLazyComponent(() => import('./pages/TermsConditions').then(module => ({ default: module.TermsConditions })), 'TermsConditions');
const PrivacyPolicy = createLazyComponent(() => import('./pages/PrivacyPolicy').then(module => ({ default: module.PrivacyPolicy })), 'PrivacyPolicy');
const Story = createLazyComponent(() => import('./pages/Story').then(module => ({ default: module.Story })), 'Story');
const RegistrationWithoutInvitation = createLazyComponent(() => import('./components/auth/RegistrationWithoutInvitation').then(module => ({ default: module.RegistrationWithoutInvitation })), 'RegistrationWithoutInvitation');
const TestTerms = createLazyComponent(() => import('./pages/TestTerms').then(module => ({ default: module.TestTerms })), 'TestTerms');

// Advanced dashboard components
const AnalyticsDashboard = createLazyComponent(() => import('./components/analytics/AnalyticsDashboard').then(module => ({ default: module.AnalyticsDashboard })), 'AnalyticsDashboard');
const PerformanceDashboard = createLazyComponent(() => import('./components/performance/PerformanceDashboard').then(module => ({ default: module.PerformanceDashboard })), 'PerformanceDashboard');
const ABTestingDashboard = createLazyComponent(() => import('./components/ab-testing/ABTestingDashboard').then(module => ({ default: module.ABTestingDashboard })), 'ABTestingDashboard');
const BackupDashboard = createLazyComponent(() => import('./components/backup/BackupDashboard').then(module => ({ default: module.BackupDashboard })), 'BackupDashboard');

// Loading spinner component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-600">Loading...</p>
    </div>
  </div>
);

// Service initialization function
const initializeServices = async () => {
  try {
    console.log('🔧 Initializing services...');
    
    // Performance monitoring is auto-initialized in constructor
    console.log('📊 Performance monitoring initialized');
    
    // Initialize Redis cache - DISABLED (table doesn't exist)
    // try {
    //   await redisCache.connect();
    //   console.log('🔗 Redis cache connected');
    // } catch (error) {
    //   console.warn('⚠️ Redis cache connection failed:', error);
    // }
    
    // Initialize backup manager - DISABLED (tables don't exist)
    // try {
    //   await backupManager.initialize();
    //   console.log('💾 Backup manager initialized');
    // } catch (error) {
    //   console.warn('⚠️ Backup manager initialization failed:', error);
    // }
    
    console.log('✅ All services initialized successfully');
  } catch (error) {
    console.error('❌ Service initialization failed:', error);
    // Don't throw - let the app continue even if services fail
  }
};

// Cosmic Themes initialization
const initializeCosmicThemes = async () => {
  try {
    const { cosmicThemeManager } = await import('./lib/cosmicThemes');
    cosmicThemeManager.getCurrentTheme();
    const currentPalette = cosmicThemeManager.getCurrentPalette();
    console.log(`✨ Cosmic theme loaded: ${currentPalette.name} - ${currentPalette.description}`);
  } catch (error) {
    console.error('❌ Cosmic Themes import failed:', error);
  }
};

function App() {
  console.log('🎯 App component rendering...');
  console.log('🔍 Environment:', import.meta.env.MODE);
  console.log('🔍 Current URL:', window.location.href);

  // Initialize services
  try {
    console.log('🔧 Initializing services...');
    initializeServices();
    console.log('✅ Services initialized successfully');
  } catch (error) {
    console.error('❌ Service initialization failed:', error);
  }

  const isRunningInMobileApp = isMobileApp();
  console.log('📱 Is mobile app:', isRunningInMobileApp);

  // Check security environment
  if (!isSecureEnvironment()) {
    logSecurityEvent('Insecure environment detected', {
      protocol: window.location.protocol,
      hostname: window.location.hostname
    });
  }

  // Initialize performance monitoring - DISABLED (might be causing errors)
  // console.log('🚀 Performance monitoring initialized');
  // console.log('📊 Performance budget status:', performanceBudgetManager.getBudgetStatus());

  // Initialize Redis cache - DISABLED (table doesn't exist)
  // redisCache.connect().then(() => {
  //   console.log('🔗 Redis cache connected');
  // }).catch((error) => {
  //   console.warn('⚠️ Redis cache connection failed:', error);
  // });

  // Initialize backup manager - DISABLED (tables don't exist)
  // backupManager.initialize().then(() => {
  //   console.log('💾 Backup manager initialized');
  // }).catch((error) => {
  //   console.warn('⚠️ Backup manager initialization failed:', error);
  // });

  // Always return a top-level element, even if initialization fails
  return (
    <div className="app-container">
      {/* <PreloadManager /> */}
        <SecureErrorBoundary
          onError={(error, errorInfo) => {
            logSecurityEvent('Application error caught', {
              error: error.message,
              componentStack: errorInfo.componentStack
            });
          }}
          resetKeys={[window.location.pathname]}
        >
          {/* <AnalyticsProvider enableAutoTracking={true} enablePerformanceTracking={true} enableErrorTracking={true}> */}
            <AuthProvider>
              <SessionGuard>
                {/* <ConnectionErrorBanner /> */}
              <Suspense fallback={<LoadingSpinner />}>
              <Routes>
                {/* Public Routes - No authentication required */}
                <Route path="/" element={<TestLanding />} />
                <Route path="/waitlist" element={<WaitlistNew />} />
                <Route path="/profile/:connectionCode" element={<PublicProfileUnified />} />
                <Route path="/connect/:connectionCode" element={<PublicProfileUnified />} />
                <Route path="/share/:connectionCode" element={<PublicProfileUnified />} />
                <Route path="/terms" element={<TermsConditions />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                    <Route path="/story" element={<Story />} />
                    <Route path="/verify" element={<EmailConfirmationUnified />} />
                    <Route path="/confirm" element={<EmailConfirmationUnified />} />
                    <Route path="/confirmed" element={<Confirmed />} />
                    <Route path="/demo" element={<Demo />} />

                {/* Auth Routes - Early access password required */}
                <Route path="/app/login" element={
                  <AccessGuard>
                    <Login />
                  </AccessGuard>
                } />
                <Route path="/app/register" element={
                  <AccessGuard>
                    <RegistrationWithInvitation />
                  </AccessGuard>
                } />
                <Route path="/app/reset-password" element={
                  <AccessGuard>
                    <ResetPassword />
                  </AccessGuard>
                } />
                <Route path="/app/terms" element={<TermsConditions />} />
                <Route path="/app/test-terms" element={<TestTerms />} />
                <Route path="/app/privacy" element={<PrivacyPolicy />} />
                <Route path="/app/onboarding" element={
                  <AccessGuard>
                    <Onboarding />
                  </AccessGuard>
                } />
                <Route path="/app/register-standalone" element={
                  <AccessGuard>
                    <RegistrationWithoutInvitation />
                  </AccessGuard>
                } />

                {/* Protected App Routes - Authentication required */}
                <Route path="/app" element={<Layout />}>
                  <Route index element={
                    <ProtectedRoute>
                      <Home />
                    </ProtectedRoute>
                  } />
                  <Route path="contacts" element={
                    <ProtectedRoute>
                      <Contacts />
                    </ProtectedRoute>
                  } />
                  <Route path="contact/:id" element={
                    <ProtectedRoute>
                      <ContactProfile />
                    </ProtectedRoute>
                  } />
                  <Route path="profile" element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  } />
                  <Route path="settings" element={
                    <ProtectedRoute>
                      <Settings />
                    </ProtectedRoute>
                  } />
                  <Route path="analytics" element={
                    <ProtectedRoute>
                      <AnalyticsDashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="performance" element={
                    <ProtectedRoute>
                      <PerformanceDashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="ab-testing" element={
                    <ProtectedRoute>
                      <ABTestingDashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="backup" element={
                    <ProtectedRoute>
                      <BackupDashboard />
                    </ProtectedRoute>
                  } />
                </Route>

                {/* Redirect any unmatched routes */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </SessionGuard>
        </AuthProvider>
        {/* </AnalyticsProvider> */}
      </SecureErrorBoundary>
    </div>
  );
}

export default App;