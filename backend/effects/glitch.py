"""
Glitch effects: pixel sort, data corruption, etc.
"""

import numpy as np
import cv2

class GlitchEffect:
    """Various glitch effects"""
    
    def __init__(self, intensity: float = 0.5):
        self.intensity = intensity
    
    def pixel_sort(self, frame: np.ndarray, threshold: float = 0.5) -> np.ndarray:
        """
        Pixel sort glitch effect
        Sorts pixels in rows/columns based on brightness
        """
        result = frame.copy()
        h, w = frame.shape[:2]
        
        # Convert to grayscale for threshold
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        
        # Find bright regions
        mask = gray > (threshold * 255)
        
        # Sort pixels in each row where mask is True
        for y in range(h):
            row_mask = mask[y, :]
            if np.any(row_mask):
                # Get indices where mask is True
                indices = np.where(row_mask)[0]
                if len(indices) > 1:
                    # Sort pixels in this region
                    sorted_indices = np.argsort(gray[y, indices])
                    result[y, indices] = result[y, indices[sorted_indices]]
        
        return result
    
    def data_corruption(self, frame: np.ndarray) -> np.ndarray:
        """Data corruption glitch - random block shifts"""
        result = frame.copy()
        h, w = frame.shape[:2]
        
        # Random block corruption
        num_blocks = int(10 * self.intensity)
        for _ in range(num_blocks):
            block_h = np.random.randint(5, 30)
            block_w = np.random.randint(5, 30)
            y = np.random.randint(0, h - block_h)
            x = np.random.randint(0, w - block_w)
            
            # Shift block
            shift_x = np.random.randint(-20, 20)
            shift_y = np.random.randint(-20, 20)
            
            new_x = np.clip(x + shift_x, 0, w - block_w)
            new_y = np.clip(y + shift_y, 0, h - block_h)
            
            result[y:y+block_h, x:x+block_w] = frame[new_y:new_y+block_h, new_x:new_x+block_w]
        
        return result

