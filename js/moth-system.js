
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
  pointLimit: 960,
  sizeRatioToModelHeight: 0.0936,
  modelYawOffset: -Math.PI / 2,
  modelPitchOffset: 0,
  modelRollOffset: 0,
  shellMotionStrength: 1.25,
  shellPointSizeMin: 0.82,
  shellPointSizeMax: 1.52,
  shellPointAlphaMin: 0.34,
  shellPointAlphaMax: 0.58,
  trailCount: 180,
  trailEmitInterval: 0.02,
  trailLife: 0.85,
  trailDrag: 2.1,
  trailSpeed: 0.32,
  trailJitter: 0.08,
  trailPointSizeMin: 0.7,
  trailPointSizeMax: 1.3,
  trailAlpha: 0.78,

  patrolRadiusMin: 0.45,
  patrolRadiusMax: 1.18,
  patrolHeightMin: 0.28,
  patrolHeightMax: 1.02,
  patrolFrontMin: 0.22,
  patrolFrontMax: 0.82,
  patrolSideSpan: 0.58,
  patrolViewMargin: 0.82,
  patrolRepickMin: 1.8,
  patrolRepickMax: 3.4,
  patrolRecoveryMargin: 1.06,
  patrolRecoverySpeedScale: 1.2,
  patrolCenterPull: 0.18,


  flySpeed: 1.55,
  diveSpeed: 2.00,
  flySadSpeedScale: 0.62,
  approachSlowRadius: 0.42,
  turnLerp: 0.22,
  turnLerpFast: 0.28,
  headingTargetBlend: 0.72,
  headingVelocityBlend: 0.28,

  hoverPerchDelay: 0.10,
  perchDistance: 0.12,
  landTriggerDistance: 0.12,
  coverPerchLift: 0.065,
  coverPerchForward: 0.055,
  coverPerchLerp: 0.18,

  takeoffRiseHeight: 0.20,
  takeoffMotionScale: 1.0,
  backflipPush: 0.25,
  backflipLift: 0.10,

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
  debug: false
};

const ACTION_KEYS = {
  fly: ["f fly", "fly"],
  flySad: ["f fly sad", "fly sad", "sad"],
  land: ["f land", "land"],
  perch: ["f land idle", "land idle", "idle"],
  takeoff: ["f land to takeoff", "f land to take off", "land to takeoff", "takeoff", "take off"],
  feed: ["f void inspect", "void inspect", "inspect", "feed"],
  backflip: ["f backflip", "backflip", "flip"]
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
    blending: THREE.AdditiveBlending,
    uniforms: {
      uAtlas: { value: atlas },
      uTime: { value: 0 },
      uLightDir: { value: lightDir.clone() },
      uPalette: { value: paletteUniform },
      uAlphaBoost: { value: 1 },
      uSadness: { value: 0 },
      uMotion: { value: 0 }
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
        float motion = 0.35 + uMotion * 1.35;
        float drift = (0.0032 + aSeed * 0.0070) * motion * (1.0 - uSadness * 0.12);
        float flap = sin(uTime * (8.0 + fract(aSeed * 3.6) * 5.0) + aSeed * 40.0);
        float flutter = cos(uTime * (5.2 + fract(aSeed * 2.4) * 3.0) + aSeed * 23.0);
        p += n * (flap * drift * 0.9);
        p.x += sin(uTime * (2.4 + fract(aSeed * 0.8)) + aSeed * 31.0) * drift * 0.55;
        p.y += cos(uTime * (3.2 + fract(aSeed * 0.9)) + aSeed * 47.0) * drift * 0.65;
        p.z += flutter * drift * 0.75;

        vec3 worldNormal = normalize(mat3(modelMatrix) * n);
        float light = max(dot(worldNormal, normalize(uLightDir)), 0.0);
        float shade = pow(smoothstep(0.08, 0.98, light), 1.6);

        float digitSwitch = floor(uTime * (3.2 + fract(aSeed * 2.2)) + aSeed * 28.0);
        vDigit = mod(digitSwitch, 2.0);
        vPalette = fract(aSeed * 9.7 + uMotion * 0.08);
        vShade = shade;
        vAlpha = aAlpha * mix(0.48, 1.0, shade) * (1.0 - uSadness * 0.34) * (0.85 + uMotion * 0.25);

        vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = max(2.4, aSize * (30.0 / max(1.0, -mvPosition.z)) * (0.95 + uMotion * 0.22));
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform sampler2D uAtlas;
      uniform vec3 uPalette[7];
      uniform float uAlphaBoost;
      uniform float uSadness;

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
        color *= mix(0.25, 1.0, vShade);
        color = mix(color, vec3(0.10, 0.18, 0.24), uSadness * 0.45);
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

function chooseBestClip(clips, patterns) {
  if (!clips.length) return null;
  for (const pattern of patterns) {
    const norm = normalizeName(pattern);
    const match = clips.find((clip) => normalizeName(clip.name).includes(norm));
    if (match) return match;
  }
  return null;
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
    this.binaryMaterial = null;
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
    this.forward = new THREE.Vector3(0, 0, 1);

    this.takeoffState = null;

    this.temp = {
      a: new THREE.Vector3(),
      b: new THREE.Vector3(),
      c: new THREE.Vector3(),
      d: new THREE.Vector3(),
      e: new THREE.Vector3(),
      q: new THREE.Quaternion(),
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
      this.cfg.modelPitchOffset || 0,
      this.cfg.modelYawOffset || 0,
      this.cfg.modelRollOffset || 0
    );

    this.modelRoot.traverse((child) => {
      if (!child.isMesh) return;
      child.visible = false;
      child.frustumCulled = false;
      if (child.geometry && !child.geometry.attributes.normal && typeof child.geometry.computeVertexNormals === "function") {
        child.geometry.computeVertexNormals();
      }

      const materials = ensureMaterialArray(child.material);
      child.material = materials.map(() => {
        const mat = new THREE.MeshStandardMaterial({
          color: new THREE.Color("#b7c6d3"),
          emissive: new THREE.Color("#16384d"),
          emissiveIntensity: 0.48,
          roughness: 0.86,
          metalness: 0.04,
          transparent: true,
          opacity: 0.92,
          side: THREE.DoubleSide
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

    const modelBox = new THREE.Box3().setFromObject(this.centralModel);
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
    if (!clips.length || !this.modelRoot) return;

    this.mixer = new THREE.AnimationMixer(this.modelRoot);

    const uniqueClips = [];
    const seen = new Set();
    clips.forEach((clip) => {
      if (!clip || !clip.duration) return;
      const key = `${normalizeName(clip.name)}_${clip.duration.toFixed(2)}`;
      if (seen.has(key)) return;
      seen.add(key);
      uniqueClips.push(clip);
    });

    Object.entries(ACTION_KEYS).forEach(([actionKey, patterns]) => {
      const clip = chooseBestClip(uniqueClips, patterns);
      if (!clip) return;
      const action = this.mixer.clipAction(clip);
      action.enabled = true;
      action.clampWhenFinished = true;
      action.zeroSlopeAtStart = true;
      action.zeroSlopeAtEnd = true;
      this.actions.set(actionKey, action);
      this.actionDurations.set(actionKey, clip.duration);
    });

    this.mixer.addEventListener("finished", () => this.onActionFinished());
  }

  onActionFinished() {
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
      this.flipBusy = false;
      const next = this.pendingActionKey || this.getPatrolFlightAction();
      this.pendingActionKey = "";
      this.mode = this.voidState?.active ? "approachVoid" : "patrol";
      this.playLoop(next);
      return;
    }

    if (this.pendingActionKey) {
      const next = this.pendingActionKey;
      this.pendingActionKey = "";
      this.playLoop(next);
    }
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
    const next = this.getAction(key);
    if (!next) return false;
    if (this.currentActionKey === key && next.isRunning()) return true;

    this.actions.forEach((action, actionKey) => {
      if (actionKey === key) return;
      action.fadeOut(0.16);
    });

    next.reset();
    next.setLoop(THREE.LoopRepeat, Infinity);
    next.clampWhenFinished = false;
    next.fadeIn(0.14).play();
    this.currentActionKey = key;
    return true;
  }

  playOnce(key, followUp = "") {
    const next = this.getAction(key);
    if (!next) {
      if (followUp) this.playLoop(followUp);
      return false;
    }

    this.actions.forEach((action, actionKey) => {
      if (actionKey === key) return;
      action.fadeOut(0.10);
    });

    this.pendingActionKey = followUp;
    next.reset();
    next.setLoop(THREE.LoopOnce, 1);
    next.clampWhenFinished = true;
    next.fadeIn(0.10).play();
    this.currentActionKey = key;
    return true;
  }

  buildBinaryShell() {
    const samples = this.extractPointsFromModel(this.modelRoot, this.cfg.pointLimit);
    const count = samples.positions.length / 3;
    if (!count) return;

    const geometry = new THREE.BufferGeometry();
    const sizes = new Float32Array(count);
    const alphas = new Float32Array(count);
    const seeds = new Float32Array(count);

    for (let i = 0; i < count; i += 1) {
      sizes[i] = this.cfg.shellPointSizeMin + Math.random() * (this.cfg.shellPointSizeMax - this.cfg.shellPointSizeMin);
      alphas[i] = this.cfg.shellPointAlphaMin + Math.random() * (this.cfg.shellPointAlphaMax - this.cfg.shellPointAlphaMin);
      seeds[i] = Math.random();
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(samples.positions, 3));
    geometry.setAttribute("aNormal", new THREE.BufferAttribute(samples.normals, 3));
    geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
    geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute("aAlpha", new THREE.BufferAttribute(alphas, 1));

    this.binaryMaterial = createBinaryPointsMaterial(this.glyphAtlas, this.palette, this.lightDir);
    this.binaryShell = new THREE.Points(geometry, this.binaryMaterial);
    this.binaryShell.frustumCulled = false;
    this.binaryShell.renderOrder = 12;
    this.visualRoot.add(this.binaryShell);
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
    this.trail.material.uniforms.uAlpha.value = this.cfg.trailAlpha;

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

  extractPointsFromModel(model, limit = 960) {
    const positions = [];
    const normals = [];

    model.updateMatrixWorld(true);

    const meshes = [];
    model.traverse((child) => {
      if (child.isMesh && child.geometry && child.geometry.attributes.position) {
        meshes.push(child);
      }
    });

    if (!meshes.length) {
      return { positions: new Float32Array(), normals: new Float32Array() };
    }

    const totalVerts = meshes.reduce((sum, mesh) => sum + mesh.geometry.attributes.position.count, 0);

    meshes.forEach((mesh) => {
      const pos = mesh.geometry.attributes.position;
      const nor = mesh.geometry.attributes.normal;
      const normalMatrix = new THREE.Matrix3().getNormalMatrix(mesh.matrixWorld);
      const meshTarget = Math.max(24, Math.round(limit * (pos.count / Math.max(1, totalVerts))));
      const step = Math.max(1, Math.floor(pos.count / meshTarget));

      for (let i = 0; i < pos.count; i += step) {
        this.temp.a.fromBufferAttribute(pos, i).applyMatrix4(mesh.matrixWorld);
        positions.push(this.temp.a.x, this.temp.a.y, this.temp.a.z);

        if (nor) {
          this.temp.b.fromBufferAttribute(nor, i).applyMatrix3(normalMatrix).normalize();
        } else {
          this.temp.b.set(0, 1, 0);
        }
        normals.push(this.temp.b.x, this.temp.b.y, this.temp.b.z);
      }
    });

    const center = new THREE.Vector3();
    for (let i = 0; i < positions.length; i += 3) {
      center.x += positions[i];
      center.y += positions[i + 1];
      center.z += positions[i + 2];
    }
    const count = Math.max(1, positions.length / 3);
    center.multiplyScalar(1 / count);

    for (let i = 0; i < positions.length; i += 3) {
      positions[i] -= center.x;
      positions[i + 1] -= center.y;
      positions[i + 2] -= center.z;
    }

    return {
      positions: new Float32Array(positions),
      normals: new Float32Array(normals)
    };
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
  }

  worldPointComfortablyVisible(world, margin = this.cfg.patrolViewMargin) {
    this.temp.screen.copy(world).project(this.camera);
    return (
      this.temp.screen.z > -1 &&
      this.temp.screen.z < 1 &&
      Math.abs(this.temp.screen.x) <= margin &&
      Math.abs(this.temp.screen.y) <= margin
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
    p.y = this.orbitCenter.y + 0.58;
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
      const y = this.orbitCenter.y + randomFromRange(this.cfg.patrolHeightMin, this.cfg.patrolHeightMax);

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
      coverWorldData
    } = context;

    const sceneVisible = introComplete && !introActive;
    this.setVisibility(sceneVisible);
    if (!sceneVisible) return;

    if (this.mixer) this.mixer.update(delta);

    const hungry = this.isHungry(elapsed);
    if (hungry && !this.voidState?.active) {
      this.vitality = clamp01(this.vitality - delta * this.cfg.vitalityDrainPerSecond);
    } else {
      this.vitality = clamp01(this.vitality + delta * this.cfg.vitalityRecoveryPerSecond * 0.25);
    }

    if (this.binaryMaterial) {
      const motion = clamp01((this.velocity.length() / Math.max(0.0001, this.cfg.flySpeed)) * (this.cfg.shellMotionStrength || 1.0));
      this.binaryMaterial.uniforms.uTime.value = elapsed;
      this.binaryMaterial.uniforms.uSadness.value = hungry ? 1.0 : 0.0;
      this.binaryMaterial.uniforms.uAlphaBoost.value = 1.0;
      this.binaryMaterial.uniforms.uMotion.value = motion;
    }

    this.updateVoidVisual(elapsed, delta);
    this.updateNestAnimations(elapsed, coverWorldData);
    this.updateStateAndMotion(delta, elapsed, hoveredEntry, hoveredIndex, coverWorldData);
    this.updateTrail(delta, elapsed);

    if (this.hitProxy) {
      this.hitProxy.position.set(0, 0, 0);
    }

    this.saveState(false);
  }

  updateStateAndMotion(delta, elapsed, hoveredEntry, hoveredIndex, coverWorldData) {
    const hasVoid = this.voidState?.active;
    const coverTarget = (!hasVoid && hoveredIndex >= 0) ? this.getCoverPerchTarget(hoveredIndex, coverWorldData) : null;
    const voidTarget = hasVoid ? this.getVoidInspectTarget() : null;

    if (hasVoid) {
      if (this.mode === "landed" || this.mode === "landing") {
        this.startTakeoff(elapsed);
      }
      if (this.mode !== "takeoff" && this.mode !== "backflip" && this.mode !== "inspectVoid") {
        this.mode = "approachVoid";
      }
    } else if (coverTarget) {
      this.hoverClock += delta;
      if (this.mode !== "takeoff" && this.mode !== "backflip" && this.hoverClock >= this.cfg.hoverPerchDelay) {
        if (this.mode !== "landed" && this.mode !== "landing") this.mode = "approachCover";
      }
    } else {
      this.hoverClock = 0;
      if ((this.mode === "landed" || this.mode === "landing") && !hasVoid) {
        this.startTakeoff(elapsed);
      }
      if (!hasVoid && this.mode !== "takeoff" && this.mode !== "backflip" && this.mode !== "inspectVoid") {
        this.mode = "patrol";
      }
    }

    if (this.mode === "takeoff") {
      this.updateTakeoffMotion(elapsed);
      return;
    }

    if (this.mode === "backflip") {
      this.root.position.addScaledVector(this.velocity, delta);
      this.lookAtDirection(this.getFacingDirection(this.root.position.clone().add(this.velocity)), this.cfg.turnLerpFast);
      return;
    }

    if (this.mode === "inspectVoid" && voidTarget) {
      this.updateVoidInspect(delta, elapsed, voidTarget);
      return;
    }

    if (this.mode === "landed" && coverTarget) {
      this.perched = true;
      this.root.position.lerp(coverTarget.position, this.cfg.coverPerchLerp);
      this.lookAtPoint(coverTarget.position.clone().add(coverTarget.normal), coverTarget.up, 0.12);
      if (this.currentActionKey !== "perch") this.playLoop("perch");
      return;
    }

    if (this.mode === "approachCover" && coverTarget) {
      const distance = this.root.position.distanceTo(coverTarget.position);
      if (distance <= this.cfg.landTriggerDistance) {
        this.mode = "landing";
        this.perched = false;
        this.playOnce("land", "perch");
        this.maybeDropNest(coverTarget.position, hoveredIndex);
      }
      this.moveToward(delta, coverTarget.position, this.getPatrolFlightSpeed(elapsed) * 0.95);
      this.lookAtDirection(this.getFacingDirection(coverTarget.position), this.cfg.turnLerpFast);
      if (this.currentActionKey !== "land" && this.currentActionKey !== "perch") {
        this.playLoop(this.getPatrolFlightAction());
      }
      return;
    }

    if (this.mode === "approachVoid" && voidTarget) {
      const distance = this.root.position.distanceTo(voidTarget.position);
      this.moveToward(delta, voidTarget.position, this.cfg.diveSpeed);
      this.lookAtDirection(this.getFacingDirection(voidTarget.position), this.cfg.turnLerpFast);
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
      if (elapsed >= this.nextPatrolDecisionAt || this.root.position.distanceTo(this.currentPatrolAnchor) < 0.18 || !this.worldPointComfortablyVisible(this.currentPatrolAnchor)) {
        this.pickNextPatrolPoint();
      }

      if (!this.worldPointComfortablyVisible(this.root.position, 1.05)) {
        this.pickNextPatrolPoint();
      }

      if (!this.worldPointComfortablyVisible(this.root.position, this.cfg.patrolRecoveryMargin)) {
        this.currentPatrolAnchor.copy(this.getRecoveryPatrolPoint());
      }

      this.moveToward(delta, this.currentPatrolAnchor, this.getPatrolFlightSpeed(elapsed));
      this.lookAtDirection(this.getFacingDirection(this.currentPatrolAnchor), this.cfg.turnLerpFast);
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

    this.velocity.lerp(desired, 1.0 - Math.exp(-delta * 5.4));

    if (!this.worldPointComfortablyVisible(this.root.position, this.cfg.patrolRecoveryMargin)) {
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
      this.mode = "patrol";
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

  lookAtDirection(direction, lerpAmount = this.cfg.turnLerp) {
    if (direction.lengthSq() <= 0.0001) return;
    this.forward.copy(direction).normalize();
    this.temp.m.lookAt(this.root.position, this.temp.a.copy(this.root.position).add(this.forward), new THREE.Vector3(0, 1, 0));
    this.temp.q.setFromRotationMatrix(this.temp.m);
    this.root.quaternion.slerp(this.temp.q, lerpAmount);
  }

  lookAtPoint(point, up = new THREE.Vector3(0, 1, 0), lerpAmount = 0.12) {
    this.temp.m.lookAt(this.root.position, point, up);
    this.temp.q.setFromRotationMatrix(this.temp.m);
    this.root.quaternion.slerp(this.temp.q, lerpAmount);
  }

  getPatrolFlightSpeed(elapsed) {
    return this.isHungry(elapsed) ? this.cfg.flySpeed * this.cfg.flySadSpeedScale : this.cfg.flySpeed;
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

  handleClick(event, hoveredEntry) {
    if (!this.ready || !this.visible) return false;
    if (event.button !== 0) return false;
    if (event.target?.closest?.("button, a, nav, .folder-label, .quick-nav")) return false;

    const bounds = this.renderer.domElement.getBoundingClientRect();
    this.temp.pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
    this.temp.pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
    this.temp.raycaster.setFromCamera(this.temp.pointer, this.camera);

    if (this.hitProxy) {
      const hits = this.temp.raycaster.intersectObject(this.hitProxy, false);
      if (hits.length) {
        this.performBackflip();
        return true;
      }
    }

    if (hoveredEntry) return false;

    const point = this.pickVoidPoint();
    if (point) {
      this.spawnVoid(point);
      return true;
    }

    return false;
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
    this.flipBusy = true;
    this.perched = false;
    this.mode = "backflip";
    this.takeoffState = null;
    this.pickNextPatrolPoint();
    this.root.position.y += this.cfg.backflipLift;
    this.velocity.add(this.forward.clone().multiplyScalar(-this.cfg.backflipPush));
    if (!this.playOnce("backflip", this.getPatrolFlightAction())) {
      this.flipBusy = false;
      this.mode = this.voidState?.active ? "approachVoid" : "patrol";
      this.playLoop(this.getPatrolFlightAction());
    }
  }
}
