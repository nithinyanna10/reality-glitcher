"""
Effect registry - maps gestures to shader/effect pipelines
"""

import json
import os
from typing import Dict, List, Set
from pathlib import Path

class EffectRegistry:
    """Registry for mapping gestures to effects"""
    
    def __init__(self, config_path: str = None):
        self.gesture_to_effects: Dict[str, List[str]] = {}
        self.active_effects: Set[str] = set()
        self.effect_enabled: Dict[str, bool] = {}
        
        if config_path is None:
            config_path = os.path.join(
                Path(__file__).parent.parent,
                "configs",
                "gestures.json"
            )
        
        self.load_config(config_path)
    
    def load_config(self, config_path: str):
        """Load gesture-to-effect mapping from config file"""
        try:
            if os.path.exists(config_path):
                with open(config_path, 'r') as f:
                    config = json.load(f)
                    self.gesture_to_effects = config.get("gesture_mappings", {})
                    # Initialize all effects as enabled
                    for effects in self.gesture_to_effects.values():
                        for effect in effects:
                            self.effect_enabled[effect] = True
            else:
                # Default mappings
                self.gesture_to_effects = {
                    "blink": ["flipGravity"],
                    "smile": ["liquify"],
                    "raise_hand": ["matrix"],
                    "head_tilt": ["vhs"],
                    "both_hands_up": ["slow_motion"],
                    "mouth_open": ["portal_ripple"],
                    "eyebrow_raise": ["pixel_sort"]
                }
                # Save default config
                self.save_config(config_path)
        except Exception as e:
            print(f"Error loading config: {e}")
            # Use defaults
            self.gesture_to_effects = {
                "blink": ["flipGravity"],
                "smile": ["liquify"],
                "raise_hand": ["matrix"],
                "head_tilt": ["vhs"],
                "both_hands_up": ["slow_motion"],
                "mouth_open": ["portal_ripple"],
                "eyebrow_raise": ["pixel_sort"]
            }
    
    def save_config(self, config_path: str):
        """Save current configuration to file"""
        try:
            os.makedirs(os.path.dirname(config_path), exist_ok=True)
            config = {
                "gesture_mappings": self.gesture_to_effects
            }
            with open(config_path, 'w') as f:
                json.dump(config, f, indent=2)
        except Exception as e:
            print(f"Error saving config: {e}")
    
    def get_effects_for_gestures(self, gestures: Dict[str, bool]) -> List[str]:
        """
        Get list of effects to activate based on current gestures
        Returns list of effect names
        """
        active_effects = set()
        
        for gesture, is_active in gestures.items():
            if is_active and gesture in self.gesture_to_effects:
                effects = self.gesture_to_effects[gesture]
                for effect in effects:
                    if self.effect_enabled.get(effect, True):
                        active_effects.add(effect)
        
        return list(active_effects)
    
    def toggle_effect(self, effect_name: str):
        """Toggle an effect on/off"""
        self.effect_enabled[effect_name] = not self.effect_enabled.get(effect_name, True)
    
    def enable_effect(self, effect_name: str):
        """Enable an effect"""
        self.effect_enabled[effect_name] = True
    
    def disable_effect(self, effect_name: str):
        """Disable an effect"""
        self.effect_enabled[effect_name] = False
    
    def register_gesture_mapping(self, gesture: str, effects: List[str]):
        """Register a new gesture-to-effect mapping"""
        self.gesture_to_effects[gesture] = effects
        for effect in effects:
            if effect not in self.effect_enabled:
                self.effect_enabled[effect] = True

