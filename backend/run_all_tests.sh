#!/bin/bash

# SMB Feedback Insights - Complete Test Suite Runner
# ==================================================
# This script runs all tests (unit + integration) with comprehensive reporting

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
BACKEND_DIR="/Users/sakar/projects/smb-feedback-insights/backend"
COVERAGE_THRESHOLD=70
TEST_DB="test.db"

# Helper functions
print_header() {
    echo -e "${PURPLE}============================================${NC}"
    echo -e "${PURPLE}$1${NC}"
    echo -e "${PURPLE}============================================${NC}"
}

print_step() {
    echo -e "${CYAN}📋 Step $1: $2${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Change to backend directory
cd "$BACKEND_DIR" || {
    print_error "Failed to change to backend directory: $BACKEND_DIR"
    exit 1
}

print_header "SMB Feedback Insights - Complete Test Suite"

print_info "Backend Directory: $BACKEND_DIR"
print_info "Coverage Threshold: ${COVERAGE_THRESHOLD}%"
print_info "Python Version: $(python --version)"
print_info "Pytest Version: $(python -m pytest --version)"

echo ""

# Step 1: Environment Setup
print_step "1" "Environment Setup"

# Check if virtual environment is activated
if [[ "$VIRTUAL_ENV" != *"smb-feedback-insights"* ]]; then
    print_warning "Virtual environment may not be activated"
    print_info "Current VIRTUAL_ENV: ${VIRTUAL_ENV:-'None'}"
fi

# Clean up old test database
if [ -f "$TEST_DB" ]; then
    print_info "Removing old test database: $TEST_DB"
    rm -f "$TEST_DB"
fi

# Install dependencies if needed
print_info "Ensuring pyarrow is installed..."
pip install pyarrow==15.0.0 --quiet

print_success "Environment setup complete"
echo ""

# Step 2: Unit Tests
print_step "2" "Running Unit Tests"

echo -e "${BLUE}Running unit tests with detailed output...${NC}"
if python -m pytest tests/unit/ -v --tb=short; then
    print_success "Unit tests passed"
    UNIT_TESTS_PASSED=true
else
    print_error "Unit tests failed"
    UNIT_TESTS_PASSED=false
fi

echo ""

# Step 3: Integration Tests
print_step "3" "Running Integration Tests"

echo -e "${BLUE}Running integration tests with detailed output...${NC}"
if python -m pytest tests/integration/ -v --tb=short; then
    print_success "Integration tests passed"
    INTEGRATION_TESTS_PASSED=true
else
    print_error "Integration tests failed"
    INTEGRATION_TESTS_PASSED=false
fi

echo ""

# Step 4: Basic Functionality Tests
print_step "4" "Running Basic Functionality Tests"

echo -e "${BLUE}Running basic tests...${NC}"
if python -m pytest tests/test_basic.py -v --tb=short; then
    print_success "Basic tests passed"
    BASIC_TESTS_PASSED=true
else
    print_error "Basic tests failed"
    BASIC_TESTS_PASSED=false
fi

echo ""

# Step 5: Complete Test Suite with Coverage
print_step "5" "Running Complete Test Suite with Coverage"

echo -e "${BLUE}Running all tests with coverage analysis...${NC}"
echo "This may take a moment..."

# Run all tests with coverage
if python -m pytest tests/ \
    --cov=app \
    --cov-report=term-missing \
    --cov-report=html:htmlcov \
    --cov-report=xml:coverage.xml \
    --cov-fail-under=$COVERAGE_THRESHOLD \
    -v \
    --tb=short; then
    print_success "All tests passed with sufficient coverage"
    ALL_TESTS_PASSED=true
else
    print_warning "Tests completed but may not meet coverage threshold"
    ALL_TESTS_PASSED=false
fi

echo ""

# Step 6: Test Performance Analysis
print_step "6" "Test Performance Analysis"

echo -e "${BLUE}Running tests with duration reporting...${NC}"
python -m pytest tests/ --durations=10 --tb=no -q

echo ""

# Step 7: Generate Test Report
print_step "7" "Generating Test Reports"

# Count test files and tests
UNIT_TEST_COUNT=$(find tests/unit/ -name "test_*.py" | wc -l | tr -d ' ')
INTEGRATION_TEST_COUNT=$(find tests/integration/ -name "test_*.py" | wc -l | tr -d ' ')
TOTAL_TEST_FILES=$((UNIT_TEST_COUNT + INTEGRATION_TEST_COUNT + 1)) # +1 for test_basic.py

echo -e "${BLUE}Test files discovered:${NC}"
echo "  Unit test files: $UNIT_TEST_COUNT"
echo "  Integration test files: $INTEGRATION_TEST_COUNT"
echo "  Basic test files: 1"
echo "  Total test files: $TOTAL_TEST_FILES"

# Check coverage report exists
if [ -f "htmlcov/index.html" ]; then
    print_success "HTML coverage report generated: htmlcov/index.html"
else
    print_warning "HTML coverage report not found"
fi

if [ -f "coverage.xml" ]; then
    print_success "XML coverage report generated: coverage.xml"
else
    print_warning "XML coverage report not found"
fi

echo ""

# Step 8: Final Summary
print_header "Test Execution Summary"

echo -e "${BLUE}Test Results:${NC}"
if [ "$UNIT_TESTS_PASSED" = true ]; then
    echo -e "  ${GREEN}✅ Unit Tests: PASSED${NC}"
else
    echo -e "  ${RED}❌ Unit Tests: FAILED${NC}"
fi

if [ "$INTEGRATION_TESTS_PASSED" = true ]; then
    echo -e "  ${GREEN}✅ Integration Tests: PASSED${NC}"
else
    echo -e "  ${RED}❌ Integration Tests: FAILED${NC}"
fi

if [ "$BASIC_TESTS_PASSED" = true ]; then
    echo -e "  ${GREEN}✅ Basic Tests: PASSED${NC}"
else
    echo -e "  ${RED}❌ Basic Tests: FAILED${NC}"
fi

if [ "$ALL_TESTS_PASSED" = true ]; then
    echo -e "  ${GREEN}✅ Coverage: MEETS THRESHOLD (≥${COVERAGE_THRESHOLD}%)${NC}"
else
    echo -e "  ${YELLOW}⚠️  Coverage: BELOW THRESHOLD (<${COVERAGE_THRESHOLD}%)${NC}"
fi

echo ""
echo -e "${BLUE}Generated Reports:${NC}"
echo "  📊 Terminal coverage report (above)"
echo "  🌐 HTML coverage report: file://$BACKEND_DIR/htmlcov/index.html"
echo "  📄 XML coverage report: $BACKEND_DIR/coverage.xml"

echo ""
echo -e "${BLUE}Quick Commands for Development:${NC}"
echo "  # Run only unit tests:"
echo "  python -m pytest tests/unit/ -v"
echo ""
echo "  # Run only integration tests:"
echo "  python -m pytest tests/integration/ -v"
echo ""
echo "  # Run tests with coverage:"
echo "  python -m pytest tests/ --cov=app --cov-report=term-missing"
echo ""
echo "  # Run specific test file:"
echo "  python -m pytest tests/unit/test_ai_service.py -v"
echo ""
echo "  # View coverage report:"
echo "  open htmlcov/index.html"

echo ""

# Final status
if [ "$UNIT_TESTS_PASSED" = true ] && [ "$INTEGRATION_TESTS_PASSED" = true ] && [ "$BASIC_TESTS_PASSED" = true ]; then
    if [ "$ALL_TESTS_PASSED" = true ]; then
        print_header "🎉 ALL TESTS PASSED WITH SUFFICIENT COVERAGE!"
        echo -e "${GREEN}Your application is ready for development and deployment.${NC}"
        exit 0
    else
        print_header "⚠️  ALL TESTS PASSED BUT COVERAGE IS LOW"
        echo -e "${YELLOW}Consider adding more tests to reach ${COVERAGE_THRESHOLD}% coverage.${NC}"
        exit 1
    fi
else
    print_header "❌ SOME TESTS FAILED"
    echo -e "${RED}Please review the failed tests above and fix the issues.${NC}"
    exit 1
fi
