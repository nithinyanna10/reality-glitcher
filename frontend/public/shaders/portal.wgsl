// Portal ripple effect shader
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
  
  // Center point for portal
  let center = vec2<f32>(0.5, 0.5);
  let dist = distance(uv, center);
  
  // Ripple wave
  let wave = sin(dist * 15.0 - time * 3.0) * 0.05;
  let angle = atan2(uv.y - center.y, uv.x - center.x);
  
  // Displace UV coordinates
  var newUv = uv;
  newUv.x += wave * cos(angle);
  newUv.y += wave * sin(angle);
  
  // Add portal glow
  let glow = exp(-dist * 3.0) * 0.3;
  let color = textureSample(texture, textureSampler, newUv);
  
  return vec4<f32>(color.rgb + vec3<f32>(glow * 0.5, glow, glow * 1.5), 1.0);
}

