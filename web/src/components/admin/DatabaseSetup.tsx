import React from 'react';
import { useAdminOperations } from '@dislink/shared/hooks/useAdminOperations';
import { logger } from '@dislink/shared/lib/logger';

export function DatabaseSetup() {
  const {
    isLoading,
    lastOperation,
    error,
    initializeDatabase,
    cleanupTestData,
    clearError,
    clearLastOperation
  } = useAdminOperations();

  const handleSetup = async () => {
    clearError();
    clearLastOperation();
    
    const result = await initializeDatabase();
    
    if (result.success) {
      logger.info('✅ Database setup completed successfully!');
    } else {
      logger.error('❌ Database setup failed:', result.error);
    }
  };

  const handleCleanup = async () => {
    clearError();
    
    const result = await cleanupTestData();
    
    if (result.success) {
      logger.info('✅ Test data cleanup completed successfully!');
      clearLastOperation(); // Reset result
    } else {
      logger.error('❌ Test data cleanup failed');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        🗄️ Dislink Database Setup
      </h1>
      
      <div className="space-y-6">
        {/* Setup Button */}
        <div className="flex gap-4">
          <button
            onClick={handleSetup}
            disabled={isLoading}
            className={`px-6 py-3 rounded-lg font-semibold text-white transition-colors ${
              isLoading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isLoading ? '🔄 Running Database Setup...' : '🚀 Run Database Setup'}
          </button>
          
          <button
            onClick={handleCleanup}
            disabled={isLoading}
            className={`px-6 py-3 rounded-lg font-semibold text-white transition-colors ${
              isLoading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {isLoading ? '🧹 Cleaning up...' : '🧹 Cleanup Test Data'}
          </button>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            📋 What this does:
          </h3>
          <ul className="text-blue-800 space-y-1">
            <li>✅ Validates and fixes database schema</li>
            <li>✅ Deploys comprehensive RLS policies</li>
            <li>✅ Inserts test data with full auth.uid() compliance</li>
            <li>✅ Verifies everything works correctly</li>
          </ul>
        </div>

        {/* Results */}
        {lastOperation && (
          <div className={`border rounded-lg p-4 ${
            lastOperation.success 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <h3 className={`text-lg font-semibold mb-3 ${
              lastOperation.success ? 'text-green-900' : 'text-red-900'
            }`}>
              {lastOperation.success ? '✅ Operation Completed Successfully!' : '❌ Operation Failed'}
            </h3>
            
            {lastOperation.error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded">
                <p className="text-red-800 font-medium">Error:</p>
                <p className="text-red-700">{lastOperation.error}</p>
              </div>
            )}
            
            {lastOperation.message && (
              <div className="mb-4 p-3 bg-green-100 border border-green-300 rounded">
                <p className="text-green-800 font-medium">Message:</p>
                <p className="text-green-700">{lastOperation.message}</p>
              </div>
            )}
            
            {lastOperation.data && (
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900">Operation Details:</h4>
                <div className="bg-gray-50 p-3 rounded">
                  <pre className="text-sm text-gray-700">
                    {JSON.stringify(lastOperation.data, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="border rounded-lg p-4 bg-red-50 border-red-200">
            <h3 className="text-lg font-semibold mb-3 text-red-900">
              ❌ Error
            </h3>
            <div className="p-3 bg-red-100 border border-red-300 rounded">
              <p className="text-red-800 font-medium">Error:</p>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Usage Instructions */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            📖 Usage Instructions:
          </h3>
          <ol className="text-gray-700 space-y-2 list-decimal list-inside">
            <li>Make sure you're logged in to your Dislink account</li>
            <li>Click "Run Database Setup" to run the complete setup</li>
            <li>Wait for all steps to complete successfully</li>
            <li>Use "Cleanup Test Data" to remove test data when done</li>
          </ol>
        </div>

        {/* Technical Details */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-yellow-900 mb-2">
            ⚠️ Important Notes:
          </h3>
          <ul className="text-yellow-800 space-y-1">
            <li>• This setup requires an authenticated user (auth.uid())</li>
            <li>• All operations respect Row Level Security (RLS)</li>
            <li>• Test data is isolated per user</li>
            <li>• Schema changes are safe and non-destructive</li>
          </ul>
        </div>
      </div>
    </div>
  );
}