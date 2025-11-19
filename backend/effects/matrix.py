"""
Matrix-style falling code effect
"""

import numpy as np
import cv2
from typing import List, Tuple

class MatrixEffect:
    """Matrix rain effect overlay"""
    
    def __init__(self, intensity: float = 0.5):
        self.intensity = intensity
        self.columns: List[dict] = []
        self.chars = "01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン"
        self.init_columns()
    
    def init_columns(self, num_columns: int = 50):
        """Initialize falling code columns"""
        self.columns = []
        for i in range(num_columns):
            self.columns.append({
                'x': i * 20,
                'y': np.random.randint(-100, 0),
                'speed': np.random.uniform(2, 5),
                'length': np.random.randint(10, 30),
                'chars': [np.random.choice(list(self.chars)) for _ in range(30)]
            })
    
    def apply(self, frame: np.ndarray) -> np.ndarray:
        """Apply matrix rain overlay to frame"""
        h, w = frame.shape[:2]
        overlay = frame.copy()
        
        # Draw falling code
        for col in self.columns:
            x = col['x']
            y = int(col['y'])
            
            # Draw characters in column
            for i, char in enumerate(col['chars']):
                char_y = y + i * 20
                if 0 <= char_y < h and 0 <= x < w:
                    # Brightness decreases down the column
                    brightness = int(255 * (1 - i / len(col['chars'])))
                    color = (0, brightness, 0)  # Green matrix style
                    
                    # Draw character (simplified - would use proper font rendering)
                    cv2.putText(overlay, char, (x, char_y), 
                              cv2.FONT_HERSHEY_SIMPLEX, 0.4, color, 1)
            
            # Update column position
            col['y'] += col['speed']
            if col['y'] > h:
                col['y'] = -100
                col['x'] = np.random.randint(0, w)
        
        # Blend with original
        result = cv2.addWeighted(frame, 1 - self.intensity, overlay, self.intensity, 0)
        return result

