#!/bin/bash

echo "🚀 Starting Toilet Review System..."

# Check if we're in the right directory
if [ ! -d "backend" ]; then
    echo "❌ Error: backend directory not found. Please run this script from the project root."
    exit 1
fi

# Check if dependencies are installed
if [ ! -d "backend/node_modules" ]; then
    echo "📦 Installing dependencies..."
    cd backend
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies"
        exit 1
    fi
    cd ..
fi

# Check if .env exists
if [ ! -f "backend/.env" ]; then
    echo "🔧 Creating .env file..."
    cat > backend/.env << EOF
PORT=3000
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
NODE_ENV=development
EOF
    echo "✅ Created .env file"
fi

echo "🌟 Starting server..."
cd backend
npm start

echo ""
echo "🚀 Server started! Test the application:"
echo "  Main page: http://localhost:3000"
echo "  Admin panel: http://localhost:3000/admin.html"
echo "  Test page: http://localhost:3000/test.html"
echo ""
echo "📋 If you have issues:"
echo "  1. Open test.html to verify basic functionality"
echo "  2. Check browser console for errors"
echo "  3. Ensure server is running on port 3000"