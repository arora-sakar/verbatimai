#!/bin/bash

# Test Shortcuts for SMB Feedback Insights
# ========================================
# Simple commands for common test operations

cd /Users/sakar/projects/smb-feedback-insights/backend

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
