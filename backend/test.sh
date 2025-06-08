#!/bin/bash

# Test Shortcuts for VerbatimAI
# ==============================
# Simple commands for common test operations

# Ensure we're in the correct directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Check if virtual environment is activated
if [[ -z "$VIRTUAL_ENV" ]]; then
    echo "⚠️  No virtual environment detected!"
    echo "Please activate your virtual environment first:"
    echo "  source venv/bin/activate"
    echo "Or run the setup script: ./setup_venv.sh"
    exit 1
fi

# Check if pytest is available
if ! command -v pytest &> /dev/null; then
    echo "❌ pytest not found in current environment"
    echo "Current Python: $(which python)"
    echo "Virtual env: $VIRTUAL_ENV"
    echo ""
    echo "To fix this, run:"
    echo "  pip install pytest pytest-cov"
    exit 1
fi

case "$1" in
    "")
        echo "🧪 Test Commands Available:"
        echo "  ./test.sh run      - Run all tests with coverage"
        echo "  ./test.sh unit     - Run unit tests only"
        echo "  ./test.sh api      - Run integration/API tests only"
        echo "  ./test.sh cov      - Run with detailed coverage report"
        echo "  ./test.sh quick    - Fast test run"
        echo "  ./test.sh clean    - Clean test artifacts"
        ;;
    "run")
        rm -f test.db
        python -m pytest tests/ --cov=app --cov-report=term-missing --cov-fail-under=70 -v
        ;;
    "unit")
        rm -f test.db
        python -m pytest tests/unit/ -v
        ;;
    "api"|"integration")
        rm -f test.db
        python -m pytest tests/integration/ -v
        ;;
    "cov"|"coverage")
        rm -f test.db
        python -m pytest tests/ --cov=app --cov-report=html --cov-report=term-missing -v
        echo "📊 Open htmlcov/index.html to view detailed coverage"
        ;;
    "quick")
        rm -f test.db
        python -m pytest tests/ --cov=app -q
        ;;
    "clean")
        rm -f test.db .coverage coverage.xml
        rm -rf htmlcov/ .pytest_cache/
        echo "✅ Cleaned test artifacts"
        ;;
    *)
        echo "❌ Unknown command: $1"
        echo "Run './test.sh' to see available commands"
        ;;
esac
