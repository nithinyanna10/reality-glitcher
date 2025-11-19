"""
VHS/CRT distortion effect
"""

import numpy as np
import cv2
from typing import Tuple

class VHSEffect:
    """VHS-style distortion with scanlines and color shifts"""
    
    def __init__(self, intensity: float = 0.5):
        self.intensity = intensity
        self.scanline_offset = 0
    
    def apply(self, frame: np.ndarray) -> np.ndarray:
        """Apply VHS distortion to frame"""
        h, w = frame.shape[:2]
        result = frame.copy().astype(np.float32)
        
        # Scanlines
        scanline_pattern = np.sin(np.arange(h) * 0.1 + self.scanline_offset) * 0.1 + 0.9
        scanline_pattern = scanline_pattern.reshape(-1, 1)
        result = result * scanline_pattern
        
        # Color channel shift (chromatic aberration)
        shift_amount = int(3 * self.intensity)
        b, g, r = cv2.split(result)
        
        # Shift channels
        b_shifted = np.roll(b, -shift_amount, axis=1)
        r_shifted = np.roll(r, shift_amount, axis=1)
        
        result = cv2.merge([b_shifted, g, r_shifted])
        
        # Add noise
        noise = np.random.normal(0, 5 * self.intensity, result.shape).astype(np.float32)
        result = np.clip(result + noise, 0, 255)
        
        # Update scanline offset
        self.scanline_offset += 0.1
        
        return result.astype(np.uint8)

