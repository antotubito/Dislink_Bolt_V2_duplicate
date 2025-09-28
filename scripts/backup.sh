#!/bin/bash

# Supabase Database Backup Script
# Usage: ./backup.sh [command] [options]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required environment variables are set
check_env() {
    if [ -z "$SUPABASE_URL" ]; then
        print_error "SUPABASE_URL environment variable is required"
        exit 1
    fi
    
    if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
        print_error "SUPABASE_SERVICE_ROLE_KEY environment variable is required"
        exit 1
    fi
}

# Load environment variables from .env file if it exists
if [ -f ".env" ]; then
    print_status "Loading environment variables from .env file"
    export $(cat .env | grep -v '^#' | xargs)
fi

# Check if Node.js and npm are installed
check_dependencies() {
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed"
        exit 1
    fi
}

# Install dependencies if node_modules doesn't exist
install_deps() {
    if [ ! -d "node_modules" ]; then
        print_status "Installing dependencies..."
        npm install
    fi
}

# Main function
main() {
    local command=$1
    shift
    
    print_status "Supabase Database Backup Manager"
    print_status "Command: $command"
    
    check_dependencies
    install_deps
    check_env
    
    case $command in
        "backup"|"create")
            print_status "Creating database backup..."
            npm run backup:create
            print_success "Backup completed successfully"
            ;;
            
        "restore")
            local backup_id=$1
            if [ -z "$backup_id" ]; then
                print_error "Backup ID is required for restore command"
                print_status "Usage: $0 restore <backup-id> [--confirm] [--dry-run] [--tables table1,table2]"
                exit 1
            fi
            
            print_status "Restoring backup: $backup_id"
            npm run backup:restore "$backup_id" "$@"
            print_success "Restore completed successfully"
            ;;
            
        "list")
            print_status "Listing available backups..."
            npm run backup:list
            ;;
            
        "cleanup")
            print_status "Cleaning up old backups..."
            npm run backup:cleanup
            print_success "Cleanup completed successfully"
            ;;
            
        "schedule")
            local cron_expr=${1:-"0 2 * * *"}
            print_status "Scheduling automatic backups with cron: $cron_expr"
            print_warning "Press Ctrl+C to stop the scheduler"
            npm run backup:schedule "$cron_expr"
            ;;
            
        "help"|"--help"|"-h"|"")
            echo "Supabase Database Backup Manager"
            echo ""
            echo "Usage: $0 <command> [options]"
            echo ""
            echo "Commands:"
            echo "  backup, create              Create a new database backup"
            echo "  restore <backup-id>         Restore from backup"
            echo "  list                        List available backups"
            echo "  cleanup                     Clean up old backups"
            echo "  schedule [cron]             Schedule automatic backups"
            echo "  help                        Show this help message"
            echo ""
            echo "Restore Options:"
            echo "  --confirm                   Confirm restore operation"
            echo "  --dry-run                   Test restore without executing"
            echo "  --tables table1,table2      Restore specific tables only"
            echo ""
            echo "Environment Variables:"
            echo "  SUPABASE_URL                Supabase project URL"
            echo "  SUPABASE_SERVICE_ROLE_KEY   Supabase service role key"
            echo "  BACKUP_DIR                  Backup directory (default: ./backups)"
            echo "  RETENTION_DAYS              Days to keep backups (default: 30)"
            echo "  LOG_LEVEL                   Log level: debug, info, warn, error"
            echo ""
            echo "Examples:"
            echo "  $0 backup"
            echo "  $0 restore backup_1234567890 --confirm"
            echo "  $0 restore backup_1234567890 --dry-run"
            echo "  $0 restore backup_1234567890 --tables users,contacts --confirm"
            echo "  $0 schedule \"0 2 * * *\""
            echo "  $0 list"
            echo "  $0 cleanup"
            ;;
            
        *)
            print_error "Unknown command: $command"
            print_status "Use '$0 help' for usage information"
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"
