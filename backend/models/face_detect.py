"""
Face detection using MediaPipe Face Mesh
Detects facial landmarks for gesture recognition
"""

import cv2
import mediapipe as mp
import numpy as np
from typing import List, Tuple, Optional

class FaceDetector:
    """MediaPipe-based face detection and landmark extraction"""
    
    def __init__(self):
        self.mp_face_mesh = mp.solutions.face_mesh
        self.face_mesh = self.mp_face_mesh.FaceMesh(
            static_image_mode=False,
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        self.mp_drawing = mp.solutions.drawing_utils
        
        # Key landmark indices for gesture detection
        self.EYE_INDICES = {
            'left': [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246],
            'right': [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398]
        }
        self.MOUTH_INDICES = [61, 146, 91, 181, 84, 17, 314, 405, 320, 307, 375, 321, 308, 324, 318]
        self.EYEBROW_INDICES = {
            'left': [107, 55, 65, 52, 53, 46],
            'right': [336, 296, 334, 293, 300, 276]
        }
    
    def detect(self, frame: np.ndarray) -> Optional[List]:
        """Detect face landmarks in frame"""
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self.face_mesh.process(rgb_frame)
        
        if results.multi_face_landmarks:
            return results.multi_face_landmarks[0]
        return None
    
    def get_eye_aspect_ratio(self, landmarks) -> Tuple[float, float]:
        """Calculate Eye Aspect Ratio (EAR) for blink detection"""
        def calculate_ear(eye_indices):
            # Get eye landmark coordinates
            eye_points = []
            for idx in eye_indices:
                if idx < len(landmarks.landmark):
                    x = landmarks.landmark[idx].x
                    y = landmarks.landmark[idx].y
                    eye_points.append((x, y))
            
            if len(eye_points) < 6:
                return 0.0
            
            # Calculate distances
            # Vertical distances
            v1 = np.linalg.norm(np.array(eye_points[1]) - np.array(eye_points[5]))
            v2 = np.linalg.norm(np.array(eye_points[2]) - np.array(eye_points[4]))
            # Horizontal distance
            h = np.linalg.norm(np.array(eye_points[0]) - np.array(eye_points[3]))
            
            if h == 0:
                return 0.0
            
            ear = (v1 + v2) / (2.0 * h)
            return ear
        
        left_ear = calculate_ear(self.EYE_INDICES['left'])
        right_ear = calculate_ear(self.EYE_INDICES['right'])
        
        return left_ear, right_ear
    
    def get_mouth_open_ratio(self, landmarks) -> float:
        """Calculate mouth openness ratio"""
        if not landmarks:
            return 0.0
        
        # Key mouth points
        upper_lip = landmarks.landmark[13].y
        lower_lip = landmarks.landmark[14].y
        mouth_corner_left = landmarks.landmark[61].y
        mouth_corner_right = landmarks.landmark[291].y
        
        # Vertical distance (mouth opening)
        vertical_dist = abs(upper_lip - lower_lip)
        # Horizontal distance (mouth width)
        horizontal_dist = abs(mouth_corner_left - mouth_corner_right)
        
        if horizontal_dist == 0:
            return 0.0
        
        return vertical_dist / horizontal_dist
    
    def get_smile_ratio(self, landmarks) -> float:
        """Calculate smile curvature ratio"""
        if not landmarks:
            return 0.0
        
        # Mouth corner points
        left_corner = np.array([landmarks.landmark[61].x, landmarks.landmark[61].y])
        right_corner = np.array([landmarks.landmark[291].x, landmarks.landmark[291].y])
        mouth_center = np.array([landmarks.landmark[13].x, landmarks.landmark[13].y])
        
        # Calculate curvature
        left_to_center = np.linalg.norm(left_corner - mouth_center)
        right_to_center = np.linalg.norm(right_corner - mouth_center)
        corner_distance = np.linalg.norm(left_corner - right_corner)
        
        if corner_distance == 0:
            return 0.0
        
        # Smile ratio: higher when corners are further from center
        smile_ratio = (left_to_center + right_to_center) / corner_distance
        return smile_ratio
    
    def get_eyebrow_raise(self, landmarks) -> Tuple[bool, bool]:
        """Detect eyebrow raise (simplified)"""
        if not landmarks:
            return False, False
        
        # Compare eyebrow position to eye position
        # Simplified: check if eyebrow landmarks are higher than normal
        left_eyebrow_y = landmarks.landmark[107].y
        right_eyebrow_y = landmarks.landmark[336].y
        left_eye_y = landmarks.landmark[33].y
        right_eye_y = landmarks.landmark[362].y
        
        left_raised = left_eyebrow_y < left_eye_y - 0.02
        right_raised = right_eyebrow_y < right_eye_y - 0.02
        
        return left_raised, right_raised

