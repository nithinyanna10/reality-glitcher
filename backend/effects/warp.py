"""
Warping effects: portal ripple, gravity flip, etc.
"""

import numpy as np
import cv2
from typing import Tuple

class WarpEffect:
    """Various warping effects"""
    
    def __init__(self, intensity: float = 0.5):
        self.intensity = intensity
        self.time = 0.0
    
    def portal_ripple(self, frame: np.ndarray, center: Tuple[int, int]) -> np.ndarray:
        """Portal ripple effect from center point"""
        h, w = frame.shape[:2]
        result = frame.copy()
        
        # Create ripple displacement map
        y, x = np.ogrid[:h, :w]
        dx = x - center[0]
        dy = y - center[1]
        dist = np.sqrt(dx**2 + dy**2)
        
        # Ripple wave
        wave = np.sin(dist * 0.1 - self.time * 2) * self.intensity * 20
        
        # Calculate new positions
        angle = np.arctan2(dy, dx)
        new_x = (x + wave * np.cos(angle)).astype(np.float32)
        new_y = (y + wave * np.sin(angle)).astype(np.float32)
        
        # Clamp
        new_x = np.clip(new_x, 0, w - 1)
        new_y = np.clip(new_y, 0, h - 1)
        
        result = cv2.remap(frame, new_x, new_y, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
        
        self.time += 0.1
        return result
    
    def gravity_flip(self, frame: np.ndarray, flip_vertical: bool = True) -> np.ndarray:
        """Gravity flip effect - invert and add distortion"""
        if flip_vertical:
            result = cv2.flip(frame, 0)  # Vertical flip
        else:
            result = cv2.flip(frame, 1)  # Horizontal flip
        
        # Add warping to simulate gravity
        h, w = result.shape[:2]
        y, x = np.ogrid[:h, :w]
        
        # Gravity distortion (stronger at bottom)
        gravity_strength = (y / h) * self.intensity * 10
        new_x = (x + np.sin(x * 0.05) * gravity_strength).astype(np.float32)
        new_y = y.astype(np.float32)
        
        new_x = np.clip(new_x, 0, w - 1)
        result = cv2.remap(result, new_x, new_y, cv2.INTER_LINEAR)
        
        return result
    
    def slow_motion_shader(self, frame: np.ndarray, prev_frame: np.ndarray = None) -> np.ndarray:
        """Slow motion effect with motion blur and frame ghosting"""
        if prev_frame is None:
            return frame
        
        # Motion blur
        kernel_size = int(15 * self.intensity)
        if kernel_size % 2 == 0:
            kernel_size += 1
        
        blurred = cv2.GaussianBlur(frame, (kernel_size, kernel_size), 0)
        
        # Frame ghosting (blend with previous frame)
        ghost_alpha = 0.3 * self.intensity
        result = cv2.addWeighted(blurred, 1 - ghost_alpha, prev_frame, ghost_alpha, 0)
        
        return result

