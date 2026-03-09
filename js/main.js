import * as THREE from "https://esm.sh/three@0.160.0";
import { GLTFLoader } from "https://esm.sh/three@0.160.0/examples/jsm/loaders/GLTFLoader.js";
import { FBXLoader } from "https://esm.sh/three@0.160.0/examples/jsm/loaders/FBXLoader.js";
import { ASSETS, ORBIT_ITEMS, SCENE_CONFIG } from "./config.js";

const CFG = {
  ...SCENE_CONFIG,

  cameraFov: 46,
  cameraRadius: 4.2,
  cameraTurns: 1.08,

  flagRadius: 2.15,
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

  fogDensity: 0.010,
  fogSpriteCount: 14,

  modelPointLimit: 12000,
  streamPerCover: 240
};

const COLORS = {
  bg: 0xaed8eb,
  ink: 0x071019,
  red: 0xb80001,
  orange: 0xef510b,
  yellow: 0xfac227,
  blue: 0x1975b5,
  purple: 0x6d05ff,

  binA: 0x8ff8ff,
  binB: 0x31d7ff,
  binC: 0x1399ff,
  white: 0xf8fcff
};

const canvas = document.getElementById("webgl");
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

if (backgroundVideo) {
  backgroundVideo.muted = true;
  backgroundVideo.playsInline = true;
  backgroundVideo.loop = true;
  backgroundVideo.play().catch(() => {});
}

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(COLORS.bg, CFG.fogDensity);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true,
  powerPreference: "high-performance"
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(COLORS.bg, 0);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.02;
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
let glyphAtlas = null;
let videoTexture = null;

const orbitRoot = new THREE.Group();
scene.add(orbitRoot);

const working = {
  vA: new THREE.Vector3(),
  vB: new THREE.Vector3(),
  vC: new THREE.Vector3(),
  vD: new THREE.Vector3(),
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

const flagEntries = [];
const fogSprites = [];
const missingAssets = [];
let modelLocalSamplePoints = [];

const coverWorldData = ORBIT_ITEMS.map(() => ({
  position: new THREE.Vector3(),
  right: new THREE.Vector3(1, 0, 0),
  up: new THREE.Vector3(0, 1, 0),
  visible: true
}));

const streamSystem = {
  points: null,
  material: null,
  geometry: null,
  positions: null,
  seeds: null,
  sizes: null,
  alphas: null,
  coverIndex: [],
  progress: [],
  speed: [],
  spreadX: [],
  spreadY: [],
  sourceIndex: [],
  count: 0
};

setupLighting();

if (backgroundVideo) {
  videoTexture = new THREE.VideoTexture(backgroundVideo);
  videoTexture.colorSpace = THREE.SRGBColorSpace;
  videoTexture.minFilter = THREE.LinearFilter;
  videoTexture.magFilter = THREE.LinearFilter;
  videoTexture.generateMipmaps = false;
}

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
      ? "Scene loaded. Some files failed, but the core portfolio is ready."
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
  loadCenterModel();
}

function setupLighting() {
  const ambient = new THREE.AmbientLight(0xffffff, 0.75);
  scene.add(ambient);

  const hemi = new THREE.HemisphereLight(0xf8fcff, 0x8ab4c6, 0.9);
  scene.add(hemi);

  const key = new THREE.DirectionalLight(0xffffff, 0.65);
  key.position.set(5.4, 7.4, 5.5);
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
      opacity: 0.20,
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
    new THREE.RingGeometry(2.00, 2.10, 96),
    new THREE.MeshBasicMaterial({
      color: COLORS.blue,
      transparent: true,
      opacity: 0.11,
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
      color: COLORS.purple,
      transparent: true,
      opacity: 0.06,
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
  grad.addColorStop(0, "rgba(19,153,255,0.10)");
  grad.addColorStop(0.55, "rgba(19,153,255,0.03)");
  grad.addColorStop(1, "rgba(19,153,255,0.00)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const step = 64;
  for (let i = 0; i <= size; i += step) {
    ctx.strokeStyle = i % (step * 2) === 0
      ? "rgba(25,117,181,0.16)"
      : "rgba(7,16,25,0.05)";
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
      ? "rgba(109,5,255,0.10)"
      : "rgba(19,153,255,0.07)";
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
  grad.addColorStop(0, "rgba(255,255,255,0.72)");
  grad.addColorStop(0.38, "rgba(143,248,255,0.20)");
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
      color: i % 3 === 0 ? COLORS.white : (i % 3 === 1 ? COLORS.binA : COLORS.binB),
      transparent: true,
      opacity: 0.035 + Math.random() * 0.03,
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
  return new THREE.ShaderMaterial({
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
    uniforms: {
      uMap: { value: texture },
      uReveal: { value: 0.0 },
      uOpacity: { value: 1.0 },
      uHover: { value: 0.0 }
    },
    vertexShader: `
      uniform float uReveal;
      uniform float uHover;
      varying vec2 vUv;

      void main() {
        vUv = uv;

        vec3 pos = position;

        float edge = mix(-0.20, 1.20, uReveal);
        float band = exp(-pow((uv.x - edge) * 14.0, 2.0));

        float ripple =
          sin(uv.y * 22.0 + edge * 18.0) * 0.018 * band +
          sin(uv.y * 11.0 + edge * 10.0) * 0.008 * band;

        pos.z += ripple + uHover * 0.015;
        pos.x += sin(uv.y * 9.0 + edge * 12.0) * 0.007 * band;
        pos.y += sin(uv.x * 8.0 + edge * 10.0) * 0.003 * uHover;

        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D uMap;
      uniform float uReveal;
      uniform float uOpacity;
      uniform float uHover;

      varying vec2 vUv;

      void main() {
        vec4 tex = texture2D(uMap, vUv);
        if (tex.a < 0.02) discard;

        float gray = dot(tex.rgb, vec3(0.299, 0.587, 0.114));
        vec3 bw = vec3(gray);

        float edge = mix(-0.20, 1.20, uReveal);
        float waveOffset = sin(vUv.y * 22.0 + edge * 18.0) * 0.024;
        float revealMask = 1.0 - smoothstep(
          edge - 0.12 + waveOffset,
          edge + 0.12 + waveOffset,
          vUv.x
        );

        vec2 split = vec2(0.004 * uHover, 0.0);
        float r = texture2D(uMap, vUv + split).r;
        float g = texture2D(uMap, vUv).g;
        float b = texture2D(uMap, vUv - split).b;
        vec3 chroma = vec3(r, g, b);

        vec3 restored = mix(bw, tex.rgb, revealMask);
        vec3 finalColor = mix(restored, chroma, uHover * 0.45);

        gl_FragColor = vec4(finalColor, tex.a * uOpacity);
      }
    `
  });
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
      new THREE.PlaneGeometry(CFG.flagWidth, CFG.flagHeight, 36, 18),
      mat
    );
    flag.renderOrder = 10;
    group.add(flag);

    const labelAnchor = new THREE.Object3D();
    labelAnchor.position.set(-CFG.flagWidth * 0.62, -CFG.flagHeight * 0.78, 0.02);
    group.add(labelAnchor);

    const labelNode = document.createElement("div");
    labelNode.className = "folder-label";
    labelNode.innerHTML = `
      <div class="folder-label__card">
        <div class="folder-label__id">node://${String(index + 1).padStart(2, "0")}</div>
        <h3>${item.title}</h3>
        <p>${item.subtitle}</p>
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
      revealValue: 0,
      revealTarget: 0
    });
  });
}

function loadCenterModel() {
  const maybeGltf = typeof ASSETS.modelGLTF === "string" ? ASSETS.modelGLTF.trim() : "";
  const maybeGlb = typeof ASSETS.modelGLB === "string" ? ASSETS.modelGLB.trim() : "";
  const maybeFbx = typeof ASSETS.modelFBX === "string"
    ? ASSETS.modelFBX.trim()
    : "";

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
    if (child.geometry && typeof child.geometry.computeVertexNormals === "function" && !child.geometry.attributes.normal) {
      child.geometry.computeVertexNormals();
    }
  });

  centerAndScaleModel(centralModel);
  orbitRoot.add(centralModel);

  buildBinaryModelRepresentation(centralModel);
  buildStreamSystem();
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

  buildBinaryModelRepresentation(centralModel);
  buildStreamSystem();
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

function buildBinaryModelRepresentation(model) {
  modelLocalSamplePoints = extractModelSamplePoints(model, CFG.modelPointLimit);

  if (modelLocalSamplePoints.length === 0) {
    console.warn("No model sample points extracted.");
    return;
  }

  const count = modelLocalSamplePoints.length / 3;
  const positions = new Float32Array(modelLocalSamplePoints);
  const seeds = new Float32Array(count);
  const sizes = new Float32Array(count);
  const alphas = new Float32Array(count);

  for (let i = 0; i < count; i += 1) {
    seeds[i] = Math.random();
    sizes[i] = 2.0 + Math.random() * 1.5;
    alphas[i] = 0.7 + Math.random() * 0.3;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
  geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute("aAlpha", new THREE.BufferAttribute(alphas, 1));

  modelGlyphMaterial = createBinaryPointsMaterial({
    atlas: glyphAtlas,
    opacity: 0.95,
    sizePerspective: 210,
    jitter: 0.006,
    colorA: new THREE.Color(COLORS.binA),
    colorB: new THREE.Color(COLORS.binC)
  });

  modelPointCloud = new THREE.Points(geometry, modelGlyphMaterial);
  modelPointCloud.renderOrder = 8;
  modelPointCloud.frustumCulled = false;
  model.add(modelPointCloud);

  model.traverse((child) => {
    if (!child.isMesh) return;
    child.visible = false;
  });
}

function extractModelSamplePoints(model, maxPoints) {
  model.updateMatrixWorld(true);

  const rootInverse = new THREE.Matrix4().copy(model.matrixWorld).invert();
  const sampled = [];

  let totalVertices = 0;
  model.traverse((child) => {
    if (!child.isMesh || !child.geometry?.attributes?.position) return;
    totalVertices += child.geometry.attributes.position.count;
  });

  if (totalVertices === 0) return sampled;

  const step = Math.max(1, Math.floor(totalVertices / maxPoints));

  model.traverse((child) => {
    if (!child.isMesh || !child.geometry?.attributes?.position) return;

    const pos = child.geometry.attributes.position;
    for (let i = 0; i < pos.count; i += step) {
      tempVec1.fromBufferAttribute(pos, i);
      tempVec1.applyMatrix4(child.matrixWorld);
      tempVec1.applyMatrix4(rootInverse);

      sampled.push(tempVec1.x, tempVec1.y, tempVec1.z);
    }
  });

  return sampled;
}

function createBinaryGlyphAtlas() {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 256;
  const ctx = c.getContext("2d");

  ctx.clearRect(0, 0, c.width, c.height);
  ctx.fillStyle = "rgba(255,255,255,0)";
  ctx.fillRect(0, 0, c.width, c.height);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 178px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";

  ctx.fillText("0", 128, 132);
  ctx.fillText("1", 384, 132);

  const texture = new THREE.CanvasTexture(c);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  return texture;
}

function createBinaryPointsMaterial({
  atlas,
  opacity = 1,
  sizePerspective = 200,
  jitter = 0.004,
  colorA = new THREE.Color(COLORS.binA),
  colorB = new THREE.Color(COLORS.binC)
}) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.NormalBlending,
    uniforms: {
      uAtlas: { value: atlas },
      uTime: { value: 0 },
      uOpacity: { value: opacity },
      uSizePerspective: { value: sizePerspective },
      uJitter: { value: jitter },
      uColorA: { value: colorA },
      uColorB: { value: colorB }
    },
    vertexShader: `
      uniform float uTime;
      uniform float uOpacity;
      uniform float uSizePerspective;
      uniform float uJitter;
      uniform vec3 uColorA;
      uniform vec3 uColorB;

      attribute float aSeed;
      attribute float aSize;
      attribute float aAlpha;

      varying float vDigit;
      varying float vAlpha;
      varying vec3 vColor;

      void main() {
        vec3 p = position;

        float driftScale = uJitter * (0.6 + aSeed * 0.6);

        p.x += sin(uTime * (0.45 + fract(aSeed * 1.7)) + aSeed * 31.0) * driftScale;
        p.y += cos(uTime * (0.38 + fract(aSeed * 1.9)) + aSeed * 27.0) * driftScale;
        p.z += sin(uTime * (0.42 + fract(aSeed * 1.5)) + aSeed * 19.0) * driftScale;

        float switchT = floor(uTime * (0.65 + fract(aSeed * 1.6)) + aSeed * 13.0);
        vDigit = mod(switchT + floor(aSeed * 3.0), 2.0);

        vAlpha = aAlpha * uOpacity * (0.82 + 0.18 * sin(uTime * (0.9 + fract(aSeed * 2.0)) + aSeed * 70.0));
        vColor = mix(uColorA, uColorB, fract(aSeed * 17.3));

        vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = max(1.0, aSize * (uSizePerspective / max(1.0, -mvPosition.z)));
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform sampler2D uAtlas;

      varying float vDigit;
      varying float vAlpha;
      varying vec3 vColor;

      void main() {
        vec2 uv = gl_PointCoord;
        vec2 atlasUv = vec2((uv.x + vDigit) * 0.5, uv.y);

        vec4 glyph = texture2D(uAtlas, atlasUv);
        float alpha = glyph.a * vAlpha;

        if (alpha < 0.04) discard;

        gl_FragColor = vec4(vColor, alpha);
      }
    `
  });
}

function buildStreamSystem() {
  if (!centralModel || modelLocalSamplePoints.length === 0) return;

  const count = ORBIT_ITEMS.length * CFG.streamPerCover;
  streamSystem.count = count;
  streamSystem.positions = new Float32Array(count * 3);
  streamSystem.seeds = new Float32Array(count);
  streamSystem.sizes = new Float32Array(count);
  streamSystem.alphas = new Float32Array(count);
  streamSystem.coverIndex = new Array(count);
  streamSystem.progress = new Array(count);
  streamSystem.speed = new Array(count);
  streamSystem.spreadX = new Array(count);
  streamSystem.spreadY = new Array(count);
  streamSystem.sourceIndex = new Array(count);

  for (let i = 0; i < count; i += 1) {
    const coverIndex = i % ORBIT_ITEMS.length;
    streamSystem.coverIndex[i] = coverIndex;
    streamSystem.seeds[i] = Math.random();
    streamSystem.sizes[i] = 1.2 + Math.random() * 0.8;
    streamSystem.progress[i] = Math.random();
    streamSystem.speed[i] = 0.22 + Math.random() * 0.20;
    streamSystem.spreadX[i] = (Math.random() * 2 - 1);
    streamSystem.spreadY[i] = (Math.random() * 2 - 1);
    streamSystem.sourceIndex[i] = Math.floor(Math.random() * (modelLocalSamplePoints.length / 3));
    streamSystem.alphas[i] = 0.25;
  }

  const geometry = new THREE.BufferGeometry();
  const positionAttr = new THREE.BufferAttribute(streamSystem.positions, 3);
  positionAttr.setUsage(THREE.DynamicDrawUsage);

  const alphaAttr = new THREE.BufferAttribute(streamSystem.alphas, 1);
  alphaAttr.setUsage(THREE.DynamicDrawUsage);

  geometry.setAttribute("position", positionAttr);
  geometry.setAttribute("aSeed", new THREE.BufferAttribute(streamSystem.seeds, 1));
  geometry.setAttribute("aSize", new THREE.BufferAttribute(streamSystem.sizes, 1));
  geometry.setAttribute("aAlpha", alphaAttr);

  streamSystem.material = createBinaryPointsMaterial({
    atlas: glyphAtlas,
    opacity: 0.8,
    sizePerspective: 165,
    jitter: 0.002,
    colorA: new THREE.Color(COLORS.binA),
    colorB: new THREE.Color(COLORS.binB)
  });

  streamSystem.points = new THREE.Points(geometry, streamSystem.material);
  streamSystem.points.renderOrder = 9;
  streamSystem.points.frustumCulled = false;

  scene.add(streamSystem.points);
  streamSystem.geometry = geometry;
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

    try {
      if (ambientAudio) {
        ambientAudio.volume = 0.45;
        ambientAudio.currentTime = 0;
        if (soundEnabled) {
          await ambientAudio.play();
        }
      }
    } catch (error) {
      console.warn("Audio did not start automatically.", error);
    }

    if (focusHint) {
      focusHint.style.opacity = "1";
    }
  });

  muteButton?.addEventListener("click", async () => {
    soundEnabled = !soundEnabled;
    muteButton.textContent = soundEnabled ? "SOUND ON" : "SOUND OFF";

    if (!hasEntered || !ambientAudio) return;

    if (soundEnabled) {
      try {
        await ambientAudio.play();
      } catch (error) {
        console.warn("Audio resume failed.", error);
      }
    } else {
      ambientAudio.pause();
    }
  });
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

  updateCamera(elapsed);
  updateFlags();
  updateCoverWorldData();
  updateLabels();
  updateIntersections();
  updateFog(elapsed);
  updateBinaryModel(elapsed);
  updateStreamParticles(delta, elapsed);

  renderer.render(scene, camera);
}

function updateCamera(elapsed) {
  const orbitTheta = currentProgress * Math.PI * 2 * CFG.cameraTurns;

  camera.position.set(
    Math.cos(orbitTheta) * CFG.cameraRadius,
    CFG.lookY + Math.sin(elapsed * 0.48) * 0.035,
    Math.sin(orbitTheta) * CFG.cameraRadius
  );

  camera.lookAt(0, CFG.lookY, 0);
}

function updateFlags() {
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

    entry.revealTarget = hoveredEntry === entry ? 1 : 0;
    entry.revealValue = THREE.MathUtils.lerp(entry.revealValue, entry.revealTarget, 0.12);

    entry.material.uniforms.uReveal.value = entry.revealValue;
    entry.material.uniforms.uOpacity.value = finalOpacity;
    entry.material.uniforms.uHover.value = hoveredEntry === entry ? 1.0 : 0.0;

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
    entry.group.getWorldQuaternion(tempQuat);

    data.right.set(1, 0, 0).applyQuaternion(tempQuat);
    data.up.set(0, 1, 0).applyQuaternion(tempQuat);
    data.visible = entry.group.visible;
  }
}

function updateActiveNode(entry) {
  if (!entry) return;

  if (activeNodeTitle) {
    activeNodeTitle.textContent = entry.item.title;
  }

  if (activeNodeMeta) {
    activeNodeMeta.textContent = `${entry.item.subtitle || "active node"} • ${entry.item.theme || "portfolio node"}`;
  }
}

function updateLabels() {
  const width = window.innerWidth;
  const height = window.innerHeight;

  flagEntries.forEach((entry) => {
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
      entry.labelNode.style.opacity = `${titleFade}`;
      entry.labelNode.style.transform =
        `translate(calc(${x}px - 100%), calc(${y}px - 50%)) scale(${titleScale})`;
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

  centralModel.rotation.y = CFG.modelYaw + Math.sin(elapsed * 0.34) * 0.025;
  modelGlyphMaterial.uniforms.uTime.value = elapsed;

  if (videoTexture) {
    videoTexture.needsUpdate = true;
  }
}

function updateStreamParticles(delta, elapsed) {
  if (!streamSystem.points || !centralModel || modelLocalSamplePoints.length === 0) return;

  const hoveredIndex = hoveredEntry ? flagEntries.indexOf(hoveredEntry) : -1;
  const activeIndex = activeEntry ? flagEntries.indexOf(activeEntry) : -1;
  const sourceCount = modelLocalSamplePoints.length / 3;

  for (let i = 0; i < streamSystem.count; i += 1) {
    const coverIndex = streamSystem.coverIndex[i];
    const cover = coverWorldData[coverIndex];

    const isHoveredCover = hoveredIndex === coverIndex;
    const isActiveCover = activeIndex === coverIndex;

    let focus = 0.26;
    if (isActiveCover) focus = 0.38;
    if (isHoveredCover) focus = 1.0;
    if (!cover.visible) focus *= 0.35;

    streamSystem.progress[i] += delta * streamSystem.speed[i] * (0.60 + focus * 1.10);

    if (streamSystem.progress[i] > 1.0) {
      streamSystem.progress[i] -= 1.0;
      streamSystem.sourceIndex[i] = Math.floor(Math.random() * sourceCount);
      streamSystem.spreadX[i] = (Math.random() * 2 - 1);
      streamSystem.spreadY[i] = (Math.random() * 2 - 1);
    }

    const sourceOffset = streamSystem.sourceIndex[i] * 3;
    tempVec1.set(
      modelLocalSamplePoints[sourceOffset],
      modelLocalSamplePoints[sourceOffset + 1],
      modelLocalSamplePoints[sourceOffset + 2]
    );

    centralModel.localToWorld(tempVec1);

    const spread = THREE.MathUtils.lerp(0.16, 0.045, focus);

    tempVec2.copy(cover.position)
      .addScaledVector(cover.right, streamSystem.spreadX[i] * spread)
      .addScaledVector(cover.up, streamSystem.spreadY[i] * spread);

    tempVec3.copy(tempVec1).lerp(tempVec2, 0.5);
    tempVec3.y += 0.16 + focus * 0.12;
    tempVec3.addScaledVector(cover.right, streamSystem.spreadX[i] * 0.03);

    const t = smootherstep(streamSystem.progress[i]);

    quadraticBezier(tempVec1, tempVec3, tempVec2, t, tempVec4);

    const posOffset = i * 3;
    streamSystem.positions[posOffset] = tempVec4.x;
    streamSystem.positions[posOffset + 1] = tempVec4.y;
    streamSystem.positions[posOffset + 2] = tempVec4.z;

    const fadeIn = smooth01(Math.min(1, t / 0.18));
    const fadeOut = 1 - smooth01(Math.max(0, (t - 0.72) / 0.28));
    const shimmer = 0.88 + 0.12 * Math.sin(elapsed * (0.8 + streamSystem.seeds[i] * 1.5) + streamSystem.seeds[i] * 60.0);

    streamSystem.alphas[i] =
      (0.10 + focus * 0.70) *
      fadeIn *
      fadeOut *
      shimmer;
  }

  streamSystem.geometry.attributes.position.needsUpdate = true;
  streamSystem.geometry.attributes.aAlpha.needsUpdate = true;
  streamSystem.material.uniforms.uTime.value = elapsed;
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