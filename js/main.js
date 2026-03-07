import * as THREE from "three";
import { FBXLoader } from "three/addons/loaders/FBXLoader.js";
import { ASSETS, ORBIT_ITEMS, SCENE_CONFIG } from "./config.js";

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
scene.fog = new THREE.FogExp2(0x071018, 0.055);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true,
  powerPreference: "high-performance"
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.set(0, 1.2, SCENE_CONFIG.cameraRadius);

const clock = new THREE.Clock();

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2(-10, -10);

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
const labelEntries = new Map();

const lighting = setupLighting();
const particles = [];
let centralModel = null;
let skySphere = null;

const manager = new THREE.LoadingManager();
manager.onProgress = (_, loaded, total) => {
  const pct = total > 0 ? Math.round((loaded / total) * 100) : 0;
  progressFill.style.width = `${pct}%`;
  progressText.textContent = `Loading assets… ${pct}%`;
};
manager.onLoad = () => {
  isReady = true;
  enterButton.disabled = false;
  enterButton.textContent = "Enter site";
  progressText.textContent = "Assets loaded. Enter the portfolio.";
};
manager.onError = (url) => {
  console.warn("Asset failed to load:", url);
};

const textureLoader = new THREE.TextureLoader(manager);
const fbxLoader = new FBXLoader(manager);

initScene();
attachEvents();
animate();

function initScene() {
  createSky(textureLoader);
  createAtmosphere(textureLoader);
  createGroundGlow();
  createFolders(textureLoader);
  loadCenterModel();
}

function setupLighting() {
  const hemi = new THREE.HemisphereLight(0xcfefff, 0x051019, 1.15);
  scene.add(hemi);

  const key = new THREE.DirectionalLight(0xf3f9ff, 2.2);
  key.position.set(5, 8, 6);
  scene.add(key);

  const rim = new THREE.DirectionalLight(0x8dc8ff, 1.5);
  rim.position.set(-6, 3, -5);
  scene.add(rim);

  const fill = new THREE.PointLight(0x9fd8ff, 1.25, 18, 2);
  fill.position.set(0, 1.4, 0);
  scene.add(fill);

  return { hemi, key, rim, fill };
}

function createSky(loader) {
  const texture = loader.load(ASSETS.sky);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;

  const geometry = new THREE.SphereGeometry(80, 48, 48);
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    side: THREE.BackSide,
    transparent: true,
    opacity: 0.82
  });

  skySphere = new THREE.Mesh(geometry, material);
  scene.add(skySphere);
}

function createAtmosphere(loader) {
  const fogTexture = loader.load(ASSETS.fog);
  fogTexture.colorSpace = THREE.SRGBColorSpace;

  for (let i = 0; i < 26; i += 1) {
    const material = new THREE.SpriteMaterial({
      map: fogTexture,
      color: 0x8bbfe5,
      transparent: true,
      opacity: 0.065,
      depthWrite: false,
      depthTest: false
    });

    const sprite = new THREE.Sprite(material);
    const angle = (i / 26) * Math.PI * 2.0;
    const radius = 7.5 + Math.sin(i * 2.1) * 1.25;
    sprite.position.set(
      Math.cos(angle) * radius,
      THREE.MathUtils.lerp(-2.6, 3.2, i / 25),
      Math.sin(angle) * radius
    );
    const scale = 5.6 + (i % 4) * 0.65;
    sprite.scale.set(scale, scale * 0.72, 1);
    scene.add(sprite);
    particles.push(sprite);
  }
}

function createGroundGlow() {
  const geometry = new THREE.CircleGeometry(3.1, 48);
  const material = new THREE.MeshBasicMaterial({
    color: 0x4aa1d9,
    transparent: true,
    opacity: 0.1,
    depthWrite: false
  });

  const glow = new THREE.Mesh(geometry, material);
  glow.rotation.x = -Math.PI / 2;
  glow.position.y = -2.55;
  scene.add(glow);
}

function createFolders(loader) {
  const folderWidth = SCENE_CONFIG.folderWidth;
  const folderHeight = SCENE_CONFIG.folderHeight;

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
    coverTexture.anisotropy = 8;

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
    labelsRoot.appendChild(labelNode);

    folderObjects.push({
      index,
      item,
      group,
      base,
      cover,
      tab,
      spine,
      labelAnchor,
      labelNode,
      phaseOffset: index / ORBIT_ITEMS.length
    });

    labelEntries.set(item.id, labelNode);
  });
}

function loadCenterModel() {
  fbxLoader.load(
    ASSETS.model,
    (fbx) => {
      centralModel = fbx;
      centralModel.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = false;
          child.receiveShadow = false;
          if (!child.material) {
            child.material = new THREE.MeshStandardMaterial({
              color: 0xe6eef5,
              roughness: 0.72,
              metalness: 0.04
            });
          } else if (Array.isArray(child.material)) {
            child.material.forEach((material) => {
              material.side = THREE.DoubleSide;
            });
          } else {
            child.material.side = THREE.DoubleSide;
          }
        }
      });

      const box = new THREE.Box3().setFromObject(centralModel);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      const targetHeight = 3.55;
      const scale = size.y > 0 ? targetHeight / size.y : 1;
      centralModel.scale.setScalar(scale);
      centralModel.position.sub(center.multiplyScalar(scale));
      centralModel.position.y = -2.35;
      centralModel.rotation.y = Math.PI * 0.08;
      orbitRoot.add(centralModel);
    },
    undefined,
    () => {
      createFallbackModel();
    }
  );
}

function createFallbackModel() {
  const fallback = new THREE.Group();

  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.5, 1.4, 8, 16),
    new THREE.MeshStandardMaterial({
      color: 0xdde7f1,
      roughness: 0.72,
      metalness: 0.04
    })
  );
  body.position.y = -1.35;
  fallback.add(body);

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.42, 20, 20),
    new THREE.MeshStandardMaterial({
      color: 0xebf2f8,
      roughness: 0.72,
      metalness: 0.04
    })
  );
  head.position.y = 0.05;
  fallback.add(head);

  const shoulder = new THREE.Mesh(
    new THREE.TorusGeometry(0.56, 0.05, 12, 32),
    new THREE.MeshStandardMaterial({
      color: 0xa8cfee,
      roughness: 0.55,
      metalness: 0.04
    })
  );
  shoulder.rotation.x = Math.PI / 2;
  shoulder.position.y = -0.55;
  fallback.add(shoulder);

  centralModel = fallback;
  orbitRoot.add(centralModel);
}

function attachEvents() {
  window.addEventListener("resize", onResize);

  window.addEventListener(
    "wheel",
    (event) => {
      if (!hasEntered) return;
      targetProgress += event.deltaY * SCENE_CONFIG.scrollSpeed;
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
    targetProgress += delta * SCENE_CONFIG.touchSpeed;
    targetProgress = THREE.MathUtils.clamp(targetProgress, 0, 1);
  }, { passive: true });

  window.addEventListener("touchend", () => {
    dragActive = false;
  });

  window.addEventListener("keydown", (event) => {
    if (!hasEntered) return;
    if (event.key === "ArrowDown" || event.key === "PageDown") {
      targetProgress = THREE.MathUtils.clamp(targetProgress + 0.035, 0, 1);
    } else if (event.key === "ArrowUp" || event.key === "PageUp") {
      targetProgress = THREE.MathUtils.clamp(targetProgress - 0.035, 0, 1);
    }
  });

  enterButton.addEventListener("click", async () => {
    if (!isReady) return;

    hasEntered = true;
    document.body.classList.add("is-entered");
    loaderOverlay.setAttribute("aria-hidden", "true");
    focusHint.style.opacity = "1";

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

  muteButton.addEventListener("click", async () => {
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
  currentProgress = THREE.MathUtils.lerp(currentProgress, targetProgress, 0.065);

  updateCamera(elapsed);
  updateFolderTransforms(elapsed);
  updateLabelPositions();
  updatePointerIntersections();
  updateAtmosphere(elapsed);

  renderer.render(scene, camera);
}

function updateCamera(elapsed) {
  const t = currentProgress;
  const theta = t * Math.PI * 2 * SCENE_CONFIG.turns;
  const radius = SCENE_CONFIG.cameraRadius;
  const y = THREE.MathUtils.lerp(SCENE_CONFIG.cameraHeightTop, SCENE_CONFIG.cameraHeightBottom, t);

  camera.position.set(
    Math.cos(theta) * radius,
    y + Math.sin(elapsed * 0.4) * 0.05,
    Math.sin(theta) * radius
  );

  const lookY = THREE.MathUtils.lerp(0.4, -0.5, t) + Math.sin(elapsed * 0.7) * 0.02;
  camera.lookAt(0, lookY, 0);

  if (skySphere) {
    skySphere.rotation.y = -theta * 0.28;
    skySphere.rotation.x = Math.sin(theta * 0.55) * 0.04;
  }
}

function updateFolderTransforms(elapsed) {
  const total = ORBIT_ITEMS.length;
  const turns = SCENE_CONFIG.turns;
  const folderRadius = SCENE_CONFIG.coverRadius;

  folderObjects.forEach((entry, index) => {
    const normalized = total === 1 ? 0 : index / (total - 1);
    const theta = normalized * Math.PI * 2 * turns + Math.PI * 0.18;
    const y = THREE.MathUtils.lerp(SCENE_CONFIG.coverHeightTop, SCENE_CONFIG.coverHeightBottom, normalized);
    const wobble = Math.sin(elapsed * 0.6 + index * 1.3) * 0.03;

    entry.group.position.set(
      Math.cos(theta) * folderRadius,
      y + wobble,
      Math.sin(theta) * folderRadius
    );

    const outDir = working.vectorA.set(entry.group.position.x, 0, entry.group.position.z).normalize();
    const baseTarget = working.vectorB.copy(entry.group.position).add(outDir.clone().multiplyScalar(2));
    working.matrixA.lookAt(entry.group.position, baseTarget, new THREE.Vector3(0, 1, 0));
    working.quatA.setFromRotationMatrix(working.matrixA);

    working.eulerA.set(-0.18, 0.16, -0.08);
    const tiltQuat = new THREE.Quaternion().setFromEuler(working.eulerA);
    working.quatA.multiply(tiltQuat);

    const cameraDistance = entry.group.position.distanceTo(camera.position);
    const straighten = smoothstep(5.8, 2.7, cameraDistance);

    working.matrixA.lookAt(entry.group.position, camera.position, new THREE.Vector3(0, 1, 0));
    working.quatB.setFromRotationMatrix(working.matrixA);

    entry.group.quaternion.slerpQuaternions(working.quatA, working.quatB, straighten);
    const swayQuat = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(0, 0, 1),
      Math.sin(elapsed * 0.85 + index * 0.5) * 0.06 * (1 - straighten)
    );
    entry.group.quaternion.multiply(swayQuat);

    const opacity = THREE.MathUtils.clamp(1 - (cameraDistance - 2.2) / 5.8, 0.12, 1);
    entry.base.material.opacity = opacity * 0.95;
    entry.cover.material.opacity = opacity;
    entry.group.visible = opacity > 0.04;

    entry.labelNode.style.opacity = `${opacity * 0.98}`;
  });
}

function updateLabelPositions() {
  const width = window.innerWidth;
  const height = window.innerHeight;

  folderObjects.forEach((entry) => {
    working.vectorC.setFromMatrixPosition(entry.labelAnchor.matrixWorld);
    working.vectorC.project(camera);

    const visible =
      working.vectorC.z < 1 &&
      working.vectorC.z > -1 &&
      entry.group.visible;

    if (!visible) {
      entry.labelNode.style.opacity = "0";
      return;
    }

    const x = (working.vectorC.x * 0.5 + 0.5) * width;
    const y = (-working.vectorC.y * 0.5 + 0.5) * height;

    entry.labelNode.style.transform = `translate(calc(${x}px - 100%), calc(${y}px - 50%))`;
  });
}

function updatePointerIntersections() {
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

function updateAtmosphere(elapsed) {
  particles.forEach((sprite, index) => {
    sprite.position.y += Math.sin(elapsed * 0.16 + index * 0.7) * 0.0012;
    sprite.material.rotation += 0.0007 + index * 0.00001;
  });

  if (centralModel) {
    centralModel.rotation.y += 0.0012;
  }
}

function smoothstep(edge0, edge1, x) {
  const t = THREE.MathUtils.clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}
