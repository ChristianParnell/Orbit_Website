import * as THREE from "https://esm.sh/three@0.160.0";
import { GLTFLoader } from "https://esm.sh/three@0.160.0/examples/jsm/loaders/GLTFLoader.js";
import { FBXLoader } from "https://esm.sh/three@0.160.0/examples/jsm/loaders/FBXLoader.js";
import { ASSETS, ORBIT_ITEMS, SCENE_CONFIG } from "./config.js";

const CFG = {
  ...SCENE_CONFIG,

  cameraFov: 47,
  cameraRadius: 4.15,
  cameraTurns: 1.08,

  flagRadius: 2.12,
  helixAngleStep: 1.52,
  helixRise: 0.72,

  flagWidth: 0.78,
  flagHeight: 0.46,

  scrollSpeed: SCENE_CONFIG.scrollSpeed ?? 0.00042,
  touchSpeed: SCENE_CONFIG.touchSpeed ?? 0.0018,

  lookY: 0.02,

  // bigger + lower model
  modelLift: -1.18,
  modelTargetHeight: 4.35,
  modelYaw: Math.PI * 0.045,

  nearStraightenStart: 3.6,
  nearStraightenEnd: 1.3,

  farFadeStart: 6.8,
  farFadeEnd: 10.2,

  titleScaleNear: 1.0,
  titleScaleFar: 0.36,
  titleFadeStart: 3.8,
  titleFadeEnd: 8.8,

  fogDensity: 0.018,
  fogSpriteOpacity: 0.22,
  fogSpriteCount: 42,
  fogCentralOpacity: 0.14
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

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x081018);
scene.fog = new THREE.FogExp2(0x081018, CFG.fogDensity);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: false,
  powerPreference: "high-performance"
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x081018, 1);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;
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
let dragActive = false;
let lastTouchY = 0;
let centralModel = null;
let skySphere = null;

const orbitRoot = new THREE.Group();
scene.add(orbitRoot);

const working = {
  vA: new THREE.Vector3(),
  vB: new THREE.Vector3(),
  qA: new THREE.Quaternion(),
  qB: new THREE.Quaternion(),
  qC: new THREE.Quaternion(),
  mA: new THREE.Matrix4(),
  eA: new THREE.Euler()
};

const flagEntries = [];
const fogSprites = [];
const missingAssets = [];

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
    enterButton.textContent = "Enter site";
  }

  if (progressText) {
    progressText.textContent = missingAssets.length
      ? "Scene loaded. Some model texture files are still missing."
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

initScene();
attachEvents();
animate();

function initScene() {
  createBackground(textureLoader);
  createFog(textureLoader);
  createGroundGlow();
  createFlags(textureLoader);
  loadCenterModel();
}

function setupLighting() {
  const hemi = new THREE.HemisphereLight(0xe8f5ff, 0x061018, 1.3);
  scene.add(hemi);

  const key = new THREE.DirectionalLight(0xffffff, 2.35);
  key.position.set(5.2, 7.2, 6.0);
  scene.add(key);

  const rim = new THREE.DirectionalLight(0x97d5ff, 1.8);
  rim.position.set(-5.8, 4.2, -5.2);
  scene.add(rim);

  const fill = new THREE.PointLight(0x98d8ff, 1.25, 14, 2);
  fill.position.set(0, 1.55, 1.0);
  scene.add(fill);
}

function createBackground(loader) {
  const backgroundPath = ASSETS.sky || ASSETS.background;
  const bgTexture = loader.load(backgroundPath);

  bgTexture.colorSpace = THREE.SRGBColorSpace;
  bgTexture.wrapS = THREE.RepeatWrapping;
  bgTexture.wrapT = THREE.ClampToEdgeWrapping;

  const sphereGeo = new THREE.SphereGeometry(140, 72, 72);
  const sphereMat = new THREE.MeshBasicMaterial({
    map: bgTexture,
    side: THREE.BackSide,
    transparent: false,
    fog: false,
    toneMapped: false,
    depthWrite: false
  });

  skySphere = new THREE.Mesh(sphereGeo, sphereMat);
  skySphere.renderOrder = -100;
  scene.add(skySphere);
}

function createFog(loader) {
  const fogTexture = loader.load(ASSETS.fog);

  fogTexture.colorSpace = THREE.SRGBColorSpace;
  fogTexture.wrapS = THREE.ClampToEdgeWrapping;
  fogTexture.wrapT = THREE.ClampToEdgeWrapping;
  fogTexture.minFilter = THREE.LinearMipmapLinearFilter;
  fogTexture.magFilter = THREE.LinearFilter;

  // central low fog so it's always visible even when billboard sprites drift behind objects
  for (let i = 0; i < 4; i += 1) {
    const mat = new THREE.MeshBasicMaterial({
      map: fogTexture,
      alphaMap: fogTexture,
      color: 0xffffff,
      transparent: true,
      opacity: CFG.fogCentralOpacity,
      depthWrite: false,
      depthTest: true,
      fog: false,
      toneMapped: false,
      side: THREE.DoubleSide
    });

    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(8.2 + i * 1.1, 2.6 + i * 0.25),
      mat
    );

    plane.position.set(0, -0.35 + i * 0.18, 0);
    plane.rotation.x = -Math.PI / 2.9;
    plane.rotation.z = i * 0.45;
    plane.renderOrder = 3;

    plane.userData = {
      centralFog: true,
      phase: Math.random() * Math.PI * 2,
      bob: 0.02 + Math.random() * 0.03,
      spin: (i % 2 === 0 ? 1 : -1) * (0.0005 + i * 0.00015)
    };

    scene.add(plane);
    fogSprites.push(plane);
  }

  for (let i = 0; i < CFG.fogSpriteCount; i += 1) {
    const material = new THREE.SpriteMaterial({
      map: fogTexture,
      alphaMap: fogTexture,
      color: 0xffffff,
      transparent: true,
      opacity: CFG.fogSpriteOpacity,
      depthWrite: false,
      depthTest: true,
      fog: false,
      toneMapped: false
    });

    material.alphaTest = 0.02;

    const sprite = new THREE.Sprite(material);
    sprite.renderOrder = 4;

    const baseAngle = (i / CFG.fogSpriteCount) * Math.PI * 2;
    const baseRadius = 1.8 + Math.random() * 3.6;
    const baseY = THREE.MathUtils.lerp(-1.45, 2.25, Math.random());
    const scale = 2.8 + Math.random() * 4.2;

    sprite.position.set(
      Math.cos(baseAngle) * baseRadius,
      baseY,
      Math.sin(baseAngle) * baseRadius
    );
    sprite.scale.set(scale, scale * (0.58 + Math.random() * 0.24), 1);

    sprite.userData = {
      baseAngle,
      baseRadius,
      baseY,
      scale,
      phase: Math.random() * Math.PI * 2,
      orbitSpeed: 0.015 + Math.random() * 0.035,
      driftSpeed: 0.05 + Math.random() * 0.09,
      driftAmount: 0.16 + Math.random() * 0.34,
      centralFog: false
    };

    scene.add(sprite);
    fogSprites.push(sprite);
  }
}

function createGroundGlow() {
  const glow = new THREE.Mesh(
    new THREE.CircleGeometry(2.35, 64),
    new THREE.MeshBasicMaterial({
      color: 0x56aee5,
      transparent: true,
      opacity: 0.2,
      depthWrite: false,
      toneMapped: false,
      fog: false
    })
  );
  glow.rotation.x = -Math.PI / 2;
  glow.position.y = -1.5;
  glow.renderOrder = 1;
  scene.add(glow);
}

function createFlagMaterial(texture) {
  return new THREE.ShaderMaterial({
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
    uniforms: {
      uMap: { value: texture },
      uReveal: { value: 0.0 },
      uOpacity: { value: 1.0 }
    },
    vertexShader: `
      uniform float uReveal;
      varying vec2 vUv;

      void main() {
        vUv = uv;

        vec3 pos = position;

        float edge = mix(-0.20, 1.20, uReveal);
        float band = exp(-pow((uv.x - edge) * 14.0, 2.0));

        float ripple =
          sin(uv.y * 22.0 + edge * 18.0) * 0.030 * band +
          sin(uv.y * 11.0 + edge * 10.0) * 0.012 * band;

        pos.z += ripple;
        pos.x += sin(uv.y * 9.0 + edge * 12.0) * 0.012 * band;

        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D uMap;
      uniform float uReveal;
      uniform float uOpacity;

      varying vec2 vUv;

      void main() {
        vec4 tex = texture2D(uMap, vUv);
        if (tex.a < 0.02) discard;

        float gray = dot(tex.rgb, vec3(0.299, 0.587, 0.114));
        vec3 bw = vec3(gray);

        float edge = mix(-0.20, 1.20, uReveal);
        float waveOffset = sin(vUv.y * 22.0 + edge * 18.0) * 0.035;
        float revealMask = 1.0 - smoothstep(
          edge - 0.14 + waveOffset,
          edge + 0.14 + waveOffset,
          vUv.x
        );

        vec3 finalColor = mix(bw, tex.rgb, revealMask);

        gl_FragColor = vec4(finalColor, tex.a * uOpacity);
      }
    `
  });
}

function createFlags(loader) {
  ORBIT_ITEMS.forEach((item) => {
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
    : (typeof ASSETS.model === "string" ? ASSETS.model.trim() : "");

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
    child.renderOrder = 6;

    if (!child.material) {
      child.material = new THREE.MeshStandardMaterial({
        color: 0xe7eef5,
        roughness: 0.72,
        metalness: 0.04
      });
      return;
    }

    if (Array.isArray(child.material)) {
      child.material = child.material.map((mat) => prepareMaterial(mat));
    } else {
      child.material = prepareMaterial(child.material);
    }
  });

  centerAndScaleModel(centralModel);
  orbitRoot.add(centralModel);
}

function prepareMaterial(material) {
  const base = material?.isMaterial
    ? material
    : new THREE.MeshStandardMaterial({ color: 0xe7eef5, roughness: 0.76, metalness: 0.03 });

  const fallbackColor = base.color ? base.color.clone() : new THREE.Color(0xe7eef5);
  const safeMaterial = new THREE.MeshStandardMaterial({
    color: fallbackColor,
    roughness: typeof base.roughness === "number" ? base.roughness : 0.76,
    metalness: typeof base.metalness === "number" ? base.metalness : 0.03,
    side: THREE.DoubleSide,
    transparent: false,
    opacity: 1,
    depthWrite: true,
    depthTest: true
  });

  if (base.map) {
    safeMaterial.map = base.map;
    safeMaterial.map.colorSpace = THREE.SRGBColorSpace;
    safeMaterial.map.anisotropy = renderer.capabilities.getMaxAnisotropy();
  }

  if (base.normalMap) {
    safeMaterial.normalMap = base.normalMap;
    safeMaterial.normalMap.anisotropy = renderer.capabilities.getMaxAnisotropy();
  }

  if (base.roughnessMap) safeMaterial.roughnessMap = base.roughnessMap;
  if (base.metalnessMap) safeMaterial.metalnessMap = base.metalnessMap;
  if (base.emissiveMap) {
    safeMaterial.emissiveMap = base.emissiveMap;
    safeMaterial.emissiveMap.colorSpace = THREE.SRGBColorSpace;
    safeMaterial.emissive.copy(base.emissive ?? new THREE.Color(0x000000));
    safeMaterial.emissiveIntensity = typeof base.emissiveIntensity === "number" ? base.emissiveIntensity : 1;
  }

  safeMaterial.needsUpdate = true;
  return safeMaterial;
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

function createFallbackModel() {
  const fallback = new THREE.Group();

  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.44, 1.2, 8, 16),
    new THREE.MeshStandardMaterial({
      color: 0xdde7f0,
      roughness: 0.72,
      metalness: 0.04
    })
  );
  body.position.y = -0.05;
  fallback.add(body);

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.36, 20, 20),
    new THREE.MeshStandardMaterial({
      color: 0xebf2f8,
      roughness: 0.72,
      metalness: 0.04
    })
  );
  head.position.y = 0.96;
  fallback.add(head);

  fallback.position.y = CFG.modelLift;
  centralModel = fallback;
  orbitRoot.add(centralModel);
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

  enterButton?.addEventListener("click", async () => {
    if (!isReady) return;

    hasEntered = true;
    document.body.classList.add("is-entered");
    loaderOverlay?.setAttribute("aria-hidden", "true");
    if (focusHint) focusHint.style.opacity = "1";

    try {
      ambientAudio.volume = 0.55;
      ambientAudio.currentTime = 0;
      if (soundEnabled) {
        await ambientAudio.play();
      }
    } catch (error) {
      console.warn("Audio did not start automatically.", error);
    }
  });

  muteButton?.addEventListener("click", async () => {
    soundEnabled = !soundEnabled;
    muteButton.textContent = soundEnabled ? "Sound On" : "Sound Off";

    if (!hasEntered) return;

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

  const elapsed = clock.getElapsedTime();
  currentProgress = THREE.MathUtils.lerp(currentProgress, targetProgress, 0.085);

  updateCamera(elapsed);
  updateFlags();
  updateLabels();
  updateIntersections();
  updateFog(elapsed);

  renderer.render(scene, camera);
}

function updateCamera(elapsed) {
  const orbitTheta = currentProgress * Math.PI * 2 * CFG.cameraTurns;

  camera.position.set(
    Math.cos(orbitTheta) * CFG.cameraRadius,
    CFG.lookY + Math.sin(elapsed * 0.5) * 0.04,
    Math.sin(orbitTheta) * CFG.cameraRadius
  );

  camera.lookAt(0, CFG.lookY, 0);

  if (skySphere) {
    skySphere.position.copy(camera.position);
    skySphere.rotation.y = -orbitTheta * 0.18;
    skySphere.rotation.x = Math.sin(elapsed * 0.10) * 0.01;
  }
}

function updateFlags() {
  const total = flagEntries.length;
  const frontIndex = currentProgress * (total - 1);
  const orbitTheta = currentProgress * Math.PI * 2 * CFG.cameraTurns;

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

    working.eA.set(-0.09, 0.02, -0.05);
    working.qC.setFromEuler(working.eA);
    working.qA.multiply(working.qC);

    const cameraDistance = entry.group.position.distanceTo(camera.position);
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
    entry.revealValue = THREE.MathUtils.lerp(entry.revealValue, entry.revealTarget, 0.11);

    entry.material.uniforms.uReveal.value = entry.revealValue;
    entry.material.uniforms.uOpacity.value = finalOpacity;

    entry.group.visible = finalOpacity > 0.02;
  });
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

    if (data.centralFog) {
      fogObj.position.y += Math.sin(elapsed * data.bob + data.phase) * 0.0008;
      fogObj.rotation.z += data.spin;
      return;
    }

    const orbitAngle =
      data.baseAngle +
      elapsed * data.orbitSpeed +
      Math.sin(elapsed * 0.16 + data.phase) * 0.15;

    const radius =
      data.baseRadius +
      Math.sin(elapsed * data.driftSpeed + data.phase) * data.driftAmount;

    const y =
      data.baseY +
      Math.sin(elapsed * (data.driftSpeed * 1.7) + index) * 0.12;

    fogObj.position.set(
      Math.cos(orbitAngle) * radius,
      y,
      Math.sin(orbitAngle) * radius
    );

    const pulse = 0.95 + Math.sin(elapsed * (data.driftSpeed * 2) + data.phase) * 0.05;

    fogObj.scale.set(data.scale * pulse, data.scale * 0.62 * pulse, 1);
    fogObj.material.rotation += 0.00035 + index * 0.000005;
  });

  if (centralModel) {
    centralModel.rotation.y += 0.0009;
  }
}

function smoothstep(edge0, edge1, x) {
  const t = THREE.MathUtils.clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}
