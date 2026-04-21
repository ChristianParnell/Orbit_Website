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
  sizeRatioToModelHeight: 0.075,
  modelYawOffset: 0,
  modelPitchOffset: 0,
  modelRollOffset: 0,

  patrolRadiusMin: 1.2,
  patrolRadiusMax: 2.35,
  patrolHeightMin: -0.15,
  patrolHeightMax: 1.7,
  patrolSpeed: 0.7,
  flySpeed: 1.45,
  diveSpeed: 2.05,
  turnLerp: 0.11,
  damping: 0.94,
  arrivalRadius: 0.14,

  hoverPerchDelay: 0.1,
  coverPerchLift: 0.07,
  coverPerchForward: 0.055,
  coverFollowLerp: 0.18,
  coverTakeoffLift: 0.12,

  clickEvadeLift: 0.26,
  clickEvadePush: 0.28,

  shellCount: 130,
  shellScale: 1.0,

  trailCount: 220,
  trailEmitInterval: 0.018,
  trailLife: 0.78,
  trailSpread: 0.03,
  trailVelocityJitter: 0.16,
  trailSpeedFactor: 0.23,
  trailDrag: 1.8,
  trailPointScale: 1.0,
  trailAlpha: 0.82,

  voidParticleCount: 380,
  voidRadius: 0.48,
  voidDepth: 1.1,
  voidSpawnRadius: 2.25,
  voidHeightMin: -0.9,
  voidHeightMax: 1.85,
  voidConsumeDistance: 0.18,
  voidConsumeRate: 0.8,

  vitalityDrainPerSecond: 0.003,
  vitalityRecoveryPerSecond: 0.011,
  offlineDrainPerHour: 0.05,
  sadThreshold: 0.28,
  swarmThreshold: 1.2,

  nestMax: 6,
  nestChancePerLanding: 0.28,
  nestDepositDelay: 7.0,
  nestScaleMin: 0.08,
  nestScaleMax: 0.16,
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

function hexToRgba(hex, alpha) {
  const c = new THREE.Color(hex);
  return `rgba(${Math.round(c.r * 255)}, ${Math.round(c.g * 255)}, ${Math.round(c.b * 255)}, ${alpha})`;
}

function smootherstep(v) {
  const t = clamp01(v);
  return t * t * t * (t * (t * 6 - 15) + 10);
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
  ctx.shadowBlur = 10;
  ctx.font = '900 360px ui-monospace, "SFMono-Regular", Menlo, Monaco, Consolas, monospace';
  ctx.fillText("0", 256, 262);
  ctx.fillText("1", 768, 262);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.generateMipmaps = false;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
  return tex;
}

function createMessTexture(size = 256) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, size, size);

  const grad = ctx.createRadialGradient(size * 0.5, size * 0.5, size * 0.05, size * 0.5, size * 0.5, size * 0.48);
  grad.addColorStop(0, "rgba(0,0,0,0.9)");
  grad.addColorStop(0.6, "rgba(10,18,30,0.42)");
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
    const x = Math.random() * size;
    const y = Math.random() * size;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((Math.random() - 0.5) * 1.0);
    ctx.fillStyle = hexToRgba(colors[i % colors.length], 0.18 + Math.random() * 0.4);
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

function makeBinaryPointMaterial(atlas, palette, additive = true) {
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
        gl_PointSize = (24.0 * aSize * max(0.02, life)) / max(0.65, -mv.z);
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

function randomInRange(min, max) {
  return min + Math.random() * (max - min);
}

function safeLocalStorageGet(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeLocalStorageSet(key, value) {
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

export class MothSystem {
  constructor(options) {
    this.scene = options.scene;
    this.camera = options.camera;
    this.renderer = options.renderer;
    this.orbitRoot = options.orbitRoot || options.scene;
    this.centralModel = options.centralModel || null;
    this.coverSize = options.coverSize || { width: 0.84, height: 0.5 };
    this.orbitCenter = (options.orbitCenter || new THREE.Vector3()).clone();
    this.palette = (options.palette && options.palette.length ? options.palette : DEFAULT_PALETTE).map((c) => c.clone());
    this.assets = options.assets || {};
    this.cfg = { ...DEFAULT_CONFIG, ...(options.config || {}) };
    this.debug = typeof options.debug === "function" ? options.debug : null;
    this.getElapsed = typeof options.getElapsed === "function" ? options.getElapsed : () => 0;

    this.glyphAtlas = options.glyphAtlas || createGlyphAtlas();
    this.messTexture = createMessTexture();

    this.root = new THREE.Group();
    this.root.name = "SpecterMothRoot";
    this.orbitRoot.add(this.root);

    this.modelHolder = new THREE.Group();
    this.root.add(this.modelHolder);

    this.loader = new FBXLoader();
    this.mixer = null;
    this.moth = null;
    this.fallbackWings = [];
    this.actions = {};
    this.currentAction = null;
    this.currentActionKey = "";
    this.pendingLoopActionKey = "";
    this.flipBusy = false;

    this.velocity = new THREE.Vector3();
    this.forward = new THREE.Vector3(0, 0, 1);
    this.targetPoint = new THREE.Vector3();
    this.currentCoverPoint = new THREE.Vector3();
    this.currentCoverNormal = new THREE.Vector3(0, 0, 1);
    this.currentCoverUp = new THREE.Vector3(0, 1, 0);
    this.hoveredCoverIndex = -1;
    this.coverHoverBeganAt = -Infinity;
    this.perched = false;
    this.mode = "patrol";
    this.stateName = "Curious";
    this.ready = false;

    this.vitality = 0.74;
    this.lastSaveAt = 0;
    this.lastNestDropAt = -Infinity;

    this.voidState = {
      active: false,
      position: new THREE.Vector3(),
      energy: 0
    };

    this.patrolTheta = Math.random() * Math.PI * 2;
    this.patrolPoint = new THREE.Vector3();
    this.pickNextPatrolPoint(true);

    this.temp = {
      vecA: new THREE.Vector3(),
      vecB: new THREE.Vector3(),
      vecC: new THREE.Vector3(),
      vecD: new THREE.Vector3(),
      quatA: new THREE.Quaternion(),
      box: new THREE.Box3(),
      sphere: new THREE.Sphere(),
      raycaster: new THREE.Raycaster(),
      plane: new THREE.Plane(new THREE.Vector3(0, 0, 1), 0),
      mouse: new THREE.Vector2(),
      m4: new THREE.Matrix4()
    };

    this.hitProxy = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: false, visible: false })
    );
    this.hitProxy.visible = false;
    this.root.add(this.hitProxy);

    this.shell = this.buildShell();
    this.trail = this.buildTrail();
    this.voidVisual = this.buildVoidVisual();
    this.nests = [];
    this.nestGroup = new THREE.Group();
    this.nestGroup.name = "SpecterMothNests";
    this.orbitRoot.add(this.nestGroup);

    this.restoreState();
    this.loadMoth();
  }

  log(message, level = "SYS") {
    if (!this.debug) return;
    this.debug(`[MOTH/${level}] ${message}`);
  }

  restoreState() {
    const raw = safeLocalStorageGet(this.cfg.storageKey);
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
      // ignore
    }
  }

  saveState(force = false) {
    const elapsed = this.getElapsed();
    if (!force && elapsed - this.lastSaveAt < this.cfg.stateSaveInterval) return;
    this.lastSaveAt = elapsed;

    const data = {
      vitality: this.vitality,
      lastVisit: Date.now(),
      nests: this.nests.map((n) => ({
        coverIndex: n.coverIndex,
        u: n.u,
        v: n.v,
        rot: n.rot,
        scale: n.scale
      }))
    };

    safeLocalStorageSet(this.cfg.storageKey, JSON.stringify(data));
  }

  buildShell() {
    const geometry = new THREE.BufferGeometry();
    const count = this.cfg.shellCount;
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    const sizes = new Float32Array(count);
    const life = new Float32Array(count);

    for (let i = 0; i < count; i += 1) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 0.08;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 0.12;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 0.14;
      seeds[i] = Math.random();
      sizes[i] = 0.6 + Math.random() * 0.75;
      life[i] = 0.65 + Math.random() * 0.35;
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
    geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute("aLife", new THREE.BufferAttribute(life, 1));

    const material = makeBinaryPointMaterial(this.glyphAtlas, this.palette, true);
    const points = new THREE.Points(geometry, material);
    points.frustumCulled = false;
    points.renderOrder = 10;
    this.root.add(points);

    return {
      points,
      geometry,
      material,
      positions,
      seeds,
      sizes,
      life,
      bounds: new THREE.Vector3(0.08, 0.12, 0.14)
    };
  }

  fitShellToBounds(bounds) {
    const ext = bounds.getSize(new THREE.Vector3()).multiplyScalar(0.5);
    this.shell.bounds.copy(ext);

    const positions = this.shell.geometry.attributes.position.array;
    const count = positions.length / 3;

    for (let i = 0; i < count; i += 1) {
      const wingBias = Math.random();
      const x = (Math.random() - 0.5) * ext.x * (wingBias > 0.55 ? 3.1 : 1.1);
      const y = (Math.random() - 0.5) * ext.y * 1.6;
      const z = (Math.random() - 0.5) * ext.z * 2.0;

      positions[i * 3 + 0] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
    }

    this.shell.geometry.attributes.position.needsUpdate = true;
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
      sizes[i] = (0.7 + Math.random() * 0.8) * this.cfg.trailPointScale;
      life[i] = 0;
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));
    geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
    geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute("aLife", new THREE.BufferAttribute(life, 1).setUsage(THREE.DynamicDrawUsage));

    const material = makeBinaryPointMaterial(this.glyphAtlas, this.palette, true);
    const points = new THREE.Points(geometry, material);
    points.frustumCulled = false;
    points.renderOrder = 11;
    this.scene.add(points);

    return {
      points,
      geometry,
      material,
      positions,
      seeds,
      sizes,
      life,
      velocities: Array.from({ length: count }, () => new THREE.Vector3()),
      cursor: 0,
      emitTimer: 0,
      emitterExtents: new THREE.Vector3(0.05, 0.08, 0.12)
    };
  }

  buildVoidVisual() {
    const group = new THREE.Group();
    group.visible = false;
    this.orbitRoot.add(group);

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
      radius[i] = Math.pow(1.0 - t, 0.5) * this.cfg.voidRadius;
      angle[i] = Math.random() * Math.PI * 2;
      depth[i] = -t * this.cfg.voidDepth;
      positions[i * 3 + 0] = Math.cos(angle[i]) * radius[i];
      positions[i * 3 + 1] = Math.sin(angle[i]) * radius[i];
      positions[i * 3 + 2] = depth[i];
      seeds[i] = Math.random();
      sizes[i] = 0.7 + Math.random() * 1.2;
      life[i] = 0.65 + Math.random() * 0.35;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));
    geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
    geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute("aLife", new THREE.BufferAttribute(life, 1));

    const material = makeBinaryPointMaterial(this.glyphAtlas, this.palette, true);
    const points = new THREE.Points(geometry, material);
    points.frustumCulled = false;
    points.renderOrder = 12;
    group.add(points);

    const disc = new THREE.Mesh(
      new THREE.CircleGeometry(this.cfg.voidRadius * 0.24, 40),
      new THREE.MeshBasicMaterial({
        color: 0x000000,
        transparent: true,
        opacity: 0.95,
        depthWrite: false
      })
    );
    disc.position.z = -this.cfg.voidDepth - 0.01;
    group.add(disc);

    return {
      group,
      geometry,
      material,
      points,
      positions,
      radius,
      angle,
      depth,
      disc
    };
  }

  createNest(data) {
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({
        map: this.messTexture,
        transparent: true,
        opacity: 0.88,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false
      })
    );

    mesh.renderOrder = 9;
    this.nestGroup.add(mesh);

    const nest = {
      mesh,
      coverIndex: data.coverIndex,
      u: data.u,
      v: data.v,
      rot: data.rot,
      scale: data.scale
    };

    this.nests.push(nest);
    if (this.nests.length > this.cfg.nestMax) {
      const oldest = this.nests.shift();
      if (oldest?.mesh?.parent) oldest.mesh.parent.remove(oldest.mesh);
    }

    return nest;
  }

  restoreNests() {
    if (!Array.isArray(this.pendingNestState) || !this.pendingNestState.length) return;
    for (const data of this.pendingNestState.slice(0, this.cfg.nestMax)) {
      this.createNest(data);
    }
    this.pendingNestState = null;
  }

  dropNestOnCover(coverIndex) {
    if (coverIndex < 0) return;
    if (Math.random() > this.cfg.nestChancePerLanding) return;

    const data = {
      coverIndex,
      u: randomInRange(-0.22, 0.22),
      v: randomInRange(-0.12, 0.12),
      rot: randomInRange(-Math.PI, Math.PI),
      scale: randomInRange(this.cfg.nestScaleMin, this.cfg.nestScaleMax)
    };

    this.createNest(data);
    this.saveState(true);
    this.log("binary nest deposited", "INFO");
  }

  updateNests(coverWorldData) {
    const halfW = this.coverSize.width * 0.5;
    const halfH = this.coverSize.height * 0.5;
    const camDir = this.temp.vecA;

    for (const nest of this.nests) {
      const data = coverWorldData?.[nest.coverIndex];
      if (!data || !data.visible) {
        nest.mesh.visible = false;
        continue;
      }

      nest.mesh.visible = true;

      const normal = this.temp.vecB.copy(data.right).cross(data.up).normalize();
      camDir.copy(this.camera.position).sub(data.position);
      if (normal.dot(camDir) < 0) normal.multiplyScalar(-1);

      const pos = this.temp.vecC
        .copy(data.position)
        .addScaledVector(data.right, nest.u * halfW * 2.0)
        .addScaledVector(data.up, nest.v * halfH * 2.0)
        .addScaledVector(normal, 0.01);

      nest.mesh.position.copy(pos);
      nest.mesh.scale.setScalar(nest.scale);
      makeLookQuaternion(pos, pos.clone().add(normal), data.up, nest.mesh.quaternion);
      nest.mesh.rotateZ(nest.rot);
    }
  }

  loadMoth() {
    const src = this.assets?.modelFBX || "./assets/models/moth/moth.fbx";

    this.loader.load(
      src,
      (fbx) => {
        this.moth = fbx;
        this.modelHolder.add(fbx);

        fbx.traverse((child) => {
          if (!child.isMesh) return;
          child.castShadow = true;
          child.receiveShadow = false;

          if (child.material) {
            child.material = child.material.clone();
            child.material.transparent = true;
            child.material.opacity = 0.92;
            child.material.depthWrite = true;
            child.material.emissive = child.material.emissive || new THREE.Color(0x000000);
            child.material.emissiveIntensity = 0.55;
            child.material.emissive.set("#16384d");
          }
        });

        this.temp.box.setFromObject(fbx);
        const mothSize = this.temp.box.getSize(new THREE.Vector3());
        const mothCenter = this.temp.box.getCenter(new THREE.Vector3());

        fbx.position.sub(mothCenter);

        let targetHeight = 0.34;
        if (this.centralModel) {
          const modelBox = new THREE.Box3().setFromObject(this.centralModel);
          const modelSize = modelBox.getSize(new THREE.Vector3());
          targetHeight = modelSize.y * this.cfg.sizeRatioToModelHeight;
        }

        const mothHeight = Math.max(0.0001, mothSize.y || 1);
        const scale = targetHeight / mothHeight;
        fbx.scale.setScalar(scale);

        this.temp.box.setFromObject(fbx);
        this.fitShellToBounds(this.temp.box);

        const scaledSize = this.temp.box.getSize(new THREE.Vector3());
        this.trail.emitterExtents.set(
          Math.max(0.03, scaledSize.x * 0.55),
          Math.max(0.03, scaledSize.y * 0.55),
          Math.max(0.03, scaledSize.z * 0.55)
        );

        const proxyR = Math.max(scaledSize.x, scaledSize.y, scaledSize.z) * 0.55;
        this.hitProxy.geometry.dispose();
        this.hitProxy.geometry = new THREE.SphereGeometry(Math.max(0.06, proxyR), 16, 16);

        this.modelHolder.rotation.set(
          this.cfg.modelPitchOffset,
          this.cfg.modelYawOffset,
          this.cfg.modelRollOffset
        );

        this.setupAnimationMixer(fbx.animations || []);
        this.restoreNests();

        this.ready = true;
        this.playLoop(this.vitality < this.cfg.sadThreshold ? "flySad" : "fly");
        this.log("moth loaded from single FBX", "OK");
      },
      undefined,
      () => {
        this.createFallbackMoth();
        this.ready = true;
        this.log("moth FBX failed, using fallback moth", "WARN");
      }
    );
  }

  createFallbackMoth() {
    const g = new THREE.Group();

    const body = new THREE.Mesh(
      new THREE.SphereGeometry(0.06, 12, 12),
      new THREE.MeshStandardMaterial({
        color: 0x666a77,
        emissive: 0x18384a,
        roughness: 0.7,
        metalness: 0.05
      })
    );
    g.add(body);

    const wingMat = new THREE.MeshStandardMaterial({
      color: 0x545863,
      emissive: 0x16384d,
      emissiveIntensity: 0.45,
      roughness: 0.78,
      metalness: 0.02,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide
    });

    const wingGeo = new THREE.PlaneGeometry(0.22, 0.34, 1, 1);
    const left = new THREE.Mesh(wingGeo, wingMat.clone());
    const right = new THREE.Mesh(wingGeo, wingMat.clone());

    left.position.set(-0.09, 0.02, 0);
    right.position.set(0.09, 0.02, 0);
    left.rotation.y = Math.PI * 0.5;
    right.rotation.y = -Math.PI * 0.5;

    g.add(left, right);
    this.modelHolder.add(g);

    this.fallbackWings = [left, right];
    this.moth = g;

    const box = new THREE.Box3().setFromObject(g);
    this.fitShellToBounds(box);

    const size = box.getSize(new THREE.Vector3());
    this.trail.emitterExtents.set(
      Math.max(0.03, size.x * 0.7),
      Math.max(0.03, size.y * 0.7),
      Math.max(0.03, size.z * 0.7)
    );
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
        const direct = normalized.get(alias);
        if (direct) return direct;
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
        const loopKey = this.pendingLoopActionKey;
        this.pendingLoopActionKey = "";
        this.playLoop(loopKey);
      }
    });
  }

  getAction(key) {
    return this.actions[key] || null;
  }

  stopAllActions() {
    if (!this.mixer) return;
    for (const action of Object.values(this.actions)) {
      action.stop();
    }
    this.currentAction = null;
    this.currentActionKey = "";
  }

  playLoop(key, fade = 0.2) {
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

  playOnce(key, fallbackKey = "fly", fade = 0.14) {
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

  performBackflip() {
    this.flipBusy = true;
    this.perched = false;
    this.mode = "patrol";
    this.hoveredCoverIndex = -1;
    this.root.position.y += this.cfg.clickEvadeLift * 0.18;
    this.velocity.add(this.forward.clone().multiplyScalar(-this.cfg.clickEvadePush));
    this.pickNextPatrolPoint();

    if (!this.playOnce("backflip", this.vitality < this.cfg.sadThreshold ? "flySad" : "fly")) {
      this.flipBusy = false;
      this.playLoop(this.vitality < this.cfg.sadThreshold ? "flySad" : "fly");
    }

    this.log("specter moth startled :: backflip", "WARN");
  }

  pickNextPatrolPoint(seedOnly = false) {
    this.patrolTheta += randomInRange(0.55, 1.4);
    const radius = randomInRange(this.cfg.patrolRadiusMin, this.cfg.patrolRadiusMax);
    const y = randomInRange(this.cfg.patrolHeightMin, this.cfg.patrolHeightMax);

    this.patrolPoint.set(
      this.orbitCenter.x + Math.cos(this.patrolTheta) * radius,
      this.orbitCenter.y + y,
      this.orbitCenter.z + Math.sin(this.patrolTheta) * radius
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

      if (hoveredIndex >= 0) {
        this.log(`cover hover detected :: ${hoveredIndex}`, "INFO");
      }
    }

    if (hoveredIndex < 0) return false;
    const data = coverWorldData?.[hoveredIndex];
    if (!data || !data.visible) return false;

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
      speed = this.cfg.flySpeed;
    }

    this.targetPoint.copy(target);

    const toTarget = this.temp.vecC.copy(target).sub(this.root.position);
    const distance = toTarget.length();

    if (this.mode === "patrol" && distance < 0.14) {
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
      this.root.position.lerp(this.currentCoverPoint, 1.0 - Math.exp(-delta * 8.0));
      this.velocity.multiplyScalar(0.7);

      const lookPoint = this.temp.vecD.copy(this.currentCoverPoint).add(this.currentCoverNormal);
      makeLookQuaternion(this.root.position, lookPoint, this.currentCoverUp, this.temp.quatA);
      this.root.quaternion.slerp(this.temp.quatA, 1.0 - Math.exp(-delta * 10.0));

      if (this.hoveredCoverIndex < 0) {
        this.perched = false;
        this.mode = this.voidState.active ? "toVoid" : "patrol";
        this.root.position.y += this.cfg.coverTakeoffLift;
        this.playOnce("takeoff", this.vitality < this.cfg.sadThreshold ? "flySad" : "fly");
      }

      return;
    }

    if (this.mode === "feeding") {
      this.velocity.multiplyScalar(0.82);
      this.root.position.lerp(this.voidState.position, 1.0 - Math.exp(-delta * 9.5));

      const lookPoint = this.temp.vecD.copy(this.voidState.position).add(new THREE.Vector3(0, 0, -0.2));
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

  updateAnimationState(delta, audioReactiveLevel = 0) {
    if (!this.ready) return;

    if (!this.mixer && this.fallbackWings.length) {
      const flapBase = this.mode === "feeding" ? 9.8 : this.vitality < this.cfg.sadThreshold ? 4.8 : 7.0;
      const flapAmp = this.mode === "perched" ? 0.08 : this.vitality < this.cfg.sadThreshold ? 0.26 : 0.46;
      const t = this.getElapsed();

      if (this.fallbackWings[0]) this.fallbackWings[0].rotation.z = Math.sin(t * flapBase) * flapAmp + 0.18;
      if (this.fallbackWings[1]) this.fallbackWings[1].rotation.z = -Math.sin(t * flapBase) * flapAmp - 0.18;
    }

    if (!this.mixer) return;

    if (this.flipBusy) {
      this.mixer.update(delta);
      return;
    }

    let desired = this.vitality < this.cfg.sadThreshold ? "flySad" : "fly";

    if (this.mode === "perched") {
      desired = this.getAction("perch") ? "perch" : desired;
    } else if (this.mode === "toCover") {
      desired = this.getAction("land") ? "land" : desired;
    } else if (this.mode === "feeding" || this.mode === "toVoid") {
      desired = this.getAction("feed") ? "feed" : desired;
    }

    this.playLoop(desired);
    this.mixer.update(delta);
  }

  updateVitals(delta, interactionBoost = 0) {
    const feeding = this.mode === "feeding" || this.mode === "perched";
    if (feeding) {
      this.vitality = clamp01(this.vitality + this.cfg.vitalityRecoveryPerSecond * delta * (1.0 + interactionBoost));
    } else {
      this.vitality = clamp01(this.vitality - this.cfg.vitalityDrainPerSecond * delta);
    }

    if (this.mode === "feeding" && this.voidState.active) {
      this.voidState.energy = Math.max(0, this.voidState.energy - this.cfg.voidConsumeRate * delta);
      this.vitality = clamp01(this.vitality + this.cfg.vitalityRecoveryPerSecond * delta * 1.25);

      if (this.voidState.energy <= 0.001) {
        this.clearVoid();
        this.mode = this.hoveredCoverIndex >= 0 ? "toCover" : "patrol";
        this.pickNextPatrolPoint();
        this.log("binary void consumed", "OK");
      }
    }

    if (this.mode === "perched" && this.hoveredCoverIndex >= 0) {
      const elapsed = this.getElapsed();
      if (elapsed - this.lastNestDropAt >= this.cfg.nestDepositDelay) {
        this.lastNestDropAt = elapsed;
        this.dropNestOnCover(this.hoveredCoverIndex);
      }
    }

    if (this.mode === "feeding") {
      this.stateName = "Feeding";
    } else if (this.vitality < this.cfg.sadThreshold) {
      this.stateName = "Dying";
    } else if (this.mode === "toCover" || this.mode === "perched" || this.mode === "toVoid") {
      this.stateName = "Curious";
    } else if (this.voidState.active && this.voidState.energy > this.cfg.swarmThreshold) {
      this.stateName = "Swarming";
    } else {
      this.stateName = "Hiding";
    }
  }

  updateShell(elapsed) {
    this.shell.material.uniforms.uTime.value = elapsed;
    this.shell.material.uniforms.uAlpha.value =
      0.45 +
      (this.mode === "feeding" ? 0.55 : 0.22) +
      (this.vitality < this.cfg.sadThreshold ? 0.08 : 0.18);
  }

  emitTrailParticle() {
    const i = this.trail.cursor;
    this.trail.cursor = (this.trail.cursor + 1) % this.cfg.trailCount;

    const ext = this.trail.emitterExtents;
    const local = this.temp.vecA.set(
      (Math.random() - 0.5) * ext.x * 2.0,
      (Math.random() - 0.5) * ext.y * 2.0,
      (Math.random() - 0.5) * ext.z * 2.0
    );

    local.applyQuaternion(this.root.quaternion);
    const worldPos = this.temp.vecB.copy(this.root.position).add(local);

    const baseIndex = i * 3;
    this.trail.positions[baseIndex + 0] = worldPos.x;
    this.trail.positions[baseIndex + 1] = worldPos.y;
    this.trail.positions[baseIndex + 2] = worldPos.z;
    this.trail.life[i] = this.cfg.trailLife;

    const vel = this.trail.velocities[i];
    vel.copy(this.forward)
      .multiplyScalar(-this.velocity.length() * this.cfg.trailSpeedFactor - 0.12)
      .add(
        this.temp.vecC.set(
          (Math.random() - 0.5) * this.cfg.trailVelocityJitter,
          (Math.random() - 0.5) * this.cfg.trailVelocityJitter,
          (Math.random() - 0.5) * this.cfg.trailVelocityJitter
        )
      );
  }

  updateTrail(delta, elapsed) {
    this.trail.material.uniforms.uTime.value = elapsed;
    this.trail.material.uniforms.uAlpha.value =
      this.cfg.trailAlpha *
      (this.mode === "feeding" ? 1.18 : this.vitality < this.cfg.sadThreshold ? 0.64 : 0.94);

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
    this.voidVisual.material.uniforms.uTime.value = elapsed;
    if (!this.voidState.active) {
      this.voidVisual.group.visible = false;
      return;
    }

    this.voidVisual.group.visible = true;
    this.voidVisual.group.position.copy(this.voidState.position);
    this.voidVisual.group.quaternion.copy(this.camera.quaternion);

    const positions = this.voidVisual.positions;
    const energy = Math.max(0.12, this.voidState.energy);

    for (let i = 0; i < this.cfg.voidParticleCount; i += 1) {
      this.voidVisual.angle[i] += delta * (1.0 + i * 0.0006) * (0.7 + energy * 0.55);
      const collapse = 1.0 - smootherstep(1.0 - clamp01(energy / 1.35));
      const r = this.voidVisual.radius[i] * (0.92 + Math.sin(elapsed * 1.6 + i * 0.13) * 0.05) * (0.9 + collapse * 0.22);
      const d = this.voidVisual.depth[i];

      const base = i * 3;
      positions[base + 0] = Math.cos(this.voidVisual.angle[i]) * r;
      positions[base + 1] = Math.sin(this.voidVisual.angle[i]) * r;
      positions[base + 2] = d + Math.sin(elapsed * 3.0 + i * 0.21) * 0.02;
    }

    this.voidVisual.geometry.attributes.position.needsUpdate = true;
    this.voidVisual.material.uniforms.uAlpha.value = 0.75 + energy * 0.18;
    this.voidVisual.disc.scale.setScalar(0.92 + Math.sin(elapsed * 2.3) * 0.04 + energy * 0.05);
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
    if (local.length() > this.cfg.voidSpawnRadius) {
      local.setLength(this.cfg.voidSpawnRadius);
    }

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
    const audioReactiveLevel = params.audioReactiveLevel || 0;

    this.hoveredCoverIndex = hoveredIndex;

    this.updateMovement(delta, coverWorldData);
    this.updateVitals(delta, audioReactiveLevel);
    this.updateAnimationState(delta, audioReactiveLevel);
    this.updateShell(elapsed);
    this.updateTrail(delta, elapsed);
    this.updateVoidVisual(delta, elapsed);
    this.updateNests(coverWorldData);
    this.saveState(false);

    if (this.hitProxy) {
      this.hitProxy.position.set(0, 0, 0);
      this.hitProxy.visible = false;
    }
  }

  dispose() {
    this.saveState(true);

    if (this.mixer) {
      this.mixer.stopAllAction();
      this.mixer = null;
    }

    if (this.shell?.points?.parent) this.shell.points.parent.remove(this.shell.points);
    if (this.trail?.points?.parent) this.trail.points.parent.remove(this.trail.points);
    if (this.voidVisual?.group?.parent) this.voidVisual.group.parent.remove(this.voidVisual.group);
    if (this.nestGroup?.parent) this.nestGroup.parent.remove(this.nestGroup);
    if (this.root?.parent) this.root.parent.remove(this.root);
  }
}
