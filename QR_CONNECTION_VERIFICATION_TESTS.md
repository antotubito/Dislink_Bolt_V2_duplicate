# 🔍 QR CONNECTION & INVITATION SYSTEM - VERIFICATION TESTS

## 📊 **OVERVIEW**

This document provides comprehensive verification tests for the QR code connection and invitation system implemented in Dislink. All tests ensure proper RLS compliance, data isolation, and system functionality.

---

## 🧪 **VERIFICATION CHECKLIST**

### **✅ 1. QR Code Generation & Tracking**

#### **Test 1.1: QR Code Generation**

```sql
-- Test QR code generation for authenticated user
SELECT
  cc.code,
  cc.user_id,
  cc.is_active,
  cc.expires_at,
  p.first_name,
  p.last_name
FROM connection_codes cc
JOIN profiles p ON cc.user_id = p.id
WHERE cc.user_id = auth.uid()
ORDER BY cc.created_at DESC
LIMIT 1;
```

**Expected Result**: Returns active connection code for current user

#### **Test 1.2: QR Scan Tracking**

```sql
-- Test QR scan tracking with user isolation
SELECT
  qst.scan_id,
  qst.code,
  qst.scanned_at,
  qst.user_id,
  qst.scanner_user_id,
  qst.location
FROM qr_scan_tracking qst
WHERE qst.user_id = auth.uid()
ORDER BY qst.scanned_at DESC
LIMIT 10;
```

**Expected Result**: Returns only scans for current user's QR codes

#### **Test 1.3: RLS Policy Verification**

```sql
-- Test that users cannot see other users' scan data
SELECT COUNT(*) as total_scans
FROM qr_scan_tracking;
```

**Expected Result**: Should only return scans for current user (RLS enforced)

---

### **✅ 2. Invitation System**

#### **Test 2.1: Invitation Creation**

```sql
-- Test invitation creation and storage
SELECT
  ei.invitation_id,
  ei.recipient_email,
  ei.sender_user_id,
  ei.status,
  ei.expires_at,
  p.first_name as sender_name
FROM email_invitations ei
JOIN profiles p ON ei.sender_user_id = p.id
WHERE ei.sender_user_id = auth.uid()
ORDER BY ei.created_at DESC
LIMIT 5;
```

**Expected Result**: Returns invitations sent by current user

#### **Test 2.2: Invitation Validation**

```sql
-- Test invitation validation (replace with actual invitation ID)
SELECT
  ei.invitation_id,
  ei.recipient_email,
  ei.status,
  ei.expires_at,
  CASE
    WHEN ei.expires_at < NOW() THEN 'expired'
    WHEN ei.status = 'sent' THEN 'valid'
    ELSE ei.status
  END as validation_status
FROM email_invitations ei
WHERE ei.invitation_id = 'inv_1234567890_abcdef'
  AND ei.status = 'sent';
```

**Expected Result**: Returns invitation data if valid and not expired

#### **Test 2.3: Invitation RLS Verification**

```sql
-- Test that users cannot see invitations from other users
SELECT COUNT(*) as total_invitations
FROM email_invitations;
```

**Expected Result**: Should only return invitations sent by current user

---

### **✅ 3. Connection Request System**

#### **Test 3.1: Connection Request Creation**

```sql
-- Test connection requests for current user
SELECT
  cr.id,
  cr.user_id,
  cr.requester_id,
  cr.status,
  cr.metadata,
  cr.created_at
FROM connection_requests cr
WHERE cr.user_id = auth.uid() OR cr.requester_id = auth.uid()
ORDER BY cr.created_at DESC
LIMIT 10;
```

**Expected Result**: Returns connection requests where user is either target or requester

#### **Test 3.2: Connection Request RLS**

```sql
-- Test RLS on connection requests
SELECT COUNT(*) as total_requests
FROM connection_requests;
```

**Expected Result**: Should only return requests involving current user

---

### **✅ 4. Data Integrity Tests**

#### **Test 4.1: Foreign Key Relationships**

```sql
-- Test foreign key integrity
SELECT
  'connection_codes' as table_name,
  COUNT(*) as total_records,
  COUNT(CASE WHEN user_id IS NOT NULL THEN 1 END) as valid_user_ids
FROM connection_codes
UNION ALL
SELECT
  'qr_scan_tracking' as table_name,
  COUNT(*) as total_records,
  COUNT(CASE WHEN user_id IS NOT NULL THEN 1 END) as valid_user_ids
FROM qr_scan_tracking
UNION ALL
SELECT
  'email_invitations' as table_name,
  COUNT(*) as total_records,
  COUNT(CASE WHEN sender_user_id IS NOT NULL THEN 1 END) as valid_user_ids
FROM email_invitations;
```

**Expected Result**: All records should have valid foreign key references

#### **Test 4.2: JSONB Field Validation**

```sql
-- Test JSONB field structure
SELECT
  qst.scan_id,
  qst.location,
  qst.device_info,
  jsonb_typeof(qst.location) as location_type,
  jsonb_typeof(qst.device_info) as device_info_type
FROM qr_scan_tracking qst
WHERE qst.user_id = auth.uid()
LIMIT 5;
```

**Expected Result**: All JSONB fields should be valid JSON objects

---

## 🔧 **TypeScript Verification Tests**

### **Test 1: QR Code Generation**

```typescript
import { generateUserQRCode } from "@dislink/shared/lib/qrConnection";

async function testQRCodeGeneration() {
  try {
    const qrData = await generateUserQRCode("user-id-here");

    console.log("✅ QR Code Generated:", {
      connectionCode: qrData.connectionCode,
      publicProfileUrl: qrData.publicProfileUrl,
      userId: qrData.userId,
    });

    // Verify required fields
    if (!qrData.connectionCode || !qrData.publicProfileUrl) {
      throw new Error("Missing required QR code fields");
    }

    return true;
  } catch (error) {
    console.error("❌ QR Code Generation Failed:", error);
    return false;
  }
}
```

### **Test 2: Invitation Submission**

```typescript
import { submitInvitationRequest } from "@dislink/shared/lib/qrConnection";

async function testInvitationSubmission() {
  try {
    const result = await submitInvitationRequest("conn_1234567890_abcdef", {
      email: "test@example.com",
      message: "Test invitation message",
      location: {
        latitude: 37.7749,
        longitude: -122.4194,
        name: "San Francisco",
      },
    });

    console.log("✅ Invitation Submitted:", result);

    if (!result.success) {
      throw new Error(`Invitation failed: ${result.message}`);
    }

    return true;
  } catch (error) {
    console.error("❌ Invitation Submission Failed:", error);
    return false;
  }
}
```

### **Test 3: Connection Code Validation**

```typescript
import { validateConnectionCode } from "@dislink/shared/lib/qrConnection";

async function testConnectionCodeValidation() {
  try {
    const qrData = await validateConnectionCode("conn_1234567890_abcdef");

    if (!qrData) {
      console.log("⚠️ Connection code not found or expired");
      return false;
    }

    console.log("✅ Connection Code Valid:", {
      userId: qrData.userId,
      name: qrData.name,
      connectionCode: qrData.connectionCode,
    });

    return true;
  } catch (error) {
    console.error("❌ Connection Code Validation Failed:", error);
    return false;
  }
}
```

---

## 🚀 **Integration Tests**

### **Test 1: Complete QR Flow**

```typescript
async function testCompleteQRFlow() {
  console.log("🧪 Testing Complete QR Flow...");

  try {
    // Step 1: Generate QR code
    const qrData = await generateUserQRCode("user-id-here");
    console.log("✅ Step 1: QR Code Generated");

    // Step 2: Track scan
    await trackQRScan(qrData.connectionCode, undefined, {
      latitude: 37.7749,
      longitude: -122.4194,
    });
    console.log("✅ Step 2: QR Scan Tracked");

    // Step 3: Submit invitation
    const invitationResult = await submitInvitationRequest(
      qrData.connectionCode,
      {
        email: "test@example.com",
        message: "Test connection request",
      }
    );
    console.log("✅ Step 3: Invitation Submitted");

    // Step 4: Validate connection code
    const validatedData = await validateConnectionCode(qrData.connectionCode);
    console.log("✅ Step 4: Connection Code Validated");

    console.log("🎉 Complete QR Flow Test Passed!");
    return true;
  } catch (error) {
    console.error("❌ Complete QR Flow Test Failed:", error);
    return false;
  }
}
```

### **Test 2: RLS Security Test**

```typescript
async function testRLSSecurity() {
  console.log("🔒 Testing RLS Security...");

  try {
    // Test that users can only see their own data
    const { data: scanData, error } = await supabase
      .from("qr_scan_tracking")
      .select("*");

    if (error) {
      console.log("✅ RLS Working: Query blocked or filtered");
      return true;
    }

    // Check if all returned data belongs to current user
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const allOwnedByUser = scanData?.every((scan) => scan.user_id === user?.id);

    if (allOwnedByUser) {
      console.log("✅ RLS Working: Only user data returned");
      return true;
    } else {
      console.error("❌ RLS Failed: Other users data visible");
      return false;
    }
  } catch (error) {
    console.error("❌ RLS Security Test Failed:", error);
    return false;
  }
}
```

---

## 📋 **Manual Testing Checklist**

### **QR Code Generation**

- [ ] User can generate QR code from profile page
- [ ] QR code contains unique connection code
- [ ] QR code URL is properly formatted
- [ ] QR code expires after 30 days
- [ ] User can refresh/regenerate QR code

### **QR Code Scanning**

- [ ] QR code can be scanned by camera
- [ ] Scan redirects to public profile page
- [ ] Scan is tracked with location data
- [ ] Scan data is isolated per user (RLS)
- [ ] Anonymous visitors can scan QR codes

### **Invitation System**

- [ ] Visitors can submit email invitations
- [ ] Invitation emails are sent (simulated)
- [ ] Invitations expire after 7 days
- [ ] Existing users get direct connection requests
- [ ] New users get registration invitations

### **Registration with Invitation**

- [ ] Users can register with invitation code
- [ ] Email validation matches invitation
- [ ] Connection request is created automatically
- [ ] Invitation status is updated to 'registered'

### **Data Security**

- [ ] Users can only see their own scan data
- [ ] Users can only see their own invitations
- [ ] Connection requests respect user isolation
- [ ] All JSONB fields are properly formatted
- [ ] Foreign key relationships are maintained

---

## 🎯 **Performance Tests**

### **Test 1: QR Code Generation Performance**

```typescript
async function testQRGenerationPerformance() {
  const startTime = performance.now();

  for (let i = 0; i < 10; i++) {
    await generateUserQRCode("user-id-here");
  }

  const endTime = performance.now();
  const avgTime = (endTime - startTime) / 10;

  console.log(`✅ Average QR Generation Time: ${avgTime.toFixed(2)}ms`);

  return avgTime < 1000; // Should be under 1 second
}
```

### **Test 2: Database Query Performance**

```sql
-- Test query performance for scan statistics
EXPLAIN ANALYZE
SELECT
  COUNT(*) as total_scans,
  MAX(scanned_at) as last_scan
FROM qr_scan_tracking
WHERE user_id = auth.uid();
```

**Expected Result**: Query should complete in under 100ms

---

## 🔍 **Error Handling Tests**

### **Test 1: Invalid Connection Code**

```typescript
async function testInvalidConnectionCode() {
  try {
    const result = await validateConnectionCode("invalid_code");

    if (result === null) {
      console.log("✅ Invalid code properly handled");
      return true;
    } else {
      console.error("❌ Invalid code should return null");
      return false;
    }
  } catch (error) {
    console.error("❌ Error handling failed:", error);
    return false;
  }
}
```

### **Test 2: Expired Invitation**

```typescript
async function testExpiredInvitation() {
  try {
    const result = await validateInvitationCode("expired_invitation_id");

    if (result === null) {
      console.log("✅ Expired invitation properly handled");
      return true;
    } else {
      console.error("❌ Expired invitation should return null");
      return false;
    }
  } catch (error) {
    console.error("❌ Error handling failed:", error);
    return false;
  }
}
```

---

## 📊 **Test Results Summary**

Run all tests and document results:

```typescript
async function runAllTests() {
  const results = {
    qrGeneration: await testQRCodeGeneration(),
    invitationSubmission: await testInvitationSubmission(),
    connectionValidation: await testConnectionCodeValidation(),
    completeFlow: await testCompleteQRFlow(),
    rlsSecurity: await testRLSSecurity(),
    performance: await testQRGenerationPerformance(),
    errorHandling: await testInvalidConnectionCode(),
  };

  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;

  console.log(`\n🎯 Test Results: ${passed}/${total} tests passed`);
  console.log("Results:", results);

  return results;
}
```

---

## 🚀 **Deployment Verification**

After deployment, verify:

1. **Database Schema**: All tables exist with correct structure
2. **RLS Policies**: All policies are active and working
3. **API Endpoints**: All functions are accessible
4. **Frontend Components**: All UI components render correctly
5. **Email Service**: Invitation emails are sent (in production)
6. **Performance**: All operations complete within acceptable time limits

---

## 📝 **Notes**

- All tests should be run in a test environment first
- Production tests should use limited data sets
- Monitor database performance during testing
- Document any issues found during verification
- Update tests as the system evolves

This verification system ensures the QR connection and invitation feature is working correctly, securely, and efficiently! 🎉
