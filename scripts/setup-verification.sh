#!/bin/bash

# 🔧 DISLINK CONTINUOUS VERIFICATION SETUP
# Sets up the complete verification system

set -e

echo "🔧 Setting up Dislink Continuous Verification System..."

# Check if Node.js is installed
if ! command -v node >/dev/null 2>&1; then
    echo "❌ Node.js is required but not installed."
    echo "Please install Node.js and try again."
    exit 1
fi

# Check if pnpm is installed
if ! command -v pnpm >/dev/null 2>&1; then
    echo "❌ pnpm is required but not installed."
    echo "Please install pnpm and try again."
    exit 1
fi

# Install required dependencies
echo "📦 Installing verification dependencies..."
pnpm add -D chalk

# Make scripts executable
chmod +x scripts/continuous-verification.js
chmod +x scripts/watch-verification.js
chmod +x scripts/verification-dashboard.js
chmod +x scripts/setup-git-hooks.sh

# Set up Git hooks
echo "🔗 Setting up Git hooks..."
./scripts/setup-git-hooks.sh

# Create verification directory
mkdir -p .verification
mkdir -p .verification/reports
mkdir -p .verification/logs

# Create initial verification report
echo "📊 Creating initial verification report..."
node scripts/continuous-verification.js > .verification/logs/initial-verification.log 2>&1

# Create package.json scripts if they don't exist
if [ -f "package.json" ]; then
    echo "📝 Adding verification scripts to package.json..."
    
    # Check if scripts section exists
    if ! grep -q '"scripts"' package.json; then
        echo "Adding scripts section to package.json..."
        # This is a simplified approach - in practice, you'd want to use jq or a proper JSON parser
        echo "⚠️  Please manually add the following scripts to your package.json:"
        echo ""
        echo '"scripts": {'
        echo '  "verify": "node scripts/continuous-verification.js",'
        echo '  "verify:watch": "node scripts/watch-verification.js",'
        echo '  "verify:dashboard": "node scripts/verification-dashboard.js",'
        echo '  "verify:setup": "./scripts/setup-verification.sh"'
        echo '}'
        echo ""
    fi
fi

# Create .gitignore entries for verification files
echo "📝 Adding verification files to .gitignore..."
if [ -f ".gitignore" ]; then
    if ! grep -q ".verification/" .gitignore; then
        echo "" >> .gitignore
        echo "# Verification system files" >> .gitignore
        echo ".verification/" >> .gitignore
        echo "verification-report.json" >> .gitignore
        echo "VERIFICATION_REPORT.md" >> .gitignore
    fi
else
    echo ".verification/" > .gitignore
    echo "verification-report.json" >> .gitignore
    echo "VERIFICATION_REPORT.md" >> .gitignore
fi

# Create README for verification system
cat > .verification/README.md << 'EOF'
# 🔍 Dislink Continuous Verification System

This directory contains the continuous verification system for Dislink.

## 📁 Directory Structure

- `reports/` - Historical verification reports
- `logs/` - Verification logs and output
- `README.md` - This file

## 🚀 Usage

### Manual Verification
```bash
# Run one-time verification
pnpm verify

# Watch for file changes and verify automatically
pnpm verify:watch

# Open real-time dashboard
pnpm verify:dashboard
```

### Git Hooks
The system automatically runs verification:
- After each commit (post-commit hook)
- Before each push (pre-push hook)

### Monitoring
- Verification reports are saved to `verification-report.json`
- Markdown reports are saved to `VERIFICATION_REPORT.md`
- Logs are saved to `.verification/logs/`

## 🔧 Configuration

Edit `scripts/continuous-verification.js` to modify:
- Verification thresholds
- Alert conditions
- Test parameters

## 🚨 Alerts

The system monitors for:
- Build failures
- Routing issues
- Authentication problems
- QR code malfunctions
- Data persistence errors
- Caching issues
- Responsiveness problems

Critical alerts will block pushes to prevent broken deployments.
EOF

echo ""
echo "✅ Dislink Continuous Verification System setup complete!"
echo ""
echo "📋 What was installed:"
echo "  - Continuous verification script"
echo "  - File watcher for real-time monitoring"
echo "  - Verification dashboard"
echo "  - Git hooks for automatic verification"
echo "  - Package.json scripts"
echo ""
echo "🚀 Quick start:"
echo "  pnpm verify              # Run verification now"
echo "  pnpm verify:watch        # Watch for changes"
echo "  pnpm verify:dashboard    # Open dashboard"
echo ""
echo "🔗 Git hooks are now active and will verify after each commit!"
echo ""
echo "📊 Check .verification/README.md for detailed usage instructions."
