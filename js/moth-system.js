
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
  modelYawOffset: -Math.PI / 2,
  modelPitchOffset: 0,
  modelRollOffset: 0,
  meshOpacity: 0.38,
  meshEmissiveIntensity: 0.34,
  debugOverlay: true,
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

  voidParticleCount: 920,
  voidDepth: 1.08,
  voidVortexRadius: 1.08,
  voidVortexArms: 7,
  voidVortexTwist: 11.5,
  voidVortexSpin: 2.25,
  voidVortexCollapseSpeed: 0.42,

  nestMax: 5,
  nestChancePerPerch: 0.22,
  nestDepositDelay: 7.5,
  stateSaveInterval: 5.0,
  vitalityDrainPerSecond: 0.0026,
  vitalityRecoveryPerSecond: 0.01,
  offlineDrainPerHour: 0.05,
  sadThreshold: 0.30,

  // [MOTH PATCH 2026-04-27] Generative behaviour tuning.
  // These values make the moth react to user activity instead of only following fixed patrol points.
  interactionTracking: true,
  moodUpdateRate: 0.12,
  signalIdleDecay: 0.055,
  signalHoverGain: 0.52,
  signalPointerGain: 0.22,
  hungerSignalWeight: 0.36,
  fatigueFlightGain: 0.055,
  fatigueRestRecovery: 0.18,
  fatigueIdleRecovery: 0.055,
  fatigueShelterThreshold: 0.72,
  overwhelmAggressionThreshold: 0.58,
  overwhelmFatigueThreshold: 0.88,
  overwhelmCorruptionThreshold: 0.72,
  overwhelmDurationMin: 1.35,
  overwhelmDurationMax: 2.75,
  trustGainGentle: 0.035,
  trustLossAggressive: 0.12,
  pointerCuriosityTrustMin: 0.34,
  pointerCuriositySignalMin: 0.22,
  pointerCuriosityDistance: 0.34,
  pointerCuriosityCooldown: 0.18,
  investigateCoverDuration: 1.15,
  investigateCoverRadius: 0.20,
  investigateCoverSpeed: 3.2,
  perchEdgeWalk: 0.055,
  shelterCoverIndex: 0,
  shelterAvoidCoverIndex: 2,
  shelterLandDistance: 0.16,
  nestTrustMin: 0.48,
  voidCautionOrbitDuration: 1.35,
  voidCautionOrbitRadius: 0.32,
  voidCorruptionGain: 0.055,
  voidCorruptionDecay: 0.018,
  voidCorruptionFleeThreshold: 0.82,
  trailHungryScale: 0.46,
  trailFedScale: 1.32,
  visualHungryPatchiness: 0.42,
  debug: false
};

const ACTION_KEYS = {
  fly: ["f fly", "fly", "flying", "hover", "hover fly", "glide", "move"],
  flySad: ["f fly sad", "fly sad", "sad fly", "tired fly", "weak fly", "hurt fly", "sad"],
  land: ["f land", "landing", "land", "touch down", "touchdown"],
  perch: ["f land idle", "land idle", "perch", "perched", "rest", "idle perched", "idle"],
  takeoff: ["f land to takeoff", "f land to take off", "land to takeoff", "takeoff", "take off", "launch", "lift off", "liftoff"],
  feed: ["f void inspect", "void inspect", "inspect", "feed", "eat", "consume", "sniff"],
  backflip: ["f backflip", "backflip", "flip", "evade", "dodge"]
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
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uAtlas: { value: atlas },
      uTime: { value: 0 },
      uAlpha: { value: 1 }
    },
    vertexShader: `
      uniform float uTime;
      attribute float aSeed;
      attribute float aT;
      attribute float aSize;
      varying float vDigit;
      varying float vAlpha;
      varying float vDepth;

      void main() {
        float pulse = 0.78 + sin(uTime * 4.2 + aSeed * 44.0) * 0.22;
        vDigit = mod(floor(uTime * (4.4 + fract(aSeed * 4.0)) + aSeed * 31.0), 2.0);
        vDepth = aT;
        vAlpha = pulse * mix(1.0, 0.18, smoothstep(0.72, 1.0, aT));

        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        float perspective = 42.0 / max(1.0, -mvPosition.z);
        gl_PointSize = max(2.6, aSize * perspective * mix(1.28, 0.48, aT));
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform sampler2D uAtlas;
      uniform float uAlpha;
      varying float vDigit;
      varying float vAlpha;
      varying float vDepth;

      void main() {
        vec2 uv = gl_PointCoord;
        vec2 atlasUv = vec2((uv.x + vDigit) * 0.5, uv.y);
        vec4 glyph = texture2D(uAtlas, atlasUv);
        float alpha = glyph.a * vAlpha * uAlpha;
        if (alpha < 0.025) discard;

        vec3 outerGreen = vec3(0.00, 1.00, 0.12);
        vec3 innerGreen = vec3(0.50, 1.00, 0.32);
        vec3 color = mix(outerGreen, innerGreen, smoothstep(0.55, 1.0, vDepth));
        color *= mix(1.55, 0.72, vDepth);
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
        vec3 color = mix(vec3(0.0), vec3(0.00, 0.18, 0.04), ring * 0.62);
        float alpha = max(inner * 1.15, ring * 0.42) * uAlpha;
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


function createVisibleMothMaterial(sourceMaterial, opacity, emissiveIntensity, isSkinned) {
  let material = null;

  if (sourceMaterial && typeof sourceMaterial.clone === "function") {
    material = sourceMaterial.clone();
  } else {
    material = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#b7c6d3"),
      roughness: 0.86,
      metalness: 0.04,
      side: THREE.DoubleSide
    });
  }

  if (!material.isMeshStandardMaterial && !material.isMeshPhysicalMaterial && !material.isMeshBasicMaterial && !material.isMeshLambertMaterial && !material.isMeshPhongMaterial) {
    material = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#b7c6d3"),
      roughness: 0.86,
      metalness: 0.04,
      side: THREE.DoubleSide
    });
  }

  material.transparent = true;
  material.opacity = opacity;
  material.depthWrite = false;
  material.side = THREE.DoubleSide;

  if (material.color && !material.map) {
    material.color.lerp(new THREE.Color("#b7d8ff"), 0.16);
  }

  if (material.emissive) {
    material.emissive = material.emissive.clone ? material.emissive.clone() : new THREE.Color("#0c2638");
    material.emissive.lerp(new THREE.Color("#1a5d72"), 0.55);
    material.emissiveIntensity = emissiveIntensity;
  }

  if (isSkinned) {
    material.skinning = true;
  }

  material.needsUpdate = true;
  return material;
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
    this.scene.add(this.nestGroup);
    this.scene.add(this.voidGroup);

    this.voidPoints = null;
    this.voidGeometry = null;
    this.voidMaterial = null;
    this.voidCore = null;
    this.voidSeed = [];
    this.voidState = null;

    this.nests = [];
    this.saved = this.loadSavedState();
    this.vitality = clamp01(this.saved.vitality ?? 0.82);
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
    this.backflipState = null;
    this.backflipGuardUntil = 0;

    // [MOTH PATCH 2026-04-27] Needs / wants / interaction state.
    // Kept inside the existing visible FBX system so the actual moth mesh and animation clips stay intact.
    this.mood = "waking";
    this.behaviourNote = "booting";
    this.hunger = clamp01(1.0 - this.vitality);
    this.signal = 0.36;
    this.fatigue = 0.10;
    this.trust = clamp01(this.saved.trust ?? 0.48);
    this.corruption = clamp01(this.saved.corruption ?? 0);
    this.aggression = 0;
    this.pointerEnergy = 0;
    this.pointerGentle = 0;
    this.scrollEnergy = 0;
    this.inputEnergy = 0;
    this.lastInputAt = -999;
    this.lastPointerEventAt = -999;
    this.lastPointerClient = { x: 0, y: 0 };
    this.pointerWorldTarget = new THREE.Vector3();
    this.pointerWorldTargetValid = false;
    this.investigationState = null;
    this.fleeState = null;
    this.shelterState = null;
    this.voidOrbitState = null;
    this.lastHoveredIndex = -1;
    this.fragmentCount = Number(this.saved.fragments || 0);
    this.currentTrailAlpha = this.cfg.trailAlpha;
    this.lastMoodLogAt = 0;
    this.boundInteractionPointerMove = (event) => this.handleInteractionPointerMove(event);
    this.boundInteractionPointerDown = (event) => this.handleInteractionPointerDown(event);
    this.boundInteractionWheel = (event) => this.handleInteractionWheel(event);

    this.debugOverlayVisible = this.cfg.debugOverlay !== false;
    this.debugOverlayElement = null;
    this.debugOverlayBody = null;
    this.debugOverlayLog = null;
    this.debugHistory = [];
    this.lastDebugMode = this.mode;
    this.lastDebugAction = this.currentActionKey || "none";
    this.boundDebugKeyHandler = (event) => this.handleDebugKey(event);

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

    this.initDebugOverlay();
    this.initInteractionTracking();
    this.initVoidVisuals();
    this.restoreNests();
    this.applyOfflineDecay();
    this.load();
  }

  log(message, level = "MOTH") {
    if (this.debug) this.debug(message, level);
    this.pushDebugLine(level, message);
  }

  // [MOTH PATCH 2026-04-27] User input becomes creature signal.
  // Gentle mouse movement builds trust/curiosity. Fast movement, scroll-spikes and click-spam make it flee.
  initInteractionTracking() {
    if (typeof window === "undefined" || this.cfg.interactionTracking === false) return;

    const target = this.renderer?.domElement || window;
    target.removeEventListener?.("pointermove", this.boundInteractionPointerMove);
    target.addEventListener?.("pointermove", this.boundInteractionPointerMove, { passive: true });

    target.removeEventListener?.("pointerdown", this.boundInteractionPointerDown);
    target.addEventListener?.("pointerdown", this.boundInteractionPointerDown, { passive: true });

    window.removeEventListener("wheel", this.boundInteractionWheel);
    window.addEventListener("wheel", this.boundInteractionWheel, { passive: true });
  }

  handleInteractionPointerMove(event) {
    if (!event || !this.renderer?.domElement) return;

    const now = this.getElapsed();
    const bounds = this.renderer.domElement.getBoundingClientRect();
    const x = Number(event.clientX || 0);
    const y = Number(event.clientY || 0);

    let speed01 = 0;
    if (this.lastPointerEventAt > -900) {
      const dt = Math.max(0.016, now - this.lastPointerEventAt);
      const dx = x - this.lastPointerClient.x;
      const dy = y - this.lastPointerClient.y;
      const diagonal = Math.max(1, Math.hypot(bounds.width || 1, bounds.height || 1));
      speed01 = THREE.MathUtils.clamp((Math.hypot(dx, dy) / diagonal) / dt * 1.8, 0, 1);
    }

    this.lastPointerClient.x = x;
    this.lastPointerClient.y = y;
    this.lastPointerEventAt = now;
    this.lastInputAt = now;

    const gentle = smooth01(1.0 - Math.abs(speed01 - 0.22) * 3.4);
    const aggressive = smooth01((speed01 - 0.52) / 0.42);

    this.pointerEnergy = Math.max(this.pointerEnergy, speed01);
    this.pointerGentle = Math.max(this.pointerGentle, gentle * (1.0 - aggressive));
    this.aggression = Math.max(this.aggression, aggressive);
    this.inputEnergy = Math.max(this.inputEnergy, Math.max(speed01, gentle * 0.55));

    this.temp.pointer.x = ((x - bounds.left) / Math.max(1, bounds.width)) * 2 - 1;
    this.temp.pointer.y = -((y - bounds.top) / Math.max(1, bounds.height)) * 2 + 1;
    this.temp.raycaster.setFromCamera(this.temp.pointer, this.camera);

    const target = this.pickPointFromCurrentRay(this.cfg.pointerCuriosityDistance || 0.34);
    if (target) {
      this.pointerWorldTarget.copy(target);
      this.pointerWorldTargetValid = true;
    }
  }

  handleInteractionPointerDown(event) {
    if (!event || (typeof event.button === "number" && event.button !== 0)) return;
    const now = this.getElapsed();
    this.lastInputAt = now;
    this.inputEnergy = Math.max(this.inputEnergy, 0.55);
    this.aggression = Math.max(this.aggression, 0.20);
  }

  handleInteractionWheel(event) {
    const amount = Math.abs(Number(event?.deltaY || 0)) / 900;
    const wheel01 = THREE.MathUtils.clamp(amount, 0, 1);
    this.scrollEnergy = Math.max(this.scrollEnergy, wheel01);
    this.inputEnergy = Math.max(this.inputEnergy, wheel01 * 0.85);
    this.aggression = Math.max(this.aggression, smooth01((wheel01 - 0.36) / 0.54));
    this.lastInputAt = this.getElapsed();
  }

  pickPointFromCurrentRay(preferredOffset = 0.34) {
    const hit = new THREE.Vector3();
    const ray = this.temp.raycaster.ray;
    this.temp.sphere.center.copy(this.orbitCenter);
    this.temp.sphere.radius = this.cfg.voidSpawnRadius;

    if (!ray.intersectSphere(this.temp.sphere, hit)) {
      if (!ray.intersectPlane(this.temp.plane, hit)) return null;
    }

    const local = hit.clone().sub(this.orbitCenter);
    if (local.length() > this.cfg.voidSpawnRadius) local.setLength(this.cfg.voidSpawnRadius);
    hit.copy(this.orbitCenter).add(local);

    // Do not let the moth chase the exact pointer. Keep a cautious, readable distance.
    const fromCamera = hit.clone().sub(this.camera.position);
    if (fromCamera.lengthSq() > 0.0001) hit.addScaledVector(fromCamera.normalize(), -preferredOffset);

    hit.y = THREE.MathUtils.clamp(hit.y, this.orbitCenter.y + this.cfg.patrolHeightMin, this.orbitCenter.y + this.cfg.patrolHeightMax);
    return this.clampPointNearCenter(hit);
  }

  decayInteractionEnergy(delta) {
    const pointerDecay = Math.exp(-delta * 4.5);
    const gentleDecay = Math.exp(-delta * 2.6);
    const scrollDecay = Math.exp(-delta * 3.4);
    const aggressionDecay = Math.exp(-delta * 2.2);
    const inputDecay = Math.exp(-delta * 2.0);

    this.pointerEnergy *= pointerDecay;
    this.pointerGentle *= gentleDecay;
    this.scrollEnergy *= scrollDecay;
    this.aggression *= aggressionDecay;
    this.inputEnergy *= inputDecay;

    if (this.getElapsed() - this.lastPointerEventAt > 2.0) {
      this.pointerWorldTargetValid = false;
    }
  }

  updateNeedsAndMood(delta, elapsed, hoveredIndex, hasVoid) {
    this.decayInteractionEnergy(delta);

    const hoveredSignal = hoveredIndex >= 0 ? this.cfg.signalHoverGain : 0;
    const pointerSignal = this.pointerGentle * (this.cfg.signalPointerGain || 0.22);
    const voidSignal = hasVoid ? 0.30 : 0;
    const activeSignal = hoveredSignal + pointerSignal + voidSignal + this.inputEnergy * 0.16;

    this.signal = clamp01(
      this.signal
        + delta * activeSignal
        - delta * (this.cfg.signalIdleDecay || 0.055) * (activeSignal > 0 ? 0.35 : 1.0)
    );

    const signalWeight = this.cfg.hungerSignalWeight || 0.36;
    this.hunger = clamp01((1.0 - this.vitality) * (1.0 - signalWeight) + (1.0 - this.signal) * signalWeight);

    const moving = this.velocity.length() / Math.max(0.001, this.cfg.flySpeed || 1.0);
    const flightFatigue = moving * (this.cfg.fatigueFlightGain || 0.055);
    const restRecovery = this.mode === "landed" ? (this.cfg.fatigueRestRecovery || 0.18) : (this.cfg.fatigueIdleRecovery || 0.055);
    this.fatigue = clamp01(this.fatigue + delta * flightFatigue + this.aggression * delta * 0.10 - delta * restRecovery);

    const gentleTrust = this.pointerGentle > 0.12 && this.aggression < 0.18;
    this.trust = clamp01(
      this.trust
        + delta * (gentleTrust ? (this.cfg.trustGainGentle || 0.035) : 0)
        - delta * this.aggression * (this.cfg.trustLossAggressive || 0.12)
    );

    const corruptionGain = (this.mode === "inspectVoid" ? this.cfg.voidCorruptionGain : this.mode === "orbitVoid" ? this.cfg.voidCorruptionGain * 0.32 : 0) || 0;
    this.corruption = clamp01(this.corruption + delta * corruptionGain - delta * (this.cfg.voidCorruptionDecay || 0.018));

    let nextMood = "patrolling";
    if (this.mode === "landed" || this.mode === "seekShelter") nextMood = "safe / nesting";
    else if (this.corruption >= (this.cfg.overwhelmCorruptionThreshold || 0.72)) nextMood = "corrupted";
    else if (this.aggression >= (this.cfg.overwhelmAggressionThreshold || 0.58) || this.fatigue >= (this.cfg.overwhelmFatigueThreshold || 0.88)) nextMood = "overwhelmed";
    else if (hasVoid) nextMood = "void drawn";
    else if (this.hunger > 0.62) nextMood = "hungry / searching";
    else if (elapsed < this.satiatedUntil || this.vitality > 0.74) nextMood = "fed / bright";
    else if (hoveredIndex >= 0 || this.pointerGentle > 0.18) nextMood = "curious";
    else if (this.signal < 0.24) nextMood = "under-stimulated";

    if (nextMood !== this.mood && elapsed - this.lastMoodLogAt > (this.cfg.moodUpdateRate || 0.12)) {
      this.pushDebugLine("MOOD", `${this.mood} → ${nextMood}`);
      this.lastMoodLogAt = elapsed;
    }
    this.mood = nextMood;
  }

  setMode(nextMode, reason = "") {
    if (!nextMode || this.mode === nextMode) return false;
    const previous = this.mode;
    this.mode = nextMode;
    this.behaviourNote = reason || nextMode;
    this.pushDebugLine("STATE", `${previous} → ${nextMode}${reason ? ` · ${reason}` : ""}`);
    return true;
  }

  shouldFleeFromOverwhelm() {
    if (this.mode === "backflip" || this.mode === "takeoff" || this.mode === "inspectVoid") return false;
    if (this.corruption >= (this.cfg.voidCorruptionFleeThreshold || 0.82)) return true;
    if (this.aggression >= (this.cfg.overwhelmAggressionThreshold || 0.58)) return true;
    return this.fatigue >= (this.cfg.overwhelmFatigueThreshold || 0.88) && this.signal > 0.64;
  }

  startFleeOverwhelmed(elapsed, reason = "overwhelmed") {
    const camForward = this.temp.a.set(0, 0, -1).applyQuaternion(this.camera.quaternion).normalize();
    const camRight = this.temp.b.set(1, 0, 0).applyQuaternion(this.camera.quaternion).normalize();
    const side = Math.random() > 0.5 ? 1 : -1;

    const target = new THREE.Vector3()
      .copy(this.orbitCenter)
      .addScaledVector(camForward, randomFromRange(0.48, 0.92))
      .addScaledVector(camRight, side * randomFromRange(0.44, 1.05));
    target.y = this.orbitCenter.y + randomFromRange(this.cfg.patrolHeightMax * 0.60, this.cfg.patrolHeightMax + 0.20);
    this.clampPointNearCenter(target);

    this.fleeState = {
      startedAt: elapsed,
      endsAt: elapsed + randomFromRange(this.cfg.overwhelmDurationMin, this.cfg.overwhelmDurationMax),
      target,
      reason
    };

    if (this.mode === "landed" || this.mode === "landing") this.startTakeoff(elapsed);
    if (this.mode !== "takeoff") this.setMode("fleeOverwhelmed", reason);
    this.playLoop(this.getPatrolFlightAction());
  }

  updateFleeOverwhelmed(delta, elapsed) {
    if (!this.fleeState) this.startFleeOverwhelmed(elapsed, "panic recovery");

    const target = this.fleeState?.target || this.currentPatrolAnchor;
    const twitch = new THREE.Vector3(
      Math.sin(elapsed * 17.0) * 0.045,
      Math.sin(elapsed * 23.0) * 0.034,
      Math.cos(elapsed * 19.0) * 0.045
    );

    const fleeTarget = target.clone().add(twitch);
    this.moveToward(delta, fleeTarget, this.cfg.flySpeed * 1.28);
    this.lookAtDirection(this.getTravelFacingDirection(fleeTarget), this.cfg.turnLerpFast);
    this.playLoop(this.getPatrolFlightAction());

    this.fatigue = clamp01(this.fatigue - delta * 0.09);
    this.aggression = Math.max(0, this.aggression - delta * 0.28);

    if (elapsed >= (this.fleeState?.endsAt || 0) || this.root.position.distanceTo(target) < 0.16) {
      this.fleeState = null;
      this.pickNextPatrolPoint();
      this.setMode("patrol", "calmed down");
    }
  }

  startCoverInvestigation(index, coverTarget, elapsed) {
    this.investigationState = {
      coverIndex: index,
      startedAt: elapsed,
      duration: this.cfg.investigateCoverDuration || 1.15,
      phaseOffset: Math.random() * Math.PI * 2
    };
    this.setMode("investigateCover", `inspecting cover ${index}`);
    this.playLoop(this.getPatrolFlightAction());
  }

  updateCoverInvestigation(delta, elapsed, coverTarget) {
    if (!coverTarget || !this.investigationState) {
      this.investigationState = null;
      this.setMode("patrol", "lost cover target");
      return;
    }

    const t = clamp01((elapsed - this.investigationState.startedAt) / Math.max(0.001, this.investigationState.duration));
    const phase = this.investigationState.phaseOffset + elapsed * (this.cfg.investigateCoverSpeed || 3.2);
    const radius = (this.cfg.investigateCoverRadius || 0.20) * (1.0 - t * 0.32);

    const target = coverTarget.position.clone()
      .addScaledVector(coverTarget.normal, Math.cos(phase) * radius + 0.06)
      .addScaledVector(coverTarget.right || new THREE.Vector3(1, 0, 0), Math.sin(phase) * radius)
      .addScaledVector(coverTarget.up, Math.sin(phase * 1.7) * 0.035);

    this.moveToward(delta, target, this.getPatrolFlightSpeed(elapsed) * 0.92);
    this.lookAtPoint(coverTarget.position, coverTarget.up, this.cfg.turnLerpFast);
    this.playLoop(this.getPatrolFlightAction());

    this.behaviourNote = "circle → inspect → decide";
    if (t >= 1.0) {
      this.setMode("approachCover", "inspection complete");
    }
  }

  getShelterTarget(coverWorldData) {
    if (!Array.isArray(coverWorldData) || !coverWorldData.length) return null;

    const prefer = Number.isFinite(this.cfg.shelterCoverIndex) ? this.cfg.shelterCoverIndex : 0;
    const avoid = Number.isFinite(this.cfg.shelterAvoidCoverIndex) ? this.cfg.shelterAvoidCoverIndex : -1;
    const order = [prefer, ...coverWorldData.map((_, i) => i).filter((i) => i !== prefer && i !== avoid), avoid].filter((i) => i >= 0);

    for (const index of order) {
      const cover = coverWorldData[index];
      if (!cover?.visible) continue;
      const target = this.getCoverPerchTarget(index, coverWorldData);
      if (target) return { ...target, index };
    }
    return null;
  }

  shouldSeekShelter(hasVoid, hoveredIndex) {
    if (hasVoid || hoveredIndex >= 0) return false;
    if (this.mode === "landed" || this.mode === "landing" || this.mode === "seekShelter") return false;
    return this.fatigue >= (this.cfg.fatigueShelterThreshold || 0.72) || (this.trust > 0.56 && this.signal < 0.22);
  }

  updateSeekShelter(delta, elapsed, coverWorldData) {
    const shelter = this.getShelterTarget(coverWorldData);
    if (!shelter) {
      this.setMode("patrol", "no shelter visible");
      return;
    }

    const distance = this.root.position.distanceTo(shelter.position);
    if (distance <= (this.cfg.shelterLandDistance || 0.16)) {
      this.perched = false;
      this.setMode("landing", `shelter ${shelter.index}`);
      this.playOnce("land", "perch");
      this.maybeDropNest(shelter.position, shelter.index);
      this.fragmentCount += 1;
      return;
    }

    this.moveToward(delta, shelter.position, this.getPatrolFlightSpeed(elapsed) * 0.72);
    this.lookAtDirection(this.getTravelFacingDirection(shelter.position), this.cfg.turnLerpFast);
    this.playLoop(this.getPatrolFlightAction());
    this.behaviourNote = `seeking shelter cover ${shelter.index}`;
  }

  shouldFollowPointer(elapsed, hoveredIndex, hasVoid) {
    if (hasVoid || hoveredIndex >= 0) return false;
    if (!this.pointerWorldTargetValid) return false;
    if (this.mode === "landed" || this.mode === "landing" || this.mode === "takeoff" || this.mode === "backflip") return false;
    if (elapsed - this.lastPointerEventAt > 1.2) return false;
    if (this.trust < (this.cfg.pointerCuriosityTrustMin || 0.34)) return false;
    if (this.signal < (this.cfg.pointerCuriositySignalMin || 0.22) && this.pointerGentle < 0.20) return false;
    return this.aggression < 0.30;
  }

  updatePointerCuriosity(delta, elapsed) {
    if (!this.pointerWorldTargetValid) {
      this.setMode("patrol", "pointer signal lost");
      return;
    }

    const target = this.pointerWorldTarget.clone();
    const breathe = Math.sin(elapsed * 3.1) * 0.035;
    target.y += breathe;

    this.moveToward(delta, target, this.getPatrolFlightSpeed(elapsed) * 0.84);
    this.lookAtDirection(this.getTravelFacingDirection(target), this.cfg.turnLerpFast);
    this.playLoop(this.getPatrolFlightAction());
    this.behaviourNote = "cautious pointer curiosity";

    if (this.root.position.distanceTo(target) < 0.13 || this.aggression > 0.36 || elapsed - this.lastPointerEventAt > 1.5) {
      this.setMode("patrol", "pointer curiosity complete");
      this.pickNextPatrolPoint();
    }
  }

  startVoidOrbit(elapsed) {
    this.voidOrbitState = {
      startedAt: elapsed,
      duration: this.cfg.voidCautionOrbitDuration || 1.35,
      phaseOffset: Math.random() * Math.PI * 2
    };
    this.setMode("orbitVoid", "hesitating before feeding");
    this.playLoop("feed");
  }

  updateVoidOrbit(delta, elapsed, voidTarget) {
    if (!this.voidState?.active || !voidTarget) {
      this.setMode("patrol", "void lost");
      return;
    }

    const orbit = this.voidOrbitState || { startedAt: elapsed, duration: 1, phaseOffset: 0 };
    const t = clamp01((elapsed - orbit.startedAt) / Math.max(0.001, orbit.duration));
    const phase = orbit.phaseOffset + elapsed * 3.8;
    const radius = (this.cfg.voidCautionOrbitRadius || 0.32) * (1.0 - t * 0.26);

    const right = this.temp.b.set(1, 0, 0).applyQuaternion(this.camera.quaternion).normalize();
    const up = this.temp.c.set(0, 1, 0);

    const target = this.voidState.position.clone()
      .addScaledVector(right, Math.cos(phase) * radius)
      .addScaledVector(up, Math.sin(phase) * radius * 0.60)
      .addScaledVector(this.camera.position.clone().sub(this.voidState.position).normalize(), this.cfg.voidHoverRadius);

    this.moveToward(delta, target, this.cfg.diveSpeed * 0.72);
    this.lookAtPoint(this.voidState.position, up, this.cfg.turnLerpFast);
    this.playLoop("feed");
    this.behaviourNote = "orbiting dangerous food";

    if (this.corruption >= (this.cfg.voidCorruptionFleeThreshold || 0.82)) {
      this.startFleeOverwhelmed(elapsed, "void corruption spike");
      return;
    }

    if (t >= 1.0 || this.root.position.distanceTo(target) < 0.10) {
      this.setMode("inspectVoid", "feeding from void");
      this.voidState.inspectStartedAt = elapsed;
      this.playLoop("feed");
    }
  }

  updateNeedVisuals(delta, elapsed, hungry) {
    const speedRatio = this.velocity.length() / Math.max(0.0001, this.cfg.flySpeed || 1.0);
    const motion = clamp01(speedRatio * (this.cfg.shellMotionStrength || 1.0));
    const fed = clamp01((this.vitality - 0.55) / 0.45);
    const overwhelmed = this.mood === "overwhelmed" || this.mode === "fleeOverwhelmed";
    const corrupted = this.mood === "corrupted" || this.corruption > 0.45;
    const patchy = clamp01(this.hunger * (this.cfg.visualHungryPatchiness || 0.42) + this.aggression * 0.28 + this.corruption * 0.32);
    const flicker = 0.72 + Math.sin(elapsed * (hungry ? 15.0 : 5.4)) * patchy * 0.22 + Math.sin(elapsed * 31.0) * this.aggression * 0.06;

    const shellAlpha = THREE.MathUtils.clamp(
      (hungry ? 0.72 : 1.0) * flicker * (overwhelmed ? 0.82 : 1.0),
      0.30,
      1.24
    );

    const brightnessBase = this.cfg.binaryBrightness || 1.42;
    const brightness = Math.max(
      0.72,
      brightnessBase * (1.0 + fed * 0.18 + this.signal * 0.10 - this.hunger * 0.18 + this.corruption * 0.10)
    );

    if (this.binaryMaterial) {
      this.binaryMaterial.uniforms.uTime.value = elapsed;
      this.binaryMaterial.uniforms.uSadness.value = clamp01(this.hunger * 0.90 + this.corruption * 0.60 + (overwhelmed ? 0.30 : 0));
      this.binaryMaterial.uniforms.uAlphaBoost.value = shellAlpha;
      this.binaryMaterial.uniforms.uMotion.value = clamp01(motion + this.aggression * 0.32 + this.corruption * 0.18);
      this.binaryMaterial.uniforms.uBrightness.value = brightness;
    }

    if (this.outlineMaterial) {
      this.outlineMaterial.uniforms.uTime.value = elapsed;
      this.outlineMaterial.uniforms.uSadness.value = clamp01(this.hunger * 0.70 + this.corruption * 0.40);
      this.outlineMaterial.uniforms.uMotion.value = clamp01(motion + this.aggression * 0.25);
      this.outlineMaterial.uniforms.uAlpha.value = THREE.MathUtils.clamp(shellAlpha + fed * 0.12, 0.42, 1.18);
      this.outlineMaterial.uniforms.uBrightness.value = (this.cfg.outlineBrightness || 2.05) * (1.0 + fed * 0.16 + corrupted * 0.12);
    }

    this.currentTrailAlpha = THREE.MathUtils.clamp(
      (this.cfg.trailAlpha || 0.84)
        * THREE.MathUtils.lerp(this.cfg.trailHungryScale || 0.46, this.cfg.trailFedScale || 1.32, fed)
        * (overwhelmed ? 0.62 : 1.0),
      0.18,
      1.35
    );
  }


  initDebugOverlay() {
    if (typeof document === "undefined") return;

    let panel = document.getElementById("orbit-moth-debug-hud");
    if (!panel) {
      panel = document.createElement("aside");
      panel.id = "orbit-moth-debug-hud";
      panel.style.cssText = `
        position: fixed;
        right: 14px;
        bottom: 14px;
        z-index: 99999;
        width: min(360px, calc(100vw - 28px));
        max-height: 48vh;
        overflow: hidden;
        border: 1px solid rgba(74, 255, 152, 0.42);
        border-radius: 14px;
        background: linear-gradient(180deg, rgba(2, 8, 10, 0.88), rgba(0, 0, 0, 0.72));
        color: rgba(210, 255, 226, 0.94);
        font: 11px/1.35 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        box-shadow: 0 0 24px rgba(0, 255, 96, 0.16), inset 0 0 30px rgba(0, 255, 96, 0.04);
        backdrop-filter: blur(8px);
        pointer-events: none;
      `;
      panel.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:space-between;padding:9px 10px 7px;border-bottom:1px solid rgba(74,255,152,.20);letter-spacing:.08em;text-transform:uppercase;">
          <strong style="color:#4dff99;font-size:12px;">MOTH DEBUG</strong>
          <span style="opacity:.66;">M toggle · [ ] yaw</span>
        </div>
        <div data-moth-debug-body style="padding:9px 10px;display:grid;grid-template-columns:88px 1fr;gap:3px 10px;"></div>
        <div style="height:1px;background:linear-gradient(90deg,transparent,rgba(74,255,152,.42),transparent);"></div>
        <div data-moth-debug-log style="padding:8px 10px 10px;max-height:116px;overflow:hidden;color:rgba(190,255,212,.78);"></div>
      `;
      document.body.appendChild(panel);
    }

    this.debugOverlayElement = panel;
    this.debugOverlayBody = panel.querySelector("[data-moth-debug-body]");
    this.debugOverlayLog = panel.querySelector("[data-moth-debug-log]");
    this.debugOverlayElement.style.display = this.debugOverlayVisible ? "block" : "none";

    window.removeEventListener("keydown", this.boundDebugKeyHandler);
    window.addEventListener("keydown", this.boundDebugKeyHandler);
  }

  handleDebugKey(event) {
    if (!event || event.altKey || event.ctrlKey || event.metaKey) return;
    const target = event.target;
    if (target && /^(input|textarea|select)$/i.test(target.tagName || "")) return;

    const key = String(event.key || "").toLowerCase();
    if (key === "m") {
      this.debugOverlayVisible = !this.debugOverlayVisible;
      if (this.debugOverlayElement) this.debugOverlayElement.style.display = this.debugOverlayVisible ? "block" : "none";
      this.pushDebugLine("HUD", this.debugOverlayVisible ? "shown" : "hidden");
    }

    if (event.key === "[" || event.key === "]") {
      const step = Math.PI / 2;
      this.baseVisualYaw += event.key === "]" ? step : -step;
      this.cfg.modelYawOffset = this.baseVisualYaw;
      this.pushDebugLine("YAW", `modelYawOffset = ${this.baseVisualYaw.toFixed(3)} rad`);
    }
  }

  pushDebugLine(level, message) {
    const safeLevel = String(level || "MOTH");
    const safeMessage = String(message || "");
    this.debugHistory.unshift({ level: safeLevel, message: safeMessage, time: this.getElapsed ? this.getElapsed() : 0 });
    this.debugHistory.length = Math.min(this.debugHistory.length, 8);

    if (!this.debugOverlayLog) return;
    this.debugOverlayLog.innerHTML = this.debugHistory
      .map((entry) => `<div><span style="color:#4dff99;opacity:.88">${entry.level}</span> <span style="opacity:.55">${entry.time.toFixed(1)}s</span> ${entry.message}</div>`)
      .join("");
  }

  updateDebugOverlay(elapsed, hoveredIndex = -1) {
    if (!this.debugOverlayBody || !this.debugOverlayVisible) return;

    const action = this.currentActionKey || "none";
    const target = this.voidState?.active ? "void" : hoveredIndex >= 0 ? `cover ${hoveredIndex}` : this.pointerWorldTargetValid ? "pointer signal" : "patrol";
    const speed = this.velocity.length();
    const yaw = this.baseVisualYaw || 0;
    const voidEnergy = this.voidState?.active ? clamp01(this.voidState.energy).toFixed(2) : "0.00";

    if (this.lastDebugMode !== this.mode) {
      this.pushDebugLine("STATE", `${this.lastDebugMode} → ${this.mode}`);
      this.lastDebugMode = this.mode;
    }

    if (this.lastDebugAction !== action) {
      this.pushDebugLine("ANIM", `${this.lastDebugAction} → ${action}`);
      this.lastDebugAction = action;
    }

    const rows = [
      ["mode", this.mode],
      ["mood", this.mood],
      ["anim", action],
      ["behaviour", this.behaviourNote || "—"],
      ["target", target],
      ["vitality", this.vitality.toFixed(2)],
      ["hunger", this.hunger.toFixed(2)],
      ["signal", this.signal.toFixed(2)],
      ["fatigue", this.fatigue.toFixed(2)],
      ["trust", this.trust.toFixed(2)],
      ["corrupt", this.corruption.toFixed(2)],
      ["aggression", this.aggression.toFixed(2)],
      ["fragments", String(this.fragmentCount || 0)],
      ["speed", speed.toFixed(2)],
      ["void", voidEnergy],
      ["yaw", `${yaw.toFixed(3)} rad`],
      ["pos", `${this.root.position.x.toFixed(2)}, ${this.root.position.y.toFixed(2)}, ${this.root.position.z.toFixed(2)}`]
    ];

    this.debugOverlayBody.innerHTML = rows
      .map(([label, value]) => `<span style="opacity:.55;text-transform:uppercase;">${label}</span><span style="color:#d8ffe8">${value}</span>`)
      .join("");
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
          trust: this.trust,
          corruption: this.corruption,
          fragments: this.fragmentCount,
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
  }

  restoreNests() {
    const savedNests = Array.isArray(this.saved.nests) ? this.saved.nests : [];
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
      const meshOpacity = THREE.MathUtils.clamp(this.cfg.meshOpacity ?? 0.38, 0.02, 1.0);
      const emissiveIntensity = this.cfg.meshEmissiveIntensity ?? 0.34;

      if (materials.length) {
        child.material = materials.map((sourceMaterial) =>
          createVisibleMothMaterial(sourceMaterial, meshOpacity, emissiveIntensity, child.isSkinnedMesh)
        );
      } else {
        child.material = createVisibleMothMaterial(null, meshOpacity, emissiveIntensity, child.isSkinnedMesh);
      }

      if (Array.isArray(child.material) && child.material.length === 1) child.material = child.material[0];
    });

    this.fitMothScale();
    this.setupAnimations(clips);
    this.buildBinaryShell();
    this.buildBinaryOutline();
    this.buildTrail();
    this.buildHitProxy();
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

    const exactBackflipClip =
      uniqueClips.find((clip) => clip.name === "Backflip") ||
      uniqueClips.find((clip) => normalizeName(clip.name) === "backflip") ||
      uniqueClips.find((clip) => clip.name === "F_Backflip") ||
      uniqueClips.find((clip) => normalizeName(clip.name) === "f backflip");

    if (exactBackflipClip) {
      const action = createAction(exactBackflipClip);
      this.actions.set("backflip", action);
      this.actionDurations.set("backflip", exactBackflipClip.duration);
      console.log("[Moth] Bound backflip to exact clip:", exactBackflipClip.name);
    } else {
      console.warn("[Moth] Exact Backflip clip was not found.");
    }

    Object.entries(ACTION_KEYS).forEach(([actionKey, patterns]) => {
      if (actionKey === "backflip" && this.actions.has("backflip")) return;

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
      this.mode = "landed";
      this.playLoop("perch");
      return;
    }

    if (this.currentActionKey === "takeoff") {
      const next = this.pendingActionKey || this.getPatrolFlightAction();
      this.pendingActionKey = "";
      this.perched = false;
      this.mode = this.voidState?.active ? "approachVoid" : "patrol";
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
    this.backflipState = null;
    this.backflipGuardUntil = 0;

    this.debugOverlayVisible = this.cfg.debugOverlay !== false;
    this.debugOverlayElement = null;
    this.debugOverlayBody = null;
    this.debugOverlayLog = null;
    this.debugHistory = [];
    this.lastDebugMode = this.mode;
    this.lastDebugAction = this.currentActionKey || "none";
    this.boundDebugKeyHandler = (event) => this.handleDebugKey(event);

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
    return !(this.voidState?.active) && elapsed >= this.satiatedUntil;
  }

  playLoop(key) {
    if (this.mode === "backflip" && this.currentActionKey === "backflip" && key !== "backflip") {
      return false;
    }

    const next = this.getAction(key);
    if (!next) return false;
    if (this.currentActionKey === key && next.isRunning()) return true;

    const previousKey = this.currentActionKey || "none";
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
    if (previousKey !== key) this.pushDebugLine("ANIM", `${previousKey} → ${key} loop`);
    return true;
  }

  playOnce(key, followUp = "") {
    if (this.mode === "backflip" && this.currentActionKey === "backflip" && key !== "backflip") {
      return false;
    }

    const next = this.getAction(key);
    if (!next) {
      if (followUp) this.playLoop(followUp);
      return false;
    }

    const previousKey = this.currentActionKey || "none";
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
    this.pushDebugLine("ANIM", `${previousKey} → ${key} once${followUp ? " → " + followUp : ""}`);
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

    this.trail.velocity[i]
      .copy(this.forward)
      .multiplyScalar(-this.cfg.trailSpeed * (0.8 + Math.random() * 0.45))
      .add(new THREE.Vector3(
        (Math.random() - 0.5) * this.cfg.trailJitter,
        (Math.random() - 0.5) * this.cfg.trailJitter,
        (Math.random() - 0.5) * this.cfg.trailJitter
      ));
  }

  updateTrail(delta, elapsed) {
    if (!this.trail) return;

    this.trail.material.uniforms.uTime.value = elapsed;
    this.trail.material.uniforms.uAlpha.value = this.currentTrailAlpha ?? this.cfg.trailAlpha;

    this.trail.emitClock += delta;
    const moving = this.velocity.lengthSq() > 0.0025;
    while (moving && this.trail.emitClock >= this.cfg.trailEmitInterval) {
      this.trail.emitClock -= this.cfg.trailEmitInterval;
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
      aSize[i] = 0.86 + Math.random() * 0.92;
      this.voidSeed.push({
        angle: Math.random() * Math.PI * 2,
        arm: Math.floor(Math.random() * (this.cfg.voidVortexArms || 7)),
        radius: 0.30 + Math.random() * 0.95,
        t: Math.random(),
        spin: 0.82 + Math.random() * 1.65,
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
    const velocityDir = this.temp.b.copy(this.velocity);
    if (velocityDir.lengthSq() > 0.00004) {
      velocityDir.normalize();
      if (targetPoint) {
        const targetDir = this.temp.c.copy(targetPoint).sub(this.root.position);
        if (targetDir.lengthSq() > 0.00004) {
          targetDir.normalize();
          velocityDir.lerp(targetDir, 0.14).normalize();
        }
      }
      return velocityDir;
    }
    return this.getFacingDirection(targetPoint);
  }

  pickNextPatrolPoint(force = false) {
    const elapsed = this.getElapsed();
    this.nextPatrolDecisionAt = elapsed + randomFromRange(this.cfg.patrolRepickMin, this.cfg.patrolRepickMax);

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

    return { position, normal, up: cover.up.clone(), right: cover.right.clone() };
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
      coverWorldData = []
    } = context;

    const sceneVisible = introComplete && !introActive;
    this.setVisibility(sceneVisible);
    if (!sceneVisible) return;

    this.lastDelta = Math.max(1 / 240, delta || 1 / 60);

    if (this.mixer) this.mixer.update(delta);
    this.updateAnimatedShells();

    const hasVoid = this.voidState?.active;
    const hungry = this.isHungry(elapsed);
    if (hungry && !hasVoid) {
      this.vitality = clamp01(this.vitality - delta * this.cfg.vitalityDrainPerSecond);
    } else {
      const recoveryMultiplier = this.mode === "inspectVoid" ? 1.25 : this.mode === "landed" ? 0.55 : 0.25;
      this.vitality = clamp01(this.vitality + delta * this.cfg.vitalityRecoveryPerSecond * recoveryMultiplier);
    }

    this.updateNeedsAndMood(delta, elapsed, hoveredIndex, Boolean(hasVoid));
    this.updateNeedVisuals(delta, elapsed, hungry);

    this.updateVoidVisual(elapsed, delta);
    this.updateNestAnimations(elapsed, coverWorldData);
    this.updateStateAndMotion(delta, elapsed, hoveredEntry, hoveredIndex, coverWorldData);
    this.updateFlightPose(delta);
    this.updateTrail(delta, elapsed);
    this.updateDebugOverlay(elapsed, hoveredIndex);

    if (this.hitProxy) {
      this.hitProxy.position.set(0, 0, 0);
    }

    this.saveState(false);
  }

  updateStateAndMotion(delta, elapsed, hoveredEntry, hoveredIndex, coverWorldData) {
    const hasVoid = this.voidState?.active;
    const coverTarget = (!hasVoid && hoveredIndex >= 0 && Array.isArray(coverWorldData)) ? this.getCoverPerchTarget(hoveredIndex, coverWorldData) : null;
    const voidTarget = hasVoid ? this.getVoidInspectTarget() : null;

    if (this.shouldFleeFromOverwhelm()) {
      this.startFleeOverwhelmed(elapsed, this.corruption > 0.72 ? "corruption overload" : "aggressive input");
    }

    if (this.mode === "takeoff") {
      this.updateTakeoffMotion(elapsed);
      return;
    }

    if (this.mode === "backflip") {
      this.velocity.set(0, 0, 0);
      this.recoveryAssist = false;

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

    if (this.mode === "fleeOverwhelmed") {
      this.updateFleeOverwhelmed(delta, elapsed);
      return;
    }

    if (hasVoid) {
      this.hoverClock = 0;
      this.investigationState = null;

      if (this.mode === "landed" || this.mode === "landing" || this.mode === "seekShelter") {
        this.startTakeoff(elapsed);
        return;
      }

      if (this.mode === "inspectVoid" && voidTarget) {
        this.updateVoidInspect(delta, elapsed, voidTarget);
        return;
      }

      if (this.mode === "orbitVoid" && voidTarget) {
        this.updateVoidOrbit(delta, elapsed, voidTarget);
        return;
      }

      if (voidTarget) {
        if (this.mode !== "approachVoid") this.setMode("approachVoid", "void signal detected");

        const distance = this.root.position.distanceTo(voidTarget.position);
        this.moveToward(delta, voidTarget.position, this.cfg.diveSpeed * (this.corruption > 0.55 ? 0.78 : 1.0));
        this.lookAtDirection(this.getTravelFacingDirection(voidTarget.position), this.cfg.turnLerpFast);

        if (distance <= this.cfg.voidConsumeDistance) {
          this.startVoidOrbit(elapsed);
        } else {
          this.playLoop(this.corruption > 0.48 ? this.getPatrolFlightAction() : "fly");
          this.behaviourNote = "drawn toward glitch void";
        }
        return;
      }
    }

    if (coverTarget) {
      this.hoverClock += delta;

      if (this.lastHoveredIndex !== hoveredIndex) {
        this.investigationState = null;
        this.lastHoveredIndex = hoveredIndex;
      }

      if (this.mode === "landed") {
        this.perched = true;
        const walk = Math.sin(elapsed * 1.45) * (this.cfg.perchEdgeWalk || 0.055);
        const aliveOffset = coverTarget.right ? coverTarget.right.clone().multiplyScalar(walk) : new THREE.Vector3();
        const settle = coverTarget.position.clone().add(aliveOffset).addScaledVector(coverTarget.up, Math.sin(elapsed * 2.0) * 0.006);
        this.root.position.lerp(settle, this.cfg.coverPerchLerp);
        this.lookAtPoint(coverTarget.position.clone().add(coverTarget.normal), coverTarget.up, 0.12);
        if (this.currentActionKey !== "perch") this.playLoop("perch");

        if (this.trust >= (this.cfg.nestTrustMin || 0.48)) {
          this.maybeDropNest(coverTarget.position, hoveredIndex);
        }

        this.fatigue = clamp01(this.fatigue - delta * (this.cfg.fatigueRestRecovery || 0.18));
        this.behaviourNote = "perched / edge-walking / nesting";
        return;
      }

      if (this.mode === "landing") {
        this.lookAtPoint(coverTarget.position.clone().add(coverTarget.normal), coverTarget.up, 0.12);
        return;
      }

      if (this.mode === "investigateCover") {
        this.updateCoverInvestigation(delta, elapsed, coverTarget);
        return;
      }

      if (this.mode === "approachCover") {
        const distance = this.root.position.distanceTo(coverTarget.position);
        if (distance <= this.cfg.landTriggerDistance) {
          this.setMode("landing", `landing on cover ${hoveredIndex}`);
          this.perched = false;
          this.playOnce("land", "perch");
          if (this.trust >= (this.cfg.nestTrustMin || 0.48)) {
            this.maybeDropNest(coverTarget.position, hoveredIndex);
          }
        }
        this.moveToward(delta, coverTarget.position, this.getPatrolFlightSpeed(elapsed) * (this.mood === "hungry / searching" ? 1.04 : 0.90));
        this.lookAtDirection(this.getTravelFacingDirection(coverTarget.position), this.cfg.turnLerpFast);
        if (this.currentActionKey !== "land" && this.currentActionKey !== "perch") {
          this.playLoop(this.getPatrolFlightAction());
        }
        this.behaviourNote = "approaching perch point";
        return;
      }

      if (this.hoverClock >= this.cfg.hoverPerchDelay && this.mode !== "takeoff" && this.mode !== "backflip") {
        this.startCoverInvestigation(hoveredIndex, coverTarget, elapsed);
        return;
      }
    } else {
      this.hoverClock = 0;
      this.lastHoveredIndex = -1;
      this.investigationState = null;

      if ((this.mode === "landed" || this.mode === "landing") && !hasVoid) {
        this.startTakeoff(elapsed);
        return;
      }

      if (this.mode === "investigateCover" || this.mode === "approachCover") {
        this.setMode("patrol", "cover signal lost");
      }
    }

    if (this.shouldSeekShelter(Boolean(hasVoid), hoveredIndex)) {
      this.setMode("seekShelter", "needs rest / shelter");
    }

    if (this.mode === "seekShelter") {
      this.updateSeekShelter(delta, elapsed, coverWorldData);
      return;
    }

    if (this.shouldFollowPointer(elapsed, hoveredIndex, Boolean(hasVoid))) {
      if (this.mode !== "followPointer") this.setMode("followPointer", "gentle pointer curiosity");
    }

    if (this.mode === "followPointer") {
      this.updatePointerCuriosity(delta, elapsed);
      return;
    }

    if (this.mode !== "patrol") {
      this.setMode("patrol", "returning to ambient loop");
    }

    if (this.mode === "patrol") {
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

      const hungryRestless = this.hunger > 0.55;
      const repickEarly = hungryRestless && Math.sin(elapsed * 1.7) > 0.92;

      if (elapsed >= this.nextPatrolDecisionAt || this.root.position.distanceTo(this.currentPatrolAnchor) < 0.18 || anchorLostLongEnough || repickEarly) {
        this.pickNextPatrolPoint();
      }

      if (this.recoveryAssist) {
        this.currentPatrolAnchor.copy(this.getRecoveryPatrolPoint());
      }

      const patrolTarget = this.currentPatrolAnchor.clone();
      if (hungryRestless) {
        patrolTarget.x += Math.sin(elapsed * 5.7) * 0.08 * this.hunger;
        patrolTarget.y += Math.cos(elapsed * 4.8) * 0.04 * this.hunger;
        patrolTarget.z += Math.cos(elapsed * 6.3) * 0.08 * this.hunger;
      } else if (this.mood === "fed / bright") {
        patrolTarget.x += Math.sin(elapsed * 0.85) * 0.05;
        patrolTarget.z += Math.cos(elapsed * 0.85) * 0.05;
      }

      this.moveToward(delta, patrolTarget, this.getPatrolFlightSpeed(elapsed));
      this.lookAtDirection(this.getTravelFacingDirection(patrolTarget), this.cfg.turnLerpFast);
      this.playLoop(this.getPatrolFlightAction());
      this.behaviourNote = hungryRestless ? "restless broken search pattern" : this.mood === "fed / bright" ? "smooth fed patrol" : "ambient patrol";
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

    // [MOTH PATCH 2026-04-27] Mood-based micro-motion:
    // hungry = broken search twitches, fed = smoother elegant drift, overwhelmed = nervous jitter.
    const elapsed = this.getElapsed();
    const jitterStrength =
      (this.hunger > 0.55 ? this.hunger * 0.105 : 0)
      + (this.mode === "fleeOverwhelmed" ? 0.15 : 0)
      + (this.corruption > 0.45 ? this.corruption * 0.055 : 0);

    if (jitterStrength > 0.001) {
      desired.x += Math.sin(elapsed * 18.7 + this.root.position.y * 3.0) * jitterStrength;
      desired.y += Math.sin(elapsed * 23.1 + this.root.position.x * 2.0) * jitterStrength * 0.55;
      desired.z += Math.cos(elapsed * 16.2 + this.root.position.z * 2.0) * jitterStrength;
    }

    const response = (this.mood === "fed / bright" && this.mode === "patrol")
      ? (this.cfg.velocityResponse || 5.4) * 0.72
      : (this.cfg.velocityResponse || 5.4);

    this.velocity.lerp(desired, 1.0 - Math.exp(-delta * response));

    if (this.recoveryAssist) {
      const recovery = this.getRecoveryPatrolPoint().sub(this.root.position).multiplyScalar(this.cfg.patrolRecoverySpeedScale * delta);
      this.velocity.add(recovery);
    }

    this.root.position.addScaledVector(this.velocity, delta);
    this.clampPointNearCenter(this.root.position);
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
      this.fragmentCount += 2;
      this.setMode("patrol", "void consumed / fed");
      this.pickNextPatrolPoint();
      this.playLoop("fly");
    }
  }

  startTakeoff(elapsed) {
    if (this.mode === "takeoff" || this.mode === "backflip") return;
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

    if (this.mode === "backflip") {
      const bankAlpha = 1.0 - Math.exp(-delta * (this.cfg.visualBankResponse || 7.5));
      const pitchAlpha = 1.0 - Math.exp(-delta * (this.cfg.visualPitchResponse || 6.0));

      this.visualBank = THREE.MathUtils.lerp(this.visualBank, 0, bankAlpha);
      this.visualPitch = THREE.MathUtils.lerp(this.visualPitch, 0, pitchAlpha);

      this.visualRoot.rotation.set(
        this.baseVisualPitch + this.visualPitch,
        this.baseVisualYaw,
        this.baseVisualRoll + this.visualBank
      );
      return;
    }

    if (this.mode === "inspectVoid" || this.mode === "landing") {
      bankTarget *= 0.35;
      pitchTarget *= 0.35;
    }

    if (this.mode === "landed") {
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
    if (direction.lengthSq() <= 0.0001) return;

    const forward = this.temp.a.copy(direction).normalize();
    const up = this.temp.b.copy(preferredUp || this.orientationUp);

    if (up.lengthSq() <= 0.0001) up.set(0, 1, 0);
    up.normalize();

    const parallelLimit = 0.92;
    if (Math.abs(up.dot(forward)) > parallelLimit) {
      up.set(0, 1, 0);
      if (Math.abs(up.dot(forward)) > parallelLimit) {
        up.set(0, 0, 1).applyQuaternion(this.camera.quaternion).normalize();
        if (Math.abs(up.dot(forward)) > parallelLimit) {
          up.set(1, 0, 0);
          if (Math.abs(up.dot(forward)) > parallelLimit) {
            up.set(0, 0, -1);
          }
        }
      }
    }

    const right = this.temp.c.copy(up).cross(forward);
    if (right.lengthSq() <= 0.0001) {
      right.set(1, 0, 0).cross(forward);
      if (right.lengthSq() <= 0.0001) {
        right.set(0, 0, 1).cross(forward);
      }
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
    const smoothing = 1.0 - Math.exp(-this.lastDelta * (this.cfg.headingSmoothing || 10.0));

    if (!this.smoothedHeading || this.smoothedHeading.lengthSq() <= 0.0001) {
      this.smoothedHeading = target.clone();
    } else {
      if (this.smoothedHeading.dot(target) < 0) {
        this.smoothedHeading.copy(this.forward);
      }

      const speedSq = this.velocity.lengthSq();
      const minSpeedSq = Math.pow(this.cfg.headingMinSpeed || 0.08, 2);
      const blend = speedSq < minSpeedSq ? smoothing * 0.45 : smoothing;
      this.smoothedHeading.lerp(target, THREE.MathUtils.clamp(blend, 0.02, 0.5)).normalize();
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
    if (this.mode === "fleeOverwhelmed") return this.cfg.flySpeed * 1.18;
    if (this.isHungry(elapsed)) return this.cfg.flySpeed * this.cfg.flySadSpeedScale;
    if (this.mood === "fed / bright") return this.cfg.flySpeed * 1.06;
    return this.cfg.flySpeed;
  }

  updateNestAnimations(elapsed, coverWorldData) {
    this.nests.forEach((nest, index) => {
      if (nest.type === "cover" && typeof nest.coverIndex === "number") {
        const cover = coverWorldData[nest.coverIndex];
        if (cover?.visible) {
          nest.mesh.position.copy(cover.position)
            .addScaledVector(cover.up, this.coverSize.height * 0.42)
            .addScaledVector(cover.right, 0.03);
          nest.mesh.lookAt(this.camera.position);
        }
      }
      nest.mesh.material.opacity = 0.28 + Math.sin(elapsed * 1.8 + index) * 0.05 + (1 - this.vitality) * 0.18;
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

    const armCount = Math.max(3, this.cfg.voidVortexArms || 7);
    const maxRadius = (this.cfg.voidVortexRadius || 1.08) * (0.70 + energy * 0.38);
    const collapseSpeed = this.cfg.voidVortexCollapseSpeed || 0.42;
    const spinSpeed = this.cfg.voidVortexSpin || 2.25;
    const twist = this.cfg.voidVortexTwist || 11.5;

    for (let i = 0; i < this.voidSeed.length; i += 1) {
      const seed = this.voidSeed[i];
      seed.t = (seed.t + delta * collapseSpeed * (0.58 + energy * 0.88) * seed.spin) % 1;

      const t = seed.t;
      const collapse = Math.pow(1.0 - t, 1.08);
      const armAngle = ((seed.arm || 0) / armCount) * Math.PI * 2;
      const angle = armAngle + seed.angle * 0.24 + elapsed * spinSpeed * (0.35 + seed.spin * 0.24) + collapse * twist;
      const radius = maxRadius * collapse * (0.58 + seed.radius * 0.48);
      const wobble = Math.sin(elapsed * 5.2 + seed.wobble + i * 0.17) * 0.018 * (0.35 + collapse);
      const x = Math.cos(angle) * (radius + wobble);
      const y = Math.sin(angle) * ((radius * 0.72) + wobble);
      const z = -t * (this.cfg.voidDepth || 1.08) * (0.66 + energy * 0.54);

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
    this.voidCore.scale.setScalar((this.cfg.voidVortexRadius || 1.08) * (0.54 + energy * 0.18));
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
      console.log("[Moth] Single left click detected on moth.");
      this.performBackflip();
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
  }

  performBackflip() {
    const backflipAction = this.getAction("backflip");

    if (!backflipAction) {
      console.warn("[Moth] No backflip action is bound.");
      this.flipBusy = false;
      this.mode = this.voidState?.active ? "approachVoid" : "patrol";
      this.playLoop(this.getPatrolFlightAction());
      return;
    }

    const clipDuration = backflipAction.getClip?.().duration || this.actionDurations.get("backflip") || 0;

    console.log("[Moth] Playing backflip clip.", { duration: clipDuration });

    this.flipBusy = true;
    this.perched = false;
    this.mode = "backflip";
    this.takeoffState = null;
    this.backflipGuardUntil = this.getElapsed() + Math.max(clipDuration, 0.1);
    this.backflipState = {
      position: this.root.position.clone(),
      quaternion: this.root.quaternion.clone(),
      forward: this.forward.clone(),
      up: this.orientationUp.clone(),
      duration: clipDuration
    };
    this.root.position.copy(this.backflipState.position);
    this.root.quaternion.copy(this.backflipState.quaternion);
    this.forward.copy(this.backflipState.forward);
    this.orientationUp.copy(this.backflipState.up);
    this.smoothedHeading.copy(this.forward);
    this.velocity.set(0, 0, 0);

    if (!this.playOnce("backflip", this.getPatrolFlightAction())) {
      this.flipBusy = false;
      this.backflipState = null;
      this.backflipGuardUntil = 0;
      this.mode = this.voidState?.active ? "approachVoid" : "patrol";
      this.playLoop(this.getPatrolFlightAction());
    }
  }
}
