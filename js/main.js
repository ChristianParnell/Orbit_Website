import * as THREE from "https://esm.sh/three@0.160.0";
import { FBXLoader } from "https://esm.sh/three@0.160.0/examples/jsm/loaders/FBXLoader.js";
import { ASSETS, ORBIT_ITEMS, SCENE_CONFIG } from "./config.js";

const CFG = {
  ...SCENE_CONFIG,
  cameraRadius: SCENE_CONFIG.cameraRadius ?? 6.9,
  coverRadius: SCENE_CONFIG.coverRadius ?? 4.55,
  turns: SCENE_CONFIG.turns ?? 1.15,
  folderWidth: SCENE_CONFIG.folderWidth ?? 1.7,
  folderHeight: SCENE_CONFIG.folderHeight ?? 1.08,
  scrollSpeed: SCENE_CONFIG.scrollSpeed ?? 0.00038,
  touchSpeed: SCENE_CONFIG.touchSpeed ?? 0.0016,

  helixAngleStep: SCENE_CONFIG.helixAngleStep ?? 0.95,
  helixRise: SCENE_CONFIG.helixRise ?? 1.2,
  helixFrontOffset: SCENE_CONFIG.helixFrontOffset ?? 0.0,

  modelY: SCENE_CONFIG.modelY ?? -0.45,
  lookY: SCENE_CONFIG.lookY ?? 0.2,

  cameraHeightBob: SCENE_CONFIG.cameraHeightBob ?? 0.06,
  cameraOrbitTilt: SCENE_CONFIG.cameraOrbitTilt ?? 0.22
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
scene.fog = new THREE.FogExp2(0x071018, 0.045);

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
renderer.toneMappingExposure = 1.14;

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 220);
camera.position.set(0, 1.25, CFG.cameraRadius);

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
const particles = [];
let centralModel = null;
let skySphere = null;
let backPlate = null;

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

initScene();
attachEvents();
animate();

function initScene() {
  createSky(textureLoader);
  createBackPlate(textureLoader);
  createAtmosphere(textureLoader);
  createGroundGlow();
  createFolders(textureLoader);
  loadCenterModel();
}

function setupLighting() {
  const hemi = new THREE.HemisphereLight(0xdaf3ff, 0x041018, 1.25);
  scene.add(hemi);

  const key = new THREE.DirectionalLight(0xf6fbff, 2.3);
  key.position.set(6, 8, 6);
  scene.add(key);

  const rim = new THREE.DirectionalLight(0x8ecfff, 1.8);
  rim.position.set(-7, 4, -6);
  scene.add(rim);

  const fill = new THREE.PointLight(0x9fdcff, 1.35, 22, 2);
  fill.position.set(0, 1.7, 1.4);
  scene.add(fill);
}

function createSky(loader) {
  const texture = loader.load(ASSETS.sky);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.repeat.set(1.2, 1);

  const geometry = new THREE.SphereGeometry(92, 56, 56);
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    side: THREE.BackSide,
    transparent: true,
    opacity: 0.92
  });

  skySphere = new THREE.Mesh(geometry, material);
  scene.add(skySphere);
}

function createBackPlate(loader) {
  const texture = loader.load(ASSETS.sky);
  texture.colorSpace = THREE.SRGBColorSpace;

  const geometry = new THREE.PlaneGeometry(50, 28, 1, 1);
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    opacity: 0.28,
    depthWrite: false
  });

  backPlate = new THREE.Mesh(geometry, material);
  backPlate.position.set(0, 1.5, -15);
  scene.add(backPlate);
}

function createAtmosphere(loader) {
  const fogTexture = loader.load(ASSETS.fog);
  fogTexture.colorSpace = THREE.SRGBColorSpace;

  for (let i = 0; i < 34; i += 1) {
    const material = new THREE.SpriteMaterial({
      map: fogTexture,
      color: 0xa5d7f1,
      transparent: true,
      opacity: 0.05,
      depthWrite: false,
      depthTest: false
    });

    const sprite = new THREE.Sprite(material);

    const baseAngle = (i / 34) * Math.PI * 2;
    const baseRadius = 4.5 + Math.random() * 4.6;
    const baseY = THREE.MathUtils.lerp(-2.3, 3.6, Math.random());
    const scale = 3.8 + Math.random() * 4.5;

    sprite.position.set(
      Math.cos(baseAngle) * baseRadius,
      baseY,
      Math.sin(baseAngle) * baseRadius
    );
    sprite.scale.set(scale, scale * (0.52 + Math.random() * 0.42), 1);

    sprite.userData = {
      baseAngle,
      baseRadius,
      baseY,
      scale,
      driftSpeed: 0.08 + Math.random() * 0.18,
      orbitSpeed: 0.03 + Math.random() * 0.06,
      driftAmount: 0.25 + Math.random() * 0.7,
      phase: Math.random() * Math.PI * 2
    };

    scene.add(sprite);
    particles.push(sprite);
  }
}

function createGroundGlow() {
  const geometry = new THREE.CircleGeometry(3.5, 64);
  const material = new THREE.MeshBasicMaterial({
    color: 0x58aadf,
    transparent: true,
    opacity: 0.14,
    depthWrite: false
  });

  const glow = new THREE.Mesh(geometry, material);
  glow.rotation.x = -Math.PI / 2;
  glow.position.y = -2.2;
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
      tab,
      spine,
      labelAnchor,
      labelNode
    });
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

      const targetHeight = 3.6;
      const scale = size.y > 0 ? targetHeight / size.y : 1;

      centralModel.scale.setScalar(scale);

      centralModel.position.x -= center.x * scale;
      centralModel.position.y -= center.y * scale;
      centralModel.position.z -= center.z * scale;

      centralModel.position.y += CFG.modelY;
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
  body.position.y = -0.6;
  fallback.add(body);

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.42, 20, 20),
    new THREE.MeshStandardMaterial({
      color: 0xebf2f8,
      roughness: 0.72,
      metalness: 0.04
    })
  );
  head.position.y = 0.8;
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
  shoulder.position.y = 0.15;
  fallback.add(shoulder);

  fallback.position.y = CFG.modelY;
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
    if (hoveredItem) {
      window.location.href = hoveredItem.item.href;
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

  window.addEventListener("keydown", (event) => {
    if (!hasEntered) return;

    if (event.key === "ArrowDown" || event.key === "PageDown") {
      targetProgress = THREE.MathUtils.clamp(targetProgress + 0.04, 0, 1);
    } else if (event.key === "ArrowUp" || event.key === "PageUp") {
      targetProgress = THREE.MathUtils.clamp(targetProgress - 0.04, 0, 1);
    }
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
  currentProgress = THREE.MathUtils.lerp(currentProgress, targetProgress, 0.08);

  updateCamera(elapsed);
  updateFolderTransforms(elapsed);
  updateLabelPositions();
  updatePointerIntersections();
  updateAtmosphere(elapsed);

  renderer.render(scene, camera);
}

function updateCamera(elapsed) {
  const orbitTheta = currentProgress * Math.PI * 2 * CFG.turns;
  const radius = CFG.cameraRadius;

  camera.position.set(
    Math.cos(orbitTheta) * radius,
    CFG.lookY + Math.sin(elapsed * 0.5) * CFG.cameraHeightBob + CFG.cameraOrbitTilt,
    Math.sin(orbitTheta) * radius
  );

  camera.lookAt(0, CFG.lookY, 0);

  if (skySphere) {
    skySphere.rotation.y = -orbitTheta * 0.22;
    skySphere.rotation.x = Math.sin(elapsed * 0.12) * 0.03;
  }

  if (backPlate) {
    backPlate.lookAt(camera.position);
    backPlate.position.x = Math.cos(orbitTheta + Math.PI) * 14;
    backPlate.position.z = Math.sin(orbitTheta + Math.PI) * 14;
    backPlate.position.y = 1.6;
  }
}

function updateFolderTransforms(elapsed) {
  const total = ORBIT_ITEMS.length;
  const orbitTheta = currentProgress * Math.PI * 2 * CFG.turns;
  const frontIndex = currentProgress * (total - 1);
  const frontTheta = orbitTheta + CFG.helixFrontOffset;
  const folderRadius = CFG.coverRadius;

  folderObjects.forEach((entry, index) => {
    const relativeIndex = index - frontIndex;
    const theta = frontTheta + relativeIndex * CFG.helixAngleStep;
    const y = CFG.lookY + relativeIndex * CFG.helixRise + Math.sin(elapsed * 0.8 + index * 1.2) * 0.05;

    entry.group.position.set(
      Math.cos(theta) * folderRadius,
      y,
      Math.sin(theta) * folderRadius
    );

    const outDir = working.vectorA
      .set(entry.group.position.x, 0, entry.group.position.z)
      .normalize();

    const baseTarget = working.vectorB.copy(entry.group.position).addScaledVector(outDir, 2);

    working.matrixA.lookAt(entry.group.position, baseTarget, UP);
    working.quatA.setFromRotationMatrix(working.matrixA);

    working.eulerA.set(-0.22, 0.12, -0.09);
    const tiltQuat = new THREE.Quaternion().setFromEuler(working.eulerA);
    working.quatA.multiply(tiltQuat);

    const cameraDistance = entry.group.position.distanceTo(camera.position);
    const straighten = smoothstep(4.6, 2.1, cameraDistance);

    working.matrixA.lookAt(entry.group.position, camera.position, UP);
    working.quatB.setFromRotationMatrix(working.matrixA);

    entry.group.quaternion.slerpQuaternions(working.quatA, working.quatB, straighten);

    const swayQuat = new THREE.Quaternion().setFromAxisAngle(
      working.vectorD.set(0, 0, 1),
      Math.sin(elapsed * 0.9 + index * 0.55) * 0.045 * (1 - straighten)
    );
    entry.group.quaternion.multiply(swayQuat);

    const opacityByDistance = THREE.MathUtils.clamp(1 - (cameraDistance - 2.0) / 5.4, 0.08, 1);
    const opacityByHeight = THREE.MathUtils.clamp(1 - Math.abs(relativeIndex) / (total * 0.62), 0.14, 1);
    const opacity = Math.min(opacityByDistance, opacityByHeight);

    entry.base.material.opacity = opacity * 0.96;
    entry.cover.material.opacity = opacity;
    entry.group.visible = opacity > 0.03;

    if (entry.labelNode) {
      entry.labelNode.style.opacity = `${opacity * 0.98}`;
    }
  });
}

function updateLabelPositions() {
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

function updatePointerIntersections() {
  if (!hasEntered) return;

  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(
    folderObjects.map((entry) => entry.cover),
    false
  );

  hoveredItem = null;

  if (hits.length > 0) {
    const hit = hits[0];
    hoveredItem = folderObjects.find((entry) => entry.cover === hit.object) || null;
  }

  renderer.domElement.style.cursor = hoveredItem ? "pointer" : "grab";
}

function updateAtmosphere(elapsed) {
  particles.forEach((sprite, index) => {
    const data = sprite.userData;

    const orbitAngle = data.baseAngle + elapsed * data.orbitSpeed + Math.sin(elapsed * 0.17 + data.phase) * 0.2;
    const radius = data.baseRadius + Math.sin(elapsed * data.driftSpeed + data.phase) * data.driftAmount;
    const y = data.baseY + Math.sin(elapsed * (data.driftSpeed * 1.7) + index) * 0.24;

    sprite.position.set(
      Math.cos(orbitAngle) * radius,
      y,
      Math.sin(orbitAngle) * radius
    );

    const pulse = 0.92 + Math.sin(elapsed * (data.driftSpeed * 2.0) + data.phase) * 0.08;
    sprite.scale.set(data.scale * pulse, data.scale * 0.64 * pulse, 1);
    sprite.material.rotation += 0.00055 + index * 0.000008;
  });

  if (centralModel) {
    centralModel.rotation.y += 0.0011;
  }
}

function smoothstep(edge0, edge1, x) {
  const t = THREE.MathUtils.clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}