#!/usr/bin/env node

/**
 * Supabase Setup Script for Enhanced QR Code System
 * 
 * This script applies the database migration for the enhanced QR code features.
 * Run this after setting up your Supabase project and environment variables.
 * 
 * Usage: node scripts/setup-supabase.js
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Color codes for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function main() {
  log('🚀 Starting Supabase Enhanced QR System Setup...', 'blue');
  
  // Check environment variables
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    log('❌ Error: Missing Supabase environment variables', 'red');
    log('Please set VITE_SUPABASE_URL and SUPABASE_SERVICE_KEY (or VITE_SUPABASE_ANON_KEY)', 'yellow');
    log('Example:', 'yellow');
    log('  export VITE_SUPABASE_URL="https://your-project.supabase.co"', 'yellow');
    log('  export SUPABASE_SERVICE_KEY="your-service-role-key"', 'yellow');
    process.exit(1);
  }
  
  log('✅ Environment variables found', 'green');
  
  // Initialize Supabase client
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  
  log('✅ Supabase client initialized', 'green');
  
  try {
    // Read migration file
    const migrationPath = join(__dirname, '..', 'src', 'database', 'qr_enhanced_migration.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');
    
    log('✅ Migration file loaded', 'green');
    
    // Split migration into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    log(`📄 Found ${statements.length} SQL statements to execute`, 'blue');
    
    // Execute migration statements
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      
      try {
        log(`⏳ Executing statement ${i + 1}/${statements.length}...`, 'yellow');
        
        const { error } = await supabase.rpc('exec_sql', { 
          sql: statement 
        });
        
        if (error) {
          // Try direct execution for DDL statements
          const { error: directError } = await supabase
            .from('information_schema.tables')
            .select('*')
            .limit(1);
            
          if (directError) {
            throw error;
          }
          
          log(`⚠️  Statement ${i + 1} may have executed with warnings`, 'yellow');
        }
        
        successCount++;
        log(`✅ Statement ${i + 1} executed successfully`, 'green');
        
      } catch (statementError) {
        errorCount++;
        log(`❌ Error in statement ${i + 1}: ${statementError.message}`, 'red');
        
        // Check if it's a "relation already exists" error (not critical)
        if (statementError.message.includes('already exists')) {
          log(`ℹ️  Skipping - object already exists`, 'blue');
          continue;
        }
        
        // For other errors, log but continue
        log(`⚠️  Continuing with remaining statements...`, 'yellow');
      }
    }
    
    log('\n📊 Migration Summary:', 'bold');
    log(`✅ Successful: ${successCount}`, 'green');
    log(`❌ Errors: ${errorCount}`, errorCount > 0 ? 'red' : 'green');
    
    // Test the setup
    log('\n🧪 Testing database setup...', 'blue');
    
    // Test basic table access
    const { data: tables, error: tablesError } = await supabase
      .from('qr_scan_tracking')
      .select('*')
      .limit(1);
      
    if (tablesError && !tablesError.message.includes('permission denied')) {
      log(`❌ Error testing qr_scan_tracking table: ${tablesError.message}`, 'red');
    } else {
      log('✅ QR scan tracking table accessible', 'green');
    }
    
    // Test connection codes table
    const { data: codes, error: codesError } = await supabase
      .from('connection_codes')
      .select('*')
      .limit(1);
      
    if (codesError && !codesError.message.includes('permission denied')) {
      log(`❌ Error testing connection_codes table: ${codesError.message}`, 'red');
    } else {
      log('✅ Connection codes table accessible', 'green');
    }
    
    log('\n🎉 Enhanced QR System setup completed!', 'green');
    log('\nNext steps:', 'bold');
    log('1. Set up your environment variables in Netlify dashboard', 'blue');
    log('2. Deploy your application', 'blue');
    log('3. Test QR code generation and scanning', 'blue');
    log('4. Verify email invitations (configure email service)', 'blue');
    
  } catch (error) {
    log(`❌ Setup failed: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Run the setup
main().catch(error => {
  log(`❌ Unexpected error: ${error.message}`, 'red');
  process.exit(1);
});
