/**
 * Google Sheets Integration Service
 * 
 * This service handles sending waitlist email entries to Google Sheets
 * using either Google Apps Script webhook or Google Sheets API
 */

interface WaitlistEntry {
    email: string;
    timestamp: string;
    source: string;
    userAgent?: string;
    referrer?: string;
}

interface GoogleSheetsConfig {
    webhookUrl?: string;
    apiKey?: string;
    spreadsheetId?: string;
    sheetName?: string;
}

class GoogleSheetsService {
    private config: GoogleSheetsConfig;

    constructor() {
        this.config = {
            webhookUrl: import.meta.env.VITE_GOOGLE_SHEETS_WEBHOOK_URL,
            apiKey: import.meta.env.VITE_GOOGLE_SHEETS_API_KEY,
            spreadsheetId: import.meta.env.VITE_GOOGLE_SHEETS_ID,
            sheetName: import.meta.env.VITE_GOOGLE_SHEETS_NAME || 'Waitlist'
        };
    }

    /**
     * Submit email to Google Sheets using Google Apps Script webhook
     * This is the most reliable method for production use
     */
    async submitViaWebhook(entry: WaitlistEntry): Promise<boolean> {
        if (!this.config.webhookUrl) {
            console.warn('Google Sheets webhook URL not configured');
            return false;
        }

        try {
            console.log('Submitting to Google Sheets webhook:', {
                url: this.config.webhookUrl,
                entry: { ...entry, email: entry.email.substring(0, 3) + '***' }
            });

            // Try with CORS first to get actual response
            try {
                const formData = new FormData();
                formData.append('email', entry.email);
                formData.append('timestamp', entry.timestamp);
                formData.append('source', entry.source);
                if (entry.userAgent) formData.append('userAgent', entry.userAgent);
                if (entry.referrer) formData.append('referrer', entry.referrer);

                const response = await fetch(this.config.webhookUrl, {
                    method: 'POST',
                    mode: 'cors',
                    body: formData
                });

                if (response.ok) {
                    const result = await response.text();
                    console.log('Google Sheets webhook response:', result);
                    return true;
                } else {
                    console.warn('Google Sheets webhook returned non-OK status:', response.status);
                    // Fall back to no-cors mode
                }
            } catch (corsError) {
                console.log('CORS request failed, trying no-cors mode:', corsError);
            }

            // Fallback to no-cors mode
            const formData = new FormData();
            formData.append('email', entry.email);
            formData.append('timestamp', entry.timestamp);
            formData.append('source', entry.source);
            if (entry.userAgent) formData.append('userAgent', entry.userAgent);
            if (entry.referrer) formData.append('referrer', entry.referrer);

            const response = await fetch(this.config.webhookUrl, {
                method: 'POST',
                mode: 'no-cors', // Required for Google Apps Script
                body: formData
            });

            // With no-cors mode, we can't read the response, but we assume success
            // if no error was thrown
            console.log('Google Sheets webhook submission completed (no-cors mode)');
            return true;

        } catch (error) {
            console.error('Google Sheets webhook submission failed:', error);
            return false;
        }
    }

    /**
     * Submit email to Google Sheets using Google Sheets API
     * This method requires API key and proper CORS setup
     */
    async submitViaAPI(entry: WaitlistEntry): Promise<boolean> {
        if (!this.config.apiKey || !this.config.spreadsheetId) {
            console.warn('Google Sheets API configuration incomplete');
            return false;
        }

        try {
            console.log('Submitting to Google Sheets API:', {
                spreadsheetId: this.config.spreadsheetId,
                entry: { ...entry, email: entry.email.substring(0, 3) + '***' }
            });

            const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.config.spreadsheetId}/values/${this.config.sheetName}:append?valueInputOption=RAW&key=${this.config.apiKey}`;

            const values = [
                [
                    entry.email,
                    entry.timestamp,
                    entry.source,
                    entry.userAgent || '',
                    entry.referrer || ''
                ]
            ];

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    values: values
                })
            });

            if (!response.ok) {
                throw new Error(`Google Sheets API error: ${response.status} ${response.statusText}`);
            }

            const result = await response.json();
            console.log('Google Sheets API submission successful:', result);
            return true;

        } catch (error) {
            console.error('Google Sheets API submission failed:', error);
            return false;
        }
    }

    /**
     * Submit email to Google Sheets using the best available method
     */
    async submitEmail(email: string, source: string = 'waitlist-form'): Promise<boolean> {
        const entry: WaitlistEntry = {
            email: email.trim().toLowerCase(),
            timestamp: new Date().toISOString(),
            source,
            userAgent: navigator.userAgent,
            referrer: document.referrer || undefined
        };

        console.log('Submitting waitlist entry:', {
            email: entry.email.substring(0, 3) + '***',
            timestamp: entry.timestamp,
            source: entry.source
        });

        // Try webhook first (most reliable), then fallback to API
        if (this.config.webhookUrl) {
            const webhookSuccess = await this.submitViaWebhook(entry);
            if (webhookSuccess) {
                return true;
            }
        }

        // Fallback to API if webhook fails or is not configured
        if (this.config.apiKey && this.config.spreadsheetId) {
            return await this.submitViaAPI(entry);
        }

        console.warn('No Google Sheets integration method available');
        return false;
    }

    /**
     * Test the Google Sheets connection
     */
    async testConnection(): Promise<boolean> {
        try {
            // Test with a dummy email
            const testEmail = `test-${Date.now()}@example.com`;
            return await this.submitEmail(testEmail, 'connection-test');
        } catch (error) {
            console.error('Google Sheets connection test failed:', error);
            return false;
        }
    }
}

// Export singleton instance
export const googleSheetsService = new GoogleSheetsService();

// Export types for use in other components
export type { WaitlistEntry, GoogleSheetsConfig };
