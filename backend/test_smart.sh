#!/bin/bash

# VerbatimAI - Smart Test Runner
# =============================
# Portable test runner with automatic path detection

set -e

# Source path utilities
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/path_utils.sh"

# Validate project structure
if ! validate_project_structure; then
    echo "❌ Cannot proceed with invalid project structure"
    exit 1
fi

# Ensure we're in the backend directory
cd "$VERBATIMAI_BACKEND_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
COVERAGE_THRESHOLD=${VERBATIMAI_COVERAGE_THRESHOLD:-70}
TEST_DB=${VERBATIMAI_TEST_DB:-"test.db"}

# Helper functions
print_header() {
    echo -e "${CYAN}============================================${NC}"
    echo -e "${CYAN}$1${NC}"
    echo -e "${CYAN}============================================${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
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

# Check virtual environment
check_venv() {
    if [[ -z "$VIRTUAL_ENV" ]]; then
        print_warning "No virtual environment detected!"
        echo "Please activate your virtual environment first:"
        echo "  source $VERBATIMAI_VENV_DIR/bin/activate"
        echo "Or run the setup script: ./setup_venv.sh"
        return 1
    fi
    
    # Check if pytest is available
    if ! command -v pytest &> /dev/null; then
        print_error "pytest not found in current environment"
        echo "Current Python: $(which python)"
        echo "Virtual env: $VIRTUAL_ENV"
        echo ""
        echo "To fix this, run:"
        echo "  pip install pytest pytest-cov"
        return 1
    fi
    
    return 0
}

# Show help
show_help() {
    print_header "VerbatimAI Smart Test Runner"
    echo ""
    echo "Usage: $0 [OPTION]"
    echo ""
    echo "Options:"
    echo "  unit          Run only unit tests"
    echo "  integration   Run only integration tests"
    echo "  api           Alias for integration tests"
    echo "  coverage      Run all tests with detailed coverage"
    echo "  cov           Alias for coverage"
    echo "  quick         Run all tests with minimal output"
    echo "  run           Run all tests with standard coverage (default)"
    echo "  clean         Clean test artifacts and databases"
    echo "  info          Show project and environment information"
    echo "  help          Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 unit           # Run unit tests only"
    echo "  $0 coverage       # Run with detailed coverage"
    echo "  $0 clean          # Clean up test files"
    echo ""
    echo "Project Paths:"
    echo "  Root: $VERBATIMAI_PROJECT_ROOT"
    echo "  Backend: $VERBATIMAI_BACKEND_DIR"
    echo "  Virtual Env: $VERBATIMAI_VENV_DIR"
}

# Show project info
show_info() {
    print_header "VerbatimAI Project Information"
    echo ""
    print_info "Project Structure:"
    echo "  📁 Root: $VERBATIMAI_PROJECT_ROOT"
    echo "  📁 Backend: $VERBATIMAI_BACKEND_DIR"
    echo "  📁 Frontend: $VERBATIMAI_FRONTEND_DIR"
    echo "  📁 Virtual Env: $VERBATIMAI_VENV_DIR"
    echo ""
    print_info "Environment:"
    echo "  🐍 Python: $(python --version 2>&1)"
    echo "  📦 Pip: $(pip --version | cut -d' ' -f1-2)"
    if command -v pytest &> /dev/null; then
        echo "  🧪 Pytest: $(pytest --version | head -n1)"
    else
        echo "  🧪 Pytest: Not installed"
    fi
    echo "  💻 Virtual Env: ${VIRTUAL_ENV:-'Not activated'}"
    echo ""
    print_info "Configuration:"
    echo "  📊 Coverage Threshold: $COVERAGE_THRESHOLD%"
    echo "  🗄️  Test Database: $TEST_DB"
}

# Clean up function
cleanup() {
    rm -f "$TEST_DB"
}

# Test functions
run_unit_tests() {
    print_header "🧪 Running Unit Tests"
    cleanup
    python -m pytest tests/unit/ -v --tb=short
}

run_integration_tests() {
    print_header "🔗 Running Integration Tests"
    cleanup
    python -m pytest tests/integration/ -v --tb=short
}

run_coverage_tests() {
    print_header "📊 Running Tests with Detailed Coverage"
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
    print_success "Coverage Reports Generated:"
    echo "  📱 Terminal: (shown above)"
    echo "  🌐 HTML: file://$VERBATIMAI_BACKEND_DIR/htmlcov/index.html"
    echo "  📄 XML: $VERBATIMAI_BACKEND_DIR/coverage.xml"
}

run_quick_tests() {
    print_header "⚡ Quick Test Run"
    cleanup
    python -m pytest tests/ \
        --cov=app \
        --cov-report=term \
        --cov-fail-under=$COVERAGE_THRESHOLD \
        -q
}

run_all_tests() {
    print_header "🎯 Running All Tests"
    cleanup
    python -m pytest tests/ \
        --cov=app \
        --cov-report=term-missing \
        --cov-fail-under=$COVERAGE_THRESHOLD \
        -v
}

clean_artifacts() {
    print_header "🧹 Cleaning Test Artifacts"
    
    # Remove test databases
    rm -f "$TEST_DB"
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
    
    print_success "Cleanup complete"
}

# Main script logic
main() {
    local command="${1:-run}"
    
    case "$command" in
        "unit")
            check_venv && run_unit_tests
            ;;
        "integration"|"api")
            check_venv && run_integration_tests
            ;;
        "coverage"|"cov")
            check_venv && run_coverage_tests
            ;;
        "quick")
            check_venv && run_quick_tests
            ;;
        "run"|"")
            check_venv && run_all_tests
            ;;
        "clean")
            clean_artifacts
            ;;
        "info")
            show_info
            ;;
        "help"|"-h"|"--help")
            show_help
            ;;
        *)
            print_error "Unknown command: $command"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
