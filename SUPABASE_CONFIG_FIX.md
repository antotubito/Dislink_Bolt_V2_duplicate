# Supabase Email Confirmation Fix Guide

## Problem Identified
The Supabase email confirmation links are missing required parameters because of incorrect Site URL and redirect URL configuration.

## Required Supabase Dashboard Changes

### 1. Site URL Configuration
Go to: **Authentication → URL Configuration**

**Set Site URL to:**
```
https://dislinkboltv2duplicate.netlify.app
```

**Add these Redirect URLs:**
```
https://dislinkboltv2duplicate.netlify.app/**
http://localhost:3001/**
https://dislinkboltv2duplicate.netlify.app/confirmed
http://localhost:3001/confirmed
```

### 2. Email Template Updates
Go to: **Authentication → Email Templates**

**Update "Confirm signup" template:**

**Subject:**
```
Confirm Your Signup
```

**Content:**
```html
<h2>Confirm your signup</h2>
<p>Follow this link to confirm your user:</p>
<p><a href="{{ .RedirectTo }}/confirmed?token_hash={{ .TokenHash }}&type=signup&email={{ .Email }}">Confirm your email</a></p>
<p>Alternatively, enter the code: {{ .Token }}</p>
```

**Update "Magic Link" template:**

**Subject:**
```
Your Magic Link
```

**Content:**
```html
<h2>Magic Link</h2>
<p>Follow this link to login:</p>
<p><a href="{{ .RedirectTo }}/confirmed?token_hash={{ .TokenHash }}&type=magiclink&email={{ .Email }}">Log In</a></p>
<p>Alternatively, enter the code: {{ .Token }}</p>
```

**Update "Reset Password" template:**

**Subject:**
```
Reset Your Password
```

**Content:**
```html
<h2>Reset Password</h2>
<p>Follow this link to reset the password for your user:</p>
<p><a href="{{ .RedirectTo }}/confirmed?token_hash={{ .TokenHash }}&type=recovery&email={{ .Email }}">Reset Password</a></p>
<p>Alternatively, enter the code: {{ .Token }}</p>
```

### 3. Auth Flow Configuration
Ensure the following settings are enabled:

**Authentication → Settings:**
- ✅ Enable email confirmations
- ✅ Enable email change confirmations  
- ✅ Enable phone confirmations (if using phone auth)

**Authentication → Providers → Email:**
- ✅ Enable email provider
- ✅ Enable email OTP
- ✅ Enable email confirmations

## Testing the Fix

### 1. Test Registration Flow
1. Go to your app: `https://dislinkboltv2duplicate.netlify.app`
2. Register with a test email
3. Check the confirmation email
4. Click the confirmation link
5. Verify it redirects to `/confirmed` with proper parameters

### 2. Expected URL Structure
After the fix, confirmation links should look like:
```
https://dislinkboltv2duplicate.netlify.app/confirmed?token_hash=abc123&type=signup&email=user@example.com
```

### 3. Debug Information
If issues persist, check:
- Browser console for parameter values
- Network tab for redirect responses
- Supabase logs for authentication errors

## Alternative: Custom Email Template with Confirmation URL

If the above doesn't work, use this template that constructs the URL manually:

```html
<h2>Confirm your signup</h2>
<p>Follow this link to confirm your user:</p>
<p><a href="{{ .SiteURL }}/confirmed?token_hash={{ .TokenHash }}&type=signup&email={{ .Email }}">Confirm your email</a></p>
<p>Alternatively, enter the code: {{ .Token }}</p>
```

## Verification Steps

1. ✅ Site URL is set to your Netlify domain
2. ✅ Redirect URLs include your domain with wildcards
3. ✅ Email templates use correct URL structure
4. ✅ Netlify redirects are properly configured
5. ✅ App handles both PKCE and implicit flows

## Common Issues

- **Missing parameters**: Usually caused by incorrect Site URL
- **Redirect loops**: Caused by missing redirect URLs in allow list
- **Template errors**: Caused by incorrect template syntax
- **CORS issues**: Usually resolved by proper redirect URL configuration
