import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global setup for E2E tests...');
  
  // Check if we're testing against production or local
  const isProduction = process.env.TEST_ENV === 'production';
  const baseUrl = isProduction 
    ? 'https://dislinkboltv2duplicate.netlify.app'
    : 'http://localhost:3001';
  
  console.log(`📍 Testing against: ${baseUrl}`);
  
  // Launch browser to check connectivity
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Test basic connectivity
    console.log('🔍 Testing connectivity...');
    const response = await page.goto(baseUrl, { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    if (response?.status() === 200) {
      console.log('✅ Connectivity test passed');
    } else {
      console.error(`❌ Connectivity test failed: ${response?.status()}`);
      throw new Error(`Failed to connect to ${baseUrl}`);
    }
    
    // Test QR profile route accessibility
    console.log('🔍 Testing QR profile route...');
    const qrResponse = await page.goto(`${baseUrl}/profile/test-connectivity`, {
      waitUntil: 'networkidle',
      timeout: 15000
    });
    
    if (qrResponse?.status() === 200) {
      console.log('✅ QR profile route accessible');
    } else {
      console.warn(`⚠️ QR profile route returned: ${qrResponse?.status()}`);
    }
    
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
  
  console.log('✅ Global setup completed successfully');
}

export default globalSetup;
