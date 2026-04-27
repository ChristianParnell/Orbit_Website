import * as THREE from "https://esm.sh/three@0.160.0";
import { ensurePalette, setPaletteUniforms } from "./moth-utils.js";

export function createBinaryGlyphAtlas() {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "bold 48px ui-monospace, SFMono-Regular, Consolas, monospace";
  ctx.shadowColor = "rgba(47, 228, 255, 0.95)";
  ctx.shadowBlur = 10;
  ctx.fillStyle = "rgba(255,255,255,1)";
  ctx.fillText("0", 32, 32);
  ctx.fillText("1", 96, 32);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

function paletteUniforms(palette) {
  const colors = ensurePalette(palette);
  const uniforms = {};
  colors.forEach((color, index) => {
    uniforms[`uColor${index}`] = { value: color.clone() };
  });
  return uniforms;
}

const PALETTE_GLSL = `
vec3 getPalette(float t) {
  float x = clamp(t, 0.0, 0.999) * 6.0;
  float i = floor(x);
  float f = fract(x);
  vec3 c0 = uColor0;
  vec3 c1 = uColor1;
  if (i < 0.5) { c0 = uColor0; c1 = uColor1; }
  else if (i < 1.5) { c0 = uColor1; c1 = uColor2; }
  else if (i < 2.5) { c0 = uColor2; c1 = uColor3; }
  else if (i < 3.5) { c0 = uColor3; c1 = uColor4; }
  else if (i < 4.5) { c0 = uColor4; c1 = uColor5; }
  else { c0 = uColor5; c1 = uColor6; }
  return mix(c0, c1, f);
}
`;

export function createMothPointMaterial({ atlas, palette, brightness = 2.7, alpha = 0.92, pointScale = 1.0 } = {}) {
  const material = new THREE.ShaderMaterial({
    name: "MothBinaryPointMaterial",
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
    uniforms: {
      uAtlas: { value: atlas },
      uTime: { value: 0 },
      uAlpha: { value: alpha },
      uBrightness: { value: brightness },
      uPointScale: { value: pointScale },
      uMood: { value: 0.0 },
      uInstability: { value: 0.0 },
      uPatchiness: { value: 0.0 },
      ...paletteUniforms(palette)
    },
    vertexShader: `
      uniform float uTime;
      uniform float uPointScale;
      uniform float uInstability;
      attribute float aSeed;
      attribute float aSize;
      attribute float aAlpha;
      attribute float aPalette;
      varying float vSeed;
      varying float vDigit;
      varying float vAlpha;
      varying float vPalette;
      void main() {
        vSeed = aSeed;
        vDigit = mod(floor(uTime * (3.0 + fract(aSeed * 17.31) * 4.0) + aSeed * 67.0), 2.0);
        vAlpha = aAlpha * (0.82 + sin(uTime * 5.2 + aSeed * 40.0) * 0.18);
        vPalette = fract(aPalette + uTime * 0.035 + sin(aSeed * 9.0) * 0.08);
        float twitchGate = step(0.72, sin(uTime * (10.0 + fract(aSeed) * 9.0) + aSeed * 77.0));
        vec3 dir = normalize(position + vec3(0.001, 0.002, 0.003));
        vec3 unstablePosition = position + dir * twitchGate * uInstability * 0.018;
        vec4 mvPosition = modelViewMatrix * vec4(unstablePosition, 1.0);
        float perspective = 42.0 / max(1.0, -mvPosition.z);
        gl_PointSize = max(1.4, aSize * uPointScale * perspective);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform sampler2D uAtlas;
      uniform float uAlpha;
      uniform float uBrightness;
      uniform float uMood;
      uniform float uInstability;
      uniform float uPatchiness;
      uniform vec3 uColor0;
      uniform vec3 uColor1;
      uniform vec3 uColor2;
      uniform vec3 uColor3;
      uniform vec3 uColor4;
      uniform vec3 uColor5;
      uniform vec3 uColor6;
      varying float vSeed;
      varying float vDigit;
      varying float vAlpha;
      varying float vPalette;
      ${PALETTE_GLSL}
      void main() {
        vec2 uv = gl_PointCoord;
        vec2 centered = uv * 2.0 - 1.0;
        float radial = 1.0 - smoothstep(0.72, 1.22, length(centered));
        vec2 atlasUv = vec2((uv.x + vDigit) * 0.5, uv.y);
        vec4 glyph = texture2D(uAtlas, atlasUv);
        float scan = 0.74 + sin((uv.y + vSeed) * 38.0) * 0.08;
        float patchNoise = fract(sin(vSeed * 437.17 + floor(uTime * (7.0 + uInstability * 8.0)) * 13.91) * 9731.77);
        float dropout = step(1.0 - uPatchiness, patchNoise);
        float unstablePulse = 0.72 + sin(uTime * (14.0 + uInstability * 18.0) + vSeed * 90.0) * 0.28;
        float alpha = glyph.a * radial * scan * vAlpha * uAlpha;
        alpha *= mix(1.0, 0.12 + unstablePulse * 0.24, dropout * uPatchiness);
        alpha *= 1.0 - uPatchiness * 0.18;
        if (alpha < 0.018) discard;
        vec3 color = getPalette(vPalette) * uBrightness * mix(1.0, 0.72 + unstablePulse * 0.36, uInstability * 0.35);
        vec3 hot = vec3(1.0, 1.0, 1.0) * pow(glyph.a, 3.0) * 0.42;
        gl_FragColor = vec4(color + hot, alpha);
      }
    `
  });
  return material;
}

export function createTrailMaterial({ atlas, palette, brightness = 2.2, alpha = 0.85 } = {}) {
  return new THREE.ShaderMaterial({
    name: "MothBinaryTrailMaterial",
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
    uniforms: {
      uAtlas: { value: atlas },
      uTime: { value: 0 },
      uAlpha: { value: alpha },
      uBrightness: { value: brightness },
      ...paletteUniforms(palette)
    },
    vertexShader: `
      uniform float uTime;
      attribute float aSeed;
      attribute float aLife;
      attribute float aSize;
      attribute float aPalette;
      varying float vDigit;
      varying float vAlpha;
      varying float vPalette;
      void main() {
        vDigit = mod(floor(uTime * (2.0 + fract(aSeed) * 4.0) + aSeed * 41.0), 2.0);
        vAlpha = clamp(aLife, 0.0, 1.0);
        vPalette = fract(aPalette + aSeed * 0.17 + uTime * 0.045);
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = max(1.2, aSize * (36.0 / max(1.0, -mvPosition.z)) * mix(0.45, 1.35, vAlpha));
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform sampler2D uAtlas;
      uniform float uAlpha;
      uniform float uBrightness;
      uniform vec3 uColor0;
      uniform vec3 uColor1;
      uniform vec3 uColor2;
      uniform vec3 uColor3;
      uniform vec3 uColor4;
      uniform vec3 uColor5;
      uniform vec3 uColor6;
      varying float vDigit;
      varying float vAlpha;
      varying float vPalette;
      ${PALETTE_GLSL}
      void main() {
        vec2 uv = gl_PointCoord;
        vec2 atlasUv = vec2((uv.x + vDigit) * 0.5, uv.y);
        vec4 glyph = texture2D(uAtlas, atlasUv);
        float fade = smoothstep(0.0, 0.14, vAlpha) * vAlpha;
        float alpha = glyph.a * fade * uAlpha;
        if (alpha < 0.015) discard;
        gl_FragColor = vec4(getPalette(vPalette) * uBrightness, alpha);
      }
    `
  });
}

export function createVoidMaterial({ atlas, palette, brightness = 2.45, alpha = 1.0 } = {}) {
  return new THREE.ShaderMaterial({
    name: "MothVoidMaterial",
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
    uniforms: {
      uAtlas: { value: atlas },
      uTime: { value: 0 },
      uAlpha: { value: alpha },
      uBrightness: { value: brightness },
      ...paletteUniforms(palette)
    },
    vertexShader: `
      uniform float uTime;
      attribute float aSeed;
      attribute float aT;
      attribute float aSize;
      varying float vDigit;
      varying float vAlpha;
      varying float vPalette;
      void main() {
        float pulse = 0.80 + sin(uTime * 3.0 + aSeed * 31.0) * 0.20;
        vDigit = mod(floor(uTime * (3.5 + fract(aSeed * 4.0)) + aSeed * 26.0), 2.0);
        vPalette = fract(aSeed * 13.1 + aT * 0.48 + uTime * 0.05);
        vAlpha = pulse * (1.0 - aT * 0.55);
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = max(2.0, aSize * (42.0 / max(1.0, -mvPosition.z)) * mix(1.5, 0.7, aT));
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform sampler2D uAtlas;
      uniform float uAlpha;
      uniform float uBrightness;
      uniform vec3 uColor0;
      uniform vec3 uColor1;
      uniform vec3 uColor2;
      uniform vec3 uColor3;
      uniform vec3 uColor4;
      uniform vec3 uColor5;
      uniform vec3 uColor6;
      varying float vDigit;
      varying float vAlpha;
      varying float vPalette;
      ${PALETTE_GLSL}
      void main() {
        vec2 uv = gl_PointCoord;
        vec2 atlasUv = vec2((uv.x + vDigit) * 0.5, uv.y);
        vec4 glyph = texture2D(uAtlas, atlasUv);
        float ring = 1.0 - smoothstep(0.75, 1.20, length(uv * 2.0 - 1.0));
        float alpha = glyph.a * ring * vAlpha * uAlpha;
        if (alpha < 0.02) discard;
        gl_FragColor = vec4(getPalette(vPalette) * uBrightness, alpha);
      }
    `
  });
}

export function updateMaterialPalette(material, palette) {
  setPaletteUniforms(material, palette);
}
