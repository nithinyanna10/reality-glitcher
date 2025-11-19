// Matrix rain effect shader
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
  
  // Sample original texture
  let original = textureSample(texture, textureSampler, uv);
  
  // Matrix rain columns
  let columnWidth = 0.02;
  let column = floor(uv.x / columnWidth);
  let columnTime = time * (0.5 + fract(sin(column * 43758.5453) * 43758.5453) * 0.5);
  let columnPos = fract(uv.x / columnWidth);
  
  // Falling code effect
  let fallSpeed = 2.0;
  let fallPos = fract(uv.y + columnTime * fallSpeed);
  
  // Create matrix characters effect
  let charBrightness = step(0.95, fract(sin(column * 100.0 + fallPos * 10.0) * 43758.5453));
  let trail = 1.0 - fallPos;
  let matrixColor = vec3<f32>(0.0, charBrightness * trail * 0.8, 0.0);
  
  // Blend with original
  return vec4<f32>(mix(original.rgb, matrixColor, 0.3), 1.0);
}

