#!/usr/bin/env node

// 🚀 DATABASE VALIDATION AND SETUP SCRIPT
// Validates and creates all required database tables for production

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://bbonxxvifycwpoeaxsor.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Required tables with their expected structure
const REQUIRED_TABLES = {
  profiles: {
    columns: ['id', 'email', 'name', 'profile_image', 'created_at', 'updated_at'],
    required: true
  },
  contacts: {
    columns: ['id', 'user_id', 'name', 'email', 'phone', 'job_title', 'company', 'profile_image', 'cover_image', 'bio', 'interests', 'social_links', 'meeting_date', 'meeting_location', 'meeting_context', 'tags', 'tier', 'first_met_at', 'first_met_location', 'connection_method', 'created_at', 'updated_at'],
    required: true
  },
  contact_notes: {
    columns: ['id', 'contact_id', 'content', 'created_at', 'updated_at'],
    required: true
  },
  contact_followups: {
    columns: ['id', 'contact_id', 'description', 'due_date', 'completed', 'created_at', 'updated_at'],
    required: true
  },
  connection_codes: {
    columns: ['id', 'user_id', 'code', 'is_active', 'expires_at', 'scan_count', 'last_scanned_at', 'last_scan_location', 'created_at', 'updated_at'],
    required: true
  },
  connection_requests: {
    columns: ['id', 'requester_id', 'target_user_id', 'status', 'metadata', 'created_at', 'updated_at'],
    required: true
  },
  qr_scan_tracking: {
    columns: ['id', 'scan_id', 'code', 'scanned_at', 'location', 'device_info', 'referrer', 'session_id', 'created_at'],
    required: true
  },
  email_invitations: {
    columns: ['id', 'invitation_id', 'recipient_email', 'sender_user_id', 'connection_code', 'scan_data', 'email_sent_at', 'expires_at', 'status', 'registered_user_id', 'registration_completed_at', 'created_at', 'updated_at'],
    required: true
  },
  connection_memories: {
    columns: ['id', 'from_user_id', 'to_user_id', 'first_meeting_data', 'connection_status', 'email_invitation_sent', 'registration_completed_at', 'created_at', 'updated_at'],
    required: true
  },
  notifications: {
    columns: ['id', 'user_id', 'type', 'title', 'message', 'data', 'read', 'created_at', 'updated_at'],
    required: true
  },
  needs: {
    columns: ['id', 'user_id', 'category', 'category_label', 'message', 'tags', 'visibility', 'expires_at', 'is_satisfied', 'created_at', 'updated_at'],
    required: false
  },
  need_replies: {
    columns: ['id', 'need_id', 'user_id', 'message', 'reply_to_user_id', 'created_at', 'updated_at'],
    required: false
  }
};

async function checkTableExists(tableName) {
  try {
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', tableName);
    
    return !error && data && data.length > 0;
  } catch (error) {
    console.error(`❌ Error checking table ${tableName}:`, error.message);
    return false;
  }
}

async function getTableColumns(tableName) {
  try {
    const { data, error } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_schema', 'public')
      .eq('table_name', tableName);
    
    if (error) {
      console.error(`❌ Error getting columns for ${tableName}:`, error.message);
      return [];
    }
    
    return data.map(row => row.column_name);
  } catch (error) {
    console.error(`❌ Error getting columns for ${tableName}:`, error.message);
    return [];
  }
}

async function checkRLSEnabled(tableName) {
  try {
    const { data, error } = await supabase.rpc('check_rls_enabled', { table_name: tableName });
    return !error && data;
  } catch (error) {
    // RLS check function might not exist, that's okay
    return null;
  }
}

async function validateDatabase() {
  console.log('🔍 Starting database validation...\n');
  
  const results = {
    tables: [],
    missing: [],
    issues: [],
    totalTables: Object.keys(REQUIRED_TABLES).length,
    validTables: 0,
    rlsEnabled: 0
  };
  
  for (const [tableName, config] of Object.entries(REQUIRED_TABLES)) {
    console.log(`📋 Checking table: ${tableName}`);
    
    const tableExists = await checkTableExists(tableName);
    
    if (!tableExists) {
      if (config.required) {
        console.log(`❌ MISSING: ${tableName} (required)`);
        results.missing.push(tableName);
      } else {
        console.log(`⚠️  MISSING: ${tableName} (optional)`);
      }
      continue;
    }
    
    console.log(`✅ EXISTS: ${tableName}`);
    
    // Check columns
    const actualColumns = await getTableColumns(tableName);
    const missingColumns = config.columns.filter(col => !actualColumns.includes(col));
    
    if (missingColumns.length > 0) {
      console.log(`⚠️  Missing columns in ${tableName}: ${missingColumns.join(', ')}`);
      results.issues.push(`${tableName}: missing columns ${missingColumns.join(', ')}`);
    } else {
      console.log(`✅ All required columns present in ${tableName}`);
    }
    
    // Check RLS
    const rlsEnabled = await checkRLSEnabled(tableName);
    if (rlsEnabled === true) {
      console.log(`🔒 RLS enabled on ${tableName}`);
      results.rlsEnabled++;
    } else if (rlsEnabled === false) {
      console.log(`⚠️  RLS not enabled on ${tableName}`);
      results.issues.push(`${tableName}: RLS not enabled`);
    }
    
    results.tables.push({
      name: tableName,
      exists: true,
      columns: actualColumns.length,
      expectedColumns: config.columns.length,
      rlsEnabled: rlsEnabled
    });
    
    results.validTables++;
    console.log('');
  }
  
  return results;
}

async function runMigrations() {
  console.log('🚀 Running database migrations...\n');
  
  const migrationFiles = [
    'qr_enhanced_migration.sql',
    'rls_policies.sql'
  ];
  
  for (const file of migrationFiles) {
    const filePath = path.join(__dirname, '..', 'src', 'database', file);
    
    if (fs.existsSync(filePath)) {
      console.log(`📄 Running migration: ${file}`);
      
      try {
        const sql = fs.readFileSync(filePath, 'utf8');
        
        // Split by semicolons and execute each statement
        const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);
        
        for (const statement of statements) {
          if (statement.trim()) {
            const { error } = await supabase.rpc('exec_sql', { sql_query: statement.trim() });
            if (error && !error.message.includes('already exists')) {
              console.error(`❌ Error in statement: ${error.message}`);
            }
          }
        }
        
        console.log(`✅ Migration completed: ${file}`);
      } catch (error) {
        console.error(`❌ Error running migration ${file}:`, error.message);
      }
    } else {
      console.log(`⚠️  Migration file not found: ${file}`);
    }
  }
}

async function createMissingTables() {
  console.log('🔧 Creating missing core tables...\n');
  
  // Core tables that are absolutely required
  const coreTableQueries = {
    contact_notes: `
      CREATE TABLE IF NOT EXISTS contact_notes (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `,
    contact_followups: `
      CREATE TABLE IF NOT EXISTS contact_followups (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
        description TEXT NOT NULL,
        due_date TIMESTAMPTZ NOT NULL,
        completed BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `,
    needs: `
      CREATE TABLE IF NOT EXISTS needs (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        category TEXT NOT NULL,
        category_label TEXT NOT NULL,
        message TEXT NOT NULL,
        tags TEXT[] DEFAULT '{}',
        visibility TEXT NOT NULL DEFAULT 'open' CHECK (visibility IN ('open', 'private')),
        expires_at TIMESTAMPTZ NOT NULL,
        is_satisfied BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `,
    need_replies: `
      CREATE TABLE IF NOT EXISTS need_replies (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        need_id UUID NOT NULL REFERENCES needs(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        message TEXT NOT NULL,
        reply_to_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `
  };
  
  for (const [tableName, query] of Object.entries(coreTableQueries)) {
    try {
      console.log(`📝 Creating table: ${tableName}`);
      const { error } = await supabase.rpc('exec_sql', { sql_query: query });
      
      if (error && !error.message.includes('already exists')) {
        console.error(`❌ Error creating ${tableName}:`, error.message);
      } else {
        console.log(`✅ Table created/verified: ${tableName}`);
      }
    } catch (error) {
      console.error(`❌ Error creating ${tableName}:`, error.message);
    }
  }
}

function printReport(results) {
  console.log('\n📊 DATABASE VALIDATION REPORT');
  console.log('=' .repeat(50));
  console.log(`📋 Total tables checked: ${results.totalTables}`);
  console.log(`✅ Valid tables: ${results.validTables}`);
  console.log(`❌ Missing tables: ${results.missing.length}`);
  console.log(`⚠️  Issues found: ${results.issues.length}`);
  console.log(`🔒 Tables with RLS: ${results.rlsEnabled}`);
  
  if (results.missing.length > 0) {
    console.log('\n❌ MISSING TABLES:');
    results.missing.forEach(table => console.log(`  - ${table}`));
  }
  
  if (results.issues.length > 0) {
    console.log('\n⚠️  ISSUES FOUND:');
    results.issues.forEach(issue => console.log(`  - ${issue}`));
  }
  
  console.log('\n📋 TABLE STATUS:');
  results.tables.forEach(table => {
    console.log(`  ${table.name}: ${table.columns}/${table.expectedColumns} columns${table.rlsEnabled ? ' [RLS]' : ''}`);
  });
  
  const score = Math.round((results.validTables / results.totalTables) * 100);
  console.log(`\n🎯 Database Health Score: ${score}%`);
  
  if (score >= 90) {
    console.log('🎉 Excellent! Database is production-ready.');
  } else if (score >= 70) {
    console.log('⚠️  Good, but some improvements needed.');
  } else {
    console.log('❌ Critical issues found. Database needs attention.');
  }
}

// Main execution
async function main() {
  try {
    console.log('🚀 DISLINK DATABASE VALIDATOR\n');
    
    // Test connection
    const { data: connectionTest, error: connectionError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (connectionError && !connectionError.message.includes('relation "profiles" does not exist')) {
      console.error('❌ Database connection failed:', connectionError.message);
      process.exit(1);
    }
    
    console.log('✅ Database connection successful\n');
    
    // Run validation
    const results = await validateDatabase();
    
    // Create missing core tables if needed
    if (results.missing.length > 0) {
      await createMissingTables();
    }
    
    // Run migrations if needed
    if (results.issues.length > 0 || results.missing.length > 0) {
      await runMigrations();
    }
    
    // Final validation
    console.log('\n🔄 Running final validation...\n');
    const finalResults = await validateDatabase();
    
    printReport(finalResults);
    
    // Exit with appropriate code
    const finalScore = Math.round((finalResults.validTables / finalResults.totalTables) * 100);
    process.exit(finalScore >= 90 ? 0 : 1);
    
  } catch (error) {
    console.error('❌ Validation failed:', error.message);
    process.exit(1);
  }
}

main();
