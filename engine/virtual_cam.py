"""
Virtual camera output using pyvirtualcam
Allows output to OBS, Zoom, Discord, etc.
"""

import numpy as np
import cv2
from typing import Optional
import logging

logger = logging.getLogger(__name__)

class VirtualCamera:
    """Virtual camera output"""
    
    def __init__(self, width: int = 1280, height: int = 720, fps: int = 30):
        self.width = width
        self.height = height
        self.fps = fps
        self.camera: Optional[object] = None
        self.is_active = False
    
    def start(self):
        """Start virtual camera"""
        try:
            import pyvirtualcam
            self.camera = pyvirtualcam.Camera(
                width=self.width,
                height=self.height,
                fps=self.fps,
                fmt=pyvirtualcam.PixelFormat.RGB
            )
            self.is_active = True
            logger.info(f"Virtual camera started: {self.width}x{self.height} @ {self.fps}fps")
        except ImportError:
            logger.warning("pyvirtualcam not available. Install with: pip install pyvirtualcam")
            self.is_active = False
        except Exception as e:
            logger.error(f"Failed to start virtual camera: {e}")
            self.is_active = False
    
    def send_frame(self, frame: np.ndarray):
        """Send frame to virtual camera"""
        if not self.is_active or self.camera is None:
            return
        
        try:
            # Resize if needed
            if frame.shape[1] != self.width or frame.shape[0] != self.height:
                frame = cv2.resize(frame, (self.width, self.height))
            
            # Convert BGR to RGB
            if len(frame.shape) == 3 and frame.shape[2] == 3:
                frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            else:
                frame_rgb = frame
            
            # Send to virtual camera
            self.camera.send(frame_rgb)
            self.camera.sleep_until_next_frame()
        except Exception as e:
            logger.error(f"Error sending frame to virtual camera: {e}")
    
    def stop(self):
        """Stop virtual camera"""
        if self.camera is not None:
            try:
                self.camera.close()
                self.is_active = False
                logger.info("Virtual camera stopped")
            except Exception as e:
                logger.error(f"Error stopping virtual camera: {e}")

