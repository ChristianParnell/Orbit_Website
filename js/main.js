import * as THREE from "https://esm.sh/three@0.160.0";
import { FBXLoader } from "https://esm.sh/three@0.160.0/examples/jsm/loaders/FBXLoader.js";
import { GLTFLoader } from "https://esm.sh/three@0.160.0/examples/jsm/loaders/GLTFLoader.js";
import { ASSETS, ORBIT_ITEMS, SCENE_CONFIG } from "./config.js";

const CFG = {
  ...SCENE_CONFIG,

  cameraRadius: 4.2,
  folderRadius: 2.35,
  helixAngleStep: 0.72,
  helixRise: 0.92,
  scrollSpeed: 0.00042,
  touchSpeed: 0.0018,

  folderWidth: SCENE_CONFIG.folderWidth ?? 1.65,
  folderHeight: SCENE_CONFIG.folderHeight ?? 1.04,

  modelY: 0.15,
  lookY: 0.35,

  nearStraightenStart: 3.4,
  nearStraightenEnd: 1.65,

  fogDensity: 0.04,
  skyOpacity: 0.98
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
scene.background = new THREE.Color(0x071018);
scene.fog = new THREE.FogExp2(0x071018, CFG.fogDensity);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: false,
  powerPreference: "high-performance"
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x071018, 1);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.16;

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.set(0, 1.2, CFG.cameraRadius);

const clock = new THREE.Clock();
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2(-10, -10);
const UP = new THREE.Vector3(0, 1, 0);

let isReady = false;
let hasEntered = false;
let soundEnabled = true;
let currentProgress = 0.02;
let targetProgress = 0.02;
let hoveredItem = null;
let dragActive = false;
let lastTouchY = 0;

const orbitRoot = new THREE.Group();
scene.add(orbitRoot);

const working = {
  vectorA: new THREE.Vector3(),
  vectorB: new THREE.Vector3(),
  vectorC: new THREE.Vector3(),
  vectorD: new THREE.Vector3(),
  quatA: new THREE.Quaternion(),
  quatB: new THREE.Quaternion(),
  matrixA: new THREE.Matrix4(),
  eulerA: new THREE.Euler()
};

const folderObjects = [];
const fogSprites = [];

let centralModel = null;
let skySphere = null;
let rearBackdrop = null;

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
    progressText.textContent = "Assets loaded. Enter the portfolio.";
  }
};
manager.onError = (url) => {
  console.warn("Asset failed to load:", url);
};

const textureLoader = new THREE.TextureLoader(manager);
const fbxLoader = new FBXLoader(manager);
const gltfLoader = new GLTFLoader(manager);

initScene();
attachEvents();
animate();

function initScene() {
  createBackground(textureLoader);
  createFog(textureLoader);
  createGroundGlow();
  createFolders(textureLoader);
  loadCenterModel();
}

function setupLighting() {
  const hemi = new THREE.HemisphereLight(0xdff3ff, 0x041018, 1.28);
  scene.add(hemi);

  const key = new THREE.DirectionalLight(0xf7fbff, 2.3);
  key.position.set(5.5, 8, 6.5);
  scene.add(key);

  const rim = new THREE.DirectionalLight(0x8fcfff, 1.8);
  rim.position.set(-6.5, 3.8, -5.5);
  scene.add(rim);

  const fill = new THREE.PointLight(0xa8ddff, 1.25, 16, 2);
  fill.position.set(0, 1.8, 1.2);
  scene.add(fill);
}

function createBackground(loader) {
  const skyTexture = loader.load(ASSETS.sky);
  skyTexture.colorSpace = THREE.SRGBColorSpace;
  skyTexture.wrapS = THREE.RepeatWrapping;
  skyTexture.wrapT = THREE.ClampToEdgeWrapping;
  skyTexture.repeat.set(1.15, 1);

  const sphereGeo = new THREE.SphereGeometry(80, 56, 56);
  const sphereMat = new THREE.MeshBasicMaterial({
    map: skyTexture,
    side: THREE.BackSide,
    transparent: true,
    opacity: CFG.skyOpacity
  });

  skySphere = new THREE.Mesh(sphereGeo, sphereMat);
  scene.add(skySphere);

  const plateGeo = new THREE.PlaneGeometry(36, 22, 1, 1);
  const plateMat = new THREE.MeshBasicMaterial({
    map: skyTexture,
    transparent: true,
    opacity: 0.4,
    depthWrite: false
  });

  rearBackdrop = new THREE.Mesh(plateGeo, plateMat);
  rearBackdrop.position.set(0, 1.8, -10);
  scene.add(rearBackdrop);
}

function createFog(loader) {
  const fogTexture = loader.load(ASSETS.fog);
  fogTexture.colorSpace = THREE.SRGBColorSpace;

  for (let i = 0; i < 38; i += 1) {
    const material = new THREE.SpriteMaterial({
      map: fogTexture,
      color: 0x9fd3ef,
      transparent: true,
      opacity: 0.05,
      depthWrite: false,
      depthTest: false
    });

    const sprite = new THREE.Sprite(material);

    const baseAngle = (i / 38) * Math.PI * 2;
    const baseRadius = 2.4 + Math.random() * 4.8;
    const baseY = THREE.MathUtils.lerp(-1.5, 3.2, Math.random());
    const scale = 3.2 + Math.random() * 3.8;

    sprite.position.set(
      Math.cos(baseAngle) * baseRadius,
      baseY,
      Math.sin(baseAngle) * baseRadius
    );
    sprite.scale.set(scale, scale * (0.55 + Math.random() * 0.35), 1);

    sprite.userData = {
      baseAngle,
      baseRadius,
      baseY,
      scale,
      phase: Math.random() * Math.PI * 2,
      orbitSpeed: 0.025 + Math.random() * 0.06,
      driftSpeed: 0.09 + Math.random() * 0.16,
      driftAmount: 0.18 + Math.random() * 0.55
    };

    scene.add(sprite);
    fogSprites.push(sprite);
  }
}

function createGroundGlow() {
  const glow = new THREE.Mesh(
    new THREE.CircleGeometry(2.75, 56),
    new THREE.MeshBasicMaterial({
      color: 0x5caee4,
      transparent: true,
      opacity: 0.13,
      depthWrite: false
    })
  );
  glow.rotation.x = -Math.PI / 2;
  glow.position.y = -1.9;
  scene.add(glow);
}

function createFolders(loader) {
  const folderWidth = CFG.folderWidth;
  const folderHeight = CFG.folderHeight;

  ORBIT_ITEMS.forEach((item, index) => {
    const group = new THREE.Group();
    group.userData.item = item;
    orbitRoot.add(group);

    const base = new THREE.Mesh(
      new THREE.BoxGeometry(folderWidth, folderHeight, 0.11),
      new THREE.MeshStandardMaterial({
        color: 0xdbe9f7,
        roughness: 0.66,
        metalness: 0.06,
        transparent: true,
        opacity: 1
      })
    );
    group.add(base);

    const coverTexture = loader.load(item.cover);
    coverTexture.colorSpace = THREE.SRGBColorSpace;
    coverTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();

    const cover = new THREE.Mesh(
      new THREE.PlaneGeometry(folderWidth * 0.92, folderHeight * 0.88),
      new THREE.MeshBasicMaterial({
        map: coverTexture,
        transparent: true,
        opacity: 1
      })
    );
    cover.position.z = 0.061;
    group.add(cover);

    const tab = new THREE.Mesh(
      new THREE.BoxGeometry(folderWidth * 0.28, 0.16, 0.09),
      new THREE.MeshStandardMaterial({
        color: 0xf4f8fc,
        roughness: 0.52,
        metalness: 0.06
      })
    );
    tab.position.set(-folderWidth * 0.18, folderHeight * 0.52, 0);
    group.add(tab);

    const spine = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, folderHeight * 0.9, 0.12),
      new THREE.MeshStandardMaterial({
        color: 0xb6d5ef,
        roughness: 0.48,
        metalness: 0.05
      })
    );
    spine.position.x = -folderWidth * 0.5 + 0.04;
    group.add(spine);

    const labelAnchor = new THREE.Object3D();
    labelAnchor.position.set(-folderWidth * 0.66, 0.12, 0.12);
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
    labelsRoot?.appendChild(labelNode);

    folderObjects.push({
      index,
      item,
      group,
      base,
      cover,
      labelAnchor,
      labelNode
    });
  });
}

function loadCenterModel() {
  const gltfPath = ASSETS.modelGLTF || ASSETS.modelGlb || ASSETS.modelGLB || null;

  if (gltfPath) {
    gltfLoader.load(
      gltfPath,
      (gltf) => {
        setupLoadedModel(gltf.scene);
      },
      undefined,
      () => {
        loadFBXFallback();
      }
    );
  } else {
    loadFBXFallback();
  }
}

function loadFBXFallback() {
  fbxLoader.load(
    ASSETS.model,
    (fbx) => {
      setupLoadedModel(fbx);
    },
    undefined,
    () => {
      createFallbackModel();
    }
  );
}

function setupLoadedModel(modelRoot) {
  centralModel = modelRoot;

  centralModel.traverse((child) => {
    if (!child.isMesh) return;

    child.castShadow = false;
    child.receiveShadow = false;

    if (child.material) {
      if (Array.isArray(child.material)) {
        child.material.forEach((mat) => prepareMaterial(mat));
      } else {
        prepareMaterial(child.material);
      }
    } else {
      child.material = new THREE.MeshStandardMaterial({
        color: 0xe6eef5,
        roughness: 0.72,
        metalness: 0.04
      });
    }
  });

  centerAndScaleModel(centralModel);
  orbitRoot.add(centralModel);
}

function prepareMaterial(material) {
  material.side = THREE.DoubleSide;

  if ("map" in material && material.map) {
    material.map.colorSpace = THREE.SRGBColorSpace;
    material.map.anisotropy = renderer.capabilities.getMaxAnisotropy();
    material.needsUpdate = true;
  }
}

function centerAndScaleModel(model) {
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());

  const targetHeight = 3.2;
  const scale = size.y > 0 ? targetHeight / size.y : 1;
  model.scale.setScalar(scale);

  model.position.x -= center.x * scale;
  model.position.y -= center.y * scale;
  model.position.z -= center.z * scale;

  model.position.y += CFG.modelY;
  model.rotation.y = Math.PI * 0.08;
}

function createFallbackModel() {
  const fallback = new THREE.Group();

  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.5, 1.35, 8, 16),
    new THREE.MeshStandardMaterial({
      color: 0xdde7f1,
      roughness: 0.72,
      metalness: 0.04
    })
  );
  body.position.y = -0.3;
  fallback.add(body);

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.42, 20, 20),
    new THREE.MeshStandardMaterial({
      color: 0xebf2f8,
      roughness: 0.72,
      metalness: 0.04
    })
  );
  head.position.y = 1.05;
  fallback.add(head);

  fallback.position.y = CFG.modelY;
  centralModel = fallback;
  orbitRoot.add(centralModel);
}

function attachEvents() {
  window.addEventListener("resize", onResize);

  window.addEventListener("wheel", (event) => {
    if (!hasEntered) return;
    targetProgress += event.deltaY * CFG.scrollSpeed;
    targetProgress = THREE.MathUtils.clamp(targetProgress, 0, 1);
  }, { passive: true });

  window.addEventListener("pointermove", (event) => {
    const bounds = renderer.domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
    pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
  });

  window.addEventListener("click", () => {
    if (!hasEntered) return;
    if (hoveredItem) {
      window.location.href = hoveredItem.item.href;
    }
  });

  window.addEventListener("touchstart", (event) => {
    if (!hasEntered) return;
    dragActive = true;
    lastTouchY = event.touches[0].clientY;
  }, { passive: true });

  window.addEventListener("touchmove", (event) => {
    if (!hasEntered || !dragActive) return;
    const currentY = event.touches[0].clientY;
    const delta = lastTouchY - currentY;
    lastTouchY = currentY;
    targetProgress += delta * CFG.touchSpeed;
    targetProgress = THREE.MathUtils.clamp(targetProgress, 0, 1);
  }, { passive: true });

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
      if (soundEnabled) await ambientAudio.play();
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
  currentProgress = THREE.MathUtils.lerp(currentProgress, targetProgress, 0.09);

  updateCamera(elapsed);
  updateFolders(elapsed);
  updateLabels();
  updateIntersections();
  updateFog(elapsed);

  renderer.render(scene, camera);
}

function updateCamera(elapsed) {
  const orbitTheta = currentProgress * Math.PI * 2 * 1.15;
  const radius = CFG.cameraRadius;

  camera.position.set(
    Math.cos(orbitTheta) * radius,
    CFG.lookY + Math.sin(elapsed * 0.55) * 0.05,
    Math.sin(orbitTheta) * radius
  );

  camera.lookAt(0, CFG.lookY, 0);

  if (skySphere) {
    skySphere.rotation.y = -orbitTheta * 0.22;
    skySphere.rotation.x = Math.sin(elapsed * 0.14) * 0.03;
  }

  if (rearBackdrop) {
    rearBackdrop.position.set(
      Math.cos(orbitTheta + Math.PI) * 9,
      1.8,
      Math.sin(orbitTheta + Math.PI) * 9
    );
    rearBackdrop.lookAt(camera.position);
  }
}

function updateFolders(elapsed) {
  const total = folderObjects.length;
  const frontIndex = currentProgress * (total - 1);
  const orbitTheta = currentProgress * Math.PI * 2 * 1.15;

  folderObjects.forEach((entry, index) => {
    const relative = index - frontIndex;

    const theta = orbitTheta + relative * CFG.helixAngleStep;
    const y = CFG.lookY + relative * CFG.helixRise + Math.sin(elapsed * 0.8 + index * 1.2) * 0.04;

    entry.group.position.set(
      Math.cos(theta) * CFG.folderRadius,
      y,
      Math.sin(theta) * CFG.folderRadius
    );

    const outDir = working.vectorA
      .set(entry.group.position.x, 0, entry.group.position.z)
      .normalize();

    const outwardTarget = working.vectorB.copy(entry.group.position).addScaledVector(outDir, 2);
    working.matrixA.lookAt(entry.group.position, outwardTarget, UP);
    working.quatA.setFromRotationMatrix(working.matrixA);

    working.eulerA.set(-0.28, 0.08, -0.11);
    working.quatA.multiply(new THREE.Quaternion().setFromEuler(working.eulerA));

    const cameraDistance = entry.group.position.distanceTo(camera.position);
    const straighten = smoothstep(CFG.nearStraightenStart, CFG.nearStraightenEnd, cameraDistance);

    working.matrixA.lookAt(entry.group.position, camera.position, UP);
    working.quatB.setFromRotationMatrix(working.matrixA);

    entry.group.quaternion.slerpQuaternions(working.quatA, working.quatB, straighten);

    const opacityDistance = THREE.MathUtils.clamp(1 - (cameraDistance - 1.5) / 4.4, 0.1, 1);
    const opacityRange = THREE.MathUtils.clamp(1 - Math.abs(relative) / (total * 0.58), 0.14, 1);
    const opacity = Math.min(opacityDistance, opacityRange);

    entry.base.material.opacity = opacity * 0.96;
    entry.cover.material.opacity = opacity;
    entry.group.visible = opacity > 0.025;

    if (entry.labelNode) {
      entry.labelNode.style.opacity = `${opacity}`;
    }
  });
}

function updateLabels() {
  const width = window.innerWidth;
  const height = window.innerHeight;

  folderObjects.forEach((entry) => {
    working.vectorC.setFromMatrixPosition(entry.labelAnchor.matrixWorld);
    working.vectorC.project(camera);

    const visible = working.vectorC.z < 1 && working.vectorC.z > -1 && entry.group.visible;

    if (!visible) {
      if (entry.labelNode) entry.labelNode.style.opacity = "0";
      return;
    }

    const x = (working.vectorC.x * 0.5 + 0.5) * width;
    const y = (-working.vectorC.y * 0.5 + 0.5) * height;

    if (entry.labelNode) {
      entry.labelNode.style.transform = `translate(calc(${x}px - 100%), calc(${y}px - 50%))`;
    }
  });
}

function updateIntersections() {
  if (!hasEntered) return;

  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(folderObjects.map((entry) => entry.cover), false);

  hoveredItem = null;
  if (hits.length > 0) {
    const hit = hits[0];
    hoveredItem = folderObjects.find((entry) => entry.cover === hit.object) || null;
  }

  renderer.domElement.style.cursor = hoveredItem ? "pointer" : "grab";
}

function updateFog(elapsed) {
  fogSprites.forEach((sprite, index) => {
    const data = sprite.userData;

    const orbitAngle = data.baseAngle + elapsed * data.orbitSpeed + Math.sin(elapsed * 0.16 + data.phase) * 0.15;
    const radius = data.baseRadius + Math.sin(elapsed * data.driftSpeed + data.phase) * data.driftAmount;
    const y = data.baseY + Math.sin(elapsed * (data.driftSpeed * 1.8) + index) * 0.2;

    sprite.position.set(
      Math.cos(orbitAngle) * radius,
      y,
      Math.sin(orbitAngle) * radius
    );

    const pulse = 0.94 + Math.sin(elapsed * (data.driftSpeed * 2) + data.phase) * 0.08;
    sprite.scale.set(data.scale * pulse, data.scale * 0.62 * pulse, 1);
    sprite.material.rotation += 0.00055 + index * 0.000008;
  });

  if (centralModel) {
    centralModel.rotation.y += 0.001;
  }
}

function smoothstep(edge0, edge1, x) {
  const t = THREE.MathUtils.clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}