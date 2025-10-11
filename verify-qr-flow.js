/**
 * Automated QR Flow Verification Script
 * Tests QR code functionality programmatically
 */

const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

function logTest(testName, passed, details = '') {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} ${testName}`);
  if (details) {
    console.log(`   ${details}`);
  }
  
  testResults.tests.push({ name: testName, passed, details });
  if (passed) {
    testResults.passed++;
  } else {
    testResults.failed++;
  }
}

async function testValidQRCode() {
  console.log('\n🔍 Testing Valid QR Code...');
  
  try {
    // Test the validateConnectionCode function
    const { validateConnectionCode } = require('./shared/lib/qrConnectionEnhanced');
    
    const result = await validateConnectionCode('test-valid-qr-001');
    
    if (result && result.name && result.publicProfileUrl) {
      logTest('Valid QR Code Validation', true, `Found profile: ${result.name}`);
    } else {
      logTest('Valid QR Code Validation', false, 'No profile data returned');
    }
  } catch (error) {
    logTest('Valid QR Code Validation', false, `Error: ${error.message}`);
  }
}

async function testExpiredQRCode() {
  console.log('\n🔍 Testing Expired QR Code...');
  
  try {
    const { validateConnectionCode } = require('./shared/lib/qrConnectionEnhanced');
    
    const result = await validateConnectionCode('test-expired-qr-001');
    
    if (result === null) {
      logTest('Expired QR Code Validation', true, 'Correctly returned null for expired code');
    } else {
      logTest('Expired QR Code Validation', false, 'Should return null for expired code');
    }
  } catch (error) {
    logTest('Expired QR Code Validation', false, `Error: ${error.message}`);
  }
}

async function testPrivateQRCode() {
  console.log('\n🔍 Testing Private QR Code...');
  
  try {
    const { validateConnectionCode } = require('./shared/lib/qrConnectionEnhanced');
    
    const result = await validateConnectionCode('test-private-qr-001');
    
    if (result === null) {
      logTest('Private QR Code Validation', true, 'Correctly returned null for private profile');
    } else {
      logTest('Private QR Code Validation', false, 'Should return null for private profile');
    }
  } catch (error) {
    logTest('Private QR Code Validation', false, `Error: ${error.message}`);
  }
}

async function testDatabaseConnection() {
  console.log('\n🔍 Testing Database Connection...');
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, public_profile')
      .eq('id', 'test-qr-user-001')
      .single();
    
    if (error) {
      logTest('Database Connection', false, `Database error: ${error.message}`);
    } else if (data) {
      logTest('Database Connection', true, `Connected to database, found test user: ${data.first_name} ${data.last_name}`);
    } else {
      logTest('Database Connection', false, 'No test data found');
    }
  } catch (error) {
    logTest('Database Connection', false, `Connection error: ${error.message}`);
  }
}

async function testQRGeneration() {
  console.log('\n🔍 Testing QR Code Generation...');
  
  try {
    const { generateUserQRCode } = require('./shared/lib/qrConnectionEnhanced');
    
    // Mock user for testing
    const mockUser = { id: 'test-qr-user-001' };
    
    const result = await generateUserQRCode(mockUser.id);
    
    if (result && result.connectionCode && result.publicProfileUrl) {
      logTest('QR Code Generation', true, `Generated QR with code: ${result.connectionCode.substring(0, 8)}...`);
    } else {
      logTest('QR Code Generation', false, 'Failed to generate QR code');
    }
  } catch (error) {
    logTest('QR Code Generation', false, `Error: ${error.message}`);
  }
}

async function runAllTests() {
  console.log('🚀 Starting QR Flow Verification Tests...');
  console.log('==========================================');
  
  // Run all tests
  await testDatabaseConnection();
  await testValidQRCode();
  await testExpiredQRCode();
  await testPrivateQRCode();
  await testQRGeneration();
  
  // Print summary
  console.log('\n📊 Test Results Summary');
  console.log('========================');
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📈 Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);
  
  if (testResults.failed > 0) {
    console.log('\n❌ Failed Tests:');
    testResults.tests
      .filter(test => !test.passed)
      .forEach(test => {
        console.log(`   - ${test.name}: ${test.details}`);
      });
  }
  
  console.log('\n🔧 Manual Testing Required:');
  console.log('   1. Open test URLs in incognito browser');
  console.log('   2. Test mobile responsiveness');
  console.log('   3. Verify UI/UX matches expectations');
  console.log('   4. Test preview button functionality');
  
  return testResults.failed === 0;
}

// Run tests if this script is executed directly
if (require.main === module) {
  runAllTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = { runAllTests, testResults };
