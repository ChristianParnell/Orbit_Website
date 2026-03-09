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

  modelPointLimit: 42000,
  streamPerCover: 360
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
let glyphAtlas = null;
let modelSampleData = null;

const orbitRoot = new THREE.Group();
scene.add(orbitRoot);

const working = {
  vA: new THREE.Vector3(),
  vB: new THREE.Vector3(),
  vC: new THREE.Vector3(),
  vD: new THREE.Vector3(),
  vE: new THREE.Vector3(),
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
  return new THREE.ShaderMaterial({
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
    uniforms: {
      uMap: { value: texture },
      uTime: { value: 0 },
      uHover: { value: 0.0 },
      uOpacity: { value: 1.0 }
    },
    vertexShader: `
      uniform float uTime;
      uniform float uHover;
      varying vec2 vUv;
      varying float vHover;

      float hash21(vec2 p) {
        p = fract(p * vec2(123.34, 456.21));
        p += dot(p, p + 45.32);
        return fract(p.x * p.y);
      }

      void main() {
        vUv = uv;
        vHover = uHover;

        vec3 pos = position;
        float corrupt = 1.0 - uHover;

        vec2 block = floor(uv * vec2(24.0, 14.0));
        float n = hash21(block + floor(uTime * 2.0));
        float band = step(0.76, fract(uv.y * 18.0 + uTime * 2.5 + n * 3.0));

        pos.x += (n - 0.5) * 0.014 * corrupt;
        pos.y += sin(uv.x * 18.0 + uTime * 6.0 + n * 4.0) * 0.005 * corrupt;
        pos.z += sin(uv.y * 16.0 + uTime * 4.0 + n * 5.0) * (0.010 + band * 0.012) * corrupt;

        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D uMap;
      uniform float uTime;
      uniform float uHover;
      uniform float uOpacity;

      varying vec2 vUv;
      varying float vHover;

      float hash21(vec2 p) {
        p = fract(p * vec2(123.34, 456.21));
        p += dot(p, p + 45.32);
        return fract(p.x * p.y);
      }

      void main() {
        float resolve = smoothstep(0.0, 1.0, vHover);
        float corrupt = 1.0 - resolve;

        vec2 uv = vUv;

        float lineNoise = hash21(vec2(floor(uv.y * 72.0), floor(uTime * 10.0)));
        float bigBand = step(0.82, lineNoise);
        float microBand = step(0.88, fract(uv.y * 42.0 + uTime * 5.0));

        uv.x += (lineNoise - 0.5) * 0.055 * corrupt * (0.35 + bigBand * 1.4);
        uv.y += sin(uv.x * 42.0 + uTime * 8.0) * 0.0025 * corrupt;

        vec2 rgbShift = vec2(0.012 * corrupt * (0.6 + lineNoise), 0.0);
        vec4 texMain = texture2D(uMap, clamp(uv, 0.001, 0.999));
        vec4 texR = texture2D(uMap, clamp(uv + rgbShift, 0.001, 0.999));
        vec4 texB = texture2D(uMap, clamp(uv - rgbShift, 0.001, 0.999));

        float alpha = max(texMain.a, max(texR.a, texB.a));
        if (alpha < 0.02) discard;

        vec3 clean = texture2D(uMap, vUv).rgb;
        vec3 infected = vec3(texR.r, texMain.g, texB.b);

        float blockN = hash21(floor(vUv * vec2(34.0, 22.0)) + floor(uTime * 2.7));
        float dropout = step(0.945, blockN) * corrupt;
        float burn = step(0.88, fract(vUv.y * 38.0 + uTime * 6.0 + blockN * 4.0)) * corrupt;

        infected *= 0.70 + 0.30 * blockN;
        infected += vec3(0.00, 0.10, 0.16) * burn;
        infected = mix(infected, infected.grb * vec3(0.85, 1.15, 1.10), bigBand * corrupt * 0.5);
        infected *= 1.0 - dropout * 0.72;

        vec3 finalColor = mix(infected, clean, resolve);

        gl_FragColor = vec4(finalColor, alpha * uOpacity);
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
      new THREE.PlaneGeometry(CFG.flagWidth, CFG.flagHeight, 18, 10),
      mat
    );
    flag.renderOrder = 10;
    group.add(flag);

    const labelAnchor = new THREE.Object3D();
    labelAnchor.position.set(-CFG.flagWidth * 0.62, -CFG.flagHeight * 0.78, 0.02);
    group.add(labelAnchor);

    const labelNode = document.createElement("div");
    labelNode.className = "folder-label";

    const safeTitle = item.title;
    const safeSubtitle = item.subtitle;

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
      hoverValue: 0
    });
  });
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
    sizes[i] = 0.34 + Math.random() * 0.26;
    alphas[i] = 0.76 + Math.random() * 0.24;
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
    streamSystem.sizes[i] = 0.34 + Math.random() * 0.22;
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

function createBinaryGlyphAtlas() {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 256;
  const ctx = c.getContext("2d");

  ctx.clearRect(0, 0, c.width, c.height);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 174px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";

  ctx.fillText("0", 128, 130);
  ctx.fillText("1", 384, 130);

  const texture = new THREE.CanvasTexture(c);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  return texture;
}

function paletteMix(t) {
  const scaled = t * (PALETTE.length - 1);
  const i0 = Math.floor(scaled);
  const i1 = Math.min(i0 + 1, PALETTE.length - 1);
  const f = scaled - i0;
  return PALETTE[i0].clone().lerp(PALETTE[i1], f);
}

function createModelGlyphMaterial(atlas) {
  const paletteUniform = PALETTE.map((c) => c.clone());

  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.NormalBlending,
    uniforms: {
      uAtlas: { value: atlas },
      uTime: { value: 0 },
      uLightDir: { value: LIGHT_DIR.clone() },
      uPalette: { value: paletteUniform }
    },
    vertexShader: `
      uniform float uTime;
      uniform vec3 uLightDir;

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

        float drift = 0.0025 + aSeed * 0.0025;
        p.x += sin(uTime * (0.18 + fract(aSeed * 0.25)) + aSeed * 51.0) * drift;
        p.y += cos(uTime * (0.16 + fract(aSeed * 0.21)) + aSeed * 37.0) * drift;
        p.z += sin(uTime * (0.17 + fract(aSeed * 0.23)) + aSeed * 23.0) * drift;

        vec3 worldNormal = normalize(mat3(modelMatrix) * aNormal);
        float light = max(dot(worldNormal, normalize(uLightDir)), 0.0);
        float shade = pow(smoothstep(0.10, 0.98, light), 1.85);

        float digitSwitch = floor(uTime * (0.18 + fract(aSeed * 0.10)) + aSeed * 21.0);
        vDigit = mod(digitSwitch, 2.0);
        vAlpha = aAlpha * shade;
        vShade = shade;
        vPalette = fract(aSeed * 13.7);

        vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = max(1.0, aSize * (22.0 / max(1.0, -mvPosition.z)));
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
        color *= mix(0.18, 1.0, vShade);

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
    blending: THREE.AdditiveBlending,
    uniforms: {
      uAtlas: { value: atlas },
      uTime: { value: 0 },
      uPalette: { value: paletteUniform }
    },
    vertexShader: `
      uniform float uTime;

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
        vAlpha = aAlpha;

        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        float grow = mix(1.0, 2.4, smoothstep(0.58, 1.0, aFlowT));
        gl_PointSize = max(1.0, aSize * grow * (18.0 / max(1.0, -mvPosition.z)));
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
  updateFlags(elapsed);
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

    entry.material.uniforms.uTime.value = elapsed;
    entry.material.uniforms.uOpacity.value = finalOpacity;
    entry.material.uniforms.uHover.value = entry.hoverValue;

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

      if (entry.hoverValue > 0.55) {
        entry.labelNode.classList.add("is-resolved");
      } else {
        entry.labelNode.classList.remove("is-resolved");
      }
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

  centralModel.rotation.y = CFG.modelYaw + Math.sin(elapsed * 0.30) * 0.018;
  modelGlyphMaterial.uniforms.uTime.value = elapsed;
}

function updateStreamParticles(delta, elapsed) {
  if (!streamSystem.points || !centralModel || !modelSampleData || modelSampleData.positions.length === 0) return;

  const hoveredIndex = hoveredEntry ? flagEntries.indexOf(hoveredEntry) : -1;
  const activeIndex = activeEntry ? flagEntries.indexOf(activeEntry) : -1;
  const samplePositions = modelSampleData.positions;
  const sampleCount = samplePositions.length / 3;

  centralModel.getWorldPosition(tempVec3);

  for (let i = 0; i < streamSystem.count; i += 1) {
    const coverIndex = streamSystem.coverIndex[i];
    const cover = coverWorldData[coverIndex];

    const isHoveredCover = hoveredIndex === coverIndex;
    const isActiveCover = activeIndex === coverIndex;

    let focus = 0.26;
    if (isActiveCover) focus = 0.42;
    if (isHoveredCover) focus = 1.0;
    if (!cover.visible) focus *= 0.35;

    streamSystem.progress[i] += delta * streamSystem.speed[i] * (0.55 + focus * 1.05);

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

    const spread = THREE.MathUtils.lerp(0.18, 0.045, focus);

    tempVec2.copy(cover.position)
      .addScaledVector(cover.right, streamSystem.spreadX[i] * spread)
      .addScaledVector(cover.up, streamSystem.spreadY[i] * spread);

    tempVec4.copy(tempVec1).sub(tempVec3).normalize();
    const outward = THREE.MathUtils.lerp(0.34, 0.12, focus);

    working.vE.copy(tempVec1).lerp(tempVec2, 0.32);
    working.vE.addScaledVector(tempVec4, outward);
    working.vE.y += 0.08 + focus * 0.10;

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

    streamSystem.alphas[i] =
      (0.08 + focus * 0.72) *
      fadeIn *
      fadeOut *
      shimmer;
  }

  streamSystem.geometry.attributes.position.needsUpdate = true;
  streamSystem.geometry.attributes.aAlpha.needsUpdate = true;
  streamSystem.geometry.attributes.aFlowT.needsUpdate = true;
  streamGlyphMaterial.uniforms.uTime.value = elapsed;
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