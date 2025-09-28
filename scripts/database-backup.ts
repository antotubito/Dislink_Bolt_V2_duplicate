#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'
import path from 'path'
import { z } from 'zod'
import cron from 'node-cron'

const execAsync = promisify(exec)

// Environment validation schema
const envSchema = z.object({
    SUPABASE_URL: z.string().url(),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
    BACKUP_DIR: z.string().default('./backups'),
    RETENTION_DAYS: z.string().transform(Number).default(30),
    LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
})

// Configuration interface
interface BackupConfig {
    supabaseUrl: string
    serviceRoleKey: string
    backupDir: string
    retentionDays: number
    logLevel: 'debug' | 'info' | 'warn' | 'error'
}

// Backup metadata interface
interface BackupMetadata {
    id: string
    timestamp: string
    size: number
    tables: string[]
    status: 'success' | 'failed' | 'partial'
    error?: string
}

// Logger class
class Logger {
    private level: string

    constructor(level: 'debug' | 'info' | 'warn' | 'error' = 'info') {
        this.level = level
    }

    private shouldLog(level: string): boolean {
        const levels = ['debug', 'info', 'warn', 'error']
        return levels.indexOf(level) >= levels.indexOf(this.level)
    }

    private formatMessage(level: string, message: string, meta?: any): string {
        const timestamp = new Date().toISOString()
        const metaStr = meta ? ` ${JSON.stringify(meta)}` : ''
        return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}`
    }

    debug(message: string, meta?: any) {
        if (this.shouldLog('debug')) {
            console.log(this.formatMessage('debug', message, meta))
        }
    }

    info(message: string, meta?: any) {
        if (this.shouldLog('info')) {
            console.log(this.formatMessage('info', message, meta))
        }
    }

    warn(message: string, meta?: any) {
        if (this.shouldLog('warn')) {
            console.warn(this.formatMessage('warn', message, meta))
        }
    }

    error(message: string, meta?: any) {
        if (this.shouldLog('error')) {
            console.error(this.formatMessage('error', message, meta))
        }
    }
}

// Database backup and restore class
class SupabaseBackupManager {
    private config: BackupConfig
    private logger: Logger
    private supabase: any

    constructor(config: BackupConfig) {
        this.config = config
        this.logger = new Logger(config.logLevel)
        this.supabase = createClient(config.supabaseUrl, config.serviceRoleKey)
    }

    /**
     * Create a backup of the Supabase database
     */
    async createBackup(): Promise<BackupMetadata> {
        const backupId = `backup_${Date.now()}`
        const timestamp = new Date().toISOString()

        this.logger.info('Starting database backup', { backupId, timestamp })

        try {
            // Ensure backup directory exists
            await this.ensureBackupDirectory()

            // Get list of tables
            const tables = await this.getTableList()
            this.logger.debug('Found tables', { tables })

            // Create backup for each table
            const backupResults = await Promise.allSettled(
                tables.map(table => this.backupTable(table, backupId))
            )

            // Analyze results
            const successful = backupResults.filter(r => r.status === 'fulfilled').length
            const failed = backupResults.filter(r => r.status === 'rejected').length

            const status = failed === 0 ? 'success' : failed === tables.length ? 'failed' : 'partial'

            const metadata: BackupMetadata = {
                id: backupId,
                timestamp,
                size: await this.calculateBackupSize(backupId),
                tables,
                status,
                error: failed > 0 ? `${failed} tables failed to backup` : undefined
            }

            // Save metadata
            await this.saveBackupMetadata(backupId, metadata)

            // Log errors for failed backups
            backupResults.forEach((result, index) => {
                if (result.status === 'rejected') {
                    this.logger.error(`Failed to backup table: ${tables[index]}`, {
                        error: result.reason
                    })
                }
            })

            this.logger.info('Backup completed', {
                backupId,
                status,
                successful,
                failed,
                size: metadata.size
            })

            return metadata

        } catch (error) {
            this.logger.error('Backup failed', { backupId, error: error.message })
            throw error
        }
    }

    /**
     * Restore database from a backup
     */
    async restoreBackup(backupId: string, options: {
        confirm?: boolean
        tables?: string[]
        dryRun?: boolean
    } = {}): Promise<void> {
        this.logger.info('Starting database restore', { backupId, options })

        try {
            // Load backup metadata
            const metadata = await this.loadBackupMetadata(backupId)
            if (!metadata) {
                throw new Error(`Backup ${backupId} not found`)
            }

            if (metadata.status === 'failed') {
                throw new Error(`Cannot restore from failed backup: ${metadata.error}`)
            }

            // Confirmation check
            if (!options.confirm && !options.dryRun) {
                throw new Error('Restore requires confirmation. Use --confirm flag or --dry-run for testing')
            }

            const tablesToRestore = options.tables || metadata.tables
            this.logger.info('Tables to restore', { tables: tablesToRestore })

            if (options.dryRun) {
                this.logger.info('DRY RUN: Would restore tables', { tables: tablesToRestore })
                return
            }

            // Restore each table
            const restoreResults = await Promise.allSettled(
                tablesToRestore.map(table => this.restoreTable(table, backupId))
            )

            // Analyze results
            const successful = restoreResults.filter(r => r.status === 'fulfilled').length
            const failed = restoreResults.filter(r => r.status === 'rejected').length

            // Log errors for failed restores
            restoreResults.forEach((result, index) => {
                if (result.status === 'rejected') {
                    this.logger.error(`Failed to restore table: ${tablesToRestore[index]}`, {
                        error: result.reason
                    })
                }
            })

            this.logger.info('Restore completed', {
                backupId,
                successful,
                failed,
                total: tablesToRestore.length
            })

            if (failed > 0) {
                throw new Error(`${failed} tables failed to restore`)
            }

        } catch (error) {
            this.logger.error('Restore failed', { backupId, error: error.message })
            throw error
        }
    }

    /**
     * List available backups
     */
    async listBackups(): Promise<BackupMetadata[]> {
        try {
            const backupDir = this.config.backupDir
            const files = await fs.readdir(backupDir)
            const metadataFiles = files.filter(f => f.endsWith('.metadata.json'))

            const backups = await Promise.all(
                metadataFiles.map(async (file) => {
                    const backupId = file.replace('.metadata.json', '')
                    return await this.loadBackupMetadata(backupId)
                })
            )

            return backups.filter(Boolean).sort((a, b) =>
                new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            )

        } catch (error) {
            this.logger.error('Failed to list backups', { error: error.message })
            throw error
        }
    }

    /**
     * Clean up old backups based on retention policy
     */
    async cleanupOldBackups(): Promise<void> {
        this.logger.info('Starting backup cleanup', { retentionDays: this.config.retentionDays })

        try {
            const backups = await this.listBackups()
            const cutoffDate = new Date()
            cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays)

            const oldBackups = backups.filter(backup =>
                new Date(backup.timestamp) < cutoffDate
            )

            this.logger.info('Found old backups to clean up', { count: oldBackups.length })

            for (const backup of oldBackups) {
                await this.deleteBackup(backup.id)
                this.logger.info('Deleted old backup', { backupId: backup.id })
            }

            this.logger.info('Backup cleanup completed', { deleted: oldBackups.length })

        } catch (error) {
            this.logger.error('Backup cleanup failed', { error: error.message })
            throw error
        }
    }

    /**
     * Schedule automatic backups
     */
    scheduleBackups(cronExpression: string): void {
        this.logger.info('Scheduling automatic backups', { cronExpression })

        cron.schedule(cronExpression, async () => {
            try {
                this.logger.info('Running scheduled backup')
                await this.createBackup()
                await this.cleanupOldBackups()
            } catch (error) {
                this.logger.error('Scheduled backup failed', { error: error.message })
            }
        })

        this.logger.info('Backup schedule activated')
    }

    // Private helper methods

    private async ensureBackupDirectory(): Promise<void> {
        try {
            await fs.access(this.config.backupDir)
        } catch {
            await fs.mkdir(this.config.backupDir, { recursive: true })
            this.logger.debug('Created backup directory', { dir: this.config.backupDir })
        }
    }

    private async getTableList(): Promise<string[]> {
        const { data, error } = await this.supabase
            .from('information_schema.tables')
            .select('table_name')
            .eq('table_schema', 'public')
            .neq('table_name', 'spatial_ref_sys')

        if (error) {
            throw new Error(`Failed to get table list: ${error.message}`)
        }

        return data.map((row: any) => row.table_name)
    }

    private async backupTable(tableName: string, backupId: string): Promise<void> {
        this.logger.debug('Backing up table', { table: tableName, backupId })

        try {
            // Get all data from table
            const { data, error } = await this.supabase
                .from(tableName)
                .select('*')

            if (error) {
                throw new Error(`Failed to fetch data from ${tableName}: ${error.message}`)
            }

            // Save to file
            const filePath = path.join(this.config.backupDir, `${backupId}_${tableName}.json`)
            await fs.writeFile(filePath, JSON.stringify(data, null, 2))

            this.logger.debug('Table backup completed', {
                table: tableName,
                records: data.length,
                filePath
            })

        } catch (error) {
            this.logger.error(`Failed to backup table ${tableName}`, { error: error.message })
            throw error
        }
    }

    private async restoreTable(tableName: string, backupId: string): Promise<void> {
        this.logger.debug('Restoring table', { table: tableName, backupId })

        try {
            const filePath = path.join(this.config.backupDir, `${backupId}_${tableName}.json`)

            // Check if backup file exists
            try {
                await fs.access(filePath)
            } catch {
                throw new Error(`Backup file not found: ${filePath}`)
            }

            // Read backup data
            const fileContent = await fs.readFile(filePath, 'utf-8')
            const data = JSON.parse(fileContent)

            if (!Array.isArray(data)) {
                throw new Error(`Invalid backup data format for table ${tableName}`)
            }

            // Clear existing data (optional - you might want to merge instead)
            const { error: deleteError } = await this.supabase
                .from(tableName)
                .delete()
                .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all records

            if (deleteError) {
                this.logger.warn(`Failed to clear table ${tableName}`, { error: deleteError.message })
            }

            // Insert backup data
            if (data.length > 0) {
                const { error: insertError } = await this.supabase
                    .from(tableName)
                    .insert(data)

                if (insertError) {
                    throw new Error(`Failed to insert data into ${tableName}: ${insertError.message}`)
                }
            }

            this.logger.debug('Table restore completed', {
                table: tableName,
                records: data.length
            })

        } catch (error) {
            this.logger.error(`Failed to restore table ${tableName}`, { error: error.message })
            throw error
        }
    }

    private async calculateBackupSize(backupId: string): Promise<number> {
        try {
            const backupDir = this.config.backupDir
            const files = await fs.readdir(backupDir)
            const backupFiles = files.filter(f => f.startsWith(backupId))

            let totalSize = 0
            for (const file of backupFiles) {
                const filePath = path.join(backupDir, file)
                const stats = await fs.stat(filePath)
                totalSize += stats.size
            }

            return totalSize
        } catch {
            return 0
        }
    }

    private async saveBackupMetadata(backupId: string, metadata: BackupMetadata): Promise<void> {
        const filePath = path.join(this.config.backupDir, `${backupId}.metadata.json`)
        await fs.writeFile(filePath, JSON.stringify(metadata, null, 2))
    }

    private async loadBackupMetadata(backupId: string): Promise<BackupMetadata | null> {
        try {
            const filePath = path.join(this.config.backupDir, `${backupId}.metadata.json`)
            const content = await fs.readFile(filePath, 'utf-8')
            return JSON.parse(content)
        } catch {
            return null
        }
    }

    private async deleteBackup(backupId: string): Promise<void> {
        const backupDir = this.config.backupDir
        const files = await fs.readdir(backupDir)
        const backupFiles = files.filter(f => f.startsWith(backupId))

        for (const file of backupFiles) {
            const filePath = path.join(backupDir, file)
            await fs.unlink(filePath)
        }
    }
}

// CLI interface
async function main() {
    const args = process.argv.slice(2)
    const command = args[0]

    try {
        // Parse environment variables
        const env = envSchema.parse(process.env)
        const config: BackupConfig = {
            supabaseUrl: env.SUPABASE_URL,
            serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
            backupDir: env.BACKUP_DIR,
            retentionDays: env.RETENTION_DAYS,
            logLevel: env.LOG_LEVEL,
        }

        const backupManager = new SupabaseBackupManager(config)

        switch (command) {
            case 'backup':
                await backupManager.createBackup()
                break

            case 'restore':
                const backupId = args[1]
                if (!backupId) {
                    throw new Error('Backup ID is required for restore command')
                }

                const options = {
                    confirm: args.includes('--confirm'),
                    dryRun: args.includes('--dry-run'),
                    tables: args.includes('--tables') ?
                        args[args.indexOf('--tables') + 1]?.split(',') : undefined
                }

                await backupManager.restoreBackup(backupId, options)
                break

            case 'list':
                const backups = await backupManager.listBackups()
                console.table(backups.map(b => ({
                    id: b.id,
                    timestamp: b.timestamp,
                    size: `${(b.size / 1024 / 1024).toFixed(2)} MB`,
                    tables: b.tables.length,
                    status: b.status
                })))
                break

            case 'cleanup':
                await backupManager.cleanupOldBackups()
                break

            case 'schedule':
                const cronExpression = args[1] || '0 2 * * *' // Daily at 2 AM
                backupManager.scheduleBackups(cronExpression)

                // Keep the process running
                process.on('SIGINT', () => {
                    console.log('\nShutting down backup scheduler...')
                    process.exit(0)
                })
                break

            default:
                console.log(`
Supabase Database Backup Manager

Usage:
  npm run backup:create                    Create a new backup
  npm run backup:restore <backup-id>       Restore from backup
  npm run backup:restore <backup-id> --confirm  Restore with confirmation
  npm run backup:restore <backup-id> --dry-run  Test restore without executing
  npm run backup:restore <backup-id> --tables table1,table2  Restore specific tables
  npm run backup:list                      List available backups
  npm run backup:cleanup                   Clean up old backups
  npm run backup:schedule [cron]           Schedule automatic backups

Environment Variables:
  SUPABASE_URL                            Supabase project URL
  SUPABASE_SERVICE_ROLE_KEY               Supabase service role key
  BACKUP_DIR                              Backup directory (default: ./backups)
  RETENTION_DAYS                          Days to keep backups (default: 30)
  LOG_LEVEL                               Log level: debug, info, warn, error (default: info)

Examples:
  SUPABASE_URL=https://xxx.supabase.co SUPABASE_SERVICE_ROLE_KEY=xxx npm run backup:create
  npm run backup:restore backup_1234567890 --confirm
  npm run backup:schedule "0 2 * * *"  # Daily at 2 AM
        `)
        }

    } catch (error) {
        console.error('Error:', error.message)
        process.exit(1)
    }
}

// Run if called directly
if (require.main === module) {
    main()
}

export { SupabaseBackupManager, BackupConfig, BackupMetadata }
