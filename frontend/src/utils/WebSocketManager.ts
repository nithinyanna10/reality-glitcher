/**
 * WebSocket manager for gesture event streaming
 */

export interface GestureEvent {
  type: string
  gestures: Record<string, boolean>
  active_effects: string[]
  timestamp?: number
}

export class WebSocketManager {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 3000
  public onGestureEvent: ((event: GestureEvent) => void) | null = null

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws'
        this.ws = new WebSocket(wsUrl)

        this.ws.onopen = () => {
          console.log('WebSocket connected')
          this.reconnectAttempts = 0
          resolve()
        }

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            if (data.type === 'gesture_event' && this.onGestureEvent) {
              this.onGestureEvent(data as GestureEvent)
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error)
          }
        }

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error)
          reject(error)
        }

        this.ws.onclose = () => {
          console.log('WebSocket disconnected')
          this.attemptReconnect()
        }
      } catch (error) {
        reject(error)
      }
    })
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`)
      setTimeout(() => {
        this.connect().catch(() => {
          // Reconnection failed, will try again
        })
      }, this.reconnectDelay)
    } else {
      console.error('Max reconnection attempts reached')
    }
  }

  sendFrame(frameData: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'frame',
        data: frameData,
        timestamp: Date.now()
      }))
    }
  }

  sendControl(control: string, data?: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'control',
        control,
        ...data
      }))
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }
}

