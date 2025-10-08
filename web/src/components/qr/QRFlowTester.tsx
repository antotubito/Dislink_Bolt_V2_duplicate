import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  TestTube, 
  MapPin, 
  Clock, 
  User, 
  Mail, 
  CheckCircle, 
  XCircle,
  Loader,
  QrCode,
  Send,
  Users
} from 'lucide-react';
import { 
  trackEnhancedQRScan, 
  sendEmailInvitation, 
  createConnectionMemory,
  validateInvitationCode 
} from "@dislink/shared/lib/qrEnhanced";
import { generateUserQRCode } from "@dislink/shared/lib/qrConnectionEnhanced";
import { useAuth } from '../auth/AuthProvider';

interface TestResult {
  step: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  data?: any;
  timestamp: Date;
}

export function QRFlowTester() {
  const { user } = useAuth();
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [testEmail, setTestEmail] = useState('test@example.com');

  const addTestResult = (step: string, status: 'success' | 'error', message: string, data?: any) => {
    setTestResults(prev => [...prev, {
      step,
      status,
      message,
      data,
      timestamp: new Date()
    }]);
  };

  const runCompleteQRTest = async () => {
    if (!user) {
      addTestResult('Authentication', 'error', 'User not authenticated');
      return;
    }

    setTesting(true);
    setTestResults([]);

    try {
      // Step 1: Generate QR Code
      addTestResult('QR Generation', 'pending', 'Generating QR code...');
      const qrData = await generateUserQRCode(user.id);
      addTestResult('QR Generation', 'success', 'QR code generated successfully', { 
        connectionCode: qrData.connectionCode,
        publicProfileUrl: qrData.publicProfileUrl 
      });

      // Step 2: Test Enhanced Scan Tracking
      addTestResult('Scan Tracking', 'pending', 'Testing enhanced scan tracking...');
      const mockLocation = {
        latitude: 38.7223, // Lisbon coordinates
        longitude: -9.1393
      };
      
      const scanData = await trackEnhancedQRScan(qrData.connectionCode, mockLocation);
      addTestResult('Scan Tracking', 'success', 'Enhanced scan tracking completed', {
        scanId: scanData.scanId,
        location: scanData.location,
        deviceInfo: scanData.deviceInfo
      });

      // Step 3: Test Email Invitation
      addTestResult('Email Invitation', 'pending', 'Sending test email invitation...');
      const invitation = await sendEmailInvitation(testEmail, user.id, scanData);
      addTestResult('Email Invitation', 'success', 'Email invitation sent successfully', {
        invitationId: invitation.invitationId,
        connectionCode: invitation.connectionCode
      });

      // Step 4: Test Connection Memory Creation
      addTestResult('Connection Memory', 'pending', 'Creating connection memory...');
      const connectionMemory = await createConnectionMemory(user.id, 'test_user_id', scanData, 'email_invitation');
      addTestResult('Connection Memory', 'success', 'Connection memory created', {
        memoryId: connectionMemory.id,
        status: connectionMemory.connectionStatus
      });

      // Step 5: Test Invitation Validation
      addTestResult('Invitation Validation', 'pending', 'Validating invitation code...');
      const validatedInvitation = await validateInvitationCode(invitation.invitationId, invitation.connectionCode);
      if (validatedInvitation) {
        addTestResult('Invitation Validation', 'success', 'Invitation code validated successfully', {
          valid: true,
          expiresAt: validatedInvitation.expiresAt
        });
      } else {
        addTestResult('Invitation Validation', 'error', 'Invitation validation failed');
      }

      addTestResult('Complete Test', 'success', 'All QR flow tests completed successfully! 🎉');

    } catch (error) {
      addTestResult('Test Error', 'error', `Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setTesting(false);
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pending':
        return <Loader className="h-5 w-5 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'pending':
        return 'border-blue-200 bg-blue-50';
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'error':
        return 'border-red-200 bg-red-50';
    }
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <User className="h-5 w-5 text-yellow-600 mr-2" />
            <span className="text-yellow-800">Please log in to test the QR flow</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-6 text-white">
          <div className="flex items-center">
            <TestTube className="h-8 w-8 mr-3" />
            <div>
              <h2 className="text-2xl font-bold">QR Code Flow Tester</h2>
              <p className="text-indigo-100 mt-1">
                Test the complete QR scan to connection flow
              </p>
            </div>
          </div>
        </div>

        {/* Test Configuration */}
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Test Configuration</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Test Email Address
              </label>
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-600"
                placeholder="test@example.com"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={runCompleteQRTest}
                disabled={testing || !testEmail}
                className="w-full flex items-center justify-center px-4 py-2 btn-captamundi-primary text-white rounded-lg hover:btn-captamundi-primary hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {testing ? (
                  <>
                    <Loader className="h-5 w-5 mr-2 animate-spin" />
                    Running Tests...
                  </>
                ) : (
                  <>
                    <TestTube className="h-5 w-5 mr-2" />
                    Run Complete Test
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Test Flow Overview */}
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Test Flow Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                icon: QrCode,
                title: 'QR Generation',
                description: 'Generate QR code for current user'
              },
              {
                icon: MapPin,
                title: 'Scan Tracking',
                description: 'Track scan with location and device info'
              },
              {
                icon: Mail,
                title: 'Email Invitation',
                description: 'Send invitation email with connection code'
              },
              {
                icon: Users,
                title: 'Connection Memory',
                description: 'Create connection memory record'
              },
              {
                icon: CheckCircle,
                title: 'Validation',
                description: 'Validate invitation codes'
              },
              {
                icon: Send,
                title: 'Complete Flow',
                description: 'End-to-end QR connection test'
              }
            ].map((step, index) => (
              <div key={index} className="text-center">
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <step.icon className="h-6 w-6 text-indigo-600" />
                </div>
                <h4 className="font-medium text-gray-900 mb-1">{step.title}</h4>
                <p className="text-sm text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Test Results */}
        {testResults.length > 0 && (
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Test Results</h3>
            <div className="space-y-3">
              {testResults.map((result, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`border rounded-lg p-4 ${getStatusColor(result.status)}`}
                >
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mr-3 mt-0.5">
                      {getStatusIcon(result.status)}
                    </div>
                    <div className="flex-grow">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-900">{result.step}</h4>
                        <span className="text-xs text-gray-500">
                          {result.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mt-1">{result.message}</p>
                      {result.data && (
                        <details className="mt-2">
                          <summary className="text-xs text-gray-600 cursor-pointer hover:text-gray-800">
                            Show Details
                          </summary>
                          <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                            {JSON.stringify(result.data, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="p-6 bg-gray-50 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">How to Use</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <p>1. Enter a test email address above</p>
            <p>2. Click "Run Complete Test" to test the entire QR flow</p>
            <p>3. Watch the progress as each step is executed</p>
            <p>4. Review the results and any error messages</p>
            <p>5. Check the console for detailed logs</p>
          </div>
        </div>
      </div>
    </div>
  );
}
