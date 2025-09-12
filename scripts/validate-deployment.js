#!/usr/bin/env node

/**
 * Deployment Validation Script
 * 
 * Validates that all components are ready for deployment including:
 * - Environment variables
 * - Build output
 * - Route configuration
 * - QR system components
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

function checkFile(filePath, description) {
  const exists = existsSync(filePath);
  if (exists) {
    log(`✅ ${description}`, 'green');
    return true;
  } else {
    log(`❌ ${description} - File not found: ${filePath}`, 'red');
    return false;
  }
}

function validateEnvironmentConfig() {
  log('\n🔧 Validating Environment Configuration...', 'blue');
  
  let score = 0;
  const total = 4;
  
  // Check environment.ts
  const envConfigPath = join(__dirname, '..', 'src', 'config', 'environment.ts');
  if (checkFile(envConfigPath, 'Environment configuration')) {
    score++;
    
    const envConfig = readFileSync(envConfigPath, 'utf8');
    if (envConfig.includes('VITE_SUPABASE_URL') && envConfig.includes('VITE_SUPABASE_ANON_KEY')) {
      log('✅ Supabase environment variables configured', 'green');
      score++;
    } else {
      log('❌ Supabase environment variables not properly configured', 'red');
    }
  }
  
  // Check env.example
  const envExamplePath = join(__dirname, '..', 'env.example');
  if (checkFile(envExamplePath, 'Environment example file')) {
    score++;
  }
  
  // Check netlify.toml
  const netlifyConfigPath = join(__dirname, '..', 'netlify.toml');
  if (checkFile(netlifyConfigPath, 'Netlify configuration')) {
    score++;
  }
  
  return score === total;
}

function validateQRSystem() {
  log('\n🔍 Validating QR Code System...', 'blue');
  
  let score = 0;
  const total = 8;
  
  const qrFiles = [
    ['src/lib/qrEnhanced.ts', 'Enhanced QR library'],
    ['src/lib/qrConnectionHandler.ts', 'QR connection handler'],
    ['src/components/qr/QRScanner.tsx', 'QR scanner component'],
    ['src/components/qr/QRCode.tsx', 'QR code component'],
    ['src/components/qr/QRModal.tsx', 'QR modal component'],
    ['src/components/qr/QRFlowTester.tsx', 'QR flow tester'],
    ['src/database/qr_enhanced_migration.sql', 'Database migration'],
    ['scripts/setup-supabase.js', 'Supabase setup script']
  ];
  
  qrFiles.forEach(([path, description]) => {
    const fullPath = join(__dirname, '..', path);
    if (checkFile(fullPath, description)) {
      score++;
    }
  });
  
  return score === total;
}

function validateRoutes() {
  log('\n🛣️  Validating Route Configuration...', 'blue');
  
  let score = 0;
  const total = 3;
  
  // Check App.tsx for route definitions
  const appPath = join(__dirname, '..', 'src', 'App.tsx');
  if (checkFile(appPath, 'Main app component')) {
    const appContent = readFileSync(appPath, 'utf8');
    
    if (appContent.includes('path="/share/:code"')) {
      log('✅ Public profile route configured', 'green');
      score++;
    } else {
      log('❌ Public profile route not found', 'red');
    }
    
    if (appContent.includes('path="/confirmed"')) {
      log('✅ Email confirmation route configured', 'green');
      score++;
    } else {
      log('❌ Email confirmation route not found', 'red');
    }
    
    if (appContent.includes('path="/app/register"')) {
      log('✅ Registration route configured', 'green');
      score++;
    } else {
      log('❌ Registration route not found', 'red');
    }
  }
  
  return score === total;
}

function validateWaitlist() {
  log('\n📋 Validating Waitlist Functionality...', 'blue');
  
  let score = 0;
  const total = 3;
  
  const waitlistFiles = [
    ['src/pages/Waitlist.tsx', 'Waitlist page'],
    ['src/components/waitlist/WaitlistForm.tsx', 'Waitlist form component'],
    ['waitlist.html', 'Static waitlist page']
  ];
  
  waitlistFiles.forEach(([path, description]) => {
    const fullPath = join(__dirname, '..', path);
    if (checkFile(fullPath, description)) {
      score++;
    }
  });
  
  return score === total;
}

function validateBuildOutput() {
  log('\n📦 Validating Build Output...', 'blue');
  
  let score = 0;
  const total = 3;
  
  const buildFiles = [
    ['dist/index.html', 'Main HTML file'],
    ['dist/assets', 'Assets directory'],
    ['package.json', 'Package configuration']
  ];
  
  buildFiles.forEach(([path, description]) => {
    const fullPath = join(__dirname, '..', path);
    if (existsSync(fullPath)) {
      log(`✅ ${description}`, 'green');
      score++;
    } else {
      log(`⚠️  ${description} not found (run 'npm run build' first)`, 'yellow');
    }
  });
  
  return score >= 1; // At least package.json should exist
}

function validateSupabaseIntegration() {
  log('\n🗄️  Validating Supabase Integration...', 'blue');
  
  let score = 0;
  const total = 4;
  
  const supabaseFiles = [
    ['src/lib/supabase.ts', 'Supabase client'],
    ['src/lib/auth.ts', 'Authentication library'],
    ['src/components/auth/AuthProvider.tsx', 'Auth provider'],
    ['src/components/auth/ProtectedRoute.tsx', 'Protected route component']
  ];
  
  supabaseFiles.forEach(([path, description]) => {
    const fullPath = join(__dirname, '..', path);
    if (checkFile(fullPath, description)) {
      score++;
    }
  });
  
  return score === total;
}

function generateDeploymentReport(results) {
  log('\n📊 Deployment Validation Report', 'bold');
  log('================================', 'bold');
  
  const categories = [
    ['Environment Configuration', results.environment],
    ['QR Code System', results.qrSystem],
    ['Route Configuration', results.routes],
    ['Waitlist Functionality', results.waitlist],
    ['Build Output', results.buildOutput],
    ['Supabase Integration', results.supabase]
  ];
  
  let totalScore = 0;
  let maxScore = categories.length;
  
  categories.forEach(([category, passed]) => {
    if (passed) {
      log(`✅ ${category}`, 'green');
      totalScore++;
    } else {
      log(`❌ ${category}`, 'red');
    }
  });
  
  const percentage = Math.round((totalScore / maxScore) * 100);
  
  log(`\n🎯 Overall Score: ${totalScore}/${maxScore} (${percentage}%)`, 
    percentage >= 80 ? 'green' : percentage >= 60 ? 'yellow' : 'red');
  
  if (percentage >= 80) {
    log('\n🚀 Ready for deployment!', 'green');
    log('\nNext steps:', 'blue');
    log('1. Set environment variables in Netlify dashboard', 'blue');
    log('2. Run database migration: npm run setup:supabase', 'blue');
    log('3. Deploy to Netlify', 'blue');
    log('4. Test QR functionality', 'blue');
    return true;
  } else {
    log('\n⚠️  Not ready for deployment. Please fix the issues above.', 'yellow');
    return false;
  }
}

async function main() {
  log('🔍 Starting Deployment Validation...', 'blue');
  
  const results = {
    environment: validateEnvironmentConfig(),
    qrSystem: validateQRSystem(),
    routes: validateRoutes(),
    waitlist: validateWaitlist(),
    buildOutput: validateBuildOutput(),
    supabase: validateSupabaseIntegration()
  };
  
  const ready = generateDeploymentReport(results);
  
  process.exit(ready ? 0 : 1);
}

main().catch(error => {
  log(`❌ Validation failed: ${error.message}`, 'red');
  process.exit(1);
});
