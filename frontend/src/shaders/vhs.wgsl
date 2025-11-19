// VHS/CRT distortion shader
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
  var uv = vec2<f32>(pos.xy) / vec2<f32>(1280.0, 720.0);
  uv.y = 1.0 - uv.y;
  
  // Scanlines
  let scanline = sin(uv.y * 500.0 + time * 5.0) * 0.05 + 0.95;
  
  // Chromatic aberration (color channel shift)
  let offset = 0.003;
  let r = textureSample(texture, textureSampler, vec2<f32>(uv.x + offset, uv.y)).r;
  let g = textureSample(texture, textureSampler, uv).g;
  let b = textureSample(texture, textureSampler, vec2<f32>(uv.x - offset, uv.y)).b;
  
  // VHS noise
  let noise = fract(sin(dot(uv + time, vec2<f32>(12.9898, 78.233))) * 43758.5453) * 0.1;
  
  return vec4<f32>(r * scanline + noise, g * scanline + noise, b * scanline + noise, 1.0);
}

