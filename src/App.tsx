import { StrictMode, Suspense, lazy, Component, ErrorInfo, ReactNode } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './components/auth/AuthProvider';
import { SessionGuard } from './components/auth/SessionGuard';
import { AccessGuard } from './components/auth/AccessGuard';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import './utils/accessibilityTest'; // Load accessibility testing utilities
import { ConnectionErrorBanner } from './components/ConnectionErrorBanner';
import { isMobileApp } from './lib/mobileUtils';
import { captureError, captureMessage } from './lib/sentry';

// Error Boundary Component
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class AppErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    console.error('🚨 ErrorBoundary caught an error:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🚨 ErrorBoundary componentDidCatch:', error, errorInfo);

    // Capture error with Sentry
    try {
      captureError(error, {
        context: 'ErrorBoundary',
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString()
      });
    } catch (sentryError) {
      console.error('❌ Failed to capture error with Sentry:', sentryError);
    }

    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <div className="text-center max-w-md mx-auto p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Something went wrong</h1>
            <p className="text-gray-600 mb-4">
              We're having trouble loading the application. Please try refreshing the page.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors block w-full"
              >
                Reload Page
              </button>
              <button
                onClick={() => {
                  try {
                    captureError(new Error("Test error from ErrorBoundary"), {
                      context: 'Manual test error from ErrorBoundary',
                      timestamp: new Date().toISOString(),
                      userAction: 'test button clicked from error boundary'
                    });
                    captureMessage("Sentry test button clicked from ErrorBoundary", "info");
                    alert("🧪 Test error sent to Sentry! Check your Sentry dashboard.");
                  } catch (error) {
                    console.error('❌ Failed to send test error:', error);
                    alert("❌ Failed to send test error to Sentry");
                  }
                }}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors block w-full"
              >
                🧪 Test Sentry Error
              </button>
            </div>
            {import.meta.env.DEV && this.state.error && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm text-gray-500">Error Details (Dev Only)</summary>
                <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

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

// Non-critical pages - lazy loaded with optimized chunking
const Profile = createLazyComponent(() => import('./pages/Profile').then(module => ({ default: module.Profile })), 'Profile');
const Login = createLazyComponent(() => import('./pages/Login').then(module => ({ default: module.Login })), 'Login');
const Register = createLazyComponent(() => import('./pages/Register').then(module => ({ default: module.Register })), 'Register');
const Terms = createLazyComponent(() => import('./pages/Terms').then(module => ({ default: module.Terms })), 'Terms');
const TestTerms = createLazyComponent(() => import('./pages/TestTerms').then(module => ({ default: module.TestTerms })), 'TestTerms');
const Contacts = createLazyComponent(() => import('./pages/Contacts').then(module => ({ default: module.Contacts })), 'Contacts');
const Settings = createLazyComponent(() => import('./pages/Settings').then(module => ({ default: module.Settings })), 'Settings');
const ContactProfile = createLazyComponent(() => import('./pages/ContactProfile').then(module => ({ default: module.ContactProfile })), 'ContactProfile');
const PublicProfile = createLazyComponent(() => import('./pages/PublicProfile').then(module => ({ default: module.PublicProfile })), 'PublicProfile');
const Onboarding = createLazyComponent(() => import('./pages/Onboarding').then(module => ({ default: module.Onboarding })), 'Onboarding');
const WaitlistNew = createLazyComponent(() => import('./pages/WaitlistNew').then(module => ({ default: module.WaitlistNew })), 'WaitlistNew');
const LandingPage = createLazyComponent(() => import('./pages/LandingPage').then(module => ({ default: module.LandingPage })), 'LandingPage');
const TermsConditions = createLazyComponent(() => import('./pages/TermsConditions').then(module => ({ default: module.TermsConditions })), 'TermsConditions');
const PrivacyPolicy = createLazyComponent(() => import('./pages/PrivacyPolicy').then(module => ({ default: module.PrivacyPolicy })), 'PrivacyPolicy');
const Story = createLazyComponent(() => import('./pages/Story').then(module => ({ default: module.Story })), 'Story');
const EmailConfirmation = createLazyComponent(() => import('./pages/EmailConfirmation').then(module => ({ default: module.EmailConfirmation })), 'EmailConfirmation');
const EmailConfirm = createLazyComponent(() => import('./pages/EmailConfirm').then(module => ({ default: module.EmailConfirm })), 'EmailConfirm');
const Confirmed = createLazyComponent(() => import('./pages/Confirmed').then(module => ({ default: module.Confirmed })), 'Confirmed');
const ResetPassword = createLazyComponent(() => import('./pages/ResetPassword').then(module => ({ default: module.ResetPassword })), 'ResetPassword');
const Demo = createLazyComponent(() => import('./pages/Demo').then(module => ({ default: module.Demo })), 'Demo');

// Loading component for Suspense fallback
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-purple-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Dislink</h2>
      <p className="text-gray-600">Please wait while we prepare your experience...</p>
    </div>
  </div>
);

// Simple loading fallback for individual components
const SimpleLoadingFallback = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
    <span className="ml-2 text-gray-600">Loading...</span>
  </div>
);

// Initialize services with error handling
const initializeServices = () => {
  console.log('🔧 Initializing services...');

  // Initialize Sentry only in production
  if (import.meta.env.PROD) {
    try {
      console.log('🔍 Initializing Sentry for production...');
      import('./lib/sentry').then(({ initSentry }) => {
        initSentry();
        console.log('✅ Sentry initialization completed');
      }).catch(error => {
        console.error('❌ Sentry initialization failed:', error);
      });
    } catch (error) {
      console.error('❌ Sentry import failed:', error);
    }
  } else {
    console.log('⚠️ Sentry disabled in development mode to prevent connection issues');
  }

  // Initialize Supabase
  try {
    console.log('🔗 Initializing Supabase...');
    import('./lib/supabase').then(({ initializeConnection }) => {
      initializeConnection().catch(error => {
        console.error('❌ Supabase initialization failed:', error);
      });
    }).catch(error => {
      console.error('❌ Supabase import failed:', error);
    });
  } catch (error) {
    console.error('❌ Supabase import failed:', error);
  }

  // Initialize Cosmic Themes
  try {
    console.log('🌌 Initializing Cosmic Themes...');
    import('./lib/cosmicThemes').then(({ cosmicThemeManager }) => {
      const currentTheme = cosmicThemeManager.getCurrentTheme();
      const currentPalette = cosmicThemeManager.getCurrentPalette();
      console.log(`✅ Cosmic theme loaded: ${currentPalette.name}`);
    }).catch(error => {
      console.error('❌ Cosmic Themes initialization failed:', error);
    });
  } catch (error) {
    console.error('❌ Cosmic Themes import failed:', error);
  }
};

function App() {
  console.log('🎯 App component rendering...');

  // Initialize services
  try {
    initializeServices();
  } catch (error) {
    console.error('❌ Service initialization failed:', error);
  }

  const isRunningInMobileApp = isMobileApp();
  console.log('📱 Is mobile app:', isRunningInMobileApp);

  // Always return a top-level element, even if initialization fails
  return (
    <div className="app-container">
      <AppErrorBoundary>
        <AuthProvider>
          <SessionGuard>
            <ConnectionErrorBanner />
            <Suspense fallback={<LoadingSpinner />}>
              <Routes>
                {/* Public Routes - No authentication required */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/waitlist" element={<WaitlistNew />} />
                <Route path="/share/:code" element={<PublicProfile />} />
                <Route path="/scan/:scanId" element={<PublicProfile />} />
                <Route path="/terms" element={<TermsConditions />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/story" element={<Story />} />
                <Route path="/verify" element={<EmailConfirmation />} />
                <Route path="/confirm" element={<EmailConfirm />} />
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
                    <Register />
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
                </Route>

                {/* Redirect any unmatched routes */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </SessionGuard>
        </AuthProvider>
      </AppErrorBoundary>
    </div>
  );
}

export default App;