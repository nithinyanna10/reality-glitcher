// Glitch effect shader
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
  
  // Random block shifts
  let blockSize = 0.1;
  let blockX = floor(uv.x / blockSize);
  let blockY = floor(uv.y / blockSize);
  let blockId = blockX + blockY * 100.0;
  
  let random = fract(sin(blockId * 43758.5453 + time) * 43758.5453);
  let shift = (random - 0.5) * 0.02;
  
  var newUv = uv;
  newUv.x += shift;
  
  // Color channel separation
  let r = textureSample(texture, textureSampler, vec2<f32>(newUv.x + 0.005, newUv.y)).r;
  let g = textureSample(texture, textureSampler, newUv).g;
  let b = textureSample(texture, textureSampler, vec2<f32>(newUv.x - 0.005, newUv.y)).b;
  
  // Digital noise
  let noise = fract(sin(dot(uv + time, vec2<f32>(12.9898, 78.233))) * 43758.5453);
  
  return vec4<f32>(r, g, b, 1.0) * (0.9 + noise * 0.1);
}

