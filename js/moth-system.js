
import * as THREE from "https://esm.sh/three@0.160.0";
import { FBXLoader } from "https://esm.sh/three@0.160.0/examples/jsm/loaders/FBXLoader.js";

const DEFAULT_PALETTE = [
  new THREE.Color("#33ff88"),
  new THREE.Color("#2fe4ff"),
  new THREE.Color("#4b7dff"),
  new THREE.Color("#b04dff"),
  new THREE.Color("#ff57ce"),
  new THREE.Color("#ff8b2d"),
  new THREE.Color("#ffe166")
];

const DEFAULT_CONFIG = {
  storageKey: "orbitSpecterMothV2",
  pointLimit: 1380,
  outlinePointLimit: 920,
  sizeRatioToModelHeight: 0.0936,
  modelYawOffset: 0,
  modelPitchOffset: 0,
  modelRollOffset: 0,
  shellMotionStrength: 1.25,
  shellPointSizeMin: 0.42,
  shellPointSizeMax: 0.82,
  shellPointAlphaMin: 0.34,
  shellPointAlphaMax: 0.72,
  binaryBrightness: 1.42,
  outlineBrightness: 2.05,
  outlineExpand: 0.018,
  outlinePointSizeMin: 0.82,
  outlinePointSizeMax: 1.48,
  outlineAlpha: 1.0,
  trailCount: 180,
  trailEmitInterval: 0.02,
  trailLife: 0.85,
  trailDrag: 2.1,
  trailSpeed: 0.32,
  trailJitter: 0.08,
  trailPointSizeMin: 0.7,
  trailPointSizeMax: 1.3,
  trailAlpha: 0.84,

  patrolRadiusMin: 1.75,
  patrolRadiusMax: 3.40,
  patrolHeightMin: -0.10,
  patrolHeightMax: 1.55,
  patrolFrontMin: 0.35,
  patrolFrontMax: 1.35,
  patrolSideSpan: 1.25,
  patrolViewMargin: 0.78,
  patrolViewYMin: -0.48,
  patrolViewYMax: 0.46,
  patrolRepickMin: 1.8,
  patrolRepickMax: 3.4,
  patrolRecoveryMargin: 0.96,
  patrolRecoverySpeedScale: 1.2,
  patrolCenterPull: 0.12,

  flySpeed: 1.55,
  diveSpeed: 2.00,
  flySadSpeedScale: 0.62,
  approachSlowRadius: 0.42,
  turnLerp: 0.22,
  turnLerpFast: 0.28,
  turnResponse: 12.0,
  turnResponseFast: 17.0,
  headingTargetBlend: 0.18,
  headingVelocityBlend: 0.82,
  headingVelocityMin: 0.035,
  headingMinSpeed: 0.08,
  headingDeadzone: 0.03,
  headingSmoothing: 10.0,
  velocityResponse: 5.4,
  patrolVisibilityGrace: 0.18,
  recoveryVisibilityGrace: 0.22,
  animationFadeLoop: 0.22,
  animationFadeOnce: 0.16,
  visualBankMax: 0.24,
  visualBankResponse: 7.5,
  visualPitchMax: 0.12,
  visualPitchResponse: 6.0,

  hoverPerchDelay: 0.10,
  perchDistance: 0.12,
  landTriggerDistance: 0.12,
  coverPerchLift: 0.065,
  coverPerchForward: 0.055,
  coverPerchLerp: 0.18,

  takeoffRiseHeight: 0.20,
  takeoffMotionScale: 1.0,

  voidSpawnRadius: 2.25,
  voidHeightMin: -0.9,
  voidHeightMax: 1.8,
  voidHoverRadius: 0.18,
  voidConsumeDistance: 0.20,
  voidInspectDuration: 5.0,
  satiatedDuration: 8.0,

  voidParticleCount: 320,
  voidDepth: 0.88,

  nestMax: 5,
  nestChancePerPerch: 0.22,
  nestDepositDelay: 7.5,
  stateSaveInterval: 5.0,
  vitalityDrainPerSecond: 0.0026,
  vitalityRecoveryPerSecond: 0.01,
  offlineDrainPerHour: 0.05,
  sadThreshold: 0.30,
  homePerchBoneName: "PerchBone",
  homePerchOffset: { x: 0.0, y: 0.015, z: 0.0 },
  homePerchForward: 0.09,
  homePerchLift: 0.025,
  homeApproachDistance: 0.12,
  homePerchLerp: 0.16,
  signalDecayPerSecond: 0.070,
  signalHoverBoost: 0.42,
  signalPointerBoost: 0.22,
  signalWheelBoost: 0.08,
  signalPanelBoost: 0.12,
  signalAudioBoost: 0.18,
  fatigueFlightPerSecond: 0.050,
  fatigueStimulusPerSecond: 0.042,
  fatigueRestRecoveryPerSecond: 0.22,
  trustGainPerSecond: 0.12,
  trustLossPerSecond: 0.34,
  corruptionGainPerSecond: 0.16,
  corruptionRestRecoveryPerSecond: 0.17,
  corruptionSignalDamp: 0.28,
  gentlePointerSpeed: 0.35,
  aggressivePointerSpeed: 1.10,
  aggressiveWheelThreshold: 620,
  homeRestThreshold: 0.52,
  homeLeaveThreshold: 0.34,
  fragmentCollectPerSecond: 0.16,
  fragmentDepositThreshold: 1.0,
  companionTrustThreshold: 0.42,
  companionDistance: 0.36,
  companionLift: 0.08,
  cursorAttractChancePerSecond: 0.20,
  cursorAttractDistance: 0.92,
  cursorAttractMinDuration: 1.8,
  cursorAttractMaxDuration: 3.6,
  cursorAttractCooldownMin: 2.4,
  cursorAttractCooldownMax: 5.8,
  cursorTargetPullBack: 0.10,
  cursorTargetLift: 0.03,
  cursorTouchDistance: 0.11,
  cursorTouchHoldMin: 0.65,
  cursorTouchHoldMax: 1.05,
  cursorTrustThreshold: 0.20,
  cursorAggressionMax: 0.42,
  cursorFollowSpeedScale: 0.92,
  residueIncreasePerSecond: 0.040,
  residueCleansePerSecond: 0.26,
  residueOpacityMax: 0.55,
  residueScaleMin: 0.10,
  residueScaleMax: 0.26,
  pagePreferences: {
    about: 1.0,
    gallery: 0.35,
    achievements: -0.85,
    fab: -0.10,
    sketchfab: -0.12,
    "twenty-two-minutes": 0.22,
    contact: 0.25
  },
  debug: false,
  debugOverlay: true,
  debugOverlayTop: 10,
  debugOverlayRight: 12,
  debugOverlayWidth: 220,
  debugOverlayBarHeight: 6
};

const ACTION_KEYS = {
  fly: ["f fly", "fly", "flying", "hover", "hover fly", "glide", "move"],
  flySad: ["f fly sad", "fly sad", "sad fly", "tired fly", "weak fly", "hurt fly", "sad"],
  land: ["f land", "landing", "land", "touch down", "touchdown"],
  perch: ["f land idle", "land idle", "perch", "perched", "rest", "idle perched", "idle"],
  takeoff: ["f land to takeoff", "f land to take off", "land to takeoff", "takeoff", "take off", "launch", "lift off", "liftoff"],
  feed: ["f void inspect", "void inspect", "inspect", "feed", "eat", "consume", "sniff"],
};

function normalizeName(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/[_|]+/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function clamp01(v) {
  return THREE.MathUtils.clamp(v, 0, 1);
}

function smooth01(v) {
  const t = clamp01(v);
  return t * t * (3 - 2 * t);
}

function randomFromRange(min, max) {
  return min + Math.random() * (max - min);
}

function hexToRgba(hex, alpha) {
  const color = new THREE.Color(hex);
  return `rgba(${Math.round(color.r * 255)}, ${Math.round(color.g * 255)}, ${Math.round(color.b * 255)}, ${alpha})`;
}

function createBinaryGlyphAtlas() {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 512;
  const ctx = c.getContext("2d");
  ctx.clearRect(0, 0, c.width, c.height);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.imageSmoothingEnabled = true;
  ctx.shadowColor = "rgba(255,255,255,0.18)";
  ctx.shadowBlur = 10;
  ctx.fillStyle = "#ffffff";
  ctx.font = '900 360px ui-monospace, "SFMono-Regular", Menlo, Monaco, Consolas, monospace';
  ctx.fillText("0", 256, 262);
  ctx.fillText("1", 768, 262);
  const texture = new THREE.CanvasTexture(c);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

function createMessTexture(size = 256) {
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d");
  ctx.clearRect(0, 0, size, size);

  const grad = ctx.createRadialGradient(size * 0.5, size * 0.5, size * 0.04, size * 0.5, size * 0.5, size * 0.5);
  grad.addColorStop(0, "rgba(0,0,0,0.82)");
  grad.addColorStop(0.55, "rgba(6,18,32,0.38)");
  grad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(size * 0.5, size * 0.5, size * 0.42, 0, Math.PI * 2);
  ctx.fill();

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = '700 18px ui-monospace, "SFMono-Regular", Menlo, Monaco, Consolas, monospace';

  for (let i = 0; i < 130; i += 1) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const alpha = 0.18 + Math.random() * 0.46;
    const hue = ["#2fe4ff", "#4b7dff", "#ff57ce", "#33ff88"][i % 4];
    ctx.fillStyle = hexToRgba(hue, alpha);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((Math.random() - 0.5) * 0.8);
    ctx.fillText(Math.random() > 0.5 ? "0" : "1", 0, 0);
    ctx.restore();
  }

  const texture = new THREE.CanvasTexture(c);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

function createBinaryPointsMaterial(atlas, palette, lightDir) {
  const paletteUniform = palette.map((c) => c.clone());
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: THREE.NormalBlending,
    uniforms: {
      uAtlas: { value: atlas },
      uTime: { value: 0 },
      uLightDir: { value: lightDir.clone() },
      uPalette: { value: paletteUniform },
      uAlphaBoost: { value: 1 },
      uSadness: { value: 0 },
      uMotion: { value: 0 },
      uBrightness: { value: 1.42 }
    },
    vertexShader: `
      uniform float uTime;
      uniform vec3 uLightDir;
      uniform float uSadness;
      uniform float uMotion;

      attribute vec3 aNormal;
      attribute float aSeed;
      attribute float aSize;
      attribute float aAlpha;

      varying float vDigit;
      varying float vAlpha;
      varying float vShade;
      varying float vPalette;

      void main() {
        vec3 p = position;
        vec3 n = normalize(aNormal);

        float motion = 0.28 + uMotion * 0.92;
        float drift = (0.0016 + aSeed * 0.0034) * motion * (1.0 - uSadness * 0.10);
        p += n * (sin(uTime * (7.2 + fract(aSeed * 3.2) * 4.2) + aSeed * 40.0) * drift * 0.55);
        p.x += sin(uTime * (1.9 + fract(aSeed * 0.8)) + aSeed * 31.0) * drift * 0.28;
        p.y += cos(uTime * (2.4 + fract(aSeed * 0.9)) + aSeed * 47.0) * drift * 0.34;
        p.z += cos(uTime * (2.1 + fract(aSeed * 1.1)) + aSeed * 23.0) * drift * 0.38;

        vec3 worldNormal = normalize(mat3(modelMatrix) * n);
        float light = max(dot(worldNormal, normalize(uLightDir)), 0.0);
        float shadeRaw = pow(smoothstep(0.10, 0.98, light), 1.85);
        float shade = mix(0.34, 1.0, shadeRaw);

        float digitSwitch = floor(uTime * (2.2 + fract(aSeed * 0.8)) + aSeed * 21.0);
        vDigit = mod(digitSwitch, 2.0);
        vPalette = fract(aSeed * 13.7 + uMotion * 0.03);
        vShade = shade;
        vAlpha = aAlpha * mix(0.72, 1.0, shade) * (0.98 + uMotion * 0.16) * (1.0 - uSadness * 0.22);

        vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = max(2.0, aSize * (32.0 / max(1.0, -mvPosition.z)) * (1.00 + uMotion * 0.12));
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform sampler2D uAtlas;
      uniform vec3 uPalette[7];
      uniform float uAlphaBoost;
      uniform float uSadness;
      uniform float uBrightness;

      varying float vDigit;
      varying float vAlpha;
      varying float vShade;
      varying float vPalette;

      vec3 palette(float t) {
        float scaled = t * 6.0;
        int i0 = int(floor(scaled));
        int i1 = min(i0 + 1, 6);
        float f = fract(scaled);
        return mix(uPalette[i0], uPalette[i1], f);
      }

      void main() {
        vec2 uv = gl_PointCoord;
        vec2 atlasUv = vec2((uv.x + vDigit) * 0.5, uv.y);
        vec4 glyph = texture2D(uAtlas, atlasUv);
        float alpha = glyph.a * vAlpha * uAlphaBoost;
        if (alpha < 0.02) discard;

        vec3 color = palette(vPalette);
        color *= mix(0.42, 1.0, vShade) * uBrightness;
        color = mix(color, vec3(0.10, 0.18, 0.24), uSadness * 0.22);

        gl_FragColor = vec4(color, alpha);
      }
    `
  });
}

function createBinaryOutlineMaterial(atlas, palette, lightDir) {
  const paletteUniform = palette.map((c) => c.clone());
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: THREE.NormalBlending,
    uniforms: {
      uAtlas: { value: atlas },
      uTime: { value: 0 },
      uLightDir: { value: lightDir.clone() },
      uPalette: { value: paletteUniform },
      uAlpha: { value: 1 },
      uSadness: { value: 0 },
      uMotion: { value: 0 },
      uBrightness: { value: 2.05 }
    },
    vertexShader: `
      uniform float uTime;
      uniform vec3 uLightDir;
      uniform float uMotion;

      attribute vec3 aNormal;
      attribute float aSeed;
      attribute float aSize;
      attribute float aAlpha;

      varying float vDigit;
      varying float vAlpha;
      varying float vPalette;
      varying float vEdge;
      varying float vShade;

      void main() {
        vec3 n = normalize(aNormal);
        vec3 p = position + n * (0.0015 + uMotion * 0.0022);
        float flutter = (0.0018 + aSeed * 0.0032) * (0.65 + uMotion * 0.75);
        p += n * sin(uTime * (5.2 + fract(aSeed * 3.0) * 3.6) + aSeed * 22.0) * flutter;

        vec4 worldPos = modelMatrix * vec4(p, 1.0);
        vec3 worldNormal = normalize(mat3(modelMatrix) * n);
        vec3 viewDir = normalize(cameraPosition - worldPos.xyz);
        float fresnel = pow(max(0.0, 1.0 - abs(dot(worldNormal, viewDir))), 1.55);
        float light = max(dot(worldNormal, normalize(uLightDir)), 0.0);
        float shadeRaw = pow(smoothstep(0.10, 0.98, light), 1.85);
        float shade = mix(0.34, 1.0, shadeRaw);

        vEdge = fresnel;
        vShade = shade;
        vDigit = mod(floor(uTime * (2.3 + fract(aSeed * 1.7)) + aSeed * 17.0), 2.0);
        vPalette = fract(aSeed * 8.7 + uTime * 0.02);
        vAlpha = aAlpha * mix(0.70, 1.0, shade) * mix(0.34, 0.86, fresnel);

        vec4 mvPosition = viewMatrix * worldPos;
        gl_PointSize = max(2.2, aSize * (32.0 / max(1.0, -mvPosition.z)) * (1.00 + uMotion * 0.10));
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform sampler2D uAtlas;
      uniform vec3 uPalette[7];
      uniform float uAlpha;
      uniform float uSadness;
      uniform float uBrightness;

      varying float vDigit;
      varying float vAlpha;
      varying float vPalette;
      varying float vEdge;
      varying float vShade;

      vec3 palette(float t) {
        float scaled = t * 6.0;
        int i0 = int(floor(scaled));
        int i1 = min(i0 + 1, 6);
        float f = fract(scaled);
        return mix(uPalette[i0], uPalette[i1], f);
      }

      void main() {
        vec2 uv = gl_PointCoord;
        vec2 atlasUv = vec2((uv.x + vDigit) * 0.5, uv.y);
        vec4 glyph = texture2D(uAtlas, atlasUv);
        float edge = smoothstep(0.08, 0.92, vEdge);
        float alpha = glyph.a * vAlpha * edge * uAlpha;
        if (alpha < 0.02) discard;

        vec3 color = palette(vPalette);
        color *= mix(0.46, 0.96, vShade) * uBrightness;
        color = mix(color, vec3(0.12, 0.18, 0.22), uSadness * 0.18);

        gl_FragColor = vec4(color, alpha);
      }
    `
  });
}

function createBinaryTrailMaterial(atlas, palette) {
  const paletteUniform = palette.map((c) => c.clone());
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uAtlas: { value: atlas },
      uTime: { value: 0 },
      uPalette: { value: paletteUniform },
      uAlpha: { value: 1 }
    },
    vertexShader: `
      uniform float uTime;
      attribute float aSeed;
      attribute float aSize;
      attribute float aLife;
      varying float vDigit;
      varying float vAlpha;
      varying float vPalette;

      void main() {
        vDigit = mod(floor(uTime * (2.4 + fract(aSeed * 2.6)) + aSeed * 24.0), 2.0);
        vPalette = fract(aSeed * 7.9 + uTime * 0.04);
        vAlpha = aLife;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = max(1.8, aSize * (24.0 / max(1.0, -mvPosition.z)) * (0.55 + aLife));
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform sampler2D uAtlas;
      uniform vec3 uPalette[7];
      uniform float uAlpha;
      varying float vDigit;
      varying float vAlpha;
      varying float vPalette;

      vec3 palette(float t) {
        float scaled = t * 6.0;
        int i0 = int(floor(scaled));
        int i1 = min(i0 + 1, 6);
        float f = fract(scaled);
        return mix(uPalette[i0], uPalette[i1], f);
      }

      void main() {
        vec2 uv = gl_PointCoord;
        vec2 atlasUv = vec2((uv.x + vDigit) * 0.5, uv.y);
        vec4 glyph = texture2D(uAtlas, atlasUv);
        float alpha = glyph.a * vAlpha * uAlpha;
        if (alpha < 0.02) discard;
        vec3 color = palette(vPalette);
        gl_FragColor = vec4(color, alpha);
      }
    `
  });
}

function createVoidMaterial(atlas, palette) {
  const paletteUniform = palette.map((c) => c.clone());
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uAtlas: { value: atlas },
      uTime: { value: 0 },
      uPalette: { value: paletteUniform },
      uAlpha: { value: 1 }
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
        float pulse = 0.75 + sin(uTime * 2.4 + aSeed * 30.0) * 0.18;
        vDigit = mod(floor(uTime * (2.0 + fract(aSeed * 3.0)) + aSeed * 26.0), 2.0);
        vPalette = fract(aSeed * 13.1 + aT * 0.3);
        vAlpha = pulse * (1.0 - aT * 0.45);
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = max(2.0, aSize * (38.0 / max(1.0, -mvPosition.z)) * mix(1.3, 0.7, aT));
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform sampler2D uAtlas;
      uniform vec3 uPalette[7];
      uniform float uAlpha;
      varying float vDigit;
      varying float vAlpha;
      varying float vPalette;

      vec3 palette(float t) {
        float scaled = t * 6.0;
        int i0 = int(floor(scaled));
        int i1 = min(i0 + 1, 6);
        float f = fract(scaled);
        return mix(uPalette[i0], uPalette[i1], f);
      }

      void main() {
        vec2 uv = gl_PointCoord;
        vec2 atlasUv = vec2((uv.x + vDigit) * 0.5, uv.y);
        vec4 glyph = texture2D(uAtlas, atlasUv);
        float alpha = glyph.a * vAlpha * uAlpha;
        if (alpha < 0.02) discard;
        vec3 color = palette(vPalette);
        gl_FragColor = vec4(color, alpha);
      }
    `
  });
}

function createCoreDiscMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: THREE.NormalBlending,
    uniforms: {
      uTime: { value: 0 },
      uAlpha: { value: 1 }
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform float uAlpha;
      varying vec2 vUv;
      void main() {
        vec2 uv = vUv * 2.0 - 1.0;
        float r = length(uv);
        float angle = atan(uv.y, uv.x);
        float spin = sin(angle * 6.0 + uTime * 2.0) * 0.04;
        float inner = smoothstep(0.22 + spin, 0.0, r);
        float ring = smoothstep(0.62, 0.38, r) * (1.0 - smoothstep(0.38, 0.0, r));
        vec3 color = mix(vec3(0.0), vec3(0.03, 0.08, 0.12), ring * 0.45);
        float alpha = max(inner, ring * 0.34) * uAlpha;
        if (alpha < 0.02) discard;
        gl_FragColor = vec4(color, alpha);
      }
    `
  });
}

function scoreClipName(clipName, pattern) {
  const clipNorm = normalizeName(clipName);
  const patternNorm = normalizeName(pattern);
  if (!clipNorm || !patternNorm) return -1;
  if (clipNorm === patternNorm) return 1000;
  if (clipNorm.startsWith(patternNorm)) return 700;
  if (clipNorm.includes(patternNorm)) return 500 - (clipNorm.length - patternNorm.length);

  const clipTokens = new Set(clipNorm.split(" "));
  const patternTokens = patternNorm.split(" ").filter(Boolean);
  const overlap = patternTokens.reduce((sum, token) => sum + (clipTokens.has(token) ? 1 : 0), 0);
  if (!overlap) return -1;
  return overlap * 100 - Math.abs(clipTokens.size - patternTokens.length) * 2;
}

function chooseBestClip(clips, patterns) {
  if (!clips.length) return null;

  let bestClip = null;
  let bestScore = -1;

  for (const clip of clips) {
    for (const pattern of patterns) {
      const score = scoreClipName(clip.name, pattern);
      if (score > bestScore) {
        bestScore = score;
        bestClip = clip;
      }
    }
  }

  return bestScore >= 0 ? bestClip : null;
}

function collectAnimationClips(root, explicitClips = []) {
  const collected = [];
  const pushClip = (clip) => {
    if (!clip || !clip.name || !clip.duration) return;
    collected.push(clip);
  };

  explicitClips.forEach(pushClip);
  if (Array.isArray(root?.animations)) root.animations.forEach(pushClip);
  root?.traverse?.((child) => {
    if (Array.isArray(child?.animations)) child.animations.forEach(pushClip);
  });

  return collected;
}

function applyBoneTransformToVector(mesh, vertexIndex, target) {
  if (!mesh?.isSkinnedMesh) return target;
  if (typeof mesh.applyBoneTransform === "function") {
    mesh.applyBoneTransform(vertexIndex, target);
    return target;
  }
  if (typeof mesh.boneTransform === "function") {
    mesh.boneTransform(vertexIndex, target);
    return target;
  }
  return target;
}

function ensureMaterialArray(value) {
  if (Array.isArray(value)) return value;
  return value ? [value] : [];
}

export class MothSystem {
  constructor(options) {
    this.scene = options.scene;
    this.camera = options.camera;
    this.renderer = options.renderer;
    this.orbitRoot = options.orbitRoot || options.scene;
    this.centralModel = options.centralModel;
    this.palette = Array.isArray(options.palette) && options.palette.length ? options.palette : DEFAULT_PALETTE;
    this.lightDir = options.lightDir || new THREE.Vector3(0.75, 1.1, 0.55).normalize();
    this.assets = options.assets || {};
    this.cfg = { ...DEFAULT_CONFIG, ...(options.config || {}) };
    this.coverSize = options.coverSize || { width: 0.84, height: 0.50 };
    this.orbitCenter = options.orbitCenter ? options.orbitCenter.clone() : new THREE.Vector3();
    this.debug = typeof options.debug === "function" ? options.debug : null;
    this.getElapsed = typeof options.getElapsed === "function" ? options.getElapsed : (() => 0);

    this.glyphAtlas = options.glyphAtlas || createBinaryGlyphAtlas();
    this.messTexture = createMessTexture();
    this.fbxLoader = new FBXLoader();

    this.root = new THREE.Group();
    this.root.name = "SpecterMothRoot";
    this.scene.add(this.root);

    this.visualRoot = new THREE.Group();
    this.visualRoot.name = "SpecterMothVisualRoot";
    this.root.add(this.visualRoot);

    this.modelRoot = null;
    this.mixer = null;
    this.actions = new Map();
    this.actionDurations = new Map();
    this.currentActionKey = "";
    this.pendingActionKey = "";
    this.binaryShell = null;
    this.binarySamples = [];
    this.outlineShell = null;
    this.outlineSamples = [];
    this.binaryMaterial = null;
    this.outlineMaterial = null;
    this.trail = null;
    this.hitProxy = null;

    this.nestGroup = new THREE.Group();
    this.voidGroup = new THREE.Group();
    this.residueGroup = new THREE.Group();
    this.scene.add(this.nestGroup);
    this.scene.add(this.voidGroup);
    this.scene.add(this.residueGroup);

    this.voidPoints = null;
    this.voidGeometry = null;
    this.voidMaterial = null;
    this.voidCore = null;
    this.voidSeed = [];
    this.voidState = null;

    this.nests = [];
    this.saved = this.loadSavedState();
    this.vitality = clamp01(this.saved.vitality ?? 0.82);
    this.signalLevel = clamp01(this.saved.signalLevel ?? 0.56);
    this.fatigue = clamp01(this.saved.fatigue ?? 0.22);
    this.trust = clamp01(this.saved.trust ?? 0.48);
    this.corruption = clamp01(this.saved.corruption ?? 0.08);
    this.fragmentCharge = Math.max(0, Number(this.saved.fragmentCharge ?? 0));
    this.coverResidue = [];
    this.residueSprites = [];
    this.homeBone = null;
    this.homePerch = null;
    this.currentPerchTarget = null;
    this.searchUrgency = 0.0;
    this.lastSaveAt = 0;
    this.lastNestDropAt = 0;

    this.ready = false;
    this.visible = true;
    this.mode = "patrol";
    this.perched = false;
    this.flipBusy = false;

    this.currentPatrolAnchor = new THREE.Vector3();
    this.nextPatrolDecisionAt = 0;
    this.hoverClock = 0;
    this.satiatedUntil = 0;

    this.velocity = new THREE.Vector3();
    this.forward = new THREE.Vector3(0, 0, -1);
    this.smoothedHeading = new THREE.Vector3(0, 0, -1);
    this.orientationUp = new THREE.Vector3(0, 1, 0);
    this.frameMotionDirection = new THREE.Vector3(0, 0, -1);
    this.lastRootPosition = this.root.position.clone();
    this.anchorHiddenSince = -1;
    this.recoveryHiddenSince = -1;
    this.recoveryAssist = false;
    this.visualBank = 0;
    this.visualPitch = 0;
    this.baseVisualPitch = this.cfg.modelPitchOffset || 0;
    this.baseVisualYaw = this.cfg.modelYawOffset || 0;
    this.baseVisualRoll = this.cfg.modelRollOffset || 0;
    this.lastDelta = 1 / 60;

    this.takeoffState = null;
    this.cursorCuriousUntil = 0;
    this.cursorInteractUntil = 0;
    this.nextCursorAttractAt = 0;
    this.cursorInteractionStarted = false;
    this.cursorInteractionActionKey = "";
    this.inputState = {
      pointerWorld: null,
      pointerMotion: 0,
      pointerInfluence: 0,
      aggression: 0,
      gentleBias: 0,
      lastClientX: null,
      lastClientY: null,
      lastMoveAtMs: 0,
      lastSignalAt: 0,
      wheelImpulse: 0,
      panelSignal: 0,
      currentHoveredId: "",
      lastHoveredId: ""
    };

    this.debugOverlay = null;
    this.debugOverlayMetrics = new Map();
    this.debugOverlayText = {};

    this.temp = {
      a: new THREE.Vector3(),
      b: new THREE.Vector3(),
      c: new THREE.Vector3(),
      d: new THREE.Vector3(),
      e: new THREE.Vector3(),
      q: new THREE.Quaternion(),
      q2: new THREE.Quaternion(),
      m: new THREE.Matrix4(),
      sphere: new THREE.Sphere(this.orbitCenter.clone(), this.cfg.voidSpawnRadius),
      plane: new THREE.Plane(new THREE.Vector3(0, 1, 0), -this.orbitCenter.y),
      pointer: new THREE.Vector2(),
      raycaster: new THREE.Raycaster(),
      bbox: new THREE.Box3(),
      size: new THREE.Vector3(),
      center: new THREE.Vector3(),
      screen: new THREE.Vector3()
    };

    this.root.position.copy(this.orbitCenter).add(new THREE.Vector3(0.25, 0.95, 0.55));

    this.initVoidVisuals();
    this.restoreNests();
    this.applyOfflineDecay();
    this.setupInteractionSensing();
    this.setupDebugOverlay();
    this.load();
  }

  log(message, level = "MOTH") {
    if (this.debug) this.debug(message, level);
  }

  loadSavedState() {
    try {
      const raw = localStorage.getItem(this.cfg.storageKey);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  saveState(force = false) {
    const elapsed = this.getElapsed();
    if (!force && elapsed - this.lastSaveAt < this.cfg.stateSaveInterval) return;
    this.lastSaveAt = elapsed;

    try {
      localStorage.setItem(
        this.cfg.storageKey,
        JSON.stringify({
          vitality: this.vitality,
          signalLevel: this.signalLevel,
          fatigue: this.fatigue,
          trust: this.trust,
          corruption: this.corruption,
          fragmentCharge: this.fragmentCharge,
          coverResidue: this.coverResidue,
          lastVisit: Date.now(),
          nests: this.nests.map((nest) => ({
            id: nest.id,
            type: nest.type,
            x: nest.position.x,
            y: nest.position.y,
            z: nest.position.z,
            rx: nest.rotation.x,
            ry: nest.rotation.y,
            rz: nest.rotation.z,
            scale: nest.scale,
            coverIndex: typeof nest.coverIndex === "number" ? nest.coverIndex : null
          }))
        })
      );
    } catch {
      // ignore storage failures
    }
  }

  applyOfflineDecay() {
    const lastVisit = Number(this.saved.lastVisit || 0);
    if (!lastVisit) return;
    const hours = Math.max(0, (Date.now() - lastVisit) / 3600000);
    if (hours <= 0.1) return;
    this.vitality = clamp01(this.vitality - hours * this.cfg.offlineDrainPerHour);
    this.signalLevel = clamp01(this.signalLevel - hours * (this.cfg.offlineDrainPerHour * 0.8));
    this.fatigue = clamp01(this.fatigue + hours * 0.05);
    this.trust = clamp01(this.trust - hours * 0.03);
    this.corruption = clamp01(this.corruption + hours * 0.02);
  }

  restoreNests() {
    const savedNests = Array.isArray(this.saved.nests) ? this.saved.nests : [];
    this.coverResidue = Array.isArray(this.saved.coverResidue) ? this.saved.coverResidue.map((value) => clamp01(Number(value) || 0)) : [];
    savedNests.slice(0, this.cfg.nestMax).forEach((nest, index) => {
      const position = new THREE.Vector3(nest.x || 0, nest.y || 0, nest.z || 0);
      const rotation = new THREE.Euler(nest.rx || -Math.PI / 2, nest.ry || 0, nest.rz || 0);
      this.spawnNestAt(position, rotation, nest.scale || 0.15, nest.type || "ground", nest.coverIndex ?? null, nest.id || `nest_${index}`);
    });
  }

  async load() {
    try {
      const loaded = await this.loadModelAsset(this.assets.modelFBX || "./assets/models/moth/moth.fbx");
      const clips = Array.isArray(loaded.animations) ? loaded.animations : [];
      this.setupModel(loaded, clips);
    } catch (error) {
      this.log("moth asset load failed", "WARN");
      this.setupModel(this.createFallbackMoth(), []);
    }
  }

  loadModelAsset(path) {
    return new Promise((resolve, reject) => {
      this.fbxLoader.load(path, (fbx) => resolve(fbx), undefined, reject);
    });
  }

  createFallbackMoth() {
    const group = new THREE.Group();

    const body = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.06, 0.16, 4, 8),
      new THREE.MeshStandardMaterial({
        color: new THREE.Color("#a9b8c7"),
        emissive: new THREE.Color("#16384d"),
        emissiveIntensity: 0.45,
        roughness: 0.88,
        metalness: 0.04,
        transparent: true,
        opacity: 0.9
      })
    );
    body.rotation.z = Math.PI * 0.5;
    group.add(body);

    const wingMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#8ea2b6"),
      emissive: new THREE.Color("#143246"),
      emissiveIntensity: 0.38,
      roughness: 0.92,
      metalness: 0.02,
      transparent: true,
      opacity: 0.82,
      side: THREE.DoubleSide
    });

    const wingGeo = new THREE.PlaneGeometry(0.22, 0.36, 2, 2);
    const wingA = new THREE.Mesh(wingGeo, wingMat);
    wingA.position.set(-0.04, 0.02, 0.0);
    wingA.rotation.z = 0.78;
    wingA.rotation.y = -0.12;
    group.add(wingA);

    const wingB = wingA.clone();
    wingB.position.x = 0.04;
    wingB.rotation.z = -0.78;
    wingB.rotation.y = 0.12;
    group.add(wingB);

    const tail = new THREE.Mesh(
      new THREE.CylinderGeometry(0.008, 0.03, 0.34, 6),
      wingMat.clone()
    );
    tail.rotation.z = Math.PI * 0.5;
    tail.position.set(0.18, -0.02, 0);
    group.add(tail);

    return group;
  }

  setupModel(model, clips) {
    this.modelRoot = model.scene || model;
    this.visualRoot.add(this.modelRoot);
    this.visualRoot.rotation.set(
      this.baseVisualPitch,
      this.baseVisualYaw,
      this.baseVisualRoll
    );

    this.modelRoot.traverse((child) => {
      if (!child.isMesh) return;
      child.visible = true;
      child.frustumCulled = false;
      if (child.geometry && !child.geometry.attributes.normal && typeof child.geometry.computeVertexNormals === "function") {
        child.geometry.computeVertexNormals();
      }

      const materials = ensureMaterialArray(child.material);
      child.material = materials.map(() => {
        const mat = new THREE.MeshStandardMaterial({
          color: new THREE.Color("#b7c6d3"),
          emissive: new THREE.Color("#16384d"),
          emissiveIntensity: 0.62,
          roughness: 0.86,
          metalness: 0.04,
          transparent: true,
          opacity: 0.10,
          side: THREE.DoubleSide,
          depthWrite: false
        });
        if (child.isSkinnedMesh) {
          mat.skinning = true;
          mat.needsUpdate = true;
        }
        return mat;
      });
      if (child.material.length === 1) child.material = child.material[0];
    });

    this.fitMothScale();
    this.setupAnimations(clips);
    this.buildBinaryShell();
    this.buildBinaryOutline();
    this.buildTrail();
    this.buildHitProxy();
    this.ensureResidueSystem(0);
    this.refreshHomePerch();
    this.pickNextPatrolPoint(true);

    this.ready = true;
    this.playLoop(this.getPatrolFlightAction());
    this.log("specter moth online", "BOOT");
  }

  fitMothScale() {
    const mothBox = new THREE.Box3().setFromObject(this.modelRoot);
    const mothSize = mothBox.getSize(new THREE.Vector3());
    const mothCenter = mothBox.getCenter(new THREE.Vector3());

    const modelBox = this.centralModel ? new THREE.Box3().setFromObject(this.centralModel) : new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(), new THREE.Vector3(1, 1, 1));
    const modelSize = modelBox.getSize(new THREE.Vector3());
    const targetHeight = Math.max(0.12, modelSize.y * this.cfg.sizeRatioToModelHeight);
    const scale = mothSize.y > 0 ? targetHeight / mothSize.y : 0.08;

    this.modelRoot.scale.setScalar(scale);
    this.modelRoot.position.set(
      -mothCenter.x * scale,
      -mothCenter.y * scale,
      -mothCenter.z * scale
    );
  }

  setupAnimations(clips) {
    const availableClips = collectAnimationClips(this.modelRoot, clips);
    if (!availableClips.length || !this.modelRoot) {
      this.log("moth loaded without animation clips", "WARN");
      return;
    }

    this.mixer = new THREE.AnimationMixer(this.modelRoot);

    const uniqueClips = [];
    const seen = new Set();
    availableClips.forEach((clip) => {
      if (!clip || !clip.duration) return;
      const key = `${normalizeName(clip.name)}_${clip.duration.toFixed(3)}`;
      if (seen.has(key)) return;
      seen.add(key);
      uniqueClips.push(clip);
    });

    console.log(
      "[Moth] Available animation clips:",
      uniqueClips.map((clip) => clip.name)
    );

    const createAction = (clip) => {
      const action = this.mixer.clipAction(clip);
      action.enabled = true;
      action.clampWhenFinished = true;
      action.zeroSlopeAtStart = true;
      action.zeroSlopeAtEnd = true;
      return action;
    };

    Object.entries(ACTION_KEYS).forEach(([actionKey, patterns]) => {
      const clip = chooseBestClip(uniqueClips, patterns);
      if (!clip) return;

      const action = createAction(clip);
      this.actions.set(actionKey, action);
      this.actionDurations.set(actionKey, clip.duration);
    });

    if (!this.actions.size) {
      this.log(`moth clips found but no state mappings matched: ${uniqueClips.map((clip) => clip.name).join(", ")}`, "WARN");
      return;
    }

    if (!this.actions.has("flySad") && this.actions.has("fly")) {
      this.actions.set("flySad", this.actions.get("fly"));
      this.actionDurations.set("flySad", this.actionDurations.get("fly") || 0);
    }
    if (!this.actions.has("perch") && this.actions.has("land")) {
      this.actions.set("perch", this.actions.get("land"));
      this.actionDurations.set("perch", this.actionDurations.get("land") || 0);
    }

    this.log(`moth animation states: ${Array.from(this.actions.keys()).join(", ")}`, "BOOT");
    this.mixer.addEventListener("finished", (event) => this.onActionFinished(event));
  }

  onActionFinished(event) {
    const finishedAction = event?.action || null;
    const activeAction = this.currentActionKey ? this.getAction(this.currentActionKey) : null;

    if (finishedAction && activeAction && finishedAction !== activeAction) {
      return;
    }

    if (this.currentActionKey === "land" && this.pendingActionKey === "perch") {
      this.pendingActionKey = "";
      this.perched = true;
      this.mode = this.currentPerchTarget?.type === "home" ? "restHome" : "landed";
      this.playLoop("perch");
      return;
    }

    if (this.currentActionKey === "takeoff") {
      const next = this.pendingActionKey || this.getPatrolFlightAction();
      this.pendingActionKey = "";
      this.perched = false;
      this.mode = this.voidState?.active ? "approachVoid" : "patrol";
      this.currentPerchTarget = null;
      this.takeoffState = null;
      this.playLoop(next);
      return;
    }

    if (this.currentActionKey === "backflip") {
      const backflipAction = this.getAction("backflip");
      const guardDelta = Math.max(0.035, this.lastDelta * 2.0);
      const guardUntil = this.backflipGuardUntil || 0;

      if (finishedAction && backflipAction && finishedAction !== backflipAction) {
        return;
      }

      if (guardUntil > 0 && this.getElapsed() + guardDelta < guardUntil) {
        return;
      }

      this.finishBackflip();
      return;
    }

    if (this.pendingActionKey) {
      const next = this.pendingActionKey;
      this.pendingActionKey = "";
      this.playLoop(next);
    }
  }

  finishBackflip() {
    if (this.currentActionKey !== "backflip" && this.mode !== "backflip") return;

    this.flipBusy = false;
    this.clearCursorAttraction();
    this.frameMotionDirection.copy(this.forward);

    const next = this.pendingActionKey || this.getPatrolFlightAction();
    this.pendingActionKey = "";
    this.mode = this.voidState?.active ? "approachVoid" : "patrol";
    this.playLoop(next);
  }

  getAction(key) {
    return this.actions.get(key) || null;
  }

  getPatrolFlightAction() {
    return this.isHungry(this.getElapsed()) ? "flySad" : "fly";
  }

  isHungry(elapsed) {
    if (this.voidState?.active) return false;
    if (this.mode === "restHome") return false;
    const timeHungry = elapsed >= this.satiatedUntil;
    const signalHungry = this.signalLevel < 0.42;
    const tiredHungry = this.vitality < Math.max(0.18, this.cfg.sadThreshold);
    return timeHungry || signalHungry || tiredHungry;
  }

  playLoop(key) {
    const next = this.getAction(key);
    if (!next) return false;
    if (this.currentActionKey === key && next.isRunning()) return true;

    const fade = this.cfg.animationFadeLoop || 0.22;
    const previous = this.currentActionKey ? this.getAction(this.currentActionKey) : null;

    next.enabled = true;
    next.stopFading();
    next.setEffectiveTimeScale(1);
    next.setEffectiveWeight(1);
    next.setLoop(THREE.LoopRepeat, Infinity);
    next.clampWhenFinished = false;

    if (previous && previous !== next) {
      previous.stopFading();
      next.reset();
      next.crossFadeFrom(previous, fade, false).play();
    } else {
      next.reset();
      next.fadeIn(fade).play();
    }

    this.actions.forEach((action, actionKey) => {
      if (actionKey === key || action === next || action === previous) return;
      action.stopFading();
      action.fadeOut(fade);
    });

    this.currentActionKey = key;
    return true;
  }

  playOnce(key, followUp = "") {
    const next = this.getAction(key);
    if (!next) {
      if (followUp) this.playLoop(followUp);
      return false;
    }

    const fade = this.cfg.animationFadeOnce || 0.16;
    const previous = this.currentActionKey ? this.getAction(this.currentActionKey) : null;

    this.pendingActionKey = followUp;
    next.enabled = true;
    next.stopFading();
    next.setEffectiveTimeScale(1);
    next.setEffectiveWeight(1);
    next.reset();
    next.setLoop(THREE.LoopOnce, 1);
    next.clampWhenFinished = true;

    if (previous && previous !== next) {
      previous.stopFading();
      next.crossFadeFrom(previous, fade, false).play();
    } else {
      next.fadeIn(fade).play();
    }

    this.actions.forEach((action, actionKey) => {
      if (actionKey === key || action === next || action === previous) return;
      action.stopFading();
      action.fadeOut(fade);
    });

    this.currentActionKey = key;
    return true;
  }

  buildBinaryShell() {
    const samples = this.extractPointSamples(this.modelRoot, this.cfg.pointLimit);
    this.binarySamples = samples;
    const count = samples.length;
    if (!count) return;

    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const normals = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const alphas = new Float32Array(count);
    const seeds = new Float32Array(count);

    for (let i = 0; i < count; i += 1) {
      sizes[i] = this.cfg.shellPointSizeMin + Math.random() * (this.cfg.shellPointSizeMax - this.cfg.shellPointSizeMin);
      alphas[i] = this.cfg.shellPointAlphaMin + Math.random() * (this.cfg.shellPointAlphaMax - this.cfg.shellPointAlphaMin);
      seeds[i] = Math.random();
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));
    geometry.setAttribute("aNormal", new THREE.BufferAttribute(normals, 3).setUsage(THREE.DynamicDrawUsage));
    geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
    geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute("aAlpha", new THREE.BufferAttribute(alphas, 1));

    this.binaryMaterial = createBinaryPointsMaterial(this.glyphAtlas, this.palette, this.lightDir);
    this.binaryShell = new THREE.Points(geometry, this.binaryMaterial);
    this.binaryShell.frustumCulled = false;
    this.binaryShell.renderOrder = 12;
    this.visualRoot.add(this.binaryShell);
    this.refreshPointCloudGeometry(this.binaryShell, this.binarySamples, 0);
  }

  buildBinaryOutline() {
    const samples = this.extractPointSamples(this.modelRoot, this.cfg.outlinePointLimit || Math.max(240, Math.floor(this.cfg.pointLimit * 0.55)));
    this.outlineSamples = samples;
    const count = samples.length;
    if (!count) return;

    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const normals = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const alphas = new Float32Array(count);
    const seeds = new Float32Array(count);

    for (let i = 0; i < count; i += 1) {
      sizes[i] = this.cfg.outlinePointSizeMin + Math.random() * (this.cfg.outlinePointSizeMax - this.cfg.outlinePointSizeMin);
      alphas[i] = this.cfg.outlineAlpha * (0.85 + Math.random() * 0.25);
      seeds[i] = Math.random();
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));
    geometry.setAttribute("aNormal", new THREE.BufferAttribute(normals, 3).setUsage(THREE.DynamicDrawUsage));
    geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
    geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute("aAlpha", new THREE.BufferAttribute(alphas, 1));

    this.outlineMaterial = createBinaryOutlineMaterial(this.glyphAtlas, this.palette, this.lightDir);
    this.outlineShell = new THREE.Points(geometry, this.outlineMaterial);
    this.outlineShell.frustumCulled = false;
    this.outlineShell.renderOrder = 11;
    this.visualRoot.add(this.outlineShell);
    this.refreshPointCloudGeometry(this.outlineShell, this.outlineSamples, this.cfg.outlineExpand || 0.018);
  }

  buildTrail() {
    if (!this.binaryShell) return;

    const count = this.cfg.trailCount;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const seeds = new Float32Array(count);
    const life = new Float32Array(count);

    for (let i = 0; i < count; i += 1) {
      positions[i * 3 + 0] = 9999;
      positions[i * 3 + 1] = 9999;
      positions[i * 3 + 2] = 9999;
      sizes[i] = this.cfg.trailPointSizeMin + Math.random() * (this.cfg.trailPointSizeMax - this.cfg.trailPointSizeMin);
      seeds[i] = Math.random();
      life[i] = 0;
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));
    geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
    geometry.setAttribute("aLife", new THREE.BufferAttribute(life, 1).setUsage(THREE.DynamicDrawUsage));

    const material = createBinaryTrailMaterial(this.glyphAtlas, this.palette);
    const points = new THREE.Points(geometry, material);
    points.frustumCulled = false;
    points.renderOrder = 11;
    this.scene.add(points);

    this.trail = {
      points,
      geometry,
      material,
      positions,
      sizes,
      seeds,
      life,
      velocity: Array.from({ length: count }, () => new THREE.Vector3()),
      cursor: 0,
      emitClock: 0
    };
  }

  emitTrailParticle() {
    if (!this.trail || !this.binaryShell) return;

    const shellPositions = this.binaryShell.geometry.attributes.position.array;
    const pointCount = shellPositions.length / 3;
    if (!pointCount) return;

    const i = this.trail.cursor;
    this.trail.cursor = (this.trail.cursor + 1) % this.cfg.trailCount;

    const shellIndex = Math.floor(Math.random() * pointCount) * 3;
    this.temp.a.set(
      shellPositions[shellIndex + 0],
      shellPositions[shellIndex + 1],
      shellPositions[shellIndex + 2]
    );
    this.binaryShell.localToWorld(this.temp.a);

    const base = i * 3;
    this.trail.positions[base + 0] = this.temp.a.x;
    this.trail.positions[base + 1] = this.temp.a.y;
    this.trail.positions[base + 2] = this.temp.a.z;
    this.trail.life[i] = this.cfg.trailLife;

    const chaos = this.corruption * 0.12;
    this.trail.velocity[i]
      .copy(this.forward)
      .multiplyScalar(-this.cfg.trailSpeed * (0.7 + this.signalLevel * 0.5 + Math.random() * 0.45))
      .add(new THREE.Vector3(
        (Math.random() - 0.5) * (this.cfg.trailJitter + chaos),
        (Math.random() - 0.5) * (this.cfg.trailJitter + chaos),
        (Math.random() - 0.5) * (this.cfg.trailJitter + chaos)
      ));
  }

  updateTrail(delta, elapsed) {
    if (!this.trail) return;

    this.trail.material.uniforms.uTime.value = elapsed;
    this.trail.material.uniforms.uAlpha.value = (this.cfg.trailAlpha || 0.84) * (0.38 + this.signalLevel * 0.74 + this.trust * 0.12);

    this.trail.emitClock += delta;
    const moving = this.velocity.lengthSq() > 0.0012 || this.mode === "inspectVoid";
    const emitInterval = THREE.MathUtils.clamp(
      this.cfg.trailEmitInterval * THREE.MathUtils.lerp(1.5, 0.52, clamp01(this.signalLevel + this.corruption * 0.25)),
      0.008,
      0.08
    );

    while (moving && this.trail.emitClock >= emitInterval) {
      this.trail.emitClock -= emitInterval;
      this.emitTrailParticle();
    }

    for (let i = 0; i < this.cfg.trailCount; i += 1) {
      if (this.trail.life[i] <= 0) continue;
      this.trail.life[i] = Math.max(0, this.trail.life[i] - delta);
      const base = i * 3;
      const vel = this.trail.velocity[i];
      vel.multiplyScalar(Math.exp(-this.cfg.trailDrag * delta));
      this.trail.positions[base + 0] += vel.x * delta;
      this.trail.positions[base + 1] += vel.y * delta;
      this.trail.positions[base + 2] += vel.z * delta;
      if (this.trail.life[i] <= 0.001) {
        this.trail.positions[base + 0] = 9999;
        this.trail.positions[base + 1] = 9999;
        this.trail.positions[base + 2] = 9999;
      }
    }

    this.trail.geometry.attributes.position.needsUpdate = true;
    this.trail.geometry.attributes.aLife.needsUpdate = true;
  }

  buildHitProxy() {
    const proxy = new THREE.Mesh(
      new THREE.SphereGeometry(0.11, 12, 12),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
    );
    proxy.name = "SpecterMothHitProxy";
    this.hitProxy = proxy;
    this.root.add(proxy);
  }

  ensureResidueSystem(count = 0) {
    const desired = Math.max(0, count || 0);
    if (this.residueSprites.length === desired) return;

    this.residueGroup.clear();
    this.residueSprites = [];
    if (this.coverResidue.length !== desired) {
      this.coverResidue = Array.from({ length: desired }, (_, index) => clamp01(this.coverResidue[index] ?? (index === 2 ? 0.28 : 0.12)));
    }

    for (let i = 0; i < desired; i += 1) {
      const material = new THREE.SpriteMaterial({
        map: this.messTexture,
        color: new THREE.Color(i === 2 ? "#ff7dd1" : "#8cecff"),
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      });
      const sprite = new THREE.Sprite(material);
      sprite.renderOrder = 4;
      sprite.visible = this.visible;
      this.residueGroup.add(sprite);
      this.residueSprites.push(sprite);
    }
  }

  setupInteractionSensing() {
    const dom = this.renderer?.domElement;
    if (!dom || this._interactionSensingSetup) return;
    this._interactionSensingSetup = true;

    this._onPointerMove = (event) => this.handlePointerMove(event);
    this._onWheel = (event) => this.handleWheel(event);
    this._onPointerDown = (event) => this.handlePointerDown(event);

    dom.addEventListener("pointermove", this._onPointerMove, { passive: true });
    window.addEventListener("wheel", this._onWheel, { passive: true });
    window.addEventListener("pointerdown", this._onPointerDown, { passive: true });
  }

  setupDebugOverlay() {
    if (typeof document === "undefined" || !this.cfg.debugOverlay) return;

    this.ensureDebugOverlayStyles();

    const existing = document.getElementById("orbit-moth-debug-overlay");
    if (existing) existing.remove();

    const root = document.createElement("div");
    root.id = "orbit-moth-debug-overlay";
    root.className = "orbit-moth-debug-overlay";
    root.style.top = `${this.cfg.debugOverlayTop ?? 10}px`;
    root.style.right = `${this.cfg.debugOverlayRight ?? 12}px`;
    root.style.width = `${this.cfg.debugOverlayWidth ?? 220}px`;

    const title = document.createElement("div");
    title.className = "orbit-moth-debug-overlay__title";
    title.textContent = "Moth Debug";
    root.appendChild(title);

    const stateGrid = document.createElement("div");
    stateGrid.className = "orbit-moth-debug-overlay__state-grid";
    root.appendChild(stateGrid);

    const makeState = (label) => {
      const row = document.createElement("div");
      row.className = "orbit-moth-debug-overlay__state";
      const labelEl = document.createElement("span");
      labelEl.className = "orbit-moth-debug-overlay__state-label";
      labelEl.textContent = label;
      const valueEl = document.createElement("span");
      valueEl.className = "orbit-moth-debug-overlay__state-value";
      valueEl.textContent = "--";
      row.append(labelEl, valueEl);
      stateGrid.appendChild(row);
      return valueEl;
    };

    this.debugOverlayText = {
      mode: makeState("Mode"),
      perch: makeState("Perch"),
      page: makeState("Page"),
      cursor: makeState("Cursor"),
      void: makeState("Void")
    };

    const metricsWrap = document.createElement("div");
    metricsWrap.className = "orbit-moth-debug-overlay__metrics";
    root.appendChild(metricsWrap);

    const metricDefs = [
      ["hunger", "Hunger", "#ff8b8b"],
      ["signal", "Signal", "#7cf7dd"],
      ["fatigue", "Fatigue", "#ffd57d"],
      ["trust", "Trust", "#86b7ff"],
      ["aggression", "Aggro", "#ff6b9f"],
      ["corruption", "Corrupt", "#b884ff"],
      ["vitality", "Vitality", "#9eff8b"],
      ["fragments", "Fragments", "#9be4ff"],
      ["residue", "Residue", "#d5b7ff"]
    ];

    metricDefs.forEach(([key, label, color]) => {
      const row = document.createElement("div");
      row.className = "orbit-moth-debug-overlay__metric";

      const top = document.createElement("div");
      top.className = "orbit-moth-debug-overlay__metric-top";

      const labelEl = document.createElement("span");
      labelEl.className = "orbit-moth-debug-overlay__metric-label";
      labelEl.textContent = label;

      const valueEl = document.createElement("span");
      valueEl.className = "orbit-moth-debug-overlay__metric-value";
      valueEl.textContent = "0%";

      top.append(labelEl, valueEl);

      const track = document.createElement("div");
      track.className = "orbit-moth-debug-overlay__track";
      track.style.height = `${this.cfg.debugOverlayBarHeight ?? 6}px`;

      const fill = document.createElement("div");
      fill.className = "orbit-moth-debug-overlay__fill";
      fill.style.background = `linear-gradient(90deg, ${color}, rgba(255,255,255,0.92))`;
      track.appendChild(fill);

      row.append(top, track);
      metricsWrap.appendChild(row);
      this.debugOverlayMetrics.set(key, { fill, valueEl, track });
    });

    root.style.display = "none";
    document.body.appendChild(root);
    this.debugOverlay = root;
  }

  ensureDebugOverlayStyles() {
    if (typeof document === "undefined") return;
    if (document.getElementById("orbit-moth-debug-overlay-style")) return;

    const style = document.createElement("style");
    style.id = "orbit-moth-debug-overlay-style";
    style.textContent = `
      .orbit-moth-debug-overlay {
        position: fixed;
        z-index: 9999;
        pointer-events: none;
        padding: 10px 10px 9px;
        border-radius: 14px;
        border: 1px solid rgba(123, 238, 255, 0.26);
        background: linear-gradient(180deg, rgba(7, 12, 18, 0.82), rgba(4, 8, 14, 0.64));
        backdrop-filter: blur(10px);
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.32);
        color: rgba(227, 247, 255, 0.95);
        font: 11px/1.2 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
        letter-spacing: 0.03em;
      }
      .orbit-moth-debug-overlay__title {
        margin-bottom: 8px;
        color: rgba(140, 239, 255, 0.96);
        text-transform: uppercase;
        font-weight: 700;
        font-size: 11px;
      }
      .orbit-moth-debug-overlay__state-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 4px 10px;
        margin-bottom: 9px;
      }
      .orbit-moth-debug-overlay__state {
        display: flex;
        justify-content: space-between;
        gap: 8px;
        min-width: 0;
      }
      .orbit-moth-debug-overlay__state-label {
        opacity: 0.62;
      }
      .orbit-moth-debug-overlay__state-value {
        color: rgba(255,255,255,0.96);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        text-align: right;
      }
      .orbit-moth-debug-overlay__metrics {
        display: grid;
        gap: 6px;
      }
      .orbit-moth-debug-overlay__metric {
        display: grid;
        gap: 3px;
      }
      .orbit-moth-debug-overlay__metric-top {
        display: flex;
        justify-content: space-between;
        gap: 8px;
      }
      .orbit-moth-debug-overlay__metric-label {
        opacity: 0.72;
      }
      .orbit-moth-debug-overlay__metric-value {
        color: rgba(255,255,255,0.98);
      }
      .orbit-moth-debug-overlay__track {
        position: relative;
        overflow: hidden;
        border-radius: 999px;
        background: rgba(255,255,255,0.08);
        box-shadow: inset 0 0 0 1px rgba(255,255,255,0.05);
      }
      .orbit-moth-debug-overlay__fill {
        position: absolute;
        inset: 0 auto 0 0;
        width: 0%;
        border-radius: inherit;
        box-shadow: 0 0 12px rgba(255,255,255,0.12);
      }
    `;
    document.head.appendChild(style);
  }

  setDebugOverlayVisible(visible) {
    if (!this.debugOverlay) return;
    this.debugOverlay.style.display = visible && this.cfg.debugOverlay ? "block" : "none";
  }

  getDebugSnapshot(elapsed = this.getElapsed()) {
    const residueAverage = this.coverResidue.length
      ? this.coverResidue.reduce((sum, value) => sum + clamp01(Number(value) || 0), 0) / this.coverResidue.length
      : 0;

    const satiatedBias = elapsed < this.satiatedUntil ? -0.22 : 0;
    const hunger = clamp01(((1 - this.signalLevel) * 0.66) + (this.fatigue * 0.22) + ((1 - this.vitality) * 0.18) + satiatedBias);
    const fragments = clamp01(this.fragmentCharge / Math.max(0.001, this.cfg.fragmentDepositThreshold || 1));
    const cursorState = this.mode === "cursorInteract"
      ? "touching"
      : this.mode === "cursorCurious"
        ? "following"
        : "none";
    const perchState = this.currentPerchTarget?.type === "home"
      ? (this.mode === "restHome" ? "home" : "returning")
      : this.currentPerchTarget?.type === "cover"
        ? (this.mode === "landed" || this.mode === "landing" ? "cover" : "air")
        : "air";

    return {
      mode: this.mode || "patrol",
      page: this.inputState.currentHoveredId || this.inputState.lastHoveredId || "none",
      perch: perchState,
      cursor: cursorState,
      void: this.voidState?.active ? `${Math.round(clamp01(this.voidState.energy || 0) * 100)}%` : "none",
      metrics: {
        hunger,
        signal: clamp01(this.signalLevel),
        fatigue: clamp01(this.fatigue),
        trust: clamp01(this.trust),
        aggression: clamp01(this.inputState.aggression),
        corruption: clamp01(this.corruption),
        vitality: clamp01(this.vitality),
        fragments,
        residue: clamp01(residueAverage)
      }
    };
  }

  updateDebugOverlay(elapsed = this.getElapsed()) {
    if (!this.debugOverlay || !this.cfg.debugOverlay) return;

    const snapshot = this.getDebugSnapshot(elapsed);
    if (this.debugOverlayText.mode) this.debugOverlayText.mode.textContent = snapshot.mode;
    if (this.debugOverlayText.perch) this.debugOverlayText.perch.textContent = snapshot.perch;
    if (this.debugOverlayText.page) this.debugOverlayText.page.textContent = snapshot.page;
    if (this.debugOverlayText.cursor) this.debugOverlayText.cursor.textContent = snapshot.cursor;
    if (this.debugOverlayText.void) this.debugOverlayText.void.textContent = snapshot.void;

    Object.entries(snapshot.metrics).forEach(([key, value]) => {
      const entry = this.debugOverlayMetrics.get(key);
      if (!entry) return;
      const clamped = clamp01(Number(value) || 0);
      entry.fill.style.width = `${(clamped * 100).toFixed(1)}%`;
      entry.valueEl.textContent = `${Math.round(clamped * 100)}%`;
      entry.track.style.opacity = clamped > 0.02 ? "1" : "0.72";
    });
  }

  handlePointerMove(event) {
    const nowMs = performance.now();
    if (typeof this.inputState.lastClientX === "number" && typeof this.inputState.lastClientY === "number") {
      const dx = event.clientX - this.inputState.lastClientX;
      const dy = event.clientY - this.inputState.lastClientY;
      const dt = Math.max(8, nowMs - (this.inputState.lastMoveAtMs || nowMs));
      const speed = Math.hypot(dx, dy) / dt;
      const normalized = THREE.MathUtils.clamp(speed / 1.6, 0, 1.4);

      this.inputState.pointerMotion = normalized;
      this.inputState.pointerInfluence = clamp01(this.inputState.pointerInfluence + Math.min(0.22, normalized * 0.14));

      if (normalized <= (this.cfg.gentlePointerSpeed || 0.35)) {
        this.inputState.gentleBias = clamp01(this.inputState.gentleBias + 0.12);
      } else if (normalized >= (this.cfg.aggressivePointerSpeed || 1.10)) {
        this.inputState.aggression = clamp01(this.inputState.aggression + 0.24);
      }
    }

    this.inputState.lastClientX = event.clientX;
    this.inputState.lastClientY = event.clientY;
    this.inputState.lastMoveAtMs = nowMs;
    this.inputState.lastSignalAt = this.getElapsed();

    const point = this.projectClientPointToOrbit(event.clientX, event.clientY);
    if (point) {
      this.inputState.pointerWorld = point;
    }
  }

  handleWheel(event) {
    const deltaMagnitude = Math.abs(event.deltaY || 0) + Math.abs(event.deltaX || 0) * 0.35;
    const impulse = THREE.MathUtils.clamp(deltaMagnitude / Math.max(1, this.cfg.aggressiveWheelThreshold || 620), 0, 1.15);
    this.inputState.wheelImpulse = Math.max(this.inputState.wheelImpulse, impulse);
    this.inputState.pointerInfluence = clamp01(this.inputState.pointerInfluence + impulse * 0.08);
    if (impulse > 0.72) {
      this.inputState.aggression = clamp01(this.inputState.aggression + impulse * 0.24);
    }
    this.inputState.lastSignalAt = this.getElapsed();
  }

  handlePointerDown(event) {
    if ((event.button ?? 0) !== 0) return;
    if (event.target?.closest?.("button, a, nav, .folder-label, .quick-nav")) return;
    this.inputState.pointerInfluence = clamp01(this.inputState.pointerInfluence + 0.06);
    this.inputState.aggression = clamp01(this.inputState.aggression + 0.05);
    this.inputState.lastSignalAt = this.getElapsed();
  }

  projectClientPointToOrbit(clientX, clientY) {
    if (!this.renderer?.domElement) return null;
    const bounds = this.renderer.domElement.getBoundingClientRect();
    const pointer = this.temp.pointer;
    pointer.x = ((clientX - bounds.left) / bounds.width) * 2 - 1;
    pointer.y = -((clientY - bounds.top) / bounds.height) * 2 + 1;
    this.temp.raycaster.setFromCamera(pointer, this.camera);
    return this.pickVoidPoint();
  }

  refreshHomePerch() {
    if (!this.centralModel) return null;
    if (!this.homeBone) {
      this.homeBone = this.centralModel.getObjectByName?.(this.cfg.homePerchBoneName || "PerchBone") || null;
    }

    if (this.homeBone) {
      this.homeBone.updateWorldMatrix(true, false);
      const position = new THREE.Vector3();
      const quaternion = new THREE.Quaternion();
      const offset = this.cfg.homePerchOffset || { x: 0, y: 0, z: 0 };

      this.homeBone.getWorldPosition(position);
      this.homeBone.getWorldQuaternion(quaternion);

      position
        .add(new THREE.Vector3(offset.x || 0, offset.y || 0, offset.z || 0).applyQuaternion(quaternion))
        .addScaledVector(new THREE.Vector3(0, 0, 1).applyQuaternion(quaternion).normalize(), this.cfg.homePerchForward || 0.09)
        .addScaledVector(new THREE.Vector3(0, 1, 0).applyQuaternion(quaternion).normalize(), this.cfg.homePerchLift || 0.025);

      this.homePerch = {
        type: "home",
        position,
        normal: new THREE.Vector3(0, 0, 1).applyQuaternion(quaternion).normalize(),
        up: new THREE.Vector3(0, 1, 0).applyQuaternion(quaternion).normalize(),
        quaternion
      };
      return this.homePerch;
    }

    const box = new THREE.Box3().setFromObject(this.centralModel);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const position = center.clone().add(new THREE.Vector3(0, size.y * 0.18 + 0.18, size.z * 0.06));
    this.homePerch = {
      type: "home",
      position,
      normal: new THREE.Vector3(0, 0, 1),
      up: new THREE.Vector3(0, 1, 0),
      quaternion: new THREE.Quaternion()
    };
    return this.homePerch;
  }

  getHomePerchTarget() {
    return this.refreshHomePerch();
  }

  getActivePerchTarget(coverWorldData) {
    if (!this.currentPerchTarget) return null;
    if (this.currentPerchTarget.type === "home") return this.getHomePerchTarget();
    if (this.currentPerchTarget.type === "cover" && typeof this.currentPerchTarget.coverIndex === "number") {
      return this.getCoverPerchTarget(this.currentPerchTarget.coverIndex, coverWorldData);
    }
    return null;
  }

  getPagePreference(entry) {
    const id = entry?.item?.id || entry?.id || this.inputState.currentHoveredId || "";
    const preferences = this.cfg.pagePreferences || {};
    return THREE.MathUtils.clamp(Number(preferences[id] || 0), -1, 1);
  }

  detectOpenPanelSignal() {
    const selectors = [
      ".panel.is-open",
      ".page-panel.is-open",
      ".overlay.is-open",
      ".lightbox.is-open",
      ".modal.is-open",
      "[data-panel-open='true']",
      "[data-open='true']",
      ".experience-ui .is-open"
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (!element) continue;
      const style = window.getComputedStyle(element);
      if (style.display !== "none" && style.visibility !== "hidden" && style.opacity !== "0") return 1;
    }

    return 0;
  }

  getCompanionTarget() {
    const pointerWorld = this.inputState.pointerWorld;
    if (!pointerWorld) return null;
    const toCamera = this.temp.a.copy(this.camera.position).sub(pointerWorld).normalize();
    return new THREE.Vector3()
      .copy(pointerWorld)
      .addScaledVector(toCamera, this.cfg.companionDistance || 0.36)
      .add(new THREE.Vector3(0, this.cfg.companionLift || 0.08, 0));
  }

  getCursorAttractionTarget() {
    const pointerWorld = this.inputState.pointerWorld;
    if (!pointerWorld) return null;

    const toCamera = this.temp.a.copy(this.camera.position).sub(pointerWorld);
    if (toCamera.lengthSq() <= 0.0001) {
      toCamera.set(0, 0, 1);
    } else {
      toCamera.normalize();
    }

    return new THREE.Vector3()
      .copy(pointerWorld)
      .addScaledVector(toCamera, this.cfg.cursorTargetPullBack || 0.10)
      .add(new THREE.Vector3(0, this.cfg.cursorTargetLift || 0.03, 0));
  }

  getCursorInteractionActionKey() {
    if (this.getAction("feed")) return "feed";
    if (this.getAction("perch")) return "perch";
    return this.getPatrolFlightAction();
  }

  clearCursorAttraction() {
    this.cursorCuriousUntil = 0;
    this.cursorInteractUntil = 0;
    this.cursorInteractionStarted = false;
    this.cursorInteractionActionKey = "";
  }

  maybeStartCursorAttraction(delta, elapsed, options = {}) {
    const {
      hasVoid = false,
      hoveredEntry = null,
      coverTarget = null,
      wantsHome = false,
      wantsCompanion = false,
      shouldFlee = false,
      cursorTarget = null
    } = options;

    if (this.mode !== "patrol") return false;
    if (hasVoid || hoveredEntry || coverTarget || wantsHome || wantsCompanion || shouldFlee) return false;
    if (!cursorTarget) return false;
    if (elapsed < this.nextCursorAttractAt) return false;
    if (this.trust < (this.cfg.cursorTrustThreshold || 0.20)) return false;
    if (this.inputState.aggression > (this.cfg.cursorAggressionMax || 0.42)) return false;

    const distance = this.root.position.distanceTo(cursorTarget);
    if (distance > (this.cfg.cursorAttractDistance || 0.92)) return false;

    const baseChance = this.cfg.cursorAttractChancePerSecond || 0.20;
    const pointerBias = 0.65 + clamp01(this.inputState.pointerInfluence + this.inputState.pointerMotion * 0.45) * 0.75;
    const trustBias = 0.75 + this.trust * 0.55;
    const chance = baseChance * pointerBias * trustBias * Math.max(0.001, delta);

    if (Math.random() >= chance) return false;

    this.mode = "cursorCurious";
    this.cursorCuriousUntil = elapsed + randomFromRange(
      this.cfg.cursorAttractMinDuration || 1.8,
      this.cfg.cursorAttractMaxDuration || 3.6
    );
    this.cursorInteractUntil = 0;
    this.cursorInteractionStarted = false;
    this.cursorInteractionActionKey = "";
    this.nextCursorAttractAt = elapsed + randomFromRange(
      this.cfg.cursorAttractCooldownMin || 2.4,
      this.cfg.cursorAttractCooldownMax || 5.8
    );
    return true;
  }

  getFleeTarget() {
    const pointerWorld = this.inputState.pointerWorld;
    if (!pointerWorld) return null;
    const away = this.temp.b.copy(this.root.position).sub(pointerWorld);
    if (away.lengthSq() <= 0.0001) away.set(0, 0.2, 1);
    away.normalize();
    return this.clampPointNearCenter(
      new THREE.Vector3()
        .copy(this.root.position)
        .addScaledVector(away, 0.82)
        .add(new THREE.Vector3(0, 0.18, 0))
    );
  }

  updateGenerativeNeeds(context) {
    const { delta, elapsed, hoveredEntry, hoveredIndex, coverWorldData, audioReactiveLevel = 0 } = context;
    this.ensureResidueSystem(coverWorldData?.length || 0);

    const hoveredId = hoveredEntry?.item?.id || hoveredEntry?.id || "";
    this.inputState.currentHoveredId = hoveredId;
    if (hoveredId) this.inputState.lastHoveredId = hoveredId;

    const panelSignal = this.detectOpenPanelSignal();
    this.inputState.panelSignal = panelSignal;

    this.inputState.pointerInfluence = clamp01(this.inputState.pointerInfluence - delta * 0.65);
    this.inputState.gentleBias = clamp01(this.inputState.gentleBias - delta * 0.45);
    this.inputState.aggression = clamp01(this.inputState.aggression - delta * 0.42);
    this.inputState.wheelImpulse = Math.max(0, this.inputState.wheelImpulse - delta * 1.6);
    this.inputState.pointerMotion = Math.max(0, this.inputState.pointerMotion - delta * 0.85);

    const hoverSignal = hoveredEntry ? this.cfg.signalHoverBoost || 0.42 : 0;
    const pointerSignal = (this.inputState.pointerInfluence + this.inputState.pointerMotion * 0.7) * (this.cfg.signalPointerBoost || 0.22);
    const wheelSignal = this.inputState.wheelImpulse * (this.cfg.signalWheelBoost || 0.08);
    const panelFeed = panelSignal * (this.cfg.signalPanelBoost || 0.12);
    const audioFeed = clamp01(Number(audioReactiveLevel) || 0) * (this.cfg.signalAudioBoost || 0.18);
    const pagePreference = this.getPagePreference(hoveredEntry);
    const beautyMultiplier = 1 + Math.max(0, pagePreference) * 0.35;
    const signalGain = (hoverSignal * beautyMultiplier) + pointerSignal + wheelSignal + panelFeed + audioFeed;

    this.signalLevel = clamp01(this.signalLevel + signalGain * delta - (this.cfg.signalDecayPerSecond || 0.07) * delta);

    const moving = this.velocity.lengthSq() > 0.0025 || this.mode === "approachCover" || this.mode === "approachHome" || this.mode === "approachVoid" || this.mode === "flee" || this.mode === "companion";
    if (moving) {
      this.fatigue = clamp01(this.fatigue + delta * ((this.cfg.fatigueFlightPerSecond || 0.05) + signalGain * (this.cfg.fatigueStimulusPerSecond || 0.042)));
    }
    if (this.mode === "restHome") {
      this.fatigue = clamp01(this.fatigue - delta * (this.cfg.fatigueRestRecoveryPerSecond || 0.22));
      this.trust = clamp01(this.trust + delta * ((this.cfg.trustGainPerSecond || 0.12) * 0.75));
      this.corruption = clamp01(this.corruption - delta * (this.cfg.corruptionRestRecoveryPerSecond || 0.17));
      this.signalLevel = clamp01(this.signalLevel + delta * 0.04);
      this.vitality = clamp01(this.vitality + delta * this.cfg.vitalityRecoveryPerSecond * 1.5);
    } else {
      this.vitality = clamp01(this.vitality + signalGain * delta * this.cfg.vitalityRecoveryPerSecond * 0.55);
      if (this.inputState.gentleBias > 0.04) {
        this.trust = clamp01(this.trust + delta * (this.cfg.trustGainPerSecond || 0.12) * this.inputState.gentleBias);
      }
      if (this.inputState.aggression > 0.05) {
        this.trust = clamp01(this.trust - delta * (this.cfg.trustLossPerSecond || 0.34) * this.inputState.aggression);
      }
    }

    if (this.voidState?.active || this.mode === "inspectVoid" || this.mode === "approachVoid") {
      this.corruption = clamp01(this.corruption + delta * (this.cfg.corruptionGainPerSecond || 0.16));
    } else {
      this.corruption = clamp01(this.corruption - delta * 0.02);
    }

    if (hoveredEntry || panelSignal || this.inputState.pointerInfluence > 0.12) {
      this.fragmentCharge += delta * (this.cfg.fragmentCollectPerSecond || 0.16) * (1 + Math.max(0, pagePreference) * 0.6);
    }
    this.fragmentCharge = Math.max(0, Math.min(4, this.fragmentCharge));

    const lowSignal = clamp01((0.52 - this.signalLevel) / 0.52);
    const lowVitality = clamp01((0.54 - this.vitality) / 0.54);
    this.searchUrgency = clamp01(lowSignal * 0.65 + lowVitality * 0.35 + this.corruption * 0.18);

    this.updateResidueVisuals(delta, coverWorldData, hoveredIndex);
  }

  updateResidueVisuals(delta, coverWorldData, hoveredIndex) {
    if (!Array.isArray(coverWorldData) || !this.residueSprites.length) return;
    for (let i = 0; i < this.residueSprites.length; i += 1) {
      const cover = coverWorldData[i];
      const sprite = this.residueSprites[i];
      if (!cover || !sprite) continue;

      const bias = i === 2 ? 1.22 : (i === 0 ? 0.86 : 0.96);
      const cleanse = hoveredIndex === i || (this.currentPerchTarget?.type === "cover" && this.currentPerchTarget.coverIndex === i);
      const deltaValue = cleanse
        ? -(this.cfg.residueCleansePerSecond || 0.26)
        : (this.cfg.residueIncreasePerSecond || 0.04) * bias;

      this.coverResidue[i] = clamp01((this.coverResidue[i] || 0) + delta * deltaValue);

      sprite.visible = this.visible && cover.visible;
      sprite.position.copy(cover.position).addScaledVector(cover.up, this.coverSize.height * 0.44 + 0.03);
      sprite.position.addScaledVector(cover.right, Math.sin(this.getElapsed() * 0.7 + i) * 0.02);
      const scale = THREE.MathUtils.lerp(this.cfg.residueScaleMin || 0.1, this.cfg.residueScaleMax || 0.26, this.coverResidue[i]);
      sprite.scale.setScalar(scale);
      sprite.material.opacity = this.coverResidue[i] * (this.cfg.residueOpacityMax || 0.55) * (cleanse ? 0.45 : 1.0);
    }
  }

  depositFragmentAtHome(homeTarget) {
    if (!homeTarget) return;
    if (this.nests.length >= this.cfg.nestMax) return;
    if (this.fragmentCharge < (this.cfg.fragmentDepositThreshold || 1.0)) return;
    if (this.getElapsed() - this.lastNestDropAt < this.cfg.nestDepositDelay) return;

    const rotation = new THREE.Euler().setFromQuaternion(homeTarget.quaternion || new THREE.Quaternion());
    const position = homeTarget.position.clone()
      .addScaledVector(homeTarget.up || new THREE.Vector3(0, 1, 0), 0.01)
      .addScaledVector(homeTarget.normal || new THREE.Vector3(0, 0, 1), 0.01);

    this.spawnNestAt(position, rotation, 0.07 + Math.random() * 0.05, "home", null);
    this.fragmentCharge = Math.max(0, this.fragmentCharge - (this.cfg.fragmentDepositThreshold || 1.0));
    this.lastNestDropAt = this.getElapsed();
    this.saveState(true);
  }

  extractPointSamples(model, limit = 960) {
    model.updateMatrixWorld(true);
    this.visualRoot.updateMatrixWorld(true);

    const meshes = [];
    model.traverse((child) => {
      if (child.isMesh && child.geometry && child.geometry.attributes.position) {
        meshes.push(child);
      }
    });

    if (!meshes.length) return [];

    const totalVerts = meshes.reduce((sum, mesh) => sum + mesh.geometry.attributes.position.count, 0);
    const samples = [];

    meshes.forEach((mesh) => {
      const pos = mesh.geometry.attributes.position;
      const nor = mesh.geometry.attributes.normal;
      const meshTarget = Math.max(24, Math.round(limit * (pos.count / Math.max(1, totalVerts))));
      const step = Math.max(1, Math.floor(pos.count / meshTarget));

      for (let i = 0; i < pos.count; i += step) {
        samples.push({
          mesh,
          vertexIndex: i,
          localPosition: new THREE.Vector3().fromBufferAttribute(pos, i),
          localNormal: nor ? new THREE.Vector3().fromBufferAttribute(nor, i).normalize() : new THREE.Vector3(0, 1, 0)
        });
      }
    });

    return samples;
  }

  refreshPointCloudGeometry(points, samples, expand = 0) {
    if (!points || !samples?.length) return;

    this.modelRoot?.updateMatrixWorld?.(true);
    this.visualRoot.updateMatrixWorld(true);

    const positionAttr = points.geometry.attributes.position;
    const normalAttr = points.geometry.attributes.aNormal;
    const positions = positionAttr.array;
    const normals = normalAttr.array;

    const visualInverse = new THREE.Matrix4().copy(this.visualRoot.matrixWorld).invert();
    const worldToVisualNormal = new THREE.Matrix3().getNormalMatrix(visualInverse);
    const worldNormalMatrixCache = new Map();

    const getWorldNormalMatrix = (mesh) => {
      let normalMatrix = worldNormalMatrixCache.get(mesh.uuid);
      if (!normalMatrix) {
        normalMatrix = new THREE.Matrix3().getNormalMatrix(mesh.matrixWorld);
        worldNormalMatrixCache.set(mesh.uuid, normalMatrix);
      }
      return normalMatrix;
    };

    for (let i = 0; i < samples.length; i += 1) {
      const sample = samples[i];
      const { mesh, vertexIndex, localPosition, localNormal } = sample;

      const visualPos = this.temp.a.copy(localPosition);
      applyBoneTransformToVector(mesh, vertexIndex, visualPos);
      visualPos.applyMatrix4(mesh.matrixWorld).applyMatrix4(visualInverse);

      let visualNormal = this.temp.b;
      if (mesh.isSkinnedMesh) {
        const normalTip = this.temp.c.copy(localPosition).addScaledVector(localNormal, 0.01);
        applyBoneTransformToVector(mesh, vertexIndex, normalTip);
        normalTip.applyMatrix4(mesh.matrixWorld).applyMatrix4(visualInverse);
        visualNormal.copy(normalTip).sub(visualPos);
        if (visualNormal.lengthSq() <= 0.0000001) visualNormal.copy(localNormal);
        else visualNormal.normalize();
      } else {
        visualNormal.copy(localNormal)
          .applyMatrix3(getWorldNormalMatrix(mesh))
          .normalize()
          .applyMatrix3(worldToVisualNormal)
          .normalize();
      }

      if (expand) visualPos.addScaledVector(visualNormal, expand);

      const base = i * 3;
      positions[base + 0] = visualPos.x;
      positions[base + 1] = visualPos.y;
      positions[base + 2] = visualPos.z;
      normals[base + 0] = visualNormal.x;
      normals[base + 1] = visualNormal.y;
      normals[base + 2] = visualNormal.z;
    }

    positionAttr.needsUpdate = true;
    normalAttr.needsUpdate = true;
  }

  updateAnimatedShells() {
    if (this.binaryShell && this.binarySamples.length) {
      this.refreshPointCloudGeometry(this.binaryShell, this.binarySamples, 0);
    }
    if (this.outlineShell && this.outlineSamples.length) {
      this.refreshPointCloudGeometry(this.outlineShell, this.outlineSamples, this.cfg.outlineExpand || 0.018);
    }
  }

  initVoidVisuals() {
    const count = this.cfg.voidParticleCount;
    const positions = new Float32Array(count * 3);
    const aT = new Float32Array(count);
    const aSeed = new Float32Array(count);
    const aSize = new Float32Array(count);

    for (let i = 0; i < count; i += 1) {
      aT[i] = Math.random();
      aSeed[i] = Math.random();
      aSize[i] = 0.62 + Math.random() * 0.62;
      this.voidSeed.push({
        angle: Math.random() * Math.PI * 2,
        radius: 0.18 + Math.random() * 0.78,
        t: Math.random(),
        spin: 1.0 + Math.random() * 2.2,
        wobble: Math.random() * Math.PI * 2
      });
    }

    this.voidGeometry = new THREE.BufferGeometry();
    this.voidGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    this.voidGeometry.setAttribute("aT", new THREE.BufferAttribute(aT, 1));
    this.voidGeometry.setAttribute("aSeed", new THREE.BufferAttribute(aSeed, 1));
    this.voidGeometry.setAttribute("aSize", new THREE.BufferAttribute(aSize, 1));

    this.voidMaterial = createVoidMaterial(this.glyphAtlas, this.palette);
    this.voidPoints = new THREE.Points(this.voidGeometry, this.voidMaterial);
    this.voidPoints.visible = false;
    this.voidPoints.renderOrder = 13;
    this.voidGroup.add(this.voidPoints);

    this.voidCore = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.42, 1, 1), createCoreDiscMaterial());
    this.voidCore.visible = false;
    this.voidCore.renderOrder = 12;
    this.voidGroup.add(this.voidCore);
  }

  spawnNestAt(position, rotation, scale = 0.14, type = "ground", coverIndex = null, forcedId = "") {
    if (this.nests.length >= this.cfg.nestMax) return null;

    const nest = new THREE.Mesh(
      new THREE.PlaneGeometry(0.32, 0.32, 1, 1),
      new THREE.MeshBasicMaterial({
        map: this.messTexture,
        transparent: true,
        opacity: 0.58,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        color: new THREE.Color("#d6efff")
      })
    );
    nest.position.copy(position);
    nest.rotation.copy(rotation);
    nest.scale.setScalar(scale);
    nest.renderOrder = 4;
    this.nestGroup.add(nest);

    const entry = {
      id: forcedId || `nest_${Date.now()}_${Math.floor(Math.random() * 9999)}`,
      mesh: nest,
      position: nest.position.clone(),
      rotation: nest.rotation.clone(),
      scale,
      type,
      coverIndex
    };

    this.nests.push(entry);
    return entry;
  }

  maybeDropNest(target, coverIndex = null) {
    if (this.nests.length >= this.cfg.nestMax) return;
    if (this.getElapsed() - this.lastNestDropAt < this.cfg.nestDepositDelay) return;
    if (Math.random() > this.cfg.nestChancePerPerch) return;

    const rotation = new THREE.Euler(-Math.PI / 2, Math.random() * Math.PI, 0);
    const position = target.clone();
    position.y += 0.01;
    this.spawnNestAt(position, rotation, 0.08 + Math.random() * 0.05, "cover", coverIndex);
    this.lastNestDropAt = this.getElapsed();
    this.saveState(true);
  }

  setVisibility(visible) {
    this.visible = Boolean(visible);
    this.root.visible = this.visible;
    this.nestGroup.visible = this.visible;
    this.voidGroup.visible = this.visible;
    this.residueGroup.visible = this.visible;
    if (this.trail?.points) this.trail.points.visible = this.visible;
    this.setDebugOverlayVisible(this.visible);
  }

  worldPointComfortablyVisible(world, margin = this.cfg.patrolViewMargin) {
    this.temp.screen.copy(world).project(this.camera);
    return (
      this.temp.screen.z > -1 &&
      this.temp.screen.z < 1 &&
      Math.abs(this.temp.screen.x) <= margin &&
      this.temp.screen.y >= (this.cfg.patrolViewYMin ?? -margin) &&
      this.temp.screen.y <= (this.cfg.patrolViewYMax ?? margin)
    );
  }

  clampPointNearCenter(point) {
    const offset = this.temp.b.copy(point).sub(this.orbitCenter);
    const horizontal = this.temp.c.set(offset.x, 0, offset.z);
    const horizontalLen = horizontal.length();

    if (horizontalLen > this.cfg.patrolRadiusMax) {
      horizontal.setLength(this.cfg.patrolRadiusMax);
    } else if (horizontalLen < this.cfg.patrolRadiusMin) {
      if (horizontalLen < 0.0001) horizontal.set(0, 0, this.cfg.patrolRadiusMin);
      else horizontal.setLength(this.cfg.patrolRadiusMin);
    }

    point.x = this.orbitCenter.x + horizontal.x;
    point.z = this.orbitCenter.z + horizontal.z;
    point.y = THREE.MathUtils.clamp(point.y, this.orbitCenter.y + this.cfg.patrolHeightMin, this.orbitCenter.y + this.cfg.patrolHeightMax);
    return point;
  }

  getRecoveryPatrolPoint() {
    const camForward = this.temp.a.set(0, 0, -1).applyQuaternion(this.camera.quaternion).normalize();
    const camRight = this.temp.b.set(1, 0, 0).applyQuaternion(this.camera.quaternion).normalize();

    const p = new THREE.Vector3()
      .copy(this.orbitCenter)
      .addScaledVector(camForward, 0.46)
      .addScaledVector(camRight, THREE.MathUtils.clamp(this.temp.screen.x * 0.42, -0.34, 0.34));
    p.y = this.orbitCenter.y + 0.46;
    return this.clampPointNearCenter(p);
  }

  getFacingDirection(targetPoint = null) {
    const velocityDir = this.temp.c.copy(this.velocity);
    const hasVelocity = velocityDir.lengthSq() > 0.00004;
    if (hasVelocity) velocityDir.normalize();

    const targetDir = this.temp.d;
    if (targetPoint) targetDir.copy(targetPoint).sub(this.root.position);
    else targetDir.copy(this.forward);
    if (targetDir.lengthSq() > 0.00004) targetDir.normalize();
    else targetDir.copy(this.forward);

    const facing = this.temp.e.copy(targetDir).multiplyScalar(this.cfg.headingTargetBlend);
    if (hasVelocity) facing.addScaledVector(velocityDir, this.cfg.headingVelocityBlend);

    if (facing.lengthSq() <= 0.00004) facing.copy(targetDir);
    return facing.normalize();
  }

  getTravelFacingDirection(targetPoint = null) {
    const travelDir = this.temp.b.copy(this.frameMotionDirection);
    if (travelDir.lengthSq() > 0.00004) {
      travelDir.normalize();
      return travelDir;
    }

    const velocityDir = this.temp.c.copy(this.velocity);
    if (velocityDir.lengthSq() > 0.00004) {
      velocityDir.normalize();
      return velocityDir;
    }

    if (targetPoint) {
      const targetDir = this.temp.d.copy(targetPoint).sub(this.root.position);
      if (targetDir.lengthSq() > 0.00004) {
        targetDir.normalize();
        return targetDir;
      }
    }

    return this.getFacingDirection(targetPoint);
  }

  pickNextPatrolPoint(force = false) {
    const elapsed = this.getElapsed();
    const repickScale = THREE.MathUtils.lerp(1.0, 0.55, this.searchUrgency || 0);
    this.nextPatrolDecisionAt = elapsed + randomFromRange(this.cfg.patrolRepickMin * repickScale, this.cfg.patrolRepickMax * repickScale);

    const camForward = this.temp.a.set(0, 0, -1).applyQuaternion(this.camera.quaternion);
    camForward.y = 0;
    if (camForward.lengthSq() < 0.0001) camForward.set(0, 0, -1);
    camForward.normalize();

    const camRight = this.temp.b.set(1, 0, 0).applyQuaternion(this.camera.quaternion);
    camRight.y = 0;
    if (camRight.lengthSq() < 0.0001) camRight.set(1, 0, 0);
    camRight.normalize();

    let candidate = null;
    for (let i = 0; i < 28; i += 1) {
      const front = randomFromRange(this.cfg.patrolFrontMin, this.cfg.patrolFrontMax);
      const side = randomFromRange(-this.cfg.patrolSideSpan, this.cfg.patrolSideSpan);
      const verticalT = Math.pow(Math.random(), 1.65);
      const y = this.orbitCenter.y + THREE.MathUtils.lerp(this.cfg.patrolHeightMin, this.cfg.patrolHeightMax, verticalT);

      const p = new THREE.Vector3()
        .copy(this.orbitCenter)
        .addScaledVector(camForward, front)
        .addScaledVector(camRight, side);

      p.y = y;
      this.clampPointNearCenter(p);

      const centerBlend = this.temp.c.copy(this.orbitCenter).lerp(p, 1.0 - this.cfg.patrolCenterPull);
      p.copy(centerBlend);

      if (this.worldPointComfortablyVisible(p) || i === 27) {
        candidate = p;
        break;
      }
    }

    if (!candidate) candidate = this.getRecoveryPatrolPoint();

    this.currentPatrolAnchor.copy(candidate);
    if (force) this.root.position.copy(candidate);
  }

  getCoverPerchTarget(index, coverWorldData) {
    const cover = coverWorldData[index];
    if (!cover) return null;

    const normal = this.temp.c.copy(cover.right).cross(cover.up).normalize();
    const toCamera = this.temp.d.copy(this.camera.position).sub(cover.position);
    if (normal.dot(toCamera) < 0) normal.multiplyScalar(-1);

    const lift = this.coverSize.height * 0.5 + this.cfg.coverPerchLift;
    const position = new THREE.Vector3()
      .copy(cover.position)
      .addScaledVector(cover.up, lift)
      .addScaledVector(normal, this.cfg.coverPerchForward);

    return { position, normal, up: cover.up.clone() };
  }

  getVoidInspectTarget() {
    if (!this.voidState?.active) return null;

    const toCamera = this.temp.a.copy(this.camera.position).sub(this.voidState.position).normalize();
    const inspectPos = new THREE.Vector3()
      .copy(this.voidState.position)
      .addScaledVector(toCamera, this.cfg.voidHoverRadius)
      .add(new THREE.Vector3(0, 0.04, 0));

    return { position: inspectPos, lookAt: this.voidState.position.clone() };
  }

  update(context) {
    if (!this.ready) return;

    const {
      delta,
      elapsed,
      introActive,
      introComplete,
      hoveredEntry,
      hoveredIndex,
      coverWorldData,
      activeEntry = null,
      audioReactiveLevel = 0,
      currentProgress = 0
    } = context;

    const sceneVisible = introComplete && !introActive;
    this.setVisibility(sceneVisible);
    if (!sceneVisible) return;

    this.lastDelta = Math.max(1 / 240, delta || 1 / 60);

    this.temp.center.copy(this.root.position);

    if (this.mixer) this.mixer.update(delta);
    this.updateAnimatedShells();
    this.refreshHomePerch();

    this.updateGenerativeNeeds({
      delta,
      elapsed,
      hoveredEntry,
      hoveredIndex,
      coverWorldData,
      activeEntry,
      audioReactiveLevel,
      currentProgress
    });

    const hungry = this.isHungry(elapsed);
    if (hungry && !this.voidState?.active && this.mode !== "restHome") {
      this.vitality = clamp01(this.vitality - delta * this.cfg.vitalityDrainPerSecond);
    }

    const motion = clamp01((this.velocity.length() / Math.max(0.0001, this.cfg.flySpeed)) * (this.cfg.shellMotionStrength || 1.0));
    const sadness = clamp01((1 - this.signalLevel) * 0.65 + this.fatigue * 0.35);
    const corruptionPulse = this.corruption * (0.18 + Math.abs(Math.sin(elapsed * 7.0)) * 0.22);
    const brightnessFactor = Math.max(
      0.82,
      0.72 + this.vitality * 0.34 + this.signalLevel * 0.48 - this.fatigue * 0.18 + corruptionPulse
    );

    if (this.binaryMaterial) {
      this.binaryMaterial.uniforms.uTime.value = elapsed;
      this.binaryMaterial.uniforms.uSadness.value = sadness;
      this.binaryMaterial.uniforms.uAlphaBoost.value = 0.82 + this.signalLevel * 0.36 + this.trust * 0.12;
      this.binaryMaterial.uniforms.uMotion.value = motion + this.searchUrgency * 0.12 + this.corruption * 0.08;
      this.binaryMaterial.uniforms.uBrightness.value = (this.cfg.binaryBrightness || 1.42) * brightnessFactor;
    }

    if (this.outlineMaterial) {
      this.outlineMaterial.uniforms.uTime.value = elapsed;
      this.outlineMaterial.uniforms.uSadness.value = sadness;
      this.outlineMaterial.uniforms.uMotion.value = motion + this.corruption * 0.08;
      this.outlineMaterial.uniforms.uAlpha.value = 0.72 + this.signalLevel * 0.28;
      this.outlineMaterial.uniforms.uBrightness.value = (this.cfg.outlineBrightness || 2.05) * (0.85 + this.trust * 0.2 + this.corruption * 0.12);
    }

    this.updateVoidVisual(elapsed, delta);
    this.updateNestAnimations(elapsed, coverWorldData);
    this.updateStateAndMotion(delta, elapsed, hoveredEntry, hoveredIndex, coverWorldData);
    this.updateFrameMotionDirection();
    this.updateFlightPose(delta);
    this.updateTrail(delta, elapsed);

    if (this.hitProxy) {
      this.hitProxy.position.set(0, 0, 0);
    }

    this.updateDebugOverlay(elapsed);
    this.saveState(false);
  }

  updateStateAndMotion(delta, elapsed, hoveredEntry, hoveredIndex, coverWorldData) {
    const hasVoid = this.voidState?.active;
    const homeTarget = this.getHomePerchTarget();
    const coverTarget = (!hasVoid && hoveredIndex >= 0) ? this.getCoverPerchTarget(hoveredIndex, coverWorldData) : null;
    const activePerchTarget = this.getActivePerchTarget(coverWorldData);
    const voidTarget = hasVoid ? this.getVoidInspectTarget() : null;
    const companionTarget = !hasVoid && !coverTarget ? this.getCompanionTarget() : null;
    const cursorTarget = !hasVoid && !coverTarget ? this.getCursorAttractionTarget() : null;
    const fleeTarget = this.getFleeTarget();

    const wantsHome = Boolean(
      homeTarget
      && (this.fatigue >= (this.cfg.homeRestThreshold || 0.52)
        || this.corruption >= 0.48
        || this.vitality <= 0.42
        || (this.fragmentCharge >= (this.cfg.fragmentDepositThreshold || 1.0) && this.signalLevel <= 0.62))
    );
    const wantsCompanion = Boolean(
      companionTarget
      && this.trust >= (this.cfg.companionTrustThreshold || 0.42)
      && this.inputState.aggression < 0.34
      && this.fatigue < 0.72
      && !wantsHome
    );
    const shouldFlee = Boolean(
      fleeTarget
      && this.inputState.aggression > 0.55
      && this.trust < 0.72
    );
    const shouldAvoidVoid = this.corruption > 0.82 || wantsHome;

    if (this.mode === "cursorCurious" || this.mode === "cursorInteract") {
      const cursorStillValid = Boolean(
        cursorTarget
        && !hasVoid
        && !coverTarget
        && !wantsHome
        && !shouldFlee
        && elapsed <= (this.mode === "cursorInteract" ? this.cursorInteractUntil : this.cursorCuriousUntil)
      );

      if (!cursorStillValid) {
        this.clearCursorAttraction();
        if (this.mode !== "takeoff" && this.mode !== "inspectVoid") {
          this.mode = "patrol";
        }
      }
    }

    this.maybeStartCursorAttraction(delta, elapsed, {
      hasVoid,
      hoveredEntry,
      coverTarget,
      wantsHome,
      wantsCompanion,
      shouldFlee,
      cursorTarget
    });

    const cursorCuriousActive = this.mode === "cursorCurious"
      && Boolean(cursorTarget)
      && elapsed <= this.cursorCuriousUntil;
    const cursorInteractActive = this.mode === "cursorInteract"
      && Boolean(cursorTarget)
      && elapsed <= this.cursorInteractUntil;

    if (hasVoid && shouldAvoidVoid) {
      if (this.mode === "landed" || this.mode === "landing" || this.mode === "restHome") {
        this.startTakeoff(elapsed);
      } else if (this.mode !== "takeoff") {
        this.mode = wantsHome ? "approachHome" : "patrol";
      }
    } else if (hasVoid) {
      if (this.mode === "landed" || this.mode === "landing" || this.mode === "restHome") {
        this.startTakeoff(elapsed);
      }
      if (this.mode !== "takeoff" && this.mode !== "backflip" && this.mode !== "inspectVoid") {
        this.mode = "approachVoid";
      }
    } else if (shouldFlee) {
      if (this.mode === "landed" || this.mode === "landing" || this.mode === "restHome") {
        this.startTakeoff(elapsed);
      }
      if (this.mode !== "takeoff") {
        this.mode = "flee";
      }
    } else if (wantsHome) {
      if ((this.mode === "landed" || this.mode === "landing") && this.currentPerchTarget?.type !== "home") {
        this.startTakeoff(elapsed);
      } else if (this.mode !== "takeoff" && this.mode !== "backflip" && this.mode !== "inspectVoid") {
        this.mode = this.currentPerchTarget?.type === "home" && this.perched ? "restHome" : "approachHome";
      }
    } else if (coverTarget) {
      this.hoverClock += delta;
      if ((this.mode === "restHome" || this.mode === "landed") && this.currentPerchTarget?.type === "home" && this.fatigue <= (this.cfg.homeLeaveThreshold || 0.34)) {
        this.startTakeoff(elapsed);
      }
      if (this.mode !== "takeoff" && this.hoverClock >= this.cfg.hoverPerchDelay) {
        if (this.mode !== "landed" && this.mode !== "landing" && this.mode !== "restHome") this.mode = "approachCover";
      }
    } else if (wantsCompanion) {
      this.hoverClock = 0;
      if ((this.mode === "landed" || this.mode === "landing" || this.mode === "restHome") && this.currentPerchTarget) {
        this.startTakeoff(elapsed);
      }
      if (this.mode !== "takeoff" && this.mode !== "backflip" && this.mode !== "inspectVoid") {
        this.mode = "companion";
      }
    } else if (cursorCuriousActive || cursorInteractActive) {
      this.hoverClock = 0;
      if ((this.mode === "landed" || this.mode === "landing" || this.mode === "restHome") && this.currentPerchTarget) {
        this.startTakeoff(elapsed);
      }
      if (this.mode !== "takeoff" && this.mode !== "backflip" && this.mode !== "inspectVoid") {
        this.mode = cursorInteractActive ? "cursorInteract" : "cursorCurious";
      }
    } else {
      this.hoverClock = 0;
      if ((this.mode === "landed" || this.mode === "landing") && !hasVoid && this.currentPerchTarget?.type !== "home") {
        this.startTakeoff(elapsed);
      }
      if (!hasVoid && this.mode !== "takeoff" && this.mode !== "backflip" && this.mode !== "inspectVoid" && this.mode !== "restHome") {
        this.mode = "patrol";
      }
      if (this.mode === "restHome" && this.fatigue <= (this.cfg.homeLeaveThreshold || 0.34) && this.corruption <= 0.16 && this.fragmentCharge < (this.cfg.fragmentDepositThreshold || 1.0)) {
        this.mode = "patrol";
      }
    }

    if (this.mode === "takeoff") {
      this.updateTakeoffMotion(elapsed);
      return;
    }

    if (this.mode === "backflip") {
      this.velocity.set(0, 0, 0);
      this.recoveryAssist = false;

      if (this.backflipState) {
        this.root.position.copy(this.backflipState.position);
        this.root.quaternion.copy(this.backflipState.quaternion);
        this.forward.copy(this.backflipState.forward);
        this.orientationUp.copy(this.backflipState.up);
        this.smoothedHeading.copy(this.backflipState.forward);
        this.frameMotionDirection.copy(this.backflipState.forward);
      }

      const backflipAction = this.getAction("backflip");
      const guardDelta = Math.max(0.035, this.lastDelta * 2.0);
      const clipDuration = this.backflipState?.duration
        || backflipAction?.getClip?.().duration
        || this.actionDurations.get("backflip")
        || 0;

      if (backflipAction && clipDuration > 0 && backflipAction.time >= Math.max(0, clipDuration - guardDelta)) {
        this.finishBackflip();
      }
      return;
    }

    if (this.mode === "inspectVoid" && voidTarget) {
      this.updateVoidInspect(delta, elapsed, voidTarget);
      return;
    }

    if ((this.mode === "landed" || this.mode === "restHome") && activePerchTarget) {
      this.perched = true;
      this.root.position.lerp(activePerchTarget.position, this.currentPerchTarget?.type === "home" ? (this.cfg.homePerchLerp || 0.16) : this.cfg.coverPerchLerp);
      this.lookAtPoint(
        activePerchTarget.position.clone().add(activePerchTarget.normal || new THREE.Vector3(0, 0, 1)),
        activePerchTarget.up || new THREE.Vector3(0, 1, 0),
        this.currentPerchTarget?.type === "home" ? 0.08 : 0.12
      );
      this.velocity.multiplyScalar(0.78);
      if (this.currentActionKey !== "perch") this.playLoop("perch");

      if (this.currentPerchTarget?.type === "home") {
        this.depositFragmentAtHome(activePerchTarget);
      }
      return;
    }

    if (this.mode === "approachHome" && homeTarget) {
      const distance = this.root.position.distanceTo(homeTarget.position);
      if (distance <= (this.cfg.homeApproachDistance || this.cfg.landTriggerDistance || 0.12)) {
        this.currentPerchTarget = { type: "home" };
        this.mode = "landing";
        this.perched = false;
        this.playOnce("land", "perch");
      }
      this.moveToward(delta, homeTarget.position, this.getPatrolFlightSpeed(elapsed) * 0.88);
      this.lookAtDirection(this.getTravelFacingDirection(homeTarget.position), this.cfg.turnLerpFast);
      if (this.currentActionKey !== "land" && this.currentActionKey !== "perch") {
        this.playLoop(this.getPatrolFlightAction());
      }
      return;
    }

    if (this.mode === "approachCover" && coverTarget) {
      const distance = this.root.position.distanceTo(coverTarget.position);
      if (distance <= this.cfg.landTriggerDistance) {
        this.currentPerchTarget = { type: "cover", coverIndex: hoveredIndex };
        this.mode = "landing";
        this.perched = false;
        this.playOnce("land", "perch");
        this.maybeDropNest(coverTarget.position, hoveredIndex);
      }
      this.moveToward(delta, coverTarget.position, this.getPatrolFlightSpeed(elapsed) * 0.95);
      this.lookAtDirection(this.getTravelFacingDirection(coverTarget.position), this.cfg.turnLerpFast);
      if (this.currentActionKey !== "land" && this.currentActionKey !== "perch") {
        this.playLoop(this.getPatrolFlightAction());
      }
      return;
    }

    if (this.mode === "companion" && companionTarget) {
      this.moveToward(delta, companionTarget, this.getPatrolFlightSpeed(elapsed) * 0.96);
      this.lookAtDirection(this.getTravelFacingDirection(companionTarget), this.cfg.turnLerpFast);
      if (this.currentActionKey !== "fly" && this.currentActionKey !== "flySad") {
        this.playLoop(this.getPatrolFlightAction());
      }
      return;
    }

    if (this.mode === "cursorCurious" && cursorTarget) {
      const distance = this.root.position.distanceTo(cursorTarget);
      this.moveToward(delta, cursorTarget, this.getPatrolFlightSpeed(elapsed) * (this.cfg.cursorFollowSpeedScale || 0.92));
      this.lookAtDirection(this.getTravelFacingDirection(cursorTarget), this.cfg.turnLerpFast);

      if (distance <= (this.cfg.cursorTouchDistance || 0.11)) {
        this.mode = "cursorInteract";
        this.cursorInteractUntil = elapsed + randomFromRange(
          this.cfg.cursorTouchHoldMin || 0.65,
          this.cfg.cursorTouchHoldMax || 1.05
        );
        this.cursorInteractionStarted = false;
        this.cursorInteractionActionKey = this.getCursorInteractionActionKey();
      }

      if (this.currentActionKey !== "fly" && this.currentActionKey !== "flySad") {
        this.playLoop(this.getPatrolFlightAction());
      }
      return;
    }

    if (this.mode === "cursorInteract" && cursorTarget) {
      this.velocity.multiplyScalar(0.65);
      this.root.position.lerp(cursorTarget, 0.24);
      this.lookAtPoint(this.camera.position, new THREE.Vector3(0, 1, 0), 0.10);

      if (!this.cursorInteractionStarted) {
        this.cursorInteractionStarted = true;
        if (this.cursorInteractionActionKey && this.cursorInteractionActionKey !== "fly" && this.cursorInteractionActionKey !== "flySad") {
          this.playOnce(this.cursorInteractionActionKey, "");
        }
      }

      if (elapsed >= this.cursorInteractUntil) {
        this.clearCursorAttraction();
        this.mode = "patrol";
        this.playLoop(this.getPatrolFlightAction());
      }
      return;
    }

    if (this.mode === "flee" && fleeTarget) {
      this.moveToward(delta, fleeTarget, this.getPatrolFlightSpeed(elapsed) * 1.12);
      this.lookAtDirection(this.getTravelFacingDirection(fleeTarget), this.cfg.turnLerpFast);
      this.playLoop("flySad");
      if (this.inputState.aggression <= 0.18) {
        this.mode = wantsHome ? "approachHome" : "patrol";
      }
      return;
    }

    if (this.mode === "approachVoid" && voidTarget) {
      const distance = this.root.position.distanceTo(voidTarget.position);
      this.moveToward(delta, voidTarget.position, this.cfg.diveSpeed);
      this.lookAtDirection(this.getTravelFacingDirection(voidTarget.position), this.cfg.turnLerpFast);
      if (distance <= this.cfg.voidConsumeDistance) {
        this.mode = "inspectVoid";
        this.voidState.inspectStartedAt = elapsed;
        this.playLoop("feed");
      } else if (this.currentActionKey !== "feed") {
        this.playLoop("fly");
      }
      return;
    }

    if (this.mode === "patrol") {
      const patrolRepickScale = THREE.MathUtils.lerp(1.0, 0.58, this.searchUrgency || 0);
      this.nextPatrolDecisionAt = Math.min(this.nextPatrolDecisionAt, elapsed + (this.cfg.patrolRepickMin * patrolRepickScale));

      const anchorVisible = this.worldPointComfortablyVisible(this.currentPatrolAnchor);
      if (anchorVisible) this.anchorHiddenSince = -1;
      else if (this.anchorHiddenSince < 0) this.anchorHiddenSince = elapsed;

      const anchorLostLongEnough = this.anchorHiddenSince >= 0
        && (elapsed - this.anchorHiddenSince) >= (this.cfg.patrolVisibilityGrace || 0.18);

      const rootComfortablyVisible = this.worldPointComfortablyVisible(this.root.position, this.cfg.patrolRecoveryMargin);
      if (rootComfortablyVisible) {
        this.recoveryHiddenSince = -1;
        this.recoveryAssist = false;
      } else {
        if (this.recoveryHiddenSince < 0) this.recoveryHiddenSince = elapsed;
        this.recoveryAssist = (elapsed - this.recoveryHiddenSince) >= (this.cfg.recoveryVisibilityGrace || 0.22);
      }

      if (elapsed >= this.nextPatrolDecisionAt || this.root.position.distanceTo(this.currentPatrolAnchor) < 0.18 || anchorLostLongEnough) {
        this.pickNextPatrolPoint();
      }

      if (this.recoveryAssist) {
        this.currentPatrolAnchor.copy(this.getRecoveryPatrolPoint());
      }

      this.moveToward(delta, this.currentPatrolAnchor, this.getPatrolFlightSpeed(elapsed));
      this.lookAtDirection(this.getTravelFacingDirection(this.currentPatrolAnchor), this.cfg.turnLerpFast);
      this.playLoop(this.getPatrolFlightAction());
    }
  }

  moveToward(delta, target, baseSpeed) {
    const toTarget = this.temp.e.copy(target).sub(this.root.position);
    const distance = toTarget.length();

    if (distance <= 0.0001) return;

    const dir = toTarget.normalize();
    const slowMul = distance < this.cfg.approachSlowRadius ? THREE.MathUtils.mapLinear(distance, 0, this.cfg.approachSlowRadius, 0.18, 1.0) : 1.0;
    const speed = baseSpeed * slowMul;
    const desired = dir.multiplyScalar(speed);

    this.velocity.lerp(desired, 1.0 - Math.exp(-delta * (this.cfg.velocityResponse || 5.4)));

    if (this.recoveryAssist) {
      const recovery = this.getRecoveryPatrolPoint().sub(this.root.position).multiplyScalar(this.cfg.patrolRecoverySpeedScale * delta);
      this.velocity.add(recovery);
    }

    this.root.position.addScaledVector(this.velocity, delta);
    this.clampPointNearCenter(this.root.position);
  }

  updateFrameMotionDirection() {
    const actualMotion = this.temp.d.copy(this.root.position).sub(this.temp.center);
    if (actualMotion.lengthSq() > 0.000001) {
      this.frameMotionDirection.copy(actualMotion).normalize();
      this.lastRootPosition.copy(this.root.position);
      return;
    }

    if (this.velocity.lengthSq() > 0.00004) {
      this.frameMotionDirection.copy(this.velocity).normalize();
      this.lastRootPosition.copy(this.root.position);
      return;
    }

    this.frameMotionDirection.copy(this.forward);
    this.lastRootPosition.copy(this.root.position);
  }

  updateVoidInspect(delta, elapsed, voidTarget) {
    if (!this.voidState?.active) return;
    const wobble = new THREE.Vector3(
      Math.cos(elapsed * 2.5) * 0.025,
      Math.sin(elapsed * 3.1) * 0.018,
      Math.sin(elapsed * 2.2) * 0.025
    );

    const hoverPos = voidTarget.position.clone().add(wobble);
    this.root.position.lerp(hoverPos, 0.18);
    this.lookAtPoint(voidTarget.lookAt, new THREE.Vector3(0, 1, 0), 0.16);

    if (this.currentActionKey !== "feed") this.playLoop("feed");

    this.voidState.remaining = Math.max(0, this.voidState.remaining - delta);
    this.voidState.energy = clamp01(this.voidState.remaining / this.voidState.duration);
    this.vitality = clamp01(this.vitality + delta * this.cfg.vitalityRecoveryPerSecond * 1.8);

    if (this.voidState.remaining <= 0) {
      this.clearVoid();
      this.satiatedUntil = elapsed + this.cfg.satiatedDuration;
      this.mode = "patrol";
      this.pickNextPatrolPoint();
      this.playLoop("fly");
    }
  }

  startTakeoff(elapsed) {
    if (this.mode === "takeoff") return;
    this.clearCursorAttraction();
    this.perched = false;
    this.mode = "takeoff";
    const duration = this.actionDurations.get("takeoff") || 0.7;
    this.takeoffState = {
      startedAt: elapsed,
      duration,
      startPos: this.root.position.clone(),
      endPos: this.root.position.clone().add(new THREE.Vector3(0, this.cfg.takeoffRiseHeight, 0))
    };

    if (!this.playOnce("takeoff", this.voidState?.active ? "fly" : this.getPatrolFlightAction())) {
      this.mode = this.voidState?.active ? "approachVoid" : "patrol";
    }
  }

  updateTakeoffMotion(elapsed) {
    if (!this.takeoffState) return;
    const t = clamp01((elapsed - this.takeoffState.startedAt) / Math.max(0.0001, this.takeoffState.duration));
    const ease = smooth01(t);
    this.root.position.lerpVectors(this.takeoffState.startPos, this.takeoffState.endPos, ease * this.cfg.takeoffMotionScale);
  }

  getTurnAlpha(lerpAmount = this.cfg.turnLerp) {
    const clampedLerp = THREE.MathUtils.clamp(lerpAmount, 0.01, 0.99);
    const response = clampedLerp >= (this.cfg.turnLerpFast || 0.28)
      ? (this.cfg.turnResponseFast || 17.0)
      : (this.cfg.turnResponse || 12.0);

    const rateAware = 1.0 - Math.exp(-this.lastDelta * response);
    const legacyAware = 1.0 - Math.pow(1.0 - clampedLerp, Math.max(0.25, this.lastDelta * 60.0));
    return THREE.MathUtils.clamp(Math.max(rateAware, legacyAware), 0.01, 0.95);
  }

  updateFlightPose(delta) {
    if (!this.visualRoot) return;

    const speed = this.velocity.length();
    const inverseRoot = this.temp.q2.copy(this.root.quaternion).invert();
    const localVelocity = this.temp.a.copy(this.velocity).applyQuaternion(inverseRoot);

    let bankTarget = 0;
    let pitchTarget = 0;

    if (speed > (this.cfg.headingVelocityMin || 0.035) && this.mode !== "landed") {
      const normalizedSide = THREE.MathUtils.clamp(localVelocity.x / Math.max(0.0001, speed), -1, 1);
      const normalizedLift = THREE.MathUtils.clamp(localVelocity.y / Math.max(0.0001, speed), -1, 1);

      bankTarget = THREE.MathUtils.clamp(
        -normalizedSide * (this.cfg.visualBankMax || 0.24),
        -(this.cfg.visualBankMax || 0.24),
        this.cfg.visualBankMax || 0.24
      );

      pitchTarget = THREE.MathUtils.clamp(
        -normalizedLift * (this.cfg.visualPitchMax || 0.12),
        -(this.cfg.visualPitchMax || 0.12),
        this.cfg.visualPitchMax || 0.12
      );
    }

    if (this.mode === "inspectVoid" || this.mode === "landing") {
      bankTarget *= 0.35;
      pitchTarget *= 0.35;
    }

    if (this.mode === "landed" || this.mode === "restHome") {
      bankTarget = 0;
      pitchTarget = 0;
    }

    const bankAlpha = 1.0 - Math.exp(-delta * (this.cfg.visualBankResponse || 7.5));
    const pitchAlpha = 1.0 - Math.exp(-delta * (this.cfg.visualPitchResponse || 6.0));

    this.visualBank = THREE.MathUtils.lerp(this.visualBank, bankTarget, bankAlpha);
    this.visualPitch = THREE.MathUtils.lerp(this.visualPitch, pitchTarget, pitchAlpha);

    this.visualRoot.rotation.set(
      this.baseVisualPitch + this.visualPitch,
      this.baseVisualYaw,
      this.baseVisualRoll + this.visualBank
    );
  }

  orientRootToDirection(direction, preferredUp = null, lerpAmount = this.cfg.turnLerp) {
    if (!direction || direction.lengthSq() <= 0.0001) return;

    const forward = this.temp.a.copy(direction).normalize();
    const usePreferredUp = Boolean(
      preferredUp
      && (this.mode === "landing" || this.mode === "landed" || this.mode === "restHome")
    );

    const up = this.temp.b.copy(usePreferredUp ? preferredUp : new THREE.Vector3(0, 1, 0));
    if (up.lengthSq() <= 0.0001) up.set(0, 1, 0);
    up.normalize();

    const parallelLimit = 0.985;
    if (Math.abs(up.dot(forward)) > parallelLimit) {
      up.set(0, 0, 1);
      if (Math.abs(up.dot(forward)) > parallelLimit) {
        up.set(1, 0, 0);
      }
    }

    const right = this.temp.c.copy(up).cross(forward);
    if (right.lengthSq() <= 0.0001) {
      right.set(1, 0, 0).cross(forward);
      if (right.lengthSq() <= 0.0001) right.set(0, 0, 1).cross(forward);
    }
    right.normalize();

    up.copy(forward).cross(right).normalize();

    this.temp.m.makeBasis(right, up, this.temp.d.copy(forward).multiplyScalar(-1));
    this.temp.q.setFromRotationMatrix(this.temp.m);
    this.root.quaternion.slerp(this.temp.q, this.getTurnAlpha(lerpAmount));

    this.forward.set(0, 0, -1).applyQuaternion(this.root.quaternion).normalize();
    this.orientationUp.set(0, 1, 0).applyQuaternion(this.root.quaternion).normalize();
  }

  lookAtDirection(direction, lerpAmount = this.cfg.turnLerp) {
    if (!direction || direction.lengthSq() <= 0.0001) return;

    const target = this.temp.d.copy(direction).normalize();

    if (this.frameMotionDirection && this.frameMotionDirection.lengthSq() > 0.0001) {
      target.lerp(this.frameMotionDirection, 0.82).normalize();
    }

    const smoothing = 1.0 - Math.exp(-this.lastDelta * (this.cfg.headingSmoothing || 10.0));

    if (!this.smoothedHeading || this.smoothedHeading.lengthSq() <= 0.0001) {
      this.smoothedHeading = target.clone();
    } else {
      if (this.smoothedHeading.dot(target) < 0) {
        this.smoothedHeading.copy(this.forward);
      }

      const speedSq = this.velocity.lengthSq();
      const minSpeedSq = Math.pow(this.cfg.headingMinSpeed || 0.08, 2);
      const blend = speedSq < minSpeedSq ? smoothing * 0.32 : smoothing;
      this.smoothedHeading.lerp(target, THREE.MathUtils.clamp(blend, 0.02, 0.42)).normalize();
    }

    const angle = Math.acos(THREE.MathUtils.clamp(this.forward.dot(this.smoothedHeading), -1, 1));
    if (angle <= (this.cfg.headingDeadzone || 0.03)) return;

    this.orientRootToDirection(this.smoothedHeading, null, lerpAmount);
  }

  lookAtPoint(point, up = new THREE.Vector3(0, 1, 0), lerpAmount = 0.12) {
    this.temp.e.copy(point).sub(this.root.position);
    if (this.temp.e.lengthSq() <= 0.0001) return;
    this.orientRootToDirection(this.temp.e, up, lerpAmount);
  }

  getPatrolFlightSpeed(elapsed) {
    let speed = this.isHungry(elapsed) ? this.cfg.flySpeed * this.cfg.flySadSpeedScale : this.cfg.flySpeed;
    speed *= THREE.MathUtils.lerp(0.92, 1.36, this.searchUrgency || 0);
    if (this.mode === "flee") speed *= 1.22;
    if (this.mode === "companion") speed *= 0.94;
    if (this.mode === "approachHome" || this.mode === "restHome") speed *= 0.88;
    return speed;
  }

  updateNestAnimations(elapsed, coverWorldData) {
    const homeTarget = this.getHomePerchTarget();
    this.nests.forEach((nest, index) => {
      if (nest.type === "cover" && typeof nest.coverIndex === "number") {
        const cover = coverWorldData[nest.coverIndex];
        if (cover?.visible) {
          nest.mesh.position.copy(cover.position)
            .addScaledVector(cover.up, this.coverSize.height * 0.42)
            .addScaledVector(cover.right, 0.03);
          nest.mesh.lookAt(this.camera.position);
        }
      } else if (nest.type === "home" && homeTarget) {
        nest.mesh.position.copy(homeTarget.position)
          .addScaledVector(homeTarget.up || new THREE.Vector3(0, 1, 0), 0.012 + index * 0.002)
          .addScaledVector(homeTarget.normal || new THREE.Vector3(0, 0, 1), 0.005);
        nest.mesh.lookAt(this.camera.position);
      }
      nest.mesh.material.opacity = 0.20 + Math.sin(elapsed * 1.8 + index) * 0.05 + this.signalLevel * 0.16 + this.corruption * 0.08;
    });
  }

  updateVoidVisual(elapsed, delta) {
    if (!this.voidState?.active) {
      if (this.voidPoints) this.voidPoints.visible = false;
      if (this.voidCore) this.voidCore.visible = false;
      return;
    }

    this.voidPoints.visible = this.visible;
    this.voidCore.visible = this.visible;

    this.voidGroup.position.copy(this.voidState.position);
    this.voidGroup.lookAt(this.camera.position);

    const positions = this.voidGeometry.attributes.position.array;
    const energy = clamp01(this.voidState.energy);

    for (let i = 0; i < this.voidSeed.length; i += 1) {
      const seed = this.voidSeed[i];
      seed.t = (seed.t + delta * (0.30 + energy * 0.55) * seed.spin) % 1;
      const t = seed.t;
      const radius = (0.56 * Math.max(0.15, energy)) * Math.pow(1 - t, 1.25) * (0.35 + seed.radius * 0.75);
      const angle = seed.angle + elapsed * seed.spin * 1.6 + t * 18.0;
      const z = -t * this.cfg.voidDepth * (0.72 + energy * 0.45);
      const wobble = Math.sin(elapsed * 2.2 + seed.wobble + i * 0.1) * 0.03;
      const x = Math.cos(angle) * (radius + wobble);
      const y = Math.sin(angle) * (radius * 0.72 + wobble * 0.4);

      const ptr = i * 3;
      positions[ptr] = x;
      positions[ptr + 1] = y;
      positions[ptr + 2] = z;
    }

    this.voidGeometry.attributes.position.needsUpdate = true;
    this.voidMaterial.uniforms.uTime.value = elapsed;
    this.voidMaterial.uniforms.uAlpha.value = energy;
    this.voidCore.material.uniforms.uTime.value = elapsed;
    this.voidCore.material.uniforms.uAlpha.value = Math.min(1, 0.75 + energy * 0.35);
    this.voidCore.scale.setScalar(0.68 + energy * 0.24);
  }

  isScenePointerEventAllowed(event) {
    if (!this.ready || !this.visible) return false;
    if ((event.button ?? 0) !== 0) return false;
    if (event.target?.closest?.("button, a, nav, .folder-label, .quick-nav")) return false;
    return true;
  }

  updatePointerRay(event) {
    const bounds = this.renderer.domElement.getBoundingClientRect();
    this.temp.pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
    this.temp.pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
    this.temp.raycaster.setFromCamera(this.temp.pointer, this.camera);
  }

  isPointerOverMoth() {
    const targets = [];
    if (this.hitProxy) targets.push(this.hitProxy);
    if (this.modelRoot) targets.push(this.modelRoot);
    if (!targets.length) return false;

    const hits = this.temp.raycaster.intersectObjects(targets, true);
    return hits.length > 0;
  }

  handleSingleClick(event, hoveredEntry) {
    if (!this.isScenePointerEventAllowed(event)) return false;
    if (typeof event.button === "number" && event.button !== 0) return false;

    this.updatePointerRay(event);

    if (this.isPointerOverMoth()) {
      return true;
    }

    return false;
  }

  handleDoubleClick(event, hoveredEntry) {
    if (!this.isScenePointerEventAllowed(event)) return false;

    this.updatePointerRay(event);

    if (hoveredEntry) return false;

    const point = this.pickVoidPoint();
    if (point) {
      this.spawnVoid(point);
      return true;
    }

    return false;
  }

  handleClick(event, hoveredEntry) {
    return this.handleSingleClick(event, hoveredEntry);
  }

  pickVoidPoint() {
    const hit = new THREE.Vector3();
    const ray = this.temp.raycaster.ray;
    this.temp.sphere.center.copy(this.orbitCenter);
    this.temp.sphere.radius = this.cfg.voidSpawnRadius;

    if (!ray.intersectSphere(this.temp.sphere, hit)) {
      if (!ray.intersectPlane(this.temp.plane, hit)) return null;
    }

    const local = hit.clone().sub(this.orbitCenter);
    if (local.length() > this.cfg.voidSpawnRadius) {
      local.setLength(this.cfg.voidSpawnRadius);
    }

    local.y = THREE.MathUtils.clamp(local.y, this.cfg.voidHeightMin, this.cfg.voidHeightMax);
    hit.copy(this.orbitCenter).add(local);
    return hit;
  }

  spawnVoid(position) {
    this.voidState = {
      active: true,
      position: position.clone(),
      duration: this.cfg.voidInspectDuration,
      remaining: this.cfg.voidInspectDuration,
      energy: 1.0
    };

    this.clearCursorAttraction();
    if (this.mode === "landed" || this.mode === "landing") {
      this.startTakeoff(this.getElapsed());
    } else {
      this.mode = "approachVoid";
      this.playLoop("fly");
    }
    this.log("binary void opened", "ALRT");
  }

  clearVoid() {
    if (!this.voidState) return;
    this.voidState.active = false;
    this.voidState.energy = 0;
    this.corruption = clamp01(this.corruption + 0.06);
  }
