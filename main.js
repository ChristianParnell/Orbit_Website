import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/GLTFLoader.js";

/* If you see this text change on the site, main.js is definitely running */
const hintEl = document.getElementById("hint");
hintEl.textContent = "JS loaded ✅ Scroll / drag to orbit";

const ASSETS = {
  modelMeOnHill: "/Orbit_Website/assets/models/me_on_hill.glb",
  backgroundSphereTex: "/Orbit_Website/assets/backgrounds/sky_sphere.jpg"
};

const CHAPTERS = [
  { id: "about",        label: "About",        progress: 0.06, angleDeg: 20,  page: "/Orbit_Website/pages/about.html" },
  { id: "gallery",      label: "Gallery",      progress: 0.32, angleDeg: 95,  page: "/Orbit_Website/pages/gallery.html" },
  { id: "achievements", label: "Achievements", progress: 0.58, angleDeg: 170, page: "/Orbit_Website/pages/achievements.html" },
  { id: "contact",      label: "Contact",      progress: 0.84, angleDeg: 245, page: "/Orbit_Website/pages/contact.html" }
];

// DOM
const canvas = document.getElementById("webgl");

const loaderEl = document.getElementById("loader");
const loaderFill = document.getElementById("loaderFill");
const loaderPct = document.getElementById("loaderPct");

const chaptersEl = document.getElementById("chapters");

const panel = document.getElementById("panel");
const panelTitle = document.getElementById("panelTitle");
const panelBody = document.getElementById("panelBody");
const panelClose = document.getElementById("panelClose");

// Chapters UI
let activeChapterId = null;

function buildChapterUI(){
  chaptersEl.innerHTML = "";
  CHAPTERS.forEach((ch) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "chapterDot";
    dot.title = ch.label;
    dot.addEventListener("click", () => {
      timeline.target = ch.progress;
      openPanel(ch).catch(()=>{});
    });
    chaptersEl.appendChild(dot);
  });

  const label = document.createElement("div");
  label.className = "chapterLabel";
  label.textContent = "Chapters";
  chaptersEl.appendChild(label);
}

function setActiveDot(id){
  const dots = Array.from(chaptersEl.querySelectorAll(".chapterDot"));
  dots.forEach((d, i) => d.classList.toggle("is-active", CHAPTERS[i]?.id === id));
}

buildChapterUI();

// Three.js setup
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

// Procedural sky (always shows even if jpg missing)
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

// Background sphere
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

// Folder ring
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
          p.z -= (x*x) * uCurve;
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

  ctx.fillStyle = "rgba(232,238,242,0.94)";
  roundRect(ctx, x, y-56, fw*0.46, 78, 28);
  ctx.fill();

  ctx.fillStyle = "rgba(232,238,242,0.90)";
  roundRect(ctx, x, y, fw, fh, 36);
  ctx.fill();

  ctx.strokeStyle = "rgba(7,10,12,0.22)";
  ctx.lineWidth = 10;
  roundRect(ctx, x+18, y+18, fw-36, fh-36, 28);
  ctx.stroke();

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

// Picking
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

  timeline.target = ch.progress;
  openPanel(ch).catch(()=>{});
});

// Panel
panelClose.addEventListener("click", closePanel);
window.addEventListener("keydown", (e) => { if (e.key === "Escape") closePanel(); });

async function openPanel(ch){
  panelTitle.textContent = ch.label;
  panel.classList.add("is-open");
  panel.setAttribute("aria-hidden", "false");

  try{
    const res = await fetch(ch.page);
    panelBody.innerHTML = await res.text();
  }catch{
    panelBody.innerHTML = `<p>Couldn’t load <code>${ch.page}</code>.</p>`;
  }
}

function closePanel(){
  panel.classList.remove("is-open");
  panel.setAttribute("aria-hidden", "true");
  panelTitle.textContent = "";
  panelBody.innerHTML = "";
}

// Timeline input
const timeline = { value: 0.02, target: 0.02, velocity: 0, lastInteractT: 0 };

function normalizeWheel(e){
  let dy = e.deltaY;
  if (e.deltaMode === 1) dy *= 16;
  else if (e.deltaMode === 2) dy *= window.innerHeight;
  return dy;
}

window.addEventListener("wheel", (e) => {
  e.preventDefault();
  timeline.lastInteractT = performance.now();
  timeline.velocity += normalizeWheel(e) * 0.0009;
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
  timeline.velocity = dragStartVel - dx * 0.06;
});

canvas.addEventListener("pointerup", (e) => {
  dragging = false;
  try { canvas.releasePointerCapture(e.pointerId); } catch {}
});

function nearestChapter(v){
  let best = CHAPTERS[0];
  let bestD = Infinity;
  for (const ch of CHAPTERS){
    const d = Math.abs(ch.progress - v);
    if (d < bestD) { bestD = d; best = ch; }
  }
  return best;
}

// Loader + loading manager
const manager = new THREE.LoadingManager();
manager.onProgress = (_url, loaded, total) => {
  const pct = total ? Math.round((loaded / total) * 100) : 0;
  loaderFill.style.width = `${pct}%`;
  loaderPct.textContent = `${pct}%`;
};
manager.onLoad = () => {
  setTimeout(() => loaderEl.classList.add("is-hidden"), 250);
  hintEl.textContent = "Scroll / drag to orbit • Click folders";
};

const texLoader = new THREE.TextureLoader(manager);
const gltfLoader = new GLTFLoader(manager);

// Background image (optional)
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

// Model (fallback if missing)
gltfLoader.load(
  ASSETS.modelMeOnHill,
  (gltf) => {
    const model = gltf.scene;

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

// Resize
window.addEventListener("resize", () => {
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});

// Render loop
const ORBIT_TURNS = 1.55;
const ORBIT_RADIUS = 6.0;

requestAnimationFrame(tick);
function tick(){
  const dt = Math.min(0.033, clock.getDelta());
  const time = clock.getElapsedTime();

  timeline.velocity *= Math.pow(0.86, dt * 60);
  timeline.target = THREE.MathUtils.clamp(timeline.target + timeline.velocity, 0, 1);
  timeline.value = THREE.MathUtils.lerp(timeline.value, timeline.target, 0.09);

  const idleMs = performance.now() - timeline.lastInteractT;
  if (!dragging && idleMs > 550) {
    const near = nearestChapter(timeline.value);
    timeline.target = THREE.MathUtils.lerp(timeline.target, near.progress, 0.018);
    if (activeChapterId !== near.id) {
      activeChapterId = near.id;
      setActiveDot(activeChapterId);
      hintEl.textContent = `${near.label} • Click folder to open`;
    }
  }

  const azimuth = timeline.value * ORBIT_TURNS * Math.PI * 2.0;

  const pitchStart = THREE.MathUtils.degToRad(64);
  const pitchEnd   = THREE.MathUtils.degToRad(80);
  const pitch = THREE.MathUtils.lerp(pitchStart, pitchEnd, smoothstep(0.06, 0.94, timeline.value));

  const y = Math.cos(pitch) * ORBIT_RADIUS;
  const r = Math.sin(pitch) * ORBIT_RADIUS;
  const x = Math.cos(azimuth) * r;
  const z = Math.sin(azimuth) * r;

  camera.position.set(x, y + 0.45, z);
  camera.lookAt(0, 0.25, 0);

  backgroundSphere.rotation.y = azimuth * 0.22 + 0.35;
  backgroundSphere.rotation.x = Math.sin(azimuth * 0.15) * 0.03;

  const camAngle = wrapAngle(azimuth);
  for (const mesh of folderMeshes) {
    const ch = mesh.userData.chapter;
    const folderAngle = wrapAngle(THREE.MathUtils.degToRad(ch.angleDeg));
    const diff = smallestAngleDiff(camAngle, folderAngle);

    const visibility = 1.0 - smoothstep(0.58, 1.15, diff);
    mesh.material.uniforms.uOpacity.value = THREE.MathUtils.clamp(visibility, 0, 1);
    mesh.material.uniforms.uWobble.value = time * 2.0 + timeline.velocity * 80.0;
    mesh.position.y = 0.18 + Math.sin(time * 1.2 + folderAngle) * 0.03;
  }

  center.rotation.y = Math.sin(time * 0.25) * 0.05;

  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}

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