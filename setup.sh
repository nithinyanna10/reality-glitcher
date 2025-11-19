#!/bin/bash

echo "🌀 Setting up Reality Glitcher..."

# Backend setup
echo "📦 Setting up backend..."
cd backend
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi
source venv/bin/activate
pip install -r requirements.txt
cd ..

# Frontend setup
echo "📦 Setting up frontend..."
cd frontend
npm install
cd ..

echo "✅ Setup complete!"
echo ""
echo "To run:"
echo "  Backend:  cd backend && source venv/bin/activate && python server.py"
echo "  Frontend: cd frontend && npm run dev"

