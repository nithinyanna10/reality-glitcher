import { useState, useEffect } from 'react'
import CameraFeed from './components/CameraFeed'
import EffectControls from './components/EffectControls'
import FPSDisplay from './components/FPSDisplay'
import CameraDiagnostics from './components/CameraDiagnostics'
import './App.css'

function App() {
  const [isActive, setIsActive] = useState(false)
  const [fps, setFps] = useState(0)
  const [activeEffects, setActiveEffects] = useState<string[]>([])

  return (
    <div className="app">
      <div className="app-header">
        <h1>🌀 Reality Glitcher</h1>
        <div className="header-controls">
          <FPSDisplay fps={fps} />
          <button 
            className={`control-btn ${isActive ? 'active' : ''}`}
            onClick={() => setIsActive(!isActive)}
          >
            {isActive ? '⏸ Stop' : '▶ Start'}
          </button>
        </div>
      </div>
      
      <div className="app-content">
        <CameraFeed 
          isActive={isActive} 
          onFPSUpdate={setFps}
          activeEffects={activeEffects}
        />
        <EffectControls onEffectsChange={setActiveEffects} />
        <CameraDiagnostics />
      </div>
    </div>
  )
}

export default App

