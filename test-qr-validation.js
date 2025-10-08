// 🧪 QR CODE VALIDATION TEST
// Copy and paste this into your browser console to test QR code validation

console.log('🚀 QR Code Validation Test Loaded!');
console.log('Available functions:');
console.log('- testQRValidation(code) - Test QR code validation with a specific code');
console.log('- testExistingCode() - Test with existing code c35c65a4');
console.log('- testInvalidCode() - Test with invalid code');
console.log('- testQRGeneration() - Test QR code generation');

// Test QR code validation
async function testQRValidation(code) {
  console.log(`🔍 Testing QR code validation for: ${code}`);
  
  try {
    // Import the validation function
    const { validateConnectionCode } = await import('/shared-DMsPzM7x.js');
    
    const result = await validateConnectionCode(code);
    
    if (result) {
      console.log('✅ QR Code validation successful:', {
        userId: result.userId,
        name: result.name,
        publicProfileUrl: result.publicProfileUrl
      });
      return result;
    } else {
      console.log('❌ QR Code validation failed - code not found or expired');
      return null;
    }
  } catch (error) {
    console.error('❌ QR Code validation error:', error);
    return null;
  }
}

// Test with existing code
async function testExistingCode() {
  console.log('🔍 Testing with existing code: c35c65a4');
  return await testQRValidation('c35c65a4');
}

// Test with invalid code
async function testInvalidCode() {
  console.log('🔍 Testing with invalid code: invalid_code_123');
  return await testQRValidation('invalid_code_123');
}

// Test QR code generation
async function testQRGeneration() {
  console.log('🔍 Testing QR code generation...');
  
  try {
    // Import the generation function
    const { generateUserQRCode } = await import('/shared-DMsPzM7x.js');
    
    const result = await generateUserQRCode();
    
    if (result) {
      console.log('✅ QR Code generation successful:', {
        connectionCode: result.connectionCode,
        publicProfileUrl: result.publicProfileUrl
      });
      return result;
    } else {
      console.log('❌ QR Code generation failed');
      return null;
    }
  } catch (error) {
    console.error('❌ QR Code generation error:', error);
    return null;
  }
}

// Run all tests
async function runAllTests() {
  console.log('🧪 Running all QR code tests...');
  
  console.log('\n1. Testing existing code:');
  await testExistingCode();
  
  console.log('\n2. Testing invalid code:');
  await testInvalidCode();
  
  console.log('\n3. Testing QR code generation:');
  await testQRGeneration();
  
  console.log('\n✅ All tests completed!');
}

console.log('🎉 QR Code Validation Test ready! Try: runAllTests()');
