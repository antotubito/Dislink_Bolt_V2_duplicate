# 🧪 Test Account Creation Guide

This guide provides step-by-step instructions for creating test accounts to access and verify the Dislink application functionality.

## 📧 **Email Configuration**

The application now uses **Gmail SMTP** (dislinkcommunity@gmail.com) to send confirmation emails. This provides reliable email delivery for user registration and account verification.

## 🚀 **Step-by-Step Test Account Creation**

### **Option 1: Local Development Testing**

1. **Access the Application:**
   - **URL**: http://localhost:3001
   - **Registration**: http://localhost:3001/app/register

2. **Enter Early Access Password:**
   - Use one of these passwords: `ITHINKWEMET2025`, `dislink2024`, or `earlyaccess`

3. **Fill Out Registration Form:**
   ```
   First Name: Test
   Last Name: User
   Email: your-email@example.com (or use temporary email)
   Password: TestPassword123!
   Confirm Password: TestPassword123!
   ```

4. **Email Confirmation:**
   - Check your email for the confirmation link
   - The email will be sent from **dislinkcommunity@gmail.com**
   - Click the confirmation link to activate your account
   - You'll be redirected to `/confirmed` page

5. **Complete Registration:**
   - After email confirmation, you'll be redirected to `/app/onboarding`
   - Complete the onboarding process to access the full application

### **Option 2: Production Testing**

1. **Access the Application:**
   - **URL**: https://dislinkboltv2duplicate.netlify.app
   - **Registration**: https://dislinkboltv2duplicate.netlify.app/app/register

2. **Follow the same steps as local testing** (steps 2-5 above)

### **Option 3: Quick Testing with Temporary Email**

For rapid testing without using your personal email:

1. **Get Temporary Email:**
   - Visit: https://temp-mail.org/ or https://10minutemail.com/
   - Copy the temporary email address

2. **Use in Registration:**
   - Use the temporary email in the registration form
   - Check the temporary email inbox for the confirmation link
   - Complete the registration process

## 🔍 **Expected Behavior**

### **Registration Flow:**
1. ✅ **Form Validation**: All fields validated before submission
2. ✅ **Email Sending**: Confirmation email sent via Gmail SMTP
3. ✅ **Email Delivery**: Email arrives from dislinkcommunity@gmail.com
4. ✅ **Confirmation**: Clicking link activates account
5. ✅ **Redirect**: User redirected to onboarding or login

### **Console Logs (Development):**
When testing locally, you should see these console logs:
```
🔍 REGISTRATION: Starting registration process
🔍 REGISTRATION: Registration successful!
✅ REGISTRATION: Gmail SMTP email sent successfully!
```

## 🚨 **Troubleshooting**

### **If No Email Arrives:**
1. **Check Spam Folder**: Gmail emails might be filtered
2. **Wait 1-2 Minutes**: Email delivery can take time
3. **Verify Email Address**: Ensure correct email was entered
4. **Check Console**: Look for error messages in browser console

### **If Registration Fails:**
1. **Check Network**: Ensure stable internet connection
2. **Verify Supabase**: Check if Supabase is accessible
3. **Check Console**: Look for detailed error messages
4. **Try Different Email**: Some email providers may block automated emails

### **If Email Confirmation Link Doesn't Work:**
1. **Check URL**: Ensure link points to correct domain
2. **Try Incognito**: Open link in private/incognito window
3. **Check Expiration**: Links expire after 24 hours
4. **Request New Email**: Use "resend verification" option

## 📋 **Test Account Credentials (Example)**

```
Email: test@example.com
Password: TestPassword123!
```

## 🎯 **What to Test**

After creating a test account, verify these features:

1. **✅ Login/Logout**: Can sign in and out successfully
2. **✅ Profile Management**: Can edit profile information
3. **✅ Contact Management**: Can add and manage contacts
4. **✅ QR Code Generation**: Can generate and share QR codes
5. **✅ Onboarding Flow**: Can complete the onboarding process
6. **✅ Navigation**: All routes and pages load correctly

## 📞 **Support**

If you encounter issues during test account creation:

1. **Check Console Logs**: Look for detailed error messages
2. **Verify Environment**: Ensure all environment variables are set
3. **Test Network**: Verify Supabase connectivity
4. **Check Email Service**: Ensure Gmail SMTP is properly configured

---

**The test account creation process is now streamlined with reliable Gmail SMTP email delivery!** 🎉
