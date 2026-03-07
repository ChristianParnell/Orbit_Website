import * as THREE from "https://esm.sh/three@0.160.0";
import { FBXLoader } from "https://esm.sh/three@0.160.0/examples/jsm/loaders/FBXLoader.js";
import { GLTFLoader } from "https://esm.sh/three@0.160.0/examples/jsm/loaders/GLTFLoader.js";
import { ASSETS, ORBIT_ITEMS, SCENE_CONFIG } from "./config.js";

const CFG = {
  ...SCENE_CONFIG,

  cameraFov: 50,
  cameraRadius: 3.2,
  cameraTurns: 1.08,

  ribbonRadius: 1.28,
  helixAngleStep: 1.08,
  helixRise: 0.34,

  ribbonWidth: 1.02,
  ribbonHeight: 0.62,

  scrollSpeed: SCENE_CONFIG.scrollSpeed ?? 0.00042,
  touchSpeed: SCENE_CONFIG.touchSpeed ?? 0.0018,

  lookY: 0.26,
  modelLift: 0.34,
  modelTargetHeight: 3.05,

  nearStraightenStart: 2.1,
  nearStraightenEnd: 0.92,

  fogDensity: 0.015,
  fogSpriteOpacity: 0.08
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
renderer.toneMappingExposure = 1.12;

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
let hoveredItem = null;
let dragActive = false;
let lastTouchY = 0;

const orbitRoot = new THREE.Group();
scene.add(orbitRoot);

const working = {
  vectorA: new THREE.Vector3(),
  vectorB: new THREE.Vector3(),
  vectorC: new THREE.Vector3(),
  quatA: new THREE.Quaternion(),
  quatB: new THREE.Quaternion(),
  quatC: new THREE.Quaternion(),
  matrixA: new THREE.Matrix4(),
  eulerA: new THREE.Euler()
};

const ribbonObjects = [];
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
  createRibbons(textureLoader);
  loadCenterModel();
}

function setupLighting() {
  const hemi = new THREE.HemisphereLight(0xe4f4ff, 0x061019, 1.22);
  scene.add(hemi);

  const key = new THREE.DirectionalLight(0xf8fbff, 2.15);
  key.position.set(5.5, 7.5, 6.2);
  scene.add(key);

  const rim = new THREE.DirectionalLight(0x95d4ff, 1.8);
  rim.position.set(-6.2, 4.2, -5.8);
  scene.add(rim);

  const fill = new THREE.PointLight(0xa7dcff, 1.25, 14, 2);
  fill.position.set(0, 1.6, 1.0);
  scene.add(fill);
}

function createBackground(loader) {
  const backgroundPath = ASSETS.background || ASSETS.sky;
  const bgTexture = loader.load(backgroundPath);

  bgTexture.colorSpace = THREE.SRGBColorSpace;
  bgTexture.wrapS = THREE.RepeatWrapping;
  bgTexture.wrapT = THREE.ClampToEdgeWrapping;
  bgTexture.repeat.set(1.08, 1);

  const sphereGeo = new THREE.SphereGeometry(85, 64, 64);
  const sphereMat = new THREE.MeshBasicMaterial({
    map: bgTexture,
    side: THREE.BackSide,
    transparent: true,
    opacity: 1,
    fog: false,
    toneMapped: false
  });

  skySphere = new THREE.Mesh(sphereGeo, sphereMat);
  scene.add(skySphere);

  const rearTex = loader.load(backgroundPath);
  rearTex.colorSpace = THREE.SRGBColorSpace;

  const planeGeo = new THREE.PlaneGeometry(42, 24, 1, 1);
  const planeMat = new THREE.MeshBasicMaterial({
    map: rearTex,
    transparent: true,
    opacity: 0.62,
    depthWrite: false,
    depthTest: false,
    fog: false,
    toneMapped: false
  });

  rearBackdrop = new THREE.Mesh(planeGeo, planeMat);
  rearBackdrop.position.set(0, 1.4, -10);
  scene.add(rearBackdrop);
}

function createFog(loader) {
  const fogTexture = loader.load(ASSETS.fog);
  fogTexture.colorSpace = THREE.SRGBColorSpace;

  for (let i = 0; i < 34; i += 1) {
    const material = new THREE.SpriteMaterial({
      map: fogTexture,
      color: 0x9fd5ee,
      transparent: true,
      opacity: CFG.fogSpriteOpacity,
      depthWrite: false,
      depthTest: false,
      fog: false
    });

    const sprite = new THREE.Sprite(material);

    const baseAngle = (i / 34) * Math.PI * 2;
    const baseRadius = 2.0 + Math.random() * 3.4;
    const baseY = THREE.MathUtils.lerp(-1.3, 2.8, Math.random());
    const scale = 2.4 + Math.random() * 3.0;

    sprite.position.set(
      Math.cos(baseAngle) * baseRadius,
      baseY,
      Math.sin(baseAngle) * baseRadius
    );
    sprite.scale.set(scale, scale * (0.58 + Math.random() * 0.3), 1);

    sprite.userData = {
      baseAngle,
      baseRadius,
      baseY,
      scale,
      phase: Math.random() * Math.PI * 2,
      orbitSpeed: 0.03 + Math.random() * 0.06,
      driftSpeed: 0.08 + Math.random() * 0.16,
      driftAmount: 0.15 + Math.random() * 0.5
    };

    scene.add(sprite);
    fogSprites.push(sprite);
  }
}

function createGroundGlow() {
  const glow = new THREE.Mesh(
    new THREE.CircleGeometry(2.35, 64),
    new THREE.MeshBasicMaterial({
      color: 0x62b4e8,
      transparent: true,
      opacity: 0.12,
      depthWrite: false,
      fog: false,
      toneMapped: false
    })
  );
  glow.rotation.x = -Math.PI / 2;
  glow.position.y = -1.55;
  scene.add(glow);
}

function createRibbonMaterial(texture) {
  return new THREE.ShaderMaterial({
    transparent: true,
    side: THREE.DoubleSide,
    uniforms: {
      uMap: { value: texture },
      uTime: { value: 0 },
      uHover: { value: 0 },
      uOpacity: { value: 1 }
    },
    vertexShader: `
      uniform float uTime;
      uniform float uHover;

      varying vec2 vUv;
      varying float vWave;

      void main() {
        vUv = uv;

        vec3 pos = position;

        float idleRipple =
          sin(uv.y * 8.0 + uTime * 1.6 + uv.x * 4.0) * 0.008 +
          sin(uv.x * 6.0 + uTime * 1.1) * 0.004;

        float hoverRipple =
          sin(uv.y * 16.0 + uTime * 7.0 + uv.x * 8.0) * 0.035 * uHover +
          sin(uv.x * 10.0 + uTime * 5.0) * 0.018 * uHover;

        pos.z += idleRipple + hoverRipple;
        pos.x += sin(uv.y * 8.0 + uTime * 3.0) * 0.01 * uHover;

        vWave = hoverRipple;

        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D uMap;
      uniform float uTime;
      uniform float uHover;
      uniform float uOpacity;

      varying vec2 vUv;
      varying float vWave;

      void main() {
        vec4 tex = texture2D(uMap, vUv);

        float gray = dot(tex.rgb, vec3(0.299, 0.587, 0.114));
        vec3 bw = vec3(gray);

        float revealFront = uHover * 1.35 - 0.2;
        float waveEdge = revealFront + sin(vUv.y * 18.0 + uTime * 6.0) * 0.08;
        float reveal = smoothstep(waveEdge - 0.18, waveEdge + 0.18, vUv.x);

        vec3 finalColor = mix(bw, tex.rgb, reveal);

        float border =
          step(0.015, vUv.x) *
          step(0.015, vUv.y) *
          step(vUv.x, 0.985) *
          step(vUv.y, 0.985);

        finalColor = mix(finalColor * 0.1, finalColor, border);

        float alpha = tex.a * uOpacity;
        if (alpha < 0.01) discard;

        gl_FragColor = vec4(finalColor, alpha);
      }
    `
  });
}

function createRibbons(loader) {
  const ribbonWidth = CFG.ribbonWidth;
  const ribbonHeight = CFG.ribbonHeight;

  ORBIT_ITEMS.forEach((item) => {
    const group = new THREE.Group();
    group.userData.item = item;
    orbitRoot.add(group);

    const texture = loader.load(item.cover);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();

    const backPlate = new THREE.Mesh(
      new THREE.PlaneGeometry(ribbonWidth * 1.03, ribbonHeight * 1.03, 1, 1),
      new THREE.MeshBasicMaterial({
        color: 0x030507,
        transparent: true,
        opacity: 0.82,
        side: THREE.DoubleSide
      })
    );
    backPlate.position.z = -0.012;
    group.add(backPlate);

    const ribbonMaterial = createRibbonMaterial(texture);

    const ribbon = new THREE.Mesh(
      new THREE.PlaneGeometry(ribbonWidth, ribbonHeight, 40, 18),
      ribbonMaterial
    );
    group.add(ribbon);

    const labelAnchor = new THREE.Object3D();
    labelAnchor.position.set(-ribbonWidth * 0.72, -ribbonHeight * 0.58, 0.03);
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

    ribbonObjects.push({
      item,
      group,
      ribbon,
      ribbonMaterial,
      backPlate,
      labelAnchor,
      labelNode,
      hoverValue: 0,
      hoverTarget: 0
    });
  });
}

function loadCenterModel() {
  const gltfPath =
    ASSETS.modelGLTF ||
    ASSETS.modelGltf ||
    ASSETS.modelGLB ||
    ASSETS.modelGlb ||
    null;

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

    if (!child.material) {
      child.material = new THREE.MeshStandardMaterial({
        color: 0xe6eef5,
        roughness: 0.72,
        metalness: 0.04
      });
      return;
    }

    if (Array.isArray(child.material)) {
      child.material.forEach(prepareMaterial);
    } else {
      prepareMaterial(child.material);
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
  }

  if ("emissiveMap" in material && material.emissiveMap) {
    material.emissiveMap.colorSpace = THREE.SRGBColorSpace;
  }

  material.needsUpdate = true;
}

function centerAndScaleModel(model) {
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());

  const scale = size.y > 0 ? CFG.modelTargetHeight / size.y : 1;
  model.scale.setScalar(scale);

  model.position.x -= center.x * scale;
  model.position.y -= center.y * scale;
  model.position.z -= center.z * scale;

  model.position.y += CFG.modelLift;
  model.rotation.y = Math.PI * 0.05;
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
  body.position.y = -0.1;
  fallback.add(body);

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.42, 20, 20),
    new THREE.MeshStandardMaterial({
      color: 0xebf2f8,
      roughness: 0.72,
      metalness: 0.04
    })
  );
  head.position.y = 1.08;
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
  currentProgress = THREE.MathUtils.lerp(currentProgress, targetProgress, 0.09);

  updateCamera(elapsed);
  updateRibbons(elapsed);
  updateLabels();
  updateIntersections();
  updateFog(elapsed);

  renderer.render(scene, camera);
}

function updateCamera(elapsed) {
  const orbitTheta = currentProgress * Math.PI * 2 * CFG.cameraTurns;
  const radius = CFG.cameraRadius;

  camera.position.set(
    Math.cos(orbitTheta) * radius,
    CFG.lookY + Math.sin(elapsed * 0.55) * 0.05,
    Math.sin(orbitTheta) * radius
  );

  camera.lookAt(0, CFG.lookY, 0);

  if (skySphere) {
    skySphere.rotation.y = -orbitTheta * 0.18;
    skySphere.rotation.x = Math.sin(elapsed * 0.14) * 0.02;
  }

  if (rearBackdrop) {
    working.vectorA.copy(camera.position).setY(0).normalize();
    rearBackdrop.position.copy(working.vectorA).multiplyScalar(-9.5);
    rearBackdrop.position.y = 1.35;
    rearBackdrop.lookAt(camera.position);
  }
}

function updateRibbons(elapsed) {
  const total = ribbonObjects.length;
  const frontIndex = currentProgress * (total - 1);
  const orbitTheta = currentProgress * Math.PI * 2 * CFG.cameraTurns;

  ribbonObjects.forEach((entry, index) => {
    const relative = index - frontIndex;

    const theta = orbitTheta + relative * CFG.helixAngleStep;
    const y =
      CFG.lookY +
      relative * CFG.helixRise +
      Math.sin(elapsed * 0.9 + index * 1.2) * 0.025;

    entry.group.position.set(
      Math.cos(theta) * CFG.ribbonRadius,
      y,
      Math.sin(theta) * CFG.ribbonRadius
    );

    working.matrixA.lookAt(entry.group.position, ORBIT_CENTER, UP);
    working.quatA.setFromRotationMatrix(working.matrixA);

    working.eulerA.set(-0.12, 0.04, -0.08);
    working.quatC.setFromEuler(working.eulerA);
    working.quatA.multiply(working.quatC);

    const cameraDistance = entry.group.position.distanceTo(camera.position);
    const straighten = smoothstep(
      CFG.nearStraightenStart,
      CFG.nearStraightenEnd,
      cameraDistance
    );

    working.matrixA.lookAt(entry.group.position, camera.position, UP);
    working.quatB.setFromRotationMatrix(working.matrixA);
    working.quatB.multiply(CAMERA_FACE_FIX);

    entry.group.quaternion.slerpQuaternions(
      working.quatA,
      working.quatB,
      straighten
    );

    const opacityDistance = THREE.MathUtils.clamp(
      1 - (cameraDistance - 0.7) / 2.2,
      0.12,
      1
    );
    const opacityRange = THREE.MathUtils.clamp(
      1 - Math.abs(relative) / (total * 0.52),
      0.18,
      1
    );
    const opacity = Math.min(opacityDistance, opacityRange);

    entry.hoverTarget = hoveredItem === entry ? 1 : 0;
    entry.hoverValue = THREE.MathUtils.lerp(entry.hoverValue, entry.hoverTarget, 0.12);

    entry.ribbonMaterial.uniforms.uTime.value = elapsed;
    entry.ribbonMaterial.uniforms.uHover.value = entry.hoverValue;
    entry.ribbonMaterial.uniforms.uOpacity.value = opacity;

    entry.backPlate.material.opacity = opacity * 0.72;
    entry.group.visible = opacity > 0.03;

    if (entry.labelNode) {
      entry.labelNode.style.opacity = `${opacity * (0.75 + entry.hoverValue * 0.25)}`;
    }
  });
}

function updateLabels() {
  const width = window.innerWidth;
  const height = window.innerHeight;

  ribbonObjects.forEach((entry) => {
    working.vectorB.setFromMatrixPosition(entry.labelAnchor.matrixWorld);
    working.vectorB.project(camera);

    const visible =
      working.vectorB.z < 1 &&
      working.vectorB.z > -1 &&
      entry.group.visible;

    if (!visible) {
      if (entry.labelNode) entry.labelNode.style.opacity = "0";
      return;
    }

    const x = (working.vectorB.x * 0.5 + 0.5) * width;
    const y = (-working.vectorB.y * 0.5 + 0.5) * height;

    if (entry.labelNode) {
      entry.labelNode.style.transform = `translate(calc(${x}px - 100%), calc(${y}px - 50%))`;
    }
  });
}

function updateIntersections() {
  if (!hasEntered) return;

  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(
    ribbonObjects.map((entry) => entry.ribbon),
    false
  );

  hoveredItem = null;

  if (hits.length > 0) {
    const hit = hits[0];
    hoveredItem =
      ribbonObjects.find((entry) => entry.ribbon === hit.object) || null;
  }

  renderer.domElement.style.cursor = hoveredItem ? "pointer" : "grab";
}

function updateFog(elapsed) {
  fogSprites.forEach((sprite, index) => {
    const data = sprite.userData;

    const orbitAngle =
      data.baseAngle +
      elapsed * data.orbitSpeed +
      Math.sin(elapsed * 0.16 + data.phase) * 0.18;

    const radius =
      data.baseRadius +
      Math.sin(elapsed * data.driftSpeed + data.phase) * data.driftAmount;

    const y =
      data.baseY +
      Math.sin(elapsed * (data.driftSpeed * 1.75) + index) * 0.18;

    sprite.position.set(
      Math.cos(orbitAngle) * radius,
      y,
      Math.sin(orbitAngle) * radius
    );

    const pulse =
      0.94 + Math.sin(elapsed * (data.driftSpeed * 2) + data.phase) * 0.08;

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