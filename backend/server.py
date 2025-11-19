"""
FastAPI server for Reality Glitcher
Handles WebSocket connections for gesture events and effect routing
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from typing import List, Dict
import asyncio
import json
import logging

import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from backend.models.face_detect import FaceDetector
from backend.models.gesture_model import GestureDetector
from engine.core import EffectEngine
from engine.registry import EffectRegistry

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Reality Glitcher API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global instances
face_detector = FaceDetector()
gesture_detector = GestureDetector()
effect_engine = EffectEngine()
effect_registry = EffectRegistry()

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"Client connected. Total connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
        logger.info(f"Client disconnected. Total connections: {len(self.active_connections)}")

    async def broadcast(self, message: dict):
        """Broadcast gesture events to all connected clients"""
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error(f"Error broadcasting to client: {e}")
                disconnected.append(connection)
        
        for conn in disconnected:
            self.disconnect(conn)

manager = ConnectionManager()

@app.get("/")
async def root():
    return {
        "message": "Reality Glitcher API",
        "version": "1.0.0",
        "endpoints": {
            "ws": "/ws",
            "health": "/health"
        }
    }

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "reality-glitcher"}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """Main WebSocket endpoint for gesture event streaming"""
    await manager.connect(websocket)
    
    try:
        while True:
            # Receive frame data or control messages from client
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message.get("type") == "frame":
                # Process frame for gestures
                frame_data = message.get("data")
                if frame_data:
                    # Detect gestures
                    gestures = await detect_gestures_async(frame_data)
                    
                    # Get active effects based on gestures
                    active_effects = effect_registry.get_effects_for_gestures(gestures)
                    
                    # Send gesture events and effects to client
                    await manager.broadcast({
                        "type": "gesture_event",
                        "gestures": gestures,
                        "active_effects": active_effects,
                        "timestamp": message.get("timestamp")
                    })
            
            elif message.get("type") == "control":
                # Handle control messages (start/stop, effect toggle, etc.)
                await handle_control_message(message)
                
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        logger.info("Client disconnected")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket)

async def detect_gestures_async(frame_data: str):
    """Async wrapper for gesture detection"""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, detect_gestures, frame_data)

def detect_gestures(frame_data: str) -> Dict[str, bool]:
    """Detect all gestures from frame data"""
    # This will be implemented in gesture_model.py
    # For now, return placeholder
    return gesture_detector.detect_all(frame_data)

async def handle_control_message(message: dict):
    """Handle control messages from client"""
    control_type = message.get("control")
    
    if control_type == "start":
        logger.info("Client requested start")
    elif control_type == "stop":
        logger.info("Client requested stop")
    elif control_type == "toggle_effect":
        effect_name = message.get("effect")
        effect_registry.toggle_effect(effect_name)
        logger.info(f"Toggled effect: {effect_name}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

