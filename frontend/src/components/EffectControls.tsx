import { useState, useEffect } from 'react'
import './EffectControls.css'

const EFFECTS = [
  { id: 'liquify', name: 'Liquify', gesture: 'smile' },
  { id: 'vhs', name: 'VHS', gesture: 'head_tilt' },
  { id: 'pixel_sort', name: 'Pixel Sort', gesture: 'eyebrow_raise' },
  { id: 'matrix', name: 'Matrix', gesture: 'raise_hand' },
  { id: 'flipGravity', name: 'Gravity Flip', gesture: 'blink' },
  { id: 'slow_motion', name: 'Slow Motion', gesture: 'both_hands_up' },
  { id: 'portal_ripple', name: 'Portal Ripple', gesture: 'mouth_open' },
]

interface EffectControlsProps {
  onEffectsChange: (effects: string[]) => void
}

export default function EffectControls({ onEffectsChange }: EffectControlsProps) {
  const [enabledEffects, setEnabledEffects] = useState<Set<string>>(new Set())

  const toggleEffect = (effectId: string) => {
    const newSet = new Set(enabledEffects)
    if (newSet.has(effectId)) {
      newSet.delete(effectId)
    } else {
      newSet.add(effectId)
    }
    setEnabledEffects(newSet)
    onEffectsChange(Array.from(newSet))
  }

  return (
    <div className="effect-controls">
      <h3>Effects</h3>
      <div className="effects-list">
        {EFFECTS.map(effect => (
          <div
            key={effect.id}
            className={`effect-item ${enabledEffects.has(effect.id) ? 'enabled' : ''}`}
            onClick={() => toggleEffect(effect.id)}
          >
            <div className="effect-checkbox">
              {enabledEffects.has(effect.id) && '✓'}
            </div>
            <div className="effect-info">
              <div className="effect-name">{effect.name}</div>
              <div className="effect-gesture">Trigger: {effect.gesture}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="gesture-help">
        <h4>Gesture Triggers</h4>
        <ul>
          <li>👁️ Blink → Gravity Flip</li>
          <li>😊 Smile → Liquify</li>
          <li>✋ Raise Hand → Matrix</li>
          <li>🤚 Both Hands → Slow Motion</li>
          <li>👄 Mouth Open → Portal Ripple</li>
          <li>🤨 Eyebrow Raise → Pixel Sort</li>
          <li>↪️ Head Tilt → VHS</li>
        </ul>
      </div>
    </div>
  )
}

