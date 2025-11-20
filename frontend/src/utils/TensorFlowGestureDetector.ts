/**
 * TensorFlow.js-based gesture detection
 * Uses face landmarks to detect gestures
 */

import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection'

export interface GestureResult {
  blink: boolean
  smile: boolean
  raise_hand: boolean
  both_hands_up: boolean
  head_tilt: boolean
  mouth_open: boolean
  eyebrow_raise: boolean
}

export class TensorFlowGestureDetector {
  private model: faceLandmarksDetection.FaceLandmarksDetector | null = null
  private isInitialized = false
  private blinkCounter = 0
  private lastEyeAspectRatio = 0.3

  async init(): Promise<boolean> {
    try {
      console.log('Loading TensorFlow.js face landmarks model...')
      
      // Load the MediaPipe face mesh model
      this.model = await faceLandmarksDetection.createDetector(
        faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh,
        {
          runtime: 'mediapipe',
          solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh',
          refineLandmarks: true,
        } as any
      )
      
      this.isInitialized = true
      console.log('TensorFlow.js gesture detector initialized')
      return true
    } catch (error) {
      console.error('Failed to initialize TensorFlow.js detector:', error)
      return false
    }
  }

  async detect(video: HTMLVideoElement): Promise<GestureResult> {
    if (!this.isInitialized || !this.model) {
      return this.getEmptyGestures()
    }

    try {
      const faces = await this.model.estimateFaces(video, {
        flipHorizontal: false,
        staticImageMode: false,
      } as any)

      if (faces.length === 0) {
        return this.getEmptyGestures()
      }

      const face = faces[0]
      // Handle different API versions - keypoints might be in different format
      const keypoints = (face as any).keypoints || (face as any).landmarks || []

      // Detect gestures from keypoints
      const gestures: GestureResult = {
        blink: this.detectBlink(keypoints),
        smile: this.detectSmile(keypoints),
        raise_hand: false, // Would need hand detection
        both_hands_up: false,
        head_tilt: this.detectHeadTilt(keypoints),
        mouth_open: this.detectMouthOpen(keypoints),
        eyebrow_raise: this.detectEyebrowRaise(keypoints),
      }

      return gestures
    } catch (error) {
      console.error('Error detecting gestures:', error)
      return this.getEmptyGestures()
    }
  }

  private detectBlink(keypoints: any[]): boolean {
    // Eye aspect ratio for blink detection
    // Keypoints: left eye (33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246)
    // Right eye (362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398)
    
    const leftEyeIndices = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246]
    const rightEyeIndices = [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398]

    const leftEAR = this.calculateEAR(keypoints, leftEyeIndices)
    const rightEAR = this.calculateEAR(keypoints, rightEyeIndices)
    const avgEAR = (leftEAR + rightEAR) / 2

    if (avgEAR < 0.25 && this.lastEyeAspectRatio > 0.25) {
      this.blinkCounter++
      if (this.blinkCounter > 2) {
        this.lastEyeAspectRatio = avgEAR
        return true
      }
    } else {
      this.blinkCounter = 0
    }

    this.lastEyeAspectRatio = avgEAR
    return false
  }

  private calculateEAR(keypoints: any[], indices: number[]): number {
    if (indices.length < 6 || !keypoints || keypoints.length === 0) return 0.3

    // Get eye landmark coordinates - handle different keypoint formats
    const points = indices.slice(0, 6).map((idx, i) => {
      // Try different ways to access keypoints
      let kp = null
      if (Array.isArray(keypoints)) {
        kp = keypoints[idx] || keypoints.find((k: any) => k.name === idx.toString() || k.name === idx)
      }
      
      if (kp) {
        return { 
          x: kp.x !== undefined ? kp.x : (kp as any)[0], 
          y: kp.y !== undefined ? kp.y : (kp as any)[1] 
        }
      }
      return null
    }).filter(p => p !== null) as { x: number; y: number }[]

    if (points.length < 6) return 0.3

    // Calculate distances
    const vertical1 = Math.abs(points[1].y - points[5].y)
    const vertical2 = Math.abs(points[2].y - points[4].y)
    const horizontal = Math.abs(points[0].x - points[3].x)

    if (horizontal === 0) return 0.3

    return (vertical1 + vertical2) / (2.0 * horizontal)
  }

  private getKeypoint(keypoints: any[], index: number): { x: number; y: number } | null {
    if (!keypoints || keypoints.length === 0) return null
    
    // Try different ways to access keypoints
    let kp = null
    if (Array.isArray(keypoints)) {
      kp = keypoints[index] || keypoints.find((k: any) => k.name === index.toString() || k.name === index)
    }
    
    if (kp) {
      return {
        x: kp.x !== undefined ? kp.x : (kp as any)[0],
        y: kp.y !== undefined ? kp.y : (kp as any)[1]
      }
    }
    return null
  }

  private detectSmile(keypoints: any[]): boolean {
    // Mouth corner points (MediaPipe indices)
    const leftCorner = this.getKeypoint(keypoints, 61)
    const rightCorner = this.getKeypoint(keypoints, 291)
    const upperLip = this.getKeypoint(keypoints, 13)
    const lowerLip = this.getKeypoint(keypoints, 14)

    if (!leftCorner || !rightCorner || !upperLip || !lowerLip) {
      return false
    }

    const mouthWidth = Math.abs(leftCorner.x - rightCorner.x)
    const mouthHeight = Math.abs(upperLip.y - lowerLip.y)

    // Smile detection: wider mouth with less height
    return mouthWidth > 0.05 && mouthHeight < 0.02
  }

  private detectMouthOpen(keypoints: any[]): boolean {
    const upperLip = this.getKeypoint(keypoints, 13)
    const lowerLip = this.getKeypoint(keypoints, 14)

    if (!upperLip || !lowerLip) {
      return false
    }

    const mouthOpen = Math.abs(upperLip.y - lowerLip.y)
    return mouthOpen > 0.03
  }

  private detectHeadTilt(keypoints: any[]): boolean {
    const nose = this.getKeypoint(keypoints, 1)
    const leftEye = this.getKeypoint(keypoints, 33)
    const rightEye = this.getKeypoint(keypoints, 362)

    if (!nose || !leftEye || !rightEye) {
      return false
    }

    // Calculate head tilt angle
    const eyeMidX = (leftEye.x + rightEye.x) / 2
    const tilt = Math.abs(nose.x - eyeMidX)

    return tilt > 0.05
  }

  private detectEyebrowRaise(keypoints: any[]): boolean {
    const leftEyebrow = this.getKeypoint(keypoints, 107)
    const rightEyebrow = this.getKeypoint(keypoints, 336)
    const leftEye = this.getKeypoint(keypoints, 33)
    const rightEye = this.getKeypoint(keypoints, 362)

    if (!leftEyebrow || !rightEyebrow || !leftEye || !rightEye) {
      return false
    }

    const leftRaised = leftEyebrow.y < leftEye.y - 0.01
    const rightRaised = rightEyebrow.y < rightEye.y - 0.01

    return leftRaised || rightRaised
  }

  private getEmptyGestures(): GestureResult {
    return {
      blink: false,
      smile: false,
      raise_hand: false,
      both_hands_up: false,
      head_tilt: false,
      mouth_open: false,
      eyebrow_raise: false,
    }
  }
}

