#!/bin/bash

# Development server startup script with nodemon auto-restart
echo "🚀 Starting Toilet Review System in Development Mode"
echo "📁 Changing to backend directory..."
cd "$(dirname "$0")"

echo "📦 Installing dependencies (if needed)..."
npm install

echo ""
echo "🔄 Starting server with auto-restart (nodemon)..."
echo "💡 Server will restart automatically when you save files"
echo "🛑 Press Ctrl+C to stop the server"
echo ""

npx nodemon server.js
