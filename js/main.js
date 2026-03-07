import * as THREE from "https://esm.sh/three@0.160.0";
import { GLTFLoader } from "https://esm.sh/three@0.160.0/examples/jsm/loaders/GLTFLoader.js";
import { FBXLoader } from "https://esm.sh/three@0.160.0/examples/jsm/loaders/FBXLoader.js";
import { ASSETS, ORBIT_ITEMS, SCENE_CONFIG } from "./config.js";

const CFG = {
  ...SCENE_CONFIG,

  cameraFov: 47,
  cameraRadius: 4.1,
  cameraTurns: 1.08,

  flagRadius: 2.05,
  helixAngleStep: 1.34,
  helixRise: 0.62,

  flagWidth: 0.82,
  flagHeight: 0.50,

  scrollSpeed: SCENE_CONFIG.scrollSpeed ?? 0.00042,
  touchSpeed: SCENE_CONFIG.touchSpeed ?? 0.0018,

  lookY: 0.08,
  modelLift: -0.28,
  modelTargetHeight: 2.9,

  nearStraightenStart: 2.45,
  nearStraightenEnd: 1.2,

  fogDensity: 0.012,
  fogSpriteOpacity: 0.06
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
scene.background = new THREE.Color(0x0a1118);
scene.fog = new THREE.FogExp2(0x0a1118, CFG.fogDensity);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: false,
  powerPreference: "high-performance"
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x0a1118, 1);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;

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

const orbitRoot = new THREE.Group();
scene.add(orbitRoot);

const working = {
  vA: new THREE.Vector3(),
  vB: new THREE.Vector3(),
  vC: new THREE.Vector3(),
  qA: new THREE.Quaternion(),
  qB: new THREE.Quaternion(),
  qC: new THREE.Quaternion(),
  mA: new THREE.Matrix4(),
  eA: new THREE.Euler()
};

const flagEntries = [];
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
const gltfLoader = new GLTFLoader(manager);
const fbxLoader = new FBXLoader(manager);

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
  const hemi = new THREE.HemisphereLight(0xe8f5ff, 0x061018, 1.18);
  scene.add(hemi);

  const key = new THREE.DirectionalLight(0xffffff, 1.9);
  key.position.set(5.2, 7.0, 6.0);
  scene.add(key);

  const rim = new THREE.DirectionalLight(0x97d5ff, 1.55);
  rim.position.set(-5.8, 4.0, -5.2);
  scene.add(rim);

  const fill = new THREE.PointLight(0x98d8ff, 0.9, 12, 2);
  fill.position.set(0, 1.4, 1.0);
  scene.add(fill);
}

function createBackground(loader) {
  const backgroundPath = ASSETS.background || ASSETS.sky;
  const bgTexture = loader.load(backgroundPath);
  bgTexture.colorSpace = THREE.SRGBColorSpace;
  bgTexture.wrapS = THREE.RepeatWrapping;
  bgTexture.wrapT = THREE.ClampToEdgeWrapping;
  bgTexture.repeat.set(1.06, 1);

  const sphereGeo = new THREE.SphereGeometry(90, 56, 56);
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

  const rearGeo = new THREE.PlaneGeometry(34, 19, 1, 1);
  const rearMat = new THREE.MeshBasicMaterial({
    map: rearTex,
    transparent: true,
    opacity: 0.42,
    depthWrite: false,
    depthTest: false,
    fog: false,
    toneMapped: false
  });

  rearBackdrop = new THREE.Mesh(rearGeo, rearMat);
  rearBackdrop.position.set(0, 1.0, -10);
  scene.add(rearBackdrop);
}

function createFog(loader) {
  const fogTexture = loader.load(ASSETS.fog);
  fogTexture.colorSpace = THREE.SRGBColorSpace;

  for (let i = 0; i < 28; i += 1) {
    const material = new THREE.SpriteMaterial({
      map: fogTexture,
      color: 0xa7d7ef,
      transparent: true,
      opacity: CFG.fogSpriteOpacity,
      depthWrite: false,
      depthTest: false,
      fog: false
    });

    const sprite = new THREE.Sprite(material);

    const baseAngle = (i / 28) * Math.PI * 2;
    const baseRadius = 2.3 + Math.random() * 3.4;
    const baseY = THREE.MathUtils.lerp(-1.1, 2.3, Math.random());
    const scale = 2.0 + Math.random() * 2.5;

    sprite.position.set(
      Math.cos(baseAngle) * baseRadius,
      baseY,
      Math.sin(baseAngle) * baseRadius
    );
    sprite.scale.set(scale, scale * (0.58 + Math.random() * 0.26), 1);

    sprite.userData = {
      baseAngle,
      baseRadius,
      baseY,
      scale,
      phase: Math.random() * Math.PI * 2,
      orbitSpeed: 0.025 + Math.random() * 0.05,
      driftSpeed: 0.08 + Math.random() * 0.12,
      driftAmount: 0.12 + Math.random() * 0.35
    };

    scene.add(sprite);
    fogSprites.push(sprite);
  }
}

function createGroundGlow() {
  const glow = new THREE.Mesh(
    new THREE.CircleGeometry(2.1, 56),
    new THREE.MeshBasicMaterial({
      color: 0x56aee5,
      transparent: true,
      opacity: 0.1,
      depthWrite: false,
      toneMapped: false,
      fog: false
    })
  );
  glow.rotation.x = -Math.PI / 2;
  glow.position.y = -1.35;
  scene.add(glow);
}

function createFlagMaterial(texture) {
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
      varying float vRipple;

      void main() {
        vUv = uv;

        vec3 pos = position;

        float idleWave =
          sin(uv.y * 7.0 + uTime * 1.4 + uv.x * 3.0) * 0.004 +
          sin(uv.y * 13.0 + uTime * 0.9) * 0.003;

        float hoverWave =
          sin(uv.y * 18.0 + uTime * 8.0 + uv.x * 9.0) * 0.028 * uHover +
          sin(uv.y * 11.0 + uTime * 5.0) * 0.012 * uHover;

        pos.z += idleWave + hoverWave;
        pos.x += sin(uv.y * 8.0 + uTime * 4.0) * 0.008 * uHover;

        vRipple = hoverWave;

        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D uMap;
      uniform float uTime;
      uniform float uHover;
      uniform float uOpacity;

      varying vec2 vUv;
      varying float vRipple;

      void main() {
        vec4 tex = texture2D(uMap, vUv);

        if (tex.a < 0.02) discard;

        float gray = dot(tex.rgb, vec3(0.299, 0.587, 0.114));
        vec3 bw = vec3(gray);

        float travel = uHover * 1.35;
        float rippleEdge = travel + sin(vUv.y * 18.0 + uTime * 6.0) * 0.08;
        float reveal = smoothstep(rippleEdge - 0.18, rippleEdge + 0.18, vUv.x);

        vec3 colorOut = mix(bw, tex.rgb, reveal);

        gl_FragColor = vec4(colorOut, tex.a * uOpacity);
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
    labelsRoot?.appendChild(labelNode);

    flagEntries.push({
      item,
      group,
      flag,
      material: mat,
      labelAnchor,
      labelNode,
      hoverValue: 0,
      hoverTarget: 0
    });
  });
}

function loadCenterModel() {
  const glbPath =
    ASSETS.modelGLB ||
    ASSETS.modelGlb ||
    ASSETS.modelGLTF ||
    ASSETS.modelGltf ||
    null;

  if (glbPath) {
    gltfLoader.load(
      glbPath,
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
        color: 0xe7eef5,
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
  model.rotation.y = Math.PI * 0.045;
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
  updateFlags(elapsed);
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
    skySphere.rotation.y = -orbitTheta * 0.16;
    skySphere.rotation.x = Math.sin(elapsed * 0.12) * 0.018;
  }

  if (rearBackdrop) {
    working.vA.copy(camera.position).setY(0).normalize();
    rearBackdrop.position.copy(working.vA).multiplyScalar(-9.0);
    rearBackdrop.position.y = 0.9;
    rearBackdrop.lookAt(camera.position);
  }
}

function updateFlags(elapsed) {
  const total = flagEntries.length;
  const frontIndex = currentProgress * (total - 1);
  const orbitTheta = currentProgress * Math.PI * 2 * CFG.cameraTurns;

  flagEntries.forEach((entry, index) => {
    const relative = index - frontIndex;

    const theta = orbitTheta + relative * CFG.helixAngleStep;
    const y =
      CFG.lookY +
      relative * CFG.helixRise +
      Math.sin(elapsed * 0.8 + index * 1.3) * 0.02;

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

    const opacityDistance = THREE.MathUtils.clamp(
      1 - (cameraDistance - 0.95) / 2.6,
      0.14,
      1
    );
    const opacityRange = THREE.MathUtils.clamp(
      1 - Math.abs(relative) / (total * 0.48),
      0.16,
      1
    );
    const opacity = Math.min(opacityDistance, opacityRange);

    entry.hoverTarget = hoveredEntry === entry ? 1 : 0;
    entry.hoverValue = THREE.MathUtils.lerp(entry.hoverValue, entry.hoverTarget, 0.12);

    entry.material.uniforms.uTime.value = elapsed;
    entry.material.uniforms.uHover.value = entry.hoverValue;
    entry.material.uniforms.uOpacity.value = opacity;

    entry.group.visible = opacity > 0.03;

    if (entry.labelNode) {
      entry.labelNode.style.opacity = `${opacity * (0.82 + entry.hoverValue * 0.18)}`;
    }
  });
}

function updateLabels() {
  const width = window.innerWidth;
  const height = window.innerHeight;

  flagEntries.forEach((entry) => {
    working.vB.setFromMatrixPosition(entry.labelAnchor.matrixWorld);
    working.vB.project(camera);

    const visible =
      working.vB.z < 1 &&
      working.vB.z > -1 &&
      entry.group.visible;

    if (!visible) {
      if (entry.labelNode) entry.labelNode.style.opacity = "0";
      return;
    }

    const x = (working.vB.x * 0.5 + 0.5) * width;
    const y = (-working.vB.y * 0.5 + 0.5) * height;

    if (entry.labelNode) {
      entry.labelNode.style.transform = `translate(calc(${x}px - 100%), calc(${y}px - 50%))`;
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
  fogSprites.forEach((sprite, index) => {
    const data = sprite.userData;

    const orbitAngle =
      data.baseAngle +
      elapsed * data.orbitSpeed +
      Math.sin(elapsed * 0.16 + data.phase) * 0.15;

    const radius =
      data.baseRadius +
      Math.sin(elapsed * data.driftSpeed + data.phase) * data.driftAmount;

    const y =
      data.baseY +
      Math.sin(elapsed * (data.driftSpeed * 1.7) + index) * 0.14;

    sprite.position.set(
      Math.cos(orbitAngle) * radius,
      y,
      Math.sin(orbitAngle) * radius
    );

    const pulse =
      0.95 + Math.sin(elapsed * (data.driftSpeed * 2) + data.phase) * 0.06;

    sprite.scale.set(data.scale * pulse, data.scale * 0.62 * pulse, 1);
    sprite.material.rotation += 0.00045 + index * 0.000006;
  });

  if (centralModel) {
    centralModel.rotation.y += 0.0009;
  }
}

function smoothstep(edge0, edge1, x) {
  const t = THREE.MathUtils.clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}