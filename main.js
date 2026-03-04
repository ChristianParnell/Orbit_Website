// main.js (GitHub Pages safe, no importmap needed)

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
hintEl.textContent = "main.js loaded ✅ building scene…";

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

  // required for this build:
  fogJpg: u("assets/textures/fog.jpg"),      // black background fog jpg
  bgAudio: u("assets/audio/ambient.mp3"),    // loop music
};

// Chapters (tiles)
const CHAPTERS = [
  { id: "about",        label: "About",        progress: 0.06, angleDeg: 20,  page: u("pages/about.html") },
  { id: "gallery",      label: "Gallery",      progress: 0.32, angleDeg: 95,  page: u("pages/gallery.html") },
  { id: "achievements", label: "Achievements", progress: 0.58, angleDeg: 170, page: u("pages/achievements.html") },
  { id: "contact",      label: "Contact",      progress: 0.84, angleDeg: 245, page: u("pages/contact.html") },
];

// ============================================================
// TUNING (model framed + tiles spaced + title is clean text)
// ============================================================
const TUNING = {
  // Model slightly smaller, so it fits full height in-frame
  modelTargetSize: 9.2,

  // Slow scroll/orbit
  scrollSensitivity: 0.00016,
  dragSensitivity: 0.016,
  inertia: 0.92,
  lerp: 0.040,

  // Camera pulled back a bit to see whole model
  camRadius: 8.1,
  camYBase: 3.75,
  camYPerStep: 0.40,
  lookYBase: 1.05,
  lookYPerStep: 0.20,

  // Corkscrew tiles (MORE spread)
  spiralRadius: 4.25,       // wider ring
  spiralAngleStep: 0.58,    // still slow-ish rotation
  spiralYStep: 1.45,        // more vertical spacing (less stacking)
  spiralYOffset: 2.10,
  radiusGrow: 0.18,         // slightly more spacing along spiral

  // Keep “front pass” behaviour
  frontFacingBlend: 0.82,
  frontPush: 1.10,

  // Visibility
  visibleRange: 3.2,
  fadeSoftness: 0.95,

  // Tile look
  tileSize: { w: 1.85, h: 1.16 },
  tileCurve: 0.18,

  // Title placement (now just text)
  titleOffsetY: 1.12,       // higher so it doesn’t sit on the tile
  titleScale: 1.0,
};
// ============================================================

// Build chapter UI dots
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
  if (hintEl) hintEl.textContent = "Scroll / drag • Click tiles • (sound starts on interaction)";
};

// Three.js setup
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x070A0C, 10, 38);
scene.background = new THREE.Color(0x070A0C);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 320);
camera.position.set(0, 3.2, 8.0);

const clock = new THREE.Clock();

// Lights
scene.add(new THREE.HemisphereLight(0x9fd3ff, 0x0b0f12, 0.95));
const key = new THREE.DirectionalLight(0xffffff, 1.05);
key.position.set(3.6, 4.6, 2.6);
scene.add(key);
const rim = new THREE.DirectionalLight(0xb7c6ff, 0.55);
rim.position.set(-5.4, 2.2, -3.2);
scene.add(rim);

// Center group
const center = new THREE.Group();
scene.add(center);

// ✅ Base circle removed (no ground mesh)

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

// Background sphere
let backgroundSphere = null;
{
  const geo = new THREE.SphereGeometry(88, 48, 48);
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

// =======================
// Fog (JPG black -> transparent)
// =======================
const fogGroup = new THREE.Group();
scene.add(fogGroup);

const fogTex = new THREE.TextureLoader(manager).load(
  ASSETS.fogJpg,
  (t) => {
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
    t.minFilter = THREE.LinearFilter;
    t.magFilter = THREE.LinearFilter;
  },
  undefined,
  () => {
    console.warn("Fog texture failed to load:", ASSETS.fogJpg);
  }
);

// Shader: key out black using luminance
function makeFogMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: THREE.NormalBlending,
    uniforms: {
      uMap: { value: fogTex },
      uOpacity: { value: 0.22 },
      uBlackCut: { value: 0.10 },
      uSoft: { value: 0.30 },
      uTint: { value: new THREE.Color(0xe8eef2) }
    },
    vertexShader: `
      varying vec2 vUv;
      void main(){
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      uniform sampler2D uMap;
      uniform float uOpacity;
      uniform float uBlackCut;
      uniform float uSoft;
      uniform vec3 uTint;

      void main(){
        vec3 c = texture2D(uMap, vUv).rgb;
        float luma = dot(c, vec3(0.299, 0.587, 0.114));
        float a = smoothstep(uBlackCut, uBlackCut + uSoft, luma);

        float edge = smoothstep(0.02, 0.22, vUv.x) * smoothstep(0.02, 0.22, vUv.y) *
                     smoothstep(0.02, 0.22, 1.0 - vUv.x) * smoothstep(0.02, 0.22, 1.0 - vUv.y);
        a *= edge;

        if(a < 0.01) discard;

        vec3 col = mix(vec3(0.0), uTint, 0.96);
        gl_FragColor = vec4(col, a * uOpacity);
      }
    `
  });
}

const fogPuffs = [];
(function createFogPuffs(){
  const puffCount = 22;
  const geo = new THREE.PlaneGeometry(2.2, 2.2, 1, 1);

  for (let i = 0; i < puffCount; i++) {
    const mat = makeFogMaterial();
    mat.uniforms.uOpacity.value = 0.14 + Math.random() * 0.20;

    const m = new THREE.Mesh(geo, mat);

    const radius = 2.2 + Math.random() * 3.5;
    const ang = Math.random() * Math.PI * 2;
    const y = -0.6 + Math.random() * 3.8;
    const speed = 0.09 + Math.random() * 0.16;
    const bobAmp = 0.10 + Math.random() * 0.28;
    const spin = (Math.random() * 2 - 1) * 0.32;

    m.userData = { radius, ang, y, speed, bobAmp, spin, seed: Math.random() * 1000 };
    m.position.set(Math.cos(ang) * radius, y, Math.sin(ang) * radius);
    m.rotation.z = Math.random() * Math.PI * 2;
    m.scale.setScalar(0.7 + Math.random() * 1.3);

    fogGroup.add(m);
    fogPuffs.push(m);
  }

  fogGroup.rotation.y = 0.2;
})();

// =======================
// Audio (loop + muffle when panel opens)
// =======================
const audioState = {
  ctx: null,
  src: null,
  gain: null,
  filter: null,
  started: false,
  targetMuffled: false,
};

async function ensureAudio() {
  if (audioState.started) return;
  audioState.started = true;

  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioCtx();

    const res = await fetch(ASSETS.bgAudio, { cache: "no-store" });
    if (!res.ok) throw new Error(`Audio HTTP ${res.status}`);
    const arr = await res.arrayBuffer();
    const buffer = await ctx.decodeAudioData(arr);

    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 18000;
    filter.Q.value = 0.7;

    const gain = ctx.createGain();
    gain.gain.value = 0.52;

    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    src.start(0);

    audioState.ctx = ctx;
    audioState.src = src;
    audioState.filter = filter;
    audioState.gain = gain;

    hintEl.textContent = "Scroll / drag • Click tiles • ESC closes";
  } catch (e) {
    console.warn("Audio failed to start:", e);
    hintEl.textContent = "Scroll / drag • Click tiles • (audio missing?)";
  }
}

function setMuffle(isMuffled) {
  audioState.targetMuffled = isMuffled;
  if (!audioState.ctx || !audioState.filter || !audioState.gain) return;

  const now = audioState.ctx.currentTime;
  const targetFreq = isMuffled ? 700 : 18000;
  const targetGain = isMuffled ? 0.28 : 0.52;

  audioState.filter.frequency.cancelScheduledValues(now);
  audioState.gain.gain.cancelScheduledValues(now);

  audioState.filter.frequency.setTargetAtTime(targetFreq, now, 0.08);
  audioState.gain.gain.setTargetAtTime(targetGain, now, 0.10);
}

// Start audio on first user gesture
function gestureKick() { ensureAudio().catch(()=>{}); }
window.addEventListener("pointerdown", gestureKick, { once: true });
window.addEventListener("wheel", gestureKick, { once: true, passive: true });
window.addEventListener("keydown", gestureKick, { once: true });

// =======================
// Tiles: black/white cover + external clean text label
// =======================
const tileGroup = new THREE.Group();
scene.add(tileGroup);

const clickableMeshes = [];
const tileItems = [];

function makeCoverTexture() {
  const w = 1024, h = 640;
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const ctx = c.getContext("2d");

  ctx.fillStyle = "#070A0C";
  ctx.fillRect(0, 0, w, h);

  ctx.globalAlpha = 0.10;
  ctx.strokeStyle = "#E8EEF2";
  ctx.lineWidth = 2;
  for (let i = 0; i < 30; i++) {
    const y = (i / 30) * h;
    ctx.beginPath();
    ctx.moveTo(0, y + (Math.random() * 10 - 5));
    ctx.lineTo(w, y + (Math.random() * 10 - 5));
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  ctx.strokeStyle = "rgba(232,238,242,0.90)";
  ctx.lineWidth = 14;
  ctx.strokeRect(26, 26, w - 52, h - 52);

  ctx.strokeStyle = "rgba(232,238,242,0.18)";
  ctx.lineWidth = 6;
  ctx.strokeRect(54, 54, w - 108, h - 108);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

// ✅ Clean text only (no borders, no pill)
function makeTitleTexture(text) {
  const w = 1024, h = 256;
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const ctx = c.getContext("2d");

  ctx.clearRect(0, 0, w, h);

  // subtle shadow for readability
  ctx.font = "800 88px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.fillText(text.toUpperCase(), w / 2 + 3, h / 2 + 6);

  ctx.fillStyle = "rgba(232,238,242,0.95)";
  ctx.fillText(text.toUpperCase(), w / 2, h / 2 + 3);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

(function createTiles(){
  const coverTex = makeCoverTexture();

  for (let i = 0; i < CHAPTERS.length; i++) {
    const ch = CHAPTERS[i];

    const geo = new THREE.PlaneGeometry(TUNING.tileSize.w, TUNING.tileSize.h, 30, 1);

    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      uniforms: {
        uMap: { value: coverTex },
        uOpacity: { value: 0.0 },
        uCurve: { value: TUNING.tileCurve },
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
          gl_FragColor = vec4(tex.rgb, uOpacity);
        }
      `
    });

    const cover = new THREE.Mesh(geo, mat);
    cover.userData.chapter = ch;

    const titleTex = makeTitleTexture(ch.label);
    const titleMat = new THREE.SpriteMaterial({
      map: titleTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.0
    });
    const title = new THREE.Sprite(titleMat);
    title.scale.set(1.95 * TUNING.titleScale, 0.40 * TUNING.titleScale, 1);

    const g = new THREE.Group();
    g.add(cover);
    g.add(title);

    // Title sits higher (not on top of the tile)
    title.position.set(0, TUNING.titleOffsetY, 0);

    tileGroup.add(g);
    clickableMeshes.push(cover);
    tileItems.push({ group: g, cover, title, chapter: ch, index: i });
  }
})();

// =======================
// Model
// =======================
const gltfLoader = new GLTFLoader(manager);

function addFallbackModel() {
  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.75, 1.5, 10, 18),
    new THREE.MeshStandardMaterial({ color: 0xa8b3bd, roughness: 0.85, metalness: 0.05 })
  );
  body.position.y = -0.45;
  center.add(body);

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.55, 20, 20),
    new THREE.MeshStandardMaterial({ color: 0xcfd6dc, roughness: 0.9 })
  );
  head.position.y = 1.15;
  center.add(head);
}

gltfLoader.load(
  ASSETS.modelMeOnHill,
  (gltf) => {
    const model = gltf.scene;

    const box = new THREE.Box3().setFromObject(model);
    const size = new THREE.Vector3();
    box.getSize(size);

    const maxAxis = Math.max(size.x, size.y, size.z);
    const scale = TUNING.modelTargetSize / Math.max(0.0001, maxAxis);
    model.scale.setScalar(scale);

    const box2 = new THREE.Box3().setFromObject(model);
    const centerPoint = new THREE.Vector3();
    box2.getCenter(centerPoint);
    model.position.sub(centerPoint);

    model.position.y += -1.28;

    center.add(model);
  },
  undefined,
  () => addFallbackModel()
);

// =======================
// Panel (muffle audio)
// =======================
panelClose?.addEventListener("click", closePanel);
window.addEventListener("keydown", (e) => { if (e.key === "Escape") closePanel(); });

async function openPanel(ch) {
  if (!panel || !panelTitle || !panelBody) return;

  setMuffle(true);

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

  setMuffle(false);
}

// =======================
// Picking
// =======================
const raycaster = new THREE.Raycaster();
const pointerNdc = new THREE.Vector2();

canvas.addEventListener("click", async (e) => {
  if (panel?.classList.contains("is-open")) return;

  await ensureAudio().catch(()=>{});

  const rect = canvas.getBoundingClientRect();
  pointerNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  pointerNdc.y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);

  raycaster.setFromCamera(pointerNdc, camera);
  const hits = raycaster.intersectObjects(clickableMeshes, false);
  if (!hits.length) return;

  const ch = hits[0].object.userData.chapter;
  if (!ch) return;

  timeline.target = ch.progress;
  openPanel(ch).catch(() => {});
});

// =======================
// Timeline controls
// =======================
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

// Temp vectors
const vCamDir = new THREE.Vector3();
const vDir = new THREE.Vector3();
const vBlend = new THREE.Vector3();
const vToCam = new THREE.Vector3();

// =======================
// Render loop
// =======================
requestAnimationFrame(tick);
function tick() {
  const dt = Math.min(0.033, clock.getDelta());
  const time = clock.getElapsedTime();

  timeline.velocity *= Math.pow(TUNING.inertia, dt * 60);
  timeline.target = clamp01(timeline.target + timeline.velocity);
  timeline.value = THREE.MathUtils.lerp(timeline.value, timeline.target, TUNING.lerp);

  const idleMs = performance.now() - timeline.lastInteractT;
  if (!dragging && idleMs > 720) {
    const near = nearestChapter(timeline.value);
    timeline.target = THREE.MathUtils.lerp(timeline.target, near.progress, 0.010);
    if (activeChapterId !== near.id) {
      activeChapterId = near.id;
      setActiveDot(activeChapterId);
      hintEl.textContent = `${near.label} • Click tile to open`;
    }
  }

  // Corkscrew driver
  const t = chapterT(timeline.value);
  const steps = (CHAPTERS.length - 1);
  const centerIdx = t * steps;

  // Camera
  const baseAngle = 1.08;
  const camAngle = baseAngle + centerIdx * TUNING.spiralAngleStep;

  const camY = TUNING.camYBase - centerIdx * TUNING.camYPerStep;
  const camX = Math.cos(camAngle) * TUNING.camRadius;
  const camZ = Math.sin(camAngle) * TUNING.camRadius;
  camera.position.set(camX, camY, camZ);

  const lookY = TUNING.lookYBase - centerIdx * TUNING.lookYPerStep;
  camera.lookAt(0, lookY, 0);

  vCamDir.set(Math.cos(camAngle), 0, Math.sin(camAngle));

  // Background drift
  backgroundSphere.rotation.y = camAngle * 0.15 + 0.35;
  backgroundSphere.rotation.x = Math.sin(camAngle * 0.11) * 0.028;

  // Fog motion
  fogGroup.rotation.y += dt * 0.06;
  for (const puff of fogPuffs) {
    const d = puff.userData;
    d.ang += dt * d.speed;
    const y = d.y + Math.sin(time * 0.7 + d.seed) * d.bobAmp;
    puff.position.set(Math.cos(d.ang) * d.radius, y, Math.sin(d.ang) * d.radius);
    puff.rotation.z += dt * d.spin;
    puff.lookAt(camera.position);
  }

  // Tiles orbit (face outward, not camera)
  for (const item of tileItems) {
    const { group, cover, title, index } = item;
    const rel = index - centerIdx;

    const front = clamp01(1.0 - Math.abs(rel) / 1.15);

    const ang = camAngle + rel * TUNING.spiralAngleStep;
    const y = TUNING.spiralYOffset - rel * TUNING.spiralYStep + Math.sin(time * 1.05 + index * 0.7) * 0.03;

    let r = TUNING.spiralRadius + front * TUNING.frontPush + Math.abs(rel) * TUNING.radiusGrow;
    r = Math.min(r, TUNING.camRadius - 1.0);

    vDir.set(Math.cos(ang), 0, Math.sin(ang));
    const blend = clamp01(front * TUNING.frontFacingBlend);
    vBlend.copy(vDir).lerp(vCamDir, blend).normalize();

    group.position.set(vBlend.x * r, y, vBlend.z * r);

    // outward facing
    group.lookAt(0, y, 0);
    group.rotateY(Math.PI);

    const dAbs = Math.abs(rel);
    const fadeStart = TUNING.visibleRange - TUNING.fadeSoftness;
    const fadeEnd = TUNING.visibleRange + TUNING.fadeSoftness;
    const vis = 1.0 - smoothstep(fadeStart, fadeEnd, dAbs);

    cover.material.uniforms.uOpacity.value = clamp01(vis);
    cover.material.uniforms.uWobble.value = time * 1.4 + timeline.velocity * 38.0;

    const s = 0.92 + front * 0.18;
    group.scale.setScalar(s);

    // Title: billboard to camera, fade when not on front side
    title.lookAt(camera.position);

    vToCam.copy(camera.position).sub(group.position).normalize();
    const facing = clamp01(vBlend.dot(vToCam));
    const titleVis = clamp01(smoothstep(0.18, 0.58, facing) * vis);

    title.material.opacity = titleVis;
  }

  // keep hero stable
  center.rotation.y = Math.sin(time * 0.10) * 0.010;

  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}
