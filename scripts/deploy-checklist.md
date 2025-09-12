# 🚀 Deployment Checklist for Enhanced QR System

## Pre-Deployment Setup

### 1. Supabase Configuration

#### Environment Variables Setup
```bash
# Required in Netlify Environment Variables
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Optional but recommended
VITE_GEOCODING_API_KEY=your-opencage-api-key
VITE_EMAIL_SERVICE_API_KEY=your-sendgrid-key
VITE_APP_URL=https://your-app.netlify.app
```

#### Database Migration
```bash
# Run the database migration
node scripts/setup-supabase.js
```

#### Supabase Auth Configuration
In your Supabase Dashboard → Authentication → URL Configuration:

**Site URL:**
```
https://your-app.netlify.app
```

**Redirect URLs:**
```
https://your-app.netlify.app/**
https://your-app.netlify.app/confirmed
http://localhost:5173/**
http://localhost:3000/**
```

#### Email Templates
In Supabase Dashboard → Authentication → Email Templates:

**Confirm signup template:**
```html
<h2>Confirm your signup</h2>
<p>Follow this link to confirm your account:</p>
<p><a href="{{ .RedirectTo }}/confirmed?token_hash={{ .TokenHash }}&type=email">Confirm your email</a></p>
```

### 2. Netlify Configuration

#### Build Settings
- **Build command:** `npm run build`
- **Publish directory:** `dist`
- **Node version:** `18`

#### Environment Variables (Netlify Dashboard)
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_GEOCODING_API_KEY=your-opencage-api-key (optional)
VITE_EMAIL_SERVICE_API_KEY=your-sendgrid-key (optional)
VITE_APP_URL=https://your-app.netlify.app
```

## Deployment Steps

### 1. Database Migration
```bash
# Ensure you have Supabase environment variables set
export VITE_SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_SERVICE_KEY="your-service-role-key"

# Run migration
node scripts/setup-supabase.js
```

### 2. Build and Deploy
```bash
# Install dependencies
npm install

# Build the project
npm run build

# Deploy to Netlify (if using Netlify CLI)
netlify deploy --prod --dir=dist
```

### 3. Post-Deployment Verification

#### ✅ Routes Testing
- [ ] **Landing Page:** `https://your-app.netlify.app/` → Waitlist
- [ ] **Registration:** `https://your-app.netlify.app/app/register`
- [ ] **Login:** `https://your-app.netlify.app/app/login`
- [ ] **Email Confirmation:** `https://your-app.netlify.app/confirmed`
- [ ] **Public Profile:** `https://your-app.netlify.app/share/test-profile`
- [ ] **QR Code Generation:** Available in app after login

#### ✅ QR Code System Testing
- [ ] Generate QR code from authenticated user
- [ ] Scan QR code → Redirects to public profile
- [ ] Location tracking works (GPS permission)
- [ ] Email invitation system functional
- [ ] Direct registration from QR scan
- [ ] Connection memory creation
- [ ] Automatic user connections after registration

#### ✅ Waitlist Functionality
- [ ] Waitlist form submissions work
- [ ] Email validation
- [ ] Google Sheets integration (if configured)
- [ ] Success messages display
- [ ] Error handling works

#### ✅ Authentication Flow
- [ ] User registration with email verification
- [ ] Login/logout functionality
- [ ] Protected routes redirect to login
- [ ] Email confirmation redirects properly
- [ ] Onboarding flow after verification

## Troubleshooting

### Common Issues and Solutions

#### 1. Email Confirmation Not Working
**Problem:** Users can't verify their email
**Solution:**
- Check Supabase redirect URLs configuration
- Verify `netlify.toml` redirects are correct
- Ensure email templates use correct redirect URL

#### 2. QR Code Scanning Issues
**Problem:** QR scans don't track properly
**Solution:**
- Verify database migration was applied
- Check if tables exist: `qr_scan_tracking`, `email_invitations`, `connection_memories`
- Ensure Supabase RLS policies allow necessary operations

#### 3. Location Tracking Not Working
**Problem:** Location data not captured
**Solution:**
- Ensure HTTPS deployment (required for geolocation)
- Check browser permissions for location access
- Verify geocoding API key if using enhanced location features

#### 4. Connection Memory Not Created
**Problem:** Users aren't automatically connected
**Solution:**
- Check `completeQRConnection` function execution
- Verify database tables and relationships
- Check browser console for JavaScript errors

#### 5. Environment Variables Issues
**Problem:** App can't connect to Supabase
**Solution:**
- Verify all environment variables are set in Netlify
- Check variable names match exactly (`VITE_` prefix required)
- Ensure no trailing spaces in variable values

## Testing Commands

### Local Testing
```bash
# Start development server
npm run dev

# Test build locally
npm run build && npm run preview
```

### Database Testing
```bash
# Test database connection
node -e "
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
supabase.from('profiles').select('*').limit(1).then(console.log);
"
```

## Security Checklist

- [ ] Supabase RLS policies enabled
- [ ] Service role key not exposed in frontend
- [ ] HTTPS enforced
- [ ] Environment variables properly configured
- [ ] Access password system working for production
- [ ] Email verification required for registration

## Performance Optimization

- [ ] Static assets cached properly
- [ ] Images optimized
- [ ] Bundle size acceptable
- [ ] Database queries optimized
- [ ] Lazy loading implemented where appropriate

## Monitoring and Analytics

- [ ] Error tracking configured
- [ ] Performance monitoring
- [ ] User analytics (if desired)
- [ ] Database monitoring
- [ ] Email delivery monitoring

---

## 🎯 Success Criteria

Your deployment is successful when:

1. ✅ Users can register and verify their email
2. ✅ QR codes can be generated and scanned
3. ✅ Location tracking works on QR scans
4. ✅ Email invitations are sent and functional
5. ✅ Connection memory preserves first meeting context
6. ✅ Users are automatically connected after registration
7. ✅ Waitlist functionality captures emails
8. ✅ All routes work correctly
9. ✅ Mobile app features work (camera, location)
10. ✅ Error handling is graceful

## 📞 Support

If you encounter issues:
1. Check the browser console for errors
2. Verify Supabase logs in the dashboard
3. Test with different browsers/devices
4. Check network requests in browser dev tools
5. Review Netlify function logs if using serverless functions
