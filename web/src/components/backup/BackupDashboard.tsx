/**
 * Backup Dashboard Component
 * Manage backups, restores, and monitor backup status
 */

import React, { useState, useEffect } from 'react';
import { backupManager } from '../../lib/backup/BackupManager';

interface BackupJob {
  id: string;
  type: 'full' | 'incremental' | 'differential';
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime: string;
  endTime?: string;
  size: number;
  tables: string[];
  error?: string;
  metadata: Record<string, any>;
}

interface RestoreJob {
  id: string;
  backupId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime: string;
  endTime?: string;
  tables: string[];
  error?: string;
}

export const BackupDashboard: React.FC = () => {
  const [backups, setBackups] = useState<BackupJob[]>([]);
  const [restoreJobs, setRestoreJobs] = useState<RestoreJob[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedBackup, setSelectedBackup] = useState<string | null>(null);

  useEffect(() => {
    loadBackupData();
    
    // Refresh data every 30 seconds
    const interval = setInterval(loadBackupData, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const loadBackupData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const backupList = backupManager.listBackups();
      const backupStats = backupManager.getBackupStats();

      setBackups(backupList);
      setStats(backupStats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load backup data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateBackup = async (type: 'full' | 'incremental') => {
    try {
      setIsLoading(true);
      setError(null);

      let jobId: string;
      if (type === 'full') {
        jobId = await backupManager.createFullBackup();
      } else {
        jobId = await backupManager.createIncrementalBackup();
      }

      console.log(`Backup job created: ${jobId}`);
      await loadBackupData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create backup');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestoreBackup = async (backupId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const restoreJobId = await backupManager.restoreFromBackup(backupId);
      console.log(`Restore job created: ${restoreJobId}`);
      await loadBackupData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to restore backup');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteBackup = async (backupId: string) => {
    if (!confirm('Are you sure you want to delete this backup? This action cannot be undone.')) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      await backupManager.deleteBackup(backupId);
      await loadBackupData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete backup');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'running':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'failed':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'pending':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string): string => {
    switch (status) {
      case 'completed':
        return '✅';
      case 'running':
        return '🔄';
      case 'failed':
        return '❌';
      case 'pending':
        return '⏳';
      default:
        return '❓';
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString();
  };

  const getDuration = (startTime: string, endTime?: string): string => {
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const duration = end.getTime() - start.getTime();
    
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    
    return `${minutes}m ${seconds}s`;
  };

  if (isLoading && backups.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Backup & Recovery</h1>
              <p className="mt-2 text-gray-600">Manage database backups and restores</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => handleCreateBackup('incremental')}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg transition-colors"
              >
                {isLoading ? 'Creating...' : 'Incremental Backup'}
              </button>
              <button
                onClick={() => handleCreateBackup('full')}
                disabled={isLoading}
                className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-4 py-2 rounded-lg transition-colors"
              >
                {isLoading ? 'Creating...' : 'Full Backup'}
              </button>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        )}

        {/* Statistics */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                </div>
                <div className="ml-4">
                  <div className="text-sm font-medium text-gray-500">Total Backups</div>
                  <div className="text-2xl font-semibold text-gray-900">{stats.totalBackups}</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <div className="text-sm font-medium text-gray-500">Success Rate</div>
                  <div className="text-2xl font-semibold text-gray-900">{stats.successRate.toFixed(1)}%</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                  </svg>
                </div>
                <div className="ml-4">
                  <div className="text-sm font-medium text-gray-500">Total Size</div>
                  <div className="text-2xl font-semibold text-gray-900">{formatBytes(stats.totalSize)}</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <div className="text-sm font-medium text-gray-500">Last Backup</div>
                  <div className="text-sm font-semibold text-gray-900">
                    {stats.lastBackup ? formatDate(stats.lastBackup) : 'Never'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Backups List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Backup History</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {backups.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No backups</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by creating your first backup.</p>
              </div>
            ) : (
              backups.map((backup) => (
                <div key={backup.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="text-2xl">{getStatusIcon(backup.status)}</div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="text-sm font-medium text-gray-900">
                            {backup.type.charAt(0).toUpperCase() + backup.type.slice(1)} Backup
                          </h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(backup.status)}`}>
                            {backup.status}
                          </span>
                        </div>
                        <div className="mt-1 text-sm text-gray-500">
                          Started: {formatDate(backup.startTime)}
                          {backup.endTime && ` • Duration: ${getDuration(backup.startTime, backup.endTime)}`}
                        </div>
                        <div className="mt-1 text-sm text-gray-500">
                          Size: {formatBytes(backup.size)} • Tables: {backup.tables.length}
                        </div>
                        {backup.error && (
                          <div className="mt-1 text-sm text-red-600">
                            Error: {backup.error}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {backup.status === 'completed' && (
                        <>
                          <button
                            onClick={() => handleRestoreBackup(backup.id)}
                            disabled={isLoading}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium disabled:opacity-50"
                          >
                            Restore
                          </button>
                          <button
                            onClick={() => handleDeleteBackup(backup.id)}
                            disabled={isLoading}
                            className="text-red-600 hover:text-red-800 text-sm font-medium disabled:opacity-50"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Refresh Button */}
        <div className="mt-6 flex justify-center">
          <button
            onClick={loadBackupData}
            disabled={isLoading}
            className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors"
          >
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>
    </div>
  );
};
