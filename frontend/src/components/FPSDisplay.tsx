import './FPSDisplay.css'

interface FPSDisplayProps {
  fps: number
}

export default function FPSDisplay({ fps }: FPSDisplayProps) {
  const getFPSColor = () => {
    if (fps >= 50) return '#00ff88'
    if (fps >= 30) return '#ffaa00'
    return '#ff4444'
  }

  return (
    <div className="fps-display">
      <span className="fps-label">FPS:</span>
      <span className="fps-value" style={{ color: getFPSColor() }}>
        {fps}
      </span>
    </div>
  )
}

