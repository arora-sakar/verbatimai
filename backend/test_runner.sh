#!/bin/bash

# SMB Feedback Insights Test Utility
# ==================================
# Comprehensive testing toolkit with multiple options

set -e

# Configuration
BACKEND_DIR="/Users/sakar/projects/smb-feedback-insights/backend"
COVERAGE_THRESHOLD=70

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Change to backend directory
cd "$BACKEND_DIR"

# Clean up function
cleanup() {
    rm -f test.db
}

# Help function
show_help() {
    echo -e "${PURPLE}SMB Feedback Insights Test Utility${NC}"
    echo ""
    echo "Usage: $0 [OPTION]"
    echo ""
    echo "Options:"
    echo "  unit          Run only unit tests"
    echo "  integration   Run only integration tests"
    echo "  basic         Run only basic functionality tests"
    echo "  coverage      Run all tests with detailed coverage"
    echo "  quick         Run all tests with minimal output"
    echo "  full          Run comprehensive test suite (default)"
    echo "  watch         Run tests in watch mode (re-run on changes)"
    echo "  debug         Run tests with debug output"
    echo "  clean         Clean test artifacts and databases"
    echo "  help          Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 unit           # Run unit tests only"
    echo "  $0 coverage       # Run with detailed coverage"
    echo "  $0 quick          # Fast test run"
    echo ""
}

# Test functions
run_unit_tests() {
    echo -e "${CYAN}🧪 Running Unit Tests${NC}"
    cleanup
    python -m pytest tests/unit/ -v --tb=short
}

run_integration_tests() {
    echo -e "${CYAN}🔗 Running Integration Tests${NC}"
    cleanup
    python -m pytest tests/integration/ -v --tb=short
}

run_basic_tests() {
    echo -e "${CYAN}⚡ Running Basic Tests${NC}"
    cleanup
    python -m pytest tests/test_basic.py -v --tb=short
}

run_coverage_tests() {
    echo -e "${CYAN}📊 Running Tests with Detailed Coverage${NC}"
    cleanup
    python -m pytest tests/ \
        --cov=app \
        --cov-report=term-missing \
        --cov-report=html:htmlcov \
        --cov-report=xml:coverage.xml \
        --cov-fail-under=$COVERAGE_THRESHOLD \
        -v \
        --tb=short
    
    echo ""
    echo -e "${BLUE}Coverage Reports Generated:${NC}"
    echo "  📱 Terminal: (shown above)"
    echo "  🌐 HTML: file://$BACKEND_DIR/htmlcov/index.html"
    echo "  📄 XML: $BACKEND_DIR/coverage.xml"
}

run_quick_tests() {
    echo -e "${CYAN}⚡ Quick Test Run${NC}"
    cleanup
    python -m pytest tests/ \
        --cov=app \
        --cov-report=term \
        --cov-fail-under=$COVERAGE_THRESHOLD \
        -q
}

run_full_tests() {
    echo -e "${PURPLE}🎯 Comprehensive Test Suite${NC}"
    echo "============================="
    
    cleanup
    pip install pyarrow==15.0.0 --quiet
    
    echo -e "${BLUE}1. Unit Tests${NC}"
    python -m pytest tests/unit/ -v
    
    echo -e "${BLUE}2. Integration Tests${NC}"
    python -m pytest tests/integration/ -v
    
    echo -e "${BLUE}3. Basic Tests${NC}"
    python -m pytest tests/test_basic.py -v
    
    echo -e "${BLUE}4. Full Coverage Analysis${NC}"
    python -m pytest tests/ \
        --cov=app \
        --cov-report=term-missing \
        --cov-report=html:htmlcov \
        --cov-fail-under=$COVERAGE_THRESHOLD \
        --tb=short
    
    echo -e "${GREEN}✅ Comprehensive test suite complete${NC}"
}

run_watch_tests() {
    echo -e "${CYAN}👀 Watch Mode (requires pytest-watch)${NC}"
    echo "Install with: pip install pytest-watch"
    
    if command -v ptw &> /dev/null; then
        cleanup
        ptw tests/ -- --cov=app --cov-report=term
    else
        echo -e "${YELLOW}pytest-watch not installed. Installing...${NC}"
        pip install pytest-watch
        ptw tests/ -- --cov=app --cov-report=term
    fi
}

run_debug_tests() {
    echo -e "${CYAN}🐛 Debug Mode Tests${NC}"
    cleanup
    python -m pytest tests/ \
        --cov=app \
        --cov-report=term-missing \
        -v \
        -s \
        --tb=long \
        --show-capture=all
}

clean_artifacts() {
    echo -e "${CYAN}🧹 Cleaning Test Artifacts${NC}"
    
    # Remove test databases
    rm -f test.db
    rm -f *.db
    
    # Remove coverage files
    rm -f .coverage
    rm -f coverage.xml
    rm -rf htmlcov/
    
    # Remove pytest cache
    rm -rf .pytest_cache/
    rm -rf tests/__pycache__/
    rm -rf tests/unit/__pycache__/
    rm -rf tests/integration/__pycache__/
    
    echo -e "${GREEN}✅ Cleanup complete${NC}"
}

# Main script logic
case "${1:-full}" in
    "unit")
        run_unit_tests
        ;;
    "integration")
        run_integration_tests
        ;;
    "basic")
        run_basic_tests
        ;;
    "coverage")
        run_coverage_tests
        ;;
    "quick")
        run_quick_tests
        ;;
    "full")
        run_full_tests
        ;;
    "watch")
        run_watch_tests
        ;;
    "debug")
        run_debug_tests
        ;;
    "clean")
        clean_artifacts
        ;;
    "help"|"-h"|"--help")
        show_help
        ;;
    *)
        echo -e "${RED}Unknown option: $1${NC}"
        echo ""
        show_help
        exit 1
        ;;
esac
