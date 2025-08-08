# Dislink – A Smarter Way to Keep Connections

Dislink is a modern web & mobile app designed to help you manage meaningful professional and personal relationships. Track where, when, and how you meet people, and never forget important context again.

## 🚀 About

Dislink empowers professionals to build and maintain strong networks by combining intuitive design with context-rich contact management. It's your personal relationship assistant — built for real-world connections.

## 🧩 Features

- 🔗 QR code sharing for fast, seamless networking  
- 🧠 Context-aware contact notes and tagging  
- ⏰ Smart follow-ups and personalized reminders  
- 📍 Location-based history of where you met people  
- 🔒 Private and secure – your data stays yours  

## 📦 Repository

This project is connected to the GitHub repository:  
[https://github.com/antotubito/Dislink_Bolt_V2_duplicate](https://github.com/antotubito/Dislink_Bolt_V2_duplicate)

## 🛠️ Development

To run the project locally:

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 🔧 Supabase Configuration

### Email Confirmation Setup

To ensure email confirmation links work properly, configure these settings in your Supabase dashboard:

#### 1. Site URL Configuration
Go to **Authentication > URL Configuration** in your Supabase dashboard and set:

- **Site URL**: `https://dislinkboltv2duplicate.netlify.app`

#### 2. Redirect URLs
Add these URLs to your **Redirect URLs** allow list:

```
https://dislinkboltv2duplicate.netlify.app/**
https://dislinkboltv2duplicate.netlify.app/confirmed
http://localhost:5173/**
http://localhost:3000/**
```

#### 3. Email Templates
Ensure your email templates use the correct redirect URL. In **Authentication > Email Templates**, make sure the confirmation links use:

```html
<a href="{{ .RedirectTo }}/confirmed?token_hash={{ .TokenHash }}&type=email">
  Confirm your email
</a>
```

#### 4. Environment Variables
Make sure these are set in your Netlify environment:

```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Flow After Configuration
1. User registers → Email sent with redirect to `/confirmed`
2. User clicks email link → Redirected to `/confirmed` page
3. Page verifies token → Shows success message
4. User clicks "🚀 Start Your Journey" → Redirected to `/app/onboarding`

## 🔑 **NETLIFY ENVIRONMENT VARIABLES**

Add these **4 variables** in **Site Settings** → **Environment Variables**:

### **Variable 1:**
```
Name: VITE_SUPABASE_URL
Value: https://bbonxxvifycwpoeaxsor.supabase.co
```

### **Variable 2:**
```
Name: VITE_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJib254eHZpZnljd3BvZWF4c29yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0Mjg5NDUsImV4cCI6MjA3MDAwNDk0NX0.rUuAcPIHVCfpAMEU2ADyb0F4Q3_eL0mkEyhBcbu0O70
```

### **Variable 3:**
```
Name: NODE_VERSION
Value: 18
```

### **Variable 4:**
```
Name: NPM_VERSION
Value: 9
```

## 🔐 **STEP 4: Configure Supabase**

In your **Supabase Dashboard**:

1. **Authentication** → **URL Configuration**:
   ```
   Site URL: https://dislinkboltv2duplicate.netlify.app
   ```

2. **Authentication** → **Redirect URLs** (add these):
   ```
   https://dislinkboltv2duplicate.netlify.app/**
   https://dislinkboltv2duplicate.netlify.app/confirmed
   http://localhost:5173/**
   ```

## 🚀 **STEP 5: Deploy!**

1. **Click "Deploy site"** in Netlify
2. **Wait for build** (should take ~4 minutes)
3. **Check deploy logs** for any issues

## 📊 **EXPECTED RESULTS**

After successful deployment:
- ✅ **Homepage**: Beautiful Dislink landing page with animations
- ✅ **Authentication**: Login/register working
- ✅ **Routing**: All pages accessible (`/`, `/waitlist`, `/story`, `/app/*`)
- ✅ **Mobile**: Responsive design
- ✅ **Email confirmation**: Proper redirects

## 🎯 **WHAT'S ALREADY CONFIGURED**

Your `netlify.toml` file includes:
- ✅ **Build settings** (npm run build → dist)
- ✅ **SPA routing** (/* → /index.html)
- ✅ **Auth redirects** (Supabase email confirmations)
- ✅ **Security headers** (XSS protection, etc.)
- ✅ **Performance headers** (asset caching)

## 🚨 **If Deployment Fails**

Check these in the **deploy logs**:
1. **Environment variables** are set correctly
2. **Build command** completes successfully
3. **Node version** is 18+

**Your Dislink app is 100% ready for Netlify deployment! 🎉**

Just follow the steps above and your beautiful networking app will be live!

