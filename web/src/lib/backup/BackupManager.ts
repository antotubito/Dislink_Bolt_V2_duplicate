/**
 * Backup and Recovery System
 * Automated backup and recovery for database, files, and application state
 */

import { supabase } from '@dislink/shared/lib/supabase';

interface BackupConfig {
  schedule: 'hourly' | 'daily' | 'weekly' | 'monthly';
  retention: number; // Number of backups to keep
  compression: boolean;
  encryption: boolean;
  storage: 'local' | 's3' | 'gcs' | 'azure';
  storageConfig?: {
    bucket?: string;
    region?: string;
    accessKey?: string;
    secretKey?: string;
  };
}

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

class BackupManager {
  private config: BackupConfig;
  private jobs: Map<string, BackupJob> = new Map();
  private restoreJobs: Map<string, RestoreJob> = new Map();
  private scheduler: NodeJS.Timeout | null = null;

  constructor(config: BackupConfig) {
    this.config = {
      compression: true,
      encryption: false,
      storage: 'local',
      ...config
    };
  }

  /**
   * Initialize backup manager
   */
  async initialize(): Promise<void> {
    console.log('🔄 Initializing Backup Manager...');
    
    // Load existing jobs from database
    await this.loadJobs();
    
    // Start scheduler
    this.startScheduler();
    
    console.log('✅ Backup Manager initialized');
  }

  /**
   * Create a full backup
   */
  async createFullBackup(tables?: string[]): Promise<string> {
    const jobId = this.generateJobId();
    const startTime = new Date().toISOString();

    const job: BackupJob = {
      id: jobId,
      type: 'full',
      status: 'pending',
      startTime,
      size: 0,
      tables: tables || await this.getAllTables(),
      metadata: {
        config: this.config,
        version: '1.0.0'
      }
    };

    this.jobs.set(jobId, job);
    await this.saveJob(job);

    // Start backup process
    this.executeBackup(jobId).catch(error => {
      console.error('Backup execution failed:', error);
    });

    return jobId;
  }

  /**
   * Create an incremental backup
   */
  async createIncrementalBackup(tables?: string[]): Promise<string> {
    const jobId = this.generateJobId();
    const startTime = new Date().toISOString();

    const job: BackupJob = {
      id: jobId,
      type: 'incremental',
      status: 'pending',
      startTime,
      size: 0,
      tables: tables || await this.getAllTables(),
      metadata: {
        config: this.config,
        version: '1.0.0',
        lastBackup: await this.getLastBackupTime()
      }
    };

    this.jobs.set(jobId, job);
    await this.saveJob(job);

    // Start backup process
    this.executeBackup(jobId).catch(error => {
      console.error('Backup execution failed:', error);
    });

    return jobId;
  }

  /**
   * Restore from backup
   */
  async restoreFromBackup(backupId: string, tables?: string[]): Promise<string> {
    const backup = this.jobs.get(backupId);
    if (!backup) {
      throw new Error(`Backup ${backupId} not found`);
    }

    if (backup.status !== 'completed') {
      throw new Error(`Backup ${backupId} is not completed`);
    }

    const restoreJobId = this.generateJobId();
    const startTime = new Date().toISOString();

    const restoreJob: RestoreJob = {
      id: restoreJobId,
      backupId,
      status: 'pending',
      startTime,
      tables: tables || backup.tables
    };

    this.restoreJobs.set(restoreJobId, restoreJob);
    await this.saveRestoreJob(restoreJob);

    // Start restore process
    this.executeRestore(restoreJobId).catch(error => {
      console.error('Restore execution failed:', error);
    });

    return restoreJobId;
  }

  /**
   * Get backup status
   */
  getBackupStatus(jobId: string): BackupJob | null {
    return this.jobs.get(jobId) || null;
  }

  /**
   * Get restore status
   */
  getRestoreStatus(jobId: string): RestoreJob | null {
    return this.restoreJobs.get(jobId) || null;
  }

  /**
   * List all backups
   */
  listBackups(): BackupJob[] {
    return Array.from(this.jobs.values()).sort((a, b) => 
      new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    );
  }

  /**
   * Delete backup
   */
  async deleteBackup(jobId: string): Promise<boolean> {
    const job = this.jobs.get(jobId);
    if (!job) {
      return false;
    }

    try {
      // Delete backup files
      await this.deleteBackupFiles(jobId);
      
      // Remove from database
      await this.deleteJob(jobId);
      
      // Remove from memory
      this.jobs.delete(jobId);
      
      return true;
    } catch (error) {
      console.error('Failed to delete backup:', error);
      return false;
    }
  }

  /**
   * Get backup statistics
   */
  getBackupStats(): {
    totalBackups: number;
    totalSize: number;
    lastBackup: string | null;
    successRate: number;
    averageSize: number;
  } {
    const backups = Array.from(this.jobs.values());
    const completedBackups = backups.filter(b => b.status === 'completed');
    
    const totalSize = completedBackups.reduce((sum, b) => sum + b.size, 0);
    const successRate = backups.length > 0 ? (completedBackups.length / backups.length) * 100 : 0;
    const averageSize = completedBackups.length > 0 ? totalSize / completedBackups.length : 0;
    
    const lastBackup = completedBackups.length > 0 
      ? completedBackups.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())[0].startTime
      : null;

    return {
      totalBackups: backups.length,
      totalSize,
      lastBackup,
      successRate,
      averageSize
    };
  }

  /**
   * Execute backup job
   */
  private async executeBackup(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) {
      return;
    }

    try {
      // Update status to running
      job.status = 'running';
      await this.saveJob(job);

      console.log(`🔄 Starting backup job ${jobId}...`);

      // Export data from each table
      const backupData: Record<string, any[]> = {};
      let totalSize = 0;

      for (const table of job.tables) {
        console.log(`📊 Backing up table: ${table}`);
        
        const { data, error } = await supabase
          .from(table)
          .select('*');

        if (error) {
          throw new Error(`Failed to backup table ${table}: ${error.message}`);
        }

        backupData[table] = data || [];
        totalSize += JSON.stringify(data).length;
      }

      // Compress if enabled
      let processedData = backupData;
      if (this.config.compression) {
        // In a real implementation, you would compress the data
        processedData = { compressed: true, data: backupData };
      }

      // Encrypt if enabled
      if (this.config.encryption) {
        // In a real implementation, you would encrypt the data
        processedData = { encrypted: true, data: processedData };
      }

      // Store backup
      await this.storeBackup(jobId, processedData);

      // Update job status
      job.status = 'completed';
      job.endTime = new Date().toISOString();
      job.size = totalSize;
      await this.saveJob(job);

      console.log(`✅ Backup job ${jobId} completed successfully`);

      // Cleanup old backups
      await this.cleanupOldBackups();

    } catch (error) {
      console.error(`❌ Backup job ${jobId} failed:`, error);
      
      job.status = 'failed';
      job.endTime = new Date().toISOString();
      job.error = error instanceof Error ? error.message : 'Unknown error';
      await this.saveJob(job);
    }
  }

  /**
   * Execute restore job
   */
  private async executeRestore(restoreJobId: string): Promise<void> {
    const restoreJob = this.restoreJobs.get(restoreJobId);
    if (!restoreJob) {
      return;
    }

    try {
      // Update status to running
      restoreJob.status = 'running';
      await this.saveRestoreJob(restoreJob);

      console.log(`🔄 Starting restore job ${restoreJobId}...`);

      // Load backup data
      const backupData = await this.loadBackup(restoreJob.backupId);
      if (!backupData) {
        throw new Error(`Backup data not found for ${restoreJob.backupId}`);
      }

      // Restore each table
      for (const table of restoreJob.tables) {
        console.log(`📊 Restoring table: ${table}`);
        
        if (!backupData[table]) {
          console.warn(`No data found for table ${table} in backup`);
          continue;
        }

        // Clear existing data
        const { error: deleteError } = await supabase
          .from(table)
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records

        if (deleteError) {
          console.warn(`Failed to clear table ${table}:`, deleteError);
        }

        // Insert backup data
        if (backupData[table].length > 0) {
          const { error: insertError } = await supabase
            .from(table)
            .insert(backupData[table]);

          if (insertError) {
            throw new Error(`Failed to restore table ${table}: ${insertError.message}`);
          }
        }
      }

      // Update restore job status
      restoreJob.status = 'completed';
      restoreJob.endTime = new Date().toISOString();
      await this.saveRestoreJob(restoreJob);

      console.log(`✅ Restore job ${restoreJobId} completed successfully`);

    } catch (error) {
      console.error(`❌ Restore job ${restoreJobId} failed:`, error);
      
      restoreJob.status = 'failed';
      restoreJob.endTime = new Date().toISOString();
      restoreJob.error = error instanceof Error ? error.message : 'Unknown error';
      await this.saveRestoreJob(restoreJob);
    }
  }

  /**
   * Get all database tables
   */
  private async getAllTables(): Promise<string[]> {
    // In a real implementation, you would query the database schema
    // For now, we'll return common tables
    return [
      'profiles',
      'connections',
      'analytics_events',
      'user_journeys',
      'experiments',
      'experiment_assignments',
      'experiment_conversions'
    ];
  }

  /**
   * Get last backup time
   */
  private async getLastBackupTime(): Promise<string | null> {
    const backups = Array.from(this.jobs.values())
      .filter(b => b.status === 'completed')
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

    return backups.length > 0 ? backups[0].startTime : null;
  }

  /**
   * Store backup data
   */
  private async storeBackup(jobId: string, data: any): Promise<void> {
    // In a real implementation, you would store to the configured storage
    // For now, we'll store in Supabase as a fallback
    
    const { error } = await supabase
      .from('backups')
      .insert([{
        id: jobId,
        data: data,
        created_at: new Date().toISOString()
      }]);

    if (error) {
      throw new Error(`Failed to store backup: ${error.message}`);
    }
  }

  /**
   * Load backup data
   */
  private async loadBackup(jobId: string): Promise<any> {
    const { data, error } = await supabase
      .from('backups')
      .select('data')
      .eq('id', jobId)
      .single();

    if (error || !data) {
      throw new Error(`Backup ${jobId} not found`);
    }

    return data.data;
  }

  /**
   * Delete backup files
   */
  private async deleteBackupFiles(jobId: string): Promise<void> {
    const { error } = await supabase
      .from('backups')
      .delete()
      .eq('id', jobId);

    if (error) {
      throw new Error(`Failed to delete backup files: ${error.message}`);
    }
  }

  /**
   * Start backup scheduler
   */
  private startScheduler(): void {
    if (this.scheduler) {
      clearInterval(this.scheduler);
    }

    const interval = this.getScheduleInterval();
    this.scheduler = setInterval(() => {
      this.scheduledBackup().catch(error => {
        console.error('Scheduled backup failed:', error);
      });
    }, interval);

    console.log(`⏰ Backup scheduler started (${this.config.schedule})`);
  }

  /**
   * Get schedule interval in milliseconds
   */
  private getScheduleInterval(): number {
    switch (this.config.schedule) {
      case 'hourly':
        return 60 * 60 * 1000; // 1 hour
      case 'daily':
        return 24 * 60 * 60 * 1000; // 24 hours
      case 'weekly':
        return 7 * 24 * 60 * 60 * 1000; // 7 days
      case 'monthly':
        return 30 * 24 * 60 * 60 * 1000; // 30 days
      default:
        return 24 * 60 * 60 * 1000; // Default to daily
    }
  }

  /**
   * Execute scheduled backup
   */
  private async scheduledBackup(): Promise<void> {
    console.log('🔄 Executing scheduled backup...');
    
    try {
      await this.createIncrementalBackup();
    } catch (error) {
      console.error('Scheduled backup failed:', error);
    }
  }

  /**
   * Cleanup old backups
   */
  private async cleanupOldBackups(): Promise<void> {
    const backups = Array.from(this.jobs.values())
      .filter(b => b.status === 'completed')
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

    if (backups.length > this.config.retention) {
      const toDelete = backups.slice(this.config.retention);
      
      for (const backup of toDelete) {
        await this.deleteBackup(backup.id);
      }
      
      console.log(`🗑️ Cleaned up ${toDelete.length} old backups`);
    }
  }

  /**
   * Generate unique job ID
   */
  private generateJobId(): string {
    return `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Save job to database
   */
  private async saveJob(job: BackupJob): Promise<void> {
    const { error } = await supabase
      .from('backup_jobs')
      .upsert([{
        id: job.id,
        type: job.type,
        status: job.status,
        start_time: job.startTime,
        end_time: job.endTime,
        size: job.size,
        tables: job.tables,
        error: job.error,
        metadata: job.metadata
      }]);

    if (error) {
      console.error('Failed to save backup job:', error);
    }
  }

  /**
   * Save restore job to database
   */
  private async saveRestoreJob(job: RestoreJob): Promise<void> {
    const { error } = await supabase
      .from('restore_jobs')
      .upsert([{
        id: job.id,
        backup_id: job.backupId,
        status: job.status,
        start_time: job.startTime,
        end_time: job.endTime,
        tables: job.tables,
        error: job.error
      }]);

    if (error) {
      console.error('Failed to save restore job:', error);
    }
  }

  /**
   * Load jobs from database
   */
  private async loadJobs(): Promise<void> {
    try {
      // Load backup jobs
      const { data: backupJobs, error: backupError } = await supabase
        .from('backup_jobs')
        .select('*');

      if (!backupError && backupJobs) {
        backupJobs.forEach(job => {
          this.jobs.set(job.id, {
            id: job.id,
            type: job.type,
            status: job.status,
            startTime: job.start_time,
            endTime: job.end_time,
            size: job.size,
            tables: job.tables,
            error: job.error,
            metadata: job.metadata
          });
        });
      }

      // Load restore jobs
      const { data: restoreJobs, error: restoreError } = await supabase
        .from('restore_jobs')
        .select('*');

      if (!restoreError && restoreJobs) {
        restoreJobs.forEach(job => {
          this.restoreJobs.set(job.id, {
            id: job.id,
            backupId: job.backup_id,
            status: job.status,
            startTime: job.start_time,
            endTime: job.end_time,
            tables: job.tables,
            error: job.error
          });
        });
      }
    } catch (error) {
      console.error('Failed to load jobs:', error);
    }
  }

  /**
   * Delete job from database
   */
  private async deleteJob(jobId: string): Promise<void> {
    const { error } = await supabase
      .from('backup_jobs')
      .delete()
      .eq('id', jobId);

    if (error) {
      console.error('Failed to delete backup job:', error);
    }
  }

  /**
   * Shutdown backup manager
   */
  async shutdown(): Promise<void> {
    if (this.scheduler) {
      clearInterval(this.scheduler);
      this.scheduler = null;
    }
    
    console.log('🔄 Backup Manager shutdown');
  }
}

// Create backup manager instance
export const backupManager = new BackupManager({
  schedule: 'daily',
  retention: 7,
  compression: true,
  encryption: false,
  storage: 'local'
});

export { BackupManager };
export type { BackupConfig, BackupJob, RestoreJob };
