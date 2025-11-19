/**
 * 2D Canvas-based effect renderer (no WebGPU required)
 */

export class CanvasEffects {
  private time = 0

  applyEffect(
    ctx: CanvasRenderingContext2D,
    effectName: string,
    video: HTMLVideoElement,
    canvas: HTMLCanvasElement
  ): void {
    this.time += 0.016

    switch (effectName) {
      case 'liquify':
        this.applyLiquify(ctx, video, canvas)
        break
      case 'vhs':
        this.applyVHS(ctx, video, canvas)
        break
      case 'pixel_sort':
        this.applyPixelSort(ctx, video, canvas)
        break
      case 'matrix':
        this.applyMatrix(ctx, video, canvas)
        break
      case 'flipGravity':
        this.applyGravityFlip(ctx, video, canvas)
        break
      case 'slow_motion':
        this.applySlowMotion(ctx, video, canvas)
        break
      case 'portal_ripple':
        this.applyPortalRipple(ctx, video, canvas)
        break
      default:
        // No effect, just draw video
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    }
  }

  private applyLiquify(ctx: CanvasRenderingContext2D, video: HTMLVideoElement, canvas: HTMLCanvasElement): void {
    // Use transform-based approach for better performance
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const radius = Math.min(canvas.width, canvas.height) * 0.4
    const intensity = 15

    // Draw base video
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    
    // Apply liquify using canvas transforms (faster than pixel manipulation)
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data
    const newData = new Uint8ClampedArray(data.length)

    // Sample every 2 pixels for performance
    for (let y = 0; y < canvas.height; y += 1) {
      for (let x = 0; x < canvas.width; x += 1) {
        const dx = x - centerX
        const dy = y - centerY
        const dist = Math.sqrt(dx * dx + dy * dy)
        
        if (dist < radius) {
          const angle = Math.atan2(dy, dx)
          const normalizedDist = dist / radius
          const wave = Math.sin(dist / 15 - this.time * 3) * (1 - normalizedDist) * intensity
          
          const newX = Math.round(x + wave * Math.cos(angle))
          const newY = Math.round(y + wave * Math.sin(angle))
          
          const srcIdx = (y * canvas.width + x) * 4
          
          if (newX >= 0 && newX < canvas.width && newY >= 0 && newY < canvas.height) {
            const dstIdx = (newY * canvas.width + newX) * 4
            newData[dstIdx] = data[srcIdx]
            newData[dstIdx + 1] = data[srcIdx + 1]
            newData[dstIdx + 2] = data[srcIdx + 2]
            newData[dstIdx + 3] = data[srcIdx + 3]
          } else {
            // Keep original if out of bounds
            newData[srcIdx] = data[srcIdx]
            newData[srcIdx + 1] = data[srcIdx + 1]
            newData[srcIdx + 2] = data[srcIdx + 2]
            newData[srcIdx + 3] = data[srcIdx + 3]
          }
        } else {
          // Keep original outside radius
          const idx = (y * canvas.width + x) * 4
          newData[idx] = data[idx]
          newData[idx + 1] = data[idx + 1]
          newData[idx + 2] = data[idx + 2]
          newData[idx + 3] = data[idx + 3]
        }
      }
    }

    const newImageData = new ImageData(newData, canvas.width, canvas.height)
    ctx.putImageData(newImageData, 0, 0)
  }

  private applyVHS(ctx: CanvasRenderingContext2D, video: HTMLVideoElement, canvas: HTMLCanvasElement): void {
    // Draw base video
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    
    // Add scanlines
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'
    for (let y = 0; y < canvas.height; y += 2) {
      ctx.fillRect(0, y, canvas.width, 1)
    }
    
    // Chromatic aberration (color shift)
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data
    const shift = 2
    
    for (let i = 0; i < data.length; i += 4) {
      // Shift red channel
      if (i + shift * 4 < data.length) {
        data[i] = data[i + shift * 4] // R
      }
      // Keep green as is
      // Shift blue channel
      if (i - shift * 4 >= 0) {
        data[i + 2] = data[i - shift * 4 + 2] // B
      }
    }
    
    ctx.putImageData(imageData, 0, 0)
    
    // Add noise
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)'
    for (let i = 0; i < 100; i++) {
      ctx.fillRect(
        Math.random() * canvas.width,
        Math.random() * canvas.height,
        1,
        1
      )
    }
  }

  private applyPixelSort(ctx: CanvasRenderingContext2D, video: HTMLVideoElement, canvas: HTMLCanvasElement): void {
    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = canvas.width
    tempCanvas.height = canvas.height
    const tempCtx = tempCanvas.getContext('2d')!
    tempCtx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height)
    
    const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height)
    const data = imageData.data
    const threshold = 200

    // Sort pixels horizontally
    for (let y = 0; y < canvas.height; y++) {
      const row = []
      for (let x = 0; x < canvas.width; x++) {
        const idx = (y * canvas.width + x) * 4
        const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3
        row.push({ idx, brightness, x })
      }
      
      // Sort bright pixels
      const brightPixels = row.filter(p => p.brightness > threshold)
      brightPixels.sort((a, b) => a.brightness - b.brightness)
      
      // Reconstruct row
      let brightIdx = 0
      for (let x = 0; x < canvas.width; x++) {
        const pixel = row[x]
        if (pixel.brightness > threshold && brightIdx < brightPixels.length) {
          const sortedPixel = brightPixels[brightIdx++]
          const srcIdx = sortedPixel.idx
          const dstIdx = pixel.idx
          data[dstIdx] = data[srcIdx]
          data[dstIdx + 1] = data[srcIdx + 1]
          data[dstIdx + 2] = data[srcIdx + 2]
        }
      }
    }

    ctx.putImageData(imageData, 0, 0)
  }

  private applyMatrix(ctx: CanvasRenderingContext2D, video: HTMLVideoElement, canvas: HTMLCanvasElement): void {
    // Draw video first
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    
    // Overlay matrix rain
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    ctx.fillStyle = '#00ff00'
    ctx.font = '14px monospace'
    const chars = '01アイウエオカキクケコ'
    
    for (let x = 0; x < canvas.width; x += 20) {
      const y = (this.time * 50 + x * 0.1) % (canvas.height + 100) - 50
      if (y > 0 && y < canvas.height) {
        const char = chars[Math.floor(Math.random() * chars.length)]
        const alpha = 1 - (y / canvas.height) * 0.5
        ctx.fillStyle = `rgba(0, 255, 0, ${alpha})`
        ctx.fillText(char, x, y)
      }
    }
  }

  private applyGravityFlip(ctx: CanvasRenderingContext2D, video: HTMLVideoElement, canvas: HTMLCanvasElement): void {
    // Flip vertically
    ctx.save()
    ctx.scale(1, -1)
    ctx.drawImage(video, 0, -canvas.height, canvas.width, canvas.height)
    ctx.restore()
    
    // Add distortion
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data
    
    for (let y = 0; y < canvas.height; y++) {
      const gravityStrength = (1 - y / canvas.height) * 5
      const shift = Math.sin(y * 0.1) * gravityStrength
      
      for (let x = 0; x < canvas.width; x++) {
        const srcX = Math.round(x + shift)
        if (srcX >= 0 && srcX < canvas.width) {
          const srcIdx = (y * canvas.width + srcX) * 4
          const dstIdx = (y * canvas.width + x) * 4
          data[dstIdx] = data[srcIdx]
          data[dstIdx + 1] = data[srcIdx + 1]
          data[dstIdx + 2] = data[srcIdx + 2]
        }
      }
    }
    
    ctx.putImageData(imageData, 0, 0)
  }

  private applySlowMotion(ctx: CanvasRenderingContext2D, video: HTMLVideoElement, canvas: HTMLCanvasElement): void {
    // Motion blur effect
    ctx.globalAlpha = 0.7
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    ctx.globalAlpha = 0.3
    ctx.drawImage(video, 2, 0, canvas.width, canvas.height)
    ctx.drawImage(video, -2, 0, canvas.width, canvas.height)
    ctx.globalAlpha = 1.0
  }

  private applyPortalRipple(ctx: CanvasRenderingContext2D, video: HTMLVideoElement, canvas: HTMLCanvasElement): void {
    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = canvas.width
    tempCanvas.height = canvas.height
    const tempCtx = tempCanvas.getContext('2d')!
    tempCtx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height)
    
    const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height)
    const data = imageData.data
    const newData = new Uint8ClampedArray(data)

    const centerX = canvas.width / 2
    const centerY = canvas.height / 2

    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const dx = x - centerX
        const dy = y - centerY
        const dist = Math.sqrt(dx * dx + dy * dy)
        const angle = Math.atan2(dy, dx)
        
        const wave = Math.sin(dist * 0.1 - this.time * 3) * 10
        const newX = Math.round(x + wave * Math.cos(angle))
        const newY = Math.round(y + wave * Math.sin(angle))
        
        if (newX >= 0 && newX < canvas.width && newY >= 0 && newY < canvas.height) {
          const srcIdx = (y * canvas.width + x) * 4
          const dstIdx = (newY * canvas.width + newX) * 4
            
          newData[dstIdx] = data[srcIdx]
          newData[dstIdx + 1] = data[srcIdx + 1]
          newData[dstIdx + 2] = data[srcIdx + 2]
          newData[dstIdx + 3] = data[srcIdx + 3]
        }
      }
    }

    const newImageData = new ImageData(newData, canvas.width, canvas.height)
    ctx.putImageData(newImageData, 0, 0)
    
    // Add glow
    ctx.shadowBlur = 20
    ctx.shadowColor = '#00ffff'
    ctx.fillStyle = 'rgba(0, 255, 255, 0.1)'
    ctx.beginPath()
    ctx.arc(centerX, centerY, 50, 0, Math.PI * 2)
    ctx.fill()
    ctx.shadowBlur = 0
  }
}

