// Pixel sort glitch shader
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
  
  // Sample original color
  let color = textureSample(texture, textureSampler, uv);
  let brightness = dot(color.rgb, vec3<f32>(0.299, 0.587, 0.114));
  
  // Pixel sort effect - displace based on brightness
  let threshold = 0.7;
  if (brightness > threshold) {
    // Shift bright pixels
    let shift = (brightness - threshold) * 0.1;
    var newUv = uv;
    newUv.x += shift * sin(time * 2.0);
    return textureSample(texture, textureSampler, newUv);
  }
  
  return color;
}

