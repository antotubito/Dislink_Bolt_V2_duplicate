// =====================================================
// DISLINK ADMIN HOOKS - CLEAN REACT INTEGRATION
// Custom hooks for admin operations with proper state management
// =====================================================

import { useState, useCallback } from 'react';
import { adminService, AdminOperationResult, DatabaseSetupResult } from '../lib/adminService';
import { logger } from '../lib/logger';

export interface AdminOperationsState {
  isLoading: boolean;
  lastOperation: AdminOperationResult | null;
  error: string | null;
}

export interface AdminOperationsActions {
  initializeDatabase: () => Promise<DatabaseSetupResult>;
  cleanupTestData: () => Promise<AdminOperationResult>;
  getSystemHealth: () => Promise<AdminOperationResult>;
  clearError: () => void;
  clearLastOperation: () => void;
}

/**
 * Custom hook for admin operations
 * Provides clean state management and error handling for admin functions
 */
export function useAdminOperations(): AdminOperationsState & AdminOperationsActions {
  const [isLoading, setIsLoading] = useState(false);
  const [lastOperation, setLastOperation] = useState<AdminOperationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const executeOperation = useCallback(async <T extends AdminOperationResult>(
    operation: () => Promise<T>
  ): Promise<T> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await operation();
      setLastOperation(result);
      
      if (!result.success) {
        setError(result.error || 'Operation failed');
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(errorMessage);
      
      const failedResult = {
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString()
      } as T;
      
      setLastOperation(failedResult);
      return failedResult;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const initializeDatabase = useCallback(async (): Promise<DatabaseSetupResult> => {
    logger.info('🔄 useAdminOperations: Starting database initialization...');
    return executeOperation(() => adminService.initializeDatabase());
  }, [executeOperation]);

  const cleanupTestData = useCallback(async (): Promise<AdminOperationResult> => {
    logger.info('🔄 useAdminOperations: Starting test data cleanup...');
    return executeOperation(() => adminService.cleanupTestData());
  }, [executeOperation]);

  const getSystemHealth = useCallback(async (): Promise<AdminOperationResult> => {
    logger.info('🔄 useAdminOperations: Starting system health check...');
    return executeOperation(() => adminService.getSystemHealth());
  }, [executeOperation]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearLastOperation = useCallback(() => {
    setLastOperation(null);
  }, []);

  return {
    // State
    isLoading,
    lastOperation,
    error,
    
    // Actions
    initializeDatabase,
    cleanupTestData,
    getSystemHealth,
    clearError,
    clearLastOperation
  };
}
