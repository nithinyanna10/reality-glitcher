# 🚀 Quick Start Guide

## Prerequisites

- **Python 3.9+**
- **Node.js 18+**
- **Chrome/Edge** with WebGPU enabled:
  - Go to `chrome://flags/#enable-unsafe-webgpu`
  - Enable the flag and restart browser

## Installation

### Option 1: Automated Setup (Recommended)

**Linux/Mac:**
```bash
chmod +x setup.sh
./setup.sh
```

**Windows:**
```cmd
setup.bat
```

### Option 2: Manual Setup

**Backend:**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

**Frontend:**
```bash
cd frontend
npm install
```

## Running the Application

### 1. Start Backend Server

```bash
cd backend
source venv/bin/activate  # Windows: venv\Scripts\activate
python server.py
```

Backend will run on `http://localhost:8000`

### 2. Start Frontend Dev Server

In a new terminal:

```bash
cd frontend
npm run dev
```

Frontend will run on `http://localhost:3000`

### 3. Open in Browser

1. Open Chrome/Edge
2. Navigate to `http://localhost:3000`
3. Allow camera permissions when prompted
4. Start making gestures!

## Gesture Controls

| Gesture | Effect |
|---------|--------|
| 👁️ **Blink** | Gravity Flip |
| 😊 **Smile** | Liquify |
| ✋ **Raise Hand** | Matrix Rain |
| 🤚 **Both Hands Up** | Slow Motion |
| 👄 **Mouth Open** | Portal Ripple |
| 🤨 **Eyebrow Raise** | Pixel Sort |
| ↪️ **Head Tilt** | VHS Distortion |

## Troubleshooting

### WebGPU Not Available
- Make sure you're using Chrome/Edge
- Enable WebGPU flag: `chrome://flags/#enable-unsafe-webgpu`
- Restart browser

### Camera Not Working
- Check browser permissions
- Make sure no other app is using the camera
- Try refreshing the page

### Backend Connection Failed
- Make sure backend is running on port 8000
- Check firewall settings
- Verify WebSocket connection in browser console

### Import Errors
- Make sure you're in the correct directory
- Activate virtual environment for backend
- Run `npm install` in frontend directory

## Next Steps

- Customize gesture mappings in `configs/gestures.json`
- Add your own shaders in `frontend/src/shaders/`
- Enable virtual camera for OBS/Zoom streaming
- Check `README.md` for advanced features

## Support

For issues or questions, check the main `README.md` or open an issue on GitHub.

---

**Happy Glitching! 🌀**

