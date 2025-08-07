import { StrictMode } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './components/auth/AuthProvider';
import { SessionGuard } from './components/auth/SessionGuard';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Home } from './pages/Home';
import { Profile } from './pages/Profile';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Terms } from './pages/Terms';
import { TestTerms } from './pages/TestTerms';
import { Contacts } from './pages/Contacts';
import { Settings } from './pages/Settings';
import { ContactProfile } from './pages/ContactProfile';
import { PublicProfile } from './pages/PublicProfile';
import { Onboarding } from './pages/Onboarding';
import { Waitlist } from './pages/Waitlist';
import { TermsConditions } from './pages/TermsConditions';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { Story } from './pages/Story';
import { EmailConfirmation } from './pages/EmailConfirmation';
import { EmailConfirm } from './pages/EmailConfirm';
import { Confirmed } from './pages/Confirmed';
import { ResetPassword } from './pages/ResetPassword';
import { Demo } from './pages/Demo';
import { ConnectionErrorBanner } from './components/ConnectionErrorBanner';
import { MobileAppBanner } from './components/MobileAppBanner';
import { isMobileApp } from './lib/mobileUtils';

function App() {
  console.log('🎯 App component rendering...');
  const isRunningInMobileApp = isMobileApp();
  console.log('📱 Is mobile app:', isRunningInMobileApp);

  try {
    return (
      <AuthProvider>
        <SessionGuard>
          {!isRunningInMobileApp && <MobileAppBanner />}
          <ConnectionErrorBanner />
          <Routes>
            {/* Public Routes - No authentication required */}
            <Route path="/" element={<Waitlist />} />
            <Route path="/waitlist" element={<Waitlist />} />
            <Route path="/share/:code" element={<PublicProfile />} />
            <Route path="/terms" element={<TermsConditions />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/story" element={<Story />} />
            <Route path="/verify" element={<EmailConfirmation />} />
            <Route path="/confirm" element={<EmailConfirm />} />
            <Route path="/confirmed" element={<Confirmed />} />
            <Route path="/demo" element={<Demo />} />
            
            {/* Auth Routes - No authentication required */}
            <Route path="/app/login" element={<Login />} />
            <Route path="/app/register" element={<Register />} />
            <Route path="/app/reset-password" element={<ResetPassword />} />
            <Route path="/app/terms" element={<TermsConditions />} />
            <Route path="/app/test-terms" element={<TestTerms />} />
            <Route path="/app/privacy" element={<PrivacyPolicy />} />
            <Route path="/app/onboarding" element={<Onboarding />} />
            
            {/* Protected App Routes - Authentication required */}
            <Route path="/app" element={<Layout />}>
              <Route index element={
                <ProtectedRoute>
                  <Home />
                </ProtectedRoute>
              } />
              <Route
                path="contacts"
                element={
                  <ProtectedRoute>
                    <Contacts />
                  </ProtectedRoute>
                }
              />
              <Route
                path="contact/:id"
                element={
                  <ProtectedRoute>
                    <ContactProfile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="settings"
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Catch all - redirect to waitlist */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </SessionGuard>
      </AuthProvider>
    );
  } catch (error) {
    console.error('❌ Error in App component:', error);
    return (
      <div style={{ 
        padding: '20px', 
        fontFamily: 'Arial, sans-serif',
        backgroundColor: '#fee',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column'
      }}>
        <h1 style={{ color: '#c33', marginBottom: '20px' }}>
          ❌ App Error
        </h1>
        <p style={{ color: '#666', textAlign: 'center' }}>
          There was an error rendering the app:<br/>
          {error instanceof Error ? error.message : String(error)}
        </p>
      </div>
    );
  }
}

export default App;