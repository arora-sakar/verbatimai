#!/bin/bash

# Quick Test Runner for SMB Feedback Insights
# ===========================================
# Fast, focused test execution for development

cd /Users/sakar/projects/smb-feedback-insights/backend

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🚀 SMB Feedback Insights - Quick Test Suite${NC}"
echo "==========================================="

# Clean setup
rm -f test.db

# Run all tests with coverage
echo -e "${BLUE}Running all tests with coverage...${NC}"
python -m pytest tests/ \
    --cov=app \
    --cov-report=term-missing \
    --cov-fail-under=70 \
    -v

exit_code=$?

if [ $exit_code -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
    echo "📊 Coverage report: htmlcov/index.html"
else
    echo -e "${YELLOW}⚠️  Some tests failed or coverage is low${NC}"
fi

exit $exit_code
