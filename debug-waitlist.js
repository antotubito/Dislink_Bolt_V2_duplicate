// Debug script for waitlist form issues
console.log('🔍 WAITLIST DEBUG: Starting debug session...');

// Check environment variables
console.log('🔍 Environment variables:', {
  VITE_GOOGLE_SHEETS_WEBHOOK_URL: import.meta.env.VITE_GOOGLE_SHEETS_WEBHOOK_URL ? 'configured' : 'not configured',
  VITE_GOOGLE_SHEETS_API_KEY: import.meta.env.VITE_GOOGLE_SHEETS_API_KEY ? 'configured' : 'not configured',
  VITE_GOOGLE_SHEETS_ID: import.meta.env.VITE_GOOGLE_SHEETS_ID ? 'configured' : 'not configured'
});

// Test the Google Sheets service directly
async function testWaitlistSubmission() {
  console.log('🔍 Testing waitlist submission...');
  
  try {
    // Import the service
    const { googleSheetsService } = await import('./shared/lib/googleSheetsService.ts');
    
    // Test with a dummy email
    const testEmail = `test-${Date.now()}@example.com`;
    console.log('🔍 Submitting test email:', testEmail);
    
    const result = await googleSheetsService.submitEmail(testEmail, 'debug-test');
    console.log('🔍 Submission result:', result);
    
    if (result) {
      console.log('✅ Waitlist submission successful!');
    } else {
      console.log('❌ Waitlist submission failed!');
    }
    
  } catch (error) {
    console.error('❌ Waitlist test error:', error);
  }
}

// Test the webhook URL directly
async function testWebhookDirectly() {
  console.log('🔍 Testing webhook directly...');
  
  const webhookUrl = import.meta.env.VITE_GOOGLE_SHEETS_WEBHOOK_URL;
  if (!webhookUrl) {
    console.error('❌ No webhook URL configured');
    return;
  }
  
  try {
    const formData = new FormData();
    formData.append('email', 'test@example.com');
    formData.append('timestamp', new Date().toISOString());
    formData.append('source', 'debug-test');
    
    console.log('🔍 Sending request to:', webhookUrl);
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      mode: 'cors',
      body: formData
    });
    
    console.log('🔍 Response status:', response.status);
    console.log('🔍 Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const text = await response.text();
      console.log('🔍 Response text:', text);
      console.log('✅ Webhook test successful!');
    } else {
      console.log('❌ Webhook test failed with status:', response.status);
    }
    
  } catch (error) {
    console.error('❌ Webhook test error:', error);
    
    // Try with no-cors mode
    console.log('🔍 Trying with no-cors mode...');
    try {
      const formData = new FormData();
      formData.append('email', 'test@example.com');
      formData.append('timestamp', new Date().toISOString());
      formData.append('source', 'debug-test-no-cors');
      
      const response = await fetch(webhookUrl, {
        method: 'POST',
        mode: 'no-cors',
        body: formData
      });
      
      console.log('🔍 No-cors response type:', response.type);
      console.log('✅ No-cors request completed (no response data available)');
      
    } catch (noCorsError) {
      console.error('❌ No-cors test also failed:', noCorsError);
    }
  }
}

// Run tests
console.log('🔍 Running waitlist tests...');
testWaitlistSubmission();
testWebhookDirectly();

console.log('🔍 WAITLIST DEBUG: Debug session complete. Check console for results.');
