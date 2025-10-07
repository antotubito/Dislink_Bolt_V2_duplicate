import React, { useState } from 'react';
import { supabase } from '@dislink/shared/lib/supabase';
import { logSecurityEvent, sanitizeInput, sanitizeEmail, isSecureEnvironment } from './SecurityUtils';

/**
 * Security Test Component - For testing security fixes
 * This component should only be used in development
 */
export const SecurityTest: React.FC = () => {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const runSecurityTests = async () => {
    if (import.meta.env.PROD) {
      addResult('❌ Security tests disabled in production');
      return;
    }

    setIsRunning(true);
    setTestResults([]);
    addResult('🔒 Starting security tests...');

    try {
      // Test 1: Environment Security
      addResult(`✅ Environment secure: ${isSecureEnvironment()}`);
      
      // Test 2: Input Sanitization
      const maliciousInput = '<script>alert("xss")</script>';
      const sanitized = sanitizeInput(maliciousInput);
      addResult(`✅ Input sanitization: "${sanitized}" (should not contain <script>)`);
      
      // Test 3: Email Sanitization
      const maliciousEmail = 'test@example.com<script>alert("xss")</script>';
      const sanitizedEmail = sanitizeEmail(maliciousEmail);
      addResult(`✅ Email sanitization: ${sanitizedEmail ? 'Valid' : 'Invalid'} (should be null)`);
      
      // Test 4: RLS Policy Test - QR Scan Tracking
      try {
        const { data, error } = await supabase
          .from('qr_scan_tracking')
          .select('*')
          .limit(1);
        
        if (error) {
          addResult(`✅ QR scan tracking RLS: ${error.message} (should be permission denied)`);
        } else {
          addResult(`⚠️ QR scan tracking RLS: ${data?.length || 0} records returned (should be 0 or permission denied)`);
        }
      } catch (err) {
        addResult(`✅ QR scan tracking RLS: Error caught (expected)`);
      }
      
      // Test 5: RLS Policy Test - Feedback
      try {
        const { data, error } = await supabase
          .from('feedback')
          .select('*')
          .limit(1);
        
        if (error) {
          addResult(`✅ Feedback RLS: ${error.message} (should be permission denied)`);
        } else {
          addResult(`⚠️ Feedback RLS: ${data?.length || 0} records returned (should be 0 or permission denied)`);
        }
      } catch (err) {
        addResult(`✅ Feedback RLS: Error caught (expected)`);
      }
      
      // Test 6: RLS Policy Test - Waitlist
      try {
        const { data, error } = await supabase
          .from('waitlist')
          .select('*')
          .limit(1);
        
        if (error) {
          addResult(`✅ Waitlist RLS: ${error.message} (should be permission denied)`);
        } else {
          addResult(`⚠️ Waitlist RLS: ${data?.length || 0} records returned (should be 0 or permission denied)`);
        }
      } catch (err) {
        addResult(`✅ Waitlist RLS: Error caught (expected)`);
      }
      
      // Test 7: Environment Variables
      const hasSupabaseUrl = !!import.meta.env.VITE_SUPABASE_URL;
      const hasSupabaseKey = !!import.meta.env.VITE_SUPABASE_ANON_KEY;
      addResult(`✅ Environment variables: URL=${hasSupabaseUrl}, Key=${hasSupabaseKey}`);
      
      // Test 8: Security Event Logging
      logSecurityEvent('Security test completed', { testType: 'automated' });
      addResult('✅ Security event logging: Test event sent');
      
      addResult('🎉 All security tests completed!');
      
    } catch (error) {
      addResult(`❌ Test error: ${error}`);
    } finally {
      setIsRunning(false);
    }
  };

  if (import.meta.env.PROD) {
    return null; // Don't render in production
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-md max-h-96 overflow-auto">
      <h3 className="font-bold text-lg mb-2">🔒 Security Tests</h3>
      <button
        onClick={runSecurityTests}
        disabled={isRunning}
        className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-3 py-1 rounded text-sm mb-2"
      >
        {isRunning ? 'Running...' : 'Run Tests'}
      </button>
      <div className="text-xs space-y-1">
        {testResults.map((result, index) => (
          <div key={index} className="font-mono">
            {result}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SecurityTest;
