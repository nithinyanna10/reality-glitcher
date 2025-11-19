@echo off
echo 🌀 Setting up Reality Glitcher...

REM Backend setup
echo 📦 Setting up backend...
cd backend
if not exist venv (
    python -m venv venv
)
call venv\Scripts\activate.bat
pip install -r requirements.txt
cd ..

REM Frontend setup
echo 📦 Setting up frontend...
cd frontend
call npm install
cd ..

echo ✅ Setup complete!
echo.
echo To run:
echo   Backend:  cd backend && venv\Scripts\activate && python server.py
echo   Frontend: cd frontend && npm run dev

