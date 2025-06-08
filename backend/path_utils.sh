#!/bin/bash

# VerbatimAI - Path Detection Utilities
# ====================================
# Reusable functions for detecting project paths

# Function to find project root by looking for key files
find_project_root() {
    local current_dir="$1"
    local max_depth=${2:-10}
    local depth=0
    
    # Start from provided directory or script location
    if [ -z "$current_dir" ]; then
        current_dir="$(cd "$(dirname "${BASH_SOURCE[1]}")" && pwd)"
    fi
    
    # Look for project indicators
    while [ "$depth" -lt "$max_depth" ]; do
        # Check for project root indicators
        if [ -f "$current_dir/docker-compose.yml" ] && \
           [ -d "$current_dir/backend" ] && \
           [ -d "$current_dir/frontend" ]; then
            echo "$current_dir"
            return 0
        fi
        
        # Move up one directory
        local parent_dir="$(dirname "$current_dir")"
        if [ "$parent_dir" = "$current_dir" ]; then
            # Reached filesystem root
            break
        fi
        current_dir="$parent_dir"
        depth=$((depth + 1))
    done
    
    # Project root not found
    return 1
}

# Function to detect if we're in the backend directory
is_backend_dir() {
    local dir="${1:-$(pwd)}"
    [ -f "$dir/requirements.txt" ] && \
    [ -f "$dir/run.py" ] && \
    [ -d "$dir/app" ]
}

# Function to detect if we're in the project root
is_project_root() {
    local dir="${1:-$(pwd)}"
    [ -f "$dir/docker-compose.yml" ] && \
    [ -d "$dir/backend" ] && \
    [ -d "$dir/frontend" ]
}

# Function to set all project paths
setup_project_paths() {
    local script_dir="$(cd "$(dirname "${BASH_SOURCE[1]}")" && pwd)"
    
    # Try to find project root
    PROJECT_ROOT=$(find_project_root "$script_dir")
    
    if [ $? -eq 0 ]; then
        export VERBATIMAI_PROJECT_ROOT="$PROJECT_ROOT"
        export VERBATIMAI_BACKEND_DIR="$PROJECT_ROOT/backend"
        export VERBATIMAI_FRONTEND_DIR="$PROJECT_ROOT/frontend"
        export VERBATIMAI_DOCS_DIR="$PROJECT_ROOT/docs"
        export VERBATIMAI_VENV_DIR="$VERBATIMAI_BACKEND_DIR/venv"
        return 0
    else
        echo "⚠️  Warning: Could not detect VerbatimAI project root"
        echo "   Please ensure you're running from within the project directory"
        return 1
    fi
}

# Function to validate project structure
validate_project_structure() {
    if [ -z "$VERBATIMAI_PROJECT_ROOT" ]; then
        echo "❌ Project root not set. Run setup_project_paths first."
        return 1
    fi
    
    local errors=0
    
    # Check required directories
    if [ ! -d "$VERBATIMAI_BACKEND_DIR" ]; then
        echo "❌ Backend directory not found: $VERBATIMAI_BACKEND_DIR"
        errors=$((errors + 1))
    fi
    
    if [ ! -d "$VERBATIMAI_FRONTEND_DIR" ]; then
        echo "❌ Frontend directory not found: $VERBATIMAI_FRONTEND_DIR"
        errors=$((errors + 1))
    fi
    
    # Check required files
    if [ ! -f "$VERBATIMAI_BACKEND_DIR/requirements.txt" ]; then
        echo "❌ Backend requirements.txt not found"
        errors=$((errors + 1))
    fi
    
    if [ ! -f "$VERBATIMAI_PROJECT_ROOT/docker-compose.yml" ]; then
        echo "❌ docker-compose.yml not found in project root"
        errors=$((errors + 1))
    fi
    
    if [ "$errors" -eq 0 ]; then
        echo "✅ Project structure validated successfully"
        return 0
    else
        echo "❌ Project structure validation failed ($errors errors)"
        return 1
    fi
}

# Auto-setup if this script is sourced
if [ "${BASH_SOURCE[0]}" != "${0}" ]; then
    # Script is being sourced, auto-setup paths
    setup_project_paths
fi
