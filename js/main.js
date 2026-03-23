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
  fogSpriteCount: 1,

  modelPointLimit: 8000,
  streamPerCover: 100,

  hoverBorrowRatio: 0.12,
  focusTunnelParticles: 480,
  focusTunnelTwist: 13.2,
  focusTunnelRadius: 0.064,

  breachMinInterval: 10.0,
  breachMaxInterval: 18.0,
  breachDuration: 4.25,

  relationMaxLines: 5,
  relationLinePoints: 26,

  idleDelay: 8.0,
  idleOrbitSpeed: 0.018,
  idleBobAmount: 0.055,
  idlePromptDelay: 8.0,

  modelIdleSwapMin: 5.4,
  modelIdleSwapMax: 8.6,
  fastOrbitInputWindow: 0.24,
  fastOrbitInputThreshold: 0.095,
  fastOrbitVelocityThreshold: 0.9,
  fastOrbitWheelRawThreshold: 180,
  fastOrbitTouchRawThreshold: 54,
  fastOrbitCooldown: 1.8
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

const MODEL_REACTION_ANIMATION = "Search Pockets";
const MODEL_IDLE_ANIMATION_PREFERENCES = [
  "Look Hands",
  "Dance",
  "Search"
];
const MODEL_MAX_IDLE_ANIMATIONS = 2;
const MODEL_ANIMATION_FADE = 0.30;
const MODEL_NORMAL_SAMPLE_OFFSET = 0.01;

const INTRO_CFG = {
  flyDistance: 3.9,
  flyLift: 0.72,
  flyDuration: 2.6,
  holdDuration: 1.0,
  revealDuration: 1.05,
  promptAppearAt: 0.68,
  modelFaceOffset: Math.PI
};

const canvas = document.getElementById("webgl");
const appRoot = document.getElementById("app") || document.body;
const loaderOverlay = document.getElementById("loader");
const progressFill = document.getElementById("progressFill");
const progressText = document.getElementById("progressText");
const enterButton = document.getElementById("enterButton");
const introPrompt = document.getElementById("introPrompt");
const experienceUi = document.getElementById("experienceUi");
const labelsRoot = document.getElementById("folderLabels");
const focusHint = document.getElementById("focusHint");
const idlePrompt = document.getElementById("idlePrompt");
const quickNav = document.getElementById("quickNav");
const labelConnectors = document.getElementById("labelConnectors");
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
let lastInteractionAt = 0;
let idleMode = false;
let idleDirection = 1;

let centralModel = null;
let centralModelMixer = null;
let centralModelAnimationClips = [];
let centralModelAnimationActions = [];
let currentModelAnimationIndex = -1;
let currentModelAnimationRole = "none";
let modelIdleAnimationIndices = [];
let modelReactionAnimationIndex = -1;
let modelIdleAnimationCursor = 0;
let nextModelIdleSwapAt = 0;
let modelReactionCooldownUntil = 0;
let recentOrbitInputAt = -Infinity;
let recentOrbitInputStrength = 0;
let recentOrbitInputRaw = 0;
let recentOrbitInputKind = "wheel";
let previousOrbitProgress = 0;

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
const tempMatrix3 = new THREE.Matrix3();

const flagEntries = [];
const quickNavButtons = [];
const fogSprites = [];
const missingAssets = [];

const introState = {
  active: false,
  revealing: false,
  complete: false,
  startedAt: 0,
  revealStartedAt: 0,
  startPos: new THREE.Vector3(),
  endPos: new THREE.Vector3()
};

let introCoverOpacity = 1;

const coverWorldData = ORBIT_ITEMS.map(() => ({
  position: new THREE.Vector3(),
  right: new THREE.Vector3(1, 0, 0),
  up: new THREE.Vector3(0, 1, 0),
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
  buildQuickNav();
  buildRelationSystem();
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

    const connectorGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    connectorGroup.setAttribute("class", "label-connector-group");
    connectorGroup.style.opacity = "0";
    connectorGroup.style.setProperty("--connector-color", PALETTE[index % PALETTE.length].getStyle());

    const connectorGlow = document.createElementNS("http://www.w3.org/2000/svg", "path");
    connectorGlow.setAttribute("class", "label-connector label-connector--glow");

    const connectorCore = document.createElementNS("http://www.w3.org/2000/svg", "path");
    connectorCore.setAttribute("class", "label-connector label-connector--core");

    const connectorStartNode = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    connectorStartNode.setAttribute("class", "label-connector__node label-connector__node--cover");
    connectorStartNode.setAttribute("r", "2.6");

    const connectorMidNode = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    connectorMidNode.setAttribute("class", "label-connector__node label-connector__node--junction");
    connectorMidNode.setAttribute("r", "1.9");

    const connectorEndNode = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    connectorEndNode.setAttribute("class", "label-connector__node label-connector__node--label");
    connectorEndNode.setAttribute("r", "2.2");

    const connectorPulse = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    connectorPulse.setAttribute("class", "label-connector__pulse");
    connectorPulse.setAttribute("r", "2.1");

    connectorGroup.append(
      connectorGlow,
      connectorCore,
      connectorStartNode,
      connectorMidNode,
      connectorEndNode,
      connectorPulse
    );
    labelConnectors?.appendChild(connectorGroup);

    flagEntries.push({
      item,
      group,
      flag,
      material: mat,
      labelAnchor,
      labelNode,
      connectorGroup,
      connectorGlow,
      connectorCore,
      connectorStartNode,
      connectorMidNode,
      connectorEndNode,
      connectorPulse,
      hoverValue: 0,
      breachValue: 0
    });
  });
}


function setIdlePromptVisible(visible) {
  if (!idlePrompt) return;
  idlePrompt.classList.toggle("is-visible", visible);
}

function registerInteraction() {
  lastInteractionAt = clock.elapsedTime;
  idleMode = false;
  setIdlePromptVisible(false);
}

function setIntroPromptVisible(visible) {
  if (!introPrompt) return;
  introPrompt.classList.toggle("is-visible", visible);
  introPrompt.setAttribute("aria-hidden", visible ? "false" : "true");
}

function setIntroSceneVisibility(visible) {
  const resolved = Boolean(visible);

  if (streamSystem.points) {
    streamSystem.points.visible = resolved;
  }

  if (focusTunnelSystem.points) {
    focusTunnelSystem.points.visible = resolved;
  }

  if (relationSystem.group) {
    relationSystem.group.visible = resolved;
  }
}

function orientModelToCamera(targetPosition = camera.position) {
  if (!centralModel) return;

  working.vF.copy(targetPosition);
  working.vF.y = centralModel.position.y + 0.4;

  centralModel.lookAt(working.vF);
  centralModel.rotateY(INTRO_CFG.modelFaceOffset);
}

function setIntroCoverReveal(value) {
  introCoverOpacity = THREE.MathUtils.clamp(value, 0, 1);
}

async function startExperienceSession() {
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
}

async function beginPortfolioIntro() {
  if (!isReady || introState.active || introState.complete) return;

  hasEntered = true;
  introState.active = true;
  introState.revealing = false;
  introState.startedAt = clock.elapsedTime;
  introState.revealStartedAt = 0;

  loaderOverlay?.setAttribute("aria-hidden", "true");
  loaderOverlay?.classList.add("is-hidden");
  document.body.classList.add("is-entered", "intro-active");

  if (experienceUi) {
    experienceUi.setAttribute("aria-hidden", "true");
  }

  registerInteraction();
  setIntroPromptVisible(false);
  setIntroCoverReveal(0);
  setIntroSceneVisibility(false);

  hoveredEntry = null;
  activeEntry = null;
  pointer.set(-10, -10);
  renderer.domElement.style.cursor = "default";

  introState.endPos.copy(camera.position);

  working.vE.copy(introState.endPos).sub(ORBIT_CENTER);
  const introEndY = introState.endPos.y;

  working.vE.y = 0;
  if (working.vE.lengthSq() < 1e-6) {
    working.vE.set(0.001, 0, 1);
  }

  working.vE.normalize().multiplyScalar(CFG.cameraRadius + INTRO_CFG.flyDistance);

  introState.startPos.set(
    ORBIT_CENTER.x + working.vE.x,
    introEndY + INTRO_CFG.flyLift,
    ORBIT_CENTER.z + working.vE.z
  );

  camera.position.copy(introState.startPos);
  camera.lookAt(ORBIT_CENTER);

  await startExperienceSession();
}

function updatePortfolioIntro(elapsed) {
  if (!introState.active) {
    if (introState.complete) {
      setIntroSceneVisibility(true);
      setIntroCoverReveal(1);
    }
    return;
  }

  setIntroSceneVisibility(false);

  const flyProgress = THREE.MathUtils.clamp(
    (elapsed - introState.startedAt) / INTRO_CFG.flyDuration,
    0,
    1
  );
  const flyEase = 1 - Math.pow(1 - flyProgress, 3);

  camera.position.lerpVectors(introState.startPos, introState.endPos, flyEase);
  camera.lookAt(ORBIT_CENTER);

  if (flyProgress >= INTRO_CFG.promptAppearAt) {
    setIntroPromptVisible(true);
  }

  if (!introState.revealing && flyProgress >= 1) {
    introState.revealing = true;
    introState.revealStartedAt = elapsed + INTRO_CFG.holdDuration;
  }

  if (!introState.revealing) {
    return;
  }

  if (elapsed < introState.revealStartedAt) {
    return;
  }

  const revealProgress = THREE.MathUtils.clamp(
    (elapsed - introState.revealStartedAt) / INTRO_CFG.revealDuration,
    0,
    1
  );
  const revealEase = 1 - Math.pow(1 - revealProgress, 3);

  setIntroCoverReveal(revealEase);

  if (revealProgress >= 0.05) {
    document.body.classList.remove("intro-active");
    if (experienceUi) {
      experienceUi.setAttribute("aria-hidden", "false");
    }
  }

  if (revealProgress >= 0.42) {
    setIntroPromptVisible(false);
  }

  if (revealProgress >= 1) {
    introState.active = false;
    introState.complete = true;
    setIntroPromptVisible(false);
    setIntroCoverReveal(1);
    setIntroSceneVisibility(true);
  }
}

function focusEntryByIndex(index) {
  if (!flagEntries.length || introState.active || !introState.complete) return;
  const clampedIndex = THREE.MathUtils.clamp(index, 0, flagEntries.length - 1);
  const total = Math.max(flagEntries.length - 1, 1);
  targetProgress = clampedIndex / total;
  registerInteraction();
}

function buildQuickNav() {
  if (!quickNav) return;

  quickNav.innerHTML = `
    <div class="quick-nav__dock">
      <div class="quick-nav__header">
        <span class="quick-nav__eyebrow">quick access</span>
        <span class="quick-nav__status">node dock</span>
      </div>
      <div class="quick-nav__grid"></div>
      <div class="quick-nav__hint">click a node to focus its cover</div>
    </div>
  `;

  quickNavButtons.length = 0;
  const grid = quickNav.querySelector(".quick-nav__grid");

  ORBIT_ITEMS.forEach((item, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "quick-nav__item";
    button.dataset.index = String(index);
    button.setAttribute("aria-label", `Focus ${item.title}`);
    button.style.setProperty("--nav-accent", PALETTE[index % PALETTE.length].getStyle());
    button.innerHTML = `
      <span class="quick-nav__node">
        <span class="quick-nav__dot"></span>
        <span class="quick-nav__index">${String(index + 1).padStart(2, "0")}</span>
      </span>
      <span class="quick-nav__copy">
        <span class="quick-nav__title">${item.title}</span>
        <span class="quick-nav__subtitle">${item.theme || item.subtitle || "portfolio node"}</span>
      </span>
    `;

    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      focusEntryByIndex(index);
    });

    grid?.appendChild(button);
    quickNavButtons.push(button);
  });
}

function updateQuickNav() {
  if (!quickNavButtons.length) return;

  const hoveredIndex = hoveredEntry ? flagEntries.indexOf(hoveredEntry) : -1;
  const activeIndex = activeEntry ? flagEntries.indexOf(activeEntry) : -1;

  quickNavButtons.forEach((button, index) => {
    const isHovered = index === hoveredIndex;
    const isActive = index === activeIndex;
    button.classList.toggle("is-hovered", isHovered);
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-current", isActive ? "true" : "false");
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

function loadCenterModel() {
  const maybeGltf = typeof ASSETS.modelGLTF === "string" ? ASSETS.modelGLTF.trim() : "";
  const maybeGlb = typeof ASSETS.modelGLB === "string" ? ASSETS.modelGLB.trim() : "";
  const maybeFbx = typeof ASSETS.modelFBX === "string" ? ASSETS.modelFBX.trim() : "";

  if (maybeFbx) {
    loadFBXFallback(maybeFbx, maybeGltf, maybeGlb);
    return;
  }

  if (maybeGltf) {
    loadGLTFFallback(maybeGltf, maybeGlb);
    return;
  }

  if (maybeGlb) {
    loadGlbFallback(maybeGlb);
    return;
  }

  createFallbackModel();
}

function loadGLTFFallback(gltfPath, glbPath = "") {
  gltfLoader.load(
    gltfPath,
    (gltf) => setupLoadedModel(gltf.scene, gltf.animations || []),
    undefined,
    () => {
      if (glbPath) {
        loadGlbFallback(glbPath);
      } else {
        createFallbackModel();
      }
    }
  );
}

function loadGlbFallback(glbPath) {
  gltfLoader.load(
    glbPath,
    (gltf) => setupLoadedModel(gltf.scene, gltf.animations || []),
    undefined,
    () => createFallbackModel()
  );
}

function loadFBXFallback(fbxPath, gltfPath = "", glbPath = "") {
  fbxLoader.load(
    fbxPath,
    (fbx) => setupLoadedModel(fbx, fbx.animations || []),
    undefined,
    () => {
      if (gltfPath) {
        loadGLTFFallback(gltfPath, glbPath);
      } else if (glbPath) {
        loadGlbFallback(glbPath);
      } else {
        createFallbackModel();
      }
    }
  );
}

function setupLoadedModel(modelRoot, animations = []) {
  resetModelAnimationState();

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

  initModelAnimations(centralModel, animations);

  modelSampleData = extractModelSampleData(centralModel, CFG.modelPointLimit);
  buildBinaryModelRepresentation();
  buildStreamSystem();
  buildFocusTunnelSystem();

  centralModel.traverse((child) => {
    if (child.isMesh) child.visible = false;
  });
}

function createFallbackModel() {
  resetModelAnimationState();

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

function resetModelAnimationState() {
  if (centralModelMixer) {
    centralModelMixer.stopAllAction();
    centralModelMixer.removeEventListener("finished", onModelAnimationFinished);
  }

  centralModelMixer = null;
  centralModelAnimationClips = [];
  centralModelAnimationActions = [];
  currentModelAnimationIndex = -1;
  currentModelAnimationRole = "none";
  modelIdleAnimationIndices = [];
  modelReactionAnimationIndex = -1;
  modelIdleAnimationCursor = 0;
  nextModelIdleSwapAt = 0;
  modelReactionCooldownUntil = 0;
  recentOrbitInputAt = -Infinity;
  recentOrbitInputStrength = 0;
  previousOrbitProgress = currentProgress;
}

function normalizeAnimationName(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/[_|]+/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function sortModelAnimationClips(clips) {
  const safeClips = Array.isArray(clips)
    ? clips.filter((clip) => clip && clip.duration > 0)
    : [];

  if (!safeClips.length) return [];

  const ordered = [];
  const used = new Set();
  const preferredOrder = [
    ...MODEL_IDLE_ANIMATION_PREFERENCES,
    MODEL_REACTION_ANIMATION
  ];

  preferredOrder.forEach((targetName) => {
    const target = normalizeAnimationName(targetName);
    const matchIndex = safeClips.findIndex((clip, idx) => {
      if (used.has(idx)) return false;
      return normalizeAnimationName(clip.name).includes(target);
    });

    if (matchIndex !== -1) {
      ordered.push(safeClips[matchIndex]);
      used.add(matchIndex);
    }
  });

  safeClips.forEach((clip, idx) => {
    if (!used.has(idx)) ordered.push(clip);
  });

  return ordered.length ? ordered : safeClips;
}

function pickAnimationIndicesByPreference(clips, names, excludeIndices = []) {
  const excludes = new Set(excludeIndices);
  const result = [];
  const used = new Set();

  names.forEach((name) => {
    const target = normalizeAnimationName(name);
    const idx = clips.findIndex((clip, clipIndex) => {
      if (excludes.has(clipIndex) || used.has(clipIndex)) return false;
      return normalizeAnimationName(clip.name).includes(target);
    });

    if (idx !== -1) {
      result.push(idx);
      used.add(idx);
    }
  });

  clips.forEach((clip, idx) => {
    if (excludes.has(idx) || used.has(idx)) return;
    result.push(idx);
  });

  return result;
}

function scheduleNextIdleAnimationSwap(elapsed = clock.elapsedTime) {
  nextModelIdleSwapAt =
    elapsed + THREE.MathUtils.randFloat(CFG.modelIdleSwapMin, CFG.modelIdleSwapMax);
}

function initModelAnimations(modelRoot, animations = []) {
  const clips = sortModelAnimationClips(
    animations.length ? animations : (Array.isArray(modelRoot.animations) ? modelRoot.animations : [])
  );

  if (!clips.length) return;

  centralModelMixer = new THREE.AnimationMixer(modelRoot);
  centralModelAnimationClips = clips;

  centralModelAnimationActions = clips.map((clip) => {
    const action = centralModelMixer.clipAction(clip);
    action.enabled = true;
    action.clampWhenFinished = true;
    action.zeroSlopeAtStart = true;
    action.zeroSlopeAtEnd = true;
    action.paused = false;
    return action;
  });

  modelReactionAnimationIndex = clips.findIndex((clip) =>
    normalizeAnimationName(clip.name).includes(normalizeAnimationName(MODEL_REACTION_ANIMATION))
  );

  modelIdleAnimationIndices = pickAnimationIndicesByPreference(
    clips,
    MODEL_IDLE_ANIMATION_PREFERENCES,
    modelReactionAnimationIndex >= 0 ? [modelReactionAnimationIndex] : []
  ).slice(0, MODEL_MAX_IDLE_ANIMATIONS);

  if (!modelIdleAnimationIndices.length && clips.length) {
    modelIdleAnimationIndices = clips
      .map((_, idx) => idx)
      .filter((idx) => idx !== modelReactionAnimationIndex)
      .slice(0, MODEL_MAX_IDLE_ANIMATIONS);
  }

  if (!modelIdleAnimationIndices.length && modelReactionAnimationIndex >= 0) {
    modelIdleAnimationIndices = [modelReactionAnimationIndex];
  }

  if (!modelIdleAnimationIndices.length) return;

  centralModelMixer.addEventListener("finished", onModelAnimationFinished);

  modelIdleAnimationCursor = 0;
  playIdleAnimationByCursor(true);
}

function playModelAction(index, options = {}) {
  if (!centralModelAnimationActions.length) return;

  const {
    immediate = false,
    role = "idle",
    loopMode = THREE.LoopRepeat,
    repetitions = Infinity
  } = options;

  const count = centralModelAnimationActions.length;
  const nextIndex = ((index % count) + count) % count;
  const nextAction = centralModelAnimationActions[nextIndex];
  const currentAction =
    currentModelAnimationIndex >= 0
      ? centralModelAnimationActions[currentModelAnimationIndex]
      : null;

  if (
    currentAction === nextAction &&
    currentModelAnimationRole === role &&
    currentAction?.isRunning()
  ) {
    if (loopMode === THREE.LoopRepeat) {
      currentAction.setLoop(loopMode, repetitions);
      currentAction.clampWhenFinished = false;
    }
    return;
  }

  nextAction.reset();
  nextAction.enabled = true;
  nextAction.paused = false;
  nextAction.setLoop(loopMode, repetitions);
  nextAction.clampWhenFinished = loopMode !== THREE.LoopRepeat;
  nextAction.setEffectiveTimeScale(1);
  nextAction.setEffectiveWeight(1);

  if (!currentAction || immediate || currentAction === nextAction) {
    if (currentAction && currentAction !== nextAction) {
      currentAction.stop();
    }
    nextAction.fadeIn(immediate ? 0.12 : MODEL_ANIMATION_FADE).play();
  } else {
    nextAction.play();
    nextAction.crossFadeFrom(currentAction, MODEL_ANIMATION_FADE, false);
  }

  currentModelAnimationIndex = nextIndex;
  currentModelAnimationRole = role;
}

function playIdleAnimationByCursor(immediate = false) {
  if (!modelIdleAnimationIndices.length) return;

  const index = modelIdleAnimationIndices[
    ((modelIdleAnimationCursor % modelIdleAnimationIndices.length) + modelIdleAnimationIndices.length) %
      modelIdleAnimationIndices.length
  ];

  playModelAction(index, {
    immediate,
    role: "idle",
    loopMode: THREE.LoopRepeat,
    repetitions: Infinity
  });

  scheduleNextIdleAnimationSwap(clock.elapsedTime);
}

function playNextIdleAnimation(immediate = false) {
  if (!modelIdleAnimationIndices.length) return;

  if (modelIdleAnimationIndices.length > 1) {
    modelIdleAnimationCursor =
      (modelIdleAnimationCursor + 1) % modelIdleAnimationIndices.length;
  }

  playIdleAnimationByCursor(immediate);
}

function noteOrbitInput(intensity = 0, rawIntensity = 0, kind = "wheel") {
  recentOrbitInputAt = clock.elapsedTime;
  recentOrbitInputKind = kind;
  recentOrbitInputRaw = Math.max(Math.abs(rawIntensity), recentOrbitInputRaw * 0.72);
  recentOrbitInputStrength = Math.min(0.24, recentOrbitInputStrength + Math.abs(intensity));
}

function triggerFastOrbitReaction() {
  if (
    modelReactionAnimationIndex === -1 ||
    !centralModelAnimationActions.length ||
    currentModelAnimationRole === "reaction" ||
    clock.elapsedTime < modelReactionCooldownUntil
  ) {
    return false;
  }

  const reactionClip = centralModelAnimationClips[modelReactionAnimationIndex];
  const cooldownBase = reactionClip?.duration || CFG.fastOrbitCooldown;

  modelReactionCooldownUntil =
    clock.elapsedTime + Math.max(CFG.fastOrbitCooldown, cooldownBase * 0.75);

  playModelAction(modelReactionAnimationIndex, {
    immediate: false,
    role: "reaction",
    loopMode: THREE.LoopOnce,
    repetitions: 1
  });

  pushDebugEvent("orbit overspeed :: search pockets", "WARN");
  return true;
}

function updateModelAnimationState(elapsed, delta) {
  if (!centralModelAnimationActions.length) return;

  recentOrbitInputStrength = THREE.MathUtils.lerp(
    recentOrbitInputStrength,
    0,
    Math.min(1, delta * 6)
  );
  recentOrbitInputRaw = THREE.MathUtils.lerp(
    recentOrbitInputRaw,
    0,
    Math.min(1, delta * 7)
  );

  const orbitVelocity =
    delta > 0 ? Math.abs(currentProgress - previousOrbitProgress) / delta : 0;
  const recentUserOrbit = elapsed - recentOrbitInputAt <= CFG.fastOrbitInputWindow;
  const rawThreshold =
    recentOrbitInputKind === "touch"
      ? CFG.fastOrbitTouchRawThreshold
      : CFG.fastOrbitWheelRawThreshold;

  if (
    recentUserOrbit &&
    recentOrbitInputRaw >= rawThreshold &&
    recentOrbitInputStrength >= CFG.fastOrbitInputThreshold &&
    orbitVelocity >= CFG.fastOrbitVelocityThreshold
  ) {
    triggerFastOrbitReaction();
  }

  previousOrbitProgress = currentProgress;

  if (
    currentModelAnimationRole !== "reaction" &&
    modelIdleAnimationIndices.length > 1 &&
    elapsed >= nextModelIdleSwapAt
  ) {
    playNextIdleAnimation(false);
  }

  if (currentModelAnimationRole === "none" && modelIdleAnimationIndices.length) {
    playIdleAnimationByCursor(true);
  }
}

function onModelAnimationFinished(event) {
  if (!centralModelAnimationActions.length) return;

  const finishedIndex = centralModelAnimationActions.indexOf(event.action);
  if (finishedIndex === -1) return;

  if (
    currentModelAnimationRole === "reaction" &&
    finishedIndex === modelReactionAnimationIndex
  ) {
    playNextIdleAnimation(false);
  }
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
      normals: new Float32Array(),
      restPositions: new Float32Array(),
      restNormals: new Float32Array(),
      meshRefs: [],
      vertexIndices: new Uint32Array(),
      skinnedFlags: new Uint8Array()
    };
  }

  const step = Math.max(1, Math.floor(totalVertices / maxPoints));
  const positions = [];
  const normals = [];
  const restPositions = [];
  const restNormals = [];
  const meshRefs = [];
  const vertexIndices = [];
  const skinnedFlags = [];

  const normalMatrix = new THREE.Matrix3();

  model.traverse((child) => {
    if (!child.isMesh || !child.geometry?.attributes?.position) return;

    const pos = child.geometry.attributes.position;
    const nor = child.geometry.attributes.normal;
    normalMatrix.getNormalMatrix(child.matrixWorld);

    for (let i = 0; i < pos.count; i += step) {
      tempVec1.fromBufferAttribute(pos, i);
      restPositions.push(tempVec1.x, tempVec1.y, tempVec1.z);

      tempVec1.applyMatrix4(child.matrixWorld);
      tempVec1.applyMatrix4(rootInverse);
      positions.push(tempVec1.x, tempVec1.y, tempVec1.z);

      if (nor) {
        tempVec2.fromBufferAttribute(nor, i);
      } else {
        tempVec2.set(0, 1, 0);
      }

      restNormals.push(tempVec2.x, tempVec2.y, tempVec2.z);

      tempVec2.applyMatrix3(normalMatrix).normalize();
      tempVec2.applyQuaternion(invRootQuat).normalize();
      normals.push(tempVec2.x, tempVec2.y, tempVec2.z);

      meshRefs.push(child);
      vertexIndices.push(i);
      skinnedFlags.push(child.isSkinnedMesh ? 1 : 0);
    }
  });

  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    restPositions: new Float32Array(restPositions),
    restNormals: new Float32Array(restNormals),
    meshRefs,
    vertexIndices: new Uint32Array(vertexIndices),
    skinnedFlags: new Uint8Array(skinnedFlags)
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

  const positionAttr = new THREE.BufferAttribute(modelSampleData.positions, 3);
  positionAttr.setUsage(THREE.DynamicDrawUsage);

  const normalAttr = new THREE.BufferAttribute(modelSampleData.normals, 3);
  normalAttr.setUsage(THREE.DynamicDrawUsage);

  geometry.setAttribute("position", positionAttr);
  geometry.setAttribute("aNormal", normalAttr);
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
      if (!hasEntered || introState.active || !introState.complete) return;
      registerInteraction();

      const before = targetProgress;
      targetProgress += event.deltaY * CFG.scrollSpeed;
      targetProgress = THREE.MathUtils.clamp(targetProgress, 0, 1);
      noteOrbitInput(
        Math.abs(targetProgress - before),
        Math.abs(event.deltaY),
        "wheel"
      );
    },
    { passive: true }
  );

  window.addEventListener("pointermove", (event) => {
    const bounds = renderer.domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
    pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;

    if (hasEntered && !introState.active && introState.complete) {
      registerInteraction();
    }
  });

  window.addEventListener("pointerdown", () => {
    if (!hasEntered || introState.active || !introState.complete) return;
    registerInteraction();
  });

  window.addEventListener("keydown", () => {
    if (!hasEntered || introState.active || !introState.complete) return;
    registerInteraction();
  });

  window.addEventListener("click", () => {
    if (!hasEntered || introState.active || !introState.complete) return;
    registerInteraction();
    if (hoveredEntry) {
      window.location.href = hoveredEntry.item.href;
    }
  });

  window.addEventListener(
    "touchstart",
    (event) => {
      if (!hasEntered || introState.active || !introState.complete) return;
      registerInteraction();
      dragActive = true;
      lastTouchY = event.touches[0].clientY;
    },
    { passive: true }
  );

  window.addEventListener(
    "touchmove",
    (event) => {
      if (!hasEntered || introState.active || !introState.complete || !dragActive) return;
      registerInteraction();
      const currentY = event.touches[0].clientY;
      const delta = lastTouchY - currentY;
      lastTouchY = currentY;

      const before = targetProgress;
      targetProgress += delta * CFG.touchSpeed;
      targetProgress = THREE.MathUtils.clamp(targetProgress, 0, 1);
      noteOrbitInput(
        Math.abs(targetProgress - before),
        Math.abs(delta),
        "touch"
      );
    },
    { passive: true }
  );

  window.addEventListener("touchend", () => {
    if (introState.active || !introState.complete) {
      dragActive = false;
      return;
    }

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
    await beginPortfolioIntro();
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


function updateIdleState(elapsed, delta) {
  if (!hasEntered) return;

  const idleTime = elapsed - lastInteractionAt;
  const shouldIdle = idleTime >= CFG.idleDelay;

  idleMode = shouldIdle;
  setIdlePromptVisible(idleTime >= CFG.idlePromptDelay);

  if (!idleMode) return;

  targetProgress += CFG.idleOrbitSpeed * delta * idleDirection;

  if (targetProgress >= 1) {
    targetProgress = 1;
    idleDirection = -1;
  } else if (targetProgress <= 0) {
    targetProgress = 0;
    idleDirection = 1;
  }
}

function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();
  const elapsed = clock.elapsedTime;

  updatePortfolioIntro(elapsed);
  updateIdleState(elapsed, delta);
  currentProgress = THREE.MathUtils.lerp(currentProgress, targetProgress, 0.085);
  updateModelAnimationState(elapsed, delta);

  updateSystemBreach(elapsed);
  updateAudioReactive(elapsed);
  updateCamera(elapsed);
  updateFlags(elapsed);
  updateCoverWorldData();
  updateIntersections();
  updateLabels();
  updateQuickNav();
  updateRelationLines(elapsed);
  updateFog(elapsed);
  updateBinaryModel(delta, elapsed);
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

  audioReactiveLevel = THREE.MathUtils.lerp(audioReactiveLevel, target, 0.10);

  if (appRoot) {
    appRoot.style.setProperty("--audio-flicker", audioReactiveLevel.toFixed(3));
  }
}

function updateCamera(elapsed) {
  if (introState.active) return;

  const orbitTheta = currentProgress * Math.PI * 2 * CFG.cameraTurns;
  const idleLift = idleMode ? CFG.idleBobAmount : 0.03;

  camera.position.set(
    Math.cos(orbitTheta) * CFG.cameraRadius,
    CFG.lookY + Math.sin(elapsed * 0.48) * idleLift,
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
    const finalOpacity = THREE.MathUtils.clamp(
      Math.pow(visibility, 0.65) * introCoverOpacity,
      0,
      1
    );

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

  if (!introState.complete || introCoverOpacity <= 0.02) {
    activeEntry = null;
    return;
  }

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
    entry.group.getWorldQuaternion(tempQuat);

    data.right.set(1, 0, 0).applyQuaternion(tempQuat);
    data.up.set(0, 1, 0).applyQuaternion(tempQuat);
    data.visible = entry.group.visible;
  }
}

function projectWorldPointToScreen(worldPoint, width, height, target = { x: 0, y: 0, visible: false }) {
  working.vD.copy(worldPoint).project(camera);
  target.x = (working.vD.x * 0.5 + 0.5) * width;
  target.y = (-working.vD.y * 0.5 + 0.5) * height;
  target.visible = working.vD.z > -1 && working.vD.z < 1;
  return target;
}

function getCoverEdgeAnchorScreen(data, targetX, targetY, width, height) {
  const halfW = CFG.flagWidth * 0.5;
  const halfH = CFG.flagHeight * 0.5;

  projectWorldPointToScreen(data.position, width, height, working.screenCenter ?? (working.screenCenter = { x: 0, y: 0, visible: false }));

  working.vE.copy(data.position).addScaledVector(data.right, halfW);
  projectWorldPointToScreen(working.vE, width, height, working.screenRight ?? (working.screenRight = { x: 0, y: 0, visible: false }));

  working.vF.copy(data.position).addScaledVector(data.up, halfH);
  projectWorldPointToScreen(working.vF, width, height, working.screenUp ?? (working.screenUp = { x: 0, y: 0, visible: false }));

  const centerX = working.screenCenter.x;
  const centerY = working.screenCenter.y;
  const rightX = working.screenRight.x - centerX;
  const rightY = working.screenRight.y - centerY;
  const upX = working.screenUp.x - centerX;
  const upY = working.screenUp.y - centerY;
  const deltaX = targetX - centerX;
  const deltaY = targetY - centerY;
  const det = rightX * upY - rightY * upX;

  if (Math.abs(det) < 0.0001) {
    const fallbackAngle = Math.atan2(deltaY, deltaX);
    return {
      x: centerX + Math.cos(fallbackAngle) * 20,
      y: centerY + Math.sin(fallbackAngle) * 20
    };
  }

  const localX = (deltaX * upY - upX * deltaY) / det;
  const localY = (rightX * deltaY - deltaX * rightY) / det;
  const scale = 1 / Math.max(Math.abs(localX), Math.abs(localY), 1);
  const edgeLocalX = localX * scale;
  const edgeLocalY = localY * scale;

  let edgeX = centerX + rightX * edgeLocalX + upX * edgeLocalY;
  let edgeY = centerY + rightY * edgeLocalX + upY * edgeLocalY;

  const outwardX = edgeX - centerX;
  const outwardY = edgeY - centerY;
  const outwardLength = Math.hypot(outwardX, outwardY) || 1;
  edgeX += (outwardX / outwardLength) * 8;
  edgeY += (outwardY / outwardLength) * 8;

  return { x: edgeX, y: edgeY };
}

function updateActiveNode(entry) {
  if (!entry) return;

  let title = entry.item.title;
  let meta = `${entry.item.subtitle || "active node"} • ${entry.item.theme || "portfolio node"}`;

  const idx = flagEntries.indexOf(entry);
  if (breachState.active && idx === breachState.index) {
    meta += " • breach detected";
  }

  if (activeNodeTitle) activeNodeTitle.textContent = title;
  if (activeNodeMeta) activeNodeMeta.textContent = meta;
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
      if (entry.connectorGroup) entry.connectorGroup.style.opacity = "0";
      return;
    }

    const x = (working.vB.x * 0.5 + 0.5) * width;
    const y = (-working.vB.y * 0.5 + 0.5) * height;

    entry.group.getWorldPosition(working.vC);
    working.vC.project(camera);
    const coverX = (working.vC.x * 0.5 + 0.5) * width;
    const coverY = (-working.vC.y * 0.5 + 0.5) * height;

    if (entry.labelNode) {
      const breachBonus = entry.breachValue * 0.95;
      const glitchMix =
        (1 - entry.hoverValue) * (0.55 + audioReactiveLevel * 0.90) + breachBonus;

      entry.labelNode.style.opacity = `${titleFade}`;
      entry.labelNode.style.transform =
        `translate(calc(${x}px - 100%), calc(${y}px - 50%)) scale(${titleScale})`;
      entry.labelNode.style.setProperty("--label-glitch", glitchMix.toFixed(3));
      entry.labelNode.style.setProperty("--label-audio", (audioReactiveLevel + breachBonus * 0.3).toFixed(3));

      if (entry.hoverValue > 0.55 && entry.breachValue < 0.18) {
        entry.labelNode.classList.add("is-resolved");
      } else {
        entry.labelNode.classList.remove("is-resolved");
      }
    }

    if (entry.connectorGroup && entry.connectorCore && entry.connectorGlow) {
      const labelRect = entry.labelNode?.getBoundingClientRect();
      const labelExitX = labelRect ? labelRect.right - 10 : x - 12;
      const labelExitY = labelRect ? labelRect.top + labelRect.height * 0.5 : y;
      const hoverBoost = entry.hoverValue * 12 + entry.breachValue * 8;
      const coverAnchor = getCoverEdgeAnchorScreen(coverWorldData[index], labelExitX, labelExitY, width, height);
      const startX = coverAnchor.x;
      const startY = coverAnchor.y;
      const direction = Math.sign(labelExitX - startX) || -1;
      const verticalDirection = Math.sign(labelExitY - startY) || -1;
      const elbowAX = startX + direction * (22 + hoverBoost * 0.30);
      const elbowAY = startY + verticalDirection * (10 + hoverBoost * 0.14);
      const elbowBX = labelExitX - direction * (18 + hoverBoost * 0.22);
      const elbowBY = labelExitY + verticalDirection * 1.5;
      const pathData = `M ${startX.toFixed(2)} ${startY.toFixed(2)} L ${elbowAX.toFixed(2)} ${elbowAY.toFixed(2)} L ${elbowBX.toFixed(2)} ${elbowBY.toFixed(2)} L ${labelExitX.toFixed(2)} ${labelExitY.toFixed(2)}`;
      const connectorOpacity = Math.min(
        0.96,
        titleFade * (0.40 + entry.hoverValue * 0.34 + entry.breachValue * 0.20)
      );

      entry.connectorGroup.style.opacity = `${connectorOpacity}`;
      entry.connectorGroup.style.setProperty(
        "--connector-strength",
        (0.30 + entry.hoverValue * 0.46 + entry.breachValue * 0.20).toFixed(3)
      );
      entry.connectorCore.setAttribute("d", pathData);
      entry.connectorGlow.setAttribute("d", pathData);

      entry.connectorStartNode.setAttribute("cx", startX.toFixed(2));
      entry.connectorStartNode.setAttribute("cy", startY.toFixed(2));
      entry.connectorMidNode.setAttribute("cx", elbowAX.toFixed(2));
      entry.connectorMidNode.setAttribute("cy", elbowAY.toFixed(2));
      entry.connectorEndNode.setAttribute("cx", labelExitX.toFixed(2));
      entry.connectorEndNode.setAttribute("cy", labelExitY.toFixed(2));

      try {
        const pathLength = entry.connectorCore.getTotalLength();
        const pulseOffset = ((clock.elapsedTime * 120) + index * 36) % Math.max(pathLength, 1);
        const pulsePoint = entry.connectorCore.getPointAtLength(pulseOffset);
        entry.connectorPulse.setAttribute("cx", pulsePoint.x.toFixed(2));
        entry.connectorPulse.setAttribute("cy", pulsePoint.y.toFixed(2));
        entry.connectorPulse.setAttribute("r", `${(1.7 + entry.hoverValue * 1.1 + entry.breachValue * 0.6).toFixed(2)}`);
      } catch (error) {
        entry.connectorPulse.setAttribute("cx", labelExitX.toFixed(2));
        entry.connectorPulse.setAttribute("cy", labelExitY.toFixed(2));
      }
    }

    if (breachState.active && breachState.index === index) {
      updateActiveNode(entry);
    }
  });
}

function updateIntersections() {
  if (!hasEntered || introState.active || !introState.complete) {
    hoveredEntry = null;
    renderer.domElement.style.cursor = "default";
    return;
  }

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

function refreshAnimatedModelSampleData() {
  if (
    !centralModel ||
    !modelSampleData ||
    !modelSampleData.meshRefs?.length
  ) return;

  centralModel.updateMatrixWorld(true);
  working.mA.copy(centralModel.matrixWorld).invert();
  centralModel.getWorldQuaternion(working.qA);
  working.qB.copy(working.qA).invert();

  const positions = modelSampleData.positions;
  const normals = modelSampleData.normals;
  const restPositions = modelSampleData.restPositions;
  const restNormals = modelSampleData.restNormals;
  const meshRefs = modelSampleData.meshRefs;
  const vertexIndices = modelSampleData.vertexIndices;
  const skinnedFlags = modelSampleData.skinnedFlags;

  let currentMesh = null;

  for (let i = 0; i < meshRefs.length; i += 1) {
    const mesh = meshRefs[i];
    if (!mesh) continue;

    if (mesh !== currentMesh) {
      currentMesh = mesh;
      currentMesh.updateMatrixWorld(true);
      tempMatrix3.getNormalMatrix(currentMesh.matrixWorld);
    }

    const offset = i * 3;
    const vertexIndex = vertexIndices[i];
    const isSkinned = skinnedFlags[i] === 1 && typeof currentMesh.applyBoneTransform === "function";

    tempVec1.set(
      restPositions[offset],
      restPositions[offset + 1],
      restPositions[offset + 2]
    );

    if (isSkinned) {
      currentMesh.applyBoneTransform(vertexIndex, tempVec1);
    }

    tempVec2.set(
      restNormals[offset],
      restNormals[offset + 1],
      restNormals[offset + 2]
    );

    if (isSkinned) {
      if (tempVec2.lengthSq() > 1e-8) {
        tempVec3.set(
          restPositions[offset],
          restPositions[offset + 1],
          restPositions[offset + 2]
        );
        tempVec3.addScaledVector(tempVec2, MODEL_NORMAL_SAMPLE_OFFSET);
        currentMesh.applyBoneTransform(vertexIndex, tempVec3);

        tempVec2.copy(tempVec3).sub(tempVec1);

        if (tempVec2.lengthSq() > 1e-8) {
          tempVec2.normalize();
        } else {
          tempVec2.set(0, 1, 0);
        }

        tempVec2.transformDirection(currentMesh.matrixWorld);
        tempVec2.applyQuaternion(working.qB).normalize();
      } else {
        tempVec2.set(0, 1, 0).applyQuaternion(working.qB).normalize();
      }
    } else {
      tempVec2.applyMatrix3(tempMatrix3).normalize();
      tempVec2.applyQuaternion(working.qB).normalize();
    }

    tempVec1.applyMatrix4(currentMesh.matrixWorld);
    tempVec1.applyMatrix4(working.mA);

    positions[offset] = tempVec1.x;
    positions[offset + 1] = tempVec1.y;
    positions[offset + 2] = tempVec1.z;

    normals[offset] = tempVec2.x;
    normals[offset + 1] = tempVec2.y;
    normals[offset + 2] = tempVec2.z;
  }

  if (modelPointCloud?.geometry) {
    const positionAttr = modelPointCloud.geometry.getAttribute("position");
    const normalAttr = modelPointCloud.geometry.getAttribute("aNormal");

    if (positionAttr) positionAttr.needsUpdate = true;
    if (normalAttr) normalAttr.needsUpdate = true;
  }
}

function updateBinaryModel(delta, elapsed) {
  if (!centralModel || !modelGlyphMaterial) return;

  if (introState.active) {
    orientModelToCamera();
  } else {
    centralModel.rotation.y = CFG.modelYaw + Math.sin(elapsed * 0.30) * 0.018;
  }

  if (centralModelMixer) {
    centralModelMixer.update(delta);
    refreshAnimatedModelSampleData();
  }

  modelGlyphMaterial.uniforms.uTime.value = elapsed;
  modelGlyphMaterial.uniforms.uAudioPulse.value = audioReactiveLevel + breachState.strength * 0.08;
}

function updateStreamParticles(delta, elapsed) {
  if (!streamSystem.points || !centralModel || !modelSampleData || modelSampleData.positions.length === 0) return;

  const hoveredIndex = hoveredEntry ? flagEntries.indexOf(hoveredEntry) : -1;
  const repairEntry = getRepairTargetEntry();
  const repairIndex = repairEntry ? flagEntries.indexOf(repairEntry) : -1;
  const activeIndex = activeEntry ? flagEntries.indexOf(activeEntry) : -1;
  const repairVisible = repairIndex !== -1 ? coverWorldData[repairIndex].visible : false;
  const samplePositions = modelSampleData.positions;
  const sampleCount = samplePositions.length / 3;

  centralModel.getWorldPosition(tempVec3);

  for (let i = 0; i < streamSystem.count; i += 1) {
    const originalCoverIndex = streamSystem.coverIndex[i];
    const siphonRatio = breachState.active ? CFG.hoverBorrowRatio * 2.2 : CFG.hoverBorrowRatio;
    const borrowedToRepair = repairVisible && streamSystem.seeds[i] < siphonRatio;
    const effectiveCoverIndex = borrowedToRepair ? repairIndex : originalCoverIndex;
    const cover = coverWorldData[effectiveCoverIndex];

    const isRepairCover = repairIndex === effectiveCoverIndex;
    const isActiveCover = activeIndex === effectiveCoverIndex;
    const isHoveredVisual = hoveredIndex === effectiveCoverIndex;

    let focus = 0.20;
    if (isActiveCover) focus = 0.32;
    if (isRepairCover) focus = borrowedToRepair
      ? (breachState.active ? 0.96 : 0.54)
      : (breachState.active ? 0.82 : 0.46);
    if (!cover.visible) focus *= 0.35;

    streamSystem.progress[i] += delta * streamSystem.speed[i] * (0.55 + focus * 1.06 + audioReactiveLevel * 0.26);

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

    const spread = isRepairCover
      ? THREE.MathUtils.lerp(0.20, breachState.active ? 0.10 : 0.12, focus)
      : THREE.MathUtils.lerp(0.18, 0.050, focus);

    tempVec2.copy(cover.position)
      .addScaledVector(cover.right, streamSystem.spreadX[i] * spread)
      .addScaledVector(cover.up, streamSystem.spreadY[i] * spread);

    tempVec4.copy(tempVec1).sub(tempVec3).normalize();
    const outward = isRepairCover
      ? THREE.MathUtils.lerp(0.24, 0.13, focus)
      : THREE.MathUtils.lerp(0.34, 0.12, focus);

    working.vE.copy(tempVec1).lerp(tempVec2, isRepairCover ? 0.34 : 0.32);
    working.vE.addScaledVector(tempVec4, outward);
    working.vE.y += 0.08 + focus * (breachState.active ? 0.15 : 0.09);
    working.vE.addScaledVector(
      cover.right,
      streamSystem.spreadX[i] * (isRepairCover ? (breachState.active ? 0.06 : 0.03) : 0.02)
    );

    const t = smootherstep(streamSystem.progress[i]);
    quadraticBezier(tempVec1, working.vE, tempVec2, t, working.vD);

    const posOffset = i * 3;
    streamSystem.positions[posOffset] = working.vD.x;
    streamSystem.positions[posOffset + 1] = working.vD.y;
    streamSystem.positions[posOffset + 2] = working.vD.z;

    streamSystem.flowT[i] = t;

    const fadeIn = smooth01(Math.min(1, t / 0.16));
    const fadeOut = 1 - smooth01(Math.max(0, (t - 0.72) / 0.28));
    const shimmer = 0.90 + 0.10 * Math.sin(elapsed * (0.8 + streamSystem.seeds[i] * 1.2) + streamSystem.seeds[i] * 60.0);

    let alphaBase = 0.06 + focus * 0.50 + audioReactiveLevel * 0.08;
    if (isRepairCover && breachState.active) alphaBase += 0.20;
    if (isHoveredVisual && !breachState.active) alphaBase += 0.03;

    streamSystem.alphas[i] =
      alphaBase *
      fadeIn *
      fadeOut *
      shimmer;
  }

  streamSystem.geometry.attributes.position.needsUpdate = true;
  streamSystem.geometry.attributes.aAlpha.needsUpdate = true;
  streamSystem.geometry.attributes.aFlowT.needsUpdate = true;
  streamGlyphMaterial.uniforms.uTime.value = elapsed;
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
    focusTunnelSystem.progress[i] += delta * focusTunnelSystem.speed[i] * (0.95 + targetStrength * 1.25 + audioReactiveLevel * 0.65);

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
      .addScaledVector(tempVec4, 0.10)
      .setY(working.vA.y + 0.14 + targetStrength * 0.05);

    const p2 = working.vB.copy(p0).lerp(p3, 0.74)
      .addScaledVector(cover.up, 0.16 + targetStrength * 0.06)
      .addScaledVector(cover.right, Math.sin(focusTunnelSystem.laneAngle[i]) * 0.05);

    const t = smootherstep(focusTunnelSystem.progress[i]);
    cubicBezier(p0, p1, p2, p3, t, working.vC);

    const tunnelRadius =
      CFG.focusTunnelRadius *
      focusTunnelSystem.radiusJitter[i] *
      Math.sin(t * Math.PI) *
      (breachState.active ? 0.72 + targetStrength * 0.54 : 0.46 + targetStrength * 0.38);

    const swirl =
      focusTunnelSystem.laneAngle[i] +
      elapsed * (1.0 + focusTunnelSystem.seeds[i] * 0.8) +
      t * CFG.focusTunnelTwist;

    working.vD.copy(working.vC)
      .addScaledVector(cover.right, Math.cos(swirl) * tunnelRadius)
      .addScaledVector(cover.up, Math.sin(swirl) * tunnelRadius * 0.72);

    const posOffset = i * 3;
    focusTunnelSystem.positions[posOffset] = working.vD.x;
    focusTunnelSystem.positions[posOffset + 1] = working.vD.y;
    focusTunnelSystem.positions[posOffset + 2] = working.vD.z;

    focusTunnelSystem.flowT[i] = t;

    const fadeIn = smooth01(Math.min(1, t / 0.08));
    const fadeOut = 1 - smooth01(Math.max(0, (t - 0.80) / 0.20));
    const pulse = 0.90 + 0.10 * Math.sin(elapsed * (1.8 + focusTunnelSystem.seeds[i] * 1.1) + focusTunnelSystem.seeds[i] * 90.0);

    focusTunnelSystem.alphas[i] =
      (breachState.active ? 0.18 + targetStrength * 0.88 : 0.08 + targetStrength * 0.56) *
      fadeIn *
      fadeOut *
      pulse;
  }

  focusTunnelSystem.geometry.attributes.position.needsUpdate = true;
  focusTunnelSystem.geometry.attributes.aAlpha.needsUpdate = true;
  focusTunnelSystem.geometry.attributes.aFlowT.needsUpdate = true;

  if (focusTunnelGlyphMaterial) {
    focusTunnelGlyphMaterial.uniforms.uTime.value = elapsed;
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

  const focusEntry = hoveredEntry || (breachState.active && breachState.index >= 0 ? flagEntries[breachState.index] : null);

  if (!focusEntry) {
    relationSystem.lines.forEach((l) => {
      l.material.opacity = THREE.MathUtils.lerp(l.material.opacity, 0, 0.12);
      l.geometry.setDrawRange(0, 0);
    });
    return;
  }

  const sourceIndex = flagEntries.indexOf(focusEntry);
  if (sourceIndex === -1) return;

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
    const target = coverWorldData[targetIndex];
    const points = CFG.relationLinePoints;

    const p0 = working.vA.copy(source.position);
    const p3 = working.vB.copy(target.position);

    const span = p0.distanceTo(p3);
    const lift = THREE.MathUtils.clamp(span * 0.16, 0.24, 0.82);

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
      entry.positions[n + 1] = working.vE.y + Math.sin(elapsed * 1.4 + t * 6.283 + i) * 0.006;
      entry.positions[n + 2] = working.vE.z;
    }

    entry.geometry.attributes.position.needsUpdate = true;
    entry.geometry.setDrawRange(0, points);

    const pulse = 0.5 + 0.5 * Math.sin(elapsed * 1.8 + i * 0.7);
    const baseOpacity = breachState.active ? 0.16 : 0.10;
    entry.material.opacity = THREE.MathUtils.lerp(entry.material.opacity, baseOpacity + pulse * 0.05, 0.16);

    tempColor.copy(PALETTE[(sourceIndex + i) % PALETTE.length]);
    entry.material.color.copy(tempColor);
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

  if (activeKey && activeKey !== lastActiveDebugKey) {
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

function quadraticBezier(a, b, c, t, out) {
  const inv = 1 - t;
  out.set(
    inv * inv * a.x + 2 * inv * t * b.x + t * t * c.x,
    inv * inv * a.y + 2 * inv * t * b.y + t * t * c.y,
    inv * inv * a.z + 2 * inv * t * b.z + t * t * c.z
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
