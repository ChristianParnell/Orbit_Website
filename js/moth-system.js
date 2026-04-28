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
  storageKey: "orbitSpecterMothV3Stable",
  sizeRatioToModelHeight: 0.0936,
  modelYawOffset: -Math.PI / 2,
  modelPitchOffset: 0,
  modelRollOffset: 0,

  debugOverlay: true,
  meshOpacity: 0.34,
  meshEmissiveIntensity: 0.55,
  binaryPointLimit: 1350,
  binaryPointSizeMin: 0.52,
  binaryPointSizeMax: 1.12,
  binaryBrightness: 1.8,
  auraSize: 0.44,
  auraOpacity: 0.38,
  trailCount: 140,
  trailEmitInterval: 0.055,
  trailLife: 1.15,
  trailDrag: 2.6,
  trailSpeed: 0.20,
  trailJitter: 0.025,

  patrolRadiusMin: 1.72,
  patrolRadiusMax: 3.55,
  patrolHeightMin: -0.10,
  patrolHeightMax: 1.65,
  patrolFrontMin: 0.42,
  patrolFrontMax: 1.45,
  patrolSideSpan: 1.34,
  patrolRepickMin: 4.2,
  patrolRepickMax: 7.6,
  patrolArriveDistance: 0.20,
  patrolViewMargin: 0.86,
  patrolViewYMin: -0.56,
  patrolViewYMax: 0.58,
  patrolRecoveryMargin: 0.98,
  patrolRecoveryDelay: 0.45,

  flySpeed: 0.92,
  diveSpeed: 1.12,
  flySadSpeedScale: 0.58,
  followSpeedScale: 0.64,
  fleeSpeedScale: 0.82,
  approachSlowRadius: 0.74,
  stopDistance: 0.055,
  velocityResponse: 2.55,
  velocityResponseFast: 3.25,
  maxAcceleration: 2.6,
  headingSmoothing: 5.0,
  headingDeadzone: 0.045,
  turnResponse: 4.8,
  turnResponseFast: 6.0,
  turnLerp: 0.12,
  turnLerpFast: 0.16,
  visualBankMax: 0.105,
  visualBankResponse: 3.8,
  visualPitchMax: 0.055,
  visualPitchResponse: 3.6,

  animationFadeLoop: 0.28,
  animationFadeOnce: 0.18,
  backflipLockExtra: 0.10,

  hoverPerchDelay: 0.36,
  investigateCoverDuration: 1.45,
  investigateCoverRadius: 0.23,
  landTriggerDistance: 0.145,
  coverPerchLift: 0.066,
  coverPerchForward: 0.060,
  coverPerchLerp: 0.11,
  perchEdgeWalk: 0.022,
  takeoffRiseHeight: 0.18,

  voidSpawnRadius: 2.25,
  voidHeightMin: -0.9,
  voidHeightMax: 1.8,
  voidHoverRadius: 0.22,
  voidConsumeDistance: 0.20,
  voidInspectDuration: 5.0,
  satiatedDuration: 8.0,
  voidParticleCount: 680,
  voidVortexRadius: 0.78,
  voidVortexSpin: 1.75,
  voidCautionOrbitDuration: 1.75,
  voidCautionOrbitRadius: 0.35,

  vitalityDrainPerSecond: 0.0019,
  vitalityRecoveryPerSecond: 0.010,
  offlineDrainPerHour: 0.035,
  sadThreshold: 0.30,

  interactionTracking: true,
  signalIdleDecay: 0.040,
  signalHoverGain: 0.32,
  signalPointerGain: 0.11,
  hungerSignalWeight: 0.30,
  fatigueFlightGain: 0.034,
  fatigueRestRecovery: 0.16,
  fatigueIdleRecovery: 0.065,
  fatigueShelterThreshold: 0.84,
  overwhelmAggressionThreshold: 0.82,
  overwhelmFatigueThreshold: 0.95,
  overwhelmCorruptionThreshold: 0.82,
  overwhelmDurationMin: 2.35,
  overwhelmDurationMax: 4.35,
  overwhelmCooldown: 3.2,
  trustGainGentle: 0.026,
  trustLossAggressive: 0.055,
  pointerCuriosityTrustMin: 0.34,
  pointerCuriositySignalMin: 0.25,
  pointerCuriosityDistance: 0.42,
  pointerCuriosityCooldown: 0.40,
  shelterCoverIndex: 0,
  shelterAvoidCoverIndex: 2,
  shelterLandDistance: 0.16,
  nestTrustMin: 0.52,
  nestMax: 5,
  nestChancePerPerch: 0.16,
  nestDepositDelay: 8.5,
  voidCorruptionGain: 0.040,
  voidCorruptionDecay: 0.021,
  voidCorruptionFleeThreshold: 0.88,
  stateSaveInterval: 5.0,

  debug: false
};

const ACTION_KEYS = {
  fly: ["f fly", "fly", "flying", "hover", "hover fly", "glide", "move"],
  flySad: ["f fly sad", "fly sad", "sad fly", "tired fly", "weak fly", "hurt fly", "sad"],
  land: ["f land", "landing", "land", "touch down", "touchdown"],
  perch: ["f land idle", "land idle", "perch", "perched", "rest", "idle perched", "idle"],
  takeoff: ["f land to takeoff", "f land to take off", "land to takeoff", "takeoff", "take off", "launch", "lift off", "liftoff"],
  feed: ["f void inspect", "void inspect", "inspect", "feed", "eat", "consume", "sniff"],
  backflip: ["f backflip", "backflip", "flip"]
};

const STATE_VISUALS = {
  booting: { color: "#9fe7ff", aura: 0.30, brightness: 1.15, trail: 0.50 },
  patrolling: { color: "#2fe4ff", aura: 0.38, brightness: 1.28, trail: 0.64 },
  curious: { color: "#33ff88", aura: 0.52, brightness: 1.50, trail: 0.86 },
  "hungry / searching": { color: "#ff8b2d", aura: 0.44, brightness: 1.18, trail: 0.42 },
  "fed / bright": { color: "#ffe166", aura: 0.66, brightness: 1.70, trail: 1.05 },
  "safe / nesting": { color: "#b04dff", aura: 0.46, brightness: 1.34, trail: 0.35 },
  "void drawn": { color: "#33ff88", aura: 0.78, brightness: 1.85, trail: 1.22 },
  feeding: { color: "#5fff77", aura: 0.86, brightness: 2.05, trail: 1.35 },
  corrupted: { color: "#ff57ce", aura: 0.82, brightness: 1.65, trail: 1.05 },
  overwhelmed: { color: "#ff4b4b", aura: 0.60, brightness: 1.18, trail: 0.44 },
  backflip: { color: "#ffffff", aura: 0.72, brightness: 1.82, trail: 0.50 },
  "under-stimulated": { color: "#4b7dff", aura: 0.28, brightness: 0.92, trail: 0.28 }
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
  ctx.shadowColor = "rgba(255,255,255,0.35)";
  ctx.shadowBlur = 16;
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

function createAuraTexture() {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext("2d");
  const grad = ctx.createRadialGradient(128, 128, 2, 128, 128, 128);
  grad.addColorStop(0.0, "rgba(255,255,255,0.90)");
  grad.addColorStop(0.23, "rgba(255,255,255,0.32)");
  grad.addColorStop(0.58, "rgba(255,255,255,0.10)");
  grad.addColorStop(1.0, "rgba(255,255,255,0.0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);
  const texture = new THREE.CanvasTexture(c);
  texture.colorSpace = THREE.SRGBColorSpace;
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

function ensureMaterialArray(value) {
  if (Array.isArray(value)) return value;
  return value ? [value] : [];
}

function makeVisibleMothMaterial(sourceMaterial, opacity, emissiveIntensity, isSkinned) {
  let material = sourceMaterial && typeof sourceMaterial.clone === "function"
    ? sourceMaterial.clone()
    : new THREE.MeshStandardMaterial({ color: new THREE.Color("#b7c6d3"), roughness: 0.86, metalness: 0.04 });

  if (!material.isMeshStandardMaterial && !material.isMeshPhysicalMaterial && !material.isMeshBasicMaterial && !material.isMeshLambertMaterial && !material.isMeshPhongMaterial) {
    material = new THREE.MeshStandardMaterial({ color: new THREE.Color("#b7c6d3"), roughness: 0.86, metalness: 0.04 });
  }

  material.transparent = true;
  material.opacity = opacity;
  material.depthWrite = false;
  material.side = THREE.DoubleSide;
  if (material.color && !material.map) material.color.lerp(new THREE.Color("#b7d8ff"), 0.16);
  if (material.emissive) {
    material.emissive = material.emissive.clone ? material.emissive.clone() : new THREE.Color("#0c2638");
    material.emissive.lerp(new THREE.Color("#1a5d72"), 0.55);
    material.emissiveIntensity = emissiveIntensity;
  }
  if (isSkinned) material.skinning = true;
  material.needsUpdate = true;
  return material;
}

function createBinaryPointsMaterial(atlas) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uAtlas: { value: atlas },
      uTime: { value: 0 },
      uColor: { value: new THREE.Color("#2fe4ff") },
      uAlpha: { value: 1 },
      uBrightness: { value: 1.8 }
    },
    vertexShader: `
      uniform float uTime;
      attribute float aSeed;
      attribute float aDigit;
      attribute float aSize;
      attribute float aAlpha;
      varying float vDigit;
      varying float vAlpha;
      void main() {
        vec3 p = position;
        p += normal * sin(uTime * 1.7 + aSeed * 44.0) * 0.0018;
        vDigit = aDigit;
        vAlpha = aAlpha;
        vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = max(1.8, aSize * (31.0 / max(1.0, -mvPosition.z)));
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform sampler2D uAtlas;
      uniform vec3 uColor;
      uniform float uAlpha;
      uniform float uBrightness;
      varying float vDigit;
      varying float vAlpha;
      void main() {
        vec2 uv = gl_PointCoord;
        vec2 atlasUv = vec2((uv.x + vDigit) * 0.5, uv.y);
        vec4 glyph = texture2D(uAtlas, atlasUv);
        float alpha = glyph.a * vAlpha * uAlpha;
        if (alpha < 0.02) discard;
        gl_FragColor = vec4(uColor * uBrightness, alpha);
      }
    `
  });
}

function createTrailMaterial(atlas) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uAtlas: { value: atlas },
      uTime: { value: 0 },
      uColor: { value: new THREE.Color("#2fe4ff") },
      uAlpha: { value: 0.7 }
    },
    vertexShader: `
      uniform float uTime;
      attribute float aSeed;
      attribute float aLife;
      attribute float aSize;
      varying float vDigit;
      varying float vAlpha;
      void main() {
        vDigit = mod(floor(uTime * 2.0 + aSeed * 10.0), 2.0);
        vAlpha = aLife;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = max(1.5, aSize * (23.0 / max(1.0, -mvPosition.z)) * (0.5 + aLife));
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform sampler2D uAtlas;
      uniform vec3 uColor;
      uniform float uAlpha;
      varying float vDigit;
      varying float vAlpha;
      void main() {
        vec2 uv = gl_PointCoord;
        vec2 atlasUv = vec2((uv.x + vDigit) * 0.5, uv.y);
        vec4 glyph = texture2D(uAtlas, atlasUv);
        float alpha = glyph.a * vAlpha * uAlpha;
        if (alpha < 0.02) discard;
        gl_FragColor = vec4(uColor, alpha);
      }
    `
  });
}

function createVoidMaterial(atlas) {
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
      attribute float aLife;
      varying float vDigit;
      varying float vAlpha;
      void main() {
        vDigit = mod(floor(uTime * 4.0 + aSeed * 30.0), 2.0);
        vAlpha = aLife;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = max(2.0, (0.9 + aSeed * 1.0) * (35.0 / max(1.0, -mvPosition.z)));
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform sampler2D uAtlas;
      uniform float uAlpha;
      varying float vDigit;
      varying float vAlpha;
      void main() {
        vec2 uv = gl_PointCoord;
        vec2 atlasUv = vec2((uv.x + vDigit) * 0.5, uv.y);
        vec4 glyph = texture2D(uAtlas, atlasUv);
        float alpha = glyph.a * vAlpha * uAlpha;
        if (alpha < 0.02) discard;
        vec3 color = mix(vec3(0.0, 1.0, 0.15), vec3(0.62, 1.0, 0.32), vAlpha);
        gl_FragColor = vec4(color, alpha);
      }
    `
  });
}

export class MothSystem {
  constructor(options = {}) {
    this.scene = options.scene;
    this.camera = options.camera;
    this.renderer = options.renderer;
    this.orbitRoot = options.orbitRoot || options.scene;
    this.centralModel = options.centralModel || null;
    this.palette = Array.isArray(options.palette) && options.palette.length ? options.palette : DEFAULT_PALETTE;
    this.lightDir = options.lightDir || new THREE.Vector3(0.75, 1.1, 0.55).normalize();
    this.assets = options.assets || {};
    this.cfg = { ...DEFAULT_CONFIG, ...(options.config || {}) };
    this.coverSize = options.coverSize || { width: 0.84, height: 0.50 };
    this.orbitCenter = options.orbitCenter ? options.orbitCenter.clone() : new THREE.Vector3();
    this.debug = typeof options.debug === "function" ? options.debug : null;
    this.getElapsed = typeof options.getElapsed === "function" ? options.getElapsed : (() => 0);

    this.glyphAtlas = options.glyphAtlas || createBinaryGlyphAtlas();
    this.auraTexture = createAuraTexture();
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
    this.boundClipNames = new Map();
    this.currentActionKey = "";
    this.pendingActionKey = "";
    this.hitProxy = null;
    this.binaryShell = null;
    this.binaryMaterial = null;
    this.trail = null;
    this.auraSprite = null;
    this.stateLight = null;
    this.meshMaterials = [];

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
    this.trust = clamp01(this.saved.trust ?? 0.48);
    this.corruption = clamp01(this.saved.corruption ?? 0);
    this.fragmentCount = Number(this.saved.fragments || 0);
    this.lastSaveAt = 0;
    this.lastNestDropAt = 0;

    this.ready = false;
    this.visible = true;
    this.mode = "patrol";
    this.mood = "booting";
    this.behaviourNote = "booting";
    this.perched = false;
    this.flipBusy = false;

    this.currentPatrolAnchor = new THREE.Vector3();
    this.lastStableTarget = new THREE.Vector3();
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

    this.hunger = clamp01(1.0 - this.vitality);
    this.signal = 0.36;
    this.fatigue = 0.10;
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
    this.lastPointerCuriosityAt = -999;
    this.investigationState = null;
    this.fleeState = null;
    this.lastFleeAt = -999;
    this.voidOrbitState = null;
    this.lastHoveredIndex = -1;
    this.lastMoodLogAt = 0;
    this.takeoffState = null;
    this.backflipState = null;
    this.backflipGuardUntil = 0;

    this.debugOverlayVisible = this.cfg.debugOverlay !== false;
    this.debugOverlayElement = null;
    this.debugOverlayBody = null;
    this.debugOverlayLog = null;
    this.debugHistory = [];
    this.lastDebugMode = this.mode;
    this.lastDebugAction = this.currentActionKey || "none";

    this.boundInteractionPointerMove = (event) => this.handleInteractionPointerMove(event);
    this.boundInteractionPointerDown = (event) => this.handleInteractionPointerDown(event);
    this.boundInteractionWheel = (event) => this.handleInteractionWheel(event);
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
      pointer: new THREE.Vector2(),
      raycaster: new THREE.Raycaster(),
      sphere: new THREE.Sphere(this.orbitCenter.clone(), this.cfg.voidSpawnRadius),
      plane: new THREE.Plane(new THREE.Vector3(0, 1, 0), -this.orbitCenter.y),
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
      speed01 = THREE.MathUtils.clamp((Math.hypot(dx, dy) / diagonal) / dt * 1.10, 0, 1);
    }

    this.lastPointerClient.x = x;
    this.lastPointerClient.y = y;
    this.lastPointerEventAt = now;
    this.lastInputAt = now;

    const gentle = smooth01(1.0 - Math.abs(speed01 - 0.18) * 3.0);
    const aggressive = smooth01((speed01 - 0.72) / 0.28);
    this.pointerEnergy = Math.max(this.pointerEnergy, speed01);
    this.pointerGentle = Math.max(this.pointerGentle, gentle * (1.0 - aggressive));
    this.aggression = Math.max(this.aggression, aggressive);
    this.inputEnergy = Math.max(this.inputEnergy, Math.max(speed01 * 0.38, gentle * 0.42));

    this.temp.pointer.x = ((x - bounds.left) / Math.max(1, bounds.width)) * 2 - 1;
    this.temp.pointer.y = -((y - bounds.top) / Math.max(1, bounds.height)) * 2 + 1;
    this.temp.raycaster.setFromCamera(this.temp.pointer, this.camera);
    const target = this.pickPointFromCurrentRay(this.cfg.pointerCuriosityDistance || 0.42);
    if (target) {
      this.pointerWorldTarget.copy(target);
      this.pointerWorldTargetValid = true;
    }
  }

  handleInteractionPointerDown(event) {
    if (!event || (typeof event.button === "number" && event.button !== 0)) return;
    this.lastInputAt = this.getElapsed();
    this.inputEnergy = Math.max(this.inputEnergy, 0.26);
    this.aggression = Math.max(this.aggression, 0.10);
  }

  handleInteractionWheel(event) {
    const amount = Math.abs(Number(event?.deltaY || 0)) / 1100;
    const wheel01 = THREE.MathUtils.clamp(amount, 0, 1);
    this.scrollEnergy = Math.max(this.scrollEnergy, wheel01);
    this.inputEnergy = Math.max(this.inputEnergy, wheel01 * 0.48);
    this.aggression = Math.max(this.aggression, smooth01((wheel01 - 0.58) / 0.40));
    this.lastInputAt = this.getElapsed();
  }

  pickPointFromCurrentRay(preferredOffset = 0.42) {
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
    const fromCamera = hit.clone().sub(this.camera.position);
    if (fromCamera.lengthSq() > 0.0001) hit.addScaledVector(fromCamera.normalize(), -preferredOffset);
    hit.y = THREE.MathUtils.clamp(hit.y, this.orbitCenter.y + this.cfg.patrolHeightMin, this.orbitCenter.y + this.cfg.patrolHeightMax);
    return this.clampPointNearCenter(hit);
  }

  decayInteractionEnergy(delta) {
    this.pointerEnergy *= Math.exp(-delta * 3.4);
    this.pointerGentle *= Math.exp(-delta * 2.0);
    this.scrollEnergy *= Math.exp(-delta * 2.6);
    this.aggression *= Math.exp(-delta * 1.55);
    this.inputEnergy *= Math.exp(-delta * 1.7);
    if (this.getElapsed() - this.lastPointerEventAt > 2.0) this.pointerWorldTargetValid = false;
  }

  updateNeedsAndMood(delta, elapsed, hoveredIndex, hasVoid) {
    this.decayInteractionEnergy(delta);
    const hoveredSignal = hoveredIndex >= 0 ? this.cfg.signalHoverGain : 0;
    const pointerSignal = this.pointerGentle * (this.cfg.signalPointerGain || 0.11);
    const voidSignal = hasVoid ? 0.30 : 0;
    const activeSignal = hoveredSignal + pointerSignal + voidSignal + this.inputEnergy * 0.10;

    this.signal = clamp01(
      this.signal
      + delta * activeSignal
      - delta * (this.cfg.signalIdleDecay || 0.040) * (activeSignal > 0 ? 0.35 : 1.0)
    );

    const signalWeight = this.cfg.hungerSignalWeight || 0.30;
    this.hunger = clamp01((1.0 - this.vitality) * (1.0 - signalWeight) + (1.0 - this.signal) * signalWeight);

    const moving = this.velocity.length() / Math.max(0.001, this.cfg.flySpeed || 1.0);
    const flightFatigue = moving * (this.cfg.fatigueFlightGain || 0.034);
    const restRecovery = this.mode === "landed" ? (this.cfg.fatigueRestRecovery || 0.16) : (this.cfg.fatigueIdleRecovery || 0.065);
    this.fatigue = clamp01(this.fatigue + delta * flightFatigue + this.aggression * delta * 0.035 - delta * restRecovery);

    const gentleTrust = this.pointerGentle > 0.12 && this.aggression < 0.16;
    this.trust = clamp01(
      this.trust
      + delta * (gentleTrust ? (this.cfg.trustGainGentle || 0.026) : 0)
      - delta * this.aggression * (this.cfg.trustLossAggressive || 0.055)
    );

    const corruptionGain = this.mode === "inspectVoid" ? this.cfg.voidCorruptionGain : this.mode === "orbitVoid" ? this.cfg.voidCorruptionGain * 0.22 : 0;
    this.corruption = clamp01(this.corruption + delta * corruptionGain - delta * (this.cfg.voidCorruptionDecay || 0.021));

    let nextMood = "patrolling";
    if (this.mode === "backflip") nextMood = "backflip";
    else if (this.mode === "inspectVoid") nextMood = "feeding";
    else if (this.mode === "landed" || this.mode === "landing" || this.mode === "seekShelter") nextMood = "safe / nesting";
    else if (this.corruption >= (this.cfg.overwhelmCorruptionThreshold || 0.82)) nextMood = "corrupted";
    else if (this.mode === "fleeOverwhelmed") nextMood = "overwhelmed";
    else if (hasVoid) nextMood = "void drawn";
    else if (this.hunger > 0.64) nextMood = "hungry / searching";
    else if (elapsed < this.satiatedUntil || this.vitality > 0.74) nextMood = "fed / bright";
    else if (hoveredIndex >= 0 || this.pointerGentle > 0.18) nextMood = "curious";
    else if (this.signal < 0.22) nextMood = "under-stimulated";

    if (nextMood !== this.mood && elapsed - this.lastMoodLogAt > 0.12) {
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
      ["visible", this.getStateVisualName()],
      ["anim", action],
      ["clip", this.boundClipNames?.get?.(action) || "—"],
      ["behaviour", this.behaviourNote || "—"],
      ["target", target],
      ["vitality", this.vitality.toFixed(2)],
      ["hunger", this.hunger.toFixed(2)],
      ["signal", this.signal.toFixed(2)],
      ["fatigue", this.fatigue.toFixed(2)],
      ["trust", this.trust.toFixed(2)],
      ["corrupt", this.corruption.toFixed(2)],
      ["aggression", this.aggression.toFixed(2)],
      ["speed", this.velocity.length().toFixed(2)],
      ["fragments", String(this.fragmentCount || 0)],
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
      this.log("moth asset load failed; using fallback", "WARN");
      console.warn("[Moth] FBX load failed", error);
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
      new THREE.MeshStandardMaterial({ color: "#a9b8c7", emissive: "#16384d", emissiveIntensity: 0.45, roughness: 0.88, transparent: true, opacity: 0.9 })
    );
    body.rotation.z = Math.PI * 0.5;
    group.add(body);
    const wingMat = new THREE.MeshStandardMaterial({ color: "#8ea2b6", emissive: "#143246", emissiveIntensity: 0.38, roughness: 0.92, transparent: true, opacity: 0.82, side: THREE.DoubleSide });
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
    return group;
  }

  setupModel(model, clips) {
    this.modelRoot = model.scene || model;
    this.visualRoot.add(this.modelRoot);
    this.visualRoot.rotation.set(this.baseVisualPitch, this.baseVisualYaw, this.baseVisualRoll);
    this.meshMaterials.length = 0;

    this.modelRoot.traverse((child) => {
      if (!child.isMesh) return;
      child.visible = true;
      child.frustumCulled = false;
      if (child.geometry && !child.geometry.attributes.normal && typeof child.geometry.computeVertexNormals === "function") child.geometry.computeVertexNormals();
      const materials = ensureMaterialArray(child.material);
      const meshOpacity = THREE.MathUtils.clamp(this.cfg.meshOpacity ?? 0.34, 0.02, 1.0);
      const emissiveIntensity = this.cfg.meshEmissiveIntensity ?? 0.55;
      if (materials.length) {
        child.material = materials.map((sourceMaterial) => makeVisibleMothMaterial(sourceMaterial, meshOpacity, emissiveIntensity, child.isSkinnedMesh));
      } else {
        child.material = makeVisibleMothMaterial(null, meshOpacity, emissiveIntensity, child.isSkinnedMesh);
      }
      ensureMaterialArray(child.material).forEach((mat) => this.meshMaterials.push(mat));
      if (Array.isArray(child.material) && child.material.length === 1) child.material = child.material[0];
    });

    this.fitMothScale();
    this.setupAnimations(clips);
    this.buildBinaryShell();
    this.buildAura();
    this.buildTrail();
    this.buildHitProxy();
    this.pickNextPatrolPoint(true);
    this.ready = true;
    this.playLoop(this.getPatrolFlightAction());
    this.log("specter moth online · stable navigation", "BOOT");
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
    this.modelRoot.position.set(-mothCenter.x * scale, -mothCenter.y * scale, -mothCenter.z * scale);
  }

  setupAnimations(clips) {
    const availableClips = collectAnimationClips(this.modelRoot, clips);
    if (!availableClips.length || !this.modelRoot) {
      this.log("moth loaded without animation clips", "WARN");
      this.pushDebugLine("ANIM", "no FBX clips found on moth root");
      return;
    }

    this.mixer = new THREE.AnimationMixer(this.modelRoot);
    this.actions.clear();
    this.actionDurations.clear();
    this.boundClipNames.clear();

    const uniqueClips = [];
    const seen = new Set();
    availableClips.forEach((clip) => {
      if (!clip || !clip.name || !clip.duration) return;
      const key = `${normalizeName(clip.name)}_${clip.duration.toFixed(3)}`;
      if (seen.has(key)) return;
      seen.add(key);
      uniqueClips.push(clip);
    });

    const clipNames = uniqueClips.map((clip) => clip.name);
    console.log("[Moth] Available animation clips:", clipNames);
    this.pushDebugLine("CLIPS", clipNames.length ? clipNames.join(" · ") : "none");

    const exactClipNames = {
      fly: ["F_Fly", "F Fly", "Fly"],
      flySad: ["F_Fly_Sad", "F Fly Sad", "Fly Sad"],
      land: ["F_Land", "F Land", "Land"],
      perch: ["F_Land_Idle", "F Land Idle", "Land Idle"],
      takeoff: ["F_Land_to_TakeOff", "F_Land_to_Takeoff", "F Land to TakeOff", "F Land To Take Off", "Land to TakeOff"],
      feed: ["F_Void_Inspect", "F Void Inspect", "Void Inspect"],
      backflip: ["F_Backflip", "F Backflip", "Backflip"]
    };

    const createAction = (clip) => {
      const action = this.mixer.clipAction(clip, this.modelRoot);
      action.enabled = true;
      action.paused = false;
      action.clampWhenFinished = true;
      action.zeroSlopeAtStart = true;
      action.zeroSlopeAtEnd = true;
      action.setEffectiveTimeScale(1);
      action.setEffectiveWeight(1);
      return action;
    };

    const findExactClip = (names) => {
      const normalized = names.map((name) => normalizeName(name));
      for (const wanted of names) {
        const exact = uniqueClips.find((clip) => clip.name === wanted);
        if (exact) return exact;
      }
      for (const wanted of normalized) {
        const exact = uniqueClips.find((clip) => normalizeName(clip.name) === wanted);
        if (exact) return exact;
      }
      return null;
    };

    const bindClip = (actionKey, clip, reason = "matched") => {
      if (!clip) return false;
      const action = createAction(clip);
      this.actions.set(actionKey, action);
      this.actionDurations.set(actionKey, clip.duration);
      this.boundClipNames.set(actionKey, clip.name);
      this.pushDebugLine("BIND", `${actionKey} → ${clip.name} (${reason})`);
      return true;
    };

    Object.entries(exactClipNames).forEach(([actionKey, names]) => {
      bindClip(actionKey, findExactClip(names), "exact");
    });

    Object.entries(ACTION_KEYS).forEach(([actionKey, patterns]) => {
      if (this.actions.has(actionKey)) return;
      bindClip(actionKey, chooseBestClip(uniqueClips, patterns), "fallback");
    });

    if (!this.actions.has("flySad") && this.actions.has("fly")) {
      this.actions.set("flySad", this.actions.get("fly"));
      this.actionDurations.set("flySad", this.actionDurations.get("fly") || 0);
      this.boundClipNames.set("flySad", `${this.boundClipNames.get("fly") || "fly"} [fallback]`);
      this.pushDebugLine("BIND", "flySad → fly fallback");
    }

    if (!this.actions.has("perch") && this.actions.has("land")) {
      this.actions.set("perch", this.actions.get("land"));
      this.actionDurations.set("perch", this.actionDurations.get("land") || 0);
      this.boundClipNames.set("perch", `${this.boundClipNames.get("land") || "land"} [fallback]`);
      this.pushDebugLine("BIND", "perch → land fallback");
    }

    if (!this.actions.size) {
      this.log(`moth clips found but no state mappings matched: ${clipNames.join(", ")}`, "WARN");
      this.pushDebugLine("ANIM", "clips found, but no mappings matched");
      return;
    }

    this.mixer.addEventListener("finished", (event) => this.onActionFinished(event));
    this.log(`moth animation states: ${Array.from(this.actions.keys()).join(", ")}`, "BOOT");
    console.table(Array.from(this.boundClipNames.entries()).map(([state, clip]) => ({ state, clip })));

    this.currentActionKey = "";
    this.pendingActionKey = "";
    this.playLoop(this.getPatrolFlightAction());
  }

  getAction(key) {
    return this.actions.get(key) || null;
  }

  onActionFinished(event) {
    const finishedAction = event?.action || null;
    const activeAction = this.currentActionKey ? this.getAction(this.currentActionKey) : null;
    if (finishedAction && activeAction && finishedAction !== activeAction) return;

    if (this.currentActionKey === "land" && this.pendingActionKey === "perch") {
      this.pendingActionKey = "";
      this.perched = true;
      this.setMode("landed", "settled on perch");
      this.playLoop("perch");
      return;
    }

    if (this.currentActionKey === "takeoff") {
      const next = this.pendingActionKey || this.getPatrolFlightAction();
      this.pendingActionKey = "";
      this.perched = false;
      this.setMode(this.voidState?.active ? "approachVoid" : "patrol", "takeoff complete");
      this.takeoffState = null;
      this.playLoop(next);
      return;
    }

    if (this.currentActionKey === "backflip") {
      const guardDelta = Math.max(0.035, this.lastDelta * 2.0);
      if ((this.backflipGuardUntil || 0) > 0 && this.getElapsed() + guardDelta < this.backflipGuardUntil) return;
      this.finishBackflip();
      return;
    }

    if (this.pendingActionKey) {
      const next = this.pendingActionKey;
      this.pendingActionKey = "";
      this.playLoop(next);
    }
  }

  playLoop(key) {
    if (this.mode === "backflip" && this.currentActionKey === "backflip" && key !== "backflip") return false;

    const next = this.getAction(key);
    if (!next) {
      this.pushDebugLine("ANIM", `missing loop action: ${key}`);
      return false;
    }

    const previousKey = this.currentActionKey || "none";
    const fade = this.cfg.animationFadeLoop || 0.28;
    const previous = this.currentActionKey ? this.getAction(this.currentActionKey) : null;

    next.enabled = true;
    next.paused = false;
    next.stopFading();
    next.setEffectiveTimeScale(1);
    next.setEffectiveWeight(1);
    next.setLoop(THREE.LoopRepeat, Infinity);
    next.clampWhenFinished = false;

    if (this.currentActionKey === key) {
      if (!next.isRunning()) next.play();
      return true;
    }

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
    this.pushDebugLine("ANIM", `${previousKey} → ${key} loop · ${this.boundClipNames.get(key) || "unknown clip"}`);
    return true;
  }

  playOnce(key, followUp = "") {
    if (this.mode === "backflip" && this.currentActionKey === "backflip" && key !== "backflip") return false;

    const next = this.getAction(key);
    if (!next) {
      this.pushDebugLine("ANIM", `missing one-shot action: ${key}`);
      if (followUp) this.playLoop(followUp);
      return false;
    }

    const previousKey = this.currentActionKey || "none";
    const fade = this.cfg.animationFadeOnce || 0.20;
    const previous = this.currentActionKey ? this.getAction(this.currentActionKey) : null;

    this.pendingActionKey = followUp;
    next.enabled = true;
    next.paused = false;
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
    this.pushDebugLine("ANIM", `${previousKey} → ${key} once · ${this.boundClipNames.get(key) || "unknown clip"}${followUp ? " → " + followUp : ""}`);
    return true;
  }

  ensureAnimationPlayback(elapsed) {
    if (!this.mixer || !this.actions.size) return;

    let desired = "";
    if (this.mode === "backflip") desired = "backflip";
    else if (this.mode === "landed") desired = "perch";
    else if (this.mode === "landing") desired = this.currentActionKey === "land" ? "land" : "";
    else if (this.mode === "takeoff") desired = this.currentActionKey === "takeoff" ? "takeoff" : "";
    else if (this.mode === "inspectVoid" || this.mode === "orbitVoid") desired = "feed";
    else desired = this.getPatrolFlightAction();

    if (!desired) return;
    const action = this.getAction(desired);
    if (!action) return;

    if (this.currentActionKey !== desired && this.mode !== "landing" && this.mode !== "takeoff") {
      this.playLoop(desired);
      return;
    }

    if (!action.isRunning()) {
      action.enabled = true;
      action.paused = false;
      action.setEffectiveTimeScale(1);
      action.setEffectiveWeight(1);
      action.play();
      this.pushDebugLine("ANIM", `revived ${desired} · ${this.boundClipNames.get(desired) || "unknown clip"}`);
    }
  }

  buildBinaryShell() {
    if (!this.modelRoot) return;
    this.modelRoot.updateMatrixWorld(true);
    this.visualRoot.updateMatrixWorld(true);
    const samples = [];
    const meshes = [];
    this.modelRoot.traverse((child) => {
      if (child.isMesh && child.geometry?.attributes?.position) meshes.push(child);
    });
    const totalVerts = meshes.reduce((sum, mesh) => sum + mesh.geometry.attributes.position.count, 0);
    if (!totalVerts) return;
    const limit = this.cfg.binaryPointLimit || 1350;
    meshes.forEach((mesh) => {
      const pos = mesh.geometry.attributes.position;
      const nor = mesh.geometry.attributes.normal;
      const target = Math.max(24, Math.round(limit * (pos.count / Math.max(1, totalVerts))));
      const step = Math.max(1, Math.floor(pos.count / target));
      const invVisual = new THREE.Matrix4().copy(this.visualRoot.matrixWorld).invert();
      const normalMatrix = new THREE.Matrix3().getNormalMatrix(mesh.matrixWorld);
      for (let i = 0; i < pos.count; i += step) {
        const p = new THREE.Vector3().fromBufferAttribute(pos, i).applyMatrix4(mesh.matrixWorld).applyMatrix4(invVisual);
        const n = nor ? new THREE.Vector3().fromBufferAttribute(nor, i).applyMatrix3(normalMatrix).normalize() : new THREE.Vector3(0, 1, 0);
        samples.push({ p, n });
        if (samples.length >= limit) break;
      }
    });
    const count = samples.length;
    if (!count) return;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const normals = new Float32Array(count * 3);
    const digits = new Float32Array(count);
    const sizes = new Float32Array(count);
    const alphas = new Float32Array(count);
    const seeds = new Float32Array(count);
    for (let i = 0; i < count; i += 1) {
      const s = samples[i];
      const base = i * 3;
      positions[base] = s.p.x;
      positions[base + 1] = s.p.y;
      positions[base + 2] = s.p.z;
      normals[base] = s.n.x;
      normals[base + 1] = s.n.y;
      normals[base + 2] = s.n.z;
      digits[i] = Math.random() > 0.5 ? 1 : 0;
      sizes[i] = randomFromRange(this.cfg.binaryPointSizeMin, this.cfg.binaryPointSizeMax);
      alphas[i] = randomFromRange(0.46, 0.95);
      seeds[i] = Math.random();
    }
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("normal", new THREE.BufferAttribute(normals, 3));
    geometry.setAttribute("aDigit", new THREE.BufferAttribute(digits, 1));
    geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute("aAlpha", new THREE.BufferAttribute(alphas, 1));
    geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
    this.binaryMaterial = createBinaryPointsMaterial(this.glyphAtlas);
    this.binaryShell = new THREE.Points(geometry, this.binaryMaterial);
    this.binaryShell.frustumCulled = false;
    this.binaryShell.renderOrder = 12;
    this.visualRoot.add(this.binaryShell);
  }

  buildAura() {
    const material = new THREE.SpriteMaterial({
      map: this.auraTexture,
      transparent: true,
      opacity: this.cfg.auraOpacity,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      color: new THREE.Color("#2fe4ff")
    });
    this.auraSprite = new THREE.Sprite(material);
    this.auraSprite.name = "SpecterMothStateAura";
    this.auraSprite.scale.setScalar(this.cfg.auraSize);
    this.auraSprite.renderOrder = 10;
    this.root.add(this.auraSprite);

    this.stateLight = new THREE.PointLight(new THREE.Color("#2fe4ff"), 0.32, 1.5, 2.0);
    this.stateLight.name = "SpecterMothStateLight";
    this.root.add(this.stateLight);
  }

  buildTrail() {
    const count = this.cfg.trailCount;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const seeds = new Float32Array(count);
    const life = new Float32Array(count);
    for (let i = 0; i < count; i += 1) {
      positions[i * 3] = 9999;
      positions[i * 3 + 1] = 9999;
      positions[i * 3 + 2] = 9999;
      sizes[i] = randomFromRange(0.65, 1.25);
      seeds[i] = Math.random();
      life[i] = 0;
    }
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));
    geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
    geometry.setAttribute("aLife", new THREE.BufferAttribute(life, 1).setUsage(THREE.DynamicDrawUsage));
    const material = createTrailMaterial(this.glyphAtlas);
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

  buildHitProxy() {
    const box = new THREE.Box3().setFromObject(this.visualRoot);
    const size = box.getSize(new THREE.Vector3());
    const radius = THREE.MathUtils.clamp(Math.max(size.x, size.y, size.z) * 0.65, 0.10, 0.22);
    const proxy = new THREE.Mesh(
      new THREE.SphereGeometry(radius, 12, 12),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
    );
    proxy.name = "SpecterMothHitProxy";
    this.hitProxy = proxy;
    this.root.add(proxy);
  }

  initVoidVisuals() {
    const count = this.cfg.voidParticleCount;
    const positions = new Float32Array(count * 3);
    const aLife = new Float32Array(count);
    const aSeed = new Float32Array(count);
    for (let i = 0; i < count; i += 1) {
      aLife[i] = Math.random();
      aSeed[i] = Math.random();
      this.voidSeed.push({ angle: Math.random() * Math.PI * 2, radius: randomFromRange(0.2, 1.0), t: Math.random(), spin: randomFromRange(0.8, 1.8), wobble: Math.random() * Math.PI * 2 });
    }
    this.voidGeometry = new THREE.BufferGeometry();
    this.voidGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));
    this.voidGeometry.setAttribute("aLife", new THREE.BufferAttribute(aLife, 1).setUsage(THREE.DynamicDrawUsage));
    this.voidGeometry.setAttribute("aSeed", new THREE.BufferAttribute(aSeed, 1));
    this.voidMaterial = createVoidMaterial(this.glyphAtlas);
    this.voidPoints = new THREE.Points(this.voidGeometry, this.voidMaterial);
    this.voidPoints.visible = false;
    this.voidPoints.renderOrder = 13;
    this.voidGroup.add(this.voidPoints);

    const coreMat = new THREE.SpriteMaterial({ map: this.auraTexture, transparent: true, opacity: 0.65, depthWrite: false, blending: THREE.AdditiveBlending, color: new THREE.Color("#33ff88") });
    this.voidCore = new THREE.Sprite(coreMat);
    this.voidCore.visible = false;
    this.voidCore.scale.setScalar(0.52);
    this.voidCore.renderOrder = 12;
    this.voidGroup.add(this.voidCore);
  }

  spawnNestAt(position, rotation, scale = 0.14, type = "ground", coverIndex = null, forcedId = "") {
    if (this.nests.length >= this.cfg.nestMax) return null;
    const nest = new THREE.Mesh(
      new THREE.PlaneGeometry(0.32, 0.32, 1, 1),
      new THREE.MeshBasicMaterial({ map: this.messTexture, transparent: true, opacity: 0.58, depthWrite: false, blending: THREE.AdditiveBlending, color: new THREE.Color("#d6efff") })
    );
    nest.position.copy(position);
    nest.rotation.copy(rotation);
    nest.scale.setScalar(scale);
    nest.renderOrder = 4;
    this.nestGroup.add(nest);
    const entry = { id: forcedId || `nest_${Date.now()}_${Math.floor(Math.random() * 9999)}`, mesh: nest, position: nest.position.clone(), rotation: nest.rotation.clone(), scale, type, coverIndex };
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
    if (this.trail?.points) this.trail.points.visible = this.visible;
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
    if (horizontalLen > this.cfg.patrolRadiusMax) horizontal.setLength(this.cfg.patrolRadiusMax);
    else if (horizontalLen < this.cfg.patrolRadiusMin) {
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
      .addScaledVector(camForward, 0.56)
      .addScaledVector(camRight, THREE.MathUtils.clamp(this.temp.screen.x * 0.42, -0.34, 0.34));
    p.y = this.orbitCenter.y + 0.48;
    return this.clampPointNearCenter(p);
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
    for (let i = 0; i < 32; i += 1) {
      const front = randomFromRange(this.cfg.patrolFrontMin, this.cfg.patrolFrontMax);
      const side = randomFromRange(-this.cfg.patrolSideSpan, this.cfg.patrolSideSpan);
      const verticalT = Math.pow(Math.random(), 1.4);
      const p = new THREE.Vector3()
        .copy(this.orbitCenter)
        .addScaledVector(camForward, front)
        .addScaledVector(camRight, side);
      p.y = this.orbitCenter.y + THREE.MathUtils.lerp(this.cfg.patrolHeightMin, this.cfg.patrolHeightMax, verticalT);
      this.clampPointNearCenter(p);
      if (this.worldPointComfortablyVisible(p) || i === 31) {
        candidate = p;
        break;
      }
    }
    if (!candidate) candidate = this.getRecoveryPatrolPoint();
    this.currentPatrolAnchor.copy(candidate);
    this.lastStableTarget.copy(candidate);
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
    return { position, normal, up: cover.up.clone(), right: cover.right.clone(), index };
  }

  getVoidInspectTarget() {
    if (!this.voidState?.active) return null;
    const toCamera = this.temp.a.copy(this.camera.position).sub(this.voidState.position).normalize();
    const inspectPos = new THREE.Vector3().copy(this.voidState.position).addScaledVector(toCamera, this.cfg.voidHoverRadius).add(new THREE.Vector3(0, 0.04, 0));
    return { position: inspectPos, lookAt: this.voidState.position.clone() };
  }

  getPatrolFlightAction() {
    return this.isHungry(this.getElapsed()) ? "flySad" : "fly";
  }

  isHungry(elapsed) {
    return !(this.voidState?.active) && elapsed >= this.satiatedUntil && this.vitality < 0.62;
  }

  update(context = {}) {
    if (!this.ready) return;
    const {
      delta = 1 / 60,
      elapsed = this.getElapsed(),
      introActive = false,
      introComplete = true,
      hoveredEntry = null,
      hoveredIndex = -1,
      coverWorldData = []
    } = context;

    const sceneVisible = introComplete && !introActive;
    this.setVisibility(sceneVisible);
    if (!sceneVisible) return;

    this.lastDelta = Math.max(1 / 240, delta || 1 / 60);
    if (this.mixer) this.mixer.update(delta);

    if (this.mode === "backflip" && this.backflipState) {
      this.lockBackflipTransform();
    }

    const hasVoid = this.voidState?.active;
    const hungry = this.isHungry(elapsed);
    if (hungry && !hasVoid) this.vitality = clamp01(this.vitality - delta * this.cfg.vitalityDrainPerSecond);
    else {
      const recoveryMultiplier = this.mode === "inspectVoid" ? 1.25 : this.mode === "landed" ? 0.55 : 0.25;
      this.vitality = clamp01(this.vitality + delta * this.cfg.vitalityRecoveryPerSecond * recoveryMultiplier);
    }

    this.updateNeedsAndMood(delta, elapsed, hoveredIndex, Boolean(hasVoid));
    this.updateStateAndMotion(delta, elapsed, hoveredEntry, hoveredIndex, coverWorldData);
    this.ensureAnimationPlayback(elapsed);
    this.updateFlightPose(delta);
    this.updateVisibleState(delta, elapsed);
    this.updateVoidVisual(elapsed, delta);
    this.updateNestAnimations(elapsed, coverWorldData);
    this.updateTrail(delta, elapsed);
    this.updateDebugOverlay(elapsed, hoveredIndex);
    this.saveState(false);
  }

  updateStateAndMotion(delta, elapsed, hoveredEntry, hoveredIndex, coverWorldData) {
    const hasVoid = this.voidState?.active;
    const coverTarget = (!hasVoid && hoveredIndex >= 0 && Array.isArray(coverWorldData)) ? this.getCoverPerchTarget(hoveredIndex, coverWorldData) : null;
    const voidTarget = hasVoid ? this.getVoidInspectTarget() : null;

    if (this.shouldFleeFromOverwhelm(elapsed)) this.startFleeOverwhelmed(elapsed, this.corruption > 0.82 ? "corruption overload" : "input spike");

    if (this.mode === "backflip") {
      this.velocity.set(0, 0, 0);
      this.lockBackflipTransform();
      const action = this.getAction("backflip");
      const duration = this.backflipState?.duration || action?.getClip?.().duration || this.actionDurations.get("backflip") || 0;
      if (action && duration > 0 && action.time >= Math.max(0, duration - Math.max(0.035, this.lastDelta * 2))) this.finishBackflip();
      return;
    }

    if (this.mode === "takeoff") {
      this.updateTakeoffMotion(elapsed);
      return;
    }

    if (this.mode === "fleeOverwhelmed") {
      this.updateFleeOverwhelmed(delta, elapsed);
      return;
    }

    if (hasVoid && voidTarget) {
      this.hoverClock = 0;
      this.investigationState = null;
      if (this.mode === "landed" || this.mode === "landing" || this.mode === "seekShelter") {
        this.startTakeoff(elapsed);
        return;
      }
      if (this.mode === "inspectVoid") {
        this.updateVoidInspect(delta, elapsed, voidTarget);
        return;
      }
      if (this.mode === "orbitVoid") {
        this.updateVoidOrbit(delta, elapsed, voidTarget);
        return;
      }
      if (this.mode !== "approachVoid") this.setMode("approachVoid", "void signal detected");
      this.moveToward(delta, voidTarget.position, this.cfg.diveSpeed * 0.82, { response: this.cfg.velocityResponse });
      this.lookAtDirection(this.getTravelFacingDirection(voidTarget.position), this.cfg.turnLerpFast);
      this.playLoop(this.corruption > 0.55 ? this.getPatrolFlightAction() : "fly");
      this.behaviourNote = "drawn toward glitch void";
      if (this.root.position.distanceTo(voidTarget.position) <= this.cfg.voidConsumeDistance) this.startVoidOrbit(elapsed);
      return;
    }

    if (coverTarget) {
      this.hoverClock += delta;
      if (this.lastHoveredIndex !== hoveredIndex) {
        this.investigationState = null;
        this.lastHoveredIndex = hoveredIndex;
      }
      if (this.mode === "landed") {
        this.perched = true;
        const walk = Math.sin(elapsed * 1.1) * (this.cfg.perchEdgeWalk || 0.022);
        const settle = coverTarget.position.clone().addScaledVector(coverTarget.right, walk).addScaledVector(coverTarget.up, Math.sin(elapsed * 1.4) * 0.004);
        this.root.position.lerp(settle, this.cfg.coverPerchLerp);
        this.velocity.multiplyScalar(Math.exp(-delta * 7.0));
        this.lookAtPoint(coverTarget.position.clone().add(coverTarget.normal), coverTarget.up, 0.10);
        this.playLoop("perch");
        if (this.trust >= (this.cfg.nestTrustMin || 0.52)) this.maybeDropNest(coverTarget.position, hoveredIndex);
        this.behaviourNote = "perched / visibly calm";
        return;
      }
      if (this.mode === "landing") {
        this.velocity.multiplyScalar(Math.exp(-delta * 8.0));
        this.lookAtPoint(coverTarget.position.clone().add(coverTarget.normal), coverTarget.up, 0.10);
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
          this.velocity.set(0, 0, 0);
          this.playOnce("land", "perch");
          if (this.trust >= (this.cfg.nestTrustMin || 0.52)) this.maybeDropNest(coverTarget.position, hoveredIndex);
          return;
        }
        this.moveToward(delta, coverTarget.position, this.getPatrolFlightSpeed(elapsed) * 0.74, { response: this.cfg.velocityResponse });
        this.lookAtDirection(this.getTravelFacingDirection(coverTarget.position), this.cfg.turnLerpFast);
        this.playLoop(this.getPatrolFlightAction());
        this.behaviourNote = "slow approach to perch";
        return;
      }
      if (this.hoverClock >= this.cfg.hoverPerchDelay) {
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
      if (this.mode === "investigateCover" || this.mode === "approachCover") this.setMode("patrol", "cover signal lost");
    }

    if (this.shouldSeekShelter(Boolean(hasVoid), hoveredIndex)) this.setMode("seekShelter", "needs rest / shelter");
    if (this.mode === "seekShelter") {
      this.updateSeekShelter(delta, elapsed, coverWorldData);
      return;
    }

    if (this.shouldFollowPointer(elapsed, hoveredIndex, Boolean(hasVoid))) {
      if (this.mode !== "followPointer") {
        this.lastPointerCuriosityAt = elapsed;
        this.setMode("followPointer", "gentle pointer curiosity");
      }
    }
    if (this.mode === "followPointer") {
      this.updatePointerCuriosity(delta, elapsed);
      return;
    }

    if (this.mode !== "patrol") this.setMode("patrol", "returning to ambient loop");
    this.updatePatrol(delta, elapsed);
  }

  updatePatrol(delta, elapsed) {
    const anchorVisible = this.worldPointComfortablyVisible(this.currentPatrolAnchor);
    if (anchorVisible) this.anchorHiddenSince = -1;
    else if (this.anchorHiddenSince < 0) this.anchorHiddenSince = elapsed;
    const anchorLostLongEnough = this.anchorHiddenSince >= 0 && (elapsed - this.anchorHiddenSince) >= 0.45;

    const rootVisible = this.worldPointComfortablyVisible(this.root.position, this.cfg.patrolRecoveryMargin);
    if (rootVisible) {
      this.recoveryHiddenSince = -1;
      this.recoveryAssist = false;
    } else {
      if (this.recoveryHiddenSince < 0) this.recoveryHiddenSince = elapsed;
      this.recoveryAssist = (elapsed - this.recoveryHiddenSince) >= (this.cfg.patrolRecoveryDelay || 0.45);
    }

    if (elapsed >= this.nextPatrolDecisionAt || this.root.position.distanceTo(this.currentPatrolAnchor) < this.cfg.patrolArriveDistance || anchorLostLongEnough) {
      this.pickNextPatrolPoint();
    }
    if (this.recoveryAssist) this.currentPatrolAnchor.copy(this.getRecoveryPatrolPoint());

    const target = this.temp.d.copy(this.currentPatrolAnchor);
    const calmBreathe = this.mood === "fed / bright" ? 0.045 : 0.022;
    target.y += Math.sin(elapsed * 0.72) * calmBreathe;
    this.moveToward(delta, target, this.getPatrolFlightSpeed(elapsed), { response: this.cfg.velocityResponse });
    this.lookAtDirection(this.getTravelFacingDirection(target), this.cfg.turnLerpFast);
    this.playLoop(this.getPatrolFlightAction());
    this.behaviourNote = this.mood === "hungry / searching" ? "slow scanning search" : this.mood === "fed / bright" ? "smooth fed patrol" : "ambient patrol";
  }

  startCoverInvestigation(index, coverTarget, elapsed) {
    this.investigationState = { coverIndex: index, startedAt: elapsed, duration: this.cfg.investigateCoverDuration || 1.45, phaseOffset: Math.random() * Math.PI * 2 };
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
    const phase = this.investigationState.phaseOffset + elapsed * 1.65;
    const radius = (this.cfg.investigateCoverRadius || 0.23) * (1.0 - t * 0.20);
    const target = coverTarget.position.clone()
      .addScaledVector(coverTarget.normal, Math.cos(phase) * radius + 0.07)
      .addScaledVector(coverTarget.right || new THREE.Vector3(1, 0, 0), Math.sin(phase) * radius)
      .addScaledVector(coverTarget.up, Math.sin(phase * 1.4) * 0.026);
    this.moveToward(delta, target, this.getPatrolFlightSpeed(elapsed) * 0.66, { response: this.cfg.velocityResponse });
    this.lookAtPoint(coverTarget.position, coverTarget.up, this.cfg.turnLerpFast);
    this.playLoop(this.getPatrolFlightAction());
    this.behaviourNote = "circle → inspect → decide";
    if (t >= 1.0) this.setMode("approachCover", "inspection complete");
  }

  shouldSeekShelter(hasVoid, hoveredIndex) {
    if (hasVoid || hoveredIndex >= 0) return false;
    if (this.mode === "landed" || this.mode === "landing" || this.mode === "seekShelter" || this.mode === "backflip") return false;
    return this.fatigue >= (this.cfg.fatigueShelterThreshold || 0.84) || (this.trust > 0.60 && this.signal < 0.18);
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
      this.velocity.set(0, 0, 0);
      this.playOnce("land", "perch");
      this.maybeDropNest(shelter.position, shelter.index);
      this.fragmentCount += 1;
      return;
    }
    this.moveToward(delta, shelter.position, this.getPatrolFlightSpeed(elapsed) * 0.55, { response: this.cfg.velocityResponse });
    this.lookAtDirection(this.getTravelFacingDirection(shelter.position), this.cfg.turnLerpFast);
    this.playLoop(this.getPatrolFlightAction());
    this.behaviourNote = `seeking shelter cover ${shelter.index}`;
  }

  shouldFollowPointer(elapsed, hoveredIndex, hasVoid) {
    if (hasVoid || hoveredIndex >= 0) return false;
    if (!this.pointerWorldTargetValid) return false;
    if (this.mode === "landed" || this.mode === "landing" || this.mode === "takeoff" || this.mode === "backflip") return false;
    if (elapsed - this.lastPointerEventAt > 1.2) return false;
    if (elapsed - this.lastPointerCuriosityAt < (this.cfg.pointerCuriosityCooldown || 0.40)) return false;
    if (this.trust < (this.cfg.pointerCuriosityTrustMin || 0.34)) return false;
    if (this.signal < (this.cfg.pointerCuriositySignalMin || 0.25) && this.pointerGentle < 0.20) return false;
    return this.aggression < 0.28;
  }

  updatePointerCuriosity(delta, elapsed) {
    if (!this.pointerWorldTargetValid) {
      this.setMode("patrol", "pointer signal lost");
      return;
    }
    const target = this.temp.d.copy(this.pointerWorldTarget);
    target.y += Math.sin(elapsed * 1.25) * 0.020;
    this.moveToward(delta, target, this.getPatrolFlightSpeed(elapsed) * this.cfg.followSpeedScale, { response: this.cfg.velocityResponse });
    this.lookAtDirection(this.getTravelFacingDirection(target), this.cfg.turnLerpFast);
    this.playLoop(this.getPatrolFlightAction());
    this.behaviourNote = "cautious pointer curiosity";
    if (this.root.position.distanceTo(target) < 0.16 || this.aggression > 0.32 || elapsed - this.lastPointerEventAt > 1.5) {
      this.lastPointerCuriosityAt = elapsed;
      this.setMode("patrol", "pointer curiosity complete");
      this.pickNextPatrolPoint();
    }
  }

  shouldFleeFromOverwhelm(elapsed) {
    if (this.mode === "backflip" || this.mode === "takeoff" || this.mode === "inspectVoid" || this.mode === "fleeOverwhelmed") return false;
    if (elapsed - this.lastFleeAt < (this.cfg.overwhelmCooldown || 3.2)) return false;
    if (this.corruption >= (this.cfg.voidCorruptionFleeThreshold || 0.88)) return true;
    if (this.aggression >= (this.cfg.overwhelmAggressionThreshold || 0.82)) return true;
    return this.fatigue >= (this.cfg.overwhelmFatigueThreshold || 0.95) && this.signal > 0.70;
  }

  startFleeOverwhelmed(elapsed, reason = "overwhelmed") {
    const camForward = this.temp.a.set(0, 0, -1).applyQuaternion(this.camera.quaternion).normalize();
    const camRight = this.temp.b.set(1, 0, 0).applyQuaternion(this.camera.quaternion).normalize();
    const side = Math.random() > 0.5 ? 1 : -1;
    const target = new THREE.Vector3()
      .copy(this.orbitCenter)
      .addScaledVector(camForward, randomFromRange(0.58, 1.05))
      .addScaledVector(camRight, side * randomFromRange(0.55, 1.10));
    target.y = this.orbitCenter.y + randomFromRange(this.cfg.patrolHeightMax * 0.52, this.cfg.patrolHeightMax + 0.10);
    this.clampPointNearCenter(target);
    this.fleeState = { startedAt: elapsed, endsAt: elapsed + randomFromRange(this.cfg.overwhelmDurationMin, this.cfg.overwhelmDurationMax), target, reason };
    this.lastFleeAt = elapsed;
    if (this.mode === "landed" || this.mode === "landing") this.startTakeoff(elapsed);
    if (this.mode !== "takeoff") this.setMode("fleeOverwhelmed", reason);
    this.playLoop(this.getPatrolFlightAction());
  }

  updateFleeOverwhelmed(delta, elapsed) {
    if (!this.fleeState) this.startFleeOverwhelmed(elapsed, "smooth recovery");
    const target = this.fleeState?.target || this.currentPatrolAnchor;
    const breathe = this.temp.d.copy(target);
    breathe.y += Math.sin(elapsed * 0.95) * 0.025;
    this.moveToward(delta, breathe, this.cfg.flySpeed * this.cfg.fleeSpeedScale, { response: this.cfg.velocityResponse });
    this.lookAtDirection(this.getTravelFacingDirection(breathe), this.cfg.turnLerpFast);
    this.playLoop(this.getPatrolFlightAction());
    this.fatigue = clamp01(this.fatigue - delta * 0.12);
    this.aggression = Math.max(0, this.aggression - delta * 0.35);
    this.behaviourNote = `smooth retreat: ${this.fleeState?.reason || "overwhelmed"}`;
    if (elapsed >= (this.fleeState?.endsAt || 0) || this.root.position.distanceTo(target) < 0.18) {
      this.fleeState = null;
      this.pickNextPatrolPoint();
      this.setMode("patrol", "calmed down");
    }
  }

  startVoidOrbit(elapsed) {
    this.voidOrbitState = { startedAt: elapsed, duration: this.cfg.voidCautionOrbitDuration || 1.75, phaseOffset: Math.random() * Math.PI * 2 };
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
    const phase = orbit.phaseOffset + elapsed * 1.9;
    const radius = (this.cfg.voidCautionOrbitRadius || 0.35) * (1.0 - t * 0.18);
    const right = this.temp.b.set(1, 0, 0).applyQuaternion(this.camera.quaternion).normalize();
    const up = this.temp.c.set(0, 1, 0);
    const toCamera = this.camera.position.clone().sub(this.voidState.position).normalize();
    const target = this.voidState.position.clone()
      .addScaledVector(right, Math.cos(phase) * radius)
      .addScaledVector(up, Math.sin(phase) * radius * 0.55)
      .addScaledVector(toCamera, this.cfg.voidHoverRadius);
    this.moveToward(delta, target, this.cfg.diveSpeed * 0.58, { response: this.cfg.velocityResponse });
    this.lookAtPoint(this.voidState.position, up, this.cfg.turnLerpFast);
    this.playLoop("feed");
    this.behaviourNote = "orbiting dangerous food";
    if (this.corruption >= (this.cfg.voidCorruptionFleeThreshold || 0.88)) {
      this.startFleeOverwhelmed(elapsed, "void corruption spike");
      return;
    }
    if (t >= 1.0 || this.root.position.distanceTo(target) < 0.10) {
      this.setMode("inspectVoid", "feeding from void");
      this.voidState.inspectStartedAt = elapsed;
      this.velocity.multiplyScalar(0.35);
      this.playLoop("feed");
    }
  }

  updateVoidInspect(delta, elapsed, voidTarget) {
    if (!this.voidState?.active) return;
    const hoverPos = this.temp.d.copy(voidTarget.position);
    hoverPos.x += Math.cos(elapsed * 1.2) * 0.012;
    hoverPos.y += Math.sin(elapsed * 1.4) * 0.010;
    hoverPos.z += Math.sin(elapsed * 1.1) * 0.012;
    this.root.position.lerp(hoverPos, 1.0 - Math.exp(-delta * 4.0));
    this.velocity.multiplyScalar(Math.exp(-delta * 5.0));
    this.lookAtPoint(voidTarget.lookAt, new THREE.Vector3(0, 1, 0), 0.12);
    this.playLoop("feed");
    this.voidState.remaining = Math.max(0, this.voidState.remaining - delta);
    this.voidState.energy = clamp01(this.voidState.remaining / this.voidState.duration);
    this.vitality = clamp01(this.vitality + delta * this.cfg.vitalityRecoveryPerSecond * 1.8);
    this.behaviourNote = "feeding / binary intake";
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
    this.setMode("takeoff", "leaving perch");
    const duration = this.actionDurations.get("takeoff") || 0.7;
    this.takeoffState = { startedAt: elapsed, duration, startPos: this.root.position.clone(), endPos: this.root.position.clone().add(new THREE.Vector3(0, this.cfg.takeoffRiseHeight, 0)) };
    if (!this.playOnce("takeoff", this.voidState?.active ? "fly" : this.getPatrolFlightAction())) {
      this.setMode(this.voidState?.active ? "approachVoid" : "patrol", "takeoff fallback");
    }
  }

  updateTakeoffMotion(elapsed) {
    if (!this.takeoffState) return;
    const t = clamp01((elapsed - this.takeoffState.startedAt) / Math.max(0.0001, this.takeoffState.duration));
    const ease = smooth01(t);
    this.root.position.lerpVectors(this.takeoffState.startPos, this.takeoffState.endPos, ease);
    this.velocity.set(0, 0, 0);
  }

  moveToward(delta, target, baseSpeed, options = {}) {
    const toTarget = this.temp.e.copy(target).sub(this.root.position);
    const distance = toTarget.length();
    if (distance <= (this.cfg.stopDistance || 0.055)) {
      this.velocity.multiplyScalar(Math.exp(-delta * 4.5));
      return;
    }
    const dir = toTarget.normalize();
    const arrival = smooth01(THREE.MathUtils.clamp(distance / Math.max(0.001, this.cfg.approachSlowRadius), 0.0, 1.0));
    const speed = Math.max(0.03, baseSpeed * THREE.MathUtils.lerp(0.16, 1.0, arrival));
    const desired = dir.multiplyScalar(speed);
    const response = options.response || (distance > 0.8 ? this.cfg.velocityResponseFast : this.cfg.velocityResponse);

    const targetVelocity = this.temp.a.copy(desired);
    const alpha = 1.0 - Math.exp(-delta * response);
    const before = this.temp.b.copy(this.velocity);
    this.velocity.lerp(targetVelocity, alpha);

    const maxAccelStep = (this.cfg.maxAcceleration || 2.6) * delta;
    const accel = this.temp.c.copy(this.velocity).sub(before);
    if (accel.length() > maxAccelStep) {
      accel.setLength(maxAccelStep);
      this.velocity.copy(before).add(accel);
    }

    const maxSpeed = Math.max(baseSpeed * 1.12, 0.1);
    if (this.velocity.length() > maxSpeed) this.velocity.setLength(maxSpeed);
    this.root.position.addScaledVector(this.velocity, delta);
    this.clampPointNearCenter(this.root.position);
  }

  getTravelFacingDirection(targetPoint = null) {
    const velocityDir = this.temp.b.copy(this.velocity);
    if (velocityDir.lengthSq() > 0.00004) {
      velocityDir.normalize();
      if (targetPoint) {
        const targetDir = this.temp.c.copy(targetPoint).sub(this.root.position);
        if (targetDir.lengthSq() > 0.00004) velocityDir.lerp(targetDir.normalize(), 0.10).normalize();
      }
      return velocityDir;
    }
    if (targetPoint) {
      const targetDir = this.temp.c.copy(targetPoint).sub(this.root.position);
      if (targetDir.lengthSq() > 0.00004) return targetDir.normalize();
    }
    return this.forward.clone();
  }

  getTurnAlpha(lerpAmount = this.cfg.turnLerp) {
    const clampedLerp = THREE.MathUtils.clamp(lerpAmount, 0.01, 0.99);
    const response = clampedLerp >= (this.cfg.turnLerpFast || 0.16) ? (this.cfg.turnResponseFast || 6.0) : (this.cfg.turnResponse || 4.8);
    const rateAware = 1.0 - Math.exp(-this.lastDelta * response);
    const legacyAware = 1.0 - Math.pow(1.0 - clampedLerp, Math.max(0.25, this.lastDelta * 60.0));
    return THREE.MathUtils.clamp(Math.max(rateAware, legacyAware), 0.01, 0.65);
  }

  orientRootToDirection(direction, preferredUp = null, lerpAmount = this.cfg.turnLerp) {
    if (!direction || direction.lengthSq() <= 0.0001) return;
    const forward = this.temp.a.copy(direction).normalize();
    const up = this.temp.b.copy(preferredUp || new THREE.Vector3(0, 1, 0));
    if (up.lengthSq() <= 0.0001) up.set(0, 1, 0);
    up.normalize();
    if (Math.abs(up.dot(forward)) > 0.92) up.set(0, 1, 0);
    if (Math.abs(up.dot(forward)) > 0.92) up.set(1, 0, 0);
    const right = this.temp.c.copy(up).cross(forward).normalize();
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
    const smoothing = 1.0 - Math.exp(-this.lastDelta * (this.cfg.headingSmoothing || 5.0));
    if (!this.smoothedHeading || this.smoothedHeading.lengthSq() <= 0.0001) this.smoothedHeading = target.clone();
    else {
      if (this.smoothedHeading.dot(target) < -0.35) this.smoothedHeading.copy(this.forward);
      const speedSq = this.velocity.lengthSq();
      const blend = speedSq < 0.004 ? smoothing * 0.35 : smoothing;
      this.smoothedHeading.lerp(target, THREE.MathUtils.clamp(blend, 0.015, 0.34)).normalize();
    }
    const angle = Math.acos(THREE.MathUtils.clamp(this.forward.dot(this.smoothedHeading), -1, 1));
    if (angle <= (this.cfg.headingDeadzone || 0.045)) return;
    this.orientRootToDirection(this.smoothedHeading, null, lerpAmount);
  }

  lookAtPoint(point, up = new THREE.Vector3(0, 1, 0), lerpAmount = 0.12) {
    this.temp.e.copy(point).sub(this.root.position);
    if (this.temp.e.lengthSq() <= 0.0001) return;
    this.orientRootToDirection(this.temp.e, up, lerpAmount);
  }

  updateFlightPose(delta) {
    if (!this.visualRoot) return;
    const speed = this.velocity.length();
    const inverseRoot = this.temp.q2.copy(this.root.quaternion).invert();
    const localVelocity = this.temp.a.copy(this.velocity).applyQuaternion(inverseRoot);
    let bankTarget = 0;
    let pitchTarget = 0;
    if (speed > 0.04 && this.mode !== "landed" && this.mode !== "backflip") {
      const side = THREE.MathUtils.clamp(localVelocity.x / Math.max(0.0001, speed), -1, 1);
      const lift = THREE.MathUtils.clamp(localVelocity.y / Math.max(0.0001, speed), -1, 1);
      bankTarget = THREE.MathUtils.clamp(-side * (this.cfg.visualBankMax || 0.105), -(this.cfg.visualBankMax || 0.105), this.cfg.visualBankMax || 0.105);
      pitchTarget = THREE.MathUtils.clamp(-lift * (this.cfg.visualPitchMax || 0.055), -(this.cfg.visualPitchMax || 0.055), this.cfg.visualPitchMax || 0.055);
    }
    if (this.mode === "inspectVoid" || this.mode === "landing") {
      bankTarget *= 0.25;
      pitchTarget *= 0.25;
    }
    if (this.mode === "landed" || this.mode === "backflip") {
      bankTarget = 0;
      pitchTarget = 0;
    }
    const bankAlpha = 1.0 - Math.exp(-delta * (this.cfg.visualBankResponse || 3.8));
    const pitchAlpha = 1.0 - Math.exp(-delta * (this.cfg.visualPitchResponse || 3.6));
    this.visualBank = THREE.MathUtils.lerp(this.visualBank, bankTarget, bankAlpha);
    this.visualPitch = THREE.MathUtils.lerp(this.visualPitch, pitchTarget, pitchAlpha);
    this.visualRoot.rotation.set(this.baseVisualPitch + this.visualPitch, this.baseVisualYaw, this.baseVisualRoll + this.visualBank);
  }

  getStateVisualName() {
    if (this.mode === "backflip") return "backflip";
    if (this.mode === "inspectVoid") return "feeding";
    if (this.mode === "fleeOverwhelmed") return "overwhelmed";
    return this.mood || "patrolling";
  }

  updateVisibleState(delta, elapsed) {
    const visualName = this.getStateVisualName();
    const visual = STATE_VISUALS[visualName] || STATE_VISUALS.patrolling;
    const targetColor = new THREE.Color(visual.color);
    const alpha = 1.0 - Math.exp(-delta * 4.2);

    this.meshMaterials.forEach((material) => {
      if (material.color && !material.map) material.color.lerp(targetColor, alpha * 0.30);
      if (material.emissive) {
        material.emissive.lerp(targetColor, alpha * 0.55);
        material.emissiveIntensity = THREE.MathUtils.lerp(material.emissiveIntensity || 0.4, this.cfg.meshEmissiveIntensity * visual.brightness, alpha);
      }
      material.opacity = THREE.MathUtils.lerp(material.opacity ?? this.cfg.meshOpacity, this.cfg.meshOpacity * (visualName === "feeding" ? 1.18 : 1.0), alpha);
    });

    if (this.binaryMaterial) {
      this.binaryMaterial.uniforms.uTime.value = elapsed;
      this.binaryMaterial.uniforms.uColor.value.lerp(targetColor, alpha);
      this.binaryMaterial.uniforms.uAlpha.value = THREE.MathUtils.lerp(this.binaryMaterial.uniforms.uAlpha.value, visual.aura, alpha);
      this.binaryMaterial.uniforms.uBrightness.value = THREE.MathUtils.lerp(this.binaryMaterial.uniforms.uBrightness.value, this.cfg.binaryBrightness * visual.brightness, alpha);
    }
    if (this.auraSprite) {
      this.auraSprite.material.color.lerp(targetColor, alpha);
      this.auraSprite.material.opacity = THREE.MathUtils.lerp(this.auraSprite.material.opacity, this.cfg.auraOpacity * visual.aura, alpha);
      const pulse = 1.0 + Math.sin(elapsed * (visualName === "overwhelmed" ? 2.4 : 1.1)) * 0.035;
      this.auraSprite.scale.setScalar(this.cfg.auraSize * (0.75 + visual.aura) * pulse);
    }
    if (this.stateLight) {
      this.stateLight.color.lerp(targetColor, alpha);
      this.stateLight.intensity = THREE.MathUtils.lerp(this.stateLight.intensity, 0.18 + visual.aura * 0.32, alpha);
    }
    if (this.trail?.material) {
      this.trail.material.uniforms.uColor.value.lerp(targetColor, alpha);
      this.trail.material.uniforms.uAlpha.value = THREE.MathUtils.lerp(this.trail.material.uniforms.uAlpha.value, visual.trail, alpha);
    }
  }

  getPatrolFlightSpeed(elapsed) {
    if (this.mode === "fleeOverwhelmed") return this.cfg.flySpeed * this.cfg.fleeSpeedScale;
    if (this.isHungry(elapsed)) return this.cfg.flySpeed * this.cfg.flySadSpeedScale;
    if (this.mood === "fed / bright") return this.cfg.flySpeed * 1.02;
    return this.cfg.flySpeed;
  }

  emitTrailParticle() {
    if (!this.trail) return;
    const i = this.trail.cursor;
    this.trail.cursor = (this.trail.cursor + 1) % this.cfg.trailCount;
    const base = i * 3;
    this.trail.positions[base] = this.root.position.x;
    this.trail.positions[base + 1] = this.root.position.y;
    this.trail.positions[base + 2] = this.root.position.z;
    this.trail.life[i] = this.cfg.trailLife;
    this.trail.velocity[i]
      .copy(this.forward)
      .multiplyScalar(-this.cfg.trailSpeed * (0.75 + Math.random() * 0.25))
      .add(new THREE.Vector3((Math.random() - 0.5) * this.cfg.trailJitter, (Math.random() - 0.5) * this.cfg.trailJitter, (Math.random() - 0.5) * this.cfg.trailJitter));
  }

  updateTrail(delta, elapsed) {
    if (!this.trail) return;
    this.trail.material.uniforms.uTime.value = elapsed;
    this.trail.emitClock += delta;
    const moving = this.velocity.lengthSq() > 0.0035 && this.mode !== "backflip";
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
      this.trail.positions[base] += vel.x * delta;
      this.trail.positions[base + 1] += vel.y * delta;
      this.trail.positions[base + 2] += vel.z * delta;
      if (this.trail.life[i] <= 0.001) {
        this.trail.positions[base] = 9999;
        this.trail.positions[base + 1] = 9999;
        this.trail.positions[base + 2] = 9999;
      }
    }
    this.trail.geometry.attributes.position.needsUpdate = true;
    this.trail.geometry.attributes.aLife.needsUpdate = true;
  }

  updateNestAnimations(elapsed, coverWorldData) {
    this.nests.forEach((nest, index) => {
      if (nest.type === "cover" && typeof nest.coverIndex === "number") {
        const cover = coverWorldData[nest.coverIndex];
        if (cover?.visible) {
          nest.mesh.position.copy(cover.position).addScaledVector(cover.up, this.coverSize.height * 0.42).addScaledVector(cover.right, 0.03);
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
    const lifeAttr = this.voidGeometry.attributes.aLife.array;
    const energy = clamp01(this.voidState.energy);
    const maxRadius = (this.cfg.voidVortexRadius || 0.78) * (0.70 + energy * 0.38);
    const spinSpeed = this.cfg.voidVortexSpin || 1.75;
    for (let i = 0; i < this.voidSeed.length; i += 1) {
      const seed = this.voidSeed[i];
      seed.t = (seed.t + delta * 0.20 * seed.spin) % 1;
      const collapse = Math.pow(1.0 - seed.t, 1.05);
      const angle = seed.angle + elapsed * spinSpeed * (0.25 + seed.spin * 0.12) + collapse * 5.2;
      const radius = maxRadius * collapse * seed.radius;
      const base = i * 3;
      positions[base] = Math.cos(angle) * radius;
      positions[base + 1] = Math.sin(angle) * radius * 0.72;
      positions[base + 2] = -seed.t * 0.82 * (0.66 + energy * 0.54);
      lifeAttr[i] = energy * (0.25 + collapse * 0.75);
    }
    this.voidGeometry.attributes.position.needsUpdate = true;
    this.voidGeometry.attributes.aLife.needsUpdate = true;
    this.voidMaterial.uniforms.uTime.value = elapsed;
    this.voidMaterial.uniforms.uAlpha.value = energy;
    this.voidCore.material.opacity = 0.40 + energy * 0.40;
    this.voidCore.scale.setScalar((this.cfg.voidVortexRadius || 0.78) * (0.75 + energy * 0.22));
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
    if (local.length() > this.cfg.voidSpawnRadius) local.setLength(this.cfg.voidSpawnRadius);
    local.y = THREE.MathUtils.clamp(local.y, this.cfg.voidHeightMin, this.cfg.voidHeightMax);
    hit.copy(this.orbitCenter).add(local);
    return hit;
  }

  spawnVoid(position) {
    this.voidState = { active: true, position: position.clone(), duration: this.cfg.voidInspectDuration, remaining: this.cfg.voidInspectDuration, energy: 1.0 };
    if (this.mode === "landed" || this.mode === "landing") this.startTakeoff(this.getElapsed());
    else {
      this.setMode("approachVoid", "binary void opened");
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
      this.setMode(this.voidState?.active ? "approachVoid" : "patrol", "missing backflip clip");
      this.playLoop(this.getPatrolFlightAction());
      return;
    }
    const clipDuration = backflipAction.getClip?.().duration || this.actionDurations.get("backflip") || 0;
    console.log("[Moth] Playing animation-only backflip clip.", { duration: clipDuration });
    this.flipBusy = true;
    this.perched = false;
    this.setMode("backflip", "animation-only F_Backflip");
    this.takeoffState = null;
    this.velocity.set(0, 0, 0);
    this.backflipGuardUntil = this.getElapsed() + Math.max(clipDuration + (this.cfg.backflipLockExtra || 0.10), 0.18);
    this.backflipState = {
      position: this.root.position.clone(),
      quaternion: this.root.quaternion.clone(),
      forward: this.forward.clone(),
      up: this.orientationUp.clone(),
      duration: clipDuration
    };
    this.lockBackflipTransform();
    if (!this.playOnce("backflip", this.getPatrolFlightAction())) {
      this.flipBusy = false;
      this.backflipState = null;
      this.backflipGuardUntil = 0;
      this.setMode(this.voidState?.active ? "approachVoid" : "patrol", "backflip failed");
      this.playLoop(this.getPatrolFlightAction());
    }
  }

  lockBackflipTransform() {
    if (!this.backflipState) return;
    this.root.position.copy(this.backflipState.position);
    this.root.quaternion.copy(this.backflipState.quaternion);
    this.forward.copy(this.backflipState.forward);
    this.orientationUp.copy(this.backflipState.up);
    this.smoothedHeading.copy(this.forward);
    this.velocity.set(0, 0, 0);
  }

  finishBackflip() {
    if (this.currentActionKey !== "backflip" && this.mode !== "backflip") return;
    this.lockBackflipTransform();
    this.flipBusy = false;
    this.backflipState = null;
    this.backflipGuardUntil = 0;
    const next = this.pendingActionKey || this.getPatrolFlightAction();
    this.pendingActionKey = "";
    this.setMode(this.voidState?.active ? "approachVoid" : "patrol", "backflip complete");
    this.pickNextPatrolPoint();
    this.playLoop(next);
  }
}
