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
  storageKey: "orbitSpecterMothReliableV1",
  sizeRatioToModelHeight: 0.085,
  fallbackMothHeight: 0.30,
  modelYawOffset: 0,
  modelPitchOffset: 0,
  modelRollOffset: 0,

  patrolRadiusMin: 1.15,
  patrolRadiusMax: 2.18,
  patrolHeightMin: -0.18,
  patrolHeightMax: 1.68,
  flySpeed: 1.28,
  diveSpeed: 1.95,
  arrivalRadius: 0.12,
  turnLerp: 0.10,
  damping: 0.93,

  hoverPerchDelay: 0.08,
  coverPerchLift: 0.07,
  coverPerchForward: 0.05,
  clickEvadeLift: 0.24,
  clickEvadePush: 0.28,

  shellCount: 80,
  shellAlpha: 0.15,
  shellPointScale: 0.70,

  trailCount: 220,
  trailEmitInterval: 0.018,
  trailLife: 0.82,
  trailDrag: 1.8,
  trailSpeedFactor: 0.22,
  trailVelocityJitter: 0.15,
  trailAlpha: 0.86,
  trailPointScale: 0.95,
  meshSampleLimit: 420,

  voidParticleCount: 320,
  voidRadius: 0.56,
  voidDepth: 1.12,
  voidSpawnRadius: 2.25,
  voidHeightMin: -0.85,
  voidHeightMax: 1.85,
  voidConsumeDistance: 0.20,
  voidConsumeRate: 0.92,

  nestMax: 6,
  nestChancePerLanding: 0.24,
  nestDepositDelay: 7.0,
  nestScaleMin: 0.08,
  nestScaleMax: 0.16,

  vitalityDrainPerSecond: 0.003,
  vitalityRecoveryPerSecond: 0.011,
  offlineDrainPerHour: 0.05,
  sadThreshold: 0.28,
  stateSaveInterval: 5.0,

  debug: false
};

const ACTION_ALIASES = {
  fly: ["f fly", "fly"],
  flySad: ["f fly sad", "fly sad", "sad"],
  land: ["f land", "land"],
  perch: ["f land idle", "land idle", "idle"],
  takeoff: ["f land to takeoff", "f land to take off", "land to takeoff", "takeoff", "take off"],
  feed: ["f void inspect", "void inspect", "inspect", "feed"],
  backflip: ["f backflip", "backflip", "flip"]
};

function clamp01(v) {
  return THREE.MathUtils.clamp(v, 0, 1);
}

function normalizeName(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/[_|]+/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function safeGet(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

function createGlyphAtlas() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;

  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#ffffff";
  ctx.shadowColor = "rgba(255,255,255,0.22)";
  ctx.shadowBlur = 8;
  ctx.font = '900 360px ui-monospace, "SFMono-Regular", Menlo, Monaco, Consolas, monospace';
  ctx.fillText("0", 256, 260);
  ctx.fillText("1", 768, 260);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.generateMipmaps = false;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
  return tex;
}

function createNestTexture(size = 256) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, size, size);

  const grad = ctx.createRadialGradient(size * 0.5, size * 0.5, size * 0.04, size * 0.5, size * 0.5, size * 0.47);
  grad.addColorStop(0, "rgba(0,0,0,0.88)");
  grad.addColorStop(0.6, "rgba(10,18,30,0.36)");
  grad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(size * 0.5, size * 0.5, size * 0.44, 0, Math.PI * 2);
  ctx.fill();

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = '700 18px ui-monospace, "SFMono-Regular", Menlo, Monaco, Consolas, monospace';
  const cols = ["#2fe4ff", "#4b7dff", "#33ff88", "#ff57ce"];
  for (let i = 0; i < 120; i += 1) {
    ctx.save();
    ctx.translate(Math.random() * size, Math.random() * size);
    ctx.rotate((Math.random() - 0.5) * 1.0);
    ctx.fillStyle = `${cols[i % cols.length]}${Math.floor((0.18 + Math.random() * 0.28) * 255).toString(16).padStart(2, "0")}`;
    ctx.fillText(Math.random() > 0.5 ? "0" : "1", 0, 0);
    ctx.restore();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.generateMipmaps = false;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
  return tex;
}

function createBinaryPointMaterial(atlas, palette, additive = true) {
  const p = palette.map((c) => c.clone());
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    uniforms: {
      uAtlas: { value: atlas },
      uTime: { value: 0 },
      uAlpha: { value: 1.0 },
      uPalette: { value: p }
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
        vec3 p = position;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        float life = clamp(aLife, 0.0, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = (24.0 * aSize * max(0.03, life)) / max(0.65, -mv.z);
        vDigit = mod(floor(uTime * (3.0 + fract(aSeed * 2.3)) + aSeed * 37.0), 2.0);
        vPalette = fract(aSeed * 9.91 + uTime * 0.03);
        vAlpha = life;
      }
    `,
    fragmentShader: `
      uniform sampler2D uAtlas;
      uniform float uAlpha;
      uniform vec3 uPalette[7];
      varying float vDigit;
      varying float vAlpha;
      varying float vPalette;
      vec3 pickPalette(float t) {
        float s = clamp(t, 0.0, 0.999) * 7.0;
        int idx = int(floor(s));
        if (idx <= 0) return uPalette[0];
        if (idx == 1) return uPalette[1];
        if (idx == 2) return uPalette[2];
        if (idx == 3) return uPalette[3];
        if (idx == 4) return uPalette[4];
        if (idx == 5) return uPalette[5];
        return uPalette[6];
      }
      void main() {
        vec2 uv = gl_PointCoord;
        uv.x = mix(uv.x * 0.5, 0.5 + uv.x * 0.5, step(0.5, vDigit));
        vec4 glyph = texture2D(uAtlas, uv);
        float radial = smoothstep(1.0, 0.15, distance(gl_PointCoord, vec2(0.5)));
        float alpha = glyph.a * radial * vAlpha * uAlpha;
        if (alpha < 0.02) discard;
        vec3 color = pickPalette(vPalette);
        gl_FragColor = vec4(color, alpha);
      }
    `
  });
}

function lookQuat(from, to, up, out) {
  const m = new THREE.Matrix4();
  m.lookAt(from, to, up);
  out.setFromRotationMatrix(m);
  return out;
}

function randomRange(min, max) {
  return min + Math.random() * (max - min);
}

function tryClip(map, aliases) {
  for (const alias of aliases) {
    const direct = map.get(alias);
    if (direct) return direct;
  }
  for (const [name, clip] of map.entries()) {
    for (const alias of aliases) {
      if (name.includes(alias)) return clip;
    }
  }
  return null;
}

export class MothSystem {
  constructor(options = {}) {
    this.scene = options.scene;
    this.camera = options.camera;
    this.renderer = options.renderer;
    this.orbitRoot = options.orbitRoot || this.scene;
    this.centralModel = options.centralModel || null;
    this.coverSize = options.coverSize || { width: 0.84, height: 0.50 };
    this.orbitCenter = (options.orbitCenter || new THREE.Vector3()).clone();
    this.glyphAtlas = options.glyphAtlas || createGlyphAtlas();
    this.palette = (options.palette?.length ? options.palette : DEFAULT_PALETTE).map((c) => c.clone());
    this.assets = options.assets || {};
    this.cfg = { ...DEFAULT_CONFIG, ...(options.config || {}) };
    this.debug = typeof options.debug === "function" ? options.debug : null;
    this.getElapsed = typeof options.getElapsed === "function" ? options.getElapsed : () => 0;

    this.root = new THREE.Group();
    this.root.name = "SpecterMothRoot";
    this.orbitRoot.add(this.root);

    this.modelHolder = new THREE.Group();
    this.root.add(this.modelHolder);

    this.loader = new FBXLoader();
    this.moth = null;
    this.mixer = null;
    this.actions = new Map();
    this.currentAction = null;
    this.currentActionKey = "";
    this.pendingLoopAction = "";
    this.flipBusy = false;
    this.manualFlipTime = 0;
    this.manualFlipDuration = 0.55;
    this.fallbackWings = [];

    this.surfaceSamples = [];
    this.surfaceNormals = [];
    this.extents = new THREE.Vector3(0.06, 0.08, 0.12);

    this.velocity = new THREE.Vector3();
    this.forward = new THREE.Vector3(0, 0, 1);
    this.targetPoint = new THREE.Vector3();
    this.patrolPoint = new THREE.Vector3();
    this.currentCoverPoint = new THREE.Vector3();
    this.currentCoverNormal = new THREE.Vector3(0, 0, 1);
    this.currentCoverUp = new THREE.Vector3(0, 1, 0);
    this.hoveredCoverIndex = -1;
    this.coverHoverBeganAt = -Infinity;
    this.perched = false;
    this.ready = false;
    this.visible = true;
    this.mode = "patrol";
    this.stateName = "Curious";

    this.vitality = 0.74;
    this.lastSaveAt = 0;
    this.lastNestDropAt = -Infinity;

    this.voidState = {
      active: false,
      position: new THREE.Vector3(),
      energy: 0,
      spin: 0
    };

    this.patrolTheta = Math.random() * Math.PI * 2;

    this.temp = {
      vecA: new THREE.Vector3(),
      vecB: new THREE.Vector3(),
      vecC: new THREE.Vector3(),
      vecD: new THREE.Vector3(),
      vecE: new THREE.Vector3(),
      quatA: new THREE.Quaternion(),
      box: new THREE.Box3(),
      mouse: new THREE.Vector2(),
      raycaster: new THREE.Raycaster(),
      sphere: new THREE.Sphere(),
      plane: new THREE.Plane(new THREE.Vector3(0, 0, 1), 0),
      inv: new THREE.Matrix4()
    };

    this.aura = this.createAura();
    this.trail = this.createTrail();
    this.voidVisual = this.createVoidVisual();
    this.nestTexture = createNestTexture();
    this.nestGroup = new THREE.Group();
    this.nestGroup.name = "SpecterMothNests";
    this.orbitRoot.add(this.nestGroup);
    this.nests = [];

    this.hitProxy = new THREE.Mesh(
      new THREE.SphereGeometry(0.10, 12, 12),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.001, depthWrite: false, colorWrite: false })
    );
    this.hitProxy.name = "SpecterMothHitProxy";
    this.root.add(this.hitProxy);

    this.restoreState();
    this.loadModel();
  }

  log(message, level = "SYS") {
    if (this.debug) this.debug(`[MOTH/${level}] ${message}`);
  }

  restoreState() {
    const raw = safeGet(this.cfg.storageKey);
    if (!raw) return;
    try {
      const data = JSON.parse(raw);
      if (typeof data.vitality === "number") this.vitality = clamp01(data.vitality);
      if (typeof data.lastVisit === "number") {
        const hours = Math.max(0, (Date.now() - data.lastVisit) / 3600000);
        this.vitality = clamp01(this.vitality - hours * this.cfg.offlineDrainPerHour);
      }
      if (Array.isArray(data.nests)) this.pendingNestState = data.nests.slice(0, this.cfg.nestMax);
    } catch {
      // ignore
    }
  }

  saveState(force = false) {
    const elapsed = this.getElapsed();
    if (!force && elapsed - this.lastSaveAt < this.cfg.stateSaveInterval) return;
    this.lastSaveAt = elapsed;
    safeSet(this.cfg.storageKey, JSON.stringify({
      vitality: this.vitality,
      lastVisit: Date.now(),
      nests: this.nests.map((n) => ({ coverIndex: n.coverIndex, u: n.u, v: n.v, rot: n.rot, scale: n.scale }))
    }));
  }

  createAura() {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(0), 3));
    geometry.setAttribute("aSeed", new THREE.BufferAttribute(new Float32Array(0), 1));
    geometry.setAttribute("aSize", new THREE.BufferAttribute(new Float32Array(0), 1));
    geometry.setAttribute("aLife", new THREE.BufferAttribute(new Float32Array(0), 1));
    const material = createBinaryPointMaterial(this.glyphAtlas, this.palette, true);
    const points = new THREE.Points(geometry, material);
    points.frustumCulled = false;
    points.renderOrder = 10;
    this.root.add(points);
    return { geometry, material, points };
  }

  rebuildAuraFromSamples() {
    const count = Math.min(this.cfg.shellCount, this.surfaceSamples.length);
    if (!count) return;

    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    const sizes = new Float32Array(count);
    const life = new Float32Array(count);

    for (let i = 0; i < count; i += 1) {
      const sample = this.surfaceSamples[Math.floor((i / count) * this.surfaceSamples.length)] || new THREE.Vector3();
      positions[i * 3 + 0] = sample.x;
      positions[i * 3 + 1] = sample.y;
      positions[i * 3 + 2] = sample.z;
      seeds[i] = Math.random();
      sizes[i] = this.cfg.shellPointScale * (0.7 + Math.random() * 0.55);
      life[i] = 0.72 + Math.random() * 0.28;
    }

    this.aura.geometry.dispose();
    this.aura.geometry = new THREE.BufferGeometry();
    this.aura.geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    this.aura.geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
    this.aura.geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    this.aura.geometry.setAttribute("aLife", new THREE.BufferAttribute(life, 1));
    this.aura.points.geometry = this.aura.geometry;
  }

  createTrail() {
    const count = this.cfg.trailCount;
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    const sizes = new Float32Array(count);
    const life = new Float32Array(count);
    const velocities = Array.from({ length: count }, () => new THREE.Vector3());

    for (let i = 0; i < count; i += 1) {
      positions[i * 3 + 0] = 9999;
      positions[i * 3 + 1] = 9999;
      positions[i * 3 + 2] = 9999;
      seeds[i] = Math.random();
      sizes[i] = this.cfg.trailPointScale * (0.7 + Math.random() * 0.7);
      life[i] = 0;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));
    geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
    geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute("aLife", new THREE.BufferAttribute(life, 1).setUsage(THREE.DynamicDrawUsage));

    const material = createBinaryPointMaterial(this.glyphAtlas, this.palette, true);
    const points = new THREE.Points(geometry, material);
    points.frustumCulled = false;
    points.renderOrder = 11;
    this.scene.add(points);

    return {
      geometry,
      material,
      points,
      positions,
      life,
      velocities,
      cursor: 0,
      emitTimer: 0
    };
  }

  createVoidVisual() {
    const count = this.cfg.voidParticleCount;
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    const sizes = new Float32Array(count);
    const life = new Float32Array(count);
    const radius = new Float32Array(count);
    const angle = new Float32Array(count);
    const depth = new Float32Array(count);

    for (let i = 0; i < count; i += 1) {
      const t = i / Math.max(1, count - 1);
      radius[i] = Math.pow(1.0 - t, 0.55) * this.cfg.voidRadius;
      angle[i] = Math.random() * Math.PI * 2;
      depth[i] = -t * this.cfg.voidDepth;
      positions[i * 3 + 0] = Math.cos(angle[i]) * radius[i];
      positions[i * 3 + 1] = Math.sin(angle[i]) * radius[i];
      positions[i * 3 + 2] = depth[i];
      seeds[i] = Math.random();
      sizes[i] = 0.7 + Math.random() * 1.2;
      life[i] = 0.7 + Math.random() * 0.3;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));
    geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
    geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute("aLife", new THREE.BufferAttribute(life, 1));
    const material = createBinaryPointMaterial(this.glyphAtlas, this.palette, true);
    const points = new THREE.Points(geometry, material);
    points.frustumCulled = false;
    points.renderOrder = 12;

    const core = new THREE.Mesh(
      new THREE.CircleGeometry(this.cfg.voidRadius * 0.24, 40),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.95, depthWrite: false })
    );
    core.position.z = -this.cfg.voidDepth - 0.01;

    const rim = new THREE.Mesh(
      new THREE.RingGeometry(this.cfg.voidRadius * 0.72, this.cfg.voidRadius * 0.86, 48),
      new THREE.MeshBasicMaterial({ color: 0x2fe4ff, transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    rim.position.z = -0.02;

    const group = new THREE.Group();
    group.visible = false;
    group.add(points, core, rim);
    this.orbitRoot.add(group);
    return { group, geometry, material, points, core, rim, positions, radius, angle, depth };
  }

  loadModel() {
    const src = this.assets?.modelFBX || "./assets/models/moth/moth.fbx";
    this.loader.load(
      src,
      (fbx) => this.onModelLoaded(fbx),
      undefined,
      () => {
        this.log("moth FBX failed to load, using fallback moth", "WARN");
        this.createFallbackMoth();
        this.finalizeLoadedModel([]);
      }
    );
  }

  onModelLoaded(fbx) {
    this.moth = fbx;
    this.modelHolder.add(fbx);
    this.replaceMaterialsReliably(fbx);
    this.centerAndScaleModel();
    this.sampleModelSurface();
    this.rebuildAuraFromSamples();
    this.rebuildHitProxy();
    this.finalizeLoadedModel(Array.isArray(fbx.animations) ? fbx.animations : []);
    this.log(`moth loaded with ${fbx.animations?.length || 0} embedded clips`, "OK");
  }

  replaceMaterialsReliably(model) {
    model.traverse((child) => {
      if (!child.isMesh) return;
      child.visible = true;
      child.frustumCulled = false;
      child.castShadow = true;
      child.receiveShadow = false;

      const src = Array.isArray(child.material) ? child.material[0] : child.material;
      const baseColor = src?.color?.clone?.() || new THREE.Color(0x8d95a1);

      const material = new THREE.MeshStandardMaterial({
        color: baseColor,
        roughness: 0.84,
        metalness: 0.04,
        emissive: new THREE.Color("#102a3a"),
        emissiveIntensity: 0.12,
        side: THREE.DoubleSide,
        transparent: false,
        opacity: 1,
        fog: true,
        vertexColors: !!src?.vertexColors
      });

      if ("skinning" in material) material.skinning = !!child.isSkinnedMesh;
      if ("morphTargets" in material) material.morphTargets = !!child.morphTargetInfluences;
      if ("morphNormals" in material) material.morphNormals = !!child.morphTargetInfluences;
      material.needsUpdate = true;
      child.material = material;
    });
  }

  computeMeshBoundsLocal() {
    const box = new THREE.Box3();
    const rootInv = new THREE.Matrix4();
    const tempBox = new THREE.Box3();
    const tempMat = new THREE.Matrix4();
    let found = false;

    this.modelHolder.updateMatrixWorld(true);
    rootInv.copy(this.modelHolder.matrixWorld).invert();

    this.moth.traverse((child) => {
      if (!child.isMesh || !child.geometry?.attributes?.position) return;
      const geo = child.geometry;
      if (!geo.boundingBox) geo.computeBoundingBox();
      if (!geo.boundingBox) return;
      child.updateWorldMatrix(true, false);
      tempBox.copy(geo.boundingBox);
      tempMat.multiplyMatrices(rootInv, child.matrixWorld);
      tempBox.applyMatrix4(tempMat);
      if (!found) {
        box.copy(tempBox);
        found = true;
      } else {
        box.union(tempBox);
      }
    });

    if (!found) {
      box.setFromObject(this.moth);
    }

    return box;
  }

  centerAndScaleModel() {
    if (!this.moth) return;
    const bounds = this.computeMeshBoundsLocal();
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());

    this.moth.position.sub(center);

    let targetHeight = this.cfg.fallbackMothHeight;
    if (this.centralModel) {
      const modelBox = new THREE.Box3().setFromObject(this.centralModel);
      const modelSize = modelBox.getSize(new THREE.Vector3());
      targetHeight = Math.max(0.12, modelSize.y * this.cfg.sizeRatioToModelHeight);
    }

    const mothHeight = Math.max(0.0001, size.y || 1);
    const unclampedScale = targetHeight / mothHeight;
    const scale = THREE.MathUtils.clamp(unclampedScale, 0.01, 2.0);

    this.moth.scale.setScalar(scale);
    this.modelHolder.rotation.set(this.cfg.modelPitchOffset, this.cfg.modelYawOffset, this.cfg.modelRollOffset);
    this.root.updateMatrixWorld(true);

    const scaled = size.multiplyScalar(scale);
    this.extents.set(
      Math.max(0.04, scaled.x * 0.5),
      Math.max(0.04, scaled.y * 0.5),
      Math.max(0.04, scaled.z * 0.5)
    );
  }

  sampleModelSurface() {
    this.surfaceSamples = [];
    this.surfaceNormals = [];
    if (!this.moth) return;

    this.root.updateMatrixWorld(true);
    this.temp.inv.copy(this.root.matrixWorld).invert();

    const meshes = [];
    let totalVertices = 0;
    this.moth.traverse((child) => {
      if (!child.isMesh || !child.geometry?.attributes?.position) return;
      const count = child.geometry.attributes.position.count;
      meshes.push({ mesh: child, count });
      totalVertices += count;
    });

    if (!meshes.length || !totalVertices) return;

    for (const entry of meshes) {
      const perMesh = Math.max(8, Math.floor(this.cfg.meshSampleLimit * (entry.count / totalVertices)));
      const posAttr = entry.mesh.geometry.attributes.position;
      const norAttr = entry.mesh.geometry.attributes.normal;
      entry.mesh.updateWorldMatrix(true, false);
      const rootToMesh = new THREE.Matrix4().multiplyMatrices(this.temp.inv, entry.mesh.matrixWorld);
      const normalMatrix = new THREE.Matrix3().getNormalMatrix(rootToMesh);
      const step = Math.max(1, Math.floor(posAttr.count / perMesh));

      for (let i = 0; i < posAttr.count && this.surfaceSamples.length < this.cfg.meshSampleLimit; i += step) {
        const p = new THREE.Vector3().fromBufferAttribute(posAttr, i).applyMatrix4(rootToMesh);
        let n = new THREE.Vector3(0, 1, 0);
        if (norAttr) n.fromBufferAttribute(norAttr, i).applyMatrix3(normalMatrix).normalize();
        this.surfaceSamples.push(p);
        this.surfaceNormals.push(n);
      }
    }

    if (!this.surfaceSamples.length) {
      this.surfaceSamples.push(new THREE.Vector3(), new THREE.Vector3(0.08, 0.02, 0), new THREE.Vector3(-0.08, 0.02, 0));
      this.surfaceNormals = this.surfaceSamples.map(() => new THREE.Vector3(0, 1, 0));
    }
  }

  rebuildHitProxy() {
    if (!this.moth) return;
    const bounds = this.computeMeshBoundsLocal();
    const size = bounds.getSize(new THREE.Vector3()).multiplyScalar(this.moth.scale.x || 1);
    const radius = Math.max(size.x, size.y, size.z) * 0.56;
    this.hitProxy.geometry.dispose();
    this.hitProxy.geometry = new THREE.SphereGeometry(Math.max(0.07, radius), 14, 14);
  }

  setupAnimations(clips) {
    if (!this.moth || !clips.length) return;

    this.mixer = new THREE.AnimationMixer(this.moth);
    const normalized = new Map();
    for (const clip of clips) normalized.set(normalizeName(clip.name), clip);

    for (const [key, aliases] of Object.entries(ACTION_ALIASES)) {
      const clip = tryClip(normalized, aliases);
      if (!clip) continue;
      const action = this.mixer.clipAction(clip);
      action.enabled = true;
      action.clampWhenFinished = true;
      this.actions.set(key, action);
    }

    this.mixer.addEventListener("finished", (event) => {
      if (event.action === this.actions.get("backflip")) this.flipBusy = false;
      if (this.pendingLoopAction) {
        const next = this.pendingLoopAction;
        this.pendingLoopAction = "";
        this.playLoop(next);
      }
    });
  }

  finalizeLoadedModel(clips) {
    this.setupAnimations(clips);
    this.restoreNests();
    this.pickNextPatrolPoint(true);
    this.root.position.copy(this.patrolPoint);
    this.ready = true;
    this.playLoop(this.vitality < this.cfg.sadThreshold ? "flySad" : "fly");
  }

  playLoop(key) {
    const next = this.actions.get(key);
    if (!next) return false;
    if (this.currentAction === next && this.currentActionKey === key) return true;

    next.reset();
    next.enabled = true;
    next.setLoop(THREE.LoopRepeat, Infinity);
    next.clampWhenFinished = false;
    if (this.currentAction) this.currentAction.crossFadeTo(next, 0.18, true);
    next.play();
    this.currentAction = next;
    this.currentActionKey = key;
    return true;
  }

  playOnce(key, fallbackKey) {
    const next = this.actions.get(key);
    if (!next) {
      if (key === "backflip") {
        this.flipBusy = true;
        this.manualFlipTime = this.manualFlipDuration;
      }
      if (fallbackKey) this.playLoop(fallbackKey);
      return false;
    }

    this.pendingLoopAction = fallbackKey || "";
    next.reset();
    next.enabled = true;
    next.setLoop(THREE.LoopOnce, 1);
    next.clampWhenFinished = true;
    if (this.currentAction) this.currentAction.crossFadeTo(next, 0.12, true);
    next.play();
    this.currentAction = next;
    this.currentActionKey = key;
    return true;
  }

  createFallbackMoth() {
    const group = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.SphereGeometry(0.06, 12, 12),
      new THREE.MeshStandardMaterial({ color: 0x666a77, emissive: 0x18384a, roughness: 0.8, metalness: 0.04 })
    );
    group.add(body);

    const wingMat = new THREE.MeshStandardMaterial({ color: 0x545863, emissive: 0x16384d, emissiveIntensity: 0.45, roughness: 0.78, metalness: 0.02, side: THREE.DoubleSide });
    const wingGeo = new THREE.PlaneGeometry(0.22, 0.34, 1, 1);
    const left = new THREE.Mesh(wingGeo, wingMat.clone());
    const right = new THREE.Mesh(wingGeo, wingMat.clone());
    left.position.set(-0.09, 0.02, 0);
    right.position.set(0.09, 0.02, 0);
    left.rotation.y = Math.PI * 0.5;
    right.rotation.y = -Math.PI * 0.5;
    group.add(left, right);

    this.fallbackWings = [left, right];
    this.moth = group;
    this.modelHolder.add(group);

    this.surfaceSamples = [new THREE.Vector3(), new THREE.Vector3(0.1, 0.02, 0), new THREE.Vector3(-0.1, 0.02, 0), new THREE.Vector3(0, 0.08, 0)];
    this.surfaceNormals = this.surfaceSamples.map(() => new THREE.Vector3(0, 1, 0));
    this.extents.set(0.12, 0.10, 0.16);

    this.rebuildAuraFromSamples();
    this.rebuildHitProxy();
  }

  pickNextPatrolPoint(seed = false) {
    this.patrolTheta += randomRange(0.55, 1.35);
    const radius = randomRange(this.cfg.patrolRadiusMin, this.cfg.patrolRadiusMax);
    const y = randomRange(this.cfg.patrolHeightMin, this.cfg.patrolHeightMax);
    this.patrolPoint.set(
      this.orbitCenter.x + Math.cos(this.patrolTheta) * radius,
      this.orbitCenter.y + y,
      this.orbitCenter.z + Math.sin(this.patrolTheta) * radius
    );
    if (seed) this.targetPoint.copy(this.patrolPoint);
  }

  updateHoverTarget(hoveredIndex, coverWorldData) {
    if (hoveredIndex !== this.hoveredCoverIndex) {
      this.hoveredCoverIndex = hoveredIndex;
      this.coverHoverBeganAt = this.getElapsed();
    }
    if (hoveredIndex < 0) return false;
    const data = coverWorldData?.[hoveredIndex];
    if (!data || !data.visible) return false;

    const normal = this.temp.vecA.copy(data.right).cross(data.up).normalize();
    const toCam = this.temp.vecB.copy(this.camera.position).sub(data.position);
    if (normal.dot(toCam) < 0) normal.multiplyScalar(-1);

    this.currentCoverNormal.copy(normal);
    this.currentCoverUp.copy(data.up);
    this.currentCoverPoint.copy(data.position)
      .addScaledVector(data.up, this.coverSize.height * 0.5 + this.cfg.coverPerchLift)
      .addScaledVector(normal, this.cfg.coverPerchForward);

    return this.getElapsed() - this.coverHoverBeganAt >= this.cfg.hoverPerchDelay;
  }

  performBackflip() {
    this.flipBusy = true;
    this.manualFlipTime = this.manualFlipDuration;
    this.perched = false;
    this.mode = "patrol";
    this.hoveredCoverIndex = -1;
    this.root.position.y += this.cfg.clickEvadeLift * 0.18;
    this.velocity.add(this.forward.clone().multiplyScalar(-this.cfg.clickEvadePush));
    this.pickNextPatrolPoint();
    this.playOnce("backflip", this.vitality < this.cfg.sadThreshold ? "flySad" : "fly");
    this.log("specter moth startled :: backflip", "WARN");
  }

  emitTrailParticle() {
    const i = this.trail.cursor;
    this.trail.cursor = (this.trail.cursor + 1) % this.cfg.trailCount;

    let local = null;
    if (this.surfaceSamples.length) {
      const idx = Math.floor(Math.random() * this.surfaceSamples.length);
      local = this.surfaceSamples[idx].clone();
    } else {
      local = new THREE.Vector3(
        randomRange(-this.extents.x, this.extents.x),
        randomRange(-this.extents.y, this.extents.y),
        randomRange(-this.extents.z, this.extents.z)
      );
    }

    const worldPos = local.applyMatrix4(this.root.matrixWorld);
    const base = i * 3;
    this.trail.positions[base + 0] = worldPos.x;
    this.trail.positions[base + 1] = worldPos.y;
    this.trail.positions[base + 2] = worldPos.z;
    this.trail.life[i] = this.cfg.trailLife;

    const vel = this.trail.velocities[i];
    vel.copy(this.forward)
      .multiplyScalar(-this.velocity.length() * this.cfg.trailSpeedFactor - 0.12)
      .add(this.temp.vecA.set(
        randomRange(-this.cfg.trailVelocityJitter, this.cfg.trailVelocityJitter),
        randomRange(-this.cfg.trailVelocityJitter, this.cfg.trailVelocityJitter),
        randomRange(-this.cfg.trailVelocityJitter, this.cfg.trailVelocityJitter)
      ));
  }

  updateTrail(delta, elapsed) {
    this.trail.material.uniforms.uTime.value = elapsed;
    this.trail.material.uniforms.uAlpha.value = this.cfg.trailAlpha * (this.mode === "feeding" ? 1.16 : this.vitality < this.cfg.sadThreshold ? 0.66 : 1.0);

    this.trail.emitTimer += delta;
    while (this.ready && this.visible && this.mode !== "perched" && this.trail.emitTimer >= this.cfg.trailEmitInterval) {
      this.trail.emitTimer -= this.cfg.trailEmitInterval;
      this.emitTrailParticle();
    }

    for (let i = 0; i < this.cfg.trailCount; i += 1) {
      if (this.trail.life[i] <= 0) continue;
      this.trail.life[i] = Math.max(0, this.trail.life[i] - delta);
      const base = i * 3;
      const vel = this.trail.velocities[i];
      vel.multiplyScalar(Math.exp(-this.cfg.trailDrag * delta));
      this.trail.positions[base + 0] += vel.x * delta;
      this.trail.positions[base + 1] += vel.y * delta;
      this.trail.positions[base + 2] += vel.z * delta;
    }

    this.trail.geometry.attributes.position.needsUpdate = true;
    this.trail.geometry.attributes.aLife.needsUpdate = true;
  }

  updateAura(elapsed) {
    this.aura.material.uniforms.uTime.value = elapsed;
    this.aura.material.uniforms.uAlpha.value = this.visible ? this.cfg.shellAlpha * (this.mode === "feeding" ? 1.1 : 1.0) : 0;
  }

  updateVoidVisual(delta, elapsed) {
    this.voidVisual.material.uniforms.uTime.value = elapsed;
    if (!this.voidState.active || !this.visible) {
      this.voidVisual.group.visible = false;
      return;
    }

    this.voidVisual.group.visible = true;
    this.voidVisual.group.position.copy(this.voidState.position);
    this.voidVisual.group.quaternion.copy(this.camera.quaternion);
    this.voidState.spin += delta * (1.4 + this.voidState.energy * 0.4);

    const positions = this.voidVisual.positions;
    const energy = Math.max(0.12, this.voidState.energy);
    for (let i = 0; i < this.cfg.voidParticleCount; i += 1) {
      this.voidVisual.angle[i] += delta * (1.0 + i * 0.0006) * (0.8 + energy * 0.45);
      const r = this.voidVisual.radius[i] * (0.92 + Math.sin(elapsed * 1.6 + i * 0.13) * 0.05);
      const d = this.voidVisual.depth[i];
      const base = i * 3;
      positions[base + 0] = Math.cos(this.voidVisual.angle[i]) * r;
      positions[base + 1] = Math.sin(this.voidVisual.angle[i]) * r;
      positions[base + 2] = d + Math.sin(elapsed * 3.0 + i * 0.21) * 0.02;
    }

    this.voidVisual.geometry.attributes.position.needsUpdate = true;
    this.voidVisual.material.uniforms.uAlpha.value = 0.76 + energy * 0.14;
    this.voidVisual.core.scale.setScalar(0.94 + Math.sin(elapsed * 2.4) * 0.05);
    this.voidVisual.rim.scale.setScalar(0.96 + Math.sin(elapsed * 1.9) * 0.03 + energy * 0.02);
    this.voidVisual.rim.material.opacity = 0.14 + energy * 0.04;
  }

  clearVoid() {
    this.voidState.active = false;
    this.voidState.energy = 0;
  }

  spawnVoid(position) {
    this.voidState.active = true;
    this.voidState.position.copy(position);
    this.voidState.energy = Math.min(1.6, Math.max(0.85, this.voidState.energy + 0.28));
    this.mode = "toVoid";
    this.perched = false;
    this.playLoop(this.vitality < this.cfg.sadThreshold ? "flySad" : "fly");
    this.log("binary void opened", "ALRT");
  }

  pickVoidPoint() {
    const hit = new THREE.Vector3();
    const ray = this.temp.raycaster.ray;
    this.temp.sphere.center.copy(this.orbitCenter);
    this.temp.sphere.radius = this.cfg.voidSpawnRadius;

    if (!ray.intersectSphere(this.temp.sphere, hit)) {
      this.temp.plane.set(new THREE.Vector3(0, 0, 1), -this.orbitCenter.z);
      if (!ray.intersectPlane(this.temp.plane, hit)) return null;
    }

    const local = hit.clone().sub(this.orbitCenter);
    if (local.length() > this.cfg.voidSpawnRadius) local.setLength(this.cfg.voidSpawnRadius);
    local.y = THREE.MathUtils.clamp(local.y, this.cfg.voidHeightMin, this.cfg.voidHeightMax);
    return hit.copy(this.orbitCenter).add(local);
  }

  createNest(data) {
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({ map: this.nestTexture, transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false })
    );
    mesh.renderOrder = 9;
    this.nestGroup.add(mesh);
    const nest = { mesh, coverIndex: data.coverIndex, u: data.u, v: data.v, rot: data.rot, scale: data.scale };
    this.nests.push(nest);
    if (this.nests.length > this.cfg.nestMax) {
      const oldest = this.nests.shift();
      if (oldest?.mesh?.parent) oldest.mesh.parent.remove(oldest.mesh);
    }
    return nest;
  }

  restoreNests() {
    if (!Array.isArray(this.pendingNestState) || !this.pendingNestState.length) return;
    for (const data of this.pendingNestState.slice(0, this.cfg.nestMax)) this.createNest(data);
    this.pendingNestState = null;
  }

  dropNestOnCover(coverIndex) {
    if (coverIndex < 0) return;
    if (Math.random() > this.cfg.nestChancePerLanding) return;
    this.createNest({
      coverIndex,
      u: randomRange(-0.22, 0.22),
      v: randomRange(-0.12, 0.12),
      rot: randomRange(-Math.PI, Math.PI),
      scale: randomRange(this.cfg.nestScaleMin, this.cfg.nestScaleMax)
    });
    this.saveState(true);
  }

  updateNests(coverWorldData) {
    const halfW = this.coverSize.width * 0.5;
    const halfH = this.coverSize.height * 0.5;

    for (const nest of this.nests) {
      const data = coverWorldData?.[nest.coverIndex];
      if (!data || !data.visible) {
        nest.mesh.visible = false;
        continue;
      }

      nest.mesh.visible = true;
      const normal = this.temp.vecA.copy(data.right).cross(data.up).normalize();
      const toCam = this.temp.vecB.copy(this.camera.position).sub(data.position);
      if (normal.dot(toCam) < 0) normal.multiplyScalar(-1);

      nest.mesh.position.copy(data.position)
        .addScaledVector(data.right, nest.u * halfW * 2.0)
        .addScaledVector(data.up, nest.v * halfH * 2.0)
        .addScaledVector(normal, 0.012);
      nest.mesh.scale.setScalar(nest.scale);
      lookQuat(nest.mesh.position, nest.mesh.position.clone().add(normal), data.up, nest.mesh.quaternion);
      nest.mesh.rotateZ(nest.rot);
      nest.mesh.material.opacity = 0.28 + Math.sin(this.getElapsed() * 1.8) * 0.05 + (1 - this.vitality) * 0.18;
    }
  }

  updateMovement(delta, coverWorldData) {
    const hasHoverCover = this.updateHoverTarget(this.hoveredCoverIndex, coverWorldData);

    if (!this.flipBusy && hasHoverCover) {
      this.mode = this.perched ? "perched" : "toCover";
    } else if (!this.flipBusy && this.voidState.active) {
      this.mode = "toVoid";
    } else if (!this.flipBusy && this.mode !== "perched") {
      this.mode = "patrol";
    }

    let target = this.targetPoint;
    let speed = this.cfg.flySpeed;

    if (this.mode === "toCover" || this.mode === "perched") {
      target = this.currentCoverPoint;
      speed = this.cfg.flySpeed * 0.92;
    } else if (this.mode === "toVoid") {
      target = this.voidState.position;
      speed = this.cfg.diveSpeed;
    } else {
      target = this.patrolPoint;
    }

    this.targetPoint.copy(target);
    const toTarget = this.temp.vecC.copy(target).sub(this.root.position);
    const distance = toTarget.length();

    if (this.mode === "patrol" && distance < 0.14) this.pickNextPatrolPoint();

    if ((this.mode === "toCover" || this.mode === "perched") && distance < this.cfg.arrivalRadius) {
      this.perched = true;
      this.mode = "perched";
    } else if (this.mode !== "toCover") {
      this.perched = false;
    }

    if (this.mode === "toVoid" && distance < this.cfg.voidConsumeDistance) {
      this.mode = "feeding";
      this.perched = false;
    }

    if (this.mode === "perched") {
      this.root.position.lerp(this.currentCoverPoint, 1.0 - Math.exp(-delta * 8.0));
      this.velocity.multiplyScalar(0.72);
      const lookPoint = this.temp.vecD.copy(this.currentCoverPoint).add(this.currentCoverNormal);
      lookQuat(this.root.position, lookPoint, this.currentCoverUp, this.temp.quatA);
      this.root.quaternion.slerp(this.temp.quatA, 1.0 - Math.exp(-delta * 10.0));
      if (this.hoveredCoverIndex < 0) {
        this.perched = false;
        this.mode = this.voidState.active ? "toVoid" : "patrol";
        this.root.position.y += this.cfg.clickEvadeLift * 0.08;
        this.playOnce("takeoff", this.vitality < this.cfg.sadThreshold ? "flySad" : "fly");
      }
      return;
    }

    if (this.mode === "feeding") {
      this.velocity.multiplyScalar(0.82);
      this.root.position.lerp(this.voidState.position, 1.0 - Math.exp(-delta * 9.5));
      const lookPoint = this.temp.vecD.copy(this.voidState.position).add(new THREE.Vector3(0, 0, -0.2));
      lookQuat(this.root.position, lookPoint, new THREE.Vector3(0, 1, 0), this.temp.quatA);
      this.root.quaternion.slerp(this.temp.quatA, 1.0 - Math.exp(-delta * 9.0));
      return;
    }

    if (distance > 0.0001) {
      const desired = toTarget.normalize().multiplyScalar(speed * Math.min(1.0, distance / 0.55 + 0.18));
      this.velocity.lerp(desired, 1.0 - Math.exp(-delta * 4.6));
    }

    this.velocity.multiplyScalar(Math.pow(this.cfg.damping, delta * 60));
    this.root.position.addScaledVector(this.velocity, delta);

    if (this.velocity.lengthSq() > 0.00001) {
      this.forward.lerp(this.velocity.clone().normalize(), 1.0 - Math.exp(-delta * 8.0)).normalize();
      const lookPoint = this.temp.vecD.copy(this.root.position).add(this.forward);
      lookQuat(this.root.position, lookPoint, new THREE.Vector3(0, 1, 0), this.temp.quatA);
      this.root.quaternion.slerp(this.temp.quatA, this.cfg.turnLerp);
    }
  }

  updateAnimationState(delta) {
    if (!this.ready) return;

    if (!this.mixer && this.fallbackWings.length) {
      const flapBase = this.mode === "feeding" ? 9.6 : this.vitality < this.cfg.sadThreshold ? 4.9 : 7.1;
      const flapAmp = this.mode === "perched" ? 0.08 : this.vitality < this.cfg.sadThreshold ? 0.26 : 0.46;
      const t = this.getElapsed();
      if (this.fallbackWings[0]) this.fallbackWings[0].rotation.z = Math.sin(t * flapBase) * flapAmp + 0.18;
      if (this.fallbackWings[1]) this.fallbackWings[1].rotation.z = -Math.sin(t * flapBase) * flapAmp - 0.18;
    }

    if (this.flipBusy && this.manualFlipTime > 0) {
      const progress = 1.0 - this.manualFlipTime / this.manualFlipDuration;
      this.modelHolder.rotation.z = this.cfg.modelRollOffset + Math.sin(progress * Math.PI) * 0.4;
      this.modelHolder.rotation.x = this.cfg.modelPitchOffset + progress * Math.PI * 2.0;
      this.manualFlipTime -= delta;
      if (this.manualFlipTime <= 0) {
        this.flipBusy = false;
        this.modelHolder.rotation.set(this.cfg.modelPitchOffset, this.cfg.modelYawOffset, this.cfg.modelRollOffset);
      }
    } else if (!this.flipBusy) {
      this.modelHolder.rotation.set(this.cfg.modelPitchOffset, this.cfg.modelYawOffset, this.cfg.modelRollOffset);
    }

    if (!this.mixer) return;
    if (this.flipBusy && this.actions.get("backflip")) {
      this.mixer.update(delta);
      return;
    }

    let desired = this.vitality < this.cfg.sadThreshold ? "flySad" : "fly";
    if (this.mode === "perched") desired = this.actions.get("perch") ? "perch" : desired;
    else if (this.mode === "toCover") desired = this.actions.get("land") ? "land" : desired;
    else if (this.mode === "feeding" || this.mode === "toVoid") desired = this.actions.get("feed") ? "feed" : desired;

    this.playLoop(desired);
    this.mixer.update(delta);
  }

  updateVitals(delta) {
    const feeding = this.mode === "feeding" || this.mode === "perched";
    if (feeding) this.vitality = clamp01(this.vitality + this.cfg.vitalityRecoveryPerSecond * delta);
    else this.vitality = clamp01(this.vitality - this.cfg.vitalityDrainPerSecond * delta);

    if (this.mode === "feeding" && this.voidState.active) {
      this.voidState.energy = Math.max(0, this.voidState.energy - this.cfg.voidConsumeRate * delta);
      this.vitality = clamp01(this.vitality + this.cfg.vitalityRecoveryPerSecond * delta * 1.2);
      if (this.voidState.energy <= 0.001) {
        this.clearVoid();
        this.mode = this.hoveredCoverIndex >= 0 ? "toCover" : "patrol";
        this.pickNextPatrolPoint();
      }
    }

    if (this.mode === "perched" && this.hoveredCoverIndex >= 0) {
      const elapsed = this.getElapsed();
      if (elapsed - this.lastNestDropAt >= this.cfg.nestDepositDelay) {
        this.lastNestDropAt = elapsed;
        this.dropNestOnCover(this.hoveredCoverIndex);
      }
    }

    if (this.mode === "feeding") this.stateName = "Feeding";
    else if (this.vitality < this.cfg.sadThreshold) this.stateName = "Dying";
    else if (this.mode === "toCover" || this.mode === "perched" || this.mode === "toVoid") this.stateName = "Curious";
    else this.stateName = "Hiding";
  }

  handleClick(event, hoveredEntry) {
    if (!this.ready || !this.visible) return false;
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.temp.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.temp.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    this.temp.raycaster.setFromCamera(this.temp.mouse, this.camera);

    const proxyHits = this.temp.raycaster.intersectObject(this.hitProxy, false);
    if (proxyHits.length) {
      this.performBackflip();
      return true;
    }

    if (hoveredEntry) return false;
    const point = this.pickVoidPoint();
    if (point) {
      this.spawnVoid(point);
      return true;
    }
    return false;
  }

  setVisibility(visible) {
    this.visible = Boolean(visible);
    this.root.visible = this.visible;
    this.nestGroup.visible = this.visible;
    this.voidVisual.group.visible = this.visible && this.voidState.active;
    this.trail.points.visible = this.visible;
    this.aura.points.visible = this.visible;
  }

  update(params = {}) {
    const delta = params.delta || 0.016;
    const elapsed = params.elapsed || this.getElapsed();
    const hoveredIndex = typeof params.hoveredIndex === "number" ? params.hoveredIndex : -1;
    const coverWorldData = params.coverWorldData || [];

    this.hoveredCoverIndex = hoveredIndex;

    this.updateMovement(delta, coverWorldData);
    this.updateVitals(delta);
    this.updateAnimationState(delta);
    this.updateAura(elapsed);
    this.updateTrail(delta, elapsed);
    this.updateVoidVisual(delta, elapsed);
    this.updateNests(coverWorldData);
    this.saveState(false);
  }

  dispose() {
    this.saveState(true);
    if (this.mixer) {
      this.mixer.stopAllAction();
      this.mixer = null;
    }
    if (this.aura?.points?.parent) this.aura.points.parent.remove(this.aura.points);
    if (this.trail?.points?.parent) this.trail.points.parent.remove(this.trail.points);
    if (this.voidVisual?.group?.parent) this.voidVisual.group.parent.remove(this.voidVisual.group);
    if (this.nestGroup?.parent) this.nestGroup.parent.remove(this.nestGroup);
    if (this.root?.parent) this.root.parent.remove(this.root);
  }
}
