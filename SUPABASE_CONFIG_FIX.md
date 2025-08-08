# 🔧 SUPABASE CONFIGURATION FIX

## ❌ PROBLEM: Incorrect URL with hyphens
You may have configured Supabase with:
```
https://dislink-bolt-v2-duplicate.netlify.app
```

## ✅ SOLUTION: Correct URL without hyphens
The correct URL is:
```
https://dislinkboltv2duplicate.netlify.app
```

---

## 🔧 STEPS TO FIX SUPABASE CONFIGURATION

### 1. Go to Supabase Dashboard
- Visit: https://supabase.com/dashboard
- Select your project: `bbonxxvifycwpoeaxsor`

### 2. Update Authentication Settings
Go to **Authentication** → **URL Configuration**

#### Site URL:
```
https://dislinkboltv2duplicate.netlify.app
```

#### Redirect URLs (Add these):
```
https://dislinkboltv2duplicate.netlify.app/**
https://dislinkboltv2duplicate.netlify.app/confirmed
http://localhost:5173/**
http://localhost:3000/**
```

### 3. Update Email Templates
Go to **Authentication** → **Email Templates**

Make sure all email templates use the correct URL:
```html
<a href="{{ .RedirectTo }}/confirmed?token_hash={{ .TokenHash }}&type=email">
  Confirm your email
</a>
```

### 4. Save Changes
- Click "Save" after each change
- Wait a few minutes for changes to propagate

---

## 🚨 CRITICAL: Remove Old URLs

If you have any old URLs with hyphens in your Supabase configuration, **remove them completely**:

### ❌ Remove these (if they exist):
```
https://dislink-bolt-v2-duplicate.netlify.app/**
https://dislink-bolt-v2-duplicate.netlify.app/confirmed
```

### ✅ Keep only these:
```
https://dislinkboltv2duplicate.netlify.app/**
https://dislinkboltv2duplicate.netlify.app/confirmed
http://localhost:5173/**
http://localhost:3000/**
```

---

## 🎯 AFTER FIXING

Once you update the Supabase configuration:
1. **Test Registration**: https://dislinkboltv2duplicate.netlify.app/app/register
2. **Check Email**: Confirmation links should use correct URL
3. **Test Login**: https://dislinkboltv2duplicate.netlify.app/app/login

The authentication flow should work properly with the correct URLs! 