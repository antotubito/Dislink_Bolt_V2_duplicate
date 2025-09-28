# 🎯 Supabase Database Backup - Example Commands

## 🚀 Quick Start Commands

### 1. Setup Environment

```bash
# Navigate to scripts directory
cd scripts

# Create environment file
cat > .env << EOF
SUPABASE_URL=https://bbonxxvifycwpoeaxsor.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
BACKUP_DIR=./backups
RETENTION_DAYS=30
LOG_LEVEL=info
EOF

# Install dependencies
npm install
```

### 2. Basic Backup Operations

```bash
# Create a new backup
./backup.sh backup

# List all backups
./backup.sh list

# Create backup with custom settings
BACKUP_DIR=/custom/path LOG_LEVEL=debug ./backup.sh backup
```

### 3. Restore Operations

```bash
# List available backups first
./backup.sh list

# Dry run (test without executing)
./backup.sh restore backup_1703123456789 --dry-run

# Restore with confirmation
./backup.sh restore backup_1703123456789 --confirm

# Restore specific tables only
./backup.sh restore backup_1703123456789 --tables profiles,contacts --confirm
```

### 4. Maintenance Operations

```bash
# Clean up old backups
./backup.sh cleanup

# Schedule automatic backups (daily at 2 AM)
./backup.sh schedule "0 2 * * *"

# Schedule every 6 hours
./backup.sh schedule "0 */6 * * *"
```

## 📋 Complete Command Examples

### Environment Setup

```bash
# Option 1: Using .env file
echo "SUPABASE_URL=https://bbonxxvifycwpoeaxsor.supabase.co" > .env
echo "SUPABASE_SERVICE_ROLE_KEY=your_service_role_key" >> .env
echo "BACKUP_DIR=./backups" >> .env
echo "RETENTION_DAYS=30" >> .env
echo "LOG_LEVEL=info" >> .env

# Option 2: Export environment variables
export SUPABASE_URL="https://bbonxxvifycwpoeaxsor.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"
export BACKUP_DIR="./backups"
export RETENTION_DAYS="30"
export LOG_LEVEL="info"
```

### Backup Commands

```bash
# Basic backup
./backup.sh backup

# Backup with debug logging
LOG_LEVEL=debug ./backup.sh backup

# Backup to custom directory
BACKUP_DIR=/path/to/backups ./backup.sh backup

# Backup with custom retention
RETENTION_DAYS=60 ./backup.sh backup
```

### Restore Commands

```bash
# List backups to find ID
./backup.sh list

# Test restore (dry run)
./backup.sh restore backup_1703123456789 --dry-run

# Full restore with confirmation
./backup.sh restore backup_1703123456789 --confirm

# Restore specific tables
./backup.sh restore backup_1703123456789 --tables users,profiles,contacts --confirm

# Restore with custom settings
LOG_LEVEL=debug ./backup.sh restore backup_1703123456789 --confirm
```

### Scheduling Commands

```bash
# Daily backup at 2 AM
./backup.sh schedule "0 2 * * *"

# Every 6 hours
./backup.sh schedule "0 */6 * * *"

# Weekly backup (Sundays at 3 AM)
./backup.sh schedule "0 3 * * 0"

# Monthly backup (1st of month at 4 AM)
./backup.sh schedule "0 4 1 * *"

# Every hour during business hours (9 AM - 5 PM, Mon-Fri)
./backup.sh schedule "0 9-17 * * 1-5"
```

### Maintenance Commands

```bash
# Clean up old backups
./backup.sh cleanup

# Clean up with custom retention
RETENTION_DAYS=7 ./backup.sh cleanup

# List backups before cleanup
./backup.sh list
./backup.sh cleanup
```

## 🔧 Advanced Usage Examples

### Programmatic Usage

```typescript
// backup-example.ts
import { SupabaseBackupManager } from './database-backup'

async function example() {
  const config = {
    supabaseUrl: process.env.SUPABASE_URL!,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    backupDir: './backups',
    retentionDays: 30,
    logLevel: 'info' as const
  }

  const backupManager = new SupabaseBackupManager(config)

  // Create backup
  console.log('Creating backup...')
  const backup = await backupManager.createBackup()
  console.log('Backup created:', backup.id)

  // List all backups
  console.log('Listing backups...')
  const backups = await backupManager.listBackups()
  console.log('Available backups:', backups.length)

  // Restore latest backup
  if (backups.length > 0) {
    console.log('Restoring latest backup...')
    await backupManager.restoreBackup(backups[0].id, { confirm: true })
    console.log('Restore completed')
  }
}

example().catch(console.error)
```

### Docker Usage

```bash
# Build Docker image
docker build -t dislink-backup .

# Run backup
docker run --rm \
  -e SUPABASE_URL=https://bbonxxvifycwpoeaxsor.supabase.co \
  -e SUPABASE_SERVICE_ROLE_KEY=your_service_role_key \
  -v $(pwd)/backups:/app/backups \
  dislink-backup backup

# Run scheduled backups
docker run -d \
  -e SUPABASE_URL=https://bbonxxvifycwpoeaxsor.supabase.co \
  -e SUPABASE_SERVICE_ROLE_KEY=your_service_role_key \
  -v $(pwd)/backups:/app/backups \
  dislink-backup schedule "0 2 * * *"
```

### CI/CD Integration

```yaml
# .github/workflows/backup.yml
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
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: |
          cd scripts
          npm install
          
      - name: Create backup
        run: |
          cd scripts
          SUPABASE_URL=${{ secrets.SUPABASE_URL }} \
          SUPABASE_SERVICE_ROLE_KEY=${{ secrets.SUPABASE_SERVICE_ROLE_KEY }} \
          ./backup.sh backup
          
      - name: Upload backup to S3
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
        run: |
          aws s3 sync ./backups s3://your-backup-bucket/dislink-backups/
```

## 🚨 Troubleshooting Examples

### Common Issues and Solutions

```bash
# Issue: Permission denied
# Solution: Check service role key permissions
./backup.sh backup
# If fails, verify service role key has proper permissions

# Issue: Backup file not found
# Solution: List backups to find correct ID
./backup.sh list
./backup.sh restore backup_1703123456789 --dry-run

# Issue: Large table backup fails
# Solution: Use debug logging to identify the issue
LOG_LEVEL=debug ./backup.sh backup

# Issue: Restore fails on specific table
# Solution: Restore other tables first, then retry failed table
./backup.sh restore backup_1703123456789 --tables users,profiles --confirm
./backup.sh restore backup_1703123456789 --tables contacts --confirm
```

### Recovery Scenarios

```bash
# Scenario 1: Database corruption
# Step 1: List available backups
./backup.sh list

# Step 2: Test restore with dry run
./backup.sh restore backup_1703123456789 --dry-run

# Step 3: Restore with confirmation
./backup.sh restore backup_1703123456789 --confirm

# Scenario 2: Partial data loss
# Step 1: Identify affected tables
# Step 2: Restore specific tables only
./backup.sh restore backup_1703123456789 --tables affected_table1,affected_table2 --confirm

# Scenario 3: Need to restore to different environment
# Step 1: Update environment variables
export SUPABASE_URL="https://staging-project.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="staging_service_role_key"

# Step 2: Restore backup
./backup.sh restore backup_1703123456789 --confirm
```

## 📊 Monitoring Examples

### Log Analysis

```bash
# Run backup with debug logging
LOG_LEVEL=debug ./backup.sh backup 2>&1 | tee backup.log

# Analyze backup performance
grep "Backup completed" backup.log
grep "Table backup completed" backup.log

# Check for errors
grep "ERROR" backup.log
grep "Failed to backup" backup.log
```

### Backup Verification

```bash
# Create backup
./backup.sh backup

# List backups
./backup.sh list

# Test restore (dry run)
BACKUP_ID=$(./backup.sh list | grep "backup_" | head -1 | awk '{print $1}')
./backup.sh restore $BACKUP_ID --dry-run

# Verify backup integrity
ls -la backups/
cat backups/${BACKUP_ID}.metadata.json
```

## 🔒 Security Examples

### Secure Environment Setup

```bash
# Create secure environment file
cat > .env << EOF
SUPABASE_URL=https://bbonxxvifycwpoeaxsor.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
BACKUP_DIR=/secure/backup/location
RETENTION_DAYS=30
LOG_LEVEL=info
EOF

# Set proper permissions
chmod 600 .env
chmod 700 backups/

# Encrypt backup directory
gpg --symmetric --cipher-algo AES256 backups/
```

### Production Deployment

```bash
# Production environment setup
export SUPABASE_URL="https://bbonxxvifycwpoeaxsor.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="production_service_role_key"
export BACKUP_DIR="/var/backups/dislink"
export RETENTION_DAYS="90"
export LOG_LEVEL="warn"

# Create backup directory with proper permissions
sudo mkdir -p /var/backups/dislink
sudo chown $USER:$USER /var/backups/dislink
chmod 700 /var/backups/dislink

# Schedule production backups
./backup.sh schedule "0 2 * * *"
```

These examples provide comprehensive coverage of all backup and restore operations for your Supabase database!
