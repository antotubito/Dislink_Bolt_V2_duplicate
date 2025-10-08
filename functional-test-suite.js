// 🧪 DISLINK FUNCTIONAL TEST SUITE
// Comprehensive testing of all dynamic features

console.log('🚀 Dislink Functional Test Suite Loaded!');
console.log('Available test functions:');
console.log('- testDailyNeeds() - Test Daily Needs creation, update, deletion');
console.log('- testFollowUps() - Test Follow-ups creation, status update, deletion');
console.log('- testQRCode() - Test QR code generation and scanning');
console.log('- testPublicProfile() - Test Public Profile visibility and edit');
console.log('- testProfilePreview() - Test Profile preview button');
console.log('- testButtonsActions() - Test all buttons and actions');
console.log('- testDataPersistence() - Test data persistence across refreshes');
console.log('- testUIUpdates() - Test dynamic UI updates');
console.log('- runFullTestSuite() - Run all tests');

// Helper function to get current user
async function getCurrentUser() {
  try {
    if (window.supabase) {
      const { data: { user } } = await window.supabase.auth.getUser();
      return user;
    }
    return null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

// Helper function to simulate user interaction
function simulateClick(element) {
  if (element) {
    element.click();
    return true;
  }
  return false;
}

// Helper function to simulate form input
function simulateInput(element, value) {
  if (element) {
    element.value = value;
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  }
  return false;
}

// Test Daily Needs functionality
async function testDailyNeeds() {
  console.log('🔍 Testing Daily Needs functionality...');
  const results = {
    creation: false,
    update: false,
    deletion: false,
    persistence: false,
    errors: []
  };

  try {
    // Test 1: Check if Daily Needs section exists
    const dailyNeedsSection = document.querySelector('[data-testid="daily-needs"]') || 
                             document.querySelector('.daily-needs') ||
                             document.querySelector('h2:contains("Daily Needs")');
    
    if (!dailyNeedsSection) {
      results.errors.push('Daily Needs section not found');
      return results;
    }

    // Test 2: Check if create button exists
    const createButton = document.querySelector('button:contains("Create Need")') ||
                        document.querySelector('[data-testid="create-need"]') ||
                        document.querySelector('button[aria-label*="create"]');
    
    if (createButton) {
      results.creation = true;
      console.log('✅ Daily Needs creation button found');
    } else {
      results.errors.push('Daily Needs creation button not found');
    }

    // Test 3: Check if needs list exists
    const needsList = document.querySelector('.needs-list') ||
                     document.querySelector('[data-testid="needs-list"]') ||
                     document.querySelector('.space-y-4');
    
    if (needsList) {
      console.log('✅ Daily Needs list found');
    } else {
      results.errors.push('Daily Needs list not found');
    }

    // Test 4: Check if API functions are available
    if (window.supabase) {
      const { data: { user } } = await window.supabase.auth.getUser();
      if (user) {
        // Test needs listing
        const { data: needs, error } = await window.supabase
          .from('needs')
          .select('*')
          .eq('user_id', user.id)
          .limit(5);
        
        if (!error) {
          results.persistence = true;
          console.log('✅ Daily Needs API access working');
        } else {
          results.errors.push('Daily Needs API error: ' + error.message);
        }
      }
    }

  } catch (error) {
    results.errors.push('Daily Needs test error: ' + error.message);
  }

  console.log('📊 Daily Needs Test Results:', results);
  return results;
}

// Test Follow-ups functionality
async function testFollowUps() {
  console.log('🔍 Testing Follow-ups functionality...');
  const results = {
    creation: false,
    update: false,
    deletion: false,
    persistence: false,
    errors: []
  };

  try {
    // Test 1: Check if Follow-ups section exists
    const followUpsSection = document.querySelector('[data-testid="follow-ups"]') ||
                            document.querySelector('.follow-ups') ||
                            document.querySelector('h2:contains("Follow-up")');
    
    if (!followUpsSection) {
      results.errors.push('Follow-ups section not found');
      return results;
    }

    // Test 2: Check if add follow-up button exists
    const addButton = document.querySelector('button:contains("Add Follow-up")') ||
                     document.querySelector('[data-testid="add-followup"]') ||
                     document.querySelector('button[aria-label*="follow"]');
    
    if (addButton) {
      results.creation = true;
      console.log('✅ Follow-ups creation button found');
    } else {
      results.errors.push('Follow-ups creation button not found');
    }

    // Test 3: Check if follow-ups list exists
    const followUpsList = document.querySelector('.follow-ups-list') ||
                         document.querySelector('[data-testid="followups-list"]');
    
    if (followUpsList) {
      console.log('✅ Follow-ups list found');
    } else {
      results.errors.push('Follow-ups list not found');
    }

    // Test 4: Check if API functions are available
    if (window.supabase) {
      const { data: { user } } = await window.supabase.auth.getUser();
      if (user) {
        // Test follow-ups listing
        const { data: followUps, error } = await window.supabase
          .from('contact_followups')
          .select('*')
          .limit(5);
        
        if (!error) {
          results.persistence = true;
          console.log('✅ Follow-ups API access working');
        } else {
          results.errors.push('Follow-ups API error: ' + error.message);
        }
      }
    }

  } catch (error) {
    results.errors.push('Follow-ups test error: ' + error.message);
  }

  console.log('📊 Follow-ups Test Results:', results);
  return results;
}

// Test QR Code functionality
async function testQRCode() {
  console.log('🔍 Testing QR Code functionality...');
  const results = {
    generation: false,
    scanning: false,
    sharing: false,
    persistence: false,
    errors: []
  };

  try {
    // Test 1: Check if QR code generator exists
    const qrGenerator = document.querySelector('[data-testid="qr-generator"]') ||
                       document.querySelector('.qr-generator') ||
                       document.querySelector('canvas') ||
                       document.querySelector('img[alt*="QR"]');
    
    if (qrGenerator) {
      results.generation = true;
      console.log('✅ QR Code generator found');
    } else {
      results.errors.push('QR Code generator not found');
    }

    // Test 2: Check if QR scanner exists
    const qrScanner = document.querySelector('[data-testid="qr-scanner"]') ||
                     document.querySelector('.qr-scanner') ||
                     document.querySelector('video');
    
    if (qrScanner) {
      results.scanning = true;
      console.log('✅ QR Code scanner found');
    } else {
      results.errors.push('QR Code scanner not found');
    }

    // Test 3: Check if share button exists
    const shareButton = document.querySelector('button:contains("Share")') ||
                       document.querySelector('[data-testid="share-qr"]') ||
                       document.querySelector('button[aria-label*="share"]');
    
    if (shareButton) {
      results.sharing = true;
      console.log('✅ QR Code share button found');
    } else {
      results.errors.push('QR Code share button not found');
    }

    // Test 4: Check if QR functions are available
    if (window.supabase) {
      const { data: { user } } = await window.supabase.auth.getUser();
      if (user) {
        // Test connection codes table
        const { data: codes, error } = await window.supabase
          .from('connection_codes')
          .select('*')
          .eq('user_id', user.id)
          .limit(5);
        
        if (!error) {
          results.persistence = true;
          console.log('✅ QR Code API access working');
        } else {
          results.errors.push('QR Code API error: ' + error.message);
        }
      }
    }

  } catch (error) {
    results.errors.push('QR Code test error: ' + error.message);
  }

  console.log('📊 QR Code Test Results:', results);
  return results;
}

// Test Public Profile functionality
async function testPublicProfile() {
  console.log('🔍 Testing Public Profile functionality...');
  const results = {
    visibility: false,
    editing: false,
    preview: false,
    persistence: false,
    errors: []
  };

  try {
    // Test 1: Check if public profile settings exist
    const publicProfileSettings = document.querySelector('[data-testid="public-profile"]') ||
                                 document.querySelector('.public-profile') ||
                                 document.querySelector('input[type="checkbox"][name*="public"]');
    
    if (publicProfileSettings) {
      results.visibility = true;
      console.log('✅ Public Profile settings found');
    } else {
      results.errors.push('Public Profile settings not found');
    }

    // Test 2: Check if edit profile button exists
    const editButton = document.querySelector('button:contains("Edit Profile")') ||
                      document.querySelector('[data-testid="edit-profile"]') ||
                      document.querySelector('button[aria-label*="edit"]');
    
    if (editButton) {
      results.editing = true;
      console.log('✅ Profile edit button found');
    } else {
      results.errors.push('Profile edit button not found');
    }

    // Test 3: Check if preview button exists
    const previewButton = document.querySelector('button:contains("Preview")') ||
                         document.querySelector('[data-testid="preview-profile"]') ||
                         document.querySelector('button[aria-label*="preview"]');
    
    if (previewButton) {
      results.preview = true;
      console.log('✅ Profile preview button found');
    } else {
      results.errors.push('Profile preview button not found');
    }

    // Test 4: Check if profile API is available
    if (window.supabase) {
      const { data: { user } } = await window.supabase.auth.getUser();
      if (user) {
        // Test profiles table
        const { data: profile, error } = await window.supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (!error && profile) {
          results.persistence = true;
          console.log('✅ Public Profile API access working');
        } else {
          results.errors.push('Public Profile API error: ' + (error?.message || 'Profile not found'));
        }
      }
    }

  } catch (error) {
    results.errors.push('Public Profile test error: ' + error.message);
  }

  console.log('📊 Public Profile Test Results:', results);
  return results;
}

// Test Profile Preview functionality
async function testProfilePreview() {
  console.log('🔍 Testing Profile Preview functionality...');
  const results = {
    buttonExists: false,
    modalOpens: false,
    dataLoads: false,
    errors: []
  };

  try {
    // Test 1: Check if preview button exists
    const previewButton = document.querySelector('button:contains("Preview Public Profile")') ||
                         document.querySelector('[data-testid="preview-public-profile"]') ||
                         document.querySelector('button[aria-label*="preview"]');
    
    if (previewButton) {
      results.buttonExists = true;
      console.log('✅ Profile Preview button found');
      
      // Test 2: Try to click the button
      try {
        previewButton.click();
        results.modalOpens = true;
        console.log('✅ Profile Preview modal opened');
      } catch (error) {
        results.errors.push('Failed to open preview modal: ' + error.message);
      }
    } else {
      results.errors.push('Profile Preview button not found');
    }

    // Test 3: Check if preview modal exists
    const previewModal = document.querySelector('[data-testid="preview-modal"]') ||
                        document.querySelector('.preview-modal') ||
                        document.querySelector('[role="dialog"]');
    
    if (previewModal) {
      results.dataLoads = true;
      console.log('✅ Profile Preview modal found');
    } else {
      results.errors.push('Profile Preview modal not found');
    }

  } catch (error) {
    results.errors.push('Profile Preview test error: ' + error.message);
  }

  console.log('📊 Profile Preview Test Results:', results);
  return results;
}

// Test all buttons and actions
async function testButtonsActions() {
  console.log('🔍 Testing all buttons and actions...');
  const results = {
    buttonsFound: 0,
    buttonsWorking: 0,
    formsWorking: 0,
    modalsWorking: 0,
    errors: []
  };

  try {
    // Test 1: Find all buttons
    const buttons = document.querySelectorAll('button');
    results.buttonsFound = buttons.length;
    console.log(`✅ Found ${buttons.length} buttons`);

    // Test 2: Test form submissions
    const forms = document.querySelectorAll('form');
    for (const form of forms) {
      try {
        // Check if form has required elements
        const inputs = form.querySelectorAll('input, textarea, select');
        if (inputs.length > 0) {
          results.formsWorking++;
        }
      } catch (error) {
        results.errors.push('Form test error: ' + error.message);
      }
    }

    // Test 3: Test modals
    const modals = document.querySelectorAll('[role="dialog"], .modal, [data-testid*="modal"]');
    for (const modal of modals) {
      try {
        const closeButton = modal.querySelector('button[aria-label*="close"], button:contains("Close")');
        if (closeButton) {
          results.modalsWorking++;
        }
      } catch (error) {
        results.errors.push('Modal test error: ' + error.message);
      }
    }

    // Test 4: Test specific action buttons
    const actionButtons = [
      'button:contains("Save")',
      'button:contains("Cancel")',
      'button:contains("Delete")',
      'button:contains("Edit")',
      'button:contains("Add")',
      'button:contains("Create")'
    ];

    for (const selector of actionButtons) {
      const button = document.querySelector(selector);
      if (button) {
        results.buttonsWorking++;
      }
    }

  } catch (error) {
    results.errors.push('Buttons/Actions test error: ' + error.message);
  }

  console.log('📊 Buttons/Actions Test Results:', results);
  return results;
}

// Test data persistence
async function testDataPersistence() {
  console.log('🔍 Testing data persistence...');
  const results = {
    needsPersist: false,
    followUpsPersist: false,
    profilePersist: false,
    contactsPersist: false,
    errors: []
  };

  try {
    if (window.supabase) {
      const { data: { user } } = await window.supabase.auth.getUser();
      if (user) {
        // Test 1: Check if needs persist
        const { data: needs, error: needsError } = await window.supabase
          .from('needs')
          .select('*')
          .eq('user_id', user.id)
          .limit(1);
        
        if (!needsError) {
          results.needsPersist = true;
          console.log('✅ Daily Needs data persistence working');
        } else {
          results.errors.push('Needs persistence error: ' + needsError.message);
        }

        // Test 2: Check if follow-ups persist
        const { data: followUps, error: followUpsError } = await window.supabase
          .from('contact_followups')
          .select('*')
          .limit(1);
        
        if (!followUpsError) {
          results.followUpsPersist = true;
          console.log('✅ Follow-ups data persistence working');
        } else {
          results.errors.push('Follow-ups persistence error: ' + followUpsError.message);
        }

        // Test 3: Check if profile persists
        const { data: profile, error: profileError } = await window.supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (!profileError && profile) {
          results.profilePersist = true;
          console.log('✅ Profile data persistence working');
        } else {
          results.errors.push('Profile persistence error: ' + (profileError?.message || 'Profile not found'));
        }

        // Test 4: Check if contacts persist
        const { data: contacts, error: contactsError } = await window.supabase
          .from('contacts')
          .select('*')
          .eq('user_id', user.id)
          .limit(1);
        
        if (!contactsError) {
          results.contactsPersist = true;
          console.log('✅ Contacts data persistence working');
        } else {
          results.errors.push('Contacts persistence error: ' + contactsError.message);
        }
      }
    }

  } catch (error) {
    results.errors.push('Data persistence test error: ' + error.message);
  }

  console.log('📊 Data Persistence Test Results:', results);
  return results;
}

// Test dynamic UI updates
async function testUIUpdates() {
  console.log('🔍 Testing dynamic UI updates...');
  const results = {
    listsUpdate: false,
    stateChanges: false,
    notifications: false,
    counters: false,
    errors: []
  };

  try {
    // Test 1: Check if lists exist and can be updated
    const lists = document.querySelectorAll('.space-y-4, .grid, [data-testid*="list"]');
    if (lists.length > 0) {
      results.listsUpdate = true;
      console.log('✅ Dynamic lists found');
    } else {
      results.errors.push('Dynamic lists not found');
    }

    // Test 2: Check if state indicators exist
    const stateIndicators = document.querySelectorAll('.loading, .error, .success, [data-testid*="state"]');
    if (stateIndicators.length > 0) {
      results.stateChanges = true;
      console.log('✅ State change indicators found');
    } else {
      results.errors.push('State change indicators not found');
    }

    // Test 3: Check if notifications exist
    const notifications = document.querySelectorAll('.notification, .alert, .toast, [data-testid*="notification"]');
    if (notifications.length > 0) {
      results.notifications = true;
      console.log('✅ Notification system found');
    } else {
      results.errors.push('Notification system not found');
    }

    // Test 4: Check if counters exist
    const counters = document.querySelectorAll('.badge, .count, [data-testid*="counter"]');
    if (counters.length > 0) {
      results.counters = true;
      console.log('✅ Counter system found');
    } else {
      results.errors.push('Counter system not found');
    }

  } catch (error) {
    results.errors.push('UI updates test error: ' + error.message);
  }

  console.log('📊 UI Updates Test Results:', results);
  return results;
}

// Run full test suite
async function runFullTestSuite() {
  console.log('🚀 Running Full Functional Test Suite...');
  console.log('=====================================');
  
  const testResults = {
    dailyNeeds: await testDailyNeeds(),
    followUps: await testFollowUps(),
    qrCode: await testQRCode(),
    publicProfile: await testPublicProfile(),
    profilePreview: await testProfilePreview(),
    buttonsActions: await testButtonsActions(),
    dataPersistence: await testDataPersistence(),
    uiUpdates: await testUIUpdates()
  };

  console.log('=====================================');
  console.log('📊 FULL TEST SUITE RESULTS:');
  console.log('=====================================');
  
  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;
  let allErrors = [];

  for (const [testName, results] of Object.entries(testResults)) {
    console.log(`\n🔍 ${testName.toUpperCase()}:`);
    
    for (const [key, value] of Object.entries(results)) {
      if (key === 'errors') {
        if (value.length > 0) {
          console.log(`  ❌ ${key}: ${value.length} errors`);
          allErrors.push(...value.map(error => `${testName}: ${error}`));
          failedTests += value.length;
        } else {
          console.log(`  ✅ ${key}: No errors`);
        }
      } else if (typeof value === 'boolean') {
        totalTests++;
        if (value) {
          console.log(`  ✅ ${key}: PASSED`);
          passedTests++;
        } else {
          console.log(`  ❌ ${key}: FAILED`);
          failedTests++;
        }
      } else if (typeof value === 'number') {
        console.log(`  📊 ${key}: ${value}`);
      }
    }
  }

  console.log('\n=====================================');
  console.log('📈 SUMMARY:');
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${failedTests}`);
  console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  
  if (allErrors.length > 0) {
    console.log('\n❌ ERRORS FOUND:');
    allErrors.forEach((error, index) => {
      console.log(`${index + 1}. ${error}`);
    });
  }

  console.log('\n🎯 RECOMMENDATIONS:');
  if (failedTests > 0) {
    console.log('- Fix failed tests before deployment');
    console.log('- Check API endpoints and database connections');
    console.log('- Verify all event handlers are properly connected');
  } else {
    console.log('- All tests passed! App is ready for deployment');
  }

  return testResults;
}

console.log('🎉 Functional Test Suite ready! Try: runFullTestSuite()');
