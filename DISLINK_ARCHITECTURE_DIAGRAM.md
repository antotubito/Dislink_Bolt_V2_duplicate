# 🏗️ DISLINK APPLICATION ARCHITECTURE DIAGRAM

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                            │
├─────────────────────────────────────────────────────────────────┤
│  🌐 Web App (React 18 + TypeScript + Vite)                    │
│  📱 Mobile App (Capacitor + iOS/Android)                      │
│  🎨 UI Components (Tailwind CSS + Framer Motion)              │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                           │
├─────────────────────────────────────────────────────────────────┤
│  🛡️  Authentication (AccessGuard + SessionGuard)              │
│  🗺️  Routing (React Router v6)                                │
│  📊 State Management (Context API + Local Storage)            │
│  🧪 Testing (Vitest 3.2.4 + Testing Library)                 │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      FEATURE LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│  👥 Contact Management    │  📱 QR Code System                │
│  📋 Profile Management    │  🏠 Home Dashboard                │
│  🔔 Notifications         │  📍 Location Services             │
│  🎨 Theme System          │  📧 Email Services                │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      INTEGRATION LAYER                         │
├─────────────────────────────────────────────────────────────────┤
│  🔗 Supabase Client      │  🌍 GeoDB Cities API              │
│  📧 SendGrid/Mailgun     │  🗺️  Nominatim API                │
│  📱 Capacitor Plugins    │  🔔 Push Notifications             │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│  🗄️  Supabase (PostgreSQL Database)                           │
│  🔐 Supabase Auth (Authentication)                             │
│  ⚡ Supabase Realtime (Real-time Updates)                      │
│  📁 Supabase Storage (File Storage)                            │
│  ⚙️  Supabase Edge Functions (Serverless Functions)            │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DEPLOYMENT LAYER                            │
├─────────────────────────────────────────────────────────────────┤
│  🌐 Netlify (Web Hosting)                                      │
│  🔗 Custom Domain (dislink.app)                                │
│  📱 App Stores (iOS App Store + Google Play)                   │
│  🔒 SSL/TLS (HTTPS Encryption)                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Route Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        ROUTE STRUCTURE                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  📍 PUBLIC ROUTES (No Authentication)                          │
│  ├── /                    → LandingPage                        │
│  ├── /waitlist           → WaitlistNew                         │
│  ├── /share/:code        → PublicProfile                       │
│  ├── /scan/:scanId       → PublicProfile                       │
│  ├── /terms              → TermsConditions                     │
│  ├── /privacy            → PrivacyPolicy                       │
│  ├── /story              → Story                               │
│  ├── /verify             → EmailConfirmation                   │
│  ├── /confirm            → EmailConfirm                        │
│  ├── /confirmed          → Confirmed                           │
│  └── /demo               → Demo                                │
│                                                                 │
│  🔐 AUTH ROUTES (Early Access Required)                        │
│  ├── /app/login          → Login (AccessGuard)                 │
│  ├── /app/register       → Register (AccessGuard)              │
│  ├── /app/reset-password → ResetPassword (AccessGuard)         │
│  └── /app/onboarding     → Onboarding (AccessGuard)            │
│                                                                 │
│  🛡️  PROTECTED ROUTES (Authentication Required)                │
│  ├── /app                → Home (Layout + ProtectedRoute)      │
│  ├── /app/contacts       → Contacts (ProtectedRoute)           │
│  ├── /app/contact/:id    → ContactProfile (ProtectedRoute)     │
│  ├── /app/profile        → Profile (ProtectedRoute)            │
│  └── /app/settings       → Settings (ProtectedRoute)           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Component Hierarchy

```
┌─────────────────────────────────────────────────────────────────┐
│                    COMPONENT ARCHITECTURE                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  🏠 App (Root Component)                                        │
│  ├── 🛡️  AuthProvider (Authentication Context)                 │
│  │   ├── 🔐 SessionGuard (Route Protection)                    │
│  │   │   ├── 🔒 AccessGuard (Early Access Control)             │
│  │   │   └── 🛡️  ProtectedRoute (Auth Required Routes)         │
│  │   └── 📱 ConnectionErrorBanner (Error Handling)             │
│  │                                                                 │
│  ├── 🗺️  Routes (React Router)                                  │
│  │   ├── 📄 Public Pages (LandingPage, WaitlistNew, etc.)      │
│  │   ├── 🔐 Auth Pages (Login, Register, Onboarding)           │
│  │   └── 🏠 Protected Pages (Home, Contacts, Profile, etc.)    │
│  │                                                                 │
│  └── 🎨 Layout (Main Application Layout)                        │
│      ├── 🧭 Navigation (Top Navigation Bar)                     │
│      ├── 🔔 NotificationDropdown (Notifications)                │
│      ├── 📱 QRModal (QR Code Sharing)                           │
│      └── 📄 Outlet (Page Content)                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Feature Components

```
┌─────────────────────────────────────────────────────────────────┐
│                      FEATURE COMPONENTS                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  👥 CONTACT MANAGEMENT                                          │
│  ├── ContactList (Contact Grid/List View)                      │
│  ├── ContactCard (Individual Contact Display)                  │
│  ├── ContactProfile (Detailed Contact View)                    │
│  ├── ContactForm (Create/Edit Contact)                         │
│  ├── ContactFilters (Search & Filter)                          │
│  └── ContactNotes (Notes & Follow-ups)                         │
│                                                                 │
│  📱 QR CODE SYSTEM                                              │
│  ├── QRModal (QR Code Display Modal)                           │
│  ├── QRCodeGenerator (QR Code Creation)                        │
│  ├── QRScanner (Camera QR Scanning)                            │
│  └── QRFlowTester (QR Flow Testing)                            │
│                                                                 │
│  👤 PROFILE MANAGEMENT                                          │
│  ├── ProfileView (Profile Display)                             │
│  ├── ProfileEdit (Profile Editing)                             │
│  ├── ProfileImageUpload (Image Upload)                         │
│  └── SocialLinksInput (Social Media Links)                     │
│                                                                 │
│  🏠 HOME DASHBOARD                                              │
│  ├── DailyNeedSection (Activity-based Networking)              │
│  ├── ConnectionCircles (Visual Connection Stats)               │
│  ├── FollowUpCalendar (Meeting Scheduling)                     │
│  └── ConnectionStats (Analytics)                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        DATA FLOW                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  📱 User Interaction                                            │
│  ├── 🎯 Component Event (Click, Form Submit, etc.)             │
│  ├── 🔄 State Update (Local State Change)                      │
│  ├── 🌐 API Call (Supabase Client)                             │
│  ├── 🗄️  Database Operation (CRUD Operations)                  │
│  ├── ⚡ Real-time Update (Supabase Realtime)                   │
│  └── 🎨 UI Update (Component Re-render)                        │
│                                                                 │
│  🔐 Authentication Flow                                         │
│  ├── 🔑 Login/Register (Supabase Auth)                         │
│  ├── 📧 Email Verification (SendGrid/Mailgun)                  │
│  ├── 🛡️  Session Management (JWT Tokens)                       │
│  └── 🔄 Auto-refresh (Token Refresh)                           │
│                                                                 │
│  📍 Location Services                                           │
│  ├── 📱 GPS Location (Capacitor Geolocation)                   │
│  ├── 🗺️  Reverse Geocoding (Nominatim API)                     │
│  ├── 🏙️  City Search (GeoDB Cities API)                        │
│  └── 💾 Location Storage (Supabase Database)                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    DEPLOYMENT ARCHITECTURE                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  🏗️  BUILD PROCESS                                             │
│  ├── 📦 pnpm build (TypeScript + Vite)                         │
│  ├── 🗜️  Bundle Optimization (Code Splitting)                  │
│  ├── 🎨 Asset Generation (CSS, JS, Images)                     │
│  └── 📱 Mobile Build (Capacitor Sync)                          │
│                                                                 │
│  🌐 WEB DEPLOYMENT                                              │
│  ├── 📡 Netlify (Primary Hosting)                              │
│  ├── 🔗 dislinkboltv2duplicate.netlify.app (Subdomain)         │
│  ├── 🌍 dislink.app (Custom Domain)                            │
│  ├── 🔒 SSL/TLS (HTTPS Encryption)                             │
│  └── ⚡ CDN (Edge Caching)                                     │
│                                                                 │
│  📱 MOBILE DEPLOYMENT                                           │
│  ├── 🍎 iOS App Store (Apple Developer Account)                │
│  ├── 🤖 Google Play Store (Google Play Console)                │
│  ├── 🔧 Capacitor Build (Native App Generation)                │
│  └── 📱 Native Features (Camera, GPS, Notifications)           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Security Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      SECURITY ARCHITECTURE                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  🔐 AUTHENTICATION LAYERS                                       │
│  ├── 🛡️  AccessGuard (Early Access Password)                   │
│  ├── 🔑 SessionGuard (Route Protection)                        │
│  ├── 🛡️  ProtectedRoute (Auth Required Routes)                 │
│  └── 🔄 Token Refresh (Automatic Session Renewal)              │
│                                                                 │
│  🛡️  SECURITY MEASURES                                          │
│  ├── 🔒 HTTPS Only (SSL/TLS Encryption)                        │
│  ├── 🚫 CORS Protection (Cross-Origin Security)                │
│  ├── 🛡️  Security Headers (XSS, CSRF Protection)               │
│  ├── 🔐 Row Level Security (Supabase RLS)                      │
│  └── 📝 Input Validation (Zod Schema Validation)               │
│                                                                 │
│  🔍 MONITORING & LOGGING                                        │
│  ├── 📊 Error Tracking (Console Logging)                       │
│  ├── 🔍 Performance Monitoring (Bundle Analysis)               │
│  ├── 📱 User Analytics (Usage Tracking)                        │
│  └── 🚨 Security Alerts (Authentication Failures)              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```
