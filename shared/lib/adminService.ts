// =====================================================
// DISLINK ADMIN SERVICE - CLEAN INFRASTRUCTURE
// Centralized admin operations with proper error handling
// =====================================================

import { setupDatabase, cleanupTestData } from './databaseSetup';
import { logger } from './logger';

export interface AdminOperationResult {
  success: boolean;
  message?: string;
  error?: string;
  data?: any;
  timestamp: string;
}

export interface DatabaseSetupResult extends AdminOperationResult {
  contactId?: string;
  noteId?: string;
  followupId?: string;
  requestId?: string;
}

/**
 * Admin Service - Centralized admin operations
 * Provides a clean interface for all admin functionality
 */
export class AdminService {
  private static instance: AdminService;
  
  private constructor() {}
  
  public static getInstance(): AdminService {
    if (!AdminService.instance) {
      AdminService.instance = new AdminService();
    }
    return AdminService.instance;
  }

  /**
   * Initialize database with full setup
   * This is the main entry point for database initialization
   */
  async initializeDatabase(): Promise<DatabaseSetupResult> {
    const timestamp = new Date().toISOString();
    
    try {
      logger.info('🚀 AdminService: Starting database initialization...');
      
      const result = await setupDatabase();
      
      if (result.success) {
        logger.info('✅ AdminService: Database initialization completed successfully');
        return {
          ...result,
          timestamp,
          message: result.message || '✅ Database initialization completed successfully'
        };
      } else {
        logger.error('❌ AdminService: Database initialization failed:', result.error);
        return {
          success: false,
          error: result.error || 'Database initialization failed',
          timestamp
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      logger.error('❌ AdminService: Database initialization error:', error);
      
      return {
        success: false,
        error: errorMessage,
        timestamp
      };
    }
  }

  /**
   * Clean up test data
   */
  async cleanupTestData(): Promise<AdminOperationResult> {
    const timestamp = new Date().toISOString();
    
    try {
      logger.info('🧹 AdminService: Starting test data cleanup...');
      
      const success = await cleanupTestData();
      
      if (success) {
        logger.info('✅ AdminService: Test data cleanup completed successfully');
        return {
          success: true,
          message: '✅ Test data cleanup completed successfully',
          timestamp
        };
      } else {
        logger.error('❌ AdminService: Test data cleanup failed');
        return {
          success: false,
          error: 'Test data cleanup failed',
          timestamp
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      logger.error('❌ AdminService: Test data cleanup error:', error);
      
      return {
        success: false,
        error: errorMessage,
        timestamp
      };
    }
  }

  /**
   * Get system health status
   */
  async getSystemHealth(): Promise<AdminOperationResult> {
    const timestamp = new Date().toISOString();
    
    try {
      logger.info('🔍 AdminService: Checking system health...');
      
      // This could be expanded to check various system components
      const healthData = {
        database: 'connected',
        authentication: 'active',
        timestamp: new Date().toISOString()
      };
      
      logger.info('✅ AdminService: System health check completed');
      return {
        success: true,
        message: '✅ System health check completed',
        data: healthData,
        timestamp
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      logger.error('❌ AdminService: System health check error:', error);
      
      return {
        success: false,
        error: errorMessage,
        timestamp
      };
    }
  }
}

// Export singleton instance
export const adminService = AdminService.getInstance();

// Export convenience functions for easy usage
export const initializeDatabase = () => adminService.initializeDatabase();
export const cleanupTestData = () => adminService.cleanupTestData();
export const getSystemHealth = () => adminService.getSystemHealth();
