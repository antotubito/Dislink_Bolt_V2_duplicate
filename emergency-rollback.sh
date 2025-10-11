#!/bin/bash

# =====================================================
# EMERGENCY ROLLBACK SCRIPT FOR QR CODE MIGRATION
# =====================================================
# This script provides quick rollback options

set -e  # Exit on any error

echo "🚨 EMERGENCY QR CODE MIGRATION ROLLBACK"
echo "======================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "fix_connection_codes_rls.sql" ]; then
    print_error "fix_connection_codes_rls.sql not found. Please run from project root."
    exit 1
fi

echo ""
echo "Select rollback method:"
echo "1. Quick rollback (revert git commit)"
echo "2. Database rollback (revert RLS policies)"
echo "3. Full rollback (both git and database)"
echo "4. Emergency disable RLS (temporary)"
echo "5. Show current status"
echo ""

read -p "Enter your choice (1-5): " choice

case $choice in
    1)
        print_warning "Performing quick git rollback..."
        
        # Get the last commit hash
        LAST_COMMIT=$(git log -1 --pretty=format:"%H")
        print_status "Last commit: $LAST_COMMIT"
        
        # Confirm rollback
        read -p "Are you sure you want to revert the last commit? (y/N): " confirm
        if [[ $confirm == [yY] || $confirm == [yY][eE][sS] ]]; then
            git revert HEAD --no-edit
            git push origin main
            print_status "Git rollback completed. Changes pushed to main."
        else
            print_warning "Git rollback cancelled."
        fi
        ;;
        
    2)
        print_warning "Performing database rollback..."
        
        # Check if rollback script exists
        if [ ! -f "rollback-qr-migration.sql" ]; then
            print_error "rollback-qr-migration.sql not found!"
            exit 1
        fi
        
        print_status "Rollback script found. Please run in Supabase SQL editor:"
        echo "   rollback-qr-migration.sql"
        print_warning "Manual step required: Execute the SQL script in Supabase"
        ;;
        
    3)
        print_warning "Performing full rollback (git + database)..."
        
        # Git rollback
        LAST_COMMIT=$(git log -1 --pretty=format:"%H")
        print_status "Reverting git commit: $LAST_COMMIT"
        
        read -p "Confirm git rollback? (y/N): " confirm
        if [[ $confirm == [yY] || $confirm == [yY][eE][sS] ]]; then
            git revert HEAD --no-edit
            git push origin main
            print_status "Git rollback completed."
        fi
        
        # Database rollback
        print_warning "Database rollback required. Please run in Supabase SQL editor:"
        echo "   rollback-qr-migration.sql"
        ;;
        
    4)
        print_error "EMERGENCY: Disabling RLS temporarily..."
        print_warning "This is NOT recommended for production!"
        
        cat << 'EOF'
-- EMERGENCY RLS DISABLE (run in Supabase SQL editor)
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE connection_codes DISABLE ROW LEVEL SECURITY;

-- Re-enable after fixing issues:
-- ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE connection_codes ENABLE ROW LEVEL SECURITY;
EOF
        ;;
        
    5)
        print_status "Current status check..."
        
        # Check git status
        echo ""
        echo "Git Status:"
        git log --oneline -5
        
        # Check if rollback files exist
        echo ""
        echo "Rollback Files:"
        [ -f "rollback-qr-migration.sql" ] && print_status "rollback-qr-migration.sql exists" || print_error "rollback-qr-migration.sql missing"
        [ -f "backup-current-rls-policies.sql" ] && print_status "backup-current-rls-policies.sql exists" || print_error "backup-current-rls-policies.sql missing"
        [ -f "ROLLBACK_GUIDE.md" ] && print_status "ROLLBACK_GUIDE.md exists" || print_error "ROLLBACK_GUIDE.md missing"
        
        # Check production status
        echo ""
        echo "Production Status:"
        if curl -s -o /dev/null -w "%{http_code}" https://dislinkboltv2duplicate.netlify.app | grep -q "200"; then
            print_status "Production site is accessible"
        else
            print_error "Production site is not accessible"
        fi
        ;;
        
    *)
        print_error "Invalid choice. Exiting."
        exit 1
        ;;
esac

echo ""
print_status "Rollback process completed."
echo ""
echo "Next steps:"
echo "1. Test the application functionality"
echo "2. Check production logs for errors"
echo "3. Verify QR code flow works as expected"
echo "4. Document any issues found"
echo ""
echo "For detailed rollback instructions, see: ROLLBACK_GUIDE.md"
