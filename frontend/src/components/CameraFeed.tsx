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
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const fpsRef = useRef({ lastTime: 0, frameCount: 0, fps: 0 })
  const fallbackCanvasRef = useRef<HTMLCanvasElement | null>(null)

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
      setIsLoading(true)
      setError(null)
      
      try {
        // Request camera access
        console.log('Requesting camera access...')
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user'
          }
        })
        
        console.log('Camera access granted')
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
          console.log('Video element playing')
        }

        // Try to initialize WebGPU shader engine
        let webgpuAvailable = false
        if (canvasRef.current) {
          try {
            const engine = new ShaderEngine(canvasRef.current)
            await engine.init()
            shaderEngineRef.current = engine
            webgpuAvailable = true
            console.log('WebGPU initialized successfully')
          } catch (webgpuError) {
            console.warn('WebGPU not available, using fallback rendering:', webgpuError)
            setError('WebGPU not available - using fallback mode. Enable WebGPU in chrome://flags for full effects.')
            // Continue with fallback rendering
          }
        }

        // Initialize WebSocket connection (optional, won't fail if unavailable)
        try {
          const wsManager = new WebSocketManager()
          wsManager.onGestureEvent = (event) => {
            setActiveEffects(event.active_effects || [])
            if (shaderEngineRef.current) {
              shaderEngineRef.current.setActiveEffects(event.active_effects || [])
            }
          }
          await wsManager.connect()
          wsManagerRef.current = wsManager
          console.log('WebSocket connected')
        } catch (wsError) {
          console.warn('WebSocket connection failed:', wsError)
          // Continue without WebSocket
        }

        // Start render loop (works with or without WebGPU)
        startRenderLoop(webgpuAvailable)
        setIsLoading(false)
      } catch (error: any) {
        console.error('Error initializing camera:', error)
        setError(`Camera error: ${error.message || 'Failed to access camera. Check permissions.'}`)
        setIsLoading(false)
      }
    }

    initCamera()

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isActive])

  const startRenderLoop = (useWebGPU: boolean = true) => {
    const render = () => {
      if (!videoRef.current || !canvasRef.current) {
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

        // Render frame
        if (useWebGPU && shaderEngineRef.current) {
          // Use WebGPU shader rendering
          try {
            shaderEngineRef.current.render(video)
          } catch (e) {
            console.error('WebGPU render error:', e)
            // Fallback to 2D canvas
            renderFallback(video, canvas)
          }
        } else {
          // Fallback to 2D canvas rendering
          renderFallback(video, canvas)
        }

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

  const renderFallback = (video: HTMLVideoElement, canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size to match video
    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth || 1280
      canvas.height = video.videoHeight || 720
    }

    // Draw video frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
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
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>Initializing camera...</p>
        </div>
      )}
      {error && (
        <div className="error-overlay">
          <p>⚠️ {error}</p>
        </div>
      )}
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

