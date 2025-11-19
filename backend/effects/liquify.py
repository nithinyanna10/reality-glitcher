"""
Liquify mesh deformation effect
"""

import numpy as np
import cv2
from typing import Tuple

class LiquifyEffect:
    """Liquify mesh deformation effect"""
    
    def __init__(self, intensity: float = 0.5):
        self.intensity = intensity
    
    def apply(self, frame: np.ndarray, center: Tuple[int, int], radius: int = 100) -> np.ndarray:
        """
        Apply liquify effect to frame
        center: (x, y) center point of liquify
        radius: radius of effect
        """
        h, w = frame.shape[:2]
        result = frame.copy()
        
        # Create mesh grid
        y, x = np.ogrid[:h, :w]
        
        # Distance from center
        dx = x - center[0]
        dy = y - center[1]
        dist = np.sqrt(dx**2 + dy**2)
        
        # Normalize distance
        dist_norm = np.clip(dist / radius, 0, 1)
        
        # Liquify displacement (wave-like)
        displacement = np.sin(dist_norm * np.pi * 2) * (1 - dist_norm) * self.intensity * radius
        
        # Calculate new positions
        angle = np.arctan2(dy, dx)
        new_x = (x + displacement * np.cos(angle)).astype(np.float32)
        new_y = (y + displacement * np.sin(angle)).astype(np.float32)
        
        # Clamp to image bounds
        new_x = np.clip(new_x, 0, w - 1)
        new_y = np.clip(new_y, 0, h - 1)
        
        # Remap
        map_x, map_y = np.meshgrid(np.arange(w), np.arange(h))
        map_x = new_x
        map_y = new_y
        
        result = cv2.remap(frame, map_x, map_y, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
        
        return result

