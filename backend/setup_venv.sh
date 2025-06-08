#!/bin/bash

# VerbatimAI - Virtual Environment Setup Script
# ============================================
# This script creates a new virtual environment with all required dependencies

set -e

echo "🔧 Setting up VerbatimAI Backend Virtual Environment"
echo "=" * 50

# Dynamic path detection
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR"
VENV_DIR="$BACKEND_DIR/venv"

# Navigate to backend directory
cd "$BACKEND_DIR"

echo "📍 Working directory: $(pwd)"

# Deactivate current virtual environment if active
if [[ -n "$VIRTUAL_ENV" ]]; then
    echo "🔄 Deactivating current virtual environment: $VIRTUAL_ENV"
    deactivate || true
fi

# Remove old venv if it exists
if [ -d "$VENV_DIR" ]; then
    echo "🗑️  Removing old virtual environment..."
    rm -rf "$VENV_DIR"
fi

# Create new virtual environment
echo "🏗️  Creating new virtual environment..."
python -m venv venv

# Activate the virtual environment
echo "🔌 Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
echo "⬆️  Upgrading pip..."
pip install --upgrade pip

# Install requirements
echo "📦 Installing requirements..."
if [ -f "requirements.txt" ]; then
    pip install -r requirements.txt
else
    echo "⚠️  requirements.txt not found, installing essential packages..."
    pip install fastapi uvicorn sqlalchemy alembic psycopg2-binary pytest pytest-cov python-multipart
fi

# Verify installation
echo "✅ Verifying installation..."
echo "Python version: $(python --version)"
echo "Pip version: $(pip --version)"
echo "Pytest version: $(pytest --version)"

echo ""
echo "🎉 Virtual environment setup complete!"
echo ""
echo "📋 To activate this environment in the future:"
echo "   cd $BACKEND_DIR"
echo "   source venv/bin/activate"
echo ""
echo "🧪 To run tests:"
echo "   ./test.sh unit"
echo "   ./test.sh run"
echo ""
echo "🚀 To start the server:"
echo "   python run.py"
