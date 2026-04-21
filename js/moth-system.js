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
  storageKey: "orbitSpecterMothV3",
  sizeRatioToModelHeight: 0.075,
  modelYawOffset: 0,
  modelPitchOffset: 0,
  modelRollOffset: 0,
  patrolRadiusMin: 1.18,
  patrolRadiusMax: 2.30,
  patrolHeightMin: -0.18,
  patrolHeightMax: 1.75,
  flySpeed: 1.38,
  diveSpeed: 1.95,
  turnLerp: 0.12,
  damping: 0.93,
  arrivalRadius: 0.14,
  coverPerchLift: 0.065,
  coverPerchForward: 0.055,
  coverFollowLerp: 0.16,
  hoverPerchDelay: 0.1,
  clickEvadeLift: 0.22,
  clickEvadePush: 0.25,
  shellCount: 180,
  shellAlpha: 0.48,
  shellPulse: 0.14,
  trailCount: 240,
  trailEmitInterval: 0.018,
  trailLife: 0.82,
  trailDrag: 1.95,
  trailSpeedFactor: 0.3,
  trailVelocityJitter: 0.14,
  trailAlpha: 0.92,
  trailPointScale: 0.95,
  voidParticleCount: 420,
  voidRadius: 0.48,
  voidDepth: 1.18,
  voidSpawnRadius: 2.25,
  voidHeightMin: -0.9,
  voidHeightMax: 1.85,
  voidConsumeDistance: 0.16,
  voidConsumeRate: 0.82,
  vitalityDrainPerSecond: 0.003,
  vitalityRecoveryPerSecond: 0.011,
  offlineDrainPerHour: 0.05,
  sadThreshold: 0.28,
  swarmThreshold: 1.15,
  nestMax: 6,
  nestChancePerLanding: 0.26,
  nestDepositDelay: 7.0,
  nestScaleMin: 0.08,
  nestScaleMax: 0.16,
  stateSaveInterval: 5.0,
  meshSampleLimit: 260,
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

function smooth01(v) {
  const t = clamp01(v);
  return t * t * (3 - 2 * t);
}

function safeStorageGet(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeStorageSet(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

function makeLookQuaternion(from, to, up = new THREE.Vector3(0, 1, 0), out = new THREE.Quaternion()) {
  const m = new THREE.Matrix4();
  m.lookAt(from, to, up);
  out.setFromRotationMatrix(m);
  return out;
}

function createGlyphAtlas() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = "rgba(255,255,255,0.25)";
  ctx.shadowBlur = 12;
  ctx.font = '900 360px ui-monospace, "SFMono-Regular", Menlo, Monaco, Consolas, monospace';
  ctx.fillText("0", 256, 258);
  ctx.fillText("1", 768, 258);

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

  const grad = ctx.createRadialGradient(size * 0.5, size * 0.5, size * 0.06, size * 0.5, size * 0.5, size * 0.48);
  grad.addColorStop(0, "rgba(0,0,0,0.92)");
  grad.addColorStop(0.42, "rgba(8,18,35,0.54)");
  grad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(size * 0.5, size * 0.5, size * 0.44, 0, Math.PI * 2);
  ctx.fill();

  const colors = ["#2fe4ff", "#4b7dff", "#33ff88", "#ff57ce"];
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = '700 18px ui-monospace, "SFMono-Regular", Menlo, Monaco, Consolas, monospace';

  for (let i = 0; i < 120; i += 1) {
    ctx.save();
    ctx.translate(Math.random() * size, Math.random() * size);
    ctx.rotate((Math.random() - 0.5) * 1.6);
    ctx.fillStyle = `${colors[i % colors.length]}${Math.floor((0.15 + Math.random() * 0.3) * 255).toString(16).padStart(2, "0")}`;
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
      uAlpha: { value: 1 },
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
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = (26.0 * aSize * max(0.03, aLife)) / max(0.65, -mv.z);
        vDigit = mod(floor(aSeed * 97.0 + uTime * (3.0 + fract(aSeed * 4.0))), 2.0);
        vPalette = fract(aSeed * 10.31 + uTime * 0.03);
        vAlpha = aLife;
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
        float radial = smoothstep(1.0, 0.18, distance(gl_PointCoord, vec2(0.5)));
        float alpha = glyph.a * radial * vAlpha * uAlpha;
        if (alpha < 0.02) discard;
        gl_FragColor = vec4(pickPalette(vPalette), alpha);
      }
    `
  });
}

function randomRange(min, max) {
  return min + Math.random() * (max - min);
}

function hashColorAlpha(hex, alpha) {
  const c = new THREE.Color(hex);
  return `rgba(${Math.round(c.r * 255)}, ${Math.round(c.g * 255)}, ${Math.round(c.b * 255)}, ${alpha})`;
}

function collectMeshSamplePoints(root, desiredCount) {
  const pools = [];
  let totalVertices = 0;

  root.updateMatrixWorld(true);

  root.traverse((child) => {
    if (!child.isMesh || !child.geometry?.attributes?.position) return;
    const positionAttr = child.geometry.attributes.position;
    const count = positionAttr.count;
    if (!count) return;
    pools.push({ child, positionAttr, count });
    totalVertices += count;
  });

  if (!pools.length || !totalVertices) {
    return [];
  }

  const samples = [];
  const temp = new THREE.Vector3();

  for (const pool of pools) {
    const take = Math.max(1, Math.round((pool.count / totalVertices) * desiredCount));
    const step = Math.max(1, Math.floor(pool.count / take));

    pool.child.updateWorldMatrix(true, false);

    for (let i = 0; i < pool.count && samples.length < desiredCount; i += step) {
      temp.fromBufferAttribute(pool.positionAttr, i);
      temp.applyMatrix4(pool.child.matrixWorld);
      root.worldToLocal(temp);
      samples.push(temp.clone());
    }
  }

  while (samples.length > desiredCount) {
    samples.splice(Math.floor(Math.random() * samples.length), 1);
  }

  return samples;
}

export class MothSystem {
  constructor(options) {
    this.scene = options.scene;
    this.camera = options.camera;
    this.renderer = options.renderer;
    this.orbitRoot = options.orbitRoot || options.scene;
    this.centralModel = options.centralModel || null;
    this.coverSize = options.coverSize || { width: 0.84, height: 0.5 };
    this.orbitCenter = (options.orbitCenter || new THREE.Vector3()).clone();
    this.palette = (options.palette?.length ? options.palette : DEFAULT_PALETTE).map((c) => c.clone());
    this.assets = options.assets || {};
    this.cfg = { ...DEFAULT_CONFIG, ...(options.config || {}) };
    this.glyphAtlas = options.glyphAtlas || createGlyphAtlas();
    this.debug = typeof options.debug === "function" ? options.debug : null;
    this.getElapsed = typeof options.getElapsed === "function" ? options.getElapsed : () => 0;

    this.loader = new FBXLoader();
    this.root = new THREE.Group();
    this.root.name = "SpecterMothRoot";
    this.orbitRoot.add(this.root);

    this.modelHolder = new THREE.Group();
    this.root.add(this.modelHolder);

    this.moth = null;
    this.mixer = null;
    this.actions = {};
    this.currentAction = null;
    this.currentActionKey = "";
    this.pendingLoopActionKey = "";
    this.flipBusy = false;
    this.ready = false;

    this.localSurfacePoints = [];
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
    this.mode = "patrol";
    this.stateName = "Curious";
    this.vitality = 0.74;
    this.lastSaveAt = 0;
    this.lastNestDropAt = -Infinity;
    this.pickPatrolSeed = Math.random() * Math.PI * 2;

    this.voidState = {
      active: false,
      position: new THREE.Vector3(),
      energy: 0,
      spin: 0
    };

    this.temp = {
      vecA: new THREE.Vector3(),
      vecB: new THREE.Vector3(),
      vecC: new THREE.Vector3(),
      vecD: new THREE.Vector3(),
      vecE: new THREE.Vector3(),
      quatA: new THREE.Quaternion(),
      box: new THREE.Box3(),
      sphere: new THREE.Sphere(),
      raycaster: new THREE.Raycaster(),
      plane: new THREE.Plane(new THREE.Vector3(0, 0, 1), 0)
    };

    this.shell = null;
    this.trail = this.buildTrail();
    this.voidVisual = this.buildVoidVisual();
    this.nestTexture = createNestTexture();
    this.nestGroup = new THREE.Group();
    this.nestGroup.name = "SpecterMothNests";
    this.orbitRoot.add(this.nestGroup);
    this.nests = [];

    this.hitProxy = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 16, 16),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    this.hitProxy.visible = false;
    this.root.add(this.hitProxy);

    this.restoreState();
    this.pickNextPatrolPoint(true);
    this.loadMoth();
  }

  log(message, level = "SYS") {
    if (!this.debug) return;
    this.debug(`[MOTH/${level}] ${message}`);
  }

  restoreState() {
    const raw = safeStorageGet(this.cfg.storageKey);
    if (!raw) return;
    try {
      const data = JSON.parse(raw);
      if (typeof data.vitality === "number") {
        this.vitality = clamp01(data.vitality);
      }
      if (typeof data.lastVisit === "number") {
        const hours = Math.max(0, (Date.now() - data.lastVisit) / 3600000);
        this.vitality = clamp01(this.vitality - hours * this.cfg.offlineDrainPerHour);
      }
      if (Array.isArray(data.nests)) {
        this.pendingNestState = data.nests.slice(0, this.cfg.nestMax);
      }
    } catch {
      // ignore bad state
    }
  }

  saveState(force = false) {
    const elapsed = this.getElapsed();
    if (!force && elapsed - this.lastSaveAt < this.cfg.stateSaveInterval) return;
    this.lastSaveAt = elapsed;

    const data = {
      vitality: this.vitality,
      lastVisit: Date.now(),
      nests: this.nests.map((nest) => ({
        coverIndex: nest.coverIndex,
        u: nest.u,
        v: nest.v,
        rot: nest.rot,
        scale: nest.scale
      }))
    };

    safeStorageSet(this.cfg.storageKey, JSON.stringify(data));
  }

  buildShellFromSamples(samples) {
    if (this.shell?.points?.parent) {
      this.shell.points.parent.remove(this.shell.points);
    }

    const count = Math.min(samples.length, this.cfg.shellCount);
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    const sizes = new Float32Array(count);
    const life = new Float32Array(count);

    for (let i = 0; i < count; i += 1) {
      const p = samples[i % samples.length];
      positions[i * 3 + 0] = p.x + (Math.random() - 0.5) * 0.008;
      positions[i * 3 + 1] = p.y + (Math.random() - 0.5) * 0.008;
      positions[i * 3 + 2] = p.z + (Math.random() - 0.5) * 0.008;
      seeds[i] = Math.random();
      sizes[i] = 0.45 + Math.random() * 0.8;
      life[i] = 0.65 + Math.random() * 0.35;
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
    geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute("aLife", new THREE.BufferAttribute(life, 1));

    const material = createBinaryPointMaterial(this.glyphAtlas, this.palette, true);
    const points = new THREE.Points(geometry, material);
    points.frustumCulled = false;
    points.renderOrder = 9;
    this.modelHolder.add(points);

    this.shell = { points, geometry, material, positions, seeds, sizes, life };
  }

  buildTrail() {
    const count = this.cfg.trailCount;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    const sizes = new Float32Array(count);
    const life = new Float32Array(count);

    for (let i = 0; i < count; i += 1) {
      positions[i * 3 + 0] = 9999;
      positions[i * 3 + 1] = 9999;
      positions[i * 3 + 2] = 9999;
      seeds[i] = Math.random();
      sizes[i] = (0.6 + Math.random() * 0.95) * this.cfg.trailPointScale;
      life[i] = 0;
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));
    geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
    geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute("aLife", new THREE.BufferAttribute(life, 1).setUsage(THREE.DynamicDrawUsage));

    const material = createBinaryPointMaterial(this.glyphAtlas, this.palette, true);
    const points = new THREE.Points(geometry, material);
    points.frustumCulled = false;
    points.renderOrder = 10;
    this.scene.add(points);

    return {
      geometry,
      material,
      points,
      positions,
      seeds,
      sizes,
      life,
      velocities: Array.from({ length: count }, () => new THREE.Vector3()),
      cursor: 0,
      emitTimer: 0
    };
  }

  buildVoidVisual() {
    const group = new THREE.Group();
    group.visible = false;
    this.scene.add(group);

    const count = this.cfg.voidParticleCount;
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    const sizes = new Float32Array(count);
    const life = new Float32Array(count);
    const radius = new Float32Array(count);
    const depth = new Float32Array(count);
    const angle = new Float32Array(count);

    for (let i = 0; i < count; i += 1) {
      const t = i / Math.max(1, count - 1);
      radius[i] = Math.pow(1.0 - t, 0.55) * this.cfg.voidRadius;
      depth[i] = -t * this.cfg.voidDepth;
      angle[i] = Math.random() * Math.PI * 2;
      positions[i * 3 + 0] = Math.cos(angle[i]) * radius[i];
      positions[i * 3 + 1] = Math.sin(angle[i]) * radius[i];
      positions[i * 3 + 2] = depth[i];
      seeds[i] = Math.random();
      sizes[i] = 0.55 + Math.random() * 1.1;
      life[i] = 0.68 + Math.random() * 0.32;
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
    group.add(points);

    const core = new THREE.Mesh(
      new THREE.CircleGeometry(this.cfg.voidRadius * 0.23, 48),
      new THREE.MeshBasicMaterial({
        color: 0x000000,
        transparent: true,
        opacity: 0.97,
        depthWrite: false
      })
    );
    core.position.z = -this.cfg.voidDepth - 0.02;
    core.renderOrder = 11;
    group.add(core);

    const halo = new THREE.Mesh(
      new THREE.RingGeometry(this.cfg.voidRadius * 0.26, this.cfg.voidRadius * 0.36, 64),
      new THREE.MeshBasicMaterial({
        color: 0x2fe4ff,
        transparent: true,
        opacity: 0.14,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide
      })
    );
    halo.position.z = 0.02;
    halo.renderOrder = 13;
    group.add(halo);

    return { group, geometry, material, positions, angle, radius, depth, points, core, halo };
  }

  createNest(data) {
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({
        map: this.nestTexture,
        transparent: true,
        opacity: 0.92,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false
      })
    );
    mesh.renderOrder = 8;
    this.nestGroup.add(mesh);

    const nest = { mesh, ...data };
    this.nests.push(nest);

    if (this.nests.length > this.cfg.nestMax) {
      const oldest = this.nests.shift();
      if (oldest?.mesh?.parent) oldest.mesh.parent.remove(oldest.mesh);
    }

    return nest;
  }

  restoreNests() {
    if (!Array.isArray(this.pendingNestState)) return;
    for (const data of this.pendingNestState.slice(0, this.cfg.nestMax)) {
      this.createNest(data);
    }
    this.pendingNestState = null;
  }

  updateNests(coverWorldData) {
    const halfW = this.coverSize.width * 0.5;
    const halfH = this.coverSize.height * 0.5;

    for (const nest of this.nests) {
      const cover = coverWorldData?.[nest.coverIndex];
      if (!cover || !cover.visible) {
        nest.mesh.visible = false;
        continue;
      }
      nest.mesh.visible = true;

      const normal = this.temp.vecA.copy(cover.right).cross(cover.up).normalize();
      const toCam = this.temp.vecB.copy(this.camera.position).sub(cover.position);
      if (normal.dot(toCam) < 0) normal.multiplyScalar(-1);

      const pos = this.temp.vecC
        .copy(cover.position)
        .addScaledVector(cover.right, nest.u * halfW * 2)
        .addScaledVector(cover.up, nest.v * halfH * 2)
        .addScaledVector(normal, 0.01);

      nest.mesh.position.copy(pos);
      nest.mesh.scale.setScalar(nest.scale);
      makeLookQuaternion(pos, pos.clone().add(normal), cover.up, nest.mesh.quaternion);
      nest.mesh.rotateZ(nest.rot);
    }
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

    this.log("binary nest deposited", "INFO");
    this.saveState(true);
  }

  loadMoth() {
    const src = this.assets?.modelFBX || "./assets/models/moth/moth.fbx";
    this.loader.load(
      src,
      (fbx) => this.setupLoadedMoth(fbx),
      undefined,
      (error) => {
        console.error("Moth FBX failed to load:", error);
        this.log("moth load failed", "ERR");
        this.createFallbackMoth();
      }
    );
  }

  setupLoadedMoth(fbx) {
    this.moth = fbx;
    this.modelHolder.add(fbx);

    fbx.traverse((child) => {
      if (!child.isMesh) return;
      child.castShadow = true;
      child.receiveShadow = false;
      child.frustumCulled = false;
      if (child.material) {
        child.material = child.material.clone();
        child.material.transparent = true;
        if (typeof child.material.opacity === "number") child.material.opacity = Math.min(1, child.material.opacity);
        if ("emissive" in child.material) {
          child.material.emissive = child.material.emissive || new THREE.Color(0x000000);
          child.material.emissive.set("#14374f");
          child.material.emissiveIntensity = 0.42;
        }
      }
    });

    const preBox = new THREE.Box3().setFromObject(fbx);
    const preCenter = preBox.getCenter(new THREE.Vector3());
    const preSize = preBox.getSize(new THREE.Vector3());

    fbx.position.sub(preCenter);

    let targetHeight = 0.34;
    if (this.centralModel) {
      const modelBox = new THREE.Box3().setFromObject(this.centralModel);
      const modelSize = modelBox.getSize(new THREE.Vector3());
      if (modelSize.y > 0) {
        targetHeight = modelSize.y * this.cfg.sizeRatioToModelHeight;
      }
    }

    const scale = preSize.y > 0 ? targetHeight / preSize.y : 1;
    fbx.scale.setScalar(scale);

    const postBox = new THREE.Box3().setFromObject(fbx);
    const postSize = postBox.getSize(new THREE.Vector3());
    const hitRadius = Math.max(postSize.x, postSize.y, postSize.z) * 0.42;

    this.hitProxy.geometry.dispose();
    this.hitProxy.geometry = new THREE.SphereGeometry(Math.max(0.05, hitRadius), 16, 16);

    this.modelHolder.rotation.set(this.cfg.modelPitchOffset, this.cfg.modelYawOffset, this.cfg.modelRollOffset);

    this.localSurfacePoints = collectMeshSamplePoints(this.modelHolder, this.cfg.meshSampleLimit);
    if (!this.localSurfacePoints.length) {
      this.localSurfacePoints = [new THREE.Vector3(0, 0, 0)];
    }
    this.buildShellFromSamples(this.localSurfacePoints);
    this.setupAnimationMixer(fbx.animations || []);
    this.restoreNests();

    this.ready = true;
    this.playLoop(this.vitality < this.cfg.sadThreshold ? "flySad" : "fly");
    this.log("moth loaded from embedded-animation FBX", "OK");
  }

  createFallbackMoth() {
    const g = new THREE.Group();

    const body = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.025, 0.11, 4, 8),
      new THREE.MeshStandardMaterial({
        color: 0x666a77,
        emissive: 0x16384d,
        emissiveIntensity: 0.42,
        roughness: 0.75,
        metalness: 0.02
      })
    );
    g.add(body);

    const wingMat = new THREE.MeshStandardMaterial({
      color: 0x535861,
      emissive: 0x16384d,
      emissiveIntensity: 0.32,
      roughness: 0.8,
      metalness: 0.02,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.92
    });

    const wingGeo = new THREE.PlaneGeometry(0.12, 0.22);
    const left = new THREE.Mesh(wingGeo, wingMat.clone());
    const right = new THREE.Mesh(wingGeo, wingMat.clone());
    left.position.set(-0.055, 0.03, 0);
    right.position.set(0.055, 0.03, 0);
    left.rotation.y = Math.PI * 0.46;
    right.rotation.y = -Math.PI * 0.46;
    left.rotation.z = 0.12;
    right.rotation.z = -0.12;
    g.add(left, right);

    this.modelHolder.add(g);
    this.moth = g;
    this.fallbackWings = [left, right];
    this.localSurfacePoints = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.03, 0.03, 0),
      new THREE.Vector3(-0.03, 0.03, 0),
      new THREE.Vector3(0, -0.02, 0.02)
    ];
    this.buildShellFromSamples(this.localSurfacePoints);
    this.restoreNests();
    this.ready = true;
    this.log("using procedural fallback moth", "WARN");
  }

  setupAnimationMixer(clips) {
    if (!this.moth || !clips.length) return;
    this.mixer = new THREE.AnimationMixer(this.moth);

    const normalized = new Map();
    for (const clip of clips) {
      normalized.set(normalizeName(clip.name), clip);
    }

    const findClip = (aliases) => {
      for (const alias of aliases) {
        if (normalized.has(alias)) return normalized.get(alias);
      }
      for (const [name, clip] of normalized.entries()) {
        for (const alias of aliases) {
          if (name.includes(alias)) return clip;
        }
      }
      return null;
    };

    for (const [key, aliases] of Object.entries(ACTION_ALIASES)) {
      const clip = findClip(aliases);
      if (!clip) continue;
      const action = this.mixer.clipAction(clip);
      action.enabled = true;
      action.clampWhenFinished = true;
      this.actions[key] = action;
    }

    this.mixer.addEventListener("finished", (event) => {
      if (event.action === this.actions.backflip) {
        this.flipBusy = false;
      }
      if (this.pendingLoopActionKey) {
        const nextKey = this.pendingLoopActionKey;
        this.pendingLoopActionKey = "";
        this.playLoop(nextKey);
      }
    });
  }

  getAction(key) {
    return this.actions[key] || null;
  }

  playLoop(key, fade = 0.18) {
    const next = this.getAction(key);
    if (!next) return false;
    if (this.currentAction === next && this.currentActionKey === key) return true;

    next.reset();
    next.enabled = true;
    next.setLoop(THREE.LoopRepeat, Infinity);
    next.clampWhenFinished = false;

    if (this.currentAction) {
      this.currentAction.crossFadeTo(next, fade, true);
    }

    next.play();
    this.currentAction = next;
    this.currentActionKey = key;
    return true;
  }

  playOnce(key, fallbackKey = "fly", fade = 0.12) {
    const next = this.getAction(key);
    if (!next) {
      this.playLoop(fallbackKey);
      return false;
    }

    this.pendingLoopActionKey = fallbackKey;
    next.reset();
    next.enabled = true;
    next.setLoop(THREE.LoopOnce, 1);
    next.clampWhenFinished = true;

    if (this.currentAction) {
      this.currentAction.crossFadeTo(next, fade, true);
    }

    next.play();
    this.currentAction = next;
    this.currentActionKey = key;
    return true;
  }

  pickNextPatrolPoint(seedOnly = false) {
    this.pickPatrolSeed += randomRange(0.55, 1.35);
    const radius = randomRange(this.cfg.patrolRadiusMin, this.cfg.patrolRadiusMax);
    const y = randomRange(this.cfg.patrolHeightMin, this.cfg.patrolHeightMax);
    this.patrolPoint.set(
      this.orbitCenter.x + Math.cos(this.pickPatrolSeed) * radius,
      this.orbitCenter.y + y,
      this.orbitCenter.z + Math.sin(this.pickPatrolSeed) * radius
    );

    if (seedOnly) {
      this.root.position.copy(this.patrolPoint);
      this.targetPoint.copy(this.patrolPoint);
    }
  }

  updateHoverTarget(hoveredIndex, coverWorldData) {
    if (hoveredIndex !== this.hoveredCoverIndex) {
      this.hoveredCoverIndex = hoveredIndex;
      this.coverHoverBeganAt = this.getElapsed();
    }

    if (hoveredIndex < 0) return false;
    const cover = coverWorldData?.[hoveredIndex];
    if (!cover || !cover.visible) return false;

    const normal = this.temp.vecA.copy(cover.right).cross(cover.up).normalize();
    const toCam = this.temp.vecB.copy(this.camera.position).sub(cover.position);
    if (normal.dot(toCam) < 0) normal.multiplyScalar(-1);

    this.currentCoverNormal.copy(normal);
    this.currentCoverUp.copy(cover.up);
    this.currentCoverPoint
      .copy(cover.position)
      .addScaledVector(cover.up, this.coverSize.height * 0.5 + this.cfg.coverPerchLift)
      .addScaledVector(normal, this.cfg.coverPerchForward);

    return this.getElapsed() - this.coverHoverBeganAt >= this.cfg.hoverPerchDelay;
  }

  updateMovement(delta, coverWorldData) {
    const readyToPerch = this.updateHoverTarget(this.hoveredCoverIndex, coverWorldData);

    if (!this.flipBusy && readyToPerch) {
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
    } else if (this.mode === "toVoid" || this.mode === "feeding") {
      target = this.voidState.position;
      speed = this.cfg.diveSpeed;
    } else {
      target = this.patrolPoint;
      speed = this.cfg.flySpeed;
    }

    this.targetPoint.copy(target);

    const toTarget = this.temp.vecC.copy(target).sub(this.root.position);
    const distance = toTarget.length();

    if (this.mode === "patrol" && distance < this.cfg.arrivalRadius) {
      this.pickNextPatrolPoint();
    }

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
      this.root.position.lerp(this.currentCoverPoint, 1.0 - Math.exp(-delta * 10.0));
      this.velocity.multiplyScalar(0.68);
      const lookPoint = this.temp.vecD.copy(this.currentCoverPoint).add(this.currentCoverNormal);
      makeLookQuaternion(this.root.position, lookPoint, this.currentCoverUp, this.temp.quatA);
      this.root.quaternion.slerp(this.temp.quatA, 1.0 - Math.exp(-delta * 11.0));

      if (this.hoveredCoverIndex < 0) {
        this.perched = false;
        this.mode = this.voidState.active ? "toVoid" : "patrol";
        this.root.position.y += this.cfg.coverPerchLift;
        this.playOnce("takeoff", this.vitality < this.cfg.sadThreshold ? "flySad" : "fly");
      }
      return;
    }

    if (this.mode === "feeding") {
      this.velocity.multiplyScalar(0.82);
      this.root.position.lerp(this.voidState.position, 1.0 - Math.exp(-delta * 9.5));
      const lookPoint = this.temp.vecD.copy(this.voidState.position).add(new THREE.Vector3(0, 0, -0.25));
      makeLookQuaternion(this.root.position, lookPoint, new THREE.Vector3(0, 1, 0), this.temp.quatA);
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
      makeLookQuaternion(this.root.position, lookPoint, new THREE.Vector3(0, 1, 0), this.temp.quatA);
      this.root.quaternion.slerp(this.temp.quatA, this.cfg.turnLerp);
    }
  }

  updateAnimation(delta) {
    if (!this.ready) return;

    if (this.fallbackWings?.length) {
      const t = this.getElapsed();
      const base = this.mode === "feeding" ? 11.0 : this.vitality < this.cfg.sadThreshold ? 5.0 : 7.5;
      const amp = this.mode === "perched" ? 0.08 : this.vitality < this.cfg.sadThreshold ? 0.24 : 0.46;
      this.fallbackWings[0].rotation.z = Math.sin(t * base) * amp + 0.16;
      this.fallbackWings[1].rotation.z = -Math.sin(t * base) * amp - 0.16;
    }

    if (!this.mixer) return;
    if (this.flipBusy) {
      this.mixer.update(delta);
      return;
    }

    let desired = this.vitality < this.cfg.sadThreshold ? "flySad" : "fly";
    if (this.mode === "perched") desired = this.getAction("perch") ? "perch" : desired;
    else if (this.mode === "toCover") desired = this.getAction("land") ? "land" : desired;
    else if (this.mode === "feeding" || this.mode === "toVoid") desired = this.getAction("feed") ? "feed" : desired;

    this.playLoop(desired);
    this.mixer.update(delta);
  }

  updateVitals(delta) {
    const feeding = this.mode === "feeding" || this.mode === "perched";
    if (feeding) {
      this.vitality = clamp01(this.vitality + this.cfg.vitalityRecoveryPerSecond * delta);
    } else {
      this.vitality = clamp01(this.vitality - this.cfg.vitalityDrainPerSecond * delta);
    }

    if (this.mode === "feeding" && this.voidState.active) {
      this.voidState.energy = Math.max(0, this.voidState.energy - this.cfg.voidConsumeRate * delta);
      this.vitality = clamp01(this.vitality + this.cfg.vitalityRecoveryPerSecond * delta * 1.2);

      if (this.voidState.energy <= 0.001) {
        this.clearVoid();
        this.mode = this.hoveredCoverIndex >= 0 ? "toCover" : "patrol";
        this.pickNextPatrolPoint();
        this.log("binary void consumed", "OK");
      }
    }

    if (this.mode === "perched" && this.hoveredCoverIndex >= 0) {
      const now = this.getElapsed();
      if (now - this.lastNestDropAt >= this.cfg.nestDepositDelay) {
        this.lastNestDropAt = now;
        this.dropNestOnCover(this.hoveredCoverIndex);
      }
    }

    if (this.mode === "feeding") this.stateName = "Feeding";
    else if (this.vitality < this.cfg.sadThreshold) this.stateName = "Dying";
    else if (this.mode === "toVoid" || this.mode === "toCover" || this.mode === "perched") this.stateName = "Curious";
    else if (this.voidState.active && this.voidState.energy > this.cfg.swarmThreshold) this.stateName = "Swarming";
    else this.stateName = "Hiding";
  }

  updateShell(elapsed) {
    if (!this.shell) return;
    this.shell.material.uniforms.uTime.value = elapsed;
    this.shell.material.uniforms.uAlpha.value =
      this.cfg.shellAlpha +
      Math.sin(elapsed * 3.1) * this.cfg.shellPulse +
      (this.mode === "feeding" ? 0.18 : 0.0) +
      (this.vitality < this.cfg.sadThreshold ? -0.08 : 0.06);
  }

  emitTrailParticle() {
    const i = this.trail.cursor;
    this.trail.cursor = (this.trail.cursor + 1) % this.cfg.trailCount;

    const local = this.localSurfacePoints[Math.floor(Math.random() * this.localSurfacePoints.length)] || new THREE.Vector3();
    const world = this.modelHolder.localToWorld(local.clone());

    const base = i * 3;
    this.trail.positions[base + 0] = world.x;
    this.trail.positions[base + 1] = world.y;
    this.trail.positions[base + 2] = world.z;
    this.trail.life[i] = this.cfg.trailLife;

    const vel = this.trail.velocities[i];
    vel.copy(this.forward)
      .multiplyScalar(-this.velocity.length() * this.cfg.trailSpeedFactor - 0.08)
      .add(this.temp.vecA.set(
        (Math.random() - 0.5) * this.cfg.trailVelocityJitter,
        (Math.random() - 0.5) * this.cfg.trailVelocityJitter,
        (Math.random() - 0.5) * this.cfg.trailVelocityJitter
      ));
  }

  updateTrail(delta, elapsed) {
    this.trail.material.uniforms.uTime.value = elapsed;
    this.trail.material.uniforms.uAlpha.value =
      this.cfg.trailAlpha *
      (this.mode === "feeding" ? 1.18 : this.vitality < this.cfg.sadThreshold ? 0.68 : 1.0);

    this.trail.emitTimer += delta;
    const canEmit = this.ready && this.mode !== "perched";
    while (canEmit && this.trail.emitTimer >= this.cfg.trailEmitInterval) {
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

  updateVoidVisual(delta, elapsed) {
    const visual = this.voidVisual;
    visual.material.uniforms.uTime.value = elapsed;

    if (!this.voidState.active) {
      visual.group.visible = false;
      return;
    }

    visual.group.visible = true;
    visual.group.position.copy(this.voidState.position);
    visual.group.quaternion.copy(this.camera.quaternion);

    this.voidState.spin += delta * (1.2 + this.voidState.energy * 0.55);

    for (let i = 0; i < this.cfg.voidParticleCount; i += 1) {
      const base = i * 3;
      const swirl = this.voidState.spin + visual.depth[i] * -2.8 + i * 0.006;
      const wobble = Math.sin(elapsed * 2.2 + i * 0.13) * 0.03;
      const r = visual.radius[i] * (0.96 + wobble) * (0.94 + this.voidState.energy * 0.08);
      visual.positions[base + 0] = Math.cos(visual.angle[i] + swirl) * r;
      visual.positions[base + 1] = Math.sin(visual.angle[i] + swirl) * r;
      visual.positions[base + 2] = visual.depth[i] + Math.sin(elapsed * 3.0 + i * 0.21) * 0.018;
    }

    visual.geometry.attributes.position.needsUpdate = true;
    visual.material.uniforms.uAlpha.value = 0.76 + this.voidState.energy * 0.16;
    visual.halo.scale.setScalar(0.96 + Math.sin(elapsed * 2.1) * 0.06 + this.voidState.energy * 0.08);
  }

  clearVoid() {
    this.voidState.active = false;
    this.voidState.energy = 0;
  }

  spawnVoid(position) {
    this.voidState.active = true;
    this.voidState.position.copy(position);
    this.voidState.energy = Math.min(1.45, Math.max(0.88, this.voidState.energy + 0.28));
    this.mode = "toVoid";
    this.perched = false;
    this.playLoop(this.vitality < this.cfg.sadThreshold ? "flySad" : "fly");
    this.log("binary void opened", "ALRT");
  }

  pickVoidPoint(raycaster) {
    const hit = new THREE.Vector3();
    this.temp.sphere.center.copy(this.orbitCenter);
    this.temp.sphere.radius = this.cfg.voidSpawnRadius;

    if (!raycaster.ray.intersectSphere(this.temp.sphere, hit)) {
      this.temp.plane.set(new THREE.Vector3(0, 0, 1), -this.orbitCenter.z);
      if (!raycaster.ray.intersectPlane(this.temp.plane, hit)) return null;
    }

    const local = hit.clone().sub(this.orbitCenter);
    if (local.length() > this.cfg.voidSpawnRadius) {
      local.setLength(this.cfg.voidSpawnRadius);
    }
    local.y = THREE.MathUtils.clamp(local.y, this.cfg.voidHeightMin, this.cfg.voidHeightMax);
    return hit.copy(this.orbitCenter).add(local);
  }

  performBackflip() {
    this.flipBusy = true;
    this.perched = false;
    this.mode = "patrol";
    this.hoveredCoverIndex = -1;
    this.root.position.y += this.cfg.clickEvadeLift * 0.16;
    this.velocity.add(this.forward.clone().multiplyScalar(-this.cfg.clickEvadePush));
    this.pickNextPatrolPoint();

    if (!this.playOnce("backflip", this.vitality < this.cfg.sadThreshold ? "flySad" : "fly")) {
      this.flipBusy = false;
      this.playLoop(this.vitality < this.cfg.sadThreshold ? "flySad" : "fly");
    }

    this.log("specter moth startled :: backflip", "WARN");
  }

  handleClick(event, hoveredEntry) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1
    );

    this.temp.raycaster.setFromCamera(mouse, this.camera);

    const mothHits = this.temp.raycaster.intersectObject(this.hitProxy, false);
    if (mothHits.length) {
      this.performBackflip();
      return true;
    }

    if (hoveredEntry) return false;

    const point = this.pickVoidPoint(this.temp.raycaster);
    if (point) {
      this.spawnVoid(point);
      return true;
    }

    return false;
  }

  update(params = {}) {
    const delta = params.delta || 0.016;
    const elapsed = params.elapsed || this.getElapsed();
    const hoveredIndex = typeof params.hoveredIndex === "number" ? params.hoveredIndex : -1;
    const coverWorldData = params.coverWorldData || [];

    this.hoveredCoverIndex = hoveredIndex;

    this.updateMovement(delta, coverWorldData);
    this.updateVitals(delta);
    this.updateAnimation(delta);
    this.updateShell(elapsed);
    this.updateTrail(delta, elapsed);
    this.updateVoidVisual(delta, elapsed);
    this.updateNests(coverWorldData);
    this.saveState(false);
  }

  dispose() {
    this.saveState(true);
    if (this.mixer) this.mixer.stopAllAction();
    if (this.shell?.points?.parent) this.shell.points.parent.remove(this.shell.points);
    if (this.trail?.points?.parent) this.trail.points.parent.remove(this.trail.points);
    if (this.voidVisual?.group?.parent) this.voidVisual.group.parent.remove(this.voidVisual.group);
    if (this.nestGroup?.parent) this.nestGroup.parent.remove(this.nestGroup);
    if (this.root?.parent) this.root.parent.remove(this.root);
  }
}
