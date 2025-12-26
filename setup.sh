#!/bin/bash

echo "🚀 Setting up Toilet Review System..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "📦 Installing backend dependencies..."
cd backend
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install backend dependencies"
    exit 1
fi

echo "✅ Backend dependencies installed successfully"

echo "🔧 Setting up environment variables..."
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating with default values..."
    cat > .env << EOF
PORT=3000
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
NODE_ENV=development
EOF
    echo "✅ Created .env file with default settings"
else
    echo "✅ .env file already exists"
fi

echo "🎯 Setup complete!"
echo ""
echo "To start the application:"
echo "  cd backend"
echo "  npm start"
echo ""
echo "Then open http://localhost:3000 in your browser"
echo ""
echo "Admin panel: http://localhost:3000/admin.html"