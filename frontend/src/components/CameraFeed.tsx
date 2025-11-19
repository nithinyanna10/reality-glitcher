import { useEffect, useRef, useState } from 'react'
import { ShaderEngine } from '../engine/ShaderEngine'
import { WebSocketManager } from '../utils/WebSocketManager'
import './CameraFeed.css'

interface CameraFeedProps {
  isActive: boolean
  onFPSUpdate: (fps: number) => void
}

export default function CameraFeed({ isActive, onFPSUpdate }: CameraFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const shaderEngineRef = useRef<ShaderEngine | null>(null)
  const wsManagerRef = useRef<WebSocketManager | null>(null)
  const animationFrameRef = useRef<number>()
  const [activeEffects, setActiveEffects] = useState<string[]>([])
  const fpsRef = useRef({ lastTime: 0, frameCount: 0, fps: 0 })

  useEffect(() => {
    if (!isActive) {
      // Cleanup
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (wsManagerRef.current) {
        wsManagerRef.current.disconnect()
      }
      return
    }

    // Initialize camera
    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720 }
        })
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play()
        }

        // Initialize WebGPU shader engine
        if (canvasRef.current) {
          const engine = new ShaderEngine(canvasRef.current)
          await engine.init()
          shaderEngineRef.current = engine
        }

        // Initialize WebSocket connection
        const wsManager = new WebSocketManager()
        wsManager.onGestureEvent = (event) => {
          setActiveEffects(event.active_effects || [])
          if (shaderEngineRef.current) {
            shaderEngineRef.current.setActiveEffects(event.active_effects || [])
          }
        }
        await wsManager.connect()
        wsManagerRef.current = wsManager

        // Start render loop
        startRenderLoop()
      } catch (error) {
        console.error('Error initializing camera:', error)
      }
    }

    initCamera()

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isActive])

  const startRenderLoop = () => {
    const render = () => {
      if (!videoRef.current || !canvasRef.current || !shaderEngineRef.current) {
        animationFrameRef.current = requestAnimationFrame(render)
        return
      }

      const video = videoRef.current
      const canvas = canvasRef.current

      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        // Update FPS
        const now = performance.now()
        fpsRef.current.frameCount++
        if (now - fpsRef.current.lastTime >= 1000) {
          fpsRef.current.fps = fpsRef.current.frameCount
          fpsRef.current.frameCount = 0
          fpsRef.current.lastTime = now
          onFPSUpdate(fpsRef.current.fps)
        }

        // Render frame with shaders
        shaderEngineRef.current.render(video)

        // Send frame to backend for gesture detection (throttled)
        if (wsManagerRef.current && fpsRef.current.frameCount % 5 === 0) {
          const imageData = captureFrame(video, canvas)
          if (imageData) {
            wsManagerRef.current.sendFrame(imageData)
          }
        }
      }

      animationFrameRef.current = requestAnimationFrame(render)
    }

    render()
  }

  const captureFrame = (video: HTMLVideoElement, canvas: HTMLCanvasElement): string | null => {
    try {
      const ctx = canvas.getContext('2d')
      if (!ctx) return null

      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      ctx.drawImage(video, 0, 0)
      
      return canvas.toDataURL('image/jpeg', 0.8)
    } catch (error) {
      console.error('Error capturing frame:', error)
      return null
    }
  }

  return (
    <div className="camera-feed">
      <video
        ref={videoRef}
        className="camera-video"
        autoPlay
        playsInline
        muted
        style={{ display: 'none' }}
      />
      <canvas
        ref={canvasRef}
        className="camera-canvas"
      />
      {activeEffects.length > 0 && (
        <div className="active-effects">
          {activeEffects.map(effect => (
            <span key={effect} className="effect-badge">{effect}</span>
          ))}
        </div>
      )}
    </div>
  )
}

