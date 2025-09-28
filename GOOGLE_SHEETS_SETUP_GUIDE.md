# Google Sheets Waitlist Integration Setup Guide

This guide will help you set up Google Sheets integration for collecting waitlist emails.

## Option 1: Google Apps Script Webhook (Recommended)

### Step 1: Create a Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet
3. Name it "Dislink Waitlist" (or any name you prefer)
4. In the first row, add these headers:
   - A1: `Email`
   - B1: `Timestamp`
   - C1: `Source`
   - D1: `User Agent`
   - E1: `Referrer`

### Step 2: Create Google Apps Script

1. In your Google Sheet, go to **Extensions** → **Apps Script**
2. Delete the default code and paste this script:

```javascript
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
```

### Step 3: Deploy the Script

1. Click **Deploy** → **New deployment**
2. Choose **Web app** as the type
3. Set **Execute as**: "Me"
4. Set **Who has access**: "Anyone"
5. Click **Deploy**
6. Copy the web app URL (it will look like: `https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec`)

### Step 4: Configure Environment Variables

Add the webhook URL to your environment variables:

```bash
# In your .env.local file
VITE_GOOGLE_SHEETS_WEBHOOK_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```

## Option 2: Google Sheets API (Alternative)

### Step 1: Enable Google Sheets API

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing one
3. Enable the Google Sheets API
4. Go to **Credentials** → **Create Credentials** → **API Key**
5. Copy the API key

### Step 2: Create a Google Sheet

1. Create a new Google Sheet
2. Share it with the email associated with your Google Cloud project
3. Copy the spreadsheet ID from the URL (the long string between `/d/` and `/edit`)

### Step 3: Configure Environment Variables

```bash
# In your .env.local file
VITE_GOOGLE_SHEETS_API_KEY=your_api_key_here
VITE_GOOGLE_SHEETS_ID=your_spreadsheet_id_here
VITE_GOOGLE_SHEETS_NAME=Waitlist
```

## Testing the Integration

### Test the Webhook Method

1. Start your development server: `pnpm dev`
2. Go to your waitlist page
3. Enter a test email and submit
4. Check your Google Sheet to see if the email was added

### Test the API Method

1. Make sure your environment variables are set
2. The API method will automatically be used if the webhook URL is not configured

## Troubleshooting

### Common Issues

1. **CORS Errors**: The webhook method uses `no-cors` mode to avoid CORS issues
2. **Permission Errors**: Make sure your Google Apps Script is deployed with "Anyone" access
3. **API Key Issues**: Ensure your Google Sheets API is enabled and the API key is correct

### Debug Mode

The service includes comprehensive logging. Check your browser console for detailed information about the submission process.

### Fallback Behavior

The service will:
1. Try the webhook method first (if configured)
2. Fall back to the API method (if webhook fails or is not configured)
3. Show an error message if both methods fail

## Security Considerations

1. **API Key**: Keep your Google Sheets API key secure and don't commit it to version control
2. **Webhook URL**: The webhook URL is public but the script validates input data
3. **Rate Limiting**: Google Apps Script has rate limits, but they're generous for normal usage

## Production Deployment

1. Set the environment variables in your Netlify dashboard
2. Deploy your application
3. Test the waitlist functionality in production
4. Monitor your Google Sheet for new entries

## Support

If you encounter issues:
1. Check the browser console for error messages
2. Verify your Google Sheets setup
3. Test with a simple email submission
4. Check the Google Apps Script logs (if using webhook method)
