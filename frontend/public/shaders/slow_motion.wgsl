// Slow motion shader with motion blur
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
  
  // Motion blur - sample multiple times
  var color = vec3<f32>(0.0);
  let samples = 5;
  let blurAmount = 0.01;
  
  for (var i = 0; i < samples; i++) {
    let offset = (f32(i) - f32(samples) * 0.5) * blurAmount;
    let sampleUv = vec2<f32>(uv.x + offset, uv.y);
    color += textureSample(texture, textureSampler, sampleUv).rgb;
  }
  
  color /= f32(samples);
  
  // Frame ghosting effect
  let ghost = textureSample(texture, textureSampler, uv).rgb * 0.2;
  color = mix(color, ghost, 0.3);
  
  return vec4<f32>(color, 1.0);
}

