import * as THREE from "https://esm.sh/three@0.160.0";
import { GLTFLoader } from "https://esm.sh/three@0.160.0/examples/jsm/loaders/GLTFLoader.js";
import { FBXLoader } from "https://esm.sh/three@0.160.0/examples/jsm/loaders/FBXLoader.js";

const BASE_URL = new URL("./", import.meta.url);
const u = (path) => new URL(path, BASE_URL).href;

const canvas = document.getElementById("webgl");
const loaderEl = document.getElementById("loader");
const loaderFill = document.getElementById("loaderFill");
const loaderPct = document.getElementById("loaderPct");
const hoverLabel = document.getElementById("hoverLabel");
const panel = document.getElementById("panel");
const panelTitle = document.getElementById("panelTitle");
const panelBody = document.getElementById("panelBody");
const panelClose = document.getElementById("panelClose");

const COLORS = {
  bg: "#AED8EB",
  ink: "#09141C",
  white: "#F8FCFF",
  red: "#B80001",
  orange: "#EF510B",
  yellow: "#FAC227",
  blue: "#1975B5",
  purple: "#6D05FF",
};

const CHAPTERS = [
  { id: "about", label: "About", page: u("pages/about.html"), cover: u("assets/covers/about.JPG") },
  { id: "gallery", label: "Gallery", page: u("pages/gallery.html"), cover: u("assets/covers/gallery.png") },
  { id: "achievements", label: "Achievements", page: u("pages/achievements.html"), cover: u("assets/covers/achievements.jpg") },
  { id: "contact", label: "Contact", page: u("pages/contact.html"), cover: u("assets/covers/contact.jpg") },
  { id: "fab", label: "Fab Profile", href: "https://www.fab.com/sellers/Oblix%20Studio", cover: u("assets/covers/fab.png") },
  { id: "steam", label: "22 Minutes", href: "https://store.steampowered.com/app/2765180/22_Minutes/", cover: u("assets/covers/steam_22minutes.png") },
  { id: "sketchfab", label: "Sketchfab", href: "https://sketchfab.com/OblixStudio/models", cover: u("assets/covers/sketchfab.png") },
];

const MODEL_CANDIDATES = [
  { type: "fbx", url: u("assets/models/me_on_hill.fbx") },
  { type: "gltf", url: u("assets/models/me_on_hill.glb") },
  { type: "gltf", url: u("assets/models/me_on_hill.gltf") },
];

const ASSETS = {
  fog: u("assets/textures/fog.png"),
};

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const damp = (current, target, lambda, dt) =>
  THREE.MathUtils.lerp(current, target, 1 - Math.exp(-lambda * dt));

const loadingManager = new THREE.LoadingManager();
loadingManager.onProgress = (_, loaded, total) => {
  const pct = total ? Math.round((loaded / total) * 100) : 0;
  if (loaderFill) loaderFill.style.width = `${pct}%`;
  if (loaderPct) loaderPct.textContent = `${pct}%`;
};

loadingManager.onLoad = () => {
  setTimeout(() => loaderEl?.classList.add("is-hidden"), 300);
};

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: false,
  powerPreference: "high-performance",
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(COLORS.bg);
scene.fog = new THREE.FogExp2(COLORS.bg, 0.032);

const camera = new THREE.PerspectiveCamera(43, window.innerWidth / window.innerHeight, 0.1, 200);
const clock = new THREE.Clock();
const textureLoader = new THREE.TextureLoader(loadingManager);

const root = new THREE.Group();
scene.add(root);

const tileGroup = new THREE.Group();
root.add(tileGroup);

const modelGroup = new THREE.Group();
root.add(modelGroup);

const fogGroup = new THREE.Group();
scene.add(fogGroup);

let fogCards = [];
let hoveredTile = null;
let isDragging = false;
let dragMoved = false;
let lastPointerX = 0;

const pointer = new THREE.Vector2(999, 999);
const raycaster = new THREE.Raycaster();

const orbitState = {
  value: 2.0,
  target: 2.0,
  min: -0.2,
  max: CHAPTERS.length - 0.8,
};

const paletteCycle = [
  new THREE.Color(COLORS.red),
  new THREE.Color(COLORS.orange),
  new THREE.Color(COLORS.yellow),
  new THREE.Color(COLORS.blue),
  new THREE.Color(COLORS.purple),
];

function makeGridTexture() {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 1024;
  const ctx = c.getContext("2d");

  ctx.fillStyle = "#aed8eb";
  ctx.fillRect(0, 0, c.width, c.height);

  ctx.strokeStyle = "rgba(25,117,181,0.18)";
  ctx.lineWidth = 2;

  for (let x = 0; x <= c.width; x += 64) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, c.height);
    ctx.stroke();
  }

  for (let y = 0; y <= c.height; y += 64) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(c.width, y);
    ctx.stroke();
  }

  ctx.strokeStyle = "rgba(109,5,255,0.10)";
  ctx.lineWidth = 3;
  for (let x = 0; x <= c.width; x += 256) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, c.height);
    ctx.stroke();
  }

  for (let y = 0; y <= c.height; y += 256) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(c.width, y);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(5, 5);
  return tex;
}

function makePlaceholderCover(label) {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 640;
  const ctx = c.getContext("2d");

  const g = ctx.createLinearGradient(0, 0, c.width, c.height);
  g.addColorStop(0, COLORS.blue);
  g.addColorStop(0.5, COLORS.purple);
  g.addColorStop(1, COLORS.orange);

  ctx.fillStyle = g;
  ctx.fillRect(0, 0, c.width, c.height);

  ctx.strokeStyle = "rgba(248,252,255,0.45)";
  ctx.lineWidth = 4;
  ctx.strokeRect(28, 28, c.width - 56, c.height - 56);

  ctx.fillStyle = "rgba(248,252,255,0.88)";
  ctx.font = "700 72px monospace";
  ctx.fillText(label.toUpperCase(), 64, 120);

  ctx.fillStyle = "rgba(248,252,255,0.40)";
  ctx.font = "400 28px monospace";
  ctx.fillText("DIGITAL PORTAL // PREVIEW", 64, 174);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function makeTitleSprite(text) {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 256;
  const ctx = c.getContext("2d");

  ctx.clearRect(0, 0, c.width, c.height);
  ctx.fillStyle = "rgba(248,252,255,0.92)";
  ctx.font = "700 78px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text.toUpperCase(), c.width / 2, c.height / 2);

  ctx.strokeStyle = "rgba(25,117,181,0.32)";
  ctx.lineWidth = 6;
  ctx.strokeRect(18, 18, c.width - 36, c.height - 36);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.SpriteMaterial({
    map: tex,
    transparent: true,
    depthWrite: false,
    opacity: 0.78,
  });

  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(2.4, 0.6, 1);
  return sprite;
}

function addSceneLighting() {
  const hemi = new THREE.HemisphereLight(0xffffff, 0x7ca1b3, 1.55);
  scene.add(hemi);

  const ambient = new THREE.AmbientLight(0xffffff, 0.65);
  scene.add(ambient);

  const key = new THREE.DirectionalLight(0xffffff, 2.3);
  key.position.set(8, 10, 7);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.near = 0.5;
  key.shadow.camera.far = 40;
  key.shadow.camera.left = -12;
  key.shadow.camera.right = 12;
  key.shadow.camera.top = 12;
  key.shadow.camera.bottom = -12;
  scene.add(key);

  const fill = new THREE.DirectionalLight(new THREE.Color(COLORS.blue), 0.85);
  fill.position.set(-8, 4, 9);
  scene.add(fill);

  const rim = new THREE.PointLight(new THREE.Color(COLORS.purple), 20, 35, 2);
  rim.position.set(-5, 4, -5);
  scene.add(rim);

  const accent = new THREE.PointLight(new THREE.Color(COLORS.orange), 10, 20, 2);
  accent.position.set(5, 2.4, 5);
  scene.add(accent);
}

function addGround() {
  const shadowPlane = new THREE.Mesh(
    new THREE.CircleGeometry(4.8, 64),
    new THREE.MeshStandardMaterial({
      color: 0x9db8c3,
      transparent: true,
      opacity: 0.55,
      roughness: 1,
      metalness: 0,
    })
  );
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.position.y = -1.25;
  shadowPlane.receiveShadow = true;
  root.add(shadowPlane);

  const grid = new THREE.Mesh(
    new THREE.CircleGeometry(12, 64),
    new THREE.MeshBasicMaterial({
      map: makeGridTexture(),
      transparent: true,
      opacity: 0.42,
      depthWrite: false,
    })
  );
  grid.rotation.x = -Math.PI / 2;
  grid.position.y = -1.23;
  root.add(grid);

  const pedestal = new THREE.Mesh(
    new THREE.CylinderGeometry(1.7, 2.2, 0.7, 40),
    new THREE.MeshStandardMaterial({
      color: 0xdceaf1,
      roughness: 0.9,
      metalness: 0.02,
      emissive: new THREE.Color(COLORS.blue),
      emissiveIntensity: 0.05,
    })
  );
  pedestal.position.y = -0.9;
  pedestal.castShadow = true;
  pedestal.receiveShadow = true;
  modelGroup.add(pedestal);
}

function addParticles() {
  const count = 220;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const radius = 4 + Math.random() * 10;
    const angle = Math.random() * Math.PI * 2;
    const y = -0.8 + Math.random() * 8.5;

    positions[i * 3 + 0] = Math.cos(angle) * radius;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = Math.sin(angle) * radius;

    const color = paletteCycle[i % paletteCycle.length];
    colors[i * 3 + 0] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  const pts = new THREE.Points(
    geo,
    new THREE.PointsMaterial({
      size: 0.06,
      vertexColors: true,
      transparent: true,
      opacity: 0.72,
      depthWrite: false,
    })
  );

  pts.position.y = 0.1;
  scene.add(pts);

  return pts;
}

function improveMaterial(material) {
  const materials = Array.isArray(material) ? material : [material];

  for (const mat of materials) {
    if (!mat) continue;

    if ("map" in mat && mat.map) {
      mat.map.colorSpace = THREE.SRGBColorSpace;
      mat.map.anisotropy = 8;
    }

    if ("transparent" in mat) {
      if (!mat.alphaMap) {
        mat.transparent = false;
        mat.opacity = 1;
      }
      mat.depthWrite = true;
    }

    if ("side" in mat) {
      mat.side = THREE.FrontSide;
    }

    if ("metalness" in mat) {
      mat.metalness = 0.02;
    }

    if ("roughness" in mat) {
      mat.roughness = typeof mat.roughness === "number" ? Math.max(mat.roughness, 0.62) : 0.72;
    }

    mat.needsUpdate = true;
  }
}

function prepModel(object3d) {
  object3d.traverse((child) => {
    if (!child.isMesh) return;

    child.castShadow = true;
    child.receiveShadow = true;

    if (!child.material) {
      child.material = new THREE.MeshStandardMaterial({
        color: 0xe7f1f6,
        roughness: 0.75,
        metalness: 0.02,
      });
    }

    improveMaterial(child.material);
  });
}

function centerAndScaleModel(object3d, targetHeight = 5.8) {
  const box = new THREE.Box3().setFromObject(object3d);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();

  box.getSize(size);
  box.getCenter(center);

  const currentHeight = Math.max(size.y, 0.001);
  const scale = targetHeight / currentHeight;

  object3d.scale.setScalar(scale);

  const box2 = new THREE.Box3().setFromObject(object3d);
  const center2 = new THREE.Vector3();
  const min2 = new THREE.Vector3();
  box2.getCenter(center2);
  box2.min.clone(min2);

  object3d.position.sub(center2);
  object3d.position.y += -box2.min.y - 1.1;
}

function addFallbackModel() {
  const mat = new THREE.MeshStandardMaterial({
    color: 0xf2f9fc,
    roughness: 0.72,
    metalness: 0.02,
    emissive: new THREE.Color(COLORS.blue),
    emissiveIntensity: 0.04,
  });

  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.7, 2.1, 8, 18), mat);
  body.position.y = 1.2;
  body.castShadow = true;
  body.receiveShadow = true;

  const head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.65, 2), mat);
  head.position.set(0, 2.95, 0);
  head.castShadow = true;
  head.receiveShadow = true;

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(1.25, 0.05, 18, 80),
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: new THREE.Color(COLORS.purple),
      emissiveIntensity: 0.25,
      roughness: 0.4,
      metalness: 0.15,
    })
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 1.8;

  modelGroup.add(body, head, ring);
}

async function loadModel() {
  for (const entry of MODEL_CANDIDATES) {
    try {
      const object3d = await new Promise((resolve, reject) => {
        if (entry.type === "fbx") {
          new FBXLoader(loadingManager).load(entry.url, resolve, undefined, reject);
        } else {
          new GLTFLoader(loadingManager).load(
            entry.url,
            (gltf) => resolve(gltf.scene),
            undefined,
            reject
          );
        }
      });

      prepModel(object3d);
      centerAndScaleModel(object3d, 5.8);
      object3d.rotation.y = THREE.MathUtils.degToRad(8);
      modelGroup.add(object3d);
      return;
    } catch (err) {
      console.warn("Model load failed:", entry.url, err);
    }
  }

  addFallbackModel();
}

function addFog() {
  const fogTex = textureLoader.load(
    ASSETS.fog,
    (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
    },
    undefined,
    () => {}
  );

  const cardGeo = new THREE.PlaneGeometry(8, 5);

  fogCards = Array.from({ length: 8 }, (_, i) => {
    const mat = new THREE.MeshBasicMaterial({
      map: fogTex,
      transparent: true,
      opacity: 0.18,
      depthWrite: false,
      color: i % 2 === 0 ? new THREE.Color(COLORS.white) : new THREE.Color(0xe7f2f8),
    });

    const mesh = new THREE.Mesh(cardGeo, mat);

    const angle = (i / 8) * Math.PI * 2;
    const radius = 2.8 + Math.random() * 4.6;

    mesh.position.set(
      Math.cos(angle) * radius,
      0.6 + Math.random() * 2.8,
      Math.sin(angle) * radius
    );

    mesh.rotation.z = (Math.random() - 0.5) * 0.25;
    mesh.userData = {
      baseY: mesh.position.y,
      radius,
      angle,
      speed: 0.14 + Math.random() * 0.18,
      wobble: 0.2 + Math.random() * 0.35,
    };

    fogGroup.add(mesh);
    return mesh;
  });
}

function createTiles() {
  const helixRadius = 6.9;
  const angleStep = 0.96;
  const rise = 1.42;
  const yOffset = 1.3;

  CHAPTERS.forEach((chapter, index) => {
    const rootTile = new THREE.Group();

    const frame = new THREE.Mesh(
      new THREE.PlaneGeometry(2.48, 1.68),
      new THREE.MeshStandardMaterial({
        color: 0xf7fbff,
        roughness: 0.18,
        metalness: 0.08,
        emissive: new THREE.Color(COLORS.blue),
        emissiveIntensity: 0.08,
      })
    );

    const coverTexture = makePlaceholderCover(chapter.label);
    const cover = new THREE.Mesh(
      new THREE.PlaneGeometry(2.2, 1.4),
      new THREE.MeshBasicMaterial({
        map: coverTexture,
        transparent: false,
        toneMapped: false,
      })
    );
    cover.position.z = 0.02;

    const edgeGlow = new THREE.Mesh(
      new THREE.PlaneGeometry(2.62, 1.82),
      new THREE.MeshBasicMaterial({
        color: paletteCycle[index % paletteCycle.length],
        transparent: true,
        opacity: 0.08,
        depthWrite: false,
      })
    );
    edgeGlow.position.z = -0.02;

    const title = makeTitleSprite(chapter.label);
    title.position.set(0, -1.02, 0.04);

    rootTile.add(edgeGlow, frame, cover, title);

    const angle = index * angleStep + 0.4;
    const y = (index - (CHAPTERS.length - 1) * 0.5) * rise + yOffset;
    const x = Math.cos(angle) * helixRadius;
    const z = Math.sin(angle) * helixRadius;

    rootTile.position.set(x, y, z);
    rootTile.lookAt(0, y * 0.84, 0);
    rootTile.rotateZ(Math.PI * 0.5);
    rootTile.rotateX(-0.28);

    tileGroup.add(rootTile);

    const tile = {
      chapter,
      index,
      root: rootTile,
      frame,
      cover,
      edgeGlow,
      title,
      hover: 0,
      hoverTarget: 0,
      focus: 0,
      baseY: y,
    };

    cover.userData.tile = tile;

    textureLoader.load(
      chapter.cover,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 8;
        cover.material.map = tex;
        cover.material.needsUpdate = true;
      },
      undefined,
      () => {}
    );

    tiles.push(tile);
  });
}

function updateHoverLabel(tile) {
  if (!hoverLabel) return;

  if (!tile) {
    hoverLabel.classList.remove("is-visible");
    hoverLabel.textContent = "";
    return;
  }

  hoverLabel.textContent = `${tile.chapter.label.toUpperCase()} // CLICK TO OPEN`;
  hoverLabel.classList.add("is-visible");
}

async function openPanelForChapter(chapter) {
  if (chapter.href) {
    window.open(chapter.href, "_blank", "noopener,noreferrer");
    return;
  }

  panel.classList.add("is-open");
  panel.setAttribute("aria-hidden", "false");
  panelTitle.textContent = chapter.label;
  panelBody.innerHTML = "Loading…";

  try {
    const res = await fetch(chapter.page, { cache: "no-store" });
    if (!res.ok) throw new Error(`Failed to load ${chapter.page}`);
    panelBody.innerHTML = await res.text();
  } catch (err) {
    panelBody.innerHTML = `
      <p>Couldn’t load this page.</p>
      <p><strong>Expected file:</strong> <code>${chapter.page}</code></p>
    `;
    console.warn(err);
  }
}

function closePanel() {
  panel.classList.remove("is-open");
  panel.setAttribute("aria-hidden", "true");
}

const tiles = [];
const particles = addParticles();

function updateRaycast() {
  raycaster.setFromCamera(pointer, camera);
  const intersects = raycaster.intersectObjects(tiles.map((t) => t.cover), false);
  hoveredTile = intersects.length ? intersects[0].object.userData.tile : null;
  updateHoverLabel(hoveredTile);
}

function updateCamera(dt) {
  orbitState.target = clamp(orbitState.target, orbitState.min, orbitState.max);
  orbitState.value = damp(orbitState.value, orbitState.target, 7.5, dt);

  const angle = orbitState.value * 0.92 + 0.65;
  const radius = 4.7;
  const y = 1.2 + (orbitState.value - (CHAPTERS.length - 1) * 0.5) * 0.78;

  camera.position.set(
    Math.cos(angle) * radius,
    y + 1.4,
    Math.sin(angle) * radius
  );

  const lookY = 1.3 + (orbitState.value - (CHAPTERS.length - 1) * 0.5) * 0.14;
  camera.lookAt(0, lookY, 0);
}

function updateTiles(time, dt) {
  tiles.forEach((tile) => {
    const distanceToFocus = Math.abs(tile.index - orbitState.value);
    tile.focus = 1 - clamp(distanceToFocus / 1.4, 0, 1);
    tile.hoverTarget = hoveredTile === tile ? 1 : 0;
    tile.hover = damp(tile.hover, tile.hoverTarget, 10, dt);

    const pulse = Math.sin(time * 2.8 + tile.index * 0.8) * 0.5 + 0.5;
    const scale = 1 + tile.focus * 0.18 + tile.hover * 0.11;

    tile.root.scale.setScalar(scale);
    tile.root.position.y = tile.baseY + Math.sin(time * 1.4 + tile.index) * 0.05 + tile.hover * 0.08;

    tile.frame.material.emissiveIntensity = 0.08 + tile.focus * 0.16 + tile.hover * 0.28;
    tile.edgeGlow.material.opacity = 0.05 + tile.focus * 0.12 + tile.hover * 0.18 + pulse * 0.02;
    tile.title.material.opacity = 0.42 + tile.focus * 0.42 + tile.hover * 0.16;
  });
}

function updateFog(time) {
  fogCards.forEach((card, i) => {
    const d = card.userData;
    card.lookAt(camera.position);
    card.position.x = Math.cos(d.angle + time * d.speed) * d.radius;
    card.position.z = Math.sin(d.angle + time * d.speed) * d.radius;
    card.position.y = d.baseY + Math.sin(time * d.speed * 1.6 + i) * d.wobble;
    card.material.opacity = 0.10 + (Math.sin(time * 0.9 + i) * 0.5 + 0.5) * 0.12;
  });
}

function updateParticles(time) {
  particles.rotation.y = time * 0.045;
}

function animate() {
  const dt = Math.min(clock.getDelta(), 0.05);
  const time = clock.elapsedTime;

  root.rotation.y = Math.sin(time * 0.15) * 0.03;

  updateCamera(dt);
  updateRaycast();
  updateTiles(time, dt);
  updateFog(time);
  updateParticles(time);

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

function onPointerMove(event) {
  const rect = canvas.getBoundingClientRect();

  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  if (isDragging) {
    const dx = event.clientX - lastPointerX;
    if (Math.abs(dx) > 2) dragMoved = true;
    orbitState.target -= dx * 0.0062;
    lastPointerX = event.clientX;
  }
}

function onPointerDown(event) {
  isDragging = true;
  dragMoved = false;
  lastPointerX = event.clientX;
}

function onPointerUp() {
  if (!dragMoved && hoveredTile) {
    openPanelForChapter(hoveredTile.chapter);
  }

  isDragging = false;
}

function onPointerLeave() {
  isDragging = false;
  hoveredTile = null;
  updateHoverLabel(null);
  pointer.set(999, 999);
}

function onWheel(event) {
  orbitState.target += event.deltaY * 0.00125;
}

function onResize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
}

panelClose?.addEventListener("click", closePanel);
window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closePanel();
});

canvas.addEventListener("pointermove", onPointerMove);
canvas.addEventListener("pointerdown", onPointerDown);
window.addEventListener("pointerup", onPointerUp);
canvas.addEventListener("pointerleave", onPointerLeave);
window.addEventListener("wheel", onWheel, { passive: true });
window.addEventListener("resize", onResize);

addSceneLighting();
addGround();
addFog();
createTiles();
loadModel();
animate();