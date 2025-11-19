import { useEffect, useState } from 'react'

export default function CameraDiagnostics() {
  const [diagnostics, setDiagnostics] = useState<Record<string, any>>({})

  useEffect(() => {
    const checkDiagnostics = async () => {
      const diag: Record<string, any> = {}

      // Check WebGPU
      diag.webgpu = !!navigator.gpu
      if (navigator.gpu) {
        try {
          const adapter = await navigator.gpu.requestAdapter()
          diag.webgpuAdapter = !!adapter
        } catch (e) {
          diag.webgpuError = String(e)
        }
      }

      // Check MediaDevices
      diag.mediaDevices = !!navigator.mediaDevices
      diag.getUserMedia = !!(navigator.mediaDevices?.getUserMedia)

      // Check camera permissions
      if (navigator.permissions) {
        try {
          const cameraPermission = await navigator.permissions.query({ name: 'camera' as PermissionName })
          diag.cameraPermission = cameraPermission.state
        } catch (e) {
          diag.cameraPermissionError = String(e)
        }
      }

      // Check WebSocket
      diag.websocket = typeof WebSocket !== 'undefined'

      setDiagnostics(diag)
    }

    checkDiagnostics()
  }, [])

  return (
    <div style={{
      position: 'fixed',
      bottom: '1rem',
      right: '1rem',
      background: 'rgba(0, 0, 0, 0.8)',
      padding: '1rem',
      borderRadius: '8px',
      fontSize: '0.75rem',
      fontFamily: 'monospace',
      maxWidth: '300px',
      zIndex: 1000
    }}>
      <h4 style={{ margin: '0 0 0.5rem 0', color: '#00ff88' }}>Diagnostics</h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        {Object.entries(diagnostics).map(([key, value]) => (
          <div key={key} style={{ color: value === true || value === 'granted' ? '#00ff88' : value === false ? '#ff4444' : '#fff' }}>
            {key}: {String(value)}
          </div>
        ))}
      </div>
    </div>
  )
}

