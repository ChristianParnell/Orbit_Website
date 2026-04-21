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
  storageKey: "orbitSpecterMothV4",
  sizeRatioToModelHeight: 0.1,
  modelYawOffset: 0,
  modelPitchOffset: 0,
  modelRollOffset: 0,
  patrolRadiusMin: 1.15,
  patrolRadiusMax: 2.2,
  patrolHeightMin: -0.18,
  patrolHeightMax: 1.7,
  flySpeed: 1.35,
  diveSpeed: 1.85,
  arrivalRadius: 0.12,
  turnLerp: 0.12,
  damping: 0.92,
  hoverPerchDelay: 0.1,
  coverPerchLift: 0.07,
  coverPerchForward: 0.05,
  coverFollowLerp: 0.18,
  clickEvadeLift: 0.24,
  clickEvadePush: 0.28,
  shellCount: 120,
  shellAlpha: 0.38,
  shellPointScale: 0.85,
  trailCount: 180,
  trailEmitInterval: 0.02,
  trailLife: 0.78,
  trailDrag: 1.85,
  trailSpeedFactor: 0.26,
  trailVelocityJitter: 0.14,
  trailAlpha: 0.8,
  trailPointScale: 0.95,
  meshSampleLimit: 320,
  voidRadius: 0.58,
  voidDepth: 1.2,
  voidSpawnRadius: 2.25,
  voidHeightMin: -0.85,
  voidHeightMax: 1.85,
  voidConsumeDistance: 0.18,
  voidConsumeRate: 0.9,
  nestMax: 6,
  nestChancePerLanding: 0.24,
  nestDepositDelay: 7.0,
  nestScaleMin: 0.08,
  nestScaleMax: 0.16,
  vitalityDrainPerSecond: 0.003,
  vitalityRecoveryPerSecond: 0.011,
  offlineDrainPerHour: 0.05,
  sadThreshold: 0.28,
  swarmThreshold: 1.1,
  stateSaveInterval: 5.0
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

function randomRange(min, max) {
  return min + Math.random() * (max - min);
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
  ctx.shadowColor = "rgba(255,255,255,0.2)";
  ctx.shadowBlur = 10;
  ctx.font = '900 360px ui-monospace, "SFMono-Regular", Menlo, Monaco, Consolas, monospace';
  ctx.fillText("0", 256, 256);
  ctx.fillText("1", 768, 256);

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
  grad.addColorStop(0.45, "rgba(8,18,35,0.56)");
  grad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(size * 0.5, size * 0.5, size * 0.44, 0, Math.PI * 2);
  ctx.fill();

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = '700 18px ui-monospace, "SFMono-Regular", Menlo, Monaco, Consolas, monospace';
  const colors = ["#2fe4ff", "#4b7dff", "#33ff88", "#ff57ce"];

  for (let i = 0; i < 120; i += 1) {
    ctx.save();
    ctx.translate(Math.random() * size, Math.random() * size);
    ctx.rotate((Math.random() - 0.5) * 1.6);
    ctx.fillStyle = colors[i % colors.length];
    ctx.globalAlpha = 0.16 + Math.random() * 0.28;
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
        gl_PointSize = (24.0 * aSize * max(0.04, aLife)) / max(0.65, -mv.z);
        vDigit = mod(floor(aSeed * 89.0 + uTime * (3.0 + fract(aSeed * 5.0))), 2.0);
        vPalette = fract(aSeed * 11.37 + uTime * 0.03);
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
        float radial = smoothstep(1.0, 0.16, distance(gl_PointCoord, vec2(0.5)));
        float alpha = glyph.a * radial * vAlpha * uAlpha;
        if (alpha < 0.02) discard;
        gl_FragColor = vec4(pickPalette(vPalette), alpha);
      }
    `
  });
}

function createVoidMaterial(atlas, palette) {
  const p = palette.map((c) => c.clone());
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: true,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uAtlas: { value: atlas },
      uTime: { value: 0 },
      uAlpha: { value: 1 },
      uPalette: { value: p }
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D uAtlas;
      uniform float uTime;
      uniform float uAlpha;
      uniform vec3 uPalette[7];
      varying vec2 vUv;

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
      }

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
        vec2 p = vUv * 2.0 - 1.0;
        p.y *= 1.15;
        float r = length(p);
        float a = atan(p.y, p.x);
        float ring = smoothstep(1.02, 0.86, r) * smoothstep(0.08, 0.22, r);

        float swirl = a * 3.8 + (1.0 - r) * 18.0 - uTime * 3.2;
        vec2 codeUv = vec2(fract(swirl * 0.08), fract((1.0 - r) * 8.0 + uTime * 0.25));
        float digit = step(0.5, hash(floor(vec2(swirl * 1.3, r * 40.0))));
        codeUv.x = mix(codeUv.x * 0.5, 0.5 + codeUv.x * 0.5, digit);
        vec4 glyph = texture2D(uAtlas, codeUv);

        float tunnel = smoothstep(0.92, 0.28, r);
        float pulse = 0.85 + 0.15 * sin(uTime * 5.5 + r * 18.0 - a * 2.0);
        float alpha = glyph.a * ring * tunnel * pulse * uAlpha;
        alpha *= smoothstep(0.02, 0.16, r);
        if (alpha < 0.02) discard;

        vec3 color = pickPalette(fract(a * 0.11 + (1.0 - r) * 0.7 + uTime * 0.02));
        gl_FragColor = vec4(color, alpha);
      }
    `
  });
}

function getMeshBounds(root) {
  root.updateMatrixWorld(true);
  const box = new THREE.Box3();
  const tempBox = new THREE.Box3();
  let found = false;

  root.traverse((child) => {
    if (!child.isMesh || !child.geometry?.attributes?.position) return;
    if (!child.geometry.boundingBox) child.geometry.computeBoundingBox();
    tempBox.copy(child.geometry.boundingBox).applyMatrix4(child.matrixWorld);
    if (!found) {
      box.copy(tempBox);
      found = true;
    } else {
      box.union(tempBox);
    }
  });

  if (!found) {
    box.setFromObject(root);
  }

  return box;
}

function collectMeshSamplePoints(root, desiredCount) {
  const pools = [];
  let totalVertices = 0;

  root.updateMatrixWorld(true);

  root.traverse((child) => {
    if (!child.isMesh || !child.geometry?.attributes?.position) return;
    const positionAttr = child.geometry.attributes.position;
    if (!positionAttr.count) return;
    pools.push({ child, positionAttr, count: positionAttr.count });
    totalVertices += positionAttr.count;
  });

  if (!pools.length || !totalVertices) return [];

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
    this.patrolAngle = Math.random() * Math.PI * 2;

    this.voidState = {
      active: false,
      position: new THREE.Vector3(),
      energy: 0
    };

    this.temp = {
      vecA: new THREE.Vector3(),
      vecB: new THREE.Vector3(),
      vecC: new THREE.Vector3(),
      vecD: new THREE.Vector3(),
      quatA: new THREE.Quaternion(),
      box: new THREE.Box3(),
      raycaster: new THREE.Raycaster(),
      mouse: new THREE.Vector2(),
      plane: new THREE.Plane(new THREE.Vector3(0, 0, 1), 0),
      sphere: new THREE.Sphere(),
      scale: new THREE.Vector3(),
      center: new THREE.Vector3()
    };

    this.hitProxy = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 16, 16),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    this.hitProxy.visible = false;
    this.root.add(this.hitProxy);

    this.shell = this.buildShell();
    this.trail = this.buildTrail();
    this.voidVisual = this.buildVoidVisual();
    this.nestGroup = new THREE.Group();
    this.orbitRoot.add(this.nestGroup);
    this.nests = [];
    this.nestTexture = createNestTexture();

    this.restoreState();
    this.pickNextPatrolPoint(true);
    this.loadMoth();
  }

  log(message, level = "SYS") {
    if (this.debug) this.debug(`[MOTH/${level}] ${message}`);
  }

  restoreState() {
    const raw = safeStorageGet(this.cfg.storageKey);
    if (!raw) return;

    try {
      const data = JSON.parse(raw);
      if (typeof data.vitality === "number") this.vitality = clamp01(data.vitality);
      if (typeof data.lastVisit === "number") {
        const hours = Math.max(0, (Date.now() - data.lastVisit) / 3600000);
        this.vitality = clamp01(this.vitality - hours * this.cfg.offlineDrainPerHour);
      }
      if (Array.isArray(data.nests)) {
        this.pendingNestState = data.nests.slice(0, this.cfg.nestMax);
      }
    } catch {
      // ignore
    }
  }

  saveState(force = false) {
    const elapsed = this.getElapsed();
    if (!force && elapsed - this.lastSaveAt < this.cfg.stateSaveInterval) return;
    this.lastSaveAt = elapsed;
    safeStorageSet(
      this.cfg.storageKey,
      JSON.stringify({
        vitality: this.vitality,
        lastVisit: Date.now(),
        nests: this.nests.map((nest) => ({
          coverIndex: nest.coverIndex,
          u: nest.u,
          v: nest.v,
          rot: nest.rot,
          scale: nest.scale
        }))
      })
    );
  }

  buildShell() {
    const count = this.cfg.shellCount;
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    const sizes = new Float32Array(count);
    const life = new Float32Array(count);

    for (let i = 0; i < count; i += 1) {
      positions[i * 3 + 0] = 0;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = 0;
      seeds[i] = Math.random();
      sizes[i] = this.cfg.shellPointScale * (0.75 + Math.random() * 0.7);
      life[i] = 0.65 + Math.random() * 0.35;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));
    geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
    geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute("aLife", new THREE.BufferAttribute(life, 1));

    const material = createBinaryPointMaterial(this.glyphAtlas, this.palette, true);
    const points = new THREE.Points(geometry, material);
    points.frustumCulled = false;
    points.renderOrder = 6;
    this.root.add(points);

    return { geometry, material, points, positions, life, sizes };
  }

  buildShellFromSamples(samples) {
    const pos = this.shell.geometry.attributes.position.array;
    const life = this.shell.geometry.attributes.aLife.array;
    const count = this.cfg.shellCount;

    for (let i = 0; i < count; i += 1) {
      const sample = samples[i % samples.length];
      const jitter = 0.008;
      pos[i * 3 + 0] = sample.x + (Math.random() - 0.5) * jitter;
      pos[i * 3 + 1] = sample.y + (Math.random() - 0.5) * jitter;
      pos[i * 3 + 2] = sample.z + (Math.random() - 0.5) * jitter;
      life[i] = 0.5 + Math.random() * 0.5;
    }

    this.shell.geometry.attributes.position.needsUpdate = true;
    this.shell.geometry.attributes.aLife.needsUpdate = true;
  }

  buildTrail() {
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
      sizes[i] = this.cfg.trailPointScale * (0.7 + Math.random() * 0.9);
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
    points.renderOrder = 7;
    this.scene.add(points);

    return { geometry, material, points, positions, life, velocities, cursor: 0, emitTimer: 0 };
  }

  buildVoidVisual() {
    const group = new THREE.Group();
    group.visible = false;
    group.renderOrder = 8;
    this.orbitRoot.add(group);

    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(this.cfg.voidRadius * 2.35, this.cfg.voidRadius * 2.35, 1, 1),
      createVoidMaterial(this.glyphAtlas, this.palette)
    );
    plane.renderOrder = 8;
    group.add(plane);

    const core = new THREE.Mesh(
      new THREE.CircleGeometry(this.cfg.voidRadius * 0.18, 40),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.96, depthWrite: false })
    );
    core.position.z = 0.001;
    core.renderOrder = 9;
    group.add(core);

    const rim = new THREE.Mesh(
      new THREE.RingGeometry(this.cfg.voidRadius * 0.22, this.cfg.voidRadius * 0.3, 48),
      new THREE.MeshBasicMaterial({ color: 0x4b7dff, transparent: true, opacity: 0.2, depthWrite: false, blending: THREE.AdditiveBlending })
    );
    rim.position.z = 0.002;
    rim.renderOrder = 9;
    group.add(rim);

    return { group, plane, core, rim, material: plane.material };
  }

  createNest(data) {
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({
        map: this.nestTexture,
        transparent: true,
        opacity: 0.9,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false
      })
    );
    mesh.renderOrder = 5;
    this.nestGroup.add(mesh);

    const nest = { mesh, ...data };
    this.nests.push(nest);
    if (this.nests.length > this.cfg.nestMax) {
      const oldest = this.nests.shift();
      oldest?.mesh?.parent?.remove(oldest.mesh);
    }
    return nest;
  }

  restoreNests() {
    if (!Array.isArray(this.pendingNestState)) return;
    for (const data of this.pendingNestState) this.createNest(data);
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
      if (!data?.visible) {
        nest.mesh.visible = false;
        continue;
      }

      nest.mesh.visible = true;
      const normal = this.temp.vecA.copy(data.right).cross(data.up).normalize();
      const toCam = this.temp.vecB.copy(this.camera.position).sub(data.position);
      if (normal.dot(toCam) < 0) normal.multiplyScalar(-1);

      nest.mesh.position
        .copy(data.position)
        .addScaledVector(data.right, nest.u * halfW * 2)
        .addScaledVector(data.up, nest.v * halfH * 2)
        .addScaledVector(normal, 0.01);

      nest.mesh.scale.setScalar(nest.scale);
      makeLookQuaternion(nest.mesh.position, nest.mesh.position.clone().add(normal), data.up, nest.mesh.quaternion);
      nest.mesh.rotateZ(nest.rot);
    }
  }

  loadMoth() {
    const src = this.assets?.modelFBX || "./assets/models/moth/moth.fbx";
    this.loader.load(
      src,
      (fbx) => this.setupLoadedMoth(fbx),
      undefined,
      (err) => {
        console.error("Moth FBX failed to load:", err);
        this.log("moth load failed, using fallback", "ERR");
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
        if ("emissive" in child.material) {
          child.material.emissive.set("#12364d");
          child.material.emissiveIntensity = 0.35;
        }
      }
    });

    const preBox = getMeshBounds(fbx);
    const preCenter = preBox.getCenter(this.temp.center);
    const preSize = preBox.getSize(this.temp.scale);
    fbx.position.sub(preCenter);

    let targetHeight = 0.34;
    if (this.centralModel) {
      const centerBox = new THREE.Box3().setFromObject(this.centralModel);
      const centerSize = centerBox.getSize(new THREE.Vector3());
      if (centerSize.y > 0) targetHeight = centerSize.y * this.cfg.sizeRatioToModelHeight;
    }

    const rawHeight = Math.max(0.001, preSize.y || 1);
    const scale = THREE.MathUtils.clamp(targetHeight / rawHeight, 0.002, 2.5);
    fbx.scale.setScalar(scale);

    this.modelHolder.rotation.set(this.cfg.modelPitchOffset, this.cfg.modelYawOffset, this.cfg.modelRollOffset);

    const postBox = getMeshBounds(this.modelHolder);
    const postSize = postBox.getSize(new THREE.Vector3());
    const hitRadius = Math.max(postSize.x, postSize.y, postSize.z) * 0.5;
    this.hitProxy.geometry.dispose();
    this.hitProxy.geometry = new THREE.SphereGeometry(Math.max(0.06, hitRadius), 16, 16);

    this.localSurfacePoints = collectMeshSamplePoints(this.modelHolder, this.cfg.meshSampleLimit);
    if (!this.localSurfacePoints.length) this.localSurfacePoints = [new THREE.Vector3(0, 0, 0)];
    this.buildShellFromSamples(this.localSurfacePoints);
    this.setupAnimationMixer(fbx.animations || []);
    this.restoreNests();

    this.ready = true;
    this.playLoop(this.vitality < this.cfg.sadThreshold ? "flySad" : "fly");
    this.log(`moth loaded :: clips=${(fbx.animations || []).map((a) => a.name).join(", ")}`, "OK");
  }

  createFallbackMoth() {
    const g = new THREE.Group();

    const body = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.025, 0.11, 4, 8),
      new THREE.MeshStandardMaterial({ color: 0x6a6f7b, emissive: 0x12364d, emissiveIntensity: 0.35, roughness: 0.78 })
    );
    g.add(body);

    const wingMat = new THREE.MeshStandardMaterial({
      color: 0x585d68,
      emissive: 0x12364d,
      emissiveIntensity: 0.2,
      roughness: 0.85,
      transparent: true,
      opacity: 0.94,
      side: THREE.DoubleSide
    });

    const wingGeo = new THREE.PlaneGeometry(0.12, 0.22);
    const left = new THREE.Mesh(wingGeo, wingMat.clone());
    const right = new THREE.Mesh(wingGeo, wingMat.clone());
    left.position.set(-0.055, 0.03, 0);
    right.position.set(0.055, 0.03, 0);
    left.rotation.y = Math.PI * 0.42;
    right.rotation.y = -Math.PI * 0.42;
    left.rotation.z = 0.1;
    right.rotation.z = -0.1;
    g.add(left, right);

    this.fallbackWings = [left, right];
    this.moth = g;
    this.modelHolder.add(g);

    this.localSurfacePoints = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(-0.04, 0.03, 0),
      new THREE.Vector3(0.04, 0.03, 0),
      new THREE.Vector3(0, -0.03, 0.02)
    ];
    this.buildShellFromSamples(this.localSurfacePoints);
    this.restoreNests();
    this.ready = true;
  }

  setupAnimationMixer(clips) {
    if (!this.moth || !clips.length) return;
    this.mixer = new THREE.AnimationMixer(this.moth);

    const normalized = new Map();
    for (const clip of clips) normalized.set(normalizeName(clip.name), clip);

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
      const clip = findClip(aliases.map(normalizeName));
      if (!clip) continue;
      const action = this.mixer.clipAction(clip);
      action.enabled = true;
      action.clampWhenFinished = true;
      this.actions[key] = action;
    }

    this.mixer.addEventListener("finished", (event) => {
      if (event.action === this.actions.backflip) this.flipBusy = false;
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

    if (this.currentAction) this.currentAction.crossFadeTo(next, fade, true);
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

    if (this.currentAction) this.currentAction.crossFadeTo(next, fade, true);
    next.play();
    this.currentAction = next;
    this.currentActionKey = key;
    return true;
  }

  performBackflip() {
    this.flipBusy = true;
    this.perched = false;
    this.mode = "patrol";
    this.root.position.y += this.cfg.clickEvadeLift * 0.18;
    this.velocity.add(this.forward.clone().multiplyScalar(-this.cfg.clickEvadePush));
    this.pickNextPatrolPoint();

    if (!this.playOnce("backflip", this.vitality < this.cfg.sadThreshold ? "flySad" : "fly")) {
      this.flipBusy = false;
    }
  }

  pickNextPatrolPoint(seedOnly = false) {
    this.patrolAngle += randomRange(0.55, 1.35);
    const radius = randomRange(this.cfg.patrolRadiusMin, this.cfg.patrolRadiusMax);
    const y = randomRange(this.cfg.patrolHeightMin, this.cfg.patrolHeightMax);
    this.patrolPoint.set(
      this.orbitCenter.x + Math.cos(this.patrolAngle) * radius,
      this.orbitCenter.y + y,
      this.orbitCenter.z + Math.sin(this.patrolAngle) * radius
    );
    if (seedOnly) this.root.position.copy(this.patrolPoint);
  }

  updateHoverTarget(hoveredIndex, coverWorldData) {
    if (hoveredIndex !== this.hoveredCoverIndex) {
      this.hoveredCoverIndex = hoveredIndex;
      this.coverHoverBeganAt = this.getElapsed();
    }

    if (hoveredIndex < 0) return false;
    const data = coverWorldData?.[hoveredIndex];
    if (!data?.visible) return false;

    const normal = this.temp.vecA.copy(data.right).cross(data.up).normalize();
    const toCam = this.temp.vecB.copy(this.camera.position).sub(data.position);
    if (normal.dot(toCam) < 0) normal.multiplyScalar(-1);

    this.currentCoverNormal.copy(normal);
    this.currentCoverUp.copy(data.up);
    this.currentCoverPoint
      .copy(data.position)
      .addScaledVector(data.up, this.coverSize.height * 0.5 + this.cfg.coverPerchLift)
      .addScaledVector(normal, this.cfg.coverPerchForward);

    return this.getElapsed() - this.coverHoverBeganAt >= this.cfg.hoverPerchDelay;
  }

  updateMovement(delta, coverWorldData) {
    const lockedToCover = this.updateHoverTarget(this.hoveredCoverIndex, coverWorldData);

    if (!this.flipBusy && lockedToCover) {
      this.mode = this.perched ? "perched" : "toCover";
    } else if (!this.flipBusy && this.voidState.active) {
      this.mode = "toVoid";
    } else if (!this.flipBusy && this.mode !== "perched") {
      this.mode = "patrol";
    }

    let target = this.patrolPoint;
    let speed = this.cfg.flySpeed;

    if (this.mode === "toCover" || this.mode === "perched") {
      target = this.currentCoverPoint;
      speed = this.cfg.flySpeed * 0.92;
    } else if (this.mode === "toVoid") {
      target = this.voidState.position;
      speed = this.cfg.diveSpeed;
    }

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
      this.root.position.lerp(this.currentCoverPoint, 1 - Math.exp(-delta * 8));
      this.velocity.multiplyScalar(0.6);
      const look = this.temp.vecD.copy(this.currentCoverPoint).add(this.currentCoverNormal);
      makeLookQuaternion(this.root.position, look, this.currentCoverUp, this.temp.quatA);
      this.root.quaternion.slerp(this.temp.quatA, 1 - Math.exp(-delta * 10));

      if (this.hoveredCoverIndex < 0) {
        this.perched = false;
        this.mode = this.voidState.active ? "toVoid" : "patrol";
        this.root.position.y += this.cfg.clickEvadeLift * 0.2;
        this.playOnce("takeoff", this.vitality < this.cfg.sadThreshold ? "flySad" : "fly");
      }
      return;
    }

    if (this.mode === "feeding") {
      this.root.position.lerp(this.voidState.position, 1 - Math.exp(-delta * 9));
      this.velocity.multiplyScalar(0.75);
      const look = this.temp.vecD.copy(this.voidState.position).add(new THREE.Vector3(0, 0, -0.2));
      makeLookQuaternion(this.root.position, look, new THREE.Vector3(0, 1, 0), this.temp.quatA);
      this.root.quaternion.slerp(this.temp.quatA, 1 - Math.exp(-delta * 9));
      return;
    }

    if (distance > 0.0001) {
      const desired = toTarget.normalize().multiplyScalar(speed * Math.min(1.0, distance / 0.55 + 0.18));
      this.velocity.lerp(desired, 1 - Math.exp(-delta * 4.5));
    }
    this.velocity.multiplyScalar(Math.pow(this.cfg.damping, delta * 60));
    this.root.position.addScaledVector(this.velocity, delta);

    if (this.velocity.lengthSq() > 0.00001) {
      this.forward.lerp(this.velocity.clone().normalize(), 1 - Math.exp(-delta * 8)).normalize();
      const lookPoint = this.temp.vecD.copy(this.root.position).add(this.forward);
      makeLookQuaternion(this.root.position, lookPoint, new THREE.Vector3(0, 1, 0), this.temp.quatA);
      this.root.quaternion.slerp(this.temp.quatA, this.cfg.turnLerp);
    }
  }

  updateAnimations(delta) {
    if (!this.ready) return;

    if (!this.mixer && this.fallbackWings?.length) {
      const t = this.getElapsed();
      const base = this.mode === "feeding" ? 10.0 : this.vitality < this.cfg.sadThreshold ? 4.8 : 7.2;
      const amp = this.mode === "perched" ? 0.08 : this.vitality < this.cfg.sadThreshold ? 0.24 : 0.42;
      this.fallbackWings[0].rotation.z = Math.sin(t * base) * amp + 0.12;
      this.fallbackWings[1].rotation.z = -Math.sin(t * base) * amp - 0.12;
      return;
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
    if (this.mode === "feeding" || this.mode === "perched") {
      this.vitality = clamp01(this.vitality + this.cfg.vitalityRecoveryPerSecond * delta);
    } else {
      this.vitality = clamp01(this.vitality - this.cfg.vitalityDrainPerSecond * delta);
    }

    if (this.mode === "feeding" && this.voidState.active) {
      this.voidState.energy = Math.max(0, this.voidState.energy - this.cfg.voidConsumeRate * delta);
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
    else if (this.voidState.active && this.voidState.energy > this.cfg.swarmThreshold) this.stateName = "Swarming";
    else this.stateName = "Hiding";
  }

  updateShell(elapsed) {
    this.shell.material.uniforms.uTime.value = elapsed;
    this.shell.material.uniforms.uAlpha.value = this.cfg.shellAlpha * (this.mode === "feeding" ? 1.2 : this.vitality < this.cfg.sadThreshold ? 0.85 : 1.0);
  }

  emitTrailParticle() {
    if (!this.localSurfacePoints.length) return;
    const i = this.trail.cursor;
    this.trail.cursor = (this.trail.cursor + 1) % this.cfg.trailCount;

    const sample = this.localSurfacePoints[Math.floor(Math.random() * this.localSurfacePoints.length)];
    const local = sample.clone().add(new THREE.Vector3(
      (Math.random() - 0.5) * 0.01,
      (Math.random() - 0.5) * 0.01,
      (Math.random() - 0.5) * 0.01
    ));
    const world = this.root.localToWorld(local.clone());

    const base = i * 3;
    this.trail.positions[base + 0] = world.x;
    this.trail.positions[base + 1] = world.y;
    this.trail.positions[base + 2] = world.z;
    this.trail.life[i] = this.cfg.trailLife;

    this.trail.velocities[i]
      .copy(this.forward)
      .multiplyScalar(-this.velocity.length() * this.cfg.trailSpeedFactor - 0.12)
      .add(
        new THREE.Vector3(
          (Math.random() - 0.5) * this.cfg.trailVelocityJitter,
          (Math.random() - 0.5) * this.cfg.trailVelocityJitter,
          (Math.random() - 0.5) * this.cfg.trailVelocityJitter
        )
      );
  }

  updateTrail(delta, elapsed) {
    this.trail.material.uniforms.uTime.value = elapsed;
    this.trail.material.uniforms.uAlpha.value = this.cfg.trailAlpha * (this.mode === "feeding" ? 1.2 : this.vitality < this.cfg.sadThreshold ? 0.7 : 1.0);

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
      this.trail.velocities[i].multiplyScalar(Math.exp(-this.cfg.trailDrag * delta));
      this.trail.positions[base + 0] += this.trail.velocities[i].x * delta;
      this.trail.positions[base + 1] += this.trail.velocities[i].y * delta;
      this.trail.positions[base + 2] += this.trail.velocities[i].z * delta;
    }

    this.trail.geometry.attributes.position.needsUpdate = true;
    this.trail.geometry.attributes.aLife.needsUpdate = true;
  }

  updateVoidVisual(elapsed) {
    const visual = this.voidVisual;
    if (!this.voidState.active) {
      visual.group.visible = false;
      return;
    }

    visual.group.visible = true;
    visual.group.position.copy(this.voidState.position);
    visual.group.quaternion.copy(this.camera.quaternion);
    visual.material.uniforms.uTime.value = elapsed;
    visual.material.uniforms.uAlpha.value = 0.9 + Math.sin(elapsed * 3.2) * 0.05;

    const pulse = 0.96 + Math.sin(elapsed * 4.6) * 0.03;
    visual.core.scale.setScalar(pulse);
    visual.rim.scale.setScalar(1.0 + Math.sin(elapsed * 5.1) * 0.04);
  }

  clearVoid() {
    this.voidState.active = false;
    this.voidState.energy = 0;
  }

  spawnVoid(point) {
    this.voidState.active = true;
    this.voidState.position.copy(point);
    this.voidState.energy = 1.0;
    this.mode = "toVoid";
    this.perched = false;
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
    hit.copy(this.orbitCenter).add(local);
    return hit;
  }

  handleClick(event, hoveredEntry) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.temp.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.temp.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    this.temp.raycaster.setFromCamera(this.temp.mouse, this.camera);

    const hits = this.temp.raycaster.intersectObject(this.hitProxy, false);
    if (hits.length) {
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

  update(params = {}) {
    const delta = params.delta || 0.016;
    const elapsed = params.elapsed || this.getElapsed();
    const hoveredIndex = typeof params.hoveredIndex === "number" ? params.hoveredIndex : -1;
    const coverWorldData = params.coverWorldData || [];

    this.hoveredCoverIndex = hoveredIndex;

    this.updateMovement(delta, coverWorldData);
    this.updateVitals(delta);
    this.updateAnimations(delta);
    this.updateShell(elapsed);
    this.updateTrail(delta, elapsed);
    this.updateVoidVisual(elapsed);
    this.updateNests(coverWorldData);
    this.saveState(false);

    this.hitProxy.visible = false;
  }

  dispose() {
    this.saveState(true);
    if (this.mixer) this.mixer.stopAllAction();
    this.root.parent?.remove(this.root);
    this.trail.points.parent?.remove(this.trail.points);
    this.voidVisual.group.parent?.remove(this.voidVisual.group);
    this.nestGroup.parent?.remove(this.nestGroup);
  }
}
