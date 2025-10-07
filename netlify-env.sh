#!/bin/bash

# Netlify Environment Variables Management Script
# This script provides reliable commands to manage Netlify environment variables

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SITE_ID="4ab48331-d98a-4d0b-a76b-06f66f307897"
PROJECT_NAME="dislinkboltv2duplicate"

echo -e "${BLUE}🔧 Netlify Environment Variables Management${NC}"
echo "  Site ID: $SITE_ID"
echo "  Project: $PROJECT_NAME"
echo ""

# Function to list environment variables
list_env_vars() {
    local context=${1:-production}
    local format=${2:-json}
    
    echo -e "${YELLOW}📋 Listing environment variables for context: $context${NC}"
    
    if [ "$format" = "json" ]; then
        npx netlify env:list --context "$context" --json --filter web
    else
        npx netlify env:list --context "$context" --plain --filter web
    fi
}

# Function to set environment variable
set_env_var() {
    local key=$1
    local value=$2
    local context=${3:-production}
    
    if [ -z "$key" ] || [ -z "$value" ]; then
        echo -e "${RED}❌ Usage: set_env_var <KEY> <VALUE> [CONTEXT]${NC}"
        return 1
    fi
    
    echo -e "${YELLOW}🔧 Setting environment variable: $key${NC}"
    npx netlify env:set "$key" "$value" --context "$context" --filter web
    echo -e "${GREEN}✅ Environment variable set successfully${NC}"
}

# Function to delete environment variable
delete_env_var() {
    local key=$1
    local context=${2:-production}
    
    if [ -z "$key" ]; then
        echo -e "${RED}❌ Usage: delete_env_var <KEY> [CONTEXT]${NC}"
        return 1
    fi
    
    echo -e "${YELLOW}🗑️  Deleting environment variable: $key${NC}"
    npx netlify env:unset "$key" --context "$context" --filter web
    echo -e "${GREEN}✅ Environment variable deleted successfully${NC}"
}

# Main menu
case "${1:-list}" in
    "list")
        list_env_vars "${2:-production}" "${3:-json}"
        ;;
    "list-plain")
        list_env_vars "${2:-production}" "plain"
        ;;
    "set")
        set_env_var "$2" "$3" "$4"
        ;;
    "delete")
        delete_env_var "$2" "$3"
        ;;
    "help")
        echo -e "${BLUE}Usage:${NC}"
        echo "  $0 list [context] [format]     - List environment variables (default: production, json)"
        echo "  $0 list-plain [context]        - List environment variables in plain text"
        echo "  $0 set <KEY> <VALUE> [context] - Set environment variable"
        echo "  $0 delete <KEY> [context]      - Delete environment variable"
        echo "  $0 help                        - Show this help"
        echo ""
        echo -e "${BLUE}Examples:${NC}"
        echo "  $0 list production json"
        echo "  $0 list-plain production"
        echo "  $0 set VITE_API_KEY mykey123 production"
        echo "  $0 delete OLD_VAR production"
        ;;
    *)
        echo -e "${RED}❌ Unknown command: $1${NC}"
        echo "Use '$0 help' for usage information"
        exit 1
        ;;
esac
