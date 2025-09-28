function doPost(e) {
  try {
    // Get the active spreadsheet
    const sheet = SpreadsheetApp.getActiveSheet();
    
    // Get form data
    const email = e.parameter.email;
    const timestamp = e.parameter.timestamp || new Date().toISOString();
    const source = e.parameter.source || 'waitlist-form';
    const userAgent = e.parameter.userAgent || '';
    const referrer = e.parameter.referrer || '';
    
    // Validate email
    if (!email || !email.includes('@')) {
      return ContentService
        .createTextOutput(JSON.stringify({error: 'Invalid email'}))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Check if email already exists
    const data = sheet.getDataRange().getValues();
    const emails = data.map(row => row[0]).slice(1); // Skip header row
    
    if (emails.includes(email)) {
      return ContentService
        .createTextOutput(JSON.stringify({error: 'Email already exists'}))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Add new row
    sheet.appendRow([email, timestamp, source, userAgent, referrer]);
    
    // Return success response
    return ContentService
      .createTextOutput(JSON.stringify({success: true, message: 'Email added successfully'}))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('Error:', error);
    return ContentService
      .createTextOutput(JSON.stringify({error: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({message: 'Dislink Waitlist API is running'}))
    .setMimeType(ContentService.MimeType.JSON);
}

// Test function to verify the script works
function testScript() {
  const testData = {
    parameter: {
      email: 'test@example.com',
      timestamp: new Date().toISOString(),
      source: 'test',
      userAgent: 'Test Browser',
      referrer: 'https://test.com'
    }
  };
  
  const result = doPost(testData);
  console.log('Test result:', result.getContent());
  return result;
}
