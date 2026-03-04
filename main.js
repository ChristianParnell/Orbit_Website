// GitHub Pages safe: NO "three" module specifier (CDN imports only)
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/GLTFLoader.js";

console.log("✅ main.js loaded:", location.href);

const ASSETS = {
  // Exact GitHub Pages-safe relative paths
  modelMeOnHill: "./assets/models/me_on_hill.glb",
  backgroundSphereTex: "./assets/backgrounds/sky_sphere.jpg"
};

// Chapters = Greta-like “timeline stops”
// progress is 0..1 along the orbit timeline
const CHAPTERS = [
  { id: "about",        label: "About",        progress: 0.06, angleDeg: 20,  page: "./pages/about.html" },
  { id: "gallery",      label: "Gallery",      progress: 0.32, angleDeg: 95,  page: "./pages/gallery.html" },
  { id: "achievements", label: "Achievements", progress: 0.58, angleDeg: 170, page: "./pages/achievements.html" },
  { id: "contact",      label: "Contact",      progress: 0.84, angleDeg: 245, page: "./pages/contact.html" }
];

// DOM
const canvas = document.getElementById("webgl");
const loader = document.getElementById("loader");
const loaderFill = document.getElementById("loaderFill");
const loaderPct = document.getElementById("loaderPct");
const hint = document.getElementById("hint");

const chaptersEl = document.getElementById("chapters");

const panel = document.getElementById("panel");
const panelTitle = document.getElementById("panelTitle");
const panelBody = document.getElementById("panelBody");
const panelClose = document.getElementById("panelClose");

// ---------- UI: chapter dots ----------
let activeChapterId = null;

function buildChapterUI(){
  chaptersEl.innerHTML = "";
  for (const ch of CHAPTERS) {
    const dot = document.createElement("button");
    dot.className = "chapterDot";
    dot.type = "button";
    dot.title = ch.label;
    dot.addEventListener("click", () => {
      // snap timeline
      timeline.target = ch.progress;
      // also open panel quickly (Greta vibe: chapter reveal)
      openPanel(ch).catch(()=>{});
    });
    chaptersEl.appendChild(dot);
  }
  const label = document.createElement("div");
  label.className = "chapterLabel";
  label.textContent = "Chapters";
  chaptersEl.appendChild(label);
}
buildChapterUI();

function setActiveDot(id){
  const dots = Array.from(chaptersEl.querySelectorAll(".chapterDot"));
  dots.forEach((d, i) => {
    const ch = CHAPTERS[i];
    d.classList.toggle("is-active", ch?.id === id);
  });
}

// ---------- Three.js setup ----------
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x070A0C, 7, 23);
scene.background = new THREE.Color(0x070A0C);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.set(0, 1.6, 6);

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
  const groundGeo = new THREE.CircleGeometry(2.5, 72);
  const groundMat = new THREE.MeshStandardMaterial({ color: 0x1b2a22, roughness: 1, metalness: 0 });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.98;
  center.add(ground);
}

// Greta-ish background: always visible procedural sky, then replace with your jpg if present
function makeSkyTexture(){
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
  for (let i=0;i<1000;i++){
    const x = Math.random()*w;
    const y = Math.random()*h;
    const r = Math.random()*1.3;
    ctx.globalAlpha = 0.18 + Math.random()*0.65;
    ctx.beginPath();
    ctx.arc(x,y,r,0,Math.PI*2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

let backgroundSphere = null;
{
  const geo = new THREE.SphereGeometry(70, 48, 48);
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

// ---------- Folders (3D “bend around center”) ----------
const folderGroup = new THREE.Group();
scene.add(folderGroup);

const folderMeshes = [];
createFolderRing();

function createFolderRing(){
  const radius = 3.25;
  const y = 0.18;

  for (const ch of CHAPTERS) {
    const texture = makeFolderTexture(ch.label);
    texture.colorSpace = THREE.SRGBColorSpace;

    // lots of X segments so it can curve
    const geo = new THREE.PlaneGeometry(1.4, 0.88, 30, 1);

    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        uMap: { value: texture },
        uOpacity: { value: 0.0 },
        uCurve: { value: 0.30 },
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

          // bend around center
          p.z -= (x*x) * uCurve;

          // micro wobble
          p.y += sin((uv.x * 3.14159) + uWobble) * 0.01;

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

    const ang = THREE.MathUtils.degToRad(ch.angleDeg);
    mesh.position.set(Math.cos(ang) * radius, y, Math.sin(ang) * radius);
    mesh.lookAt(0, y, 0);
    mesh.rotateY(Math.PI);

    folderGroup.add(mesh);
    folderMeshes.push(mesh);
  }
}

function makeFolderTexture(label){
  const w = 768, h = 512;
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const ctx = c.getContext("2d");

  ctx.clearRect(0,0,w,h);

  const pad = 52;
  const x = pad, y = 120, fw = w - pad*2, fh = h - 170;

  // tab
  ctx.fillStyle = "rgba(232,238,242,0.94)";
  roundRect(ctx, x, y-56, fw*0.46, 78, 28);
  ctx.fill();

  // body
  ctx.fillStyle = "rgba(232,238,242,0.90)";
  roundRect(ctx, x, y, fw, fh, 36);
  ctx.fill();

  // inner stroke
  ctx.strokeStyle = "rgba(7,10,12,0.22)";
  ctx.lineWidth = 10;
  roundRect(ctx, x+18, y+18, fw-36, fh-36, 28);
  ctx.stroke();

  // text
  ctx.fillStyle = "rgba(7,10,12,0.82)";
  ctx.font = "800 64px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label.toUpperCase(), w/2, y + fh/2 + 10);

  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 8;
  return tex;
}

function roundRect(ctx, x, y, w, h, r){
  const rr = Math.min(r, w/2, h/2);
  ctx.beginPath();
  ctx.moveTo(x+rr, y);
  ctx.arcTo(x+w, y, x+w, y+h, rr);
  ctx.arcTo(x+w, y+h, x, y+h, rr);
  ctx.arcTo(x, y+h, x, y, rr);
  ctx.arcTo(x, y, x+w, y, rr);
  ctx.closePath();
}

// ---------- Raycast clicking folders ----------
const raycaster = new THREE.Raycaster();
const pointerNdc = new THREE.Vector2();

canvas.addEventListener("click", (e) => {
  if (panel.classList.contains("is-open")) return;

  const rect = canvas.getBoundingClientRect();
  pointerNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  pointerNdc.y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);

  raycaster.setFromCamera(pointerNdc, camera);
  const hits = raycaster.intersectObjects(folderMeshes, false);
  if (!hits.length) return;

  const ch = hits[0].object.userData.chapter;
  if (!ch) return;

  // snap toward chapter on click
  timeline.target = ch.progress;
  openPanel(ch).catch(()=>{});
});

// ---------- Panel ----------
panelClose.addEventListener("click", closePanel);
window.addEventListener("keydown", (e) => { if (e.key === "Escape") closePanel(); });

async function openPanel(ch){
  panelTitle.textContent = ch.label;
  panel.classList.add("is-open");
  panel.setAttribute("aria-hidden", "false");

  try{
    const res = await fetch(ch.page);
    const html = await res.text();
    panelBody.innerHTML = html;
  }catch(err){
    panelBody.innerHTML = `<p>Couldn’t load <code>${ch.page}</code>.</p>`;
    console.warn("❌ Panel fetch failed:", ch.page, err);
  }
}

function closePanel(){
  panel.classList.remove("is-open");
  panel.setAttribute("aria-hidden", "true");
  panelTitle.textContent = "";
  panelBody.innerHTML = "";
}

// ---------- Greta-style timeline controls (wheel + drag + inertia + snapping) ----------
const timeline = {
  value: 0.02,     // current
  target: 0.02,    // where we want to go
  velocity: 0,     // inertial velocity
  isInteracting: false,
  lastInteractT: 0
};

// wheel normalization (deltaMode handling)
function normalizeWheel(e){
  let dy = e.deltaY;

  // deltaMode: 0=pixels, 1=lines, 2=pages
  if (e.deltaMode === 1) dy *= 16;
  else if (e.deltaMode === 2) dy *= window.innerHeight;

  return dy;
}

window.addEventListener("wheel", (e) => {
  e.preventDefault();
  timeline.isInteracting = true;
  timeline.lastInteractT = performance.now();

  const dy = normalizeWheel(e);

  // scale: smaller = slower orbit, larger = faster
  const strength = 0.0009;
  timeline.velocity += dy * strength;

}, { passive: false });

// drag to rotate (affects timeline like Greta)
let dragging = false;
let dragStartX = 0;
let dragStartV = 0;

canvas.addEventListener("pointerdown", (e) => {
  dragging = true;
  timeline.isInteracting = true;
  timeline.lastInteractT = performance.now();
  dragStartX = e.clientX;
  dragStartV = timeline.velocity;
  canvas.setPointerCapture(e.pointerId);
});

canvas.addEventListener("pointermove", (e) => {
  if (!dragging) return;
  timeline.lastInteractT = performance.now();

  const dx = (e.clientX - dragStartX) / Math.max(1, window.innerWidth);
  // drag direction tuned to feel natural
  timeline.velocity = dragStartV - dx * 0.06;
});

canvas.addEventListener("pointerup", (e) => {
  dragging = false;
  try { canvas.releasePointerCapture(e.pointerId); } catch {}
});

// touch hint
canvas.addEventListener("touchstart", () => {
  hint.textContent = "Drag to explore • Tap folders";
}, { passive: true });

// snap when idle
function getNearestChapterProgress(v){
  let best = CHAPTERS[0];
  let bestD = Infinity;
  for (const ch of CHAPTERS){
    const d = Math.abs(ch.progress - v);
    if (d < bestD) { bestD = d; best = ch; }
  }
  return best;
}

// ---------- Load assets with progress (Greta-ish loader) ----------
let modelLoaded = false;
let bgLoaded = false;

const manager = new THREE.LoadingManager();
manager.onProgress = (_url, loaded, total) => {
  const pct = total ? Math.round((loaded / total) * 100) : 0;
  loaderFill.style.width = `${pct}%`;
  loaderPct.textContent = `${pct}%`;
};
manager.onLoad = () => {
  // slight delay for vibe
  setTimeout(() => {
    loader.classList.add("is-hidden");
    hint.textContent = "Scroll to explore • Drag to rotate • Click folders";
  }, 250);
};

const texLoader = new THREE.TextureLoader(manager);
const gltfLoader = new GLTFLoader(manager);

// replace background with your image if present
texLoader.load(
  ASSETS.backgroundSphereTex,
  (tex) => {
    bgLoaded = true;
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    backgroundSphere.material.map = tex;
    backgroundSphere.material.needsUpdate = true;
  },
  undefined,
  () => {
    // keep procedural, still fine
    bgLoaded = false;
  }
);

// load model (fallback if missing)
loadCenterModel();

function loadCenterModel(){
  gltfLoader.load(
    ASSETS.modelMeOnHill,
    (gltf) => {
      modelLoaded = true;
      const model = gltf.scene;

      model.traverse((o) => {
        if (o.isMesh) {
          o.castShadow = false;
          o.receiveShadow = false;
          if (o.material?.map) o.material.map.colorSpace = THREE.SRGBColorSpace;
        }
      });

      const box = new THREE.Box3().setFromObject(model);
      const size = new THREE.Vector3();
      box.getSize(size);

      const maxAxis = Math.max(size.x, size.y, size.z);
      const scale = 2.2 / Math.max(0.0001, maxAxis);
      model.scale.setScalar(scale);

      const centerPoint = new THREE.Vector3();
      box.getCenter(centerPoint);
      model.position.sub(centerPoint.multiplyScalar(scale));
      model.position.y += -0.9;

      center.add(model);
    },
    undefined,
    () => {
      modelLoaded = false;

      // fallback “you”
      const body = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.35, 0.7, 10, 18),
        new THREE.MeshStandardMaterial({ color: 0xa8b3bd, roughness: 0.85, metalness: 0.05 })
      );
      body.position.y = -0.25;
      center.add(body);

      const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.26, 20, 20),
        new THREE.MeshStandardMaterial({ color: 0xcfd6dc, roughness: 0.9 })
      );
      head.position.y = 0.5;
      center.add(head);
    }
  );
}

// ---------- Resize ----------
window.addEventListener("resize", () => {
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});

// ---------- Render loop ----------
const ORBIT_TURNS = 1.55;
const ORBIT_RADIUS = 6.0;

function tick(){
  const dt = Math.min(0.033, clock.getDelta());
  const time = clock.getElapsedTime();

  // inertia physics
  timeline.velocity *= Math.pow(0.86, dt * 60); // damp
  timeline.target = THREE.MathUtils.clamp(timeline.target + timeline.velocity, 0, 1);

  // smooth timeline value toward target
  timeline.value = THREE.MathUtils.lerp(timeline.value, timeline.target, 0.09);

  // if idle for a moment, snap to nearest chapter (Greta chapter feel)
  const now = performance.now();
  const idleMs = now - timeline.lastInteractT;
  if (!dragging && idleMs > 550) {
    const nearest = getNearestChapterProgress(timeline.value);
    // gentle pull toward nearest
    timeline.target = THREE.MathUtils.lerp(timeline.target, nearest.progress, 0.018);
    timeline.isInteracting = false;
  }

  // map timeline -> orbit angle
  const azimuth = timeline.value * ORBIT_TURNS * Math.PI * 2.0;

  // subtle pitch sweep (pan down effect)
  const pitchStart = THREE.MathUtils.degToRad(64);
  const pitchEnd   = THREE.MathUtils.degToRad(80);
  const pitch = THREE.MathUtils.lerp(pitchStart, pitchEnd, smoothstep(0.06, 0.94, timeline.value));

  // camera spherical
  const y = Math.cos(pitch) * ORBIT_RADIUS;
  const r = Math.sin(pitch) * ORBIT_RADIUS;
  const x = Math.cos(azimuth) * r;
  const z = Math.sin(azimuth) * r;

  camera.position.set(x, y + 0.45, z);
  camera.lookAt(0, 0.25, 0);

  // background parallax rotation
  backgroundSphere.rotation.y = azimuth * 0.22 + 0.35;
  backgroundSphere.rotation.x = Math.sin(azimuth * 0.15) * 0.03;

  // folders: fade in when facing camera (plus wobble)
  const camAngle = wrapAngle(azimuth);
  let nearestChapter = null;
  let nearestDiff = Infinity;

  for (const mesh of folderMeshes) {
    const ch = mesh.userData.chapter;
    const folderAngle = wrapAngle(THREE.MathUtils.degToRad(ch.angleDeg));
    const diff = smallestAngleDiff(camAngle, folderAngle);

    if (diff < nearestDiff) { nearestDiff = diff; nearestChapter = ch; }

    const visibility = 1.0 - smoothstep(0.58, 1.15, diff);
    const opacity = THREE.MathUtils.clamp(visibility, 0, 1);

    mesh.material.uniforms.uOpacity.value = opacity;
    mesh.material.uniforms.uWobble.value = time * 2.0 + timeline.velocity * 80.0;

    // slight “breathing”
    mesh.position.y = 0.18 + Math.sin(time * 1.2 + folderAngle) * 0.03;
  }

  // update active chapter UI
  if (nearestChapter && nearestDiff < 0.9) {
    if (activeChapterId !== nearestChapter.id) {
      activeChapterId = nearestChapter.id;
      setActiveDot(activeChapterId);
      hint.textContent = nearestChapter.label + " • Click folder to open";
    }
  }

  // subtle idle sway on center
  center.rotation.y = Math.sin(time * 0.25) * 0.05;

  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);

function smoothstep(edge0, edge1, x){
  const t = THREE.MathUtils.clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

function wrapAngle(a){
  const twoPi = Math.PI * 2;
  return ((a % twoPi) + twoPi) % twoPi;
}

function smallestAngleDiff(a, b){
  const twoPi = Math.PI * 2;
  let d = Math.abs(a - b) % twoPi;
  if (d > Math.PI) d = twoPi - d;
  return d;
}