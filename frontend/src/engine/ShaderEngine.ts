/**
 * WebGPU Shader Engine for real-time effect rendering
 */

export class ShaderEngine {
  private canvas: HTMLCanvasElement
  private device: GPUDevice | null = null
  private context: GPUCanvasContext | null = null
  private pipeline: GPURenderPipeline | null = null
  private texture: GPUTexture | null = null
  private sampler: GPUSampler | null = null
  private activeEffects: Set<string> = new Set()
  private shaderModules: Map<string, GPUShaderModule> = new Map()
  private uniformBuffers: Map<string, GPUBuffer> = new Map()
  private time = 0

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
  }

  async init(): Promise<void> {
    // Check WebGPU support
    if (!navigator.gpu) {
      throw new Error('WebGPU not supported. Use Chrome/Edge with WebGPU enabled.')
    }

    const adapter = await navigator.gpu.requestAdapter()
    if (!adapter) {
      throw new Error('Failed to get GPU adapter')
    }

    this.device = await adapter.requestDevice()
    this.context = this.canvas.getContext('webgpu') as GPUCanvasContext

    if (!this.context) {
      throw new Error('Failed to get WebGPU context')
    }

    const format = navigator.gpu.getPreferredCanvasFormat()
    this.context.configure({
      device: this.device,
      format,
      alphaMode: 'premultiplied'
    })

    // Create sampler
    this.sampler = this.device.createSampler({
      magFilter: 'linear',
      minFilter: 'linear'
    })

    // Load shaders
    await this.loadShaders()

    // Create render pipeline
    this.createPipeline()
  }

  private async loadShaders(): Promise<void> {
    if (!this.device) return

    const shaderFiles = [
      'liquify',
      'vhs',
      'glitch',
      'pixel_sort',
      'matrix',
      'gravity',
      'portal',
      'slow_motion'
    ]

    for (const shaderName of shaderFiles) {
      try {
        const response = await fetch(`/shaders/${shaderName}.wgsl`)
        if (!response.ok) {
          console.warn(`Shader ${shaderName} not found, using default`)
          continue
        }
        const code = await response.text()
        const module = this.device.createShaderModule({
          label: shaderName,
          code
        })
        this.shaderModules.set(shaderName, module)
      } catch (error) {
        console.warn(`Failed to load shader ${shaderName}:`, error)
      }
    }
  }

  private createPipeline(): void {
    if (!this.device || !this.context) return

    // Use base shader for now (will chain effects)
    const shaderCode = `
      @group(0) @binding(0) var<uniform> time: f32;
      @group(0) @binding(1) var texture: texture_2d<f32>;
      @group(0) @binding(2) var textureSampler: sampler;

      @vertex
      fn vs_main(@builtin(vertex_index) vertexIndex: u32) -> @builtin(position) vec4<f32> {
        var pos = array<vec2<f32>, 6>(
          vec2<f32>(-1.0, -1.0),
          vec2<f32>( 1.0, -1.0),
          vec2<f32>(-1.0,  1.0),
          vec2<f32>(-1.0,  1.0),
          vec2<f32>( 1.0, -1.0),
          vec2<f32>( 1.0,  1.0)
        );
        return vec4<f32>(pos[vertexIndex], 0.0, 1.0);
      }

      @fragment
      fn fs_main(@builtin(position) pos: vec4<f32>) -> @location(0) vec4<f32> {
        var uv = vec2<f32>(pos.xy) / vec2<f32>(800.0, 600.0);
        uv.y = 1.0 - uv.y;
        return textureSample(texture, textureSampler, uv);
      }
    `

    const module = this.device.createShaderModule({ code: shaderCode })

    this.pipeline = this.device.createRenderPipeline({
      label: 'main',
      layout: 'auto',
      vertex: {
        module,
        entryPoint: 'vs_main'
      },
      fragment: {
        module,
        entryPoint: 'fs_main',
        targets: [{ format: this.context.getCurrentTexture().format }]
      }
    })
  }

  setActiveEffects(effects: string[]): void {
    this.activeEffects = new Set(effects)
    // Recreate pipeline with active effects
    this.createPipeline()
  }

  render(video: HTMLVideoElement): void {
    if (!this.device || !this.context || !this.pipeline) return

    this.time += 0.016 // ~60fps

    // Create texture from video frame
    if (this.texture) {
      this.texture.destroy()
    }

    this.texture = this.device.importExternalTexture({
      source: video
    })

    const encoder = this.device.createCommandEncoder()
    const pass = encoder.beginRenderPass({
      colorAttachments: [{
        view: this.context.getCurrentTexture().createView(),
        loadOp: 'clear',
        clearValue: [0, 0, 0, 1],
        storeOp: 'store'
      }]
    })

    // Create bind group
    const bindGroup = this.device.createBindGroup({
      layout: this.pipeline.getBindGroupLayout(0),
      entries: [
        {
          binding: 0,
          resource: { buffer: this.getTimeBuffer() }
        },
        {
          binding: 1,
          resource: this.texture
        },
        {
          binding: 2,
          resource: this.sampler!
        }
      ]
    })

    pass.setPipeline(this.pipeline)
    pass.setBindGroup(0, bindGroup)
    pass.draw(6)
    pass.end()

    this.device.queue.submit([encoder.finish()])
  }

  private getTimeBuffer(): GPUBuffer {
    if (!this.device) throw new Error('Device not initialized')

    const buffer = this.device.createBuffer({
      size: 4,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    })

    this.device.queue.writeBuffer(buffer, 0, new Float32Array([this.time]))
    return buffer
  }
}

