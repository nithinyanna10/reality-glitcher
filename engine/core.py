"""
Core effect engine for loading and applying effects
"""

from typing import List, Dict, Optional
import numpy as np
import cv2

class EffectEngine:
    """Main effect engine for processing frames"""
    
    def __init__(self):
        self.active_effects: List[str] = []
        self.effect_instances: Dict = {}
        self.frame_history: List[np.ndarray] = []
        self.max_history = 2
    
    def load_effect(self, effect_name: str, effect_class):
        """Load an effect instance"""
        self.effect_instances[effect_name] = effect_class
    
    def activate_effect(self, effect_name: str):
        """Activate an effect"""
        if effect_name not in self.active_effects:
            self.active_effects.append(effect_name)
    
    def deactivate_effect(self, effect_name: str):
        """Deactivate an effect"""
        if effect_name in self.active_effects:
            self.active_effects.remove(effect_name)
    
    def toggle_effect(self, effect_name: str):
        """Toggle effect on/off"""
        if effect_name in self.active_effects:
            self.deactivate_effect(effect_name)
        else:
            self.activate_effect(effect_name)
    
    def process_frame(self, frame: np.ndarray) -> np.ndarray:
        """Process frame through all active effects"""
        if frame is None:
            return frame
        
        result = frame.copy()
        
        # Store frame history for effects that need previous frames
        self.frame_history.append(result.copy())
        if len(self.frame_history) > self.max_history:
            self.frame_history.pop(0)
        
        prev_frame = self.frame_history[0] if len(self.frame_history) > 1 else None
        
        # Apply effects in order
        for effect_name in self.active_effects:
            if effect_name in self.effect_instances:
                effect = self.effect_instances[effect_name]
                try:
                    # Apply effect (effects handle their own parameters)
                    if hasattr(effect, 'apply'):
                        if effect_name == 'slow_motion':
                            result = effect.apply(result, prev_frame)
                        elif effect_name in ['portal_ripple', 'liquify']:
                            # These need center point - use frame center for now
                            h, w = result.shape[:2]
                            center = (w // 2, h // 2)
                            result = effect.apply(result, center)
                        else:
                            result = effect.apply(result)
                except Exception as e:
                    print(f"Error applying effect {effect_name}: {e}")
        
        return result
    
    def clear_effects(self):
        """Clear all active effects"""
        self.active_effects = []

