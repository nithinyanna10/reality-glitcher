# 🌀 Reality Glitcher

**Real-time Computer Vision + Shader Engine with Gesture-Based Triggers**

An INSANE real-time video effect system that uses computer vision to detect gestures and applies mind-bending shader effects in real-time. Perfect for streaming, video calls, or just having fun with your webcam!

## 🎭 Features

### Gesture Triggers
- **Blink** → World gravity flips upside down
- **Smile** → Liquified world shader
- **Raise Hand** → Matrix-style falling code
- **Head Tilt** → VHS rewind distortion
- **Both Hands Up** → Slow motion shader (motion blur + frame ghosting)
- **Mouth Open** → Portal ripple
- **Eyebrow Raise** → Pixel sort glitch

### Environment FX Layers
- Liquify mesh deformation
- VHS + CRT distortion
- Pixel sorting
- Fractal glitch overlays
- Depth-based warping (MiDaS depth model)
- Neon edge maps with Canny GPU processing
- Fake gravity physics using optical flow

### Runtime Modes
- ✅ Webcam Mode
- ✅ Upload Video Mode (coming soon)
- ✅ Virtual Camera Output (OBS-style)
- 🚧 Mobile AR Mode (coming soon)

## 🏗️ Architecture

```
reality-glitcher/
├── backend/          # FastAPI server with MediaPipe CV
├── frontend/         # React + WebGPU shader engine
├── engine/           # Core effect processing
├── shaders/          # WGSL shader files
└── configs/          # Gesture mappings & effect configs
```

## 🚀 Quick Start

### Prerequisites
- Python 3.9+
- Node.js 18+
- Chrome/Edge with WebGPU enabled (chrome://flags/#enable-unsafe-webgpu)

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python server.py
```

Backend runs on `http://localhost:8000`

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:3000`

### Usage

1. Start backend server
2. Start frontend dev server
3. Open browser to `http://localhost:3000`
4. Allow camera permissions
4. Make gestures to trigger effects!

## 🧠 Tech Stack

### Computer Vision
- **MediaPipe** - Face mesh, hand detection, pose estimation
- **OpenCV** - Image processing
- **YOLOv8** (optional) - Advanced face detection

### Rendering
- **WebGPU** - Modern GPU acceleration
- **WGSL Shaders** - Real-time effect rendering
- **React** - UI framework

### Backend
- **FastAPI** - High-performance API server
- **WebSockets** - Real-time gesture event streaming
- **pyvirtualcam** - Virtual camera output

## 📁 Project Structure

### Backend
- `server.py` - FastAPI server with WebSocket support
- `models/` - MediaPipe gesture detection
- `effects/` - CPU-based effect implementations
- `engine/` - Effect registry and processing

### Frontend
- `src/App.tsx` - Main application
- `src/components/` - React components
- `src/engine/ShaderEngine.ts` - WebGPU shader engine
- `src/shaders/` - WGSL shader files
- `src/utils/` - WebSocket manager

### Configs
- `gestures.json` - Gesture to effect mappings
- `effects.json` - Effect configurations
- `pipelines.yaml` - Effect pipeline definitions

## 🎨 Effects

### Available Effects
1. **Liquify** - Mesh deformation with wave distortion
2. **VHS** - Retro CRT scanlines and chromatic aberration
3. **Pixel Sort** - Glitch effect sorting pixels by brightness
4. **Matrix** - Falling code rain overlay
5. **Gravity Flip** - Invert world with gravity distortion
6. **Slow Motion** - Motion blur and frame ghosting
7. **Portal Ripple** - Ripple effect from center point
8. **Glitch** - Digital corruption and color separation

## 🔧 Configuration

Edit `configs/gestures.json` to customize gesture mappings:

```json
{
  "gesture_mappings": {
    "blink": ["flipGravity"],
    "smile": ["liquify"],
    "raise_hand": ["matrix"]
  }
}
```

## 🎥 Virtual Camera

Enable virtual camera output to use in OBS, Zoom, Discord, etc.:

```python
from engine.virtual_cam import VirtualCamera

cam = VirtualCamera(width=1280, height=720, fps=30)
cam.start()
cam.send_frame(processed_frame)
```

## 🚧 Roadmap

### Phase 1 - MVP ✅
- [x] Gesture detection (MediaPipe)
- [x] WebGPU shader engine
- [x] Basic effects (liquify, VHS, glitch, matrix)
- [x] WebSocket event streaming
- [x] React UI

### Phase 2 - Advanced Effects
- [ ] MiDaS depth estimation
- [ ] Optical flow for motion vectors
- [ ] Multi-effect chaining
- [ ] Custom shader hot-reload

### Phase 3 - Virtual Camera
- [ ] OBS integration
- [ ] Zoom/Meet/Twitch streaming
- [ ] Frame rate optimization

### Phase 4 - Mobile
- [ ] Flutter wrapper
- [ ] WebGPU mobile support
- [ ] AR mode

### Phase 5 - Social Features
- [ ] Auto-record TikTok clips
- [ ] Music sync
- [ ] One-click export

## 🤝 Contributing

This is a showcase project. Feel free to fork and experiment!

## 📝 License

MIT License - Go wild!

## 🙏 Credits

Built with:
- MediaPipe by Google
- WebGPU by W3C
- FastAPI
- React
- And lots of coffee ☕

---


