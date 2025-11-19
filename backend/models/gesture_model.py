"""
Gesture detection model combining face and hand detection
Detects: blink, smile, hand raise, mouth open, head tilt, eyebrow raise
"""

import cv2
import numpy as np
from typing import Dict, Optional
from .face_detect import FaceDetector, MEDIAPIPE_AVAILABLE

try:
    import mediapipe as mp
except ImportError:
    mp = None

class GestureDetector:
    """Main gesture detection class using MediaPipe"""
    
    def __init__(self):
        self.face_detector = FaceDetector()
        
        if not MEDIAPIPE_AVAILABLE or mp is None:
            self.hands = None
            self.pose = None
            self.mp_hands = None
            self.mp_pose = None
            return
        
        # Hand detection
        self.mp_hands = mp.solutions.hands
        self.hands = self.mp_hands.Hands(
            static_image_mode=False,
            max_num_hands=2,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        
        # Pose detection for head tilt
        self.mp_pose = mp.solutions.pose
        self.pose = self.mp_pose.Pose(
            static_image_mode=False,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        
        # Thresholds
        self.BLINK_THRESHOLD = 0.25
        self.SMILE_THRESHOLD = 0.5
        self.MOUTH_OPEN_THRESHOLD = 0.3
        self.EYEBROW_RAISE_THRESHOLD = True  # Boolean check
        
        # State tracking for debouncing
        self.last_gestures = {}
        self.blink_counter = 0
        self.blink_threshold_frames = 3
    
    def detect_all(self, frame_data: str) -> Dict[str, bool]:
        """
        Detect all gestures from frame data
        frame_data can be base64 encoded image or numpy array
        """
        # Decode frame if needed
        if isinstance(frame_data, str):
            # Assume base64 encoded
            import base64
            try:
                nparr = np.frombuffer(base64.b64decode(frame_data), np.uint8)
                frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            except:
                # If decoding fails, return empty
                return self._empty_gestures()
        else:
            frame = frame_data
        
        if frame is None:
            return self._empty_gestures()
        
        gestures = {}
        
        # Face-based gestures
        face_landmarks = self.face_detector.detect(frame)
        if face_landmarks:
            gestures.update(self._detect_face_gestures(face_landmarks))
        else:
            gestures.update(self._empty_face_gestures())
        
        # Hand-based gestures
        gestures.update(self._detect_hand_gestures(frame))
        
        # Head tilt
        gestures.update(self._detect_head_tilt(frame))
        
        # Update state
        self.last_gestures = gestures
        
        return gestures
    
    def _detect_face_gestures(self, landmarks) -> Dict[str, bool]:
        """Detect face-based gestures"""
        gestures = {}
        
        # Blink detection
        left_ear, right_ear = self.face_detector.get_eye_aspect_ratio(landmarks)
        avg_ear = (left_ear + right_ear) / 2.0
        
        if avg_ear < self.BLINK_THRESHOLD:
            self.blink_counter += 1
            if self.blink_counter >= self.blink_threshold_frames:
                gestures['blink'] = True
        else:
            self.blink_counter = 0
            gestures['blink'] = False
        
        # Smile detection
        smile_ratio = self.face_detector.get_smile_ratio(landmarks)
        gestures['smile'] = smile_ratio > self.SMILE_THRESHOLD
        
        # Mouth open detection
        mouth_ratio = self.face_detector.get_mouth_open_ratio(landmarks)
        gestures['mouth_open'] = mouth_ratio > self.MOUTH_OPEN_THRESHOLD
        
        # Eyebrow raise
        left_raised, right_raised = self.face_detector.get_eyebrow_raise(landmarks)
        gestures['eyebrow_raise'] = left_raised or right_raised
        
        return gestures
    
    def _detect_hand_gestures(self, frame) -> Dict[str, bool]:
        """Detect hand-based gestures"""
        if self.hands is None:
            return {'raise_hand': False, 'both_hands_up': False}
        
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self.hands.process(rgb_frame)
        
        gestures = {
            'raise_hand': False,
            'both_hands_up': False
        }
        
        if results.multi_hand_landmarks:
            hand_count = len(results.multi_hand_landmarks)
            hands_up = 0
            
            for hand_landmarks in results.multi_hand_landmarks:
                # Check if hand is raised (wrist y < middle finger tip y)
                wrist_y = hand_landmarks.landmark[0].y
                middle_tip_y = hand_landmarks.landmark[12].y
                
                if wrist_y < middle_tip_y - 0.1:  # Hand is above
                    hands_up += 1
            
            gestures['raise_hand'] = hands_up >= 1
            gestures['both_hands_up'] = hands_up >= 2
        
        return gestures
    
    def _detect_head_tilt(self, frame) -> Dict[str, bool]:
        """Detect head tilt using pose estimation"""
        if self.pose is None:
            return {'head_tilt': False}
        
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self.pose.process(rgb_frame)
        
        gestures = {'head_tilt': False}
        
        if results.pose_landmarks:
            # Get nose and shoulder landmarks
            nose = results.pose_landmarks.landmark[self.mp_pose.PoseLandmark.NOSE]
            left_shoulder = results.pose_landmarks.landmark[self.mp_pose.PoseLandmark.LEFT_SHOULDER]
            right_shoulder = results.pose_landmarks.landmark[self.mp_pose.PoseLandmark.RIGHT_SHOULDER]
            
            # Calculate tilt angle
            shoulder_mid_x = (left_shoulder.x + right_shoulder.x) / 2
            shoulder_mid_y = (left_shoulder.y + right_shoulder.y) / 2
            
            # Angle from vertical
            dx = nose.x - shoulder_mid_x
            dy = nose.y - shoulder_mid_y
            
            # Threshold for tilt detection
            tilt_threshold = 0.15
            gestures['head_tilt'] = abs(dx) > tilt_threshold
        
        return gestures
    
    def _empty_gestures(self) -> Dict[str, bool]:
        """Return empty gesture dict"""
        return {
            'blink': False,
            'smile': False,
            'raise_hand': False,
            'both_hands_up': False,
            'head_tilt': False,
            'mouth_open': False,
            'eyebrow_raise': False
        }
    
    def _empty_face_gestures(self) -> Dict[str, bool]:
        """Return empty face gesture dict"""
        return {
            'blink': False,
            'smile': False,
            'mouth_open': False,
            'eyebrow_raise': False
        }

