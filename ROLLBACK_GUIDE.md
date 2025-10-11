# 🔄 QR Code Migration Rollback Guide

## Overview
This guide provides step-by-step instructions for rolling back the QR code RLS policy changes if issues arise after deployment.

## 🚨 When to Rollback
Rollback if you experience:
- QR codes not working (404 errors)
- Public profiles not displaying
- Authentication errors in QR flow
- Database permission errors
- Any critical functionality broken

## 📋 Pre-Rollback Checklist

### 1. Verify the Issue
```sql
-- Check if QR codes are working
SELECT 
    cc.code,
    cc.is_active,
    cc.expires_at,
    p.public_profile->>'enabled' as public_enabled
FROM connection_codes cc
JOIN profiles p ON cc.user_id = p.id
WHERE cc.code LIKE 'test-%'
LIMIT 5;
```

### 2. Check Current Policies
```sql
-- View current RLS policies
SELECT 
    tablename,
    policyname,
    cmd,
    roles,
    qual
FROM pg_policies 
WHERE tablename IN ('profiles', 'connection_codes')
ORDER BY tablename, policyname;
```

## 🔄 Rollback Procedure

### Step 1: Backup Current State
```sql
-- Run backup script first
\i backup-current-rls-policies.sql
```

### Step 2: Execute Rollback
```sql
-- Run the rollback script
\i rollback-qr-migration.sql
```

### Step 3: Verify Rollback
```sql
-- Check that policies have been reverted
SELECT 
    'ROLLBACK VERIFICATION' as status,
    tablename,
    policyname,
    cmd,
    roles
FROM pg_policies 
WHERE tablename IN ('profiles', 'connection_codes')
ORDER BY tablename, policyname;
```

### Step 4: Test QR Functionality
1. **Test Valid QR**: https://dislinkboltv2duplicate.netlify.app/profile/test-valid-qr-001
2. **Test Expired QR**: https://dislinkboltv2duplicate.netlify.app/profile/test-expired-qr-001
3. **Test Private QR**: https://dislinkboltv2duplicate.netlify.app/profile/test-private-qr-001

## 🔧 Alternative Rollback Methods

### Method 1: Revert Git Commit
```bash
# If rollback is needed immediately
git revert <commit-hash>
git push origin main
```

### Method 2: Manual Policy Restoration
```sql
-- If automated rollback fails, restore manually
DROP POLICY IF EXISTS "Allow anonymous public profile reads" ON profiles;
DROP POLICY IF EXISTS "Allow anonymous connection code reads" ON connection_codes;

-- Restore original policies
CREATE POLICY "profiles_select_policy" ON profiles
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "connection_codes_select_policy" ON connection_codes
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);
```

### Method 3: Disable RLS Temporarily
```sql
-- Emergency: Disable RLS temporarily (NOT RECOMMENDED for production)
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE connection_codes DISABLE ROW LEVEL SECURITY;
```

## 📊 Rollback Verification

### 1. Check Policy Status
```sql
SELECT 
    tablename,
    rowsecurity as rls_enabled,
    COUNT(*) as policy_count
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename
WHERE t.tablename IN ('profiles', 'connection_codes')
GROUP BY t.tablename, t.rowsecurity
ORDER BY t.tablename;
```

### 2. Test QR Code Access
```sql
-- Test anonymous access (should fail after rollback)
SELECT 
    cc.code,
    p.first_name,
    p.last_name
FROM connection_codes cc
JOIN profiles p ON cc.user_id = p.id
WHERE cc.code = 'test-valid-qr-001';
```

### 3. Verify Authentication Required
- QR codes should now require authentication
- Public profiles should not be accessible anonymously
- Only authenticated users should access connection codes

## 🚀 Re-apply Migration (After Fixing Issues)

If you need to re-apply the migration after fixing issues:

### 1. Re-run Migration
```sql
-- Re-apply the original migration
\i fix_connection_codes_rls.sql
```

### 2. Verify Migration
```sql
-- Check that policies are correctly applied
SELECT 
    tablename,
    policyname,
    cmd,
    roles
FROM pg_policies 
WHERE tablename IN ('profiles', 'connection_codes')
ORDER BY tablename, policyname;
```

## 📞 Emergency Contacts

### Database Issues
- **Supabase Dashboard**: Check logs and metrics
- **SQL Editor**: Run verification queries
- **Support**: Contact Supabase support if needed

### Application Issues
- **Netlify Dashboard**: Check build logs and functions
- **GitHub**: Check commit history and issues
- **Monitoring**: Check Sentry for error reports

## 📝 Rollback Log Template

When performing a rollback, document:

```
Rollback Date: [DATE]
Rollback Reason: [REASON]
Rollback Method: [METHOD USED]
Rollback Duration: [TIME TAKEN]
Issues Found: [LIST OF ISSUES]
Resolution: [HOW ISSUES WERE RESOLVED]
Prevention: [STEPS TO PREVENT FUTURE ISSUES]
```

## ✅ Post-Rollback Checklist

- [ ] QR codes require authentication (expected behavior)
- [ ] Public profiles not accessible anonymously
- [ ] No database errors in logs
- [ ] Application functions normally
- [ ] All tests pass
- [ ] Documentation updated
- [ ] Team notified of rollback

## 🔄 Recovery Plan

After rollback:
1. **Investigate**: Identify root cause of issues
2. **Fix**: Address the underlying problems
3. **Test**: Thoroughly test fixes
4. **Re-deploy**: Apply corrected migration
5. **Monitor**: Watch for any new issues
6. **Document**: Update procedures based on learnings
