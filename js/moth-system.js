import * as THREE from "https://esm.sh/three@0.160.0";
import { FBXLoader } from "https://esm.sh/three@0.160.0/examples/jsm/loaders/FBXLoader.js";
import { GLTFLoader } from "https://esm.sh/three@0.160.0/examples/jsm/loaders/GLTFLoader.js";

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
  storageKey: "orbitSpecterMothV1",
  pointLimit: 520,
  patrolRadiusMin: 1.18,
  patrolRadiusMax: 2.28,
  patrolHeightMin: -0.2,
  patrolHeightMax: 1.9,
  patrolSpeed: 0.70,
  flySpeed: 1.55,
  diveSpeed: 2.25,
  perchDistance: 0.18,
  perchSoftness: 0.18,
  turnLerp: 0.14,
  shoulderBias: new THREE.Vector3(0.36, 0.86, 0.12),
  coverPerchLift: 0.065,
  coverPerchForward: 0.06,
  hoverPerchDelay: 0.12,
  voidConsumeDistance: 0.18,
  voidSpawnRadius: 2.25,
  voidHeightMin: -0.9,
  voidHeightMax: 1.8,
  voidParticleCount: 320,
  voidDepth: 0.88,
  ghostCount: 6,
  nestMax: 5,
  nestChancePerPerch: 0.22,
  nestDepositDelay: 7.5,
  stateSaveInterval: 5,
  vitalityDrainPerSecond: 0.0032,
  vitalityRecoveryPerSecond: 0.0095,
  offlineDrainPerHour: 0.05,
  sadThreshold: 0.28,
  swarmThreshold: 1.25,
  sizeRatioToModelHeight: 0.078,
  clickEvadeLift: 0.28,
  clickEvadePush: 0.22,
  debug: false
};

const ACTION_KEYS = {
  fly: ["f fly", "fly"],
  flySad: ["f fly sad", "fly sad", "sad"],
  land: ["f land", "land"],
  perch: ["f land idle", "land idle", "idle"],
  takeoff: ["f land to takeoff", "land to take off", "takeoff", "take off"],
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

function smootherstep(v) {
  const t = clamp01(v);
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function cubicBezier(a, b, c, d, t, out) {
  const inv = 1 - t;
  const inv2 = inv * inv;
  const inv3 = inv2 * inv;
  const t2 = t * t;
  const t3 = t2 * t;

  out.set(
    inv3 * a.x + 3 * inv2 * t * b.x + 3 * inv * t2 * c.x + t3 * d.x,
    inv3 * a.y + 3 * inv2 * t * b.y + 3 * inv * t2 * c.y + t3 * d.y,
    inv3 * a.z + 3 * inv2 * t * b.z + 3 * inv * t2 * c.z + t3 * d.z
  );

  return out;
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

function hexToRgba(hex, alpha) {
  const color = new THREE.Color(hex);
  return `rgba(${Math.round(color.r * 255)}, ${Math.round(color.g * 255)}, ${Math.round(color.b * 255)}, ${alpha})`;
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
      uSwarm: { value: 0 }
    },
    vertexShader: `
      uniform float uTime;
      uniform vec3 uLightDir;
      uniform float uSadness;
      uniform float uSwarm;

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
        float flutter = 1.0 + uSwarm * 0.55 - uSadness * 0.22;
        float drift = (0.0022 + aSeed * 0.0030) * flutter;
        p.x += sin(uTime * (2.2 + fract(aSeed * 0.8)) + aSeed * 31.0) * drift;
        p.y += cos(uTime * (2.6 + fract(aSeed * 0.9)) + aSeed * 47.0) * drift;
        p.z += sin(uTime * (2.0 + fract(aSeed * 0.7)) + aSeed * 19.0) * drift;

        vec3 worldNormal = normalize(mat3(modelMatrix) * aNormal);
        float light = max(dot(worldNormal, normalize(uLightDir)), 0.0);
        float shade = pow(smoothstep(0.08, 0.98, light), 1.6);

        float digitSwitch = floor(uTime * (2.1 + fract(aSeed * 1.6)) + aSeed * 18.0);
        vDigit = mod(digitSwitch, 2.0);
        vPalette = fract(aSeed * 9.7 + uSwarm * 0.08);
        vShade = shade;
        vAlpha = aAlpha * mix(0.48, 1.0, shade) * (1.0 - uSadness * 0.35);

        vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = max(2.4, aSize * (28.0 / max(1.0, -mvPosition.z)) * (1.0 + uSwarm * 0.16));
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
        color *= mix(0.22, 1.0, vShade);
        color = mix(color, vec3(0.10, 0.18, 0.24), uSadness * 0.45);
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
      uAlpha: { value: 1 },
      uDepth: { value: 1 }
    },
    vertexShader: `
      uniform float uTime;
      uniform float uDepth;
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

function randomFromRange(min, max) {
  return min + Math.random() * (max - min);
}

function simpleHash(n) {
  return (Math.sin(n * 127.1 + 311.7) * 43758.5453) % 1;
}

export class MothSystem {
  constructor(options) {
    this.scene = options.scene;
    this.camera = options.camera;
    this.renderer = options.renderer;
    this.orbitRoot = options.orbitRoot;
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
    this.gltfLoader = new GLTFLoader();

    this.root = new THREE.Group();
    this.root.name = "SpecterMothRoot";
    this.scene.add(this.root);

    this.modelRoot = null;
    this.mixer = null;
    this.actions = new Map();
    this.currentActionKey = "";
    this.pendingActionKey = "";
    this.binaryShell = null;
    this.binaryMaterial = null;
    this.hitProxy = null;

    this.trail = [];
    this.ghosts = [];
    this.nestGroup = new THREE.Group();
    this.voidGroup = new THREE.Group();
    this.scene.add(this.nestGroup);
    this.scene.add(this.voidGroup);

    this.voidPoints = null;
    this.voidGeometry = null;
    this.voidMaterial = null;
    this.voidCore = null;
    this.voidSeed = null;
    this.voidState = null;

    this.nests = [];
    this.coverNestMap = new Map();
    this.saved = this.loadSavedState();
    this.vitality = clamp01(this.saved.vitality ?? 0.82);
    this.lastSaveAt = 0;
    this.lastPerchAt = 0;
    this.lastNestDropAt = 0;
    this.hoverClock = 0;
    this.idleClock = 0;
    this.state = "curious";
    this.perched = false;
    this.flipBusy = false;
    this.visible = true;
    this.ready = false;
    this.targetMode = "patrol";
    this.preferredCoverIndex = -1;
    this.perchTarget = new THREE.Vector3();
    this.velocity = new THREE.Vector3();
    this.forward = new THREE.Vector3(0, 0, 1);
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
      targetQuat: new THREE.Quaternion(),
      screen: new THREE.Vector3()
    };

    this.shoulderLocal = this.cfg.shoulderBias.clone();
    this.shoulderWorld = new THREE.Vector3();
    this.currentPatrolAnchor = new THREE.Vector3();
    this.nextPatrolDecisionAt = 0;

    this.root.position.copy(this.orbitCenter).add(new THREE.Vector3(0.2, 0.9, 0.5));

    this.initGhosts();
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
    } catch (error) {
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
    } catch (error) {
      // ignore storage failures
    }
  }

  applyOfflineDecay() {
    const lastVisit = Number(this.saved.lastVisit || 0);
    if (!lastVisit) return;
    const hours = Math.max(0, (Date.now() - lastVisit) / (1000 * 60 * 60));
    if (hours <= 0.1) return;
    this.vitality = clamp01(this.vitality - hours * this.cfg.offlineDrainPerHour);
    if (hours > 18 && this.nests.length < this.cfg.nestMax) {
      const extraCount = Math.min(this.cfg.nestMax - this.nests.length, Math.floor(hours / 24));
      for (let i = 0; i < extraCount; i += 1) {
        const pos = this.randomGroundNestPoint(i + 31);
        this.spawnNestAt(pos, new THREE.Euler(-Math.PI / 2, Math.random() * Math.PI, 0), 0.12 + Math.random() * 0.08, "ground");
      }
    }
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
      const loaded = await this.loadVisualRig();
      this.setupModel(loaded.model, loaded.clips);
    } catch (error) {
      this.log("moth asset load failed :: using fallback shell", "WARN");
      this.setupModel(this.createFallbackMoth(), []);
    }
  }

  async loadVisualRig() {
    const baseModel = await this.loadModelAsset(this.assets.modelFBX || this.assets.modelGLB || this.assets.modelGLTF);
    const embeddedClips = Array.isArray(baseModel.animations) ? baseModel.animations : [];
    const externalClipMap = await this.loadExternalAnimations(this.assets.motions || {});
    const clips = [...embeddedClips, ...Object.values(externalClipMap).filter(Boolean)];
    return { model: baseModel.scene || baseModel, clips };
  }

  loadModelAsset(path) {
    if (!path) {
      return Promise.resolve({ scene: this.createFallbackMoth(), animations: [] });
    }

    const lower = String(path).toLowerCase();
    return new Promise((resolve, reject) => {
      if (lower.endsWith(".fbx")) {
        this.fbxLoader.load(path, (fbx) => resolve(fbx), undefined, reject);
      } else {
        this.gltfLoader.load(path, (gltf) => resolve(gltf), undefined, reject);
      }
    });
  }

  async loadExternalAnimations(motionMap) {
    const entries = Object.entries(motionMap).filter(([, path]) => Boolean(path));
    const result = {};

    await Promise.all(entries.map(async ([key, path]) => {
      try {
        const loaded = await this.loadModelAsset(path);
        const clip = (loaded.animations && loaded.animations[0]) || null;
        if (clip) result[key] = clip;
      } catch (error) {
        this.log(`animation missing :: ${key}`, "WARN");
      }
    }));

    return result;
  }

  createFallbackMoth() {
    const group = new THREE.Group();

    const body = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.06, 0.16, 4, 8),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    body.rotation.z = Math.PI * 0.5;
    group.add(body);

    const wingGeo = new THREE.PlaneGeometry(0.22, 0.36, 2, 2);
    const wingA = new THREE.Mesh(wingGeo, new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide }));
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
      new THREE.MeshBasicMaterial({ visible: false })
    );
    tail.rotation.z = Math.PI * 0.5;
    tail.position.set(0.18, -0.02, 0);
    group.add(tail);

    return group;
  }

  setupModel(model, clips) {
    this.modelRoot = model;
    this.root.add(this.modelRoot);

    this.modelRoot.traverse((child) => {
      if (!child.isMesh) return;
      child.visible = false;
      child.frustumCulled = false;
      if (child.geometry && !child.geometry.attributes.normal && typeof child.geometry.computeVertexNormals === "function") {
        child.geometry.computeVertexNormals();
      }
    });

    this.fitMothScale();
    this.setupShoulderAnchor();
    this.setupAnimations(clips);
    this.buildBinaryShell();
    this.buildHitProxy();
    this.ready = true;

    this.root.position.copy(this.shoulderWorld);
    this.playLoop(this.vitality < this.cfg.sadThreshold ? "flySad" : "fly");
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

  setupShoulderAnchor() {
    const box = new THREE.Box3().setFromObject(this.centralModel);
    const size = box.getSize(this.temp.size);
    const min = box.min;
    this.shoulderWorld.set(
      min.x + size.x * 0.68,
      min.y + size.y * 0.72,
      min.z + size.z * 0.16
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
    });

    this.mixer.addEventListener("finished", (event) => this.onActionFinished(event));
  }

  onActionFinished() {
    if (this.pendingActionKey) {
      const next = this.pendingActionKey;
      this.pendingActionKey = "";
      if (next === "perch") {
        this.perched = true;
        this.playLoop("perch");
      } else if (next === "fly" || next === "flySad") {
        this.perched = false;
        this.playLoop(next);
      } else {
        this.playLoop(next);
      }
      return;
    }

    if (this.flipBusy) {
      this.flipBusy = false;
      this.playLoop(this.vitality < this.cfg.sadThreshold ? "flySad" : "fly");
      return;
    }
  }

  getAction(key) {
    return this.actions.get(key) || null;
  }

  playLoop(key) {
    const next = this.getAction(key);
    if (!next) return;
    if (this.currentActionKey === key && next.isRunning()) return;

    this.actions.forEach((action, actionKey) => {
      if (actionKey === key) return;
      action.fadeOut(0.18);
    });

    next.reset();
    next.setLoop(THREE.LoopRepeat, Infinity);
    next.clampWhenFinished = false;
    next.fadeIn(0.16).play();
    this.currentActionKey = key;
  }

  playOnce(key, followUp = "") {
    const next = this.getAction(key);
    if (!next) {
      if (followUp) this.playLoop(followUp);
      return;
    }

    this.actions.forEach((action, actionKey) => {
      if (actionKey === key) return;
      action.fadeOut(0.12);
    });

    this.pendingActionKey = followUp;
    next.reset();
    next.setLoop(THREE.LoopOnce, 1);
    next.clampWhenFinished = true;
    next.fadeIn(0.10).play();
    this.currentActionKey = key;
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
      sizes[i] = 0.64 + Math.random() * 0.38;
      alphas[i] = 0.48 + Math.random() * 0.42;
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
    this.root.add(this.binaryShell);
  }

  buildHitProxy() {
    const proxy = new THREE.Mesh(
      new THREE.SphereGeometry(0.11, 12, 12),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
    );
    proxy.name = "SpecterMothHitProxy";
    proxy.renderOrder = 0;
    this.hitProxy = proxy;
    this.root.add(proxy);
  }

  extractPointsFromModel(model, limit = 480) {
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
    const step = Math.max(1, Math.floor(totalVerts / Math.max(limit, 1)));

    meshes.forEach((mesh) => {
      const pos = mesh.geometry.attributes.position;
      const nor = mesh.geometry.attributes.normal;
      const normalMatrix = new THREE.Matrix3().getNormalMatrix(mesh.matrixWorld);

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

    const count = positions.length / 3 || 1;
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

  initGhosts() {
    for (let i = 0; i < this.cfg.ghostCount; i += 1) {
      const plane = new THREE.Mesh(
        new THREE.PlaneGeometry(0.16, 0.16, 1, 1),
        new THREE.MeshBasicMaterial({
          map: this.messTexture,
          transparent: true,
          opacity: 0,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          color: this.palette[i % this.palette.length].clone()
        })
      );
      plane.visible = false;
      plane.renderOrder = 11;
      this.scene.add(plane);
      this.ghosts.push({
        mesh: plane,
        historyIndex: i * 3
      });
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

    const disc = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.42, 1, 1), createCoreDiscMaterial());
    disc.visible = false;
    disc.renderOrder = 12;
    this.voidCore = disc;
    this.voidGroup.add(disc);

    this.voidSeed = Array.from({ length: count }, () => ({
      angle: Math.random() * Math.PI * 2,
      radius: 0.18 + Math.random() * 0.78,
      t: Math.random(),
      spin: 1.0 + Math.random() * 2.2,
      wobble: Math.random() * Math.PI * 2
    }));
  }

  randomGroundNestPoint(seed = Math.random() * 1000) {
    const angle = simpleHash(seed + 1.1) * Math.PI * 2;
    const radius = 1.2 + Math.abs(simpleHash(seed + 7.3)) * 1.2;
    const y = this.orbitCenter.y - 1.48 + simpleHash(seed + 3.3) * 0.06;
    return new THREE.Vector3(
      this.orbitCenter.x + Math.cos(angle) * radius,
      y,
      this.orbitCenter.z + Math.sin(angle) * radius
    );
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

    if (typeof coverIndex === "number") {
      this.coverNestMap.set(coverIndex, entry);
    }

    this.nests.push(entry);
    return entry;
  }

  maybeDropNest(target, coverIndex = null) {
    if (this.nests.length >= this.cfg.nestMax) return;
    if (this.getElapsed() - this.lastNestDropAt < this.cfg.nestDepositDelay) return;
    if (Math.random() > this.cfg.nestChancePerPerch) return;

    const rotation = new THREE.Euler(-Math.PI / 2, Math.random() * Math.PI, 0);
    const position = target.clone();

    if (typeof coverIndex === "number") {
      position.y += 0.01;
      this.spawnNestAt(position, rotation, 0.08 + Math.random() * 0.05, "cover", coverIndex);
      this.log(`nest woven :: cover ${String(coverIndex + 1).padStart(2, "0")}`, "FLOW");
    } else {
      this.spawnNestAt(position, rotation, 0.12 + Math.random() * 0.06, "ground");
      this.log("ground nest formed", "FLOW");
    }

    this.lastNestDropAt = this.getElapsed();
    this.saveState(true);
  }

  setVisibility(visible) {
    this.visible = Boolean(visible);
    this.root.visible = this.visible;
    this.nestGroup.visible = this.visible;
    this.voidGroup.visible = this.visible;
    this.ghosts.forEach((ghost) => {
      ghost.mesh.visible = this.visible && ghost.mesh.material.opacity > 0.01;
    });
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
      activeEntry,
      activeIndex,
      audioReactiveLevel
    } = context;

    const sceneVisible = introComplete && !introActive;
    this.setVisibility(sceneVisible);
    if (!sceneVisible) return;

    if (this.mixer) this.mixer.update(delta);

    this.vitality = clamp01(
      this.vitality + delta * (this.voidState && this.voidState.active ? this.cfg.vitalityRecoveryPerSecond : -this.cfg.vitalityDrainPerSecond)
    );

    this.updateShoulderAnchor();
    this.updateTargetMode(delta, hoveredEntry, hoveredIndex, activeEntry, activeIndex, coverWorldData);
    this.updateVoidVisual(elapsed, delta);
    this.updateMotion(delta, elapsed, hoveredIndex, coverWorldData, audioReactiveLevel);
    this.updateGhosts(elapsed);
    this.updateNestAnimations(elapsed, coverWorldData);
    this.updateBinaryMaterial(elapsed);
    this.saveState(false);
  }

  updateShoulderAnchor() {
    const box = this.temp.bbox.setFromObject(this.centralModel);
    if (box.isEmpty()) return;
    const size = box.getSize(this.temp.size);
    this.shoulderWorld.set(
      box.min.x + size.x * 0.68,
      box.min.y + size.y * 0.72,
      box.min.z + size.z * 0.16
    );
  }

  updateTargetMode(delta, hoveredEntry, hoveredIndex, activeEntry, activeIndex, coverWorldData) {
    this.idleClock += delta;

    if (hoveredEntry) {
      this.hoverClock += delta;
      if (this.hoverClock >= this.cfg.hoverPerchDelay) {
        this.targetMode = "cover";
        this.preferredCoverIndex = hoveredIndex;
      }
    } else {
      this.hoverClock = 0;
    }

    if (this.voidState?.active) {
      this.targetMode = this.voidState.energy >= this.cfg.swarmThreshold ? "swarmFeed" : "feed";
      return;
    }

    if (hoveredEntry) {
      this.targetMode = "cover";
      return;
    }

    if (this.targetMode === "cover") {
      this.targetMode = this.vitality < this.cfg.sadThreshold ? "shoulder" : "patrol";
      this.pickNextPatrolPoint();
    }

    if (this.vitality < this.cfg.sadThreshold) {
      this.targetMode = "shoulder";
      return;
    }

    if (this.idleClock > this.nextPatrolDecisionAt) {
      this.targetMode = Math.random() > 0.72 ? "shoulder" : "patrol";
      this.pickNextPatrolPoint();
      this.nextPatrolDecisionAt = this.idleClock + randomFromRange(3.5, 7.0);
    }

    if (activeIndex >= 0 && Math.random() > 0.995) {
      this.targetMode = "cover";
      this.preferredCoverIndex = activeIndex;
    }
  }

  pickNextPatrolPoint() {
    const angle = Math.random() * Math.PI * 2;
    const radius = randomFromRange(this.cfg.patrolRadiusMin, this.cfg.patrolRadiusMax);
    const y = randomFromRange(this.cfg.patrolHeightMin, this.cfg.patrolHeightMax);
    this.currentPatrolAnchor.set(
      this.orbitCenter.x + Math.cos(angle) * radius,
      this.orbitCenter.y + y,
      this.orbitCenter.z + Math.sin(angle) * radius
    );
  }

  getCoverPerchTarget(index, coverWorldData) {
    const cover = coverWorldData[index];
    if (!cover) return null;

    const lift = this.coverSize.height * 0.5 + this.cfg.coverPerchLift;
    return this.temp.a.copy(cover.position)
      .addScaledVector(cover.up, lift)
      .addScaledVector(cover.right, this.cfg.coverPerchForward);
  }

  updateMotion(delta, elapsed, hoveredIndex, coverWorldData, audioReactiveLevel) {
    let target = null;
    let movingSpeed = this.cfg.flySpeed;
    let desiredState = "curious";
    let allowPerch = false;
    let perchCoverIndex = null;

    if (this.voidState?.active) {
      target = this.voidState.position.clone().add(new THREE.Vector3(0, 0.04, 0.18));
      movingSpeed = this.cfg.diveSpeed;
      desiredState = this.voidState.energy >= this.cfg.swarmThreshold ? "swarming" : "feeding";
    } else if (hoveredIndex !== -1 || (this.targetMode === "cover" && this.preferredCoverIndex >= 0)) {
      const coverIndex = hoveredIndex !== -1 ? hoveredIndex : this.preferredCoverIndex;
      target = this.getCoverPerchTarget(coverIndex, coverWorldData);
      desiredState = "curious";
      allowPerch = true;
      perchCoverIndex = coverIndex;
    } else if (this.targetMode === "shoulder") {
      target = this.shoulderWorld.clone();
      allowPerch = true;
      desiredState = this.vitality < this.cfg.sadThreshold ? "dying" : "hiding";
    } else {
      if (this.currentPatrolAnchor.lengthSq() < 0.01) this.pickNextPatrolPoint();
      target = this.currentPatrolAnchor.clone();
      desiredState = this.vitality < this.cfg.sadThreshold ? "dying" : "curious";
    }

    this.state = desiredState;

    const toTarget = this.temp.b.copy(target).sub(this.root.position);
    const distance = toTarget.length();
    const dir = distance > 0.0001 ? toTarget.normalize() : this.forward;

    if (allowPerch && distance <= this.cfg.perchDistance && !this.perched && !this.flipBusy) {
      this.perchTarget.copy(target);
      this.playLandSequence();
      this.maybeDropNest(target, perchCoverIndex);
    }

    const leavingPerch = this.perched && (!allowPerch || distance > this.cfg.perchDistance * 1.8 || this.voidState?.active);
    if (leavingPerch && !this.flipBusy) {
      this.perched = false;
      if (this.getAction("takeoff")) {
        this.playOnce("takeoff", this.vitality < this.cfg.sadThreshold ? "flySad" : "fly");
      } else {
        this.playLoop(this.vitality < this.cfg.sadThreshold ? "flySad" : "fly");
      }
    }

    if (this.perched) {
      this.root.position.lerp(target, this.cfg.perchSoftness);
      this.lookInDirection(dir, 0.08);
      return;
    }

    if (!this.flipBusy) {
      if (this.voidState?.active) {
        this.ensureFlightAction(this.vitality < this.cfg.sadThreshold ? "flySad" : "fly");
      } else if (this.vitality < this.cfg.sadThreshold) {
        this.ensureFlightAction("flySad");
      } else {
        this.ensureFlightAction("fly");
      }
    }

    const speed = movingSpeed * (this.vitality < this.cfg.sadThreshold ? 0.72 : 1.0);
    const desiredVelocity = dir.clone().multiplyScalar(speed);
    this.velocity.lerp(desiredVelocity, this.voidState?.active ? 0.16 : 0.12);

    if (this.targetMode === "patrol") {
      const swirl = new THREE.Vector3(
        Math.cos(elapsed * 1.4) * 0.16,
        Math.sin(elapsed * 2.1) * 0.06,
        Math.sin(elapsed * 1.1) * 0.16
      );
      this.velocity.addScaledVector(swirl, delta * 0.24);
    }

    if (this.voidState?.active && distance <= this.cfg.voidConsumeDistance) {
      this.consumeVoid(delta);
    }

    this.root.position.addScaledVector(this.velocity, delta);
    this.lookInDirection(this.velocity.lengthSq() > 0.0001 ? this.velocity : dir, this.cfg.turnLerp + audioReactiveLevel * 0.02);
  }

  ensureFlightAction(key) {
    if (this.currentActionKey === key) return;
    this.playLoop(key);
  }

  playLandSequence() {
    if (this.perched || this.flipBusy) return;
    if (this.currentActionKey === "land" || this.currentActionKey === "perch") return;
    if (this.getAction("land")) {
      this.playOnce("land", "perch");
    } else {
      this.perched = true;
      this.playLoop("perch");
    }
  }

  lookInDirection(direction, lerpAmount = 0.14) {
    if (direction.lengthSq() <= 0.0001) return;
    this.forward.copy(direction).normalize();
    this.temp.m.lookAt(this.root.position, this.temp.c.copy(this.root.position).add(this.forward), new THREE.Vector3(0, 1, 0));
    this.temp.targetQuat.setFromRotationMatrix(this.temp.m);
    this.root.quaternion.slerp(this.temp.targetQuat, lerpAmount);
  }

  consumeVoid(delta) {
    if (!this.voidState?.active) return;
    if (!this.flipBusy && this.currentActionKey !== "feed" && this.getAction("feed")) {
      this.playLoop("feed");
    }
    this.voidState.energy -= delta * 0.9;
    this.vitality = clamp01(this.vitality + delta * this.cfg.vitalityRecoveryPerSecond * 1.8);
    if (this.voidState.energy <= 0.02) {
      this.log("binary void consumed", "OK");
      this.clearVoid();
      this.targetMode = "patrol";
      this.pickNextPatrolPoint();
      if (!this.flipBusy) {
        this.playLoop(this.vitality < this.cfg.sadThreshold ? "flySad" : "fly");
      }
    }
  }

  updateBinaryMaterial(elapsed) {
    if (!this.binaryMaterial) return;
    const sadness = smooth01(1 - this.vitality);
    const swarm = this.voidState?.active ? smooth01(this.voidState.energy / this.cfg.swarmThreshold) : 0;
    this.binaryMaterial.uniforms.uTime.value = elapsed;
    this.binaryMaterial.uniforms.uSadness.value = sadness;
    this.binaryMaterial.uniforms.uSwarm.value = swarm;
    this.binaryMaterial.uniforms.uAlphaBoost.value = this.visible ? 1 : 0;
  }

  updateGhosts(elapsed) {
    const swarm = this.voidState?.active ? clamp01(this.voidState.energy / this.cfg.swarmThreshold) : 0;
    const showGhosts = swarm > 0.72 || this.state === "swarming";
    const baseColor = this.palette[Math.floor((elapsed * 2.0) % this.palette.length)];

    this.ghosts.forEach((ghost, index) => {
      const strength = showGhosts ? (0.32 - index * 0.03) * swarm : 0;
      ghost.mesh.visible = strength > 0.01 && this.visible;
      ghost.mesh.material.opacity = THREE.MathUtils.lerp(ghost.mesh.material.opacity, Math.max(0, strength), 0.16);
      ghost.mesh.material.color.lerp(baseColor, 0.12);
      ghost.mesh.position.copy(this.root.position)
        .add(this.forward.clone().multiplyScalar(-0.05 * (index + 1)))
        .add(new THREE.Vector3(
          Math.cos(elapsed * 2.2 + index) * 0.04 * swarm,
          Math.sin(elapsed * 2.8 + index * 0.7) * 0.03 * swarm,
          Math.sin(elapsed * 2.0 + index) * 0.04 * swarm
        ));
      ghost.mesh.lookAt(this.camera.position);
      ghost.mesh.scale.setScalar(0.16 + index * 0.015 + swarm * 0.05);
    });
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
    const energy = clamp01(this.voidState.energy / 1.4);

    for (let i = 0; i < this.voidSeed.length; i += 1) {
      const seed = this.voidSeed[i];
      seed.t = (seed.t + delta * (0.30 + energy * 0.55) * seed.spin) % 1;
      const t = seed.t;
      const radius = (0.56 * energy) * Math.pow(1 - t, 1.25) * (0.35 + seed.radius * 0.75);
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
    if (!this.voidState) {
      this.voidState = {
        active: true,
        position: position.clone(),
        energy: 1.0
      };
    } else {
      this.voidState.active = true;
      this.voidState.position.copy(position);
      this.voidState.energy = Math.min(1.6, this.voidState.energy + 0.34);
    }

    this.perched = false;
    this.targetMode = this.voidState.energy >= this.cfg.swarmThreshold ? "swarmFeed" : "feed";
    this.playLoop(this.vitality < this.cfg.sadThreshold ? "flySad" : "fly");
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
    this.targetMode = "patrol";
    this.pickNextPatrolPoint();
    this.root.position.y += this.cfg.clickEvadeLift * 0.16;
    this.velocity.add(this.forward.clone().multiplyScalar(-this.cfg.clickEvadePush));
    if (this.getAction("backflip")) {
      this.playOnce("backflip", this.vitality < this.cfg.sadThreshold ? "flySad" : "fly");
    } else {
      this.flipBusy = false;
      this.playLoop(this.vitality < this.cfg.sadThreshold ? "flySad" : "fly");
    }
    this.log("specter moth startled :: backflip", "WARN");
  }
}

