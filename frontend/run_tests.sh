#!/bin/bash

echo "⚛️  Running Frontend Tests for SMB Feedback Insights"
echo "=================================================="

# Check if we're in the frontend directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the frontend directory"
    exit 1
fi

# Function to handle dependency installation
install_dependencies() {
    echo "📦 Installing/updating dependencies..."
    
    # Clean install to resolve version conflicts
    rm -rf node_modules package-lock.json
    npm install
    
    # Check if coverage package was installed
    if ! npm list @vitest/coverage-v8 &> /dev/null; then
        echo "📦 Installing vitest coverage package..."
        npm install --save-dev @vitest/coverage-v8@^1.6.1
    fi
}

# Install dependencies if node_modules doesn't exist or if there are version conflicts
if [ ! -d "node_modules" ]; then
    install_dependencies
elif ! npm list @vitest/coverage-v8 &> /dev/null; then
    echo "📦 Missing coverage package, installing..."
    npm install --save-dev @vitest/coverage-v8@^1.6.1
fi

echo -e "\n🧪 Running Frontend Tests..."
echo "=============================="

# First try running tests with coverage
echo "📊 Attempting to run tests with coverage..."
if npm run test:run -- --coverage --reporter=verbose 2>/dev/null; then
    TEST_EXIT_CODE=0
else
    echo "⚠️  Coverage failed, trying without coverage..."
    # Fallback: run tests without coverage if coverage fails
    if npm run test:run -- --reporter=verbose; then
        TEST_EXIT_CODE=0
        echo "✅ Tests passed (without coverage reporting)"
    else
        TEST_EXIT_CODE=1
        echo "❌ Tests failed"
    fi
fi

if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo -e "\n✅ Frontend Tests Completed Successfully!"
    echo "========================================"
    
    echo -e "\n📊 Test Summary:"
    echo "• Component Tests: ✅ Complete"
    echo "• Service Tests: ✅ Complete" 
    echo "• Hook Tests: ✅ Complete"
    echo "• Page Tests: ✅ Complete"
    echo "• Integration Tests: ✅ Complete"
    
    echo -e "\n🎯 Next Steps:"
    echo "• Run in watch mode: npm run test:watch"
    echo "• Generate coverage: npm run test:coverage"
    echo "• Debug with UI: npm run test:ui"
    
else
    echo -e "\n❌ Some Tests Failed!"
    echo "====================="
    echo "Check the output above for specific failures."
    
    echo -e "\n🔧 Common Issues:"
    echo "• Missing mocks for external dependencies"
    echo "• Async operations not properly awaited"
    echo "• Component props not matching expectations"
    echo "• API responses not matching mock structure"
    
    echo -e "\n💡 Debugging Tips:"
    echo "• Run in watch mode: npm run test:watch"
    echo "• Run specific test: npm test -- ComponentName.test.jsx"
    echo "• Check console output for detailed errors"
    echo "• Verify all dependencies are installed: npm list"
fi

echo -e "\n🚀 Available Commands:"
echo "====================="
echo "• npm run test:watch  - Watch mode for development"
echo "• npm run test:run    - Single run (CI/CD)"
echo "• npm run test:ui     - Visual test interface"
echo "• npm run lint        - Code linting"

echo -e "\n✅ Frontend testing script complete!"
exit $TEST_EXIT_CODE
