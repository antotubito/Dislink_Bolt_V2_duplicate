#!/bin/bash

# 🔧 DISLINK GIT HOOKS SETUP
# Sets up automatic verification after commits and pushes

set -e

echo "🔧 Setting up Dislink Git Hooks for Continuous Verification..."

# Create hooks directory if it doesn't exist
mkdir -p .git/hooks

# Post-commit hook - runs verification after each commit
cat > .git/hooks/post-commit << 'EOF'
#!/bin/bash

# 🔍 DISLINK POST-COMMIT VERIFICATION
# Runs continuous verification after each commit

echo "🔍 Running post-commit verification..."

# Change to project root
cd "$(git rev-parse --show-toplevel)"

# Run continuous verification
if command -v node >/dev/null 2>&1; then
    node scripts/continuous-verification.js
    VERIFICATION_EXIT_CODE=$?
    
    if [ $VERIFICATION_EXIT_CODE -ne 0 ]; then
        echo "❌ Verification failed! Please review the issues above."
        echo "💡 You can run 'node scripts/continuous-verification.js' manually to see details."
    else
        echo "✅ Verification passed! All systems operational."
    fi
else
    echo "⚠️  Node.js not found. Skipping verification."
fi
EOF

# Pre-push hook - runs verification before pushing
cat > .git/hooks/pre-push << 'EOF'
#!/bin/bash

# 🔍 DISLINK PRE-PUSH VERIFICATION
# Runs verification before pushing to prevent broken deployments

echo "🔍 Running pre-push verification..."

# Change to project root
cd "$(git rev-parse --show-toplevel)"

# Run continuous verification
if command -v node >/dev/null 2>&1; then
    node scripts/continuous-verification.js
    VERIFICATION_EXIT_CODE=$?
    
    if [ $VERIFICATION_EXIT_CODE -ne 0 ]; then
        echo "❌ Pre-push verification failed!"
        echo "🚫 Push blocked to prevent broken deployment."
        echo "💡 Please fix the issues and try again."
        exit 1
    else
        echo "✅ Pre-push verification passed! Proceeding with push."
    fi
else
    echo "⚠️  Node.js not found. Skipping verification."
fi
EOF

# Make hooks executable
chmod +x .git/hooks/post-commit
chmod +x .git/hooks/pre-push

echo "✅ Git hooks installed successfully!"
echo ""
echo "📋 Installed hooks:"
echo "  - post-commit: Runs verification after each commit"
echo "  - pre-push: Runs verification before pushing (blocks push if failed)"
echo ""
echo "🔧 To manually run verification:"
echo "  node scripts/continuous-verification.js"
echo ""
echo "🚀 Git hooks are now active and will monitor your commits!"
