import * as THREE from "https://esm.sh/three@0.160.0";
import { GLTFLoader } from "https://esm.sh/three@0.160.0/examples/jsm/loaders/GLTFLoader.js";
import { FBXLoader } from "https://esm.sh/three@0.160.0/examples/jsm/loaders/FBXLoader.js";
import { ASSETS, ORBIT_ITEMS, SCENE_CONFIG } from "./config.js";

const CFG = {
  ...SCENE_CONFIG,

  cameraFov: 46,
  cameraRadius: 4.22,
  cameraTurns: 1.08,

  flagRadius: 2.14,
  helixAngleStep: 1.52,
  helixRise: 0.72,

  flagWidth: 0.84,
  flagHeight: 0.50,

  scrollSpeed: SCENE_CONFIG.scrollSpeed ?? 0.00042,
  touchSpeed: SCENE_CONFIG.touchSpeed ?? 0.0018,

  lookY: 0.08,

  modelLift: -1.26,
  modelTargetHeight: 4.55,
  modelYaw: Math.PI * 0.045,

  nearStraightenStart: 3.8,
  nearStraightenEnd: 1.35,

  farFadeStart: 7.0,
  farFadeEnd: 10.4,

  titleScaleNear: 1.0,
  titleScaleFar: 0.40,
  titleFadeStart: 4.0,
  titleFadeEnd: 9.2,

  fogDensity: 0.022,
  fogSpriteCount: 16,

  modelPointLimit: 26000,
  streamPerCover: 300,

  hoverBorrowRatio: 0.12,
  focusTunnelParticles: 480,
  focusTunnelTwist: 13.2,
  focusTunnelRadius: 0.064,

  breachMinInterval: 10.0,
  breachMaxInterval: 18.0,
  breachDuration: 4.25,

  relationMaxLines: 5,
  relationLinePoints: 26,

  deepScanDelay: 1.0,
  deepScanRingScale: 1.22,
  deepScanRingPulse: 0.06,

  memoryTrailLifetime: 3.4,
  memoryTrailGhostScale: 0.92,
  memoryTrailMaxItems: 12,
  memoryTrailCaptureDelta: 0.055
};

const COLORS = {
  bgHex: 0x081f33
};

const PALETTE = [
  new THREE.Color("#33ff88"),
  new THREE.Color("#2fe4ff"),
  new THREE.Color("#4b7dff"),
  new THREE.Color("#b04dff"),
  new THREE.Color("#ff57ce"),
  new THREE.Color("#ff8b2d"),
  new THREE.Color("#ffe166")
];

const CATEGORY_PROFILES = {
  animation: {
    key: "animation",
    label: "ANIMATION",
    color: new THREE.Color("#2fe4ff"),
    speed: 0.96,
    spread: 1.22,
    curve: 1.15,
    wobble: 0.065,
    alpha: 1.08,
    ringColor: new THREE.Color("#2fe4ff"),
    lineColor: new THREE.Color("#2fe4ff")
  },
  game: {
    key: "game",
    label: "GAME",
    color: new THREE.Color("#ff57ce"),
    speed: 1.18,
    spread: 0.86,
    curve: 0.92,
    wobble: 0.024,
    alpha: 1.18,
    ringColor: new THREE.Color("#ff57ce"),
    lineColor: new THREE.Color("#ff8b2d")
  },
  design: {
    key: "design",
    label: "DESIGN",
    color: new THREE.Color("#33ff88"),
    speed: 0.88,
    spread: 0.72,
    curve: 0.82,
    wobble: 0.012,
    alpha: 0.95,
    ringColor: new THREE.Color("#33ff88"),
    lineColor: new THREE.Color("#33ff88")
  },
  vfx: {
    key: "vfx",
    label: "VFX",
    color: new THREE.Color("#b04dff"),
    speed: 1.06,
    spread: 1.04,
    curve: 1.10,
    wobble: 0.052,
    alpha: 1.10,
    ringColor: new THREE.Color("#b04dff"),
    lineColor: new THREE.Color("#b04dff")
  },
  default: {
    key: "default",
    label: "NODE",
    color: new THREE.Color("#4b7dff"),
    speed: 1.0,
    spread: 1.0,
    curve: 1.0,
    wobble: 0.022,
    alpha: 1.0,
    ringColor: new THREE.Color("#4b7dff"),
    lineColor: new THREE.Color("#4b7dff")
  }
};

const canvas = document.getElementById("webgl");
const appRoot = document.getElementById("app") || document.body;
const loaderOverlay = document.getElementById("loader");
const progressFill = document.getElementById("progressFill");
const progressText = document.getElementById("progressText");
const enterButton = document.getElementById("enterButton");
const labelsRoot = document.getElementById("folderLabels");
const focusHint = document.getElementById("focusHint");
const muteButton = document.getElementById("muteButton");
const ambientAudio = document.getElementById("ambientAudio");
const activeNodeTitle = document.getElementById("activeNodeTitle");
const activeNodeMeta = document.getElementById("activeNodeMeta");
const backgroundVideo = document.getElementById("backgroundLoop");
const debugTerminal = document.getElementById("debugTerminal");
const debugTerminalLog = document.getElementById("debugTerminalLog");

if (backgroundVideo) {
  backgroundVideo.muted = true;
  backgroundVideo.playsInline = true;
  backgroundVideo.loop = true;
  backgroundVideo.play().catch(() => {});
}

if (ambientAudio) {
  ambientAudio.crossOrigin = "anonymous";
  ambientAudio.loop = true;
  ambientAudio.preload = "auto";
}

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(COLORS.bgHex, CFG.fogDensity);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true,
  powerPreference: "high-performance"
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(COLORS.bgHex, 0);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.95;
renderer.sortObjects = true;

const camera = new THREE.PerspectiveCamera(
  CFG.cameraFov,
  window.innerWidth / window.innerHeight,
  0.1,
  220
);
camera.position.set(0, CFG.lookY, CFG.cameraRadius);

const clock = new THREE.Clock();
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2(-10, -10);

const UP = new THREE.Vector3(0, 1, 0);
const ORBIT_CENTER = new THREE.Vector3(0, CFG.lookY, 0);
const CAMERA_FACE_FIX = new THREE.Quaternion().setFromAxisAngle(UP, Math.PI);
const LIGHT_DIR = new THREE.Vector3(0.75, 1.1, 0.55).normalize();

let isReady = false;
let hasEntered = false;
let soundEnabled = true;
let currentProgress = 0.02;
let targetProgress = 0.02;
let hoveredEntry = null;
let activeEntry = null;
let dragActive = false;
let lastTouchY = 0;

let centralModel = null;
let modelPointCloud = null;
let modelGlyphMaterial = null;
let streamGlyphMaterial = null;
let focusTunnelGlyphMaterial = null;
let glyphAtlas = null;
let modelSampleData = null;

let audioContext = null;
let audioSourceNode = null;
let audioAnalyser = null;
let audioData = null;
let audioReactiveLevel = 0.10;

let nextDebugEventAt = 0;
let lastHoveredDebugKey = "";
let lastActiveDebugKey = "";

const breachState = {
  active: false,
  index: -1,
  start: 0,
  end: 0,
  nextAt: 0,
  strength: 0
};

const scanState = {
  hoveredIndex: -1,
  targetIndex: -1,
  hoverStartAt: 0,
  active: false,
  strength: 0,
  overlayEl: null,
  panelEl: null,
  panelTitleEl: null,
  panelMetaEl: null,
  panelBodyEl: null,
  group: null,
  ringA: null,
  ringB: null,
  ringC: null,
  crossX: null,
  crossY: null
};

const orbitRoot = new THREE.Group();
scene.add(orbitRoot);

const working = {
  vA: new THREE.Vector3(),
  vB: new THREE.Vector3(),
  vC: new THREE.Vector3(),
  vD: new THREE.Vector3(),
  vE: new THREE.Vector3(),
  vF: new THREE.Vector3(),
  qA: new THREE.Quaternion(),
  qB: new THREE.Quaternion(),
  qC: new THREE.Quaternion(),
  mA: new THREE.Matrix4(),
  eA: new THREE.Euler()
};

const tempVec1 = new THREE.Vector3();
const tempVec2 = new THREE.Vector3();
const tempVec3 = new THREE.Vector3();
const tempVec4 = new THREE.Vector3();
const tempQuat = new THREE.Quaternion();
const tempColor = new THREE.Color();

const flagEntries = [];
const fogSprites = [];
const missingAssets = [];

const coverWorldData = ORBIT_ITEMS.map(() => ({
  position: new THREE.Vector3(),
  right: new THREE.Vector3(1, 0, 0),
  up: new THREE.Vector3(0, 1, 0),
  quaternion: new THREE.Quaternion(),
  visible: true
}));

const streamSystem = {
  points: null,
  geometry: null,
  positions: null,
  alphas: null,
  flowT: null,
  seeds: null,
  sizes: null,
  progress: [],
  speed: [],
  coverIndex: [],
  sourceIndex: [],
  spreadX: [],
  spreadY: [],
  count: 0
};

const focusTunnelSystem = {
  points: null,
  geometry: null,
  positions: null,
  alphas: null,
  flowT: null,
  seeds: null,
  sizes: null,
  progress: [],
  speed: [],
  sourceIndex: [],
  laneAngle: [],
  radiusJitter: [],
  count: 0,
  visibility: 0
};

const relationSystem = {
  lines: [],
  group: null
};

const memoryTrailSystem = {
  group: null,
  ghosts: [],
  splines: [],
  lastCaptureProgress: 0.02,
  lastCaptureIndex: -1,
  lastCapturePosition: null,
  lastCaptureQuaternion: null
};

setupLighting();

const manager = new THREE.LoadingManager();
manager.onProgress = (_, loaded, total) => {
  const pct = total > 0 ? Math.round((loaded / total) * 100) : 0;
  if (progressFill) progressFill.style.width = `${pct}%`;
  if (progressText) progressText.textContent = `Loading assets… ${pct}%`;
};

manager.onLoad = () => {
  isReady = true;

  if (enterButton) {
    enterButton.disabled = false;
    enterButton.textContent = "ENTER PORTFOLIO";
  }

  if (progressText) {
    progressText.textContent = missingAssets.length
      ? "Scene loaded. Some files failed, but the portfolio is ready."
      : "Assets loaded. Enter the portfolio.";
  }

  if (missingAssets.length) {
    console.warn("Missing assets detected during load:\n", missingAssets.join("\n"));
  }
};

manager.onError = (url) => {
  missingAssets.push(url);
  console.warn("Asset failed to load:", url);
};

const textureLoader = new THREE.TextureLoader(manager);
const gltfLoader = new GLTFLoader(manager);
const fbxLoader = new FBXLoader(manager);
gltfLoader.setResourcePath("./assets/models/");
fbxLoader.setResourcePath("./assets/models/");

glyphAtlas = createBinaryGlyphAtlas();

initScene();
attachEvents();
animate();

function initScene() {
  createGroundSystem();
  createFog();
  createFlags(textureLoader);
  buildRelationSystem();
  buildMemoryTrailSystem();
  createDeepScanUI();
  buildDeepScanSystem();
  loadCenterModel();
}

function setupLighting() {
  const ambient = new THREE.AmbientLight(0xffffff, 0.18);
  scene.add(ambient);

  const hemi = new THREE.HemisphereLight(0x2fe4ff, 0x081f33, 0.22);
  scene.add(hemi);

  const key = new THREE.DirectionalLight(0xffffff, 0.30);
  key.position.copy(LIGHT_DIR).multiplyScalar(8);
  scene.add(key);
}

function getItemCategory(item) {
  const text = [
    item?.title ?? "",
    item?.subtitle ?? "",
    item?.theme ?? "",
    item?.href ?? ""
  ].join(" ").toLowerCase();

  if (
    /game|steam|play|interactive|prototype|unity|22 minutes|thylassaphobia/.test(text)
  ) return CATEGORY_PROFILES.game;

  if (
    /animation|moving image|motion|gallery|film|video|anim/.test(text)
  ) return CATEGORY_PROFILES.animation;

  if (
    /vfx|fx|shader|effect|composite|compositing|particles/.test(text)
  ) return CATEGORY_PROFILES.vfx;

  if (
    /design|branding|brand|graphic|ui|ux|website|portfolio|print/.test(text)
  ) return CATEGORY_PROFILES.design;

  return CATEGORY_PROFILES.default;
}

function createGroundSystem() {
  const gridTexture = createGridTexture();
  gridTexture.wrapS = THREE.RepeatWrapping;
  gridTexture.wrapT = THREE.RepeatWrapping;
  gridTexture.repeat.set(4.8, 4.8);
  gridTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();

  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(7.0, 96),
    new THREE.MeshBasicMaterial({
      map: gridTexture,
      color: 0xffffff,
      transparent: true,
      opacity: 0.18,
      depthWrite: false,
      toneMapped: false,
      fog: false
    })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -1.56;
  ground.renderOrder = 1;
  scene.add(ground);

  const ringA = new THREE.Mesh(
    new THREE.RingGeometry(2.0, 2.1, 96),
    new THREE.MeshBasicMaterial({
      color: 0x2fe4ff,
      transparent: true,
      opacity: 0.09,
      depthWrite: false,
      toneMapped: false,
      fog: false,
      side: THREE.DoubleSide
    })
  );
  ringA.rotation.x = -Math.PI / 2;
  ringA.position.y = -1.53;
  ringA.renderOrder = 1;
  scene.add(ringA);

  const ringB = new THREE.Mesh(
    new THREE.RingGeometry(2.32, 2.42, 96),
    new THREE.MeshBasicMaterial({
      color: 0xb04dff,
      transparent: true,
      opacity: 0.05,
      depthWrite: false,
      toneMapped: false,
      fog: false,
      side: THREE.DoubleSide
    })
  );
  ringB.rotation.x = -Math.PI / 2;
  ringB.position.y = -1.525;
  ringB.renderOrder = 1;
  scene.add(ringB);
}

function createGridTexture() {
  const size = 1024;
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d");

  ctx.clearRect(0, 0, size, size);

  const grad = ctx.createRadialGradient(size * 0.5, size * 0.5, 0, size * 0.5, size * 0.5, size * 0.48);
  grad.addColorStop(0, "rgba(47,228,255,0.10)");
  grad.addColorStop(0.55, "rgba(47,228,255,0.03)");
  grad.addColorStop(1, "rgba(47,228,255,0.00)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const step = 64;
  for (let i = 0; i <= size; i += step) {
    ctx.strokeStyle = i % (step * 2) === 0
      ? "rgba(47,228,255,0.14)"
      : "rgba(255,255,255,0.04)";
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, size);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(size, i);
    ctx.stroke();
  }

  for (let r = 100; r < 480; r += 74) {
    ctx.strokeStyle = r % 148 === 0
      ? "rgba(176,77,255,0.08)"
      : "rgba(51,255,136,0.05)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(size * 0.5, size * 0.5, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(c);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createFogTexture() {
  const size = 256;
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d");

  const grad = ctx.createRadialGradient(size * 0.5, size * 0.5, 10, size * 0.5, size * 0.5, size * 0.5);
  grad.addColorStop(0, "rgba(47,228,255,0.36)");
  grad.addColorStop(0.35, "rgba(176,77,255,0.08)");
  grad.addColorStop(1, "rgba(255,255,255,0.0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(c);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createFog() {
  const fogTexture = createFogTexture();

  for (let i = 0; i < CFG.fogSpriteCount; i += 1) {
    const material = new THREE.SpriteMaterial({
      map: fogTexture,
      alphaMap: fogTexture,
      color: i % 2 === 0 ? 0x2fe4ff : 0xb04dff,
      transparent: true,
      opacity: 0.035 + Math.random() * 0.025,
      depthWrite: false,
      depthTest: true,
      fog: false,
      toneMapped: false
    });

    material.alphaTest = 0.02;

    const sprite = new THREE.Sprite(material);
    sprite.renderOrder = 2;

    const baseAngle = (i / CFG.fogSpriteCount) * Math.PI * 2;
    const baseRadius = 2.2 + Math.random() * 3.3;
    const baseY = THREE.MathUtils.lerp(-1.2, 2.2, Math.random());
    const scale = 2.2 + Math.random() * 2.4;

    sprite.position.set(
      Math.cos(baseAngle) * baseRadius,
      baseY,
      Math.sin(baseAngle) * baseRadius
    );
    sprite.scale.set(scale, scale * (0.52 + Math.random() * 0.18), 1);

    sprite.userData = {
      baseAngle,
      baseRadius,
      baseY,
      scale,
      phase: Math.random() * Math.PI * 2,
      orbitSpeed: 0.010 + Math.random() * 0.016,
      driftSpeed: 0.035 + Math.random() * 0.04,
      driftAmount: 0.10 + Math.random() * 0.18
    };

    scene.add(sprite);
    fogSprites.push(sprite);
  }
}

function createFlagMaterial(texture) {
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: true,
    depthTest: true,
    uniforms: {
      uMap: { value: texture },
      uTime: { value: 0 },
      uHover: { value: 0.0 },
      uOpacity: { value: 1.0 },
      uAudioReactive: { value: 0.10 },
      uBreach: { value: 0.0 }
    },
    vertexShader: `
      uniform float uTime;
      uniform float uHover;
      uniform float uAudioReactive;
      uniform float uBreach;

      varying vec2 vUv;
      varying float vHover;
      varying float vAudioReactive;
      varying float vBreach;

      float hash21(vec2 p) {
        p = fract(p * vec2(123.34, 456.21));
        p += dot(p, p + 45.32);
        return fract(p.x * p.y);
      }

      void main() {
        vUv = uv;
        vHover = uHover;
        vAudioReactive = uAudioReactive;
        vBreach = uBreach;

        vec3 pos = position;
        float corrupt = 1.0 - uHover;
        float unstable = corrupt + uBreach * 1.25;
        float audioBuzz = 0.78 + uAudioReactive * 0.95;

        vec2 block = floor(uv * vec2(24.0, 14.0));
        float n = hash21(block + floor(uTime * 2.0));
        float band = step(0.76, fract(uv.y * 18.0 + uTime * 2.5 + n * 3.0));

        pos.x += (n - 0.5) * 0.016 * unstable * audioBuzz;
        pos.y += sin(uv.x * 18.0 + uTime * 6.0 + n * 4.0) * 0.006 * unstable * audioBuzz;
        pos.z += sin(uv.y * 16.0 + uTime * 4.0 + n * 5.0) * (0.012 + band * 0.016) * unstable * audioBuzz;

        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D uMap;
      uniform float uTime;
      uniform float uHover;
      uniform float uOpacity;
      uniform float uBreach;

      varying vec2 vUv;
      varying float vHover;
      varying float vAudioReactive;
      varying float vBreach;

      float hash21(vec2 p) {
        p = fract(p * vec2(123.34, 456.21));
        p += dot(p, p + 45.32);
        return fract(p.x * p.y);
      }

      void main() {
        float resolve = smoothstep(0.0, 1.0, vHover);
        float corrupt = 1.0 - resolve;
        float unstable = corrupt + vBreach * 1.18;
        float audioBuzz = 0.8 + vAudioReactive * 1.2;

        vec2 uv = vUv;

        float lineNoise = hash21(vec2(floor(uv.y * 72.0), floor(uTime * 10.0)));
        float bigBand = step(0.82, lineNoise);

        uv.x += (lineNoise - 0.5) * 0.060 * unstable * audioBuzz * (0.35 + bigBand * 1.4);
        uv.y += sin(uv.x * 42.0 + uTime * 8.0) * 0.003 * unstable * audioBuzz;

        vec2 rgbShift = vec2(0.013 * unstable * audioBuzz * (0.6 + lineNoise), 0.0);
        vec4 texMain = texture2D(uMap, clamp(uv, 0.001, 0.999));
        vec4 texR = texture2D(uMap, clamp(uv + rgbShift, 0.001, 0.999));
        vec4 texB = texture2D(uMap, clamp(uv - rgbShift, 0.001, 0.999));

        float alpha = max(texMain.a, max(texR.a, texB.a));
        if (alpha < 0.03) discard;

        vec3 clean = texture2D(uMap, vUv).rgb;
        vec3 infected = vec3(texR.r, texMain.g, texB.b);

        float blockN = hash21(floor(vUv * vec2(34.0, 22.0)) + floor(uTime * 2.7));
        float dropout = step(0.935, blockN) * unstable;
        float burn = step(0.88, fract(vUv.y * 38.0 + uTime * 6.0 + blockN * 4.0)) * unstable;

        infected *= 0.68 + 0.32 * blockN;
        infected += vec3(0.00, 0.10, 0.16) * burn * audioBuzz;
        infected = mix(infected, infected.grb * vec3(0.82, 1.18, 1.10), bigBand * unstable * 0.55);
        infected *= 1.0 - dropout * 0.74;

        float shimmer = 0.92 + sin(uTime * 8.0 + lineNoise * 12.0) * 0.05 * unstable * audioBuzz;
        vec3 finalColor = mix(infected * shimmer, clean, resolve);

        gl_FragColor = vec4(finalColor, alpha * uOpacity);
      }
    `
  });

  mat.alphaTest = 0.03;
  return mat;
}

function createFlags(loader) {
  ORBIT_ITEMS.forEach((item, index) => {
    const group = new THREE.Group();
    group.userData.item = item;
    orbitRoot.add(group);

    const tex = loader.load(item.cover);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = renderer.capabilities.getMaxAnisotropy();

    const mat = createFlagMaterial(tex);
    const category = getItemCategory(item);

    const flag = new THREE.Mesh(
      new THREE.PlaneGeometry(CFG.flagWidth, CFG.flagHeight, 18, 10),
      mat
    );
    flag.renderOrder = 7;
    group.add(flag);

    const labelAnchor = new THREE.Object3D();
    labelAnchor.position.set(-CFG.flagWidth * 0.62, -CFG.flagHeight * 0.78, 0.02);
    group.add(labelAnchor);

    const labelNode = document.createElement("div");
    labelNode.className = "folder-label";

    const safeTitle = item.title ?? `Node ${index + 1}`;
    const safeSubtitle = item.subtitle ?? "portfolio node";

    labelNode.innerHTML = `
      <div class="folder-label__card">
        <div class="folder-label__id">${`node://${String(index + 1).padStart(2, "0")}`}</div>
        <h3 data-text="${safeTitle}">${safeTitle}</h3>
        <p data-text="${safeSubtitle}">${safeSubtitle}</p>
      </div>
    `;

    labelNode.style.opacity = "0";
    labelNode.style.transformOrigin = "top left";
    labelsRoot?.appendChild(labelNode);

    flagEntries.push({
      item,
      group,
      flag,
      material: mat,
      labelAnchor,
      labelNode,
      hoverValue: 0,
      breachValue: 0,
      category
    });
  });
}

function buildRelationSystem() {
  relationSystem.group = new THREE.Group();
  scene.add(relationSystem.group);

  for (let i = 0; i < CFG.relationMaxLines; i += 1) {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(CFG.relationLinePoints * 3);
    geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage)
    );
    geometry.setDrawRange(0, 0);

    const material = new THREE.LineBasicMaterial({
      color: 0x2fe4ff,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: true,
      toneMapped: false
    });

    const line = new THREE.Line(geometry, material);
    line.renderOrder = 6;
    line.frustumCulled = false;
    relationSystem.group.add(line);

    relationSystem.lines.push({ line, geometry, positions, material });
  }
}

function buildMemoryTrailSystem() {
  memoryTrailSystem.group = new THREE.Group();
  scene.add(memoryTrailSystem.group);
}

function createDeepScanUI() {
  if (!appRoot) return;

  const overlay = document.createElement("div");
  overlay.setAttribute("aria-hidden", "true");
  overlay.style.position = "absolute";
  overlay.style.inset = "0";
  overlay.style.pointerEvents = "none";
  overlay.style.zIndex = "5";
  overlay.style.opacity = "0";
  overlay.style.transition = "opacity 0.2s ease";
  overlay.style.background = `
    radial-gradient(circle at center, rgba(47,228,255,0.04), transparent 34%),
    linear-gradient(180deg, rgba(2,8,16,0.22), rgba(2,8,16,0.44))
  `;
  overlay.style.mixBlendMode = "normal";
  appRoot.appendChild(overlay);

  const panel = document.createElement("div");
  panel.setAttribute("aria-hidden", "true");
  panel.style.position = "absolute";
  panel.style.pointerEvents = "none";
  panel.style.zIndex = "9";
  panel.style.minWidth = "240px";
  panel.style.maxWidth = "300px";
  panel.style.padding = "12px 14px";
  panel.style.border = "1px solid rgba(47,228,255,0.18)";
  panel.style.background = "rgba(8, 18, 28, 0.78)";
  panel.style.backdropFilter = "blur(12px)";
  panel.style.boxShadow = "0 10px 40px rgba(0,0,0,0.25)";
  panel.style.opacity = "0";
  panel.style.transform = "translateY(8px)";
  panel.style.transition = "opacity 0.2s ease, transform 0.2s ease, border-color 0.2s ease";
  panel.style.color = "var(--text)";
  panel.style.fontFamily = 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';

  const title = document.createElement("div");
  title.style.fontSize = "0.78rem";
  title.style.letterSpacing = "0.16em";
  title.style.textTransform = "uppercase";
  title.style.color = "rgba(231,246,255,0.58)";
  title.style.marginBottom = "8px";
  title.textContent = "DEEP SCAN";

  const meta = document.createElement("div");
  meta.style.fontSize = "1rem";
  meta.style.fontWeight = "700";
  meta.style.lineHeight = "1.3";
  meta.style.marginBottom = "8px";
  meta.textContent = "Awaiting node lock";

  const body = document.createElement("div");
  body.style.fontSize = "0.78rem";
  body.style.lineHeight = "1.55";
  body.style.color = "rgba(231,246,255,0.72)";
  body.innerHTML = "metadata://standby";

  panel.appendChild(title);
  panel.appendChild(meta);
  panel.appendChild(body);
  appRoot.appendChild(panel);

  scanState.overlayEl = overlay;
  scanState.panelEl = panel;
  scanState.panelTitleEl = title;
  scanState.panelMetaEl = meta;
  scanState.panelBodyEl = body;
}

function makeCircleLine(radius, segments = 64) {
  const points = [];
  for (let i = 0; i < segments; i += 1) {
    const a = (i / segments) * Math.PI * 2;
    points.push(new THREE.Vector3(Math.cos(a) * radius, Math.sin(a) * radius, 0));
  }

  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({
    color: 0x2fe4ff,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: true,
    toneMapped: false
  });

  const line = new THREE.LineLoop(geometry, material);
  line.renderOrder = 12;
  line.frustumCulled = false;
  return line;
}

function makeCrossLine(size, horizontal = true) {
  const points = horizontal
    ? [new THREE.Vector3(-size, 0, 0), new THREE.Vector3(size, 0, 0)]
    : [new THREE.Vector3(0, -size, 0), new THREE.Vector3(0, size, 0)];

  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({
    color: 0x2fe4ff,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: true,
    toneMapped: false
  });

  const line = new THREE.Line(geometry, material);
  line.renderOrder = 12;
  line.frustumCulled = false;
  return line;
}

function buildDeepScanSystem() {
  const group = new THREE.Group();
  scene.add(group);

  const ringA = makeCircleLine(0.62);
  const ringB = makeCircleLine(0.74);
  const ringC = makeCircleLine(0.88);
  const crossX = makeCrossLine(0.92, true);
  const crossY = makeCrossLine(0.92, false);

  group.add(ringA, ringB, ringC, crossX, crossY);

  scanState.group = group;
  scanState.ringA = ringA;
  scanState.ringB = ringB;
  scanState.ringC = ringC;
  scanState.crossX = crossX;
  scanState.crossY = crossY;
}

function loadCenterModel() {
  const maybeGltf = typeof ASSETS.modelGLTF === "string" ? ASSETS.modelGLTF.trim() : "";
  const maybeGlb = typeof ASSETS.modelGLB === "string" ? ASSETS.modelGLB.trim() : "";
  const maybeFbx = typeof ASSETS.modelFBX === "string" ? ASSETS.modelFBX.trim() : "";

  if (maybeGltf) {
    gltfLoader.load(
      maybeGltf,
      (gltf) => setupLoadedModel(gltf.scene),
      undefined,
      () => {
        if (maybeGlb) {
          loadGlbFallback(maybeGlb, maybeFbx);
        } else if (maybeFbx) {
          loadFBXFallback(maybeFbx);
        } else {
          createFallbackModel();
        }
      }
    );
    return;
  }

  if (maybeGlb) {
    loadGlbFallback(maybeGlb, maybeFbx);
    return;
  }

  if (maybeFbx) {
    loadFBXFallback(maybeFbx);
    return;
  }

  createFallbackModel();
}

function loadGlbFallback(glbPath, fbxPath) {
  gltfLoader.load(
    glbPath,
    (gltf) => setupLoadedModel(gltf.scene),
    undefined,
    () => {
      if (fbxPath) {
        loadFBXFallback(fbxPath);
      } else {
        createFallbackModel();
      }
    }
  );
}

function loadFBXFallback(fbxPath) {
  fbxLoader.load(
    fbxPath,
    (fbx) => setupLoadedModel(fbx),
    undefined,
    () => createFallbackModel()
  );
}

function setupLoadedModel(modelRoot) {
  centralModel = modelRoot;

  centralModel.traverse((child) => {
    if (!child.isMesh) return;
    child.castShadow = false;
    child.receiveShadow = false;
    child.renderOrder = 5;
    child.frustumCulled = false;

    if (child.geometry && !child.geometry.attributes.normal && typeof child.geometry.computeVertexNormals === "function") {
      child.geometry.computeVertexNormals();
    }
  });

  centerAndScaleModel(centralModel);
  orbitRoot.add(centralModel);

  modelSampleData = extractModelSampleData(centralModel, CFG.modelPointLimit);
  buildBinaryModelRepresentation();
  buildStreamSystem();
  buildFocusTunnelSystem();

  centralModel.traverse((child) => {
    if (child.isMesh) child.visible = false;
  });
}

function createFallbackModel() {
  const fallback = new THREE.Group();

  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.42, 1.22, 8, 16),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  body.position.y = 0.0;
  fallback.add(body);

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.34, 24, 24),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  head.position.y = 0.98;
  fallback.add(head);

  fallback.position.y = CFG.modelLift;
  fallback.rotation.y = CFG.modelYaw;

  centralModel = fallback;
  orbitRoot.add(centralModel);

  modelSampleData = extractModelSampleData(centralModel, CFG.modelPointLimit);
  buildBinaryModelRepresentation();
  buildStreamSystem();
  buildFocusTunnelSystem();
}

function centerAndScaleModel(model) {
  const preScaleBox = new THREE.Box3().setFromObject(model);
  const preScaleSize = preScaleBox.getSize(new THREE.Vector3());
  const preScaleCenter = preScaleBox.getCenter(new THREE.Vector3());

  const scale = preScaleSize.y > 0 ? CFG.modelTargetHeight / preScaleSize.y : 1;
  model.scale.setScalar(scale);

  model.position.set(
    -preScaleCenter.x * scale,
    -preScaleCenter.y * scale + CFG.modelLift,
    -preScaleCenter.z * scale
  );

  model.rotation.y = CFG.modelYaw;
}

function extractModelSampleData(model, maxPoints) {
  model.updateMatrixWorld(true);

  const rootInverse = new THREE.Matrix4().copy(model.matrixWorld).invert();
  const rootQuat = new THREE.Quaternion();
  model.getWorldQuaternion(rootQuat);
  const invRootQuat = rootQuat.clone().invert();

  let totalVertices = 0;
  model.traverse((child) => {
    if (!child.isMesh || !child.geometry?.attributes?.position) return;
    totalVertices += child.geometry.attributes.position.count;
  });

  if (totalVertices === 0) {
    return {
      positions: new Float32Array(),
      normals: new Float32Array()
    };
  }

  const step = Math.max(1, Math.floor(totalVertices / maxPoints));
  const positions = [];
  const normals = [];
  const normalMatrix = new THREE.Matrix3();

  model.traverse((child) => {
    if (!child.isMesh || !child.geometry?.attributes?.position) return;

    const pos = child.geometry.attributes.position;
    const nor = child.geometry.attributes.normal;

    normalMatrix.getNormalMatrix(child.matrixWorld);

    for (let i = 0; i < pos.count; i += step) {
      tempVec1.fromBufferAttribute(pos, i);
      tempVec1.applyMatrix4(child.matrixWorld);
      tempVec1.applyMatrix4(rootInverse);
      positions.push(tempVec1.x, tempVec1.y, tempVec1.z);

      if (nor) {
        tempVec2.fromBufferAttribute(nor, i);
      } else {
        tempVec2.set(0, 1, 0);
      }

      tempVec2.applyMatrix3(normalMatrix).normalize();
      tempVec2.applyQuaternion(invRootQuat).normalize();
      normals.push(tempVec2.x, tempVec2.y, tempVec2.z);
    }
  });

  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals)
  };
}

function buildBinaryModelRepresentation() {
  if (!centralModel || !modelSampleData || modelSampleData.positions.length === 0) return;

  const count = modelSampleData.positions.length / 3;
  const seeds = new Float32Array(count);
  const sizes = new Float32Array(count);
  const alphas = new Float32Array(count);

  for (let i = 0; i < count; i += 1) {
    seeds[i] = Math.random();
    sizes[i] = 0.68 + Math.random() * 0.34;
    alphas[i] = 0.74 + Math.random() * 0.24;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(modelSampleData.positions, 3));
  geometry.setAttribute("aNormal", new THREE.BufferAttribute(modelSampleData.normals, 3));
  geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
  geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute("aAlpha", new THREE.BufferAttribute(alphas, 1));

  modelGlyphMaterial = createModelGlyphMaterial(glyphAtlas);

  modelPointCloud = new THREE.Points(geometry, modelGlyphMaterial);
  modelPointCloud.renderOrder = 8;
  modelPointCloud.frustumCulled = false;
  centralModel.add(modelPointCloud);
}

function buildStreamSystem() {
  if (!centralModel || !modelSampleData || modelSampleData.positions.length === 0) return;

  const count = ORBIT_ITEMS.length * CFG.streamPerCover;
  streamSystem.count = count;
  streamSystem.positions = new Float32Array(count * 3);
  streamSystem.alphas = new Float32Array(count);
  streamSystem.flowT = new Float32Array(count);
  streamSystem.seeds = new Float32Array(count);
  streamSystem.sizes = new Float32Array(count);
  streamSystem.progress = new Array(count);
  streamSystem.speed = new Array(count);
  streamSystem.coverIndex = new Array(count);
  streamSystem.sourceIndex = new Array(count);
  streamSystem.spreadX = new Array(count);
  streamSystem.spreadY = new Array(count);

  const sampleCount = modelSampleData.positions.length / 3;

  for (let i = 0; i < count; i += 1) {
    streamSystem.coverIndex[i] = i % ORBIT_ITEMS.length;
    streamSystem.seeds[i] = Math.random();
    streamSystem.sizes[i] = 0.78 + Math.random() * 0.40;
    streamSystem.progress[i] = Math.random();
    streamSystem.speed[i] = 0.18 + Math.random() * 0.16;
    streamSystem.sourceIndex[i] = Math.floor(Math.random() * sampleCount);
    streamSystem.spreadX[i] = Math.random() * 2 - 1;
    streamSystem.spreadY[i] = Math.random() * 2 - 1;
    streamSystem.alphas[i] = 0.25;
    streamSystem.flowT[i] = 0;
  }

  const geometry = new THREE.BufferGeometry();
  const positionAttr = new THREE.BufferAttribute(streamSystem.positions, 3);
  positionAttr.setUsage(THREE.DynamicDrawUsage);

  const alphaAttr = new THREE.BufferAttribute(streamSystem.alphas, 1);
  alphaAttr.setUsage(THREE.DynamicDrawUsage);

  const flowAttr = new THREE.BufferAttribute(streamSystem.flowT, 1);
  flowAttr.setUsage(THREE.DynamicDrawUsage);

  geometry.setAttribute("position", positionAttr);
  geometry.setAttribute("aSeed", new THREE.BufferAttribute(streamSystem.seeds, 1));
  geometry.setAttribute("aSize", new THREE.BufferAttribute(streamSystem.sizes, 1));
  geometry.setAttribute("aAlpha", alphaAttr);
  geometry.setAttribute("aFlowT", flowAttr);

  streamGlyphMaterial = createStreamGlyphMaterial(glyphAtlas);

  const points = new THREE.Points(geometry, streamGlyphMaterial);
  points.renderOrder = 9;
  points.frustumCulled = false;

  streamSystem.geometry = geometry;
  streamSystem.points = points;
  scene.add(points);
}

function buildFocusTunnelSystem() {
  if (!centralModel || !modelSampleData || modelSampleData.positions.length === 0) return;

  const count = CFG.focusTunnelParticles;
  focusTunnelSystem.count = count;
  focusTunnelSystem.positions = new Float32Array(count * 3);
  focusTunnelSystem.alphas = new Float32Array(count);
  focusTunnelSystem.flowT = new Float32Array(count);
  focusTunnelSystem.seeds = new Float32Array(count);
  focusTunnelSystem.sizes = new Float32Array(count);
  focusTunnelSystem.progress = new Array(count);
  focusTunnelSystem.speed = new Array(count);
  focusTunnelSystem.sourceIndex = new Array(count);
  focusTunnelSystem.laneAngle = new Array(count);
  focusTunnelSystem.radiusJitter = new Array(count);

  const sampleCount = modelSampleData.positions.length / 3;

  for (let i = 0; i < count; i += 1) {
    focusTunnelSystem.seeds[i] = Math.random();
    focusTunnelSystem.sizes[i] = 0.88 + Math.random() * 0.44;
    focusTunnelSystem.progress[i] = Math.random();
    focusTunnelSystem.speed[i] = 0.46 + Math.random() * 0.34;
    focusTunnelSystem.sourceIndex[i] = Math.floor(Math.random() * sampleCount);
    focusTunnelSystem.laneAngle[i] = Math.random() * Math.PI * 2;
    focusTunnelSystem.radiusJitter[i] = 0.70 + Math.random() * 0.60;
    focusTunnelSystem.alphas[i] = 0.0;
    focusTunnelSystem.flowT[i] = 0.0;
  }

  const geometry = new THREE.BufferGeometry();
  const positionAttr = new THREE.BufferAttribute(focusTunnelSystem.positions, 3);
  positionAttr.setUsage(THREE.DynamicDrawUsage);

  const alphaAttr = new THREE.BufferAttribute(focusTunnelSystem.alphas, 1);
  alphaAttr.setUsage(THREE.DynamicDrawUsage);

  const flowAttr = new THREE.BufferAttribute(focusTunnelSystem.flowT, 1);
  flowAttr.setUsage(THREE.DynamicDrawUsage);

  geometry.setAttribute("position", positionAttr);
  geometry.setAttribute("aSeed", new THREE.BufferAttribute(focusTunnelSystem.seeds, 1));
  geometry.setAttribute("aSize", new THREE.BufferAttribute(focusTunnelSystem.sizes, 1));
  geometry.setAttribute("aAlpha", alphaAttr);
  geometry.setAttribute("aFlowT", flowAttr);

  focusTunnelGlyphMaterial = createFocusedStreamGlyphMaterial(glyphAtlas);

  const points = new THREE.Points(geometry, focusTunnelGlyphMaterial);
  points.renderOrder = 10;
  points.frustumCulled = false;

  focusTunnelSystem.geometry = geometry;
  focusTunnelSystem.points = points;
  scene.add(points);
}

function createBinaryGlyphAtlas() {
  const c = document.createElement("canvas");
  c.width = 2048;
  c.height = 1024;
  const ctx = c.getContext("2d");

  ctx.clearRect(0, 0, c.width, c.height);
  ctx.imageSmoothingEnabled = true;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.font = '900 760px ui-monospace, "SFMono-Regular", Menlo, Monaco, Consolas, monospace';
  ctx.fillStyle = "#ffffff";
  ctx.shadowColor = "rgba(255,255,255,0.14)";
  ctx.shadowBlur = 12;

  ctx.fillText("0", 512, 520);
  ctx.fillText("1", 1536, 520);

  const texture = new THREE.CanvasTexture(c);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  return texture;
}

function createModelGlyphMaterial(atlas) {
  const paletteUniform = PALETTE.map((c) => c.clone());

  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: THREE.NormalBlending,
    uniforms: {
      uAtlas: { value: atlas },
      uTime: { value: 0 },
      uLightDir: { value: LIGHT_DIR.clone() },
      uPalette: { value: paletteUniform },
      uAudioPulse: { value: 0.10 }
    },
    vertexShader: `
      uniform float uTime;
      uniform vec3 uLightDir;
      uniform float uAudioPulse;

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

        float drift = 0.0022 + aSeed * 0.0020;
        float audioDrift = 1.0 + uAudioPulse * (0.20 + aSeed * 0.28);

        p.x += sin(uTime * (0.18 + fract(aSeed * 0.25)) + aSeed * 51.0) * drift * audioDrift;
        p.y += cos(uTime * (0.16 + fract(aSeed * 0.21)) + aSeed * 37.0) * drift * audioDrift;
        p.z += sin(uTime * (0.17 + fract(aSeed * 0.23)) + aSeed * 23.0) * drift * audioDrift;

        vec3 worldNormal = normalize(mat3(modelMatrix) * aNormal);
        float light = max(dot(worldNormal, normalize(uLightDir)), 0.0);
        float shade = pow(smoothstep(0.10, 0.98, light), 1.85);

        float digitSwitch = floor(uTime * (0.18 + fract(aSeed * 0.10)) + aSeed * 21.0);
        vDigit = mod(digitSwitch, 2.0);
        vAlpha = aAlpha * shade * (0.92 + uAudioPulse * 0.22);
        vShade = shade;
        vPalette = fract(aSeed * 13.7);

        vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = max(3.0, aSize * (36.0 / max(1.0, -mvPosition.z)) * (1.0 + uAudioPulse * 0.14));
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform sampler2D uAtlas;
      uniform vec3 uPalette[7];

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
        float alpha = glyph.a * vAlpha;
        if (alpha < 0.02) discard;

        vec3 color = palette(vPalette);
        color *= mix(0.24, 1.0, vShade);

        gl_FragColor = vec4(color, alpha);
      }
    `
  });
}

function createStreamGlyphMaterial(atlas) {
  const paletteUniform = PALETTE.map((c) => c.clone());

  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uAtlas: { value: atlas },
      uTime: { value: 0 },
      uPalette: { value: paletteUniform },
      uAudioPulse: { value: 0.10 }
    },
    vertexShader: `
      uniform float uTime;
      uniform float uAudioPulse;

      attribute float aSeed;
      attribute float aSize;
      attribute float aAlpha;
      attribute float aFlowT;

      varying float vDigit;
      varying float vAlpha;
      varying float vPalette;

      void main() {
        float digitSwitch = floor(uTime * (0.34 + fract(aSeed * 0.18)) + aSeed * 17.0);
        vDigit = mod(digitSwitch, 2.0);
        vPalette = fract(aSeed * 11.3);
        vAlpha = aAlpha * (0.92 + uAudioPulse * 0.24);

        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        float nearFolderGrow = mix(1.0, 1.46, smoothstep(0.52, 1.0, aFlowT));
        float audioGrow = 1.0 + uAudioPulse * 0.12;
        gl_PointSize = max(3.4, aSize * nearFolderGrow * audioGrow * (34.0 / max(1.0, -mvPosition.z)));
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform sampler2D uAtlas;
      uniform vec3 uPalette[7];

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

        float alpha = glyph.a * vAlpha;
        if (alpha < 0.02) discard;

        vec3 color = palette(vPalette);
        gl_FragColor = vec4(color, alpha);
      }
    `
  });
}

function createFocusedStreamGlyphMaterial(atlas) {
  const paletteUniform = PALETTE.map((c) => c.clone());

  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uAtlas: { value: atlas },
      uTime: { value: 0 },
      uPalette: { value: paletteUniform },
      uAudioPulse: { value: 0.10 },
      uVisibility: { value: 0.0 }
    },
    vertexShader: `
      uniform float uTime;
      uniform float uAudioPulse;
      uniform float uVisibility;

      attribute float aSeed;
      attribute float aSize;
      attribute float aAlpha;
      attribute float aFlowT;

      varying float vDigit;
      varying float vAlpha;
      varying float vPalette;

      void main() {
        float digitSwitch = floor(uTime * (0.40 + fract(aSeed * 0.22)) + aSeed * 31.0);
        vDigit = mod(digitSwitch, 2.0);
        vPalette = fract(aSeed * 15.1);
        vAlpha = aAlpha * uVisibility * (1.0 + uAudioPulse * 0.32);

        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        float decodeGrow = mix(1.10, 1.80, smoothstep(0.18, 1.0, aFlowT));
        float audioGrow = 1.0 + uAudioPulse * 0.16;
        gl_PointSize = max(3.6, aSize * decodeGrow * audioGrow * (38.0 / max(1.0, -mvPosition.z)));
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform sampler2D uAtlas;
      uniform vec3 uPalette[7];

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

        float alpha = glyph.a * vAlpha;
        if (alpha < 0.02) discard;

        vec3 color = palette(vPalette) * 1.15;
        gl_FragColor = vec4(color, alpha);
      }
    `
  });
}

function attachEvents() {
  window.addEventListener("resize", onResize);

  window.addEventListener(
    "wheel",
    (event) => {
      if (!hasEntered) return;
      targetProgress += event.deltaY * CFG.scrollSpeed;
      targetProgress = THREE.MathUtils.clamp(targetProgress, 0, 1);
    },
    { passive: true }
  );

  window.addEventListener("pointermove", (event) => {
    const bounds = renderer.domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
    pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
  });

  window.addEventListener("click", () => {
    if (!hasEntered) return;
    if (hoveredEntry) {
      window.location.href = hoveredEntry.item.href;
    }
  });

  window.addEventListener(
    "touchstart",
    (event) => {
      if (!hasEntered) return;
      dragActive = true;
      lastTouchY = event.touches[0].clientY;
    },
    { passive: true }
  );

  window.addEventListener(
    "touchmove",
    (event) => {
      if (!hasEntered || !dragActive) return;
      const currentY = event.touches[0].clientY;
      const delta = lastTouchY - currentY;
      lastTouchY = currentY;
      targetProgress += delta * CFG.touchSpeed;
      targetProgress = THREE.MathUtils.clamp(targetProgress, 0, 1);
    },
    { passive: true }
  );

  window.addEventListener("touchend", () => {
    dragActive = false;
  });

  document.addEventListener("visibilitychange", () => {
    if (!backgroundVideo) return;
    if (document.hidden) {
      backgroundVideo.pause();
    } else {
      backgroundVideo.play().catch(() => {});
    }
  });

  enterButton?.addEventListener("click", async () => {
    if (!isReady) return;

    hasEntered = true;
    document.body.classList.add("is-entered");
    loaderOverlay?.setAttribute("aria-hidden", "true");

    if (backgroundVideo) {
      backgroundVideo.play().catch(() => {});
    }

    initAudioReactive();
    scheduleNextBreach(clock.elapsedTime);
    pushDebugEvent("diagnostic shell booted", "BOOT");
    pushDebugEvent("ambient packet lattice online", "SYS");

    try {
      if (ambientAudio) {
        ambientAudio.volume = 0.45;
        ambientAudio.currentTime = 0;
        if (soundEnabled) {
          await ambientAudio.play();
          if (audioContext && audioContext.state === "suspended") {
            await audioContext.resume();
          }
        }
      }
    } catch (error) {
      console.warn("Audio did not start automatically.", error);
      pushDebugEvent("ambient input unavailable :: using fallback pulse", "WARN");
    }

    if (focusHint) {
      focusHint.style.opacity = "1";
    }
  });

  muteButton?.addEventListener("click", async () => {
    soundEnabled = !soundEnabled;
    muteButton.textContent = soundEnabled ? "SOUND ON" : "SOUND OFF";

    initAudioReactive();

    if (!hasEntered || !ambientAudio) return;

    if (soundEnabled) {
      try {
        await ambientAudio.play();
        if (audioContext && audioContext.state === "suspended") {
          await audioContext.resume();
        }
        pushDebugEvent("ambient signal restored", "OK");
      } catch (error) {
        console.warn("Audio resume failed.", error);
        pushDebugEvent("ambient signal resume failed", "WARN");
      }
    } else {
      ambientAudio.pause();
      pushDebugEvent("ambient signal muted", "SYS");
    }
  });
}

function initAudioReactive() {
  if (!ambientAudio || audioAnalyser) return;

  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return;

  try {
    audioContext = audioContext || new Ctx();
    audioAnalyser = audioContext.createAnalyser();
    audioAnalyser.fftSize = 128;
    audioAnalyser.smoothingTimeConstant = 0.84;
    audioData = new Uint8Array(audioAnalyser.frequencyBinCount);

    if (!audioSourceNode) {
      audioSourceNode = audioContext.createMediaElementSource(ambientAudio);
      audioSourceNode.connect(audioAnalyser);
      audioAnalyser.connect(audioContext.destination);
    }
  } catch (error) {
    console.warn("Audio analyser init failed.", error);
    audioAnalyser = null;
    audioData = null;
  }
}

function scheduleNextBreach(elapsed) {
  breachState.nextAt = elapsed + THREE.MathUtils.randFloat(CFG.breachMinInterval, CFG.breachMaxInterval);
}

function pickBreachIndex() {
  const visible = [];
  for (let i = 0; i < flagEntries.length; i += 1) {
    if (flagEntries[i].group.visible) visible.push(i);
  }

  if (visible.length === 0) return -1;
  if (visible.length === 1) return visible[0];

  const filtered = visible.filter((i) => flagEntries[i] !== hoveredEntry);
  const pool = filtered.length ? filtered : visible;
  return pool[Math.floor(Math.random() * pool.length)];
}

function startSystemBreach(elapsed) {
  const index = pickBreachIndex();
  if (index === -1) {
    scheduleNextBreach(elapsed + 2);
    return;
  }

  breachState.active = true;
  breachState.index = index;
  breachState.start = elapsed;
  breachState.end = elapsed + CFG.breachDuration;
  breachState.strength = 0;

  const entry = flagEntries[index];
  pushDebugEvent(`system breach :: ${getNodeTag(entry)}`, "ALRT");
  pushDebugEvent(`auto-lock repair stream :: ${entry.item.title}`, "FLOW");
}

function stopSystemBreach(elapsed) {
  if (breachState.index >= 0 && breachState.index < flagEntries.length) {
    const entry = flagEntries[breachState.index];
    pushDebugEvent(`breach resolved :: ${getNodeTag(entry)}`, "OK");
  }

  breachState.active = false;
  breachState.index = -1;
  breachState.strength = 0;
  scheduleNextBreach(elapsed);
}

function updateSystemBreach(elapsed) {
  if (!hasEntered) return;

  if (!breachState.active) {
    if (breachState.nextAt === 0) scheduleNextBreach(elapsed);
    if (elapsed >= breachState.nextAt) {
      startSystemBreach(elapsed);
    }
    return;
  }

  if (elapsed >= breachState.end) {
    stopSystemBreach(elapsed);
    return;
  }

  const t = (elapsed - breachState.start) / Math.max(0.001, breachState.end - breachState.start);
  breachState.strength = Math.sin(t * Math.PI);
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();
  const elapsed = clock.elapsedTime;

  currentProgress = THREE.MathUtils.lerp(currentProgress, targetProgress, 0.085);

  updateSystemBreach(elapsed);
  updateAudioReactive(elapsed);
  updateCamera(elapsed);
  updateFlags(elapsed);
  updateCoverWorldData();
  updateIntersections();
  updateDeepScan(elapsed);
  maybeCaptureMemoryTrail(elapsed);
  updateMemoryTrails(delta, elapsed);
  updateLabels();
  updateRelationLines(elapsed);
  updateFog(elapsed);
  updateBinaryModel(elapsed);
  updateStreamParticles(delta, elapsed);
  updateFocusTunnel(delta, elapsed);
  updateDebugTerminal(elapsed);

  renderer.render(scene, camera);
}

function updateAudioReactive(elapsed) {
  let target = 0.10;

  if (
    hasEntered &&
    soundEnabled &&
    ambientAudio &&
    audioAnalyser &&
    audioData &&
    !ambientAudio.paused
  ) {
    audioAnalyser.getByteFrequencyData(audioData);

    let sum = 0;
    for (let i = 0; i < audioData.length; i += 1) {
      sum += audioData[i];
    }

    const avg = audioData.length ? sum / audioData.length / 255 : 0;
    target = THREE.MathUtils.clamp(avg * 1.65, 0.04, 0.48);
  } else {
    target = 0.09 + (Math.sin(elapsed * 1.3) * 0.5 + 0.5) * 0.07;
  }

  if (breachState.active) {
    target += breachState.strength * 0.28;
  }

  if (scanState.strength > 0.01) {
    target += scanState.strength * 0.04;
  }

  audioReactiveLevel = THREE.MathUtils.lerp(audioReactiveLevel, target, 0.10);

  if (appRoot) {
    appRoot.style.setProperty("--audio-flicker", audioReactiveLevel.toFixed(3));
  }
}

function updateCamera(elapsed) {
  const orbitTheta = currentProgress * Math.PI * 2 * CFG.cameraTurns;

  camera.position.set(
    Math.cos(orbitTheta) * CFG.cameraRadius,
    CFG.lookY + Math.sin(elapsed * 0.48) * 0.03,
    Math.sin(orbitTheta) * CFG.cameraRadius
  );

  camera.lookAt(0, CFG.lookY, 0);
}

function updateFlags(elapsed) {
  const total = flagEntries.length;
  if (total === 0) return;

  const frontIndex = currentProgress * (total - 1);
  const orbitTheta = currentProgress * Math.PI * 2 * CFG.cameraTurns;

  let closest = null;
  let closestDistance = Infinity;

  flagEntries.forEach((entry, index) => {
    const relative = index - frontIndex;
    const theta = orbitTheta + relative * CFG.helixAngleStep;
    const y = CFG.lookY + relative * CFG.helixRise;

    entry.group.position.set(
      Math.cos(theta) * CFG.flagRadius,
      y,
      Math.sin(theta) * CFG.flagRadius
    );

    working.mA.lookAt(entry.group.position, ORBIT_CENTER, UP);
    working.qA.setFromRotationMatrix(working.mA);

    working.eA.set(-0.12, 0.03, -0.08);
    working.qC.setFromEuler(working.eA);
    working.qA.multiply(working.qC);

    const cameraDistance = entry.group.position.distanceTo(camera.position);
    if (cameraDistance < closestDistance) {
      closestDistance = cameraDistance;
      closest = entry;
    }

    const straighten = smoothstep(
      CFG.nearStraightenStart,
      CFG.nearStraightenEnd,
      cameraDistance
    );

    working.mA.lookAt(entry.group.position, camera.position, UP);
    working.qB.setFromRotationMatrix(working.mA);
    working.qB.multiply(CAMERA_FACE_FIX);

    entry.group.quaternion.slerpQuaternions(working.qA, working.qB, straighten);

    const farVisibility = 1.0 - smoothstep(CFG.farFadeStart, CFG.farFadeEnd, cameraDistance);
    const indexVisibility = THREE.MathUtils.clamp(
      1 - Math.abs(relative) / (total * 0.78),
      0,
      1
    );

    const visibility = Math.min(farVisibility, indexVisibility);
    const finalOpacity = THREE.MathUtils.clamp(Math.pow(visibility, 0.65), 0, 1);

    entry.hoverValue = THREE.MathUtils.lerp(
      entry.hoverValue,
      hoveredEntry === entry ? 1 : 0,
      0.12
    );

    const breached = breachState.active && breachState.index === index;
    entry.breachValue = THREE.MathUtils.lerp(
      entry.breachValue,
      breached ? breachState.strength : 0,
      0.16
    );

    entry.material.uniforms.uTime.value = elapsed;
    entry.material.uniforms.uOpacity.value = finalOpacity;
    entry.material.uniforms.uHover.value = entry.hoverValue;
    entry.material.uniforms.uAudioReactive.value = audioReactiveLevel;
    entry.material.uniforms.uBreach.value = entry.breachValue;

    entry.group.visible = finalOpacity > 0.02;
  });

  if (closest && closest !== activeEntry) {
    activeEntry = closest;
    updateActiveNode(activeEntry);
  }
}

function updateCoverWorldData() {
  for (let i = 0; i < flagEntries.length; i += 1) {
    const entry = flagEntries[i];
    const data = coverWorldData[i];

    entry.group.getWorldPosition(data.position);
    entry.group.getWorldQuaternion(data.quaternion);

    data.right.set(1, 0, 0).applyQuaternion(data.quaternion);
    data.up.set(0, 1, 0).applyQuaternion(data.quaternion);
    data.visible = entry.group.visible;
  }
}

function updateActiveNode(entry) {
  if (!entry) return;

  let title = entry.item.title;
  let meta = `${entry.item.subtitle || "active node"} • ${entry.item.theme || entry.category.label}`;

  const idx = flagEntries.indexOf(entry);
  if (breachState.active && idx === breachState.index) {
    meta += " • breach detected";
  } else if (scanState.active && idx === scanState.targetIndex) {
    meta += " • deep scan locked";
  }

  if (activeNodeTitle) activeNodeTitle.textContent = title;
  if (activeNodeMeta) activeNodeMeta.textContent = meta;
}

function getDeepScanEntry() {
  if (breachState.active) return null;
  if (scanState.targetIndex < 0 || scanState.targetIndex >= flagEntries.length) return null;
  return flagEntries[scanState.targetIndex];
}

function updateDeepScan(elapsed) {
  const hoveredIndex = hoveredEntry ? flagEntries.indexOf(hoveredEntry) : -1;

  if (breachState.active) {
    scanState.hoveredIndex = -1;
    scanState.targetIndex = -1;
    scanState.active = false;
  } else {
    if (hoveredIndex !== scanState.hoveredIndex) {
      scanState.hoveredIndex = hoveredIndex;
      scanState.hoverStartAt = elapsed;
      scanState.active = false;
      scanState.targetIndex = -1;
    }

    if (hoveredIndex !== -1) {
      if (elapsed - scanState.hoverStartAt >= CFG.deepScanDelay) {
        scanState.active = true;
        scanState.targetIndex = hoveredIndex;
      }
    } else {
      scanState.active = false;
      scanState.targetIndex = -1;
    }
  }

  scanState.strength = THREE.MathUtils.lerp(
    scanState.strength,
    scanState.active ? 1 : 0,
    0.12
  );

  if (scanState.overlayEl) {
    scanState.overlayEl.style.opacity = `${0.58 * scanState.strength}`;
  }

  const entry = getDeepScanEntry();
  if (!entry || scanState.strength < 0.01) {
    if (scanState.group) {
      scanState.group.visible = false;
    }
    if (scanState.panelEl) {
      scanState.panelEl.style.opacity = "0";
      scanState.panelEl.style.transform = "translateY(8px)";
    }
    return;
  }

  const idx = flagEntries.indexOf(entry);
  const data = coverWorldData[idx];
  const profile = entry.category;

  if (scanState.group) {
    scanState.group.visible = true;
    scanState.group.position.copy(data.position);
    scanState.group.quaternion.copy(data.quaternion);

    const pulse = 1 + Math.sin(elapsed * 3.4) * CFG.deepScanRingPulse * scanState.strength;
    const pulseB = 1 + Math.sin(elapsed * 4.6 + 1.2) * (CFG.deepScanRingPulse * 0.7) * scanState.strength;
    const pulseC = 1 + Math.sin(elapsed * 2.8 + 2.2) * (CFG.deepScanRingPulse * 1.1) * scanState.strength;

    scanState.ringA.scale.setScalar(CFG.deepScanRingScale * pulse);
    scanState.ringB.scale.setScalar((CFG.deepScanRingScale + 0.1) * pulseB);
    scanState.ringC.scale.setScalar((CFG.deepScanRingScale + 0.22) * pulseC);
    scanState.crossX.scale.setScalar(CFG.deepScanRingScale * 1.06);
    scanState.crossY.scale.setScalar(CFG.deepScanRingScale * 1.06);

    scanState.ringA.material.color.copy(profile.ringColor);
    scanState.ringB.material.color.copy(profile.ringColor);
    scanState.ringC.material.color.copy(profile.ringColor);
    scanState.crossX.material.color.copy(profile.ringColor);
    scanState.crossY.material.color.copy(profile.ringColor);

    scanState.ringA.material.opacity = 0.34 * scanState.strength;
    scanState.ringB.material.opacity = 0.24 * scanState.strength;
    scanState.ringC.material.opacity = 0.16 * scanState.strength;
    scanState.crossX.material.opacity = 0.16 * scanState.strength;
    scanState.crossY.material.opacity = 0.16 * scanState.strength;
  }

  if (scanState.panelEl) {
    entry.labelAnchor.getWorldPosition(working.vB);
    working.vB.project(camera);

    const x = (working.vB.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-working.vB.y * 0.5 + 0.5) * window.innerHeight;

    scanState.panelEl.style.opacity = `${scanState.strength}`;
    scanState.panelEl.style.transform = "translateY(0px)";
    scanState.panelEl.style.left = `${Math.min(window.innerWidth - 320, x + 26)}px`;
    scanState.panelEl.style.top = `${Math.max(90, y - 24)}px`;
    scanState.panelEl.style.borderColor = profile.ringColor.getStyle();

    if (scanState.panelTitleEl) {
      scanState.panelTitleEl.textContent = `DEEP SCAN // ${profile.label}`;
      scanState.panelTitleEl.style.color = profile.ringColor.getStyle();
    }

    if (scanState.panelMetaEl) {
      scanState.panelMetaEl.textContent = entry.item.title || "Untitled node";
    }

    if (scanState.panelBodyEl) {
      const integrity = `${Math.round(84 + Math.sin(elapsed * 2.4 + idx) * 7 + 8)}%`;
      const route = safeHost(entry.item.href);
      scanState.panelBodyEl.innerHTML = `
        node:///${String(idx + 1).padStart(2, "0")}<br>
        type://${profile.key}<br>
        theme://${entry.item.theme || "portfolio"}<br>
        integrity://${integrity}<br>
        route://${route}
      `;
    }
  }
}

function safeHost(href) {
  try {
    return new URL(href, window.location.href).hostname || "local";
  } catch {
    return "local";
  }
}

function maybeCaptureMemoryTrail(elapsed) {
  if (!hasEntered || !activeEntry) return;

  const idx = flagEntries.indexOf(activeEntry);
  if (idx === -1) return;

  const movedEnough = Math.abs(currentProgress - memoryTrailSystem.lastCaptureProgress) > CFG.memoryTrailCaptureDelta;
  const changedNode = idx !== memoryTrailSystem.lastCaptureIndex;

  if (!movedEnough && !changedNode) return;
  if (!coverWorldData[idx].visible) return;

  captureMemoryTrail(idx, elapsed);
}

function captureMemoryTrail(idx, elapsed) {
  const entry = flagEntries[idx];
  const data = coverWorldData[idx];
  const profile = entry.category;

  const map = entry.material.uniforms.uMap.value;
  const ghostMaterial = new THREE.MeshBasicMaterial({
    map,
    color: profile.color.clone().multiplyScalar(0.95),
    transparent: true,
    opacity: 0.22,
    depthWrite: false,
    depthTest: true,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    toneMapped: false
  });

  const ghost = new THREE.Mesh(
    new THREE.PlaneGeometry(CFG.flagWidth * CFG.memoryTrailGhostScale, CFG.flagHeight * CFG.memoryTrailGhostScale),
    ghostMaterial
  );
  ghost.position.copy(data.position);
  ghost.quaternion.copy(data.quaternion);
  ghost.renderOrder = 5;
  ghost.frustumCulled = false;
  memoryTrailSystem.group.add(ghost);

  memoryTrailSystem.ghosts.push({
    mesh: ghost,
    material: ghostMaterial,
    life: CFG.memoryTrailLifetime,
    maxLife: CFG.memoryTrailLifetime,
    profile
  });

  if (memoryTrailSystem.lastCapturePosition) {
    const spline = createMemoryTrailSpline(
      memoryTrailSystem.lastCapturePosition,
      data.position,
      profile.lineColor
    );
    memoryTrailSystem.group.add(spline.line);
    memoryTrailSystem.splines.push(spline);
  }

  memoryTrailSystem.lastCaptureProgress = currentProgress;
  memoryTrailSystem.lastCaptureIndex = idx;
  memoryTrailSystem.lastCapturePosition = data.position.clone();
  memoryTrailSystem.lastCaptureQuaternion = data.quaternion.clone();

  while (
    memoryTrailSystem.ghosts.length + memoryTrailSystem.splines.length >
    CFG.memoryTrailMaxItems * 2
  ) {
    if (memoryTrailSystem.ghosts.length) {
      const g = memoryTrailSystem.ghosts.shift();
      memoryTrailSystem.group.remove(g.mesh);
      g.material.dispose();
      g.mesh.geometry.dispose();
    }
    if (memoryTrailSystem.splines.length) {
      const s = memoryTrailSystem.splines.shift();
      memoryTrailSystem.group.remove(s.line);
      s.material.dispose();
      s.geometry.dispose();
    }
  }
}

function createMemoryTrailSpline(from, to, color) {
  const points = 22;
  const positions = new Float32Array(points * 3);

  const p0 = from.clone();
  const p2 = to.clone();
  const ctrl = from.clone().lerp(to, 0.5);
  ctrl.y += THREE.MathUtils.clamp(from.distanceTo(to) * 0.18, 0.22, 0.75);

  for (let i = 0; i < points; i += 1) {
    const t = i / (points - 1);
    quadraticBezier(p0, ctrl, p2, t, working.vA);
    const n = i * 3;
    positions[n] = working.vA.x;
    positions[n + 1] = working.vA.y;
    positions[n + 2] = working.vA.z;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  const material = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity: 0.18,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: true,
    toneMapped: false
  });

  const line = new THREE.Line(geometry, material);
  line.renderOrder = 5;
  line.frustumCulled = false;

  return {
    line,
    geometry,
    material,
    life: CFG.memoryTrailLifetime * 0.92,
    maxLife: CFG.memoryTrailLifetime * 0.92
  };
}

function updateMemoryTrails(delta, elapsed) {
  for (let i = memoryTrailSystem.ghosts.length - 1; i >= 0; i -= 1) {
    const g = memoryTrailSystem.ghosts[i];
    g.life -= delta;

    if (g.life <= 0) {
      memoryTrailSystem.group.remove(g.mesh);
      g.material.dispose();
      g.mesh.geometry.dispose();
      memoryTrailSystem.ghosts.splice(i, 1);
      continue;
    }

    const t = g.life / g.maxLife;
    g.material.opacity = 0.22 * t * t;
    g.mesh.scale.setScalar(1 + (1 - t) * 0.1);
    g.mesh.position.z += Math.sin(elapsed * 1.7 + i) * 0.0005;
  }

  for (let i = memoryTrailSystem.splines.length - 1; i >= 0; i -= 1) {
    const s = memoryTrailSystem.splines[i];
    s.life -= delta;

    if (s.life <= 0) {
      memoryTrailSystem.group.remove(s.line);
      s.material.dispose();
      s.geometry.dispose();
      memoryTrailSystem.splines.splice(i, 1);
      continue;
    }

    const t = s.life / s.maxLife;
    s.material.opacity = 0.18 * t * t;
  }
}

function updateLabels() {
  const width = window.innerWidth;
  const height = window.innerHeight;

  flagEntries.forEach((entry, index) => {
    entry.labelAnchor.getWorldPosition(working.vB);
    working.vB.project(camera);

    const distance = entry.group.position.distanceTo(camera.position);
    const titleFade = 1.0 - smoothstep(CFG.titleFadeStart, CFG.titleFadeEnd, distance);
    const titleScale = THREE.MathUtils.lerp(CFG.titleScaleFar, CFG.titleScaleNear, titleFade);

    const visible =
      working.vB.z < 1 &&
      working.vB.z > -1 &&
      entry.group.visible &&
      titleFade > 0.02;

    if (!visible) {
      if (entry.labelNode) entry.labelNode.style.opacity = "0";
      return;
    }

    const x = (working.vB.x * 0.5 + 0.5) * width;
    const y = (-working.vB.y * 0.5 + 0.5) * height;

    if (entry.labelNode) {
      const breachBonus = entry.breachValue * 0.95;
      const scanBonus = scanState.active && scanState.targetIndex === index ? 0.22 : 0;
      const glitchMix =
        (1 - entry.hoverValue) * (0.55 + audioReactiveLevel * 0.90) + breachBonus - scanBonus;

      entry.labelNode.style.opacity = `${titleFade}`;
      entry.labelNode.style.transform =
        `translate(calc(${x}px - 100%), calc(${y}px - 50%)) scale(${titleScale})`;
      entry.labelNode.style.setProperty("--label-glitch", THREE.MathUtils.clamp(glitchMix, 0, 2).toFixed(3));
      entry.labelNode.style.setProperty("--label-audio", (audioReactiveLevel + breachBonus * 0.3).toFixed(3));

      if ((entry.hoverValue > 0.55 && entry.breachValue < 0.18) || (scanState.active && scanState.targetIndex === index)) {
        entry.labelNode.classList.add("is-resolved");
      } else {
        entry.labelNode.classList.remove("is-resolved");
      }
    }

    if (breachState.active && breachState.index === index) {
      updateActiveNode(entry);
    }
  });
}

function updateIntersections() {
  if (!hasEntered) return;

  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(
    flagEntries.map((entry) => entry.flag),
    false
  );

  hoveredEntry = null;

  if (hits.length > 0) {
    const hit = hits[0];
    hoveredEntry = flagEntries.find((entry) => entry.flag === hit.object) || null;
  }

  renderer.domElement.style.cursor = hoveredEntry ? "pointer" : "grab";
}

function getRepairTargetEntry() {
  if (breachState.active && breachState.index >= 0 && breachState.index < flagEntries.length) {
    return flagEntries[breachState.index];
  }
  return hoveredEntry;
}

function updateFog(elapsed) {
  fogSprites.forEach((fogObj, index) => {
    const data = fogObj.userData;

    const orbitAngle =
      data.baseAngle +
      elapsed * data.orbitSpeed +
      Math.sin(elapsed * 0.16 + data.phase) * 0.12;

    const radius =
      data.baseRadius +
      Math.sin(elapsed * data.driftSpeed + data.phase) * data.driftAmount;

    const y =
      data.baseY +
      Math.sin(elapsed * (data.driftSpeed * 1.7) + index) * 0.08;

    fogObj.position.set(
      Math.cos(orbitAngle) * radius,
      y,
      Math.sin(orbitAngle) * radius
    );

    const pulse = 0.96 + Math.sin(elapsed * (data.driftSpeed * 2) + data.phase) * 0.04;
    fogObj.scale.set(data.scale * pulse, data.scale * 0.60 * pulse, 1);
  });
}

function updateBinaryModel(elapsed) {
  if (!centralModel || !modelGlyphMaterial) return;

  const scanSlow = 1 - scanState.strength * 0.3;
  centralModel.rotation.y = CFG.modelYaw + Math.sin(elapsed * 0.30 * scanSlow) * 0.018;
  modelGlyphMaterial.uniforms.uTime.value = elapsed * scanSlow;
  modelGlyphMaterial.uniforms.uAudioPulse.value = audioReactiveLevel + breachState.strength * 0.08;
}

function applyCategoryBehavior(profile, targetPos, controlPos, cover, seed, elapsed, t) {
  switch (profile.key) {
    case "animation":
      controlPos.y += Math.sin(elapsed * 2.1 + seed * 40.0 + t * 8.0) * profile.wobble;
      controlPos.addScaledVector(cover.right, Math.sin(elapsed * 1.8 + seed * 55.0) * 0.03);
      break;

    case "game":
      controlPos.addScaledVector(cover.right, Math.sign(Math.sin(seed * 100.0)) * 0.022);
      controlPos.y += Math.sin(elapsed * 6.2 + seed * 70.0) * 0.008;
      break;

    case "design":
      controlPos.y *= 0.998;
      targetPos.y = Math.round(targetPos.y * 12.0) / 12.0;
      break;

    case "vfx":
      controlPos.addScaledVector(cover.up, Math.sin(elapsed * 4.8 + seed * 64.0 + t * 7.0) * 0.03);
      controlPos.addScaledVector(cover.right, Math.cos(elapsed * 3.6 + seed * 52.0) * 0.025);
      break;

    default:
      break;
  }
}

function updateStreamParticles(delta, elapsed) {
  if (!streamSystem.points || !centralModel || !modelSampleData || modelSampleData.positions.length === 0) return;

  const hoveredIndex = hoveredEntry ? flagEntries.indexOf(hoveredEntry) : -1;
  const repairEntry = getRepairTargetEntry();
  const repairIndex = repairEntry ? flagEntries.indexOf(repairEntry) : -1;
  const activeIndex = activeEntry ? flagEntries.indexOf(activeEntry) : -1;
  const repairVisible = repairIndex !== -1 ? coverWorldData[repairIndex].visible : false;
  const samplePositions = modelSampleData.positions;
  const sampleCount = modelSampleData.positions.length / 3;
  const deepScanEntry = getDeepScanEntry();
  const deepScanIndex = deepScanEntry ? flagEntries.indexOf(deepScanEntry) : -1;

  centralModel.getWorldPosition(tempVec3);

  for (let i = 0; i < streamSystem.count; i += 1) {
    const originalCoverIndex = streamSystem.coverIndex[i];
    const siphonRatio = breachState.active ? CFG.hoverBorrowRatio * 2.2 : CFG.hoverBorrowRatio;
    const borrowedToRepair = repairVisible && streamSystem.seeds[i] < siphonRatio;
    const effectiveCoverIndex = borrowedToRepair ? repairIndex : originalCoverIndex;
    const cover = coverWorldData[effectiveCoverIndex];
    const targetEntry = flagEntries[effectiveCoverIndex];
    const profile = targetEntry?.category ?? CATEGORY_PROFILES.default;

    const isRepairCover = repairIndex === effectiveCoverIndex;
    const isActiveCover = activeIndex === effectiveCoverIndex;
    const isHoveredVisual = hoveredIndex === effectiveCoverIndex;
    const isDeepScanTarget = deepScanIndex === effectiveCoverIndex;

    let focus = 0.20;
    if (isActiveCover) focus = 0.32;
    if (isRepairCover) focus = borrowedToRepair
      ? (breachState.active ? 0.96 : 0.54)
      : (breachState.active ? 0.82 : 0.46);
    if (isDeepScanTarget) focus += 0.18;
    if (!cover.visible) focus *= 0.35;

    let flowSpeed = delta * streamSystem.speed[i] * profile.speed;
    if (scanState.strength > 0.01) {
      flowSpeed *= isDeepScanTarget ? 0.82 : 0.58;
    }

    streamSystem.progress[i] += flowSpeed * (0.55 + focus * 1.06 + audioReactiveLevel * 0.26);

    if (streamSystem.progress[i] > 1.0) {
      streamSystem.progress[i] -= 1.0;
      streamSystem.sourceIndex[i] = Math.floor(Math.random() * sampleCount);
      streamSystem.spreadX[i] = Math.random() * 2 - 1;
      streamSystem.spreadY[i] = Math.random() * 2 - 1;
    }

    const sourceOffset = streamSystem.sourceIndex[i] * 3;
    tempVec1.set(
      samplePositions[sourceOffset],
      samplePositions[sourceOffset + 1],
      samplePositions[sourceOffset + 2]
    );
    centralModel.localToWorld(tempVec1);

    const spread = (
      isRepairCover
        ? THREE.MathUtils.lerp(0.20, breachState.active ? 0.10 : 0.12, focus)
        : THREE.MathUtils.lerp(0.18, 0.050, focus)
    ) * profile.spread;

    tempVec2.copy(cover.position)
      .addScaledVector(cover.right, streamSystem.spreadX[i] * spread)
      .addScaledVector(cover.up, streamSystem.spreadY[i] * spread);

    tempVec4.copy(tempVec1).sub(tempVec3).normalize();
    const outwardBase = isRepairCover
      ? THREE.MathUtils.lerp(0.24, 0.13, focus)
      : THREE.MathUtils.lerp(0.34, 0.12, focus);

    const outward = outwardBase * profile.curve;

    working.vE.copy(tempVec1).lerp(tempVec2, isRepairCover ? 0.34 : 0.32);
    working.vE.addScaledVector(tempVec4, outward);
    working.vE.y += 0.08 + focus * (breachState.active ? 0.15 : 0.09);
    working.vE.addScaledVector(
      cover.right,
      streamSystem.spreadX[i] * (isRepairCover ? (breachState.active ? 0.06 : 0.03) : 0.02)
    );

    const t = smootherstep(streamSystem.progress[i]);
    applyCategoryBehavior(profile, tempVec2, working.vE, cover, streamSystem.seeds[i], elapsed, t);
    quadraticBezier(tempVec1, working.vE, tempVec2, t, working.vD);

    const posOffset = i * 3;
    streamSystem.positions[posOffset] = working.vD.x;
    streamSystem.positions[posOffset + 1] = working.vD.y;
    streamSystem.positions[posOffset + 2] = working.vD.z;

    streamSystem.flowT[i] = t;

    const fadeIn = smooth01(Math.min(1, t / 0.16));
    const fadeOut = 1 - smooth01(Math.max(0, (t - 0.72) / 0.28));
    const shimmer = 0.90 + 0.10 * Math.sin(elapsed * (0.8 + streamSystem.seeds[i] * 1.2) + streamSystem.seeds[i] * 60.0);

    let alphaBase = (0.06 + focus * 0.50 + audioReactiveLevel * 0.08) * profile.alpha;
    if (isRepairCover && breachState.active) alphaBase += 0.20;
    if (isHoveredVisual && !breachState.active) alphaBase += 0.03;
    if (scanState.strength > 0.01 && !isDeepScanTarget) alphaBase *= 0.68;

    streamSystem.alphas[i] =
      alphaBase *
      fadeIn *
      fadeOut *
      shimmer;
  }

  streamSystem.geometry.attributes.position.needsUpdate = true;
  streamSystem.geometry.attributes.aAlpha.needsUpdate = true;
  streamSystem.geometry.attributes.aFlowT.needsUpdate = true;
  streamGlyphMaterial.uniforms.uTime.value = elapsed * (1 - scanState.strength * 0.16);
  streamGlyphMaterial.uniforms.uAudioPulse.value = audioReactiveLevel + breachState.strength * 0.10;
}

function updateFocusTunnel(delta, elapsed) {
  if (
    !focusTunnelSystem.points ||
    !centralModel ||
    !modelSampleData ||
    modelSampleData.positions.length === 0
  ) return;

  const repairEntry = getRepairTargetEntry();
  const repairIndex = repairEntry ? flagEntries.indexOf(repairEntry) : -1;
  const samplePositions = modelSampleData.positions;
  const sampleCount = modelSampleData.positions.length / 3;

  if (repairIndex === -1 || !coverWorldData[repairIndex].visible) {
    focusTunnelSystem.visibility = THREE.MathUtils.lerp(focusTunnelSystem.visibility, 0, 0.10);

    for (let i = 0; i < focusTunnelSystem.count; i += 1) {
      focusTunnelSystem.alphas[i] *= 0.86;
    }

    focusTunnelSystem.geometry.attributes.aAlpha.needsUpdate = true;

    if (focusTunnelGlyphMaterial) {
      focusTunnelGlyphMaterial.uniforms.uTime.value = elapsed;
      focusTunnelGlyphMaterial.uniforms.uAudioPulse.value = audioReactiveLevel;
      focusTunnelGlyphMaterial.uniforms.uVisibility.value = focusTunnelSystem.visibility;
    }

    return;
  }

  const entry = flagEntries[repairIndex];
  const profile = entry.category;
  const cover = coverWorldData[repairIndex];
  const hoverStrength = hoveredEntry ? hoveredEntry.hoverValue : 0;
  const targetStrength = breachState.active ? breachState.strength : hoverStrength;

  focusTunnelSystem.visibility = THREE.MathUtils.lerp(
    focusTunnelSystem.visibility,
    targetStrength,
    0.14
  );

  centralModel.getWorldPosition(tempVec3);

  for (let i = 0; i < focusTunnelSystem.count; i += 1) {
    let dt = delta * focusTunnelSystem.speed[i] * profile.speed;
    if (scanState.strength > 0.01 && !breachState.active) dt *= 0.78;
    focusTunnelSystem.progress[i] += dt * (0.95 + targetStrength * 1.25 + audioReactiveLevel * 0.65);

    if (focusTunnelSystem.progress[i] > 1.0) {
      focusTunnelSystem.progress[i] -= 1.0;
      focusTunnelSystem.sourceIndex[i] = Math.floor(Math.random() * sampleCount);
      focusTunnelSystem.laneAngle[i] = Math.random() * Math.PI * 2;
      focusTunnelSystem.radiusJitter[i] = 0.70 + Math.random() * 0.60;
    }

    const sourceOffset = focusTunnelSystem.sourceIndex[i] * 3;
    tempVec1.set(
      samplePositions[sourceOffset],
      samplePositions[sourceOffset + 1],
      samplePositions[sourceOffset + 2]
    );
    centralModel.localToWorld(tempVec1);

    tempVec2.copy(cover.position);
    tempVec4.copy(tempVec1).sub(tempVec3).normalize();

    const p0 = tempVec1;
    const p3 = tempVec2;

    const p1 = working.vA.copy(p0).lerp(p3, 0.22)
      .addScaledVector(tempVec4, 0.10 * profile.curve)
      .setY(working.vA.y + 0.14 + targetStrength * 0.05);

    const p2 = working.vB.copy(p0).lerp(p3, 0.74)
      .addScaledVector(cover.up, (0.16 + targetStrength * 0.06) * profile.curve)
      .addScaledVector(cover.right, Math.sin(focusTunnelSystem.laneAngle[i]) * 0.05 * profile.spread);

    const t = smootherstep(focusTunnelSystem.progress[i]);
    cubicBezier(p0, p1, p2, p3, t, working.vC);

    const tunnelRadius =
      CFG.focusTunnelRadius *
      focusTunnelSystem.radiusJitter[i] *
      Math.sin(t * Math.PI) *
      (breachState.active ? 0.72 + targetStrength * 0.54 : 0.46 + targetStrength * 0.38) *
      profile.spread;

    const swirl =
      focusTunnelSystem.laneAngle[i] +
      elapsed * (1.0 + focusTunnelSystem.seeds[i] * 0.8) +
      t * CFG.focusTunnelTwist;

    working.vD.copy(working.vC)
      .addScaledVector(cover.right, Math.cos(swirl) * tunnelRadius)
      .addScaledVector(cover.up, Math.sin(swirl) * tunnelRadius * 0.72);

    if (profile.key === "animation") {
      working.vD.addScaledVector(cover.right, Math.sin(elapsed * 2.0 + focusTunnelSystem.seeds[i] * 40.0) * 0.015);
    } else if (profile.key === "vfx") {
      working.vD.addScaledVector(cover.up, Math.cos(elapsed * 5.0 + focusTunnelSystem.seeds[i] * 55.0) * 0.012);
    }

    const posOffset = i * 3;
    focusTunnelSystem.positions[posOffset] = working.vD.x;
    focusTunnelSystem.positions[posOffset + 1] = working.vD.y;
    focusTunnelSystem.positions[posOffset + 2] = working.vD.z;

    focusTunnelSystem.flowT[i] = t;

    const fadeIn = smooth01(Math.min(1, t / 0.08));
    const fadeOut = 1 - smooth01(Math.max(0, (t - 0.80) / 0.20));
    const pulse = 0.90 + 0.10 * Math.sin(elapsed * (1.8 + focusTunnelSystem.seeds[i] * 1.1) + focusTunnelSystem.seeds[i] * 90.0);

    focusTunnelSystem.alphas[i] =
      ((breachState.active ? 0.18 + targetStrength * 0.88 : 0.08 + targetStrength * 0.56) * profile.alpha) *
      fadeIn *
      fadeOut *
      pulse;
  }

  focusTunnelSystem.geometry.attributes.position.needsUpdate = true;
  focusTunnelSystem.geometry.attributes.aAlpha.needsUpdate = true;
  focusTunnelSystem.geometry.attributes.aFlowT.needsUpdate = true;

  if (focusTunnelGlyphMaterial) {
    focusTunnelGlyphMaterial.uniforms.uTime.value = elapsed * (1 - scanState.strength * 0.12);
    focusTunnelGlyphMaterial.uniforms.uAudioPulse.value = audioReactiveLevel + breachState.strength * 0.08;
    focusTunnelGlyphMaterial.uniforms.uVisibility.value = focusTunnelSystem.visibility;
  }
}

function resolveItemIndex(ref) {
  if (typeof ref === "number") {
    return ref >= 0 && ref < ORBIT_ITEMS.length ? ref : -1;
  }

  if (typeof ref !== "string") return -1;

  const lower = ref.trim().toLowerCase();
  return ORBIT_ITEMS.findIndex((item) => {
    return (
      (item.title && item.title.toLowerCase() === lower) ||
      (item.href && item.href.toLowerCase() === lower) ||
      (item.id && String(item.id).toLowerCase() === lower)
    );
  });
}

function getRelatedIndices(index) {
  const item = ORBIT_ITEMS[index];
  const result = [];
  const used = new Set([index]);

  const add = (idx) => {
    if (idx < 0 || idx >= ORBIT_ITEMS.length) return;
    if (used.has(idx)) return;
    used.add(idx);
    result.push(idx);
  };

  if (Array.isArray(item.relatedIndices)) {
    item.relatedIndices.forEach(add);
  }

  if (Array.isArray(item.related)) {
    item.related.forEach((ref) => add(resolveItemIndex(ref)));
  }

  if (item.theme) {
    ORBIT_ITEMS.forEach((other, idx) => {
      if (idx === index) return;
      if (other.theme && other.theme === item.theme) add(idx);
    });
  }

  add(index - 1);
  add(index + 1);
  add(index - 2);
  add(index + 2);

  return result.slice(0, CFG.relationMaxLines);
}

function updateRelationLines(elapsed) {
  if (!relationSystem.lines.length) return;

  const focusEntry =
    getDeepScanEntry() ||
    hoveredEntry ||
    (breachState.active && breachState.index >= 0 ? flagEntries[breachState.index] : null);

  if (!focusEntry) {
    relationSystem.lines.forEach((l) => {
      l.material.opacity = THREE.MathUtils.lerp(l.material.opacity, 0, 0.12);
      l.geometry.setDrawRange(0, 0);
    });
    return;
  }

  const sourceIndex = flagEntries.indexOf(focusEntry);
  if (sourceIndex === -1) return;

  const sourceProfile = focusEntry.category;
  const related = getRelatedIndices(sourceIndex);
  const source = coverWorldData[sourceIndex];
  const visibleRelated = related.filter((idx) => coverWorldData[idx]?.visible);

  relationSystem.lines.forEach((entry, i) => {
    if (i >= visibleRelated.length) {
      entry.material.opacity = THREE.MathUtils.lerp(entry.material.opacity, 0, 0.18);
      entry.geometry.setDrawRange(0, 0);
      return;
    }

    const targetIndex = visibleRelated[i];
    const targetEntry = flagEntries[targetIndex];
    const target = coverWorldData[targetIndex];
    const points = CFG.relationLinePoints;

    const p0 = working.vA.copy(source.position);
    const p3 = working.vB.copy(target.position);

    const span = p0.distanceTo(p3);
    const liftBase = THREE.MathUtils.clamp(span * 0.16, 0.24, 0.82);
    const lift = liftBase * (scanState.active ? 1.3 : 1.0);

    const p1 = working.vC.copy(p0).lerp(p3, 0.28);
    p1.y += lift;
    p1.addScaledVector(source.right, 0.10);

    const p2 = working.vD.copy(p0).lerp(p3, 0.72);
    p2.y += lift;
    p2.addScaledVector(target.right, -0.10);

    for (let j = 0; j < points; j += 1) {
      const t = j / (points - 1);
      cubicBezier(p0, p1, p2, p3, t, working.vE);

      const n = j * 3;
      entry.positions[n] = working.vE.x;
      entry.positions[n + 1] = working.vE.y + Math.sin(elapsed * 1.4 + t * 6.283 + i) * 0.006 * (scanState.active ? 1.4 : 1.0);
      entry.positions[n + 2] = working.vE.z;
    }

    entry.geometry.attributes.position.needsUpdate = true;
    entry.geometry.setDrawRange(0, points);

    const pulse = 0.5 + 0.5 * Math.sin(elapsed * 1.8 + i * 0.7);
    const baseOpacity = breachState.active ? 0.18 : scanState.active ? 0.18 : 0.10;
    entry.material.opacity = THREE.MathUtils.lerp(entry.material.opacity, baseOpacity + pulse * 0.05, 0.16);
    entry.material.color.copy(targetEntry.category.lineColor || sourceProfile.lineColor);
  });
}

function updateDebugTerminal(elapsed) {
  if (!hasEntered || !debugTerminalLog) return;

  const hoveredKey = hoveredEntry ? getNodeTag(hoveredEntry) : "";
  const activeKey = activeEntry ? getNodeTag(activeEntry) : "";

  if (hoveredKey !== lastHoveredDebugKey) {
    if (hoveredKey) {
      pushDebugEvent(`node corruption detected :: ${hoveredKey}`, "WARN");
      pushDebugEvent(`relation map expanded :: ${hoveredKey}`, "NET");
    } else if (lastHoveredDebugKey) {
      pushDebugEvent(`asset integrity restored :: ${lastHoveredDebugKey}`, "OK");
    }
    lastHoveredDebugKey = hoveredKey;
  }

  if (scanState.active && scanState.targetIndex >= 0) {
    const entry = flagEntries[scanState.targetIndex];
    if (entry && scanState.strength > 0.86 && lastActiveDebugKey !== `scan-${scanState.targetIndex}`) {
      pushDebugEvent(`deep scan lock acquired :: ${getNodeTag(entry)}`, "SCAN");
      lastActiveDebugKey = `scan-${scanState.targetIndex}`;
    }
  }

  if (activeKey && activeKey !== lastActiveDebugKey && !scanState.active) {
    pushDebugEvent(`tracking orbit node :: ${activeKey}`, "LOCK");
    lastActiveDebugKey = activeKey;
  }

  if (nextDebugEventAt === 0) {
    nextDebugEventAt = elapsed + 1.8;
  }

  if (elapsed >= nextDebugEventAt) {
    const evt = buildAmbientDebugEvent();
    pushDebugEvent(evt.message, evt.level);
    nextDebugEventAt = elapsed + THREE.MathUtils.randFloat(1.35, 3.40);
  }
}

function buildAmbientDebugEvent() {
  const hoveredKey = hoveredEntry ? getNodeTag(hoveredEntry) : "";
  const activeKey = activeEntry ? getNodeTag(activeEntry) : "";

  const pool = [];

  if (hoveredKey) {
    pool.push({ level: "FLOW", message: `packet density increased :: ${hoveredKey}` });
    pool.push({ level: "NET", message: `linked node graph visible :: ${hoveredKey}` });
    pool.push({ level: "FLOW", message: `decode lattice tightening :: ${hoveredKey}` });
  }

  if (scanState.active && scanState.targetIndex >= 0) {
    pool.push({ level: "SCAN", message: `deep scan metadata resolved :: ${getNodeTag(flagEntries[scanState.targetIndex])}` });
    pool.push({ level: "SYS", message: "ambient packet traffic slowed for analysis" });
  }

  if (breachState.active && breachState.index >= 0) {
    pool.push({ level: "ALRT", message: `breach cascade contained :: ${getNodeTag(flagEntries[breachState.index])}` });
    pool.push({ level: "FLOW", message: `repair beam locked to failing node` });
  }

  if (activeKey) {
    pool.push({ level: "LOCK", message: `nearest node stable :: ${activeKey}` });
  }

  pool.push({ level: "SYS", message: "scanline jitter within tolerance" });
  pool.push({ level: "SYS", message: "cover shader resolve pass stable" });
  pool.push({ level: "SYS", message: "binary glyph atlas cycling cleanly" });
  pool.push({ level: "OK", message: "asset integrity handshake confirmed" });
  pool.push({ level: "SYS", message: "micro-flicker synced to ambient bed" });
  pool.push({ level: "SYS", message: "packet harmonics recalibrated" });
  pool.push({ level: "SYS", message: `audio pulse ${(audioReactiveLevel * 100).toFixed(0)}%` });

  return pool[Math.floor(Math.random() * pool.length)];
}

function pushDebugEvent(message, level = "SYS") {
  if (!debugTerminalLog) return;

  const line = document.createElement("div");
  line.className = "debug-terminal__line";
  line.innerHTML = `
    <span class="debug-terminal__time">${formatDebugClock()}</span>
    <span class="debug-terminal__level">${level}</span>
    <span class="debug-terminal__msg">${message}</span>
  `;

  debugTerminalLog.prepend(line);

  while (debugTerminalLog.children.length > 12) {
    debugTerminalLog.removeChild(debugTerminalLog.lastElementChild);
  }

  if (debugTerminal) {
    debugTerminal.classList.add("is-live");
  }
}

function formatDebugClock() {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

function getNodeTag(entry) {
  const index = flagEntries.indexOf(entry);
  return `node://${String(index + 1).padStart(2, "0")}`;
}

function quadraticBezier(a, b, c, t, out) {
  const inv = 1 - t;
  out.set(
    inv * inv * a.x + 2 * inv * t * b.x + t * t * c.x,
    inv * inv * a.y + 2 * inv * t * b.y + t * t * c.y,
    inv * inv * a.z + 2 * inv * t * b.z + t * t * c.z
  );
  return out;
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

function smooth01(x) {
  const t = THREE.MathUtils.clamp(x, 0, 1);
  return t * t * (3 - 2 * t);
}

function smoothstep(edge0, edge1, x) {
  const t = THREE.MathUtils.clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

function smootherstep(x) {
  const t = THREE.MathUtils.clamp(x, 0, 1);
  return t * t * t * (t * (t * 6 - 15) + 10);
}