#!/bin/bash

echo "🧪 Running Toilet Review System Tests..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed!"
    echo "📦 Please install Node.js (v16 or higher) from https://nodejs.org/"
    echo ""
    echo "Installation commands:"
    echo "  Ubuntu/Debian: curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - && sudo apt-get install -y nodejs"
    echo "  macOS: brew install node"
    echo "  Windows: Download installer from nodejs.org"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed!"
    echo "📦 npm usually comes with Node.js. Please reinstall Node.js from https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js $(node --version) and npm $(npm --version) detected"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies first..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies"
        echo "💡 Try running 'npm install' manually to see detailed error messages"
        exit 1
    fi
fi

# Check if jest is available
if ! npx jest --version > /dev/null 2>&1; then
    echo "❌ Jest not found. Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install Jest"
        echo "💡 Check your internet connection and npm configuration"
        exit 1
    fi
fi

echo "✅ Dependencies ready, running tests..."

# Check if e2e tests are requested
if [ "$1" = "e2e" ]; then
    echo "🖥️  Running End-to-End tests..."
    npm run test:e2e
elif [ "$1" = "all" ]; then
    echo "🧪 Running ALL tests (unit + e2e)..."
    npm run test:coverage:all
else
    echo "🧪 Running unit tests with coverage..."
    npm run test:coverage
fi

echo ""
echo "📊 Test completed! Check the coverage report above."
echo "💡 Commands:"
echo "   ./test.sh        - Unit tests only"
echo "   ./test.sh e2e    - End-to-end tests only"
echo "   ./test.sh all    - All tests with full coverage"
echo "   npm run test:watch - Development watch mode"