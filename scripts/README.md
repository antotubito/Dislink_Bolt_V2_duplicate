# 🗄️ Supabase Database Backup & Restore System

A comprehensive Node.js/TypeScript solution for automated Supabase database backup and restore operations with scheduling, error handling, and logging.

## 🚀 Features

- ✅ **Automated Backups** - Create full database backups
- ✅ **Selective Restore** - Restore specific tables or full database
- ✅ **Scheduling** - Cron-based automatic backups
- ✅ **Retention Policy** - Automatic cleanup of old backups
- ✅ **Error Handling** - Comprehensive error logging and recovery
- ✅ **Metadata Tracking** - Backup status and size tracking
- ✅ **Dry Run Mode** - Test restores without executing
- ✅ **Table Filtering** - Backup/restore specific tables only

## 📦 Installation

```bash
# Navigate to scripts directory
cd scripts

# Install dependencies
npm install

# Or using pnpm
pnpm install
```

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the scripts directory:

```bash
# Required
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Optional
BACKUP_DIR=./backups
RETENTION_DAYS=30
LOG_LEVEL=info
```

### Getting Supabase Service Role Key

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **API**
3. Copy the **service_role** key (not the anon key)
4. ⚠️ **Keep this key secure** - it has full database access

## 🎯 Usage Commands

### Create Backup

```bash
# Create a new backup
npm run backup:create

# With custom environment
SUPABASE_URL=https://xxx.supabase.co SUPABASE_SERVICE_ROLE_KEY=xxx npm run backup:create
```

### List Backups

```bash
# List all available backups
npm run backup:list
```

Output example:
```
┌─────────┬─────────────────────┬─────────────────────┬─────────┬────────┬─────────┐
│ (index) │         id          │      timestamp      │  size   │ tables │ status  │
├─────────┼─────────────────────┼─────────────────────┼─────────┼────────┼─────────┤
│    0    │ 'backup_1703123456' │ '2023-12-21T10:30:56.000Z' │ '2.45 MB' │   12   │ 'success' │
│    1    │ 'backup_1703037056' │ '2023-12-20T10:30:56.000Z' │ '2.42 MB' │   12   │ 'success' │
└─────────┴─────────────────────┴─────────────────────┴─────────┴────────┴─────────┘
```

### Restore Backup

```bash
# Restore specific backup (requires confirmation)
npm run backup:restore backup_1703123456 --confirm

# Dry run (test without executing)
npm run backup:restore backup_1703123456 --dry-run

# Restore specific tables only
npm run backup:restore backup_1703123456 --tables users,contacts --confirm

# Restore with confirmation
npm run backup:restore:confirm backup_1703123456
```

### Cleanup Old Backups

```bash
# Remove backups older than retention period
npm run backup:cleanup
```

### Schedule Automatic Backups

```bash
# Schedule daily backups at 2 AM
npm run backup:schedule "0 2 * * *"

# Schedule every 6 hours
npm run backup:schedule "0 */6 * * *"

# Schedule weekly backups (Sundays at 3 AM)
npm run backup:schedule "0 3 * * 0"

# Schedule with custom retention (30 days)
RETENTION_DAYS=30 npm run backup:schedule "0 2 * * *"
```

## 📅 Cron Schedule Examples

| Schedule | Cron Expression | Description |
|----------|----------------|-------------|
| Every hour | `0 * * * *` | Hourly backups |
| Every 6 hours | `0 */6 * * *` | 4 times daily |
| Daily at 2 AM | `0 2 * * *` | Daily backups |
| Weekly (Sunday 3 AM) | `0 3 * * 0` | Weekly backups |
| Monthly (1st at 4 AM) | `0 4 1 * *` | Monthly backups |

## 🔧 Advanced Usage

### Programmatic Usage

```typescript
import { SupabaseBackupManager } from './database-backup'

const config = {
  supabaseUrl: 'https://your-project.supabase.co',
  serviceRoleKey: 'your_service_role_key',
  backupDir: './backups',
  retentionDays: 30,
  logLevel: 'info' as const
}

const backupManager = new SupabaseBackupManager(config)

// Create backup
const backup = await backupManager.createBackup()
console.log('Backup created:', backup.id)

// Restore backup
await backupManager.restoreBackup(backup.id, { confirm: true })

// List backups
const backups = await backupManager.listBackups()
console.log('Available backups:', backups.length)

// Schedule backups
backupManager.scheduleBackups('0 2 * * *') // Daily at 2 AM
```

### Custom Backup Directory

```bash
# Use custom backup directory
BACKUP_DIR=/path/to/backups npm run backup:create
```

### Different Log Levels

```bash
# Debug mode (verbose logging)
LOG_LEVEL=debug npm run backup:create

# Warning and error only
LOG_LEVEL=warn npm run backup:create
```

## 📁 Backup Structure

```
backups/
├── backup_1703123456_profiles.json
├── backup_1703123456_contacts.json
├── backup_1703123456_connection_requests.json
├── backup_1703123456.metadata.json
├── backup_1703037056_profiles.json
├── backup_1703037056_contacts.json
└── backup_1703037056.metadata.json
```

### Metadata File Example

```json
{
  "id": "backup_1703123456",
  "timestamp": "2023-12-21T10:30:56.000Z",
  "size": 2567890,
  "tables": ["profiles", "contacts", "connection_requests"],
  "status": "success"
}
```

## 🚨 Error Handling

### Common Issues

1. **Service Role Key Issues**
   ```
   Error: Invalid API key
   ```
   - Verify you're using the service_role key, not anon key
   - Check the key is correctly copied

2. **Permission Issues**
   ```
   Error: permission denied for table
   ```
   - Ensure service role has proper permissions
   - Check RLS policies

3. **Backup File Not Found**
   ```
   Error: Backup file not found
   ```
   - Verify backup ID exists
   - Check backup directory permissions

### Recovery Procedures

1. **Failed Backup**
   ```bash
   # Check backup status
   npm run backup:list
   
   # Retry backup
   npm run backup:create
   ```

2. **Partial Restore Failure**
   ```bash
   # Restore specific tables that failed
   npm run backup:restore backup_id --tables failed_table1,failed_table2 --confirm
   ```

3. **Corrupted Backup**
   ```bash
   # Use a different backup
   npm run backup:list
   npm run backup:restore backup_older_id --confirm
   ```

## 🔒 Security Considerations

- ✅ **Service Role Key**: Keep secure, never commit to version control
- ✅ **Backup Storage**: Store backups in secure, encrypted location
- ✅ **Access Control**: Limit access to backup files
- ✅ **Network Security**: Use HTTPS for Supabase connections
- ✅ **Retention Policy**: Regularly clean up old backups

## 📊 Monitoring & Logging

### Log Levels

- **debug**: Detailed information for debugging
- **info**: General information about operations
- **warn**: Warning messages for potential issues
- **error**: Error messages for failed operations

### Log Format

```
[2023-12-21T10:30:56.000Z] [INFO] Starting database backup {"backupId":"backup_1703123456","timestamp":"2023-12-21T10:30:56.000Z"}
[2023-12-21T10:30:57.000Z] [DEBUG] Found tables {"tables":["profiles","contacts","connection_requests"]}
[2023-12-21T10:31:00.000Z] [INFO] Backup completed {"backupId":"backup_1703123456","status":"success","successful":3,"failed":0,"size":2567890}
```

## 🚀 Production Deployment

### Docker Deployment

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .

CMD ["npm", "run", "backup:schedule", "0 2 * * *"]
```

### Systemd Service

```ini
[Unit]
Description=Supabase Database Backup
After=network.target

[Service]
Type=simple
User=backup
WorkingDirectory=/opt/dislink-backup
ExecStart=/usr/bin/npm run backup:schedule "0 2 * * *"
Restart=always
Environment=SUPABASE_URL=https://your-project.supabase.co
Environment=SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

[Install]
WantedBy=multi-user.target
```

### CI/CD Integration

```yaml
# GitHub Actions example
name: Database Backup
on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM
  workflow_dispatch:

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: |
          cd scripts
          npm install
          SUPABASE_URL=${{ secrets.SUPABASE_URL }} \
          SUPABASE_SERVICE_ROLE_KEY=${{ secrets.SUPABASE_SERVICE_ROLE_KEY }} \
          npm run backup:create
```

## 📈 Performance Considerations

- **Large Tables**: Consider chunking for tables with >100k records
- **Network**: Use fast, reliable network connection
- **Storage**: Ensure sufficient disk space for backups
- **Timing**: Schedule backups during low-traffic periods
- **Retention**: Balance storage costs with recovery needs

## 🆘 Support

For issues or questions:
1. Check the logs for detailed error messages
2. Verify environment variables are set correctly
3. Test with dry-run mode first
4. Ensure Supabase service role has proper permissions

## 📄 License

MIT License - see LICENSE file for details.
