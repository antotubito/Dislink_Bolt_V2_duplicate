# 🔧 Environment Setup Guide

## **Environment Files Configuration**

Since environment files are protected by gitignore, you need to create them manually. Here's how to set up your environment variables:

### **1. Create .env.local (for development)**

Create a file named `.env.local` in your project root with the following content:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional: Geocoding API for enhanced location tracking
VITE_GEOCODING_API_KEY=your_opencage_or_mapbox_api_key

# Optional: Email service for connection invitations
VITE_EMAIL_SERVICE_API_KEY=your_sendgrid_or_mailgun_api_key

# App Configuration
VITE_APP_URL=http://localhost:3001

# Access Password for Production (already configured in environment.ts)
VITE_ACCESS_PASSWORD=ITHINKWEMET2025

# Sentry Configuration for Error Monitoring
VITE_SENTRY_DSN=your_sentry_dsn_here
```

### **2. Create .env.production (for production)**

Create a file named `.env.production` in your project root with the following content:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional: Geocoding API for enhanced location tracking
VITE_GEOCODING_API_KEY=your_opencage_or_mapbox_api_key

# Optional: Email service for connection invitations
VITE_EMAIL_SERVICE_API_KEY=your_sendgrid_or_mailgun_api_key

# App Configuration
VITE_APP_URL=https://your-netlify-app.netlify.app

# Access Password for Production (already configured in environment.ts)
VITE_ACCESS_PASSWORD=ITHINKWEMET2025

# Sentry Configuration for Error Monitoring
VITE_SENTRY_DSN=your_sentry_dsn_here
```

### **3. Update .env.local with your actual values**

Replace the placeholder values with your actual configuration:

```bash
# Example with real values (DO NOT commit these to git)
VITE_SUPABASE_URL=https://bbonxxvifycwpoeaxsor.supabase.co
VITE_SUPABASE_ANON_KEY=your_actual_anon_key_here
VITE_APP_URL=http://localhost:3001
VITE_SENTRY_DSN=https://your_actual_sentry_dsn@sentry.io/project_id
```

## **Sentry Configuration**

### **Getting Your Sentry DSN**

1. **Create a Sentry account** at [sentry.io](https://sentry.io)
2. **Create a new project** for your Dislink app
3. **Copy the DSN** from your project settings
4. **Replace `your_sentry_dsn_here`** in your environment files

### **Sentry Behavior**

The updated Sentry configuration will:

- ✅ **Only initialize in production** when a valid DSN is provided
- ✅ **Skip initialization** if DSN is placeholder or missing
- ✅ **Log initialization status** for debugging
- ✅ **Gracefully handle** missing or invalid DSNs

### **Console Output Examples**

**When Sentry is properly configured:**
```
🔍 Initializing Sentry with DSN: https://abc123@sentry.io/...
✅ Sentry initialized successfully
```

**When Sentry DSN is placeholder:**
```
⚠️ Sentry not initialized: {
  isProduction: true,
  hasDsn: true,
  dsnValue: 'placeholder'
}
```

**When Sentry DSN is missing:**
```
⚠️ Sentry not initialized: {
  isProduction: true,
  hasDsn: false,
  dsnValue: 'configured'
}
```

## **Environment Variable Priority**

Vite loads environment variables in this order (later files override earlier ones):

1. `.env` (always loaded)
2. `.env.local` (always loaded, ignored by git)
3. `.env.[mode]` (e.g., `.env.production`)
4. `.env.[mode].local` (e.g., `.env.production.local`)

## **Security Notes**

- ✅ **Never commit** `.env.local` or `.env.production` to git
- ✅ **Use placeholders** in `env.example` for documentation
- ✅ **Validate environment variables** in your code
- ✅ **Use different DSNs** for development and production

## **Verification**

After setting up your environment files:

1. **Start your development server:**
   ```bash
   pnpm dev
   ```

2. **Check the console** for Sentry initialization messages

3. **Test error tracking** by triggering an error in your app

4. **Verify in Sentry dashboard** that errors are being captured

## **Troubleshooting**

### **Sentry not initializing:**
- Check that `VITE_SENTRY_DSN` is set correctly
- Verify the DSN format: `https://key@sentry.io/project_id`
- Ensure you're running in production mode for Sentry to activate

### **Environment variables not loading:**
- Restart your development server after adding new variables
- Check that variable names start with `VITE_`
- Verify the file is named correctly (`.env.local`, not `.env.local.txt`)

### **Build issues:**
- Ensure all required environment variables are set
- Check for typos in variable names
- Verify the build is running in the correct mode
