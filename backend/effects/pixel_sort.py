"""
Pixel sorting effect (separate from glitch for modularity)
"""

import numpy as np
import cv2

class PixelSortEffect:
    """Pixel sorting glitch effect"""
    
    def __init__(self, intensity: float = 0.5):
        self.intensity = intensity
    
    def apply(self, frame: np.ndarray, direction: str = "horizontal") -> np.ndarray:
        """
        Apply pixel sorting effect
        direction: 'horizontal' or 'vertical'
        """
        result = frame.copy()
        h, w = frame.shape[:2]
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        
        threshold = int(200 * (1 - self.intensity))
        
        if direction == "horizontal":
            for y in range(h):
                row = gray[y, :]
                mask = row > threshold
                
                if np.any(mask):
                    indices = np.where(mask)[0]
                    if len(indices) > 1:
                        sorted_indices = np.argsort(gray[y, indices])
                        result[y, indices] = result[y, indices[sorted_indices]]
        
        elif direction == "vertical":
            for x in range(w):
                col = gray[:, x]
                mask = col > threshold
                
                if np.any(mask):
                    indices = np.where(mask)[0]
                    if len(indices) > 1:
                        sorted_indices = np.argsort(gray[indices, x])
                        result[indices, x] = result[indices[sorted_indices], x]
        
        return result

