import { useEffect, useRef, useState } from 'react'
import { ShaderEngine } from '../engine/ShaderEngine'
import { WebSocketManager } from '../utils/WebSocketManager'
import { CanvasEffects } from '../utils/CanvasEffects'
import './CameraFeed.css'

interface CameraFeedProps {
  isActive: boolean
  onFPSUpdate: (fps: number) => void
  activeEffects: string[]
}

export default function CameraFeed({ isActive, onFPSUpdate, activeEffects }: CameraFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const shaderEngineRef = useRef<ShaderEngine | null>(null)
  const wsManagerRef = useRef<WebSocketManager | null>(null)
  const canvasEffectsRef = useRef<CanvasEffects>(new CanvasEffects())
  const animationFrameRef = useRef<number>()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const fpsRef = useRef({ lastTime: 0, frameCount: 0, fps: 0 })

  // Initialize canvas immediately
  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.width = 1280
      canvasRef.current.height = 720
      const ctx = canvasRef.current.getContext('2d')
      if (ctx) {
        ctx.fillStyle = '#1a1a1a'
        ctx.fillRect(0, 0, 1280, 720)
        ctx.fillStyle = '#00ff88'
        ctx.font = '32px Arial'
        ctx.textAlign = 'center'
        ctx.fillText('Click Start to begin', 640, 360)
      }
    }
  }, [])

  useEffect(() => {
    if (!isActive) {
      // Cleanup
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (wsManagerRef.current) {
        wsManagerRef.current.disconnect()
      }
      // Show placeholder when stopped
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d')
        if (ctx) {
          ctx.fillStyle = '#1a1a1a'
          ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height)
          ctx.fillStyle = '#00ff88'
          ctx.font = '32px Arial'
          ctx.textAlign = 'center'
          ctx.fillText('Click Start to begin', canvasRef.current.width / 2, canvasRef.current.height / 2)
        }
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
          videoRef.current.onloadedmetadata = () => {
            console.log(`Video metadata loaded: ${videoRef.current?.videoWidth}x${videoRef.current?.videoHeight}`)
            if (canvasRef.current && videoRef.current) {
              canvasRef.current.width = videoRef.current.videoWidth || 1280
              canvasRef.current.height = videoRef.current.videoHeight || 720
              console.log(`Canvas initialized: ${canvasRef.current.width}x${canvasRef.current.height}`)
            }
          }
          await videoRef.current.play()
          console.log('Video element playing, readyState:', videoRef.current.readyState)
        }

        // Don't use WebGPU by default - use 2D canvas effects instead
        // WebGPU is optional and only used if explicitly enabled
        let webgpuAvailable = false
        // Skip WebGPU initialization - use 2D canvas effects
        if (canvasRef.current) {
          canvasRef.current.width = 1280
          canvasRef.current.height = 720
        }

        // Initialize WebSocket connection (optional, won't fail if unavailable)
        try {
          const wsManager = new WebSocketManager()
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
        // Show error on canvas
        if (canvasRef.current) {
          const ctx = canvasRef.current.getContext('2d')
          if (ctx) {
            ctx.fillStyle = '#1a1a1a'
            ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height)
            ctx.fillStyle = '#ff4444'
            ctx.font = '24px Arial'
            ctx.textAlign = 'center'
            ctx.fillText('Camera Error: ' + (error.message || 'Check permissions'), canvasRef.current.width / 2, canvasRef.current.height / 2)
          }
        }
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
    console.log('Starting render loop, useWebGPU:', useWebGPU)
    const render = () => {
      if (!canvasRef.current) {
        animationFrameRef.current = requestAnimationFrame(render)
        return
      }

      const canvas = canvasRef.current
      const video = videoRef.current

      // Always render something
      if (video && video.readyState >= video.HAVE_CURRENT_DATA && video.videoWidth > 0) {
        // Update FPS
        const now = performance.now()
        fpsRef.current.frameCount++
        if (now - fpsRef.current.lastTime >= 1000) {
          fpsRef.current.fps = fpsRef.current.frameCount
          fpsRef.current.frameCount = 0
          fpsRef.current.lastTime = now
          onFPSUpdate(fpsRef.current.fps)
        }

        // Render frame with effects using 2D canvas
        renderWithEffects(video, canvas)

        // Send frame to backend for gesture detection (throttled)
        if (wsManagerRef.current && fpsRef.current.frameCount % 5 === 0) {
          const imageData = captureFrame(video, canvas)
          if (imageData) {
            wsManagerRef.current.sendFrame(imageData)
          }
        }
      } else if (video) {
        // Video exists but not ready - show placeholder
        renderFallback(video, canvas)
      } else {
        // No video yet - show waiting message
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.fillStyle = '#1a1a1a'
          ctx.fillRect(0, 0, canvas.width, canvas.height)
          ctx.fillStyle = '#00ff88'
          ctx.font = '24px Arial'
          ctx.textAlign = 'center'
          ctx.fillText('Waiting for camera...', canvas.width / 2, canvas.height / 2)
        }
      }

      animationFrameRef.current = requestAnimationFrame(render)
    }

    render()
  }

  const renderWithEffects = (video: HTMLVideoElement, canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      console.error('Failed to get 2D context')
      return
    }

    // Set canvas size to match video or use default
    const width = video.videoWidth || 1280
    const height = video.videoHeight || 720
    
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width
      canvas.height = height
      console.log(`Canvas size set to: ${width}x${height}`)
    }

    // Draw video frame with effects
    try {
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        // Apply first active effect, or just draw video if none
        if (activeEffects.length > 0) {
          canvasEffectsRef.current.applyEffect(ctx, activeEffects[0], video, canvas)
        } else {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        }
      } else {
        // Video not ready, draw placeholder
        ctx.fillStyle = '#1a1a1a'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.fillStyle = '#00ff88'
        ctx.font = '24px Arial'
        ctx.textAlign = 'center'
        ctx.fillText('Camera initializing...', canvas.width / 2, canvas.height / 2)
      }
    } catch (e) {
      console.error('Error drawing video frame:', e)
      // Draw error message
      ctx.fillStyle = '#ff4444'
      ctx.font = '20px Arial'
      ctx.textAlign = 'center'
      ctx.fillText('Render error', canvas.width / 2, canvas.height / 2)
    }
  }

  const renderFallback = (video: HTMLVideoElement, canvas: HTMLCanvasElement) => {
    renderWithEffects(video, canvas)
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
        style={{ 
          width: '100%', 
          height: '100%',
          display: 'block',
          background: '#000'
        }}
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
