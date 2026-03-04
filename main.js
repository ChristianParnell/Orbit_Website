// main.js (GitHub Pages safe, no importmap needed)
// Uses esm.sh so GLTFLoader works in the browser without bundlers.

import * as THREE from "https://esm.sh/three@0.160.0";
import { GLTFLoader } from "https://esm.sh/three@0.160.0/examples/jsm/loaders/GLTFLoader.js";

// Base URL for local repo paths (works on GitHub Pages project sites)
const BASE_URL = new URL("./", import.meta.url);

// DOM
const canvas = document.getElementById("webgl");
const loaderEl = document.getElementById("loader");
const loaderFill = document.getElementById("loaderFill");
const loaderPct = document.getElementById("loaderPct");
const hintEl = document.getElementById("hint");
const chaptersEl = document.getElementById("chapters");

const panel = document.getElementById("panel");
const panelTitle = document.getElementById("panelTitle");
const panelBody = document.getElementById("panelBody");
const panelClose = document.getElementById("panelClose");

function hardFail(msg, err) {
  console.error(msg, err || "");
  if (hintEl) hintEl.textContent = `❌ ${msg}`;
  const box = document.createElement("div");
  box.style.position = "fixed";
  box.style.left = "16px";
  box.style.right = "16px";
  box.style.bottom = "16px";
  box.style.zIndex = "9999";
  box.style.padding = "14px";
  box.style.borderRadius = "16px";
  box.style.background = "rgba(10,12,14,0.94)";
  box.style.border = "1px solid rgba(232,238,242,0.18)";
  box.style.color = "rgba(232,238,242,0.92)";
  box.style.fontFamily = "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial";
  box.style.lineHeight = "1.45";
  box.innerHTML = `
    <div style="font-weight:800;letter-spacing:0.03em;margin-bottom:6px;">Orbit error 🧯</div>
    <div style="opacity:0.85;font-size:13px;">${msg}</div>
    <div style="opacity:0.7;font-size:12px;margin-top:8px;">Open DevTools → Console for the first red error line.</div>
  `;
  document.body.appendChild(box);
}

if (!canvas) hardFail("Canvas #webgl not found. Check index.html has <canvas id='webgl'>.");
if (!hintEl) hardFail("HUD #hint not found. Check index.html has <div id='hint'>.");
if (!chaptersEl) hardFail("HUD #chapters not found. Check index.html has <div id='chapters'>.");

console.log("✅ Orbit main.js running:", import.meta.url);
hintEl.textContent = "main.js loaded ✅ building corkscrew…";

// Helpers
const u = (p) => new URL(p, BASE_URL).href;
const clamp01 = (x) => Math.max(0, Math.min(1, x));
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
function smoothstep(edge0, edge1, x) {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

// Assets
const ASSETS = {
  modelMeOnHill: u("assets/models/me_on_hill.glb"),
  backgroundSphereTex: u("assets/backgrounds/sky_sphere.jpg"),
};

// Chapters
const CHAPTERS = [
  { id: "about",        label: "About",        progress: 0.06, angleDeg: 20,  page: u("pages/about.html") },
  { id: "gallery",      label: "Gallery",      progress: 0.32, angleDeg: 95,  page: u("pages/gallery.html") },
  { id: "achievements", label: "Achievements", progress: 0.58, angleDeg: 170, page: u("pages/achievements.html") },
  { id: "contact",      label: "Contact",      progress: 0.84, angleDeg: 245, page: u("pages/contact.html") },
];

// ============================================================
// 🔥 Corkscrew tuning knobs (these are your “make it feel right” controls)
// ============================================================
const TUNING = {
  // BIGGER model presence
  modelTargetSize: 9.0,   // << make this 10–12 if you want it even more massive

  // Slow scroll/orbit
  scrollSensitivity: 0.00022, // lower = slower scroll response
  dragSensitivity: 0.024,     // lower = slower drag orbit
  inertia: 0.91,              // higher = more floaty glide
  lerp: 0.045,                // lower = slower easing / “heavier” movement

  // Camera orbit (slower + closer so model looks bigger)
  camRadius: 6.2,         // smaller = closer = bigger model on screen
  camYBase: 3.15,
  camYPerStep: 0.42,      // camera drifts downward while scrolling (stronger corkscrew feel)
  lookYBase: 0.95,
  lookYPerStep: 0.22,

  // Spiral (folders corkscrew downward around model)
  spiralRadius: 3.0,
  spiralAngleStep: 0.70,  // lower = slower rotation around model
  spiralYStep: 0.92,      // higher = more “downward corkscrew”
  spiralYOffset: 1.55,

  // Keep folders panning IN FRONT of model (camera-facing bias)
  frontFacingBlend: 0.85, // 0..1, higher = more folders pulled to camera-facing side
  frontPush: 1.15,        // how much the “front” folder is pushed outward (towards camera)
  radiusGrow: 0.12,       // growth as items move away in the spiral

  // Visibility shaping
  visibleRange: 2.9,
  fadeSoftness: 0.75,
};
// ============================================================

// Build chapter UI
let activeChapterId = null;

function buildChapterUI() {
  chaptersEl.innerHTML = "";
  CHAPTERS.forEach((ch) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "chapterDot";
    dot.title = ch.label;
    dot.addEventListener("click", () => {
      timeline.target = ch.progress;
      openPanel(ch).catch(() => {});
    });
    chaptersEl.appendChild(dot);
  });

  const label = document.createElement("div");
  label.className = "chapterLabel";
  label.textContent = "Chapters";
  chaptersEl.appendChild(label);
}

function setActiveDot(id) {
  const dots = Array.from(chaptersEl.querySelectorAll(".chapterDot"));
  dots.forEach((d, i) => d.classList.toggle("is-active", CHAPTERS[i]?.id === id));
}

buildChapterUI();

// Loading manager
const manager = new THREE.LoadingManager();
manager.onProgress = (_url, loaded, total) => {
  const pct = total ? Math.round((loaded / total) * 100) : 0;
  if (loaderFill) loaderFill.style.width = `${pct}%`;
  if (loaderPct) loaderPct.textContent = `${pct}%`;
};
manager.onLoad = () => {
  setTimeout(() => loaderEl?.classList.add("is-hidden"), 250);
  if (hintEl) hintEl.textContent = "Scroll / drag to corkscrew • Click folders";
};

// Three.js setup
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x070A0C, 9, 30);
scene.background = new THREE.Color(0x070A0C);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 240);
camera.position.set(0, 2.5, 6.5);

const clock = new THREE.Clock();

// Lights
scene.add(new THREE.HemisphereLight(0x9fd3ff, 0x0b0f12, 0.95));
const key = new THREE.DirectionalLight(0xffffff, 1.1);
key.position.set(3.6, 4.6, 2.6);
scene.add(key);
const rim = new THREE.DirectionalLight(0xb7c6ff, 0.55);
rim.position.set(-5.4, 2.2, -3.2);
scene.add(rim);

// Center group
const center = new THREE.Group();
scene.add(center);

// Ground placeholder
{
  const groundGeo = new THREE.CircleGeometry(2.8, 72);
  const groundMat = new THREE.MeshStandardMaterial({ color: 0x1b2a22, roughness: 1, metalness: 0 });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -1.18;
  center.add(ground);
}

// Procedural sky fallback
function makeSkyTexture() {
  const w = 1024, h = 512;
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const ctx = c.getContext("2d");

  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, "#061018");
  g.addColorStop(0.55, "#05080C");
  g.addColorStop(1, "#040507");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = "rgba(255,255,255,0.9)";
  for (let i = 0; i < 1000; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    const r = Math.random() * 1.3;
    ctx.globalAlpha = 0.18 + Math.random() * 0.65;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

// Background sphere (fog disabled)
let backgroundSphere = null;
{
  const geo = new THREE.SphereGeometry(76, 48, 48);
  const mat = new THREE.MeshBasicMaterial({
    map: makeSkyTexture(),
    color: 0xffffff,
    side: THREE.BackSide
  });
  mat.fog = false;

  backgroundSphere = new THREE.Mesh(geo, mat);
  backgroundSphere.rotation.y = 0.35;
  scene.add(backgroundSphere);
}

// Load background image (optional)
const texLoader = new THREE.TextureLoader(manager);
texLoader.load(
  ASSETS.backgroundSphereTex,
  (tex) => {
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    backgroundSphere.material.map = tex;
    backgroundSphere.material.needsUpdate = true;
  },
  undefined,
  () => {}
);

// Folder spiral group
const folderGroup = new THREE.Group();
scene.add(folderGroup);

const folderMeshes = [];
createFolderSpiral();

function createFolderSpiral() {
  for (const ch of CHAPTERS) {
    const texture = makeFolderTexture(ch.label);
    texture.colorSpace = THREE.SRGBColorSpace;

    const geo = new THREE.PlaneGeometry(1.65, 1.02, 30, 1);

    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        uMap: { value: texture },
        uOpacity: { value: 0.0 },
        uCurve: { value: 0.26 },
        uWobble: { value: 0.0 }
      },
      vertexShader: `
        varying vec2 vUv;
        uniform float uCurve;
        uniform float uWobble;
        void main(){
          vUv = uv;
          vec3 p = position;
          float x = p.x;
          p.z -= (x*x) * uCurve;
          p.y += sin((uv.x * 3.14159) + uWobble) * 0.012;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        uniform sampler2D uMap;
        uniform float uOpacity;
        void main(){
          vec4 tex = texture2D(uMap, vUv);
          if(tex.a < 0.02) discard;
          gl_FragColor = vec4(tex.rgb, tex.a * uOpacity);
        }
      `
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.userData.chapter = ch;
    folderGroup.add(mesh);
    folderMeshes.push(mesh);
  }
}

function makeFolderTexture(label) {
  const w = 768, h = 512;
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const ctx = c.getContext("2d");

  ctx.clearRect(0, 0, w, h);

  const pad = 52;
  const x = pad, y = 120, fw = w - pad * 2, fh = h - 170;

  ctx.fillStyle = "rgba(232,238,242,0.94)";
  roundRect(ctx, x, y - 56, fw * 0.46, 78, 28);
  ctx.fill();

  ctx.fillStyle = "rgba(232,238,242,0.90)";
  roundRect(ctx, x, y, fw, fh, 36);
  ctx.fill();

  ctx.strokeStyle = "rgba(7,10,12,0.22)";
  ctx.lineWidth = 10;
  roundRect(ctx, x + 18, y + 18, fw - 36, fh - 36, 28);
  ctx.stroke();

  ctx.fillStyle = "rgba(7,10,12,0.82)";
  ctx.font = "800 64px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label.toUpperCase(), w / 2, y + fh / 2 + 10);

  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 8;
  return tex;
}

function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

// Model loading (with fallback)
const gltfLoader = new GLTFLoader(manager);

function addFallbackModel() {
  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.7, 1.4, 10, 18),
    new THREE.MeshStandardMaterial({ color: 0xa8b3bd, roughness: 0.85, metalness: 0.05 })
  );
  body.position.y = -0.45;
  center.add(body);

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.5, 20, 20),
    new THREE.MeshStandardMaterial({ color: 0xcfd6dc, roughness: 0.9 })
  );
  head.position.y = 1.1;
  center.add(head);
}

gltfLoader.load(
  ASSETS.modelMeOnHill,
  (gltf) => {
    const model = gltf.scene;

    const box = new THREE.Box3().setFromObject(model);
    const size = new THREE.Vector3();
    box.getSize(size);

    // WAY bigger scale target
    const maxAxis = Math.max(size.x, size.y, size.z);
    const scale = TUNING.modelTargetSize / Math.max(0.0001, maxAxis);
    model.scale.setScalar(scale);

    // Recenter
    const box2 = new THREE.Box3().setFromObject(model);
    const centerPoint = new THREE.Vector3();
    box2.getCenter(centerPoint);
    model.position.sub(centerPoint);

    // Sit on ground
    model.position.y += -1.22;

    center.add(model);
  },
  undefined,
  () => addFallbackModel()
);

// Picking (click folders)
const raycaster = new THREE.Raycaster();
const pointerNdc = new THREE.Vector2();

canvas.addEventListener("click", (e) => {
  if (panel?.classList.contains("is-open")) return;

  const rect = canvas.getBoundingClientRect();
  pointerNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  pointerNdc.y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);

  raycaster.setFromCamera(pointerNdc, camera);
  const hits = raycaster.intersectObjects(folderMeshes, false);
  if (!hits.length) return;

  const ch = hits[0].object.userData.chapter;
  if (!ch) return;

  timeline.target = ch.progress;
  openPanel(ch).catch(() => {});
});

// Panel
panelClose?.addEventListener("click", closePanel);
window.addEventListener("keydown", (e) => { if (e.key === "Escape") closePanel(); });

async function openPanel(ch) {
  if (!panel || !panelTitle || !panelBody) return;

  panelTitle.textContent = ch.label;
  panel.classList.add("is-open");
  panel.setAttribute("aria-hidden", "false");

  try {
    const res = await fetch(ch.page, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    panelBody.innerHTML = await res.text();
  } catch {
    panelBody.innerHTML = `<p>Couldn’t load <code>${ch.page}</code>.</p>`;
  }
}

function closePanel() {
  if (!panel || !panelTitle || !panelBody) return;
  panel.classList.remove("is-open");
  panel.setAttribute("aria-hidden", "true");
  panelTitle.textContent = "";
  panelBody.innerHTML = "";
}

// Timeline controls
const timeline = { value: 0.02, target: 0.02, velocity: 0, lastInteractT: performance.now() };

function normalizeWheel(e) {
  let dy = e.deltaY;
  if (e.deltaMode === 1) dy *= 16;
  else if (e.deltaMode === 2) dy *= window.innerHeight;
  return dy;
}

window.addEventListener("wheel", (e) => {
  e.preventDefault();
  timeline.lastInteractT = performance.now();
  timeline.velocity += normalizeWheel(e) * TUNING.scrollSensitivity;
}, { passive: false });

let dragging = false;
let dragStartX = 0;
let dragStartVel = 0;

canvas.addEventListener("pointerdown", (e) => {
  dragging = true;
  timeline.lastInteractT = performance.now();
  dragStartX = e.clientX;
  dragStartVel = timeline.velocity;
  canvas.setPointerCapture(e.pointerId);
});

canvas.addEventListener("pointermove", (e) => {
  if (!dragging) return;
  timeline.lastInteractT = performance.now();
  const dx = (e.clientX - dragStartX) / Math.max(1, window.innerWidth);
  timeline.velocity = dragStartVel - dx * TUNING.dragSensitivity;
});

canvas.addEventListener("pointerup", (e) => {
  dragging = false;
  try { canvas.releasePointerCapture(e.pointerId); } catch {}
});

function nearestChapter(v) {
  let best = CHAPTERS[0];
  let bestD = Infinity;
  for (const ch of CHAPTERS) {
    const d = Math.abs(ch.progress - v);
    if (d < bestD) { bestD = d; best = ch; }
  }
  return best;
}

// Normalize across chapter progress range
const PROGRESS_MIN = Math.min(...CHAPTERS.map(c => c.progress));
const PROGRESS_MAX = Math.max(...CHAPTERS.map(c => c.progress));
function chapterT(p) {
  return clamp01((p - PROGRESS_MIN) / Math.max(1e-6, (PROGRESS_MAX - PROGRESS_MIN)));
}

// Resize
window.addEventListener("resize", () => {
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});

// Temp vectors (avoid GC)
const vCamDir = new THREE.Vector3();
const vDir = new THREE.Vector3();
const vBlend = new THREE.Vector3();

// Render loop
requestAnimationFrame(tick);
function tick() {
  const dt = Math.min(0.033, clock.getDelta());
  const time = clock.getElapsedTime();

  // Heavy + slow motion
  timeline.velocity *= Math.pow(TUNING.inertia, dt * 60);
  timeline.target = clamp01(timeline.target + timeline.velocity);
  timeline.value = THREE.MathUtils.lerp(timeline.value, timeline.target, TUNING.lerp);

  // Gentle snap when idle
  const idleMs = performance.now() - timeline.lastInteractT;
  if (!dragging && idleMs > 620) {
    const near = nearestChapter(timeline.value);
    timeline.target = THREE.MathUtils.lerp(timeline.target, near.progress, 0.012);
    if (activeChapterId !== near.id) {
      activeChapterId = near.id;
      setActiveDot(activeChapterId);
      hintEl.textContent = `${near.label} • Click folder to open`;
    }
  }

  // Corkscrew driver
  const t = chapterT(timeline.value);     // 0..1
  const steps = (CHAPTERS.length - 1);
  const centerIdx = t * steps;

  // Camera angle synced to helix (slow)
  const baseAngle = 1.05;
  const camAngle = baseAngle + centerIdx * TUNING.spiralAngleStep;

  // Camera position (closer = model bigger)
  const camY = TUNING.camYBase - centerIdx * TUNING.camYPerStep;
  const camX = Math.cos(camAngle) * TUNING.camRadius;
  const camZ = Math.sin(camAngle) * TUNING.camRadius;
  camera.position.set(camX, camY, camZ);

  // Look target (drifts down with scroll)
  const lookY = TUNING.lookYBase - centerIdx * TUNING.lookYPerStep;
  camera.lookAt(0, lookY, 0);

  // Camera direction on ground plane (origin -> camera)
  vCamDir.set(Math.cos(camAngle), 0, Math.sin(camAngle));

  // Background drift
  backgroundSphere.rotation.y = camAngle * 0.16 + 0.35;
  backgroundSphere.rotation.x = Math.sin(camAngle * 0.11) * 0.028;

  // Folders: corkscrew down, and bias toward camera-facing side so they PAN IN FRONT of the model
  for (let i = 0; i < folderMeshes.length; i++) {
    const mesh = folderMeshes[i];
    const rel = i - centerIdx;

    // how “front” this tile is (1 at center, 0 far away)
    const front = clamp01(1.0 - Math.abs(rel) / 1.15);

    // helix angle + vertical position
    const ang = camAngle + rel * TUNING.spiralAngleStep;
    const y = TUNING.spiralYOffset - rel * TUNING.spiralYStep + Math.sin(time * 1.1 + i * 0.7) * 0.03;

    // radius: center items pushed outward (toward camera) so they pass in front more clearly
    let r = TUNING.spiralRadius + front * TUNING.frontPush + Math.abs(rel) * TUNING.radiusGrow;
    r = Math.min(r, TUNING.camRadius - 0.75);

    // direction around model, blended toward camera-facing direction for “in front” pan
    vDir.set(Math.cos(ang), 0, Math.sin(ang));
    const blend = clamp01(front * TUNING.frontFacingBlend);
    vBlend.copy(vDir).lerp(vCamDir, blend).normalize();

    mesh.position.set(vBlend.x * r, y, vBlend.z * r);

    // face camera (readable, UI-like)
    mesh.lookAt(camera.position.x, y, camera.position.z);

    // opacity window
    const d = Math.abs(rel);
    const fadeStart = TUNING.visibleRange - TUNING.fadeSoftness;
    const fadeEnd = TUNING.visibleRange + TUNING.fadeSoftness;
    const vis = 1.0 - smoothstep(fadeStart, fadeEnd, d);
    mesh.material.uniforms.uOpacity.value = clamp01(vis);

    // wobble feel
    mesh.material.uniforms.uWobble.value = time * 1.7 + timeline.velocity * 55.0;

    // scale emphasis on front folder
    const s = 0.92 + front * 0.18;
    mesh.scale.setScalar(s);
  }

  // Keep the hero stable (so corkscrew reads clean)
  center.rotation.y = Math.sin(time * 0.10) * 0.012;

  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}