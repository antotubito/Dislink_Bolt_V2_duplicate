# 🚨 QR Code Migration Rollback - Quick Reference

## 🚨 Emergency Rollback (30 seconds)

### If QR codes are broken:
```bash
# Run emergency rollback script
./emergency-rollback.sh
# Select option 1 (Quick rollback)
```

### If database policies are broken:
```sql
-- Run in Supabase SQL editor
\i rollback-qr-migration.sql
```

## 📋 Rollback Files

| File | Purpose |
|------|---------|
| `emergency-rollback.sh` | Interactive rollback script |
| `rollback-qr-migration.sql` | Database policy rollback |
| `backup-current-rls-policies.sql` | Backup current policies |
| `ROLLBACK_GUIDE.md` | Detailed rollback instructions |
| `reversible-qr-migration.sql` | Re-apply migration after fix |

## 🔄 Rollback Methods

### 1. Git Rollback (Fastest)
```bash
git revert HEAD
git push origin main
```

### 2. Database Rollback
```sql
-- In Supabase SQL editor
\i rollback-qr-migration.sql
```

### 3. Emergency RLS Disable
```sql
-- TEMPORARY - NOT FOR PRODUCTION
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE connection_codes DISABLE ROW LEVEL SECURITY;
```

## ✅ Verification Commands

### Check if rollback worked:
```sql
-- Should show original policies
SELECT tablename, policyname, cmd, roles 
FROM pg_policies 
WHERE tablename IN ('profiles', 'connection_codes');
```

### Test QR functionality:
- Valid QR: https://dislinkboltv2duplicate.netlify.app/profile/test-valid-qr-001
- Should require authentication after rollback

## 📞 Emergency Contacts

- **Supabase Dashboard**: Check logs and metrics
- **Netlify Dashboard**: Check build logs
- **GitHub**: Check commit history
- **Sentry**: Check error reports

## 🎯 Success Criteria

After rollback:
- [ ] QR codes require authentication
- [ ] No database errors
- [ ] Application functions normally
- [ ] All tests pass

## 🔄 Recovery Steps

1. **Rollback** (if needed)
2. **Investigate** root cause
3. **Fix** the issues
4. **Test** thoroughly
5. **Re-deploy** with fixes
6. **Monitor** for issues
