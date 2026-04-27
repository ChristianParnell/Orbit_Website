import * as THREE from "https://esm.sh/three@0.160.0";
import { FBXLoader } from "https://esm.sh/three@0.160.0/examples/jsm/loaders/FBXLoader.js";
import {
  DEFAULT_MOTH_PALETTE,
  MOOD_PALETTES,
  buildAccentPalette,
  clamp01,
  clonePalette,
  collectMeshes,
  disposeObject3D,
  ensurePalette,
  estimateBounds,
  lerpPalette,
  makeId,
  randRange,
  randomPointInView,
  safeNumber,
  setPaletteUniforms,
  smoothStep,
  toColor,
  vectorFromObject
} from "./moth-utils.js";
import {
  createBinaryGlyphAtlas,
  createMothPointMaterial,
  createTrailMaterial,
  createVoidMaterial,
  updateMaterialPalette
} from "./moth-shaders.js";
import { MothAnimationController } from "./moth-animation.js";
import { MothDebugConsole } from "./moth-debug-console.js";

const DEFAULT_CONFIG = {
  storageKey: "orbitSpecterMothV6_modular",
  stateSaveInterval: 3.0,
  autoUpdate: true,
  pointLimit: 1450,
  outlinePointLimit: 980,
  sizeRatioToModelHeight: 0.096,
  minWorldHeight: 0.28,
  modelYawOffset: -Math.PI / 2,
  modelPitchOffset: 0,
  modelRollOffset: 0,
  modelBaseOpacity: 0.0,
  shellMotionStrength: 1.35,
  shellPointSizeMin: 0.48,
  shellPointSizeMax: 0.96,
  shellPointAlphaMin: 0.36,
  shellPointAlphaMax: 0.84,
  binaryBrightness: 2.95,
  outlineBrightness: 3.55,
  outlineExpand: 0.026,
  outlinePointSizeMin: 0.90,
  outlinePointSizeMax: 1.72,
  outlineAlpha: 1.0,
  paletteLerp: 0.085,
  trailCount: 220,
  trailEmitInterval: 0.018,
  trailLife: 0.90,
  trailDrag: 2.0,
  trailJitter: 0.08,
  trailPointSizeMin: 0.72,
  trailPointSizeMax: 1.46,
  trailAlpha: 0.88,
  patrolRadiusMin: 1.9,
  patrolRadiusMax: 3.7,
  patrolRadiusBoost: 1.72,
  patrolHeightMin: -0.20,
  patrolHeightMax: 1.75,
  patrolHeightBoost: 1.55,
  patrolFrontMin: 0.62,
  patrolFrontMax: 1.85,
  patrolSideSpan: 2.55,
  patrolRepickMin: 1.6,
  patrolRepickMax: 3.2,
  patrolCenterPull: 0.08,
  flySpeed: 1.62,
  diveSpeed: 2.15,
  flySadSpeedScale: 0.60,
  approachSlowRadius: 0.46,
  turnLerp: 0.18,
  turnLerpFast: 0.30,
  hoverPerchDelay: 0.16,
  landTriggerDistance: 0.30,
  coverPerchLift: 0.045,
  coverPerchForward: 0.08,
  coverPerchVerticalRatio: 0.14,
  coverPerchLerp: 0.20,
  takeoffRiseHeight: 0.24,
  voidSpawnRadius: 2.40,
  voidHeightMin: -0.65,
  voidHeightMax: 1.95,
  voidConsumeDistance: 0.24,
  voidInspectDuration: 3.8,
  voidParticleCount: 340,
  voidDepth: 0.92,
  satiatedDuration: 8.0,
  vitalityDrainPerSecond: 0.0016,
  vitalityRecoveryPerSecond: 0.010,
  offlineDrainPerHour: 0.035,
  sadThreshold: 0.30,
  signalDecayPerSecond: 0.072,
  signalHoverBoost: 0.38,
  signalPointerBoost: 0.10,
  signalWheelBoost: 0.08,
  fatigueFlightPerSecond: 0.018,
  fatigueStimulusPerSecond: 0.052,
  fatigueRestRecoveryPerSecond: 0.16,
  trustGainPerSecond: 0.05,
  trustLossPerSecond: 0.10,
  corruptionGainPerSecond: 0.08,
  corruptionRestRecoveryPerSecond: 0.11,
  aggressivePointerSpeed: 1.10,
  aggressiveWheelThreshold: 620,
  nestMax: 5,
  nestChancePerPerch: 0.18,
  nestDepositDelay: 6.5,
  homePerchBoneName: "PerchBone",
  homePerchOffset: { x: 0, y: 0, z: 0 },
  pagePreferences: {},
  coverAccentColors: ["#2fe4ff", "#b04dff", "#33ff88", "#ff57ce", "#ff8b2d", "#ffe166", "#4b7dff"],
  debugOverlay: true,
  debugCollapsed: false,
  debugSnapshotInterval: 0.12,
  trailSpeed: 0.18,
  hungrySignalThreshold: 0.22,
  hungryVitalityThreshold: 0.38,
  fedVitalityThreshold: 0.68,
  overwhelmedFatigueThreshold: 0.82,
  overwhelmedCorruptionThreshold: 0.68,
  safeTrustThreshold: 0.56,
  safeFatigueThreshold: 0.42,
  hungryJitterStrength: 0.085,
  overwhelmedJerkStrength: 0.18,
  fedOrbitRadius: 0.38,
  fedOrbitSpeed: 1.15,
  shelterSearchInterval: 5.0,
  shelterHeightBoost: 0.58,
  fragmentChargePerHoverSecond: 0.028,
  fragmentChargePerVoid: 0.65,
  fragmentDepositCost: 0.34,
  uiResidueClassName: "moth-nested"
};

const WORLD_UP = new THREE.Vector3(0, 1, 0);
const NEG_Z = new THREE.Vector3(0, 0, -1);
const _tmpMat = new THREE.Matrix4();
const _tmpQuat = new THREE.Quaternion();
const _tmpScale = new THREE.Vector3();
const _tmpPos = new THREE.Vector3();
const _tmpDir = new THREE.Vector3();

export class MothSystem {
  constructor(options = {}) {
    this.options = options;
    this.scene = options.scene;
    this.camera = options.camera;
    this.renderer = options.renderer;
    this.orbitRoot = options.orbitRoot || options.scene;
    this.centralModel = options.centralModel || null;
    this.assets = options.assets || {};
    this.cfg = { ...DEFAULT_CONFIG, ...(options.config || {}) };
    this.coverSize = options.coverSize || { width: 0.84, height: 0.50 };
    this.orbitCenter = options.orbitCenter ? options.orbitCenter.clone() : new THREE.Vector3(0, 0, 0);
    this.getElapsed = typeof options.getElapsed === "function" ? options.getElapsed : () => performance.now() / 1000;
    this.debug = typeof options.debug === "function" ? options.debug : null;
    this.debugPanel = this.cfg.debugOverlay === false ? null : new MothDebugConsole({
      title: "SPECTER MOTH // NEEDS + WANTS",
      maxEvents: 14,
      collapsed: Boolean(this.cfg.debugCollapsed)
    });

    this.paletteBase = ensurePalette(options.palette || DEFAULT_MOTH_PALETTE);
    this.currentPalette = clonePalette(this.paletteBase);
    this.targetPalette = clonePalette(this.paletteBase);
    this.sadPalette = ensurePalette(this.cfg.sadPaletteHex || MOOD_PALETTES.sad);
    this.voidPalette = ensurePalette(this.cfg.corruptedPaletteHex || MOOD_PALETTES.void);
    this.homePalette = ensurePalette(this.cfg.homePaletteHex || MOOD_PALETTES.home);
    this.cursorPalette = ensurePalette(this.cfg.cursorPaletteHex || MOOD_PALETTES.cursor);
    this.coverAccentPalettes = Array.isArray(this.cfg.coverAccentColors)
      ? this.cfg.coverAccentColors.map((value) => buildAccentPalette(value))
      : [];

    this.glyphAtlas = options.glyphAtlas || createBinaryGlyphAtlas();
    this.loader = new FBXLoader();

    this.root = new THREE.Group();
    this.root.name = "SpecterMothRoot";
    this.visualRoot = new THREE.Group();
    this.visualRoot.name = "SpecterMothVisualRoot";
    this.root.add(this.visualRoot);
    this.scene?.add(this.root);

    this.modelRoot = null;
    this.animation = null;
    this.binaryShell = null;
    this.outlineShell = null;
    this.binaryGeometry = null;
    this.outlineGeometry = null;
    this.binaryMaterial = null;
    this.outlineMaterial = null;
    this.hitProxy = null;

    this.coverTargets = [];
    this.coverScanAt = -Infinity;
    this.hoverTarget = null;
    this.hoverClock = 0;
    this.currentPerchTarget = null;
    this.lastPerchDropAt = -Infinity;
    this.hasLandedOnCurrentTarget = false;

    this.trail = this.createTrailSystem();
    this.voidGroup = new THREE.Group();
    this.voidGroup.name = "MothVoidGroup";
    this.scene?.add(this.voidGroup);
    this.voidState = null;
    this.voidPoints = null;
    this.voidMaterial = null;
    this.voidCore = null;

    this.nestGroup = new THREE.Group();
    this.nestGroup.name = "MothResidueNestGroup";
    this.scene?.add(this.nestGroup);
    this.nests = [];

    this.saved = this.loadSavedState();
    this.vitality = clamp01(this.saved.vitality ?? 0.78);
    this.signalLevel = clamp01(this.saved.signalLevel ?? 0.44);
    this.fatigue = clamp01(this.saved.fatigue ?? 0.18);
    this.trust = clamp01(this.saved.trust ?? 0.46);
    this.corruption = clamp01(this.saved.corruption ?? 0.08);
    this.fragmentCharge = safeNumber(Number(this.saved.fragmentCharge), 0);
    this.lastSaveAt = 0;
    this.applyOfflineDecay();
    this.restoreNests();

    this.ready = false;
    this.disposed = false;
    this.mode = "loading";
    this.mood = "booting";
    this.lastMood = "booting";
    this.behaviour = "loading model";
    this.visible = true;
    this.perched = false;
    this.satiatedUntil = 0;
    this.nextShelterSearchAt = 0;
    this.shelterTarget = null;
    this.lastDebugSnapshotAt = -Infinity;
    this.lastMoodLogAt = -Infinity;
    this.visualProfile = this.getVisualProfile("booting");
    this.target = this.orbitCenter.clone().add(new THREE.Vector3(0.4, 0.95, 0.9));
    this.velocity = new THREE.Vector3();
    this.forward = new THREE.Vector3(0, 0, -1);
    this.smoothedHeading = new THREE.Vector3(0, 0, -1);
    this.lastRootPosition = this.root.position.clone();
    this.nextPatrolDecisionAt = 0;
    this.lastTrailEmitAt = 0;
    this.lastExternalUpdateAt = -Infinity;
    this.lastAutoUpdateAt = performance.now();
    this.pointerState = {
      ndc: new THREE.Vector2(-10, -10),
      lastX: null,
      lastY: null,
      speed: 0,
      lastMoveAt: 0,
      wheelImpulse: 0
    };

    this.temp = {
      a: new THREE.Vector3(),
      b: new THREE.Vector3(),
      c: new THREE.Vector3(),
      d: new THREE.Vector3(),
      q: new THREE.Quaternion(),
      q2: new THREE.Quaternion(),
      raycaster: new THREE.Raycaster(),
      pointer: new THREE.Vector2(),
      plane: new THREE.Plane(new THREE.Vector3(0, 1, 0), -this.orbitCenter.y),
      bbox: new THREE.Box3(),
      size: new THREE.Vector3(),
      center: new THREE.Vector3()
    };

    this.root.position.copy(this.target);
    this.setupInteractionSensing();
    this.createVoidVisuals();
    this.load();
    if (this.cfg.autoUpdate !== false) this.startAutoUpdate();
  }

  log(message, level = "MOTH") {
    this.debugPanel?.push(message, level);
    if (this.debug) this.debug(message, level);
  }

  setMode(nextMode, reason = "") {
    if (this.mode === nextMode) return;
    const previous = this.mode;
    this.mode = nextMode;
    this.log(`${previous} → ${nextMode}${reason ? ` :: ${reason}` : ""}`, "STATE");
  }

  setMood(nextMood, reason = "") {
    if (this.mood === nextMood) return;
    const previous = this.mood;
    this.lastMood = previous;
    this.mood = nextMood;
    this.visualProfile = this.getVisualProfile(nextMood);
    this.log(`${previous} → ${nextMood}${reason ? ` :: ${reason}` : ""}`, "MOOD");
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
      localStorage.setItem(this.cfg.storageKey, JSON.stringify({
        vitality: this.vitality,
        signalLevel: this.signalLevel,
        fatigue: this.fatigue,
        trust: this.trust,
        corruption: this.corruption,
        fragmentCharge: this.fragmentCharge,
        lastVisit: Date.now(),
        nests: this.nests.map((nest) => ({
          id: nest.id,
          x: nest.position.x,
          y: nest.position.y,
          z: nest.position.z,
          scale: nest.scale.x,
          color: nest.userData?.color || "#2fe4ff"
        }))
      }));
    } catch {
      // localStorage may be blocked on some browsers; ignore safely.
    }
  }

  applyOfflineDecay() {
    const lastVisit = Number(this.saved.lastVisit || 0);
    if (!lastVisit) return;
    const hours = Math.max(0, (Date.now() - lastVisit) / 3600000);
    if (hours < 0.1) return;
    this.vitality = clamp01(this.vitality - hours * this.cfg.offlineDrainPerHour);
    this.signalLevel = clamp01(this.signalLevel - hours * this.cfg.offlineDrainPerHour * 0.7);
    this.fatigue = clamp01(this.fatigue + hours * 0.025);
    this.corruption = clamp01(this.corruption + hours * 0.012);
  }

  restoreNests() {
    const saved = Array.isArray(this.saved.nests) ? this.saved.nests : [];
    saved.slice(0, this.cfg.nestMax).forEach((nest) => {
      this.spawnNestAt(new THREE.Vector3(nest.x || 0, nest.y || 0, nest.z || 0), nest.scale || 0.12, nest.color || "#2fe4ff", nest.id);
    });
  }

  async load() {
    try {
      const path = this.assets.modelFBX || this.assets.modelGLB || this.assets.modelGLTF || "./assets/models/moth/moth.fbx";
      const loaded = await this.loadFbx(path);
      this.setupModel(loaded, loaded.animations || []);
      this.log("modular moth online", "MOTH");
    } catch (error) {
      console.warn("[MOTH] Asset failed; using fallback moth.", error);
      this.log("moth asset failed; fallback visible", "WARN");
      this.setupModel(this.createFallbackMoth(), []);
    }
  }

  loadFbx(path) {
    return new Promise((resolve, reject) => {
      this.loader.load(path, resolve, undefined, reject);
    });
  }

  createFallbackMoth() {
    const group = new THREE.Group();
    group.name = "FallbackBinaryMoth";
    const hiddenMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.0, depthWrite: false });
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.035, 0.18, 6, 12), hiddenMat.clone());
    body.rotation.x = Math.PI / 2;
    const wingGeo = new THREE.PlaneGeometry(0.28, 0.16, 8, 4);
    const leftWing = new THREE.Mesh(wingGeo, hiddenMat.clone());
    const rightWing = new THREE.Mesh(wingGeo.clone(), hiddenMat.clone());
    leftWing.position.set(-0.12, 0.02, 0.0);
    rightWing.position.set(0.12, 0.02, 0.0);
    leftWing.rotation.z = 0.28;
    rightWing.rotation.z = -0.28;
    group.add(body, leftWing, rightWing);
    return group;
  }

  setupModel(model, clips = []) {
    if (this.modelRoot) disposeObject3D(this.modelRoot);
    this.modelRoot = model;
    this.modelRoot.name = this.modelRoot.name || "MothModel";
    this.visualRoot.add(this.modelRoot);
    this.modelRoot.updateMatrixWorld(true);

    const modelBounds = estimateBounds(this.modelRoot);
    const center = modelBounds.center.clone();
    this.modelRoot.position.sub(center);

    const centralHeight = this.centralModel ? Math.max(estimateBounds(this.centralModel).size.y, 1) : 3.4;
    const targetHeight = Math.max(this.cfg.minWorldHeight, centralHeight * this.cfg.sizeRatioToModelHeight);
    const sourceHeight = Math.max(modelBounds.size.y, modelBounds.size.x, modelBounds.size.z, 0.001);
    const scale = targetHeight / sourceHeight;
    this.modelRoot.scale.setScalar(scale);
    this.modelRoot.rotation.set(0, 0, 0);

    this.modelRoot.traverse((child) => {
      if (!child.isMesh) return;
      child.frustumCulled = false;
      child.castShadow = false;
      child.receiveShadow = false;
      const materials = Array.isArray(child.material) ? child.material : child.material ? [child.material] : [];
      materials.forEach((mat) => {
        mat.transparent = true;
        mat.opacity = this.cfg.modelBaseOpacity;
        mat.depthWrite = false;
        mat.color?.set?.(0x050d12);
      });
      if (this.cfg.modelBaseOpacity <= 0.001) child.visible = false;
    });

    this.visualRoot.rotation.set(this.cfg.modelPitchOffset, this.cfg.modelYawOffset, this.cfg.modelRollOffset);
    this.animation = new MothAnimationController(this.modelRoot, clips, { log: (msg, level) => this.log(msg, level), fade: 0.22 });
    this.animation.playFlight({ elapsed: this.getElapsed(), sad: false });

    this.rebuildBinaryShells();
    this.createHitProxy(targetHeight);
    this.ready = true;
    this.setMode("patrol", "model ready");
    this.pickPatrolTarget(this.getElapsed(), true);
  }

  rebuildBinaryShells() {
    if (this.binaryShell) this.visualRoot.remove(this.binaryShell);
    if (this.outlineShell) this.visualRoot.remove(this.outlineShell);
    this.binaryGeometry?.dispose?.();
    this.outlineGeometry?.dispose?.();
    this.binaryMaterial?.dispose?.();
    this.outlineMaterial?.dispose?.();

    const baseSamples = this.sampleModelPoints(this.cfg.pointLimit, 0.0);
    const outlineSamples = this.sampleModelPoints(this.cfg.outlinePointLimit, this.cfg.outlineExpand);
    this.binarySamples = baseSamples;
    this.outlineSamples = outlineSamples;

    this.binaryGeometry = this.samplesToGeometry(baseSamples, false);
    this.outlineGeometry = this.samplesToGeometry(outlineSamples, true);
    this.binaryMaterial = createMothPointMaterial({
      atlas: this.glyphAtlas,
      palette: this.currentPalette,
      brightness: this.cfg.binaryBrightness,
      alpha: 1.0,
      pointScale: 1.0
    });
    this.outlineMaterial = createMothPointMaterial({
      atlas: this.glyphAtlas,
      palette: this.homePalette,
      brightness: this.cfg.outlineBrightness,
      alpha: this.cfg.outlineAlpha,
      pointScale: 1.2
    });
    this.binaryShell = new THREE.Points(this.binaryGeometry, this.binaryMaterial);
    this.outlineShell = new THREE.Points(this.outlineGeometry, this.outlineMaterial);
    this.binaryShell.name = "MothBinaryShell";
    this.outlineShell.name = "MothBinaryOutlineShell";
    this.binaryShell.frustumCulled = false;
    this.outlineShell.frustumCulled = false;
    this.visualRoot.add(this.outlineShell, this.binaryShell);
  }

  sampleModelPoints(limit, expand = 0) {
    const samples = [];
    if (!this.modelRoot) return samples;
    this.visualRoot.updateWorldMatrix(true, true);
    this.modelRoot.updateWorldMatrix(true, true);
    const invVisual = new THREE.Matrix4().copy(this.visualRoot.matrixWorld).invert();
    const meshes = collectMeshes(this.modelRoot);
    const box = new THREE.Box3().setFromObject(this.modelRoot);
    const centerWorld = new THREE.Vector3();
    box.getCenter(centerWorld);

    const vertices = [];
    meshes.forEach((mesh) => {
      const pos = mesh.geometry?.attributes?.position;
      if (!pos) return;
      const count = pos.count;
      const stride = Math.max(1, Math.floor(count / Math.max(8, Math.ceil(limit / Math.max(1, meshes.length)))));
      for (let i = 0; i < count; i += stride) {
        const local = new THREE.Vector3().fromBufferAttribute(pos, i);
        const world = local.clone().applyMatrix4(mesh.matrixWorld);
        const normal = world.clone().sub(centerWorld).normalize();
        if (normal.lengthSq() < 0.0001) normal.set(0, 1, 0);
        world.addScaledVector(normal, expand);
        const visualLocal = world.applyMatrix4(invVisual);
        vertices.push({ position: visualLocal, normal: normal.clone(), seed: Math.random() });
      }
    });

    if (!vertices.length) {
      for (let i = 0; i < limit; i += 1) {
        const a = Math.random() * Math.PI * 2;
        const r = Math.sqrt(Math.random()) * 0.18;
        const position = new THREE.Vector3(Math.cos(a) * r, (Math.random() - 0.5) * 0.12, Math.sin(a) * r);
        samples.push({ base: position, normal: position.clone().normalize(), seed: Math.random(), size: randRange(this.cfg.shellPointSizeMin, this.cfg.shellPointSizeMax), alpha: randRange(this.cfg.shellPointAlphaMin, this.cfg.shellPointAlphaMax), palette: Math.random() });
      }
      return samples;
    }

    for (let i = 0; i < limit; i += 1) {
      const vertex = vertices[Math.floor(Math.random() * vertices.length)];
      samples.push({
        base: vertex.position.clone(),
        normal: vertex.normal.clone(),
        seed: Math.random(),
        size: randRange(expand ? this.cfg.outlinePointSizeMin : this.cfg.shellPointSizeMin, expand ? this.cfg.outlinePointSizeMax : this.cfg.shellPointSizeMax),
        alpha: expand ? this.cfg.outlineAlpha : randRange(this.cfg.shellPointAlphaMin, this.cfg.shellPointAlphaMax),
        palette: Math.random()
      });
    }
    return samples;
  }

  samplesToGeometry(samples) {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(samples.length * 3);
    const seeds = new Float32Array(samples.length);
    const sizes = new Float32Array(samples.length);
    const alphas = new Float32Array(samples.length);
    const palettes = new Float32Array(samples.length);
    samples.forEach((sample, i) => {
      positions[i * 3] = sample.base.x;
      positions[i * 3 + 1] = sample.base.y;
      positions[i * 3 + 2] = sample.base.z;
      seeds[i] = sample.seed;
      sizes[i] = sample.size;
      alphas[i] = sample.alpha;
      palettes[i] = sample.palette;
    });
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
    geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute("aAlpha", new THREE.BufferAttribute(alphas, 1));
    geometry.setAttribute("aPalette", new THREE.BufferAttribute(palettes, 1));
    return geometry;
  }

  createHitProxy(height) {
    if (this.hitProxy) this.root.remove(this.hitProxy);
    const proxy = new THREE.Mesh(
      new THREE.SphereGeometry(Math.max(0.16, height * 0.72), 16, 12),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.0, depthWrite: false })
    );
    proxy.name = "MothHitProxy";
    proxy.userData.isMothHitProxy = true;
    this.root.add(proxy);
    this.hitProxy = proxy;
  }

  createTrailSystem() {
    const count = Math.max(12, this.cfg.trailCount || DEFAULT_CONFIG.trailCount);
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    const lifes = new Float32Array(count);
    const sizes = new Float32Array(count);
    const palettes = new Float32Array(count);
    const velocities = [];
    for (let i = 0; i < count; i += 1) {
      positions[i * 3] = 9999;
      positions[i * 3 + 1] = 9999;
      positions[i * 3 + 2] = 9999;
      seeds[i] = Math.random();
      lifes[i] = 0;
      sizes[i] = randRange(this.cfg.trailPointSizeMin, this.cfg.trailPointSizeMax);
      palettes[i] = Math.random();
      velocities.push(new THREE.Vector3());
    }
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
    geometry.setAttribute("aLife", new THREE.BufferAttribute(lifes, 1));
    geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute("aPalette", new THREE.BufferAttribute(palettes, 1));
    const material = createTrailMaterial({ atlas: this.glyphAtlas, palette: this.currentPalette, alpha: this.cfg.trailAlpha });
    const points = new THREE.Points(geometry, material);
    points.name = "MothBinaryTrail";
    points.frustumCulled = false;
    this.scene?.add(points);
    return { points, geometry, material, positions, lifes, velocities, cursor: 0, count };
  }

  createVoidVisuals() {
    const count = Math.max(32, this.cfg.voidParticleCount || DEFAULT_CONFIG.voidParticleCount);
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    const tValues = new Float32Array(count);
    const sizes = new Float32Array(count);
    for (let i = 0; i < count; i += 1) {
      const t = i / Math.max(1, count - 1);
      const angle = t * Math.PI * 2 * 5.0 + Math.random() * 0.6;
      const radius = (1 - t) * 0.34 + Math.random() * 0.05;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = (Math.random() - 0.5) * this.cfg.voidDepth;
      positions[i * 3 + 2] = Math.sin(angle) * radius;
      seeds[i] = Math.random();
      tValues[i] = t;
      sizes[i] = randRange(1.2, 2.6);
    }
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
    geometry.setAttribute("aT", new THREE.BufferAttribute(tValues, 1));
    geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    this.voidMaterial = createVoidMaterial({ atlas: this.glyphAtlas, palette: this.voidPalette, alpha: 0.0 });
    this.voidPoints = new THREE.Points(geometry, this.voidMaterial);
    this.voidPoints.frustumCulled = false;
    this.voidCore = new THREE.Mesh(
      new THREE.CircleGeometry(0.26, 48),
      new THREE.MeshBasicMaterial({ color: 0x02040a, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide })
    );
    this.voidGroup.add(this.voidCore, this.voidPoints);
    this.voidGroup.visible = false;
  }

  setupInteractionSensing() {
    const dom = this.renderer?.domElement || window;
    this._onPointerMove = (event) => {
      const rect = this.renderer?.domElement?.getBoundingClientRect?.() || { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight };
      const x = event.clientX ?? 0;
      const y = event.clientY ?? 0;
      this.pointerState.ndc.set(((x - rect.left) / rect.width) * 2 - 1, -(((y - rect.top) / rect.height) * 2 - 1));
      const now = performance.now();
      if (this.pointerState.lastX !== null) {
        const dx = x - this.pointerState.lastX;
        const dy = y - this.pointerState.lastY;
        const dt = Math.max(16, now - this.pointerState.lastMoveAt) / 1000;
        this.pointerState.speed = THREE.MathUtils.lerp(this.pointerState.speed, Math.hypot(dx, dy) / dt / 1000, 0.35);
      }
      this.pointerState.lastX = x;
      this.pointerState.lastY = y;
      this.pointerState.lastMoveAt = now;
      this.signalLevel = clamp01(this.signalLevel + this.cfg.signalPointerBoost * 0.05);
    };
    this._onWheel = (event) => {
      this.pointerState.wheelImpulse = Math.max(this.pointerState.wheelImpulse, Math.abs(event.deltaY || 0));
      this.signalLevel = clamp01(this.signalLevel + this.cfg.signalWheelBoost);
    };
    this._onDoubleClick = (event) => {
      if (this.handleMothHit(event)) return;
      this.spawnVoidFromEvent(event);
    };
    dom.addEventListener?.("pointermove", this._onPointerMove, { passive: true });
    dom.addEventListener?.("wheel", this._onWheel, { passive: true });
    dom.addEventListener?.("dblclick", this._onDoubleClick);
  }

  startAutoUpdate() {
    const loop = (now) => {
      if (this.disposed) return;
      const dt = Math.min(0.05, Math.max(0.001, (now - this.lastAutoUpdateAt) / 1000));
      this.lastAutoUpdateAt = now;
      if (now - this.lastExternalUpdateAt > 120) {
        this.update(dt, { internalAuto: true });
      }
      this._raf = requestAnimationFrame(loop);
    };
    this._raf = requestAnimationFrame(loop);
  }

  setCoverEntries(entries = []) {
    this.coverTargets = entries.map((entry, index) => this.entryToCoverTarget(entry, index)).filter(Boolean);
  }

  setHoveredCover(entry) {
    this.hoverTarget = entry ? this.entryToCoverTarget(entry, this.coverTargets.length) : null;
  }

  setActiveCover(entry) {
    if (entry) this.signalLevel = clamp01(this.signalLevel + this.cfg.signalHoverBoost * 0.35);
  }

  setPanelOpen(open = false) {
    this.signalLevel = clamp01(this.signalLevel + (open ? 0.08 : 0.02));
  }

  setVisible(visible = true) {
    this.visible = Boolean(visible);
    this.root.visible = this.visible;
    if (this.trail?.points) this.trail.points.visible = this.visible;
  }

  registerPointerSignal(amount = 0.1) {
    this.signalLevel = clamp01(this.signalLevel + amount);
  }

  scanCoverTargets(force = false) {
    const elapsed = this.getElapsed();
    if (!force && elapsed - this.coverScanAt < 0.55 && this.coverTargets.length) return;
    this.coverScanAt = elapsed;
    const targets = [];
    const root = this.orbitRoot || this.scene;
    root?.traverse?.((child) => {
      if (!child?.isMesh || child.userData?.isMothHitProxy) return;
      if (child === this.hitProxy || child.name?.includes?.("Moth")) return;
      const mats = Array.isArray(child.material) ? child.material : child.material ? [child.material] : [];
      const looksLikeCover = mats.some((mat) => mat?.uniforms?.uHover || mat?.uniforms?.uBreach || mat?.uniforms?.uMap) || child.userData?.item || child.userData?.orbitItem;
      if (!looksLikeCover) return;
      const target = this.meshToCoverTarget(child, targets.length);
      if (target) targets.push(target);
    });
    if (targets.length) this.coverTargets = targets;
  }

  entryToCoverTarget(entry, index = 0) {
    if (!entry) return null;
    const mesh = entry.flag || entry.mesh || entry.object || entry.group?.children?.find?.((child) => child.isMesh);
    if (!mesh?.isObject3D) return null;
    const target = this.meshToCoverTarget(mesh, index);
    if (!target) return null;
    target.entry = entry;
    target.item = entry.item || mesh.userData?.item || null;
    return target;
  }

  meshToCoverTarget(mesh, index = 0) {
    const geometry = mesh.geometry;
    const params = geometry?.parameters || {};
    return {
      mesh,
      index,
      item: mesh.userData?.item || mesh.userData?.orbitItem || null,
      width: params.width || this.coverSize.width || 0.84,
      height: params.height || this.coverSize.height || 0.50,
      hover: 0,
      position: new THREE.Vector3(),
      normal: new THREE.Vector3(0, 0, 1),
      up: new THREE.Vector3(0, 1, 0),
      right: new THREE.Vector3(1, 0, 0)
    };
  }

  updateCoverTargetWorld(target) {
    const mesh = target.mesh;
    mesh.updateWorldMatrix(true, false);
    const q = mesh.getWorldQuaternion(_tmpQuat);
    target.position.set(0, target.height * this.cfg.coverPerchVerticalRatio, 0).applyMatrix4(mesh.matrixWorld);
    target.normal.set(0, 0, 1).applyQuaternion(q).normalize();
    target.up.set(0, 1, 0).applyQuaternion(q).normalize();
    target.right.set(1, 0, 0).applyQuaternion(q).normalize();
    target.hover = this.readCoverHover(mesh);
    return target;
  }

  readCoverHover(mesh) {
    const materials = Array.isArray(mesh.material) ? mesh.material : mesh.material ? [mesh.material] : [];
    let hover = 0;
    materials.forEach((mat) => {
      hover = Math.max(hover, safeNumber(mat?.uniforms?.uHover?.value, 0));
    });
    if (mesh.userData?.hovered || mesh.userData?.isHovered) hover = Math.max(hover, 1);
    return hover;
  }

  getBestHoveredCover(delta) {
    this.scanCoverTargets(false);
    let best = null;
    let bestHover = 0.12;
    for (const target of this.coverTargets) {
      this.updateCoverTargetWorld(target);
      if (target.hover > bestHover) {
        best = target;
        bestHover = target.hover;
      }
    }
    if (best) {
      this.hoverClock += delta;
      this.hoverTarget = best;
      this.signalLevel = clamp01(this.signalLevel + this.cfg.signalHoverBoost * delta);
      return best;
    }
    this.hoverClock = Math.max(0, this.hoverClock - delta * 3.0);
    this.hoverTarget = null;
    return null;
  }

  pickPatrolTarget(elapsed, force = false) {
    if (!force && elapsed < this.nextPatrolDecisionAt) return;
    this.nextPatrolDecisionAt = elapsed + randRange(this.cfg.patrolRepickMin, this.cfg.patrolRepickMax);
    const point = randomPointInView(this.camera, this.orbitCenter, this.cfg);
    const orbitOffset = this.temp.a.copy(point).sub(this.orbitCenter);
    const flat = this.temp.b.set(orbitOffset.x, 0, orbitOffset.z);
    const maxRadius = this.cfg.patrolRadiusMax * this.cfg.patrolRadiusBoost;
    const minRadius = this.cfg.patrolRadiusMin;
    if (flat.length() > maxRadius) flat.setLength(maxRadius);
    if (flat.length() < minRadius) flat.setLength(minRadius);
    point.x = this.orbitCenter.x + flat.x;
    point.z = this.orbitCenter.z + flat.z;
    point.y = THREE.MathUtils.clamp(
      point.y,
      this.orbitCenter.y + this.cfg.patrolHeightMin * this.cfg.patrolHeightBoost,
      this.orbitCenter.y + this.cfg.patrolHeightMax * this.cfg.patrolHeightBoost
    );
    this.target.copy(point);
  }

  update(deltaOrInfo = null, info = {}) {
    if (this.disposed) return;
    let delta = typeof deltaOrInfo === "number" ? deltaOrInfo : safeNumber(deltaOrInfo?.delta, 1 / 60);
    if (!Number.isFinite(delta) || delta <= 0) delta = 1 / 60;
    delta = Math.min(delta, 0.05);
    const internalAuto = Boolean(info.internalAuto || deltaOrInfo?.internalAuto);
    if (!internalAuto) this.lastExternalUpdateAt = performance.now();

    const elapsed = this.getElapsed();
    if (!this.ready) {
      this.updateMaterials(delta, elapsed);
      return;
    }

    this.scanCoverTargets(false);
    const hovered = this.getBestHoveredCover(delta);
    this.updateState(delta, elapsed, hovered);
    this.chooseBehaviour(delta, elapsed, hovered);
    this.moveTowardsTarget(delta, elapsed);
    this.updateOrientation(delta, elapsed);
    this.updateBinaryShell(delta, elapsed);
    this.updateTrail(delta, elapsed);
    this.updateVoid(delta, elapsed);
    this.updateMaterials(delta, elapsed);
    this.updateAnimations(delta, elapsed);
    this.updateDebugSnapshot(elapsed);
    this.saveState(false);
  }

  updateState(delta, elapsed, hovered) {
    const aggressivePointer = this.pointerState.speed > this.cfg.aggressivePointerSpeed;
    const aggressiveWheel = this.pointerState.wheelImpulse > this.cfg.aggressiveWheelThreshold;
    this.pointerState.wheelImpulse = Math.max(0, this.pointerState.wheelImpulse - delta * 1800);

    const stimulation = (hovered ? 1 : 0) + (this.voidState?.active ? 0.8 : 0) + Math.min(1, this.pointerState.speed * 0.55);
    this.signalLevel = clamp01(this.signalLevel - this.cfg.signalDecayPerSecond * delta + stimulation * 0.018 * delta);
    this.vitality = clamp01(this.vitality - this.cfg.vitalityDrainPerSecond * delta + (hovered ? this.cfg.vitalityRecoveryPerSecond * delta : 0));
    this.fatigue = clamp01(this.fatigue + (aggressivePointer || aggressiveWheel ? this.cfg.fatigueStimulusPerSecond * delta : this.cfg.fatigueFlightPerSecond * delta) - (!hovered ? this.cfg.fatigueRestRecoveryPerSecond * delta * 0.35 : 0));
    this.trust = clamp01(this.trust + (hovered && !aggressivePointer ? this.cfg.trustGainPerSecond * delta : -this.cfg.trustLossPerSecond * delta * (aggressivePointer ? 1.2 : 0.16)));
    this.corruption = clamp01(this.corruption + (this.voidState?.active ? this.cfg.corruptionGainPerSecond * delta : -this.cfg.corruptionRestRecoveryPerSecond * delta));

    if (hovered) this.fragmentCharge += this.cfg.fragmentChargePerHoverSecond * delta;

    if (elapsed < this.satiatedUntil) {
      this.vitality = clamp01(this.vitality + this.cfg.vitalityRecoveryPerSecond * delta * 2.2);
      this.fatigue = clamp01(this.fatigue - this.cfg.fatigueRestRecoveryPerSecond * delta);
    }

    const nextMood = this.computeMood({ elapsed, hovered, aggressivePointer, aggressiveWheel });
    this.setMood(nextMood, this.getMoodReason(nextMood));
  }

  computeMood({ elapsed, hovered, aggressivePointer, aggressiveWheel } = {}) {
    if (this.voidState?.active) return "curious";
    if (this.corruption > this.cfg.overwhelmedCorruptionThreshold) return "corrupted";
    if (this.fatigue > this.cfg.overwhelmedFatigueThreshold || aggressivePointer || aggressiveWheel) return "overwhelmed";
    if (this.vitality < this.cfg.hungryVitalityThreshold || this.signalLevel < this.cfg.hungrySignalThreshold) return "hungry";
    if (elapsed < this.satiatedUntil || (this.vitality > this.cfg.fedVitalityThreshold && this.signalLevel > 0.46 && this.fatigue < 0.62)) return "fed";
    if (!hovered && this.trust > this.cfg.safeTrustThreshold && this.fatigue < this.cfg.safeFatigueThreshold && this.vitality > 0.48) return "safe";
    if (hovered || this.pointerState.speed > 0.20) return "curious";
    return "watchful";
  }

  getMoodReason(mood) {
    switch (mood) {
      case "hungry": return "low signal / weak vitality";
      case "fed": return "activity absorbed";
      case "overwhelmed": return "too much movement / fatigue";
      case "safe": return "trust high enough to nest";
      case "corrupted": return "void residue too high";
      case "curious": return "active target detected";
      default: return "ambient patrol";
    }
  }

  getVisualProfile(mood = this.mood) {
    const profiles = {
      booting: { alpha: 0.72, brightness: 2.3, trailAlpha: 0.45, trailBrightness: 1.7, instability: 0.18, patchiness: 0.12, pointScale: 1.0, motion: 0.9, trailLifeStart: 0.72, jitter: 0.02 },
      hungry: { alpha: 0.43, brightness: 1.55, trailAlpha: 0.28, trailBrightness: 1.15, instability: 0.86, patchiness: 0.58, pointScale: 0.86, motion: 1.75, trailLifeStart: 0.46, jitter: this.cfg.hungryJitterStrength },
      fed: { alpha: 1.0, brightness: 3.45, trailAlpha: 0.96, trailBrightness: 2.85, instability: 0.08, patchiness: 0.03, pointScale: 1.15, motion: 0.72, trailLifeStart: 1.0, jitter: 0.006 },
      overwhelmed: { alpha: 0.78, brightness: 2.6, trailAlpha: 0.34, trailBrightness: 1.55, instability: 1.0, patchiness: 0.36, pointScale: 1.0, motion: 2.25, trailLifeStart: 0.58, jitter: this.cfg.overwhelmedJerkStrength },
      safe: { alpha: 0.92, brightness: 2.85, trailAlpha: 0.64, trailBrightness: 2.05, instability: 0.12, patchiness: 0.05, pointScale: 1.05, motion: 0.55, trailLifeStart: 0.80, jitter: 0.004 },
      curious: { alpha: 0.96, brightness: 3.15, trailAlpha: 0.80, trailBrightness: 2.45, instability: 0.22, patchiness: 0.08, pointScale: 1.08, motion: 1.08, trailLifeStart: 0.92, jitter: 0.025 },
      corrupted: { alpha: 0.86, brightness: 3.0, trailAlpha: 0.52, trailBrightness: 2.25, instability: 0.98, patchiness: 0.42, pointScale: 1.12, motion: 1.9, trailLifeStart: 0.72, jitter: 0.11 },
      watchful: { alpha: 0.82, brightness: 2.35, trailAlpha: 0.50, trailBrightness: 1.75, instability: 0.16, patchiness: 0.08, pointScale: 1.0, motion: 0.82, trailLifeStart: 0.74, jitter: 0.012 }
    };
    return profiles[mood] || profiles.watchful;
  }

  chooseBehaviour(delta, elapsed, hovered) {
    if (this.voidState?.active) {
      this.setMode("void", "glitch food detected");
      this.behaviour = "investigating dangerous glitch food";
      this.target.copy(this.voidState.position);
      this.perched = false;
      this.hasLandedOnCurrentTarget = false;
      return;
    }

    if (this.mood === "overwhelmed" || this.mood === "corrupted") {
      this.setMode("flee", this.mood === "corrupted" ? "purging void residue" : "searching for shelter");
      this.behaviour = this.mood === "corrupted" ? "climbing into dark air to purge corruption" : "hiding behind folders / climbing away";
      this.perched = false;
      this.currentPerchTarget = null;
      this.pickShelterTarget(elapsed, true, true);
      return;
    }

    if (hovered && this.hoverClock >= this.cfg.hoverPerchDelay) {
      const perch = this.getCoverPerchPosition(hovered);
      this.setMode("cover", "active folder signal");
      this.behaviour = this.perched ? "perched / reading folder signal" : "approaching hovered folder";
      this.currentPerchTarget = hovered;
      this.target.copy(perch.position);
      return;
    }

    if (this.perched && !hovered && this.mood !== "safe") {
      this.setMode("takeoff", "signal moved away");
      this.behaviour = "leaving perch";
      this.target.copy(this.root.position).add(new THREE.Vector3(0, this.cfg.takeoffRiseHeight, 0));
      this.perched = false;
      this.hasLandedOnCurrentTarget = false;
      this.animation?.playTakeoff(elapsed);
      this.pickPatrolTarget(elapsed, true);
      return;
    }

    if (this.mood === "safe" && this.fragmentCharge >= this.cfg.fragmentDepositCost * 0.5) {
      this.setMode("nest", "trust + fragments available");
      this.behaviour = this.perched ? "nesting / leaving binary dust" : "seeking a safe nesting folder";
      const shelter = this.pickShelterTarget(elapsed, false, false);
      if (shelter) {
        this.currentPerchTarget = shelter;
        this.target.copy(this.getCoverPerchPosition(shelter).position);
        return;
      }
    }

    if (this.mood === "hungry") {
      this.setMode("hungrySearch", "needs light / signal");
      this.behaviour = "restless broken search toward glowing folders";
      const signal = this.pickSignalTarget(elapsed);
      if (signal) {
        this.currentPerchTarget = signal;
        const perch = this.getCoverPerchPosition(signal);
        this.target.copy(perch.position).add(this.temp.b.set(
          Math.sin(elapsed * 5.7) * this.cfg.hungryJitterStrength,
          Math.sin(elapsed * 8.2) * this.cfg.hungryJitterStrength * 0.7,
          Math.cos(elapsed * 4.9) * this.cfg.hungryJitterStrength
        ));
        return;
      }
    }

    if (this.mood === "fed" && this.currentPerchTarget) {
      this.setMode("gracefulOrbit", "fed and confident");
      this.behaviour = "smooth confident circling";
      this.updateCoverTargetWorld(this.currentPerchTarget);
      const angle = elapsed * this.cfg.fedOrbitSpeed;
      this.target.copy(this.currentPerchTarget.position)
        .addScaledVector(this.currentPerchTarget.right, Math.cos(angle) * this.cfg.fedOrbitRadius)
        .addScaledVector(this.currentPerchTarget.up, Math.sin(angle * 0.8) * this.cfg.fedOrbitRadius * 0.55)
        .addScaledVector(this.currentPerchTarget.normal, 0.18 + Math.sin(angle * 0.6) * 0.05);
      return;
    }

    const sad = this.vitality < this.cfg.sadThreshold || this.fatigue > 0.78;
    this.setMode(sad ? "sadPatrol" : "patrol", sad ? "energy low" : "ambient watch");
    this.behaviour = sad ? "slow blue searching flight" : "ambient patrol / curious waiting";
    this.currentPerchTarget = null;
    this.pickPatrolTarget(elapsed, false);
  }

  pickSignalTarget(elapsed) {
    this.scanCoverTargets(false);
    let best = null;
    let bestScore = -Infinity;
    for (const target of this.coverTargets) {
      this.updateCoverTargetWorld(target);
      const distance = target.position.distanceTo(this.root.position);
      const name = String(target.item?.title || target.item?.id || "").toLowerCase();
      const glowBias = name.includes("gallery") || name.includes("contact") ? 0.08 : 0;
      const score = target.hover * 2.5 + glowBias + 1 / Math.max(0.45, distance);
      if (score > bestScore) {
        best = target;
        bestScore = score;
      }
    }
    if (best) this.nextPatrolDecisionAt = Math.min(this.nextPatrolDecisionAt, elapsed + 0.42);
    return best;
  }

  pickShelterTarget(elapsed, force = false, hideBehind = false) {
    this.scanCoverTargets(false);
    if (!force && this.shelterTarget && elapsed < this.nextShelterSearchAt) {
      const perch = this.getCoverPerchPosition(this.shelterTarget);
      this.target.copy(perch.position);
      return this.shelterTarget;
    }
    this.nextShelterSearchAt = elapsed + this.cfg.shelterSearchInterval;
    let best = null;
    let bestScore = -Infinity;
    for (const target of this.coverTargets) {
      this.updateCoverTargetWorld(target);
      const title = String(target.item?.title || target.item?.id || "").toLowerCase();
      let score = 0;
      if (title.includes("about")) score += 1.2;
      if (title.includes("gallery")) score += 0.45;
      if (title.includes("contact")) score += 0.20;
      if (title.includes("achievement")) score -= 0.65;
      score += 1 / Math.max(0.5, target.position.distanceTo(this.root.position));
      score -= target.hover * 0.25;
      if (score > bestScore) { bestScore = score; best = target; }
    }
    if (!best) {
      this.pickPatrolTarget(elapsed, true);
      if (hideBehind) this.target.y += this.cfg.shelterHeightBoost;
      return null;
    }
    this.shelterTarget = best;
    const perch = this.getCoverPerchPosition(best);
    if (hideBehind) {
      this.target.copy(perch.position)
        .addScaledVector(best.normal, -0.48)
        .addScaledVector(best.up, this.cfg.shelterHeightBoost)
        .addScaledVector(best.right, Math.sin(elapsed * 2.2) * 0.24);
    } else {
      this.target.copy(perch.position);
    }
    return best;
  }

  getCoverPerchPosition(target) {
    this.updateCoverTargetWorld(target);
    const position = target.position.clone()
      .addScaledVector(target.normal, this.cfg.coverPerchForward)
      .addScaledVector(target.up, this.cfg.coverPerchLift);
    const direction = target.normal.clone().normalize();
    return { position, direction };
  }

  moveTowardsTarget(delta, elapsed) {
    const toTarget = this.temp.a.copy(this.target).sub(this.root.position);
    const distance = toTarget.length();
    if (distance < 0.0001) return;

    const isSad = this.mode === "sadPatrol" || this.mood === "hungry";
    const speedBase = this.mode === "void" ? this.cfg.diveSpeed : this.cfg.flySpeed;
    const moodSpeed = this.mood === "overwhelmed" || this.mode === "flee" ? 1.24 : this.mood === "fed" ? 1.06 : 1.0;
    const speed = speedBase * (isSad ? this.cfg.flySadSpeedScale : 1.0) * moodSpeed;
    const slow = smoothStep(0.02, this.cfg.approachSlowRadius, distance);
    const step = Math.min(distance, speed * delta * THREE.MathUtils.lerp(0.32, 1.0, slow));
    const previous = this.temp.b.copy(this.root.position);
    this.root.position.addScaledVector(toTarget.normalize(), step);
    this.velocity.copy(this.root.position).sub(previous).divideScalar(Math.max(delta, 0.001));

    if ((this.mode === "cover" || this.mode === "nest") && this.currentPerchTarget) {
      const perch = this.getCoverPerchPosition(this.currentPerchTarget);
      if (distance < this.cfg.landTriggerDistance) {
        this.root.position.lerp(perch.position, this.cfg.coverPerchLerp);
        this.forward.lerp(perch.direction, 0.2).normalize();
        if (!this.hasLandedOnCurrentTarget) {
          this.hasLandedOnCurrentTarget = true;
          this.perched = true;
          this.animation?.playLand(elapsed);
          if (this.mode === "nest" || this.mood === "safe") this.depositFragmentNest(perch.position, elapsed, this.currentPerchTarget);
          else this.maybeDropNest(perch.position, elapsed);
        }
      }
    }

    if (this.mode === "void" && this.voidState?.active && distance < this.cfg.voidConsumeDistance) {
      this.consumeVoid(elapsed);
    }
  }

  updateOrientation(delta) {
    let desired = this.temp.a;
    if ((this.mode === "cover" || this.mode === "nest") && this.currentPerchTarget && this.perched) {
      desired.copy(this.getCoverPerchPosition(this.currentPerchTarget).direction);
    } else if (this.velocity.lengthSq() > 0.0004) {
      desired.copy(this.velocity).normalize();
    } else {
      desired.copy(this.target).sub(this.root.position).normalize();
    }
    if (desired.lengthSq() < 0.001) desired.copy(this.forward);
    this.smoothedHeading.lerp(desired, this.mode === "void" ? this.cfg.turnLerpFast : this.cfg.turnLerp).normalize();
    this.forward.copy(this.smoothedHeading);

    const lookTarget = this.temp.b.copy(this.root.position).add(this.forward);
    _tmpMat.lookAt(this.root.position, lookTarget, WORLD_UP);
    const desiredQ = this.temp.q.setFromRotationMatrix(_tmpMat);
    this.root.quaternion.slerp(desiredQ, (this.mode === "cover" || this.mode === "nest") && this.perched ? 0.34 : 0.22);

    const bankAmount = THREE.MathUtils.clamp(this.velocity.x * -0.10, -0.36, 0.36);
    const pitchAmount = THREE.MathUtils.clamp(this.velocity.y * 0.05, -0.18, 0.22);
    this.visualRoot.rotation.set(
      this.cfg.modelPitchOffset + pitchAmount,
      this.cfg.modelYawOffset,
      this.cfg.modelRollOffset + bankAmount
    );
  }

  updateBinaryShell(delta, elapsed) {
    this.updateSampleGeometry(this.binaryGeometry, this.binarySamples, elapsed, false);
    this.updateSampleGeometry(this.outlineGeometry, this.outlineSamples, elapsed, true);
  }

  updateSampleGeometry(geometry, samples, elapsed, outline) {
    const attr = geometry?.attributes?.position;
    if (!attr || !samples) return;
    const arr = attr.array;
    const profile = this.visualProfile || this.getVisualProfile(this.mood);
    const strength = (outline ? this.cfg.shellMotionStrength * 0.35 : this.cfg.shellMotionStrength) * profile.motion;
    for (let i = 0; i < samples.length; i += 1) {
      const sample = samples[i];
      const flutter = Math.sin(elapsed * (6.5 + sample.seed * 3.0) + sample.seed * 40.0) * 0.006 * strength;
      const ripple = Math.sin(elapsed * 2.0 + sample.base.x * 19.0 + sample.seed) * 0.004 * strength;
      const twitchGate = Math.sin(elapsed * (13.0 + sample.seed * 7.0) + sample.seed * 80.0) > 0.72 ? 1 : 0;
      const twitch = twitchGate * profile.jitter * (outline ? 0.25 : 1.0);
      arr[i * 3] = sample.base.x + sample.normal.x * flutter + Math.sin(sample.seed * 61.0 + elapsed * 9.0) * twitch;
      arr[i * 3 + 1] = sample.base.y + sample.normal.y * flutter + ripple + Math.cos(sample.seed * 57.0 + elapsed * 11.0) * twitch * 0.65;
      arr[i * 3 + 2] = sample.base.z + sample.normal.z * flutter + Math.sin(sample.seed * 53.0 + elapsed * 7.0) * twitch;
    }
    attr.needsUpdate = true;
  }

  updateTrail(delta, elapsed) {
    if (!this.trail?.points) return;
    const trail = this.trail;
    for (let i = 0; i < trail.count; i += 1) {
      const life = trail.lifes[i];
      if (life <= 0) continue;
      trail.lifes[i] = Math.max(0, life - delta / this.cfg.trailLife);
      const v = trail.velocities[i];
      v.multiplyScalar(Math.max(0, 1 - delta * this.cfg.trailDrag));
      trail.positions[i * 3] += v.x * delta;
      trail.positions[i * 3 + 1] += v.y * delta;
      trail.positions[i * 3 + 2] += v.z * delta;
      if (trail.lifes[i] <= 0) {
        trail.positions[i * 3] = 9999;
        trail.positions[i * 3 + 1] = 9999;
        trail.positions[i * 3 + 2] = 9999;
      }
    }

    if (!this.perched && elapsed - this.lastTrailEmitAt >= this.cfg.trailEmitInterval) {
      this.lastTrailEmitAt = elapsed;
      const i = trail.cursor;
      trail.cursor = (trail.cursor + 1) % trail.count;
      const back = this.temp.a.copy(this.forward).multiplyScalar(-0.10);
      const jitter = this.temp.b.set(randRange(-1, 1), randRange(-0.5, 0.8), randRange(-1, 1)).normalize().multiplyScalar(this.cfg.trailJitter);
      const p = this.temp.c.copy(this.root.position).add(back).add(jitter.multiplyScalar(0.25));
      trail.positions[i * 3] = p.x;
      trail.positions[i * 3 + 1] = p.y;
      trail.positions[i * 3 + 2] = p.z;
      const profile = this.visualProfile || this.getVisualProfile(this.mood);
      trail.lifes[i] = profile.trailLifeStart;
      trail.velocities[i].copy(this.forward).multiplyScalar(-this.cfg.trailSpeed * (this.mood === "fed" ? 1.35 : this.mood === "hungry" ? 0.72 : 1.0)).add(jitter);
    }

    trail.geometry.attributes.position.needsUpdate = true;
    trail.geometry.attributes.aLife.needsUpdate = true;
    trail.material.uniforms.uTime.value = elapsed;
  }

  updateVoid(delta, elapsed) {
    if (!this.voidMaterial) return;
    this.voidMaterial.uniforms.uTime.value = elapsed;
    if (!this.voidState?.active) {
      this.voidGroup.visible = false;
      this.voidMaterial.uniforms.uAlpha.value = THREE.MathUtils.lerp(this.voidMaterial.uniforms.uAlpha.value, 0, 0.1);
      if (this.voidCore?.material) this.voidCore.material.opacity = THREE.MathUtils.lerp(this.voidCore.material.opacity, 0, 0.1);
      return;
    }
    this.voidGroup.visible = true;
    this.voidGroup.position.copy(this.voidState.position);
    this.voidGroup.lookAt(this.camera.position);
    this.voidGroup.rotation.z += delta * 0.8;
    this.voidMaterial.uniforms.uAlpha.value = THREE.MathUtils.lerp(this.voidMaterial.uniforms.uAlpha.value, 1, 0.12);
    if (this.voidCore?.material) this.voidCore.material.opacity = THREE.MathUtils.lerp(this.voidCore.material.opacity, 0.78, 0.12);
    if (elapsed - this.voidState.startedAt > this.cfg.voidInspectDuration + 10.0) {
      this.voidState.active = false;
    }
  }

  updateMaterials(delta, elapsed) {
    const profile = this.visualProfile || this.getVisualProfile(this.mood);
    const sad = this.vitality < this.cfg.sadThreshold || this.mode === "sadPatrol" || this.mood === "hungry";
    if (this.mode === "void" || this.mood === "corrupted") this.targetPalette = clonePalette(this.voidPalette);
    else if ((this.mode === "cover" || this.mode === "nest") && this.currentPerchTarget) this.targetPalette = clonePalette(this.getCoverPalette(this.currentPerchTarget));
    else if (sad) this.targetPalette = clonePalette(this.sadPalette);
    else if (this.mood === "safe" || elapsed < this.satiatedUntil) this.targetPalette = clonePalette(this.homePalette);
    else this.targetPalette = clonePalette(this.paletteBase);

    lerpPalette(this.currentPalette, this.targetPalette, this.cfg.paletteLerp);
    [this.binaryMaterial, this.outlineMaterial, this.trail?.material].forEach((mat) => {
      if (!mat) return;
      setPaletteUniforms(mat, this.currentPalette);
      if (mat.uniforms.uTime) mat.uniforms.uTime.value = elapsed;
    });

    if (this.binaryMaterial?.uniforms) {
      this.binaryMaterial.uniforms.uAlpha.value = THREE.MathUtils.lerp(this.binaryMaterial.uniforms.uAlpha.value, profile.alpha, 0.08);
      this.binaryMaterial.uniforms.uBrightness.value = THREE.MathUtils.lerp(this.binaryMaterial.uniforms.uBrightness.value, profile.brightness, 0.08);
      this.binaryMaterial.uniforms.uPointScale.value = THREE.MathUtils.lerp(this.binaryMaterial.uniforms.uPointScale.value, profile.pointScale, 0.08);
      if (this.binaryMaterial.uniforms.uInstability) this.binaryMaterial.uniforms.uInstability.value = THREE.MathUtils.lerp(this.binaryMaterial.uniforms.uInstability.value, profile.instability, 0.08);
      if (this.binaryMaterial.uniforms.uPatchiness) this.binaryMaterial.uniforms.uPatchiness.value = THREE.MathUtils.lerp(this.binaryMaterial.uniforms.uPatchiness.value, profile.patchiness, 0.08);
    }
    if (this.outlineMaterial?.uniforms) {
      this.outlineMaterial.uniforms.uAlpha.value = THREE.MathUtils.lerp(this.outlineMaterial.uniforms.uAlpha.value, Math.max(0.38, profile.alpha * 0.88), 0.08);
      this.outlineMaterial.uniforms.uBrightness.value = THREE.MathUtils.lerp(this.outlineMaterial.uniforms.uBrightness.value, Math.max(2.4, profile.brightness + 0.45), 0.08);
      if (this.outlineMaterial.uniforms.uInstability) this.outlineMaterial.uniforms.uInstability.value = THREE.MathUtils.lerp(this.outlineMaterial.uniforms.uInstability.value, profile.instability * 0.42, 0.08);
      if (this.outlineMaterial.uniforms.uPatchiness) this.outlineMaterial.uniforms.uPatchiness.value = THREE.MathUtils.lerp(this.outlineMaterial.uniforms.uPatchiness.value, profile.patchiness * 0.25, 0.08);
    }
    if (this.trail?.material?.uniforms) {
      this.trail.material.uniforms.uAlpha.value = THREE.MathUtils.lerp(this.trail.material.uniforms.uAlpha.value, profile.trailAlpha, 0.08);
      this.trail.material.uniforms.uBrightness.value = THREE.MathUtils.lerp(this.trail.material.uniforms.uBrightness.value, profile.trailBrightness, 0.08);
    }
    if (this.voidMaterial) updateMaterialPalette(this.voidMaterial, this.voidPalette);
  }

  updateAnimations(delta, elapsed) {
    const sad = this.vitality < this.cfg.sadThreshold || this.mode === "sadPatrol" || this.mood === "hungry";
    this.animation?.update(delta, elapsed);
    if (this.perched && (this.mode === "cover" || this.mode === "nest")) {
      this.animation?.playLandIdle(elapsed);
    } else if (this.mode === "void") {
      this.animation?.playFlight({ elapsed, sad: false });
    } else {
      this.animation?.playFlight({ elapsed, sad });
    }
  }

  getCoverPalette(target) {
    const id = target.item?.id || target.entry?.item?.id || "";
    const index = Math.max(0, target.index || 0);
    const configured = this.coverAccentPalettes[index % Math.max(1, this.coverAccentPalettes.length)];
    if (configured) return configured;
    const preference = this.cfg.pagePreferences?.[id];
    if (Number.isFinite(preference)) {
      const hue = (0.55 + preference * 0.12 + index * 0.08) % 1;
      return buildAccentPalette(new THREE.Color().setHSL(hue, 0.95, 0.58));
    }
    return buildAccentPalette(DEFAULT_MOTH_PALETTE[index % DEFAULT_MOTH_PALETTE.length]);
  }

  handleSingleClick(event, hoverEntry = null) {
    if (hoverEntry) this.setHoveredCover(hoverEntry);
    if (!this.handleMothHit(event)) return false;
    this.animation?.playBackflip(this.getElapsed());
    this.targetPalette = clonePalette(this.cursorPalette);
    this.signalLevel = clamp01(this.signalLevel + 0.22);
    this.trust = clamp01(this.trust + 0.05);
    this.log("single click :: F_Backflip", "MOTH");
    return true;
  }

  handleDoubleClick(event) {
    if (this.handleMothHit(event)) return true;
    this.spawnVoidFromEvent(event);
    return true;
  }

  handleMothHit(event) {
    if (!this.ready || !this.hitProxy || !this.camera) return false;
    const pointer = this.pointerFromEvent(event);
    this.temp.raycaster.setFromCamera(pointer, this.camera);
    const hits = this.temp.raycaster.intersectObject(this.hitProxy, true);
    return hits.length > 0;
  }

  pointerFromEvent(event) {
    if (!event) return this.pointerState.ndc.clone();
    const rect = this.renderer?.domElement?.getBoundingClientRect?.() || { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight };
    return new THREE.Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -(((event.clientY - rect.top) / rect.height) * 2 - 1)
    );
  }

  spawnVoidFromEvent(event) {
    const pointer = this.pointerFromEvent(event);
    const raycaster = this.temp.raycaster;
    raycaster.setFromCamera(pointer, this.camera);
    const plane = this.temp.plane;
    plane.constant = -THREE.MathUtils.clamp(this.orbitCenter.y + randRange(this.cfg.voidHeightMin, this.cfg.voidHeightMax), this.orbitCenter.y + this.cfg.voidHeightMin, this.orbitCenter.y + this.cfg.voidHeightMax);
    const position = this.temp.a;
    if (!raycaster.ray.intersectPlane(plane, position)) {
      this.camera.getWorldDirection(_tmpDir);
      position.copy(this.camera.position).addScaledVector(_tmpDir, this.cfg.voidSpawnRadius);
    }
    const offset = position.clone().sub(this.orbitCenter);
    if (offset.length() > this.cfg.voidSpawnRadius) {
      offset.setLength(this.cfg.voidSpawnRadius);
      position.copy(this.orbitCenter).add(offset);
    }
    this.voidState = {
      active: true,
      position: position.clone(),
      startedAt: this.getElapsed(),
      id: makeId("void")
    };
    this.perched = false;
    this.hasLandedOnCurrentTarget = false;
    this.animation?.playTakeoff(this.getElapsed());
    this.log("binary void spawned", "VOID");
  }

  consumeVoid(elapsed) {
    if (!this.voidState?.active) return;
    this.animation?.playVoidInspect(elapsed);
    this.voidState.active = false;
    this.satiatedUntil = elapsed + this.cfg.satiatedDuration;
    this.vitality = clamp01(this.vitality + 0.26);
    this.fatigue = clamp01(this.fatigue - 0.28);
    this.corruption = clamp01(this.corruption + 0.10);
    this.fragmentCharge += this.cfg.fragmentChargePerVoid;
    this.log("void consumed :: F_Void_Inspect", "VOID");
  }

  maybeDropNest(position, elapsed) {
    if (elapsed - this.lastPerchDropAt < this.cfg.nestDepositDelay) return;
    if (this.nests.length >= this.cfg.nestMax) return;
    if (Math.random() > this.cfg.nestChancePerPerch) return;
    this.lastPerchDropAt = elapsed;
    const palette = this.currentPalette[0] || new THREE.Color("#2fe4ff");
    this.spawnNestAt(position.clone().add(new THREE.Vector3(0, -0.04, 0)), randRange(0.055, 0.095), `#${palette.getHexString()}`);
    this.log("moth left binary residue", "MOTH");
  }

  depositFragmentNest(position, elapsed, target = null) {
    if (elapsed - this.lastPerchDropAt < Math.max(1.2, this.cfg.nestDepositDelay * 0.45)) return;
    if (this.nests.length >= this.cfg.nestMax) return;
    if (this.fragmentCharge < this.cfg.fragmentDepositCost * 0.5 && Math.random() > 0.35) return;
    this.lastPerchDropAt = elapsed;
    this.fragmentCharge = Math.max(0, this.fragmentCharge - this.cfg.fragmentDepositCost);
    const palette = this.currentPalette[0] || new THREE.Color("#2fe4ff");
    const color = `#${palette.getHexString()}`;
    const nest = this.spawnNestAt(position.clone().add(new THREE.Vector3(0, -0.035, 0)), randRange(0.075, 0.13), color);
    this.decorateTargetDom(target, color);
    this.log(`nest deposit :: ${nest.userData.id || nest.id} / fragments ${this.fragmentCharge.toFixed(2)}`, "NEST");
  }

  decorateTargetDom(target, color = "#2fe4ff") {
    const node = target?.entry?.labelNode || target?.mesh?.userData?.labelNode || null;
    if (!node?.classList) return;
    node.classList.add(this.cfg.uiResidueClassName);
    node.style.setProperty("--moth-residue", color);
    node.style.textShadow = `0 0 12px ${color}, 0 0 28px rgba(47,228,255,.35)`;
    node.style.filter = "saturate(1.2) brightness(1.08)";
  }

  spawnNestAt(position, scale = 0.08, color = "#2fe4ff", id = makeId("nest")) {
    const material = new THREE.SpriteMaterial({
      map: this.glyphAtlas,
      color: toColor(color),
      transparent: true,
      opacity: 0.48,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false
    });
    const sprite = new THREE.Sprite(material);
    sprite.name = "MothBinaryResidue";
    sprite.position.copy(position);
    sprite.scale.set(scale, scale * 0.62, 1);
    sprite.userData = { id, color };
    this.nestGroup.add(sprite);
    this.nests.push(sprite);
    return sprite;
  }

  updateDebugSnapshot(elapsed) {
    if (!this.debugPanel) return;
    if (elapsed - this.lastDebugSnapshotAt < this.cfg.debugSnapshotInterval) return;
    this.lastDebugSnapshotAt = elapsed;
    const targetName = this.currentPerchTarget?.item?.title || this.currentPerchTarget?.mesh?.name || this.voidState?.id || "ambient space";
    this.debugPanel.update({
      mood: this.mood,
      mode: this.mode,
      behaviour: this.behaviour,
      animation: this.animation?.currentKey || "fallback-motion",
      target: targetName,
      vitality: this.vitality,
      signal: this.signalLevel,
      fatigue: this.fatigue,
      trust: this.trust,
      corruption: this.corruption,
      fragments: this.fragmentCharge.toFixed(2)
    });
  }

  dispose() {
    this.disposed = true;
    if (this._raf) cancelAnimationFrame(this._raf);
    const dom = this.renderer?.domElement || window;
    dom.removeEventListener?.("pointermove", this._onPointerMove);
    dom.removeEventListener?.("wheel", this._onWheel);
    dom.removeEventListener?.("dblclick", this._onDoubleClick);
    this.animation?.dispose();
    disposeObject3D(this.root);
    disposeObject3D(this.trail?.points);
    disposeObject3D(this.voidGroup);
    disposeObject3D(this.nestGroup);
    this.scene?.remove(this.root);
    this.scene?.remove(this.trail?.points);
    this.scene?.remove(this.voidGroup);
    this.scene?.remove(this.nestGroup);
    this.debugPanel?.dispose();
    this.saveState(true);
  }
}
