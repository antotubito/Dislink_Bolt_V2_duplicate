# 🗄️ Dislink Database Setup - Complete Guide

This guide provides comprehensive instructions for setting up your Dislink database with full schema validation, RLS policies, and test data insertion.

## 📋 **Overview**

The setup includes:

- ✅ **Schema validation & fixes** - Ensures all required columns and data types
- ✅ **Foreign key relationships** - Proper constraints between tables
- ✅ **RLS policies** - Complete user isolation and security
- ✅ **Test data insertion** - Sample data with proper JSONB/array casting
- ✅ **Verification queries** - Confirms everything works correctly

## 🎯 **Tables Covered**

- `contacts` - User contacts with JSONB and array fields
- `contact_notes` - Notes linked to contacts
- `contact_followups` - Follow-up reminders linked to contacts
- `connection_requests` - Connection requests between users

## 🚀 **Implementation Options**

### **Option 1: TypeScript Function (RECOMMENDED)**

Use the TypeScript implementation from within your Dislink app:

```typescript
import { setupDatabase } from "@dislink/shared/lib/databaseSetup";

// Run the complete setup
const result = await setupDatabase();
if (result.success) {
  console.log("✅ Setup completed!");
  console.log("Contact ID:", result.contactId);
  console.log("Note ID:", result.noteId);
  console.log("Follow-up ID:", result.followupId);
  console.log("Request ID:", result.requestId);
} else {
  console.error("❌ Setup failed:", result.error);
}
```

**Advantages:**

- ✅ Works with authenticated user context (`auth.uid()`)
- ✅ Production-ready error handling
- ✅ Comprehensive logging
- ✅ Returns all inserted IDs
- ✅ Can be called from React components

### **Option 2: SQL Script**

Run the SQL script directly in Supabase SQL Editor:

```sql
-- Copy and paste the contents of dislink_database_setup.sql
-- Run the entire script
```

**Requirements:**

- ⚠️ Must be run with authenticated user context
- ⚠️ May require manual user ID replacement for testing

## 🔧 **Step-by-Step Instructions**

### **Using TypeScript Function (Recommended)**

1. **Ensure user is authenticated:**

   ```typescript
   const {
     data: { user },
   } = await supabase.auth.getUser();
   if (!user) {
     throw new Error("User must be logged in");
   }
   ```

2. **Import and call the function:**

   ```typescript
   import { setupDatabase } from "@dislink/shared/lib/databaseSetup";
   const result = await setupDatabase();
   ```

3. **Handle the result:**
   ```typescript
   if (result.success) {
     // Setup completed successfully
     console.log("All IDs:", {
       contact: result.contactId,
       note: result.noteId,
       followup: result.followupId,
       request: result.requestId,
     });
   } else {
     // Handle error
     console.error("Setup failed:", result.error);
   }
   ```

### **Using SQL Script**

1. **Go to Supabase Dashboard:**

   - Navigate to your project
   - Go to SQL Editor

2. **Copy the SQL script:**

   - Open `dislink_database_setup.sql`
   - Copy all contents

3. **Run the script:**

   - Paste into SQL Editor
   - Click "Run"

4. **Verify results:**
   - Check the output for success messages
   - Review verification queries

## 📊 **What Gets Created**

### **Schema Changes**

- ✅ Foreign key constraints on `contacts.user_id`
- ✅ Missing columns added (`first_met_at`, `first_met_location`, `connection_method`, `metadata`)
- ✅ RLS enabled on all tables

### **RLS Policies**

- ✅ **Contacts**: Users can only manage their own contacts
- ✅ **Notes**: Users can only manage notes for their contacts
- ✅ **Follow-ups**: Users can only manage follow-ups for their contacts
- ✅ **Connection Requests**: Users can view/create requests as sender/recipient

### **Test Data**

- ✅ **Contact**: "Sarah Johnson" with complete profile data
- ✅ **Note**: Detailed conversation notes
- ✅ **Follow-up**: Scheduled reminder for collaboration
- ✅ **Connection Request**: Test request with metadata

## 🔍 **Verification**

The setup includes comprehensive verification:

### **Data Integrity Check**

```sql
SELECT
    (SELECT COUNT(*) FROM contacts WHERE user_id = auth.uid()) as total_contacts,
    (SELECT COUNT(*) FROM contact_notes cn
     JOIN contacts c ON c.id = cn.contact_id
     WHERE c.user_id = auth.uid()) as total_notes,
    (SELECT COUNT(*) FROM contact_followups cf
     JOIN contacts c ON c.id = cf.contact_id
     WHERE c.user_id = auth.uid()) as total_followups,
    (SELECT COUNT(*) FROM connection_requests
     WHERE requester_id = auth.uid()) as total_connection_requests;
```

### **JSONB and Array Validation**

```sql
SELECT
    c.name,
    c.bio->>'location' as bio_location,
    c.social_links->>'linkedin' as linkedin_url,
    c.interests[1] as first_interest,
    c.tags[1] as first_tag
FROM contacts c
WHERE c.user_id = auth.uid()
AND c.name = 'Sarah Johnson';
```

### **RLS Compliance Test**

```sql
SELECT
    COUNT(*) as user_contacts_count
FROM contacts
WHERE user_id = auth.uid();
```

## 🛡️ **Security Features**

### **User Isolation**

- ✅ All data is isolated per user (`auth.uid()`)
- ✅ Users can only access their own data
- ✅ RLS policies enforce strict access control

### **Data Validation**

- ✅ JSONB fields properly cast with `::jsonb`
- ✅ Array fields use PostgreSQL syntax `'{item1,item2}'::text[]`
- ✅ Foreign key constraints maintain data integrity

### **Production Ready**

- ✅ No hardcoded UUIDs in production code
- ✅ Comprehensive error handling
- ✅ Detailed logging for debugging

## 🧹 **Cleanup (Optional)**

To remove test data:

```typescript
import { cleanupTestData } from "@dislink/shared/lib/databaseSetup";

const success = await cleanupTestData();
if (success) {
  console.log("✅ Test data cleaned up");
}
```

## 🚨 **Troubleshooting**

### **Common Issues**

1. **"No authenticated user found"**

   - Ensure user is logged in before running setup
   - Use TypeScript function instead of SQL script

2. **"Foreign key constraint failed"**

   - Check if `auth.users` table exists
   - Verify user ID is valid

3. **"RLS policy violation"**

   - Ensure RLS policies are properly deployed
   - Check user permissions

4. **"JSONB casting error"**
   - Verify JSONB fields are properly formatted
   - Check array syntax for text[] fields

### **Debug Steps**

1. **Check authentication:**

   ```typescript
   const {
     data: { user },
   } = await supabase.auth.getUser();
   console.log("Current user:", user?.id);
   ```

2. **Verify table structure:**

   ```sql
   SELECT column_name, data_type
   FROM information_schema.columns
   WHERE table_name = 'contacts';
   ```

3. **Test RLS policies:**
   ```sql
   SELECT * FROM contacts WHERE user_id = auth.uid();
   ```

## 📝 **Expected Output**

### **Success Response**

```typescript
{
  success: true,
  message: "✅ Database setup completed",
  contactId: "uuid-here",
  noteId: "uuid-here",
  followupId: "uuid-here",
  requestId: "uuid-here"
}
```

### **Error Response**

```typescript
{
  success: false,
  error: "Detailed error message here"
}
```

## 🎉 **Next Steps**

After successful setup:

1. **Verify data in your app** - Check that contacts, notes, and follow-ups appear
2. **Test RLS policies** - Ensure users can only see their own data
3. **Test CRUD operations** - Create, read, update, delete operations
4. **Deploy to production** - Use the same setup process

Your Dislink database is now fully configured and ready for production use! 🚀
