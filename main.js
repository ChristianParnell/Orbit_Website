import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/GLTFLoader.js";

console.log("✅ main.js loaded", location.href);

const ASSETS = {
  modelMeOnHill: "./assets/models/me_on_hill.glb",
  backgroundSphereTex: "./assets/backgrounds/sky_sphere.jpg"
};

const FOLDERS = [
  { id: "about",        label: "ABOUT",        page: "./pages/about.html",        angleDeg: 20 },
  { id: "gallery",      label: "GALLERY",      page: "./pages/gallery.html",      angleDeg: 95 },
  { id: "achievements", label: "ACHIEVEMENTS", page: "./pages/achievements.html", angleDeg: 170 },
  { id: "contact",      label: "CONTACT",      page: "./pages/contact.html",      angleDeg: 245 }
];

// DOM
const canvas = document.getElementById("webgl");
const panel = document.getElementById("panel");
const panelTitle = document.getElementById("panelTitle");
const panelBody = document.getElementById("panelBody");
const panelClose = document.getElementById("panelClose");

// Renderer / Scene / Camera
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x070A0C, 7, 22);
scene.background = new THREE.Color(0x070A0C);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.set(0, 1.55, 5.8);

const clock = new THREE.Clock();

// Lights
scene.add(new THREE.HemisphereLight(0x9fd3ff, 0x0b0f12, 0.95));

const key = new THREE.DirectionalLight(0xffffff, 1.1);
key.position.set(3.5, 4.5, 2.5);
scene.add(key);

const rim = new THREE.DirectionalLight(0xb7c6ff, 0.55);
rim.position.set(-5, 2, -3);
scene.add(rim);

// Center group
const center = new THREE.Group();
scene.add(center);

// Ground placeholder
{
  const groundGeo = new THREE.CircleGeometry(2.4, 64);
  const groundMat = new THREE.MeshStandardMaterial({
    color: 0x1b2a22,
    roughness: 1,
    metalness: 0
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.95;
  center.add(ground);
}

// Always-visible procedural “sky” texture (so you SEE something even if jpg missing)
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

  // stars
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  for (let i=0;i<900;i++){
    const x = Math.random()*w;
    const y = Math.random()*h;
    const r = Math.random()*1.2;
    ctx.globalAlpha = 0.25 + Math.random()*0.65;
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

// Background sphere (fog disabled so it doesn’t vanish)
let backgroundSphere = null;
{
  const geo = new THREE.SphereGeometry(60, 48, 48);
  const mat = new THREE.MeshBasicMaterial({
    map: makeSkyTexture(),
    color: 0xffffff,
    side: THREE.BackSide
  });
  mat.fog = false;

  backgroundSphere = new THREE.Mesh(geo, mat);
  backgroundSphere.rotation.y = 0.35;
  scene.add(backgroundSphere);

  // Try load your real jpg on top of the placeholder
  const texLoader = new THREE.TextureLoader();
  texLoader.load(
    ASSETS.backgroundSphereTex,
    (tex) => {
      console.log("✅ Background texture loaded:", ASSETS.backgroundSphereTex);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      backgroundSphere.material.map = tex;
      backgroundSphere.material.needsUpdate = true;
    },
    undefined,
    (err) => console.warn("❌ Background jpg not found (placeholder used):", ASSETS.backgroundSphereTex, err)
  );
}

// Load GLB model
const gltfLoader = new GLTFLoader();
loadCenterModel();

function loadCenterModel(){
  gltfLoader.load(
    ASSETS.modelMeOnHill,
    (gltf) => {
      console.log("✅ Model loaded:", ASSETS.modelMeOnHill);
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
    (e) => {
      console.warn("❌ Model not found (fallback used):", ASSETS.modelMeOnHill, e);

      // fallback “person”
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

// Folder ring
const folderGroup = new THREE.Group();
scene.add(folderGroup);

const folderMeshes = [];
createFolderRing();

function createFolderRing(){
  const radius = 3.2;
  const y = 0.15;

  for (const f of FOLDERS) {
    const texture = makeFolderTexture(f.label);
    texture.colorSpace = THREE.SRGBColorSpace;

    const geo = new THREE.PlaneGeometry(1.35, 0.86, 28, 1);

    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        uMap: { value: texture },
        uOpacity: { value: 0.0 },
        uCurve: { value: 0.28 },
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
    mesh.userData.folder = f;

    const ang = THREE.MathUtils.degToRad(f.angleDeg);
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

  ctx.fillStyle = "rgba(232,238,242,0.92)";
  roundRect(ctx, x, y-56, fw*0.46, 78, 28);
  ctx.fill();

  ctx.fillStyle = "rgba(232,238,242,0.88)";
  roundRect(ctx, x, y, fw, fh, 36);
  ctx.fill();

  ctx.strokeStyle = "rgba(7,10,12,0.22)";
  ctx.lineWidth = 10;
  roundRect(ctx, x+18, y+18, fw-36, fh-36, 28);
  ctx.stroke();

  ctx.fillStyle = "rgba(7,10,12,0.80)";
  ctx.font = "700 64px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, w/2, y + fh/2 + 10);

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

// Orbit controls via scroll + drag
let targetProgress = 0;
let progress = 0;
let targetAzimuth = 0;
let azimuth = 0;
let targetPitch = 0;
let pitch = 0;

let lastScrollY = window.scrollY;
let scrollVelocity = 0;

const ORBIT_TURNS = 1.55;
const ORBIT_RADIUS = 5.8;

let isDragging = false;
let dragStartX = 0;
let dragStartAz = 0;
let dragOffset = 0;

canvas.addEventListener("pointerdown", (e) => {
  isDragging = true;
  dragStartX = e.clientX;
  dragStartAz = dragOffset;
  canvas.setPointerCapture(e.pointerId);
});

canvas.addEventListener("pointermove", (e) => {
  if (!isDragging) return;
  const dx = (e.clientX - dragStartX) / window.innerWidth;
  dragOffset = dragStartAz - dx * Math.PI * 2.0 * 0.45;
});

canvas.addEventListener("pointerup", (e) => {
  isDragging = false;
  try { canvas.releasePointerCapture(e.pointerId); } catch {}
});

// Clicking folders
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

  const f = hits[0].object.userData.folder;
  if (f) openPanel(f);
});

// Panel open/close
panelClose.addEventListener("click", closePanel);
window.addEventListener("keydown", (e) => { if (e.key === "Escape") closePanel(); });

window.addEventListener("hashchange", () => {
  const id = (location.hash || "").replace("#", "");
  if (!id) { closePanel(); return; }
  const f = FOLDERS.find(x => x.id === id);
  if (f) openPanel(f);
});

function closePanel(){
  panel.classList.remove("is-open");
  panel.setAttribute("aria-hidden", "true");
  panelTitle.textContent = "";
  panelBody.innerHTML = "";
  if (location.hash) history.replaceState(null, "", location.pathname + location.search);
}

async function openPanel(folder){
  panelTitle.textContent = folder.label;
  panel.classList.add("is-open");
  panel.setAttribute("aria-hidden", "false");

  if (location.hash !== `#${folder.id}`) history.replaceState(null, "", `#${folder.id}`);

  try{
    const res = await fetch(folder.page, { cache: "no-store" });
    const html = await res.text();
    panelBody.innerHTML = html;
  }catch(err){
    panelBody.innerHTML = `<p>Couldn’t load <code>${folder.page}</code>. Make sure the file exists.</p>`;
    console.warn("❌ Panel fetch failed:", folder.page, err);
  }
}

// open hash on load
{
  const id = (location.hash || "").replace("#", "");
  if (id) {
    const f = FOLDERS.find(x => x.id === id);
    if (f) openPanel(f);
  }
}

// Resize
window.addEventListener("resize", () => {
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});

// Animate
requestAnimationFrame(tick);
function tick(){
  const t = clock.getElapsedTime();

  const maxScroll = Math.max(1, document.body.scrollHeight - window.innerHeight);
  targetProgress = THREE.MathUtils.clamp(window.scrollY / maxScroll, 0, 1);

  const sy = window.scrollY;
  scrollVelocity = THREE.MathUtils.lerp(scrollVelocity, (sy - lastScrollY) / (window.innerHeight || 1), 0.18);
  lastScrollY = sy;

  progress = THREE.MathUtils.lerp(progress, targetProgress, 0.08);
  targetAzimuth = progress * ORBIT_TURNS * Math.PI * 2.0 + dragOffset;

  const pitchStart = THREE.MathUtils.degToRad(66);
  const pitchEnd   = THREE.MathUtils.degToRad(78);
  targetPitch = THREE.MathUtils.lerp(pitchStart, pitchEnd, smoothstep(0.08, 0.92, progress));

  azimuth = THREE.MathUtils.lerp(azimuth, targetAzimuth, 0.09);
  pitch = THREE.MathUtils.lerp(pitch, targetPitch, 0.09);

  const y = Math.cos(pitch) * ORBIT_RADIUS;
  const r = Math.sin(pitch) * ORBIT_RADIUS;
  const x = Math.cos(azimuth) * r;
  const z = Math.sin(azimuth) * r;

  camera.position.set(x, y + 0.4, z);
  camera.lookAt(0, 0.25, 0);

  if (backgroundSphere) {
    backgroundSphere.rotation.y = azimuth * 0.25 + 0.35;
    backgroundSphere.rotation.x = Math.sin(azimuth * 0.15) * 0.03;
  }

  const camAngle = wrapAngle(azimuth);

  for (const mesh of folderMeshes) {
    const f = mesh.userData.folder;
    const folderAngle = wrapAngle(THREE.MathUtils.degToRad(f.angleDeg));
    const diff = smallestAngleDiff(camAngle, folderAngle);

    const visibility = 1.0 - smoothstep(0.55, 1.15, diff);
    mesh.material.uniforms.uOpacity.value = THREE.MathUtils.clamp(visibility, 0, 1);
    mesh.material.uniforms.uWobble.value = t * 2.0 + scrollVelocity * 6.0;
    mesh.position.y = 0.15 + Math.sin(t * 1.2 + folderAngle) * 0.03;
  }

  center.rotation.y = Math.sin(t * 0.25) * 0.05;

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