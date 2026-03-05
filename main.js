import * as THREE from "https://esm.sh/three@0.160.0";
import { GLTFLoader } from "https://esm.sh/three@0.160.0/examples/jsm/loaders/GLTFLoader.js";

const BASE_URL = new URL("./", import.meta.url);
const u = (p) => new URL(p, BASE_URL).href;

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

function clamp01(x){ return Math.max(0, Math.min(1, x)); }
function smoothstep(e0, e1, x){
  const t = clamp01((x - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
}
function hardFail(msg, err){
  console.error(msg, err || "");
  if (hintEl) hintEl.textContent = `❌ ${msg}`;
}
function damp(current, target, lambda, dt){
  return THREE.MathUtils.lerp(current, target, 1 - Math.exp(-lambda * dt));
}
// ✅ prevent sudden quaternion sign flips (causes 180° flips)
function keepQuatContinuous(q, prev){
  if (q.dot(prev) < 0) { q.x *= -1; q.y *= -1; q.z *= -1; q.w *= -1; }
  prev.copy(q);
}

if (!canvas) hardFail("Canvas #webgl not found.");
if (!hintEl) hardFail("HUD #hint not found.");
if (!chaptersEl) hardFail("HUD #chapters not found.");

console.log("✅ Helix + Covers main.js loaded. THREE revision:", THREE.REVISION);
hintEl.textContent = "Scene starting…";

// Palette
const PAL = {
  sky:   new THREE.Color("#91C6FF"),
  deep:  new THREE.Color("#464C52"),
  text:  new THREE.Color("#E8EEF2"),
};

// Assets
const ASSETS = {
  model: u("assets/models/me_on_hill.glb"),
  sky:   u("assets/backgrounds/sky_sphere.jpg"),
  fog:   u("assets/textures/fog.jpg"),
  audio: u("assets/audio/ambient.mp3"),
};

// Tiles (+ covers + links)
const CHAPTERS = [
  { id:"about",        label:"About",              page:u("pages/about.html"),              cover:u("assets/covers/about.jpg") },
  { id:"gallery",      label:"Gallery",            page:u("pages/gallery.html"),            cover:u("assets/covers/gallery.jpg") },
  { id:"achievements", label:"Achievements",       page:u("pages/achievements.html"),       cover:u("assets/covers/achievements.jpg") },
  { id:"contact",      label:"Contact",            page:u("pages/contact.html"),            cover:u("assets/covers/contact.jpg") },

  { id:"fab",          label:"Fab Profile",        href:"https://www.fab.com/sellers/Oblix%20Studio",               cover:u("assets/covers/fab.jpg") },
  { id:"steam",        label:"22 Minutes (Steam)", href:"https://store.steampowered.com/app/2765180/22_Minutes/",   cover:u("assets/covers/steam_22minutes.jpg") },
  { id:"sketchfab",    label:"Sketchfab Models",   href:"https://sketchfab.com/OblixStudio/models",                cover:u("assets/covers/sketchfab.jpg") },
];

// Even progress spacing
(function assignProgress(){
  const n = CHAPTERS.length;
  for (let i=0;i<n;i++){
    CHAPTERS[i].progress = (i + 1) / (n + 1);
  }
})();

// Tuning
const T = {
  // scroll control
  scrollSensitivity: 0.000006,
  dragSensitivity: 0.010,
  maxVel: 0.0030,
  dampingActive: 9.0,
  dampingIdle: 34.0,
  idleDelayMs: 120,
  stopEps: 0.00002,

  // model framing
  modelTargetSize: 9.8,
  modelLift: -0.25,
  modelYawDeg: 10,

  // camera fixed (focus helix)
  camAzimuth: Math.PI * 0.5,  // looking from +Z
  camRadius: 16.4,
  camYBase: 5.6,
  camYBob: 0.18,
  lookY: 1.95,

  // ✅ HELIX
  helixRadius: 6.8,
  helixThetaOffset: Math.PI * 0.5,
  helixAngleStep: 1.35,
  helixPitch: 3.10,
  helixYOffset: 4.6,
  helixFrontPull: 0.75,
  helixRadiusGrow: 0.35,

  visibleRange: 2.15,
  fadeSoftness: 1.10,

  // tiles
  tileW: 4.05,
  tileH: 2.45,
  tileCurve: 0.080,
  titleOffset: { x: -1.75, y: 0.05, z: 0.62 },

  // hover animation
  hoverDamp: 10.0,
  flagAmp: 0.22,
  flagSpeed: 6.5,
  revealWidth: 0.09,
};

// Loading manager
const manager = new THREE.LoadingManager();
manager.onProgress = (_url, loaded, total) => {
  const pct = total ? Math.round((loaded / total) * 100) : 0;
  if (loaderFill) loaderFill.style.width = `${pct}%`;
  if (loaderPct) loaderPct.textContent = `${pct}%`;
};
manager.onLoad = () => {
  setTimeout(() => loaderEl?.classList.add("is-hidden"), 250);
  hintEl.textContent = "Scroll / drag • Hover tiles • Click to open";
};

// Renderer / scene / camera
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.07;

const scene = new THREE.Scene();
scene.background = PAL.deep.clone();
scene.fog = new THREE.Fog(PAL.deep.getHex(), 18, 110);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 900);
camera.position.set(0, 6.0, T.camRadius);

const clock = new THREE.Clock();

// Lights
scene.add(new THREE.HemisphereLight(PAL.sky.getHex(), PAL.deep.getHex(), 1.05));
const key = new THREE.DirectionalLight(0xffffff, 0.95);
key.position.set(4.2, 5.8, 3.2);
scene.add(key);
const rim = new THREE.DirectionalLight(PAL.sky.getHex(), 0.55);
rim.position.set(-6.0, 2.6, -3.8);
scene.add(rim);

// Center group (model)
const center = new THREE.Group();
scene.add(center);

// Background sphere
function makeSkyTexture(){
  const w = 1024, h = 512;
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const ctx = c.getContext("2d");

  const g = ctx.createLinearGradient(0,0,0,h);
  g.addColorStop(0, "#91C6FF");
  g.addColorStop(0.38, "#6786A7");
  g.addColorStop(1, "#464C52");
  ctx.fillStyle = g;
  ctx.fillRect(0,0,w,h);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

const bg = new THREE.Mesh(
  new THREE.SphereGeometry(160, 48, 48),
  new THREE.MeshBasicMaterial({ map: makeSkyTexture(), side: THREE.BackSide })
);
bg.material.fog = false;
bg.rotation.y = 0.35;
scene.add(bg);

new THREE.TextureLoader(manager).load(
  ASSETS.sky,
  (tex) => {
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    bg.material.map = tex;
    bg.material.needsUpdate = true;
  },
  undefined,
  () => {}
);

// -------- Audio (kept from your setup) --------
const audioState = {
  ctx:null, src:null, gain:null, filter:null,
  started:false,
  baseVolume: clamp01(parseFloat(localStorage.getItem("orbit_volume") ?? "0.52")),
  isMuffled:false
};

async function ensureAudio(){
  if (audioState.started) return;
  audioState.started = true;

  try{
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioCtx();

    const res = await fetch(ASSETS.audio, { cache:"no-store" });
    if (!res.ok) throw new Error(`Audio fetch failed: ${res.status}`);
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
    gain.gain.value = audioState.baseVolume;

    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    src.start(0);

    audioState.ctx = ctx;
    audioState.src = src;
    audioState.filter = filter;
    audioState.gain = gain;
  }catch(e){
    console.warn("Audio failed:", e);
  }
}
function applyAudioTargets(){
  if (!audioState.ctx || !audioState.filter || !audioState.gain) return;
  const now = audioState.ctx.currentTime;
  const muffled = audioState.isMuffled;

  const targetFreq = muffled ? 720 : 18000;
  const targetGain = audioState.baseVolume * (muffled ? 0.55 : 1.0);

  audioState.filter.frequency.cancelScheduledValues(now);
  audioState.gain.gain.cancelScheduledValues(now);

  audioState.filter.frequency.setTargetAtTime(targetFreq, now, 0.08);
  audioState.gain.gain.setTargetAtTime(targetGain, now, 0.12);
}
function setMuffle(m){ audioState.isMuffled = m; applyAudioTargets(); }
function gestureKick(){ ensureAudio().then(applyAudioTargets).catch(()=>{}); }
window.addEventListener("pointerdown", gestureKick, { once:true });
window.addEventListener("wheel", gestureKick, { once:true, passive:true });
window.addEventListener("keydown", gestureKick, { once:true });

// -------- Cover fallback texture --------
function makeFallbackCoverTexture(){
  const w=1024, h=640;
  const c=document.createElement("canvas"); c.width=w; c.height=h;
  const ctx=c.getContext("2d");

  const g = ctx.createLinearGradient(0,0,w,h);
  g.addColorStop(0, "#91C6FF");
  g.addColorStop(0.45, "#6786A7");
  g.addColorStop(1, "#464C52");
  ctx.fillStyle=g;
  ctx.fillRect(0,0,w,h);

  const tex=new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy=8;
  return tex;
}
const FALLBACK_COVER_TEX = makeFallbackCoverTexture();

// Title texture
function makeTitleTexture(text){
  const w=1024, h=256;
  const c=document.createElement("canvas"); c.width=w; c.height=h;
  const ctx=c.getContext("2d");
  ctx.clearRect(0,0,w,h);

  ctx.font="850 92px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial";
  ctx.textAlign="left";
  ctx.textBaseline="middle";

  ctx.fillStyle="rgba(0,0,0,0.35)";
  ctx.fillText(text.toUpperCase(), 98, h/2+8);

  ctx.fillStyle="rgba(232,238,242,0.96)";
  ctx.fillText(text.toUpperCase(), 94, h/2+4);

  const tex=new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy=8;
  return tex;
}

// -------- Tiles --------
const tileGroup = new THREE.Group();
scene.add(tileGroup);

const clickableMeshes = [];
const tileItems = [];

const texLoader = new THREE.TextureLoader(manager);
const TILE_ASPECT = T.tileW / T.tileH;

function makeCoverMaterial(){
  const mat = new THREE.ShaderMaterial({
    transparent:true,
    depthWrite:false,
    side:THREE.DoubleSide,
    uniforms:{
      uTex:       { value: FALLBACK_COVER_TEX },
      uTexAspect: { value: 1.0 },
      uTileAspect:{ value: TILE_ASPECT },

      uOpacity:   { value: 0.0 },
      uCurve:     { value: T.tileCurve },

      uTime:      { value: 0.0 },
      uHover:     { value: 0.0 },

      uFlagAmp:   { value: T.flagAmp },
      uFlagSpeed: { value: T.flagSpeed },
      uRevealW:   { value: T.revealWidth }
    },
    vertexShader: `
      varying vec2 vUv;
      uniform float uCurve;
      uniform float uTime;
      uniform float uHover;
      uniform float uFlagAmp;
      uniform float uFlagSpeed;

      void main(){
        vUv = uv;
        vec3 p = position;

        float x = p.x;
        p.z -= (x*x) * uCurve;

        float amp = uHover * uFlagAmp;
        float w1 = sin((uv.y*8.0 + uv.x*2.5) + uTime*uFlagSpeed);
        float w2 = sin((uv.y*5.0 - uv.x*3.0) + uTime*(uFlagSpeed*0.8));
        p.z += (w1*0.10 + w2*0.08) * amp;
        p.y += (w1*0.04) * amp;

        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      uniform sampler2D uTex;
      uniform float uTexAspect;
      uniform float uTileAspect;

      uniform float uOpacity;
      uniform float uTime;
      uniform float uHover;
      uniform float uRevealW;

      vec2 coverUV(vec2 uv, float texA, float tileA){
        vec2 s = vec2(1.0, 1.0);
        if (texA > tileA){
          s.x = texA / tileA;
        }else{
          s.y = tileA / texA;
        }
        return (uv - 0.5) * s + 0.5;
      }

      void main(){
        vec2 uv = coverUV(vUv, uTexAspect, uTileAspect);
        vec4 t = texture2D(uTex, uv);

        float g = dot(t.rgb, vec3(0.299, 0.587, 0.114));
        vec3 gray = vec3(g);

        float wave = sin(vUv.y * 7.0 + uTime * 7.0) * 0.03 * uHover;
        float edge = -0.20 + uHover * 1.20 + wave;
        float m = 1.0 - smoothstep(edge - uRevealW, edge + uRevealW, vUv.x);

        float edgeGlow = smoothstep(0.0, 1.0, uHover) * (1.0 - smoothstep(0.0, 0.12, abs(vUv.x - edge)));
        vec3 col = mix(gray, t.rgb, m);
        col += edgeGlow * 0.06;

        gl_FragColor = vec4(col, uOpacity);
      }
    `
  });
  return mat;
}

(function createTiles(){
  for (let i=0;i<CHAPTERS.length;i++){
    const ch = CHAPTERS[i];

    const coverGeo = new THREE.PlaneGeometry(T.tileW, T.tileH, 30, 1);
    const coverMat = makeCoverMaterial();

    texLoader.load(
      ch.cover,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 8;
        coverMat.uniforms.uTex.value = tex;
        const img = tex.image;
        if (img && img.width && img.height){
          coverMat.uniforms.uTexAspect.value = img.width / img.height;
        }
      },
      undefined,
      () => console.warn("Cover missing/failed:", ch.cover, "(using fallback)")
    );

    const cover = new THREE.Mesh(coverGeo, coverMat);
    cover.userData.chapter = ch;

    const titleTex = makeTitleTexture(ch.label);
    const title = new THREE.Mesh(
      new THREE.PlaneGeometry(3.35, 0.78),
      new THREE.MeshBasicMaterial({ map:titleTex, transparent:true, depthWrite:false, opacity:0.0, side:THREE.DoubleSide })
    );
    title.position.set(T.titleOffset.x, T.titleOffset.y, T.titleOffset.z);

    const g = new THREE.Group();
    g.add(cover);
    g.add(title);

    tileGroup.add(g);
    clickableMeshes.push(cover);

    const item = {
      group:g, cover, title, chapter:ch, index:i,
      hover:0,
      hoverTarget:0,
      qPrev: new THREE.Quaternion()
    };
    cover.userData.item = item;
    tileItems.push(item);
  }
})();

// -------- Model load --------
const gltfLoader = new GLTFLoader(manager);

function addFallbackModel(){
  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.75, 1.5, 10, 18),
    new THREE.MeshStandardMaterial({ color:PAL.text.getHex(), roughness:0.88, metalness:0.02 })
  );
  body.position.y = 0.0;
  center.add(body);
}

gltfLoader.load(
  ASSETS.model,
  (gltf) => {
    const model = gltf.scene;

    const box = new THREE.Box3().setFromObject(model);
    const size = new THREE.Vector3();
    box.getSize(size);

    const maxAxis = Math.max(size.x, size.y, size.z);
    const scale = T.modelTargetSize / Math.max(0.0001, maxAxis);
    model.scale.setScalar(scale);

    const box2 = new THREE.Box3().setFromObject(model);
    const centerPoint = new THREE.Vector3();
    box2.getCenter(centerPoint);

    model.position.sub(centerPoint);
    model.position.y += T.modelLift;
    model.rotation.y = THREE.MathUtils.degToRad(T.modelYawDeg);

    center.add(model);
  },
  undefined,
  () => addFallbackModel()
);

// -------- Panel logic --------
panelClose?.addEventListener("click", closePanel);
window.addEventListener("keydown", (e) => { if (e.key === "Escape") closePanel(); });

async function openPanel(ch){
  if (!panel || !panelTitle || !panelBody) return;
  setMuffle(true);
  panelTitle.textContent = ch.label;
  panel.classList.add("is-open");
  panel.setAttribute("aria-hidden","false");

  try{
    const res = await fetch(ch.page, { cache:"no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    panelBody.innerHTML = await res.text();
  }catch{
    panelBody.innerHTML = `<p>Couldn’t load <code>${ch.page}</code>.</p>`;
  }
}
function closePanel(){
  if (!panel || !panelTitle || !panelBody) return;
  panel.classList.remove("is-open");
  panel.setAttribute("aria-hidden","true");
  panelTitle.textContent = "";
  panelBody.innerHTML = "";
  setMuffle(false);
}

// -------- Hover + Click picking --------
const raycaster = new THREE.Raycaster();
const pointerNdc = new THREE.Vector2();
let hoveredItem = null;

function setHovered(next){
  if (hoveredItem === next) return;
  if (hoveredItem) hoveredItem.hoverTarget = 0;
  hoveredItem = next;
  if (hoveredItem) hoveredItem.hoverTarget = 1;
  canvas.style.cursor = hoveredItem ? "pointer" : "default";
}

function updatePointerNDC(e){
  const rect = canvas.getBoundingClientRect();
  pointerNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  pointerNdc.y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
}

canvas.addEventListener("pointermove", (e)=>{
  if (panel?.classList.contains("is-open")){
    setHovered(null);
    return;
  }
  updatePointerNDC(e);
  raycaster.setFromCamera(pointerNdc, camera);
  const hits = raycaster.intersectObjects(clickableMeshes, false);
  if (!hits.length){ setHovered(null); return; }
  const item = hits[0].object.userData.item || null;
  setHovered(item);
});
canvas.addEventListener("pointerleave", ()=> setHovered(null));

canvas.addEventListener("click", async (e)=>{
  if (panel?.classList.contains("is-open")) return;

  await ensureAudio().catch(()=>{});
  applyAudioTargets();

  updatePointerNDC(e);
  raycaster.setFromCamera(pointerNdc, camera);
  const hits = raycaster.intersectObjects(clickableMeshes, false);
  if (!hits.length) return;

  const ch = hits[0].object.userData.chapter;

  timeline.value = clamp01(ch.progress);
  timeline.vel = 0;
  timeline.lastInteractT = performance.now();

  if (ch.href){
    window.open(ch.href, "_blank", "noopener,noreferrer");
    return;
  }
  openPanel(ch).catch(()=>{});
});

// -------- Chapters UI --------
let activeChapterId = null;
function buildChapterUI(){
  chaptersEl.innerHTML="";
  CHAPTERS.forEach((ch)=>{
    const dot=document.createElement("button");
    dot.type="button";
    dot.className="chapterDot";
    dot.title=ch.label;
    dot.addEventListener("click", ()=>{
      timeline.value = clamp01(ch.progress);
      timeline.vel = 0;
      timeline.lastInteractT = performance.now();
      if (ch.href) window.open(ch.href, "_blank", "noopener,noreferrer");
      else openPanel(ch).catch(()=>{});
    });
    chaptersEl.appendChild(dot);
  });
  const label=document.createElement("div");
  label.className="chapterLabel";
  label.textContent="Chapters";
  chaptersEl.appendChild(label);
}
function setActiveDot(id){
  const dots = Array.from(chaptersEl.querySelectorAll(".chapterDot"));
  dots.forEach((d,i)=> d.classList.toggle("is-active", CHAPTERS[i]?.id===id));
}
buildChapterUI();

// -------- Timeline input --------
const timeline = { value:0.02, vel:0, lastInteractT:performance.now() };

function normalizeWheel(e){
  let dy = e.deltaY;
  if (e.deltaMode===1) dy*=16;
  else if (e.deltaMode===2) dy*=window.innerHeight;
  return dy;
}

window.addEventListener("wheel",(e)=>{
  e.preventDefault();
  timeline.lastInteractT = performance.now();
  timeline.vel += normalizeWheel(e) * T.scrollSensitivity;
  timeline.vel = THREE.MathUtils.clamp(timeline.vel, -T.maxVel, T.maxVel);
},{ passive:false });

let dragging=false, dragStartX=0, dragStartVel=0;
canvas.addEventListener("pointerdown",(e)=>{
  dragging=true;
  timeline.lastInteractT=performance.now();
  dragStartX=e.clientX;
  dragStartVel=timeline.vel;
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener("pointermove",(e)=>{
  if(!dragging) return;
  timeline.lastInteractT=performance.now();
  const dx=(e.clientX-dragStartX)/Math.max(1,window.innerWidth);
  timeline.vel = dragStartVel - dx * T.dragSensitivity;
  timeline.vel = THREE.MathUtils.clamp(timeline.vel, -T.maxVel, T.maxVel);
});
canvas.addEventListener("pointerup",(e)=>{
  dragging=false;
  try{ canvas.releasePointerCapture(e.pointerId); }catch{}
});

function nearestChapter(v){
  let best=CHAPTERS[0], bestD=Infinity;
  for(const ch of CHAPTERS){
    const d=Math.abs(ch.progress-v);
    if(d<bestD){ bestD=d; best=ch; }
  }
  return best;
}
function progressToIndex(v){
  const min=Math.min(...CHAPTERS.map(c=>c.progress));
  const max=Math.max(...CHAPTERS.map(c=>c.progress));
  const t=clamp01((v-min)/Math.max(1e-6,(max-min)));
  return t*(CHAPTERS.length-1);
}

// Resize
window.addEventListener("resize", ()=>{
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});

// Temps
const UP = new THREE.Vector3(0,1,0);
const radial = new THREE.Vector3();
const tangent = new THREE.Vector3();
const xAxis = new THREE.Vector3();
const yAxis = new THREE.Vector3();
const zAxis = new THREE.Vector3();
const basis = new THREE.Matrix4();
const qTmp = new THREE.Quaternion();

requestAnimationFrame(tick);
function tick(){
  const dt = Math.min(0.033, clock.getDelta());
  const time = clock.getElapsedTime();

  // Smooth decel
  const idleMs = performance.now() - timeline.lastInteractT;
  const damping = (idleMs <= T.idleDelayMs || dragging) ? T.dampingActive : T.dampingIdle;
  timeline.vel *= Math.exp(-damping * dt);
  if (!dragging && Math.abs(timeline.vel) < T.stopEps) timeline.vel = 0;
  timeline.value = clamp01(timeline.value + timeline.vel);

  // Camera fixed
  const camY = T.camYBase + Math.sin(time*0.35)*T.camYBob;
  camera.position.set(Math.cos(T.camAzimuth)*T.camRadius, camY, Math.sin(T.camAzimuth)*T.camRadius);
  camera.lookAt(0, T.lookY, 0);

  bg.rotation.y = 0.35 + time*0.01;

  // HUD hint
  const near = nearestChapter(timeline.value);
  if (activeChapterId !== near.id){
    activeChapterId = near.id;
    setActiveDot(activeChapterId);
  }
  if (!panel?.classList.contains("is-open")){
    hintEl.textContent = near.href ? `${near.label} • Click to open link` : `${near.label} • Click to open`;
  }

  // ✅ HELIX placement + orientation (fixed upright!)
  const centerIdx = progressToIndex(timeline.value);

  // dy/dtheta for helix tangent
  const dy_dtheta = -(T.helixPitch / Math.max(1e-6, T.helixAngleStep));

  for(const item of tileItems){
    const { group, cover, title, index, qPrev } = item;
    const rel = index - centerIdx;

    const theta = T.helixThetaOffset + rel * T.helixAngleStep;

    const frontBoost = (1.0 - Math.min(1.0, Math.abs(rel))) * T.helixFrontPull;
    const r = T.helixRadius + Math.abs(rel)*T.helixRadiusGrow + frontBoost;

    const yPos = T.helixYOffset - rel*T.helixPitch + Math.sin(time*0.9 + index*0.6)*0.06;
    group.position.set(Math.cos(theta)*r, yPos, Math.sin(theta)*r);

    // fade
    const dAbs = Math.abs(rel);
    const vis = 1.0 - smoothstep(
      T.visibleRange - T.fadeSoftness,
      T.visibleRange + T.fadeSoftness,
      dAbs
    );
    const vis01 = clamp01(vis);

    // hover easing
    item.hover = damp(item.hover, item.hoverTarget, T.hoverDamp, dt);

    // shader uniforms
    const mat = cover.material;
    mat.uniforms.uOpacity.value = vis01;
    mat.uniforms.uTime.value = time;
    mat.uniforms.uHover.value = item.hover;

    // ----- ORIENTATION (ribbon on helix) -----
    // zAxis = radial outward
    radial.set(Math.cos(theta), 0, Math.sin(theta)).normalize();
    zAxis.copy(radial);

    // xAxis = helix tangent (diagonal along the corkscrew)
    tangent.set(
      -Math.sin(theta) * r,
      dy_dtheta,
      Math.cos(theta) * r
    ).normalize();
    xAxis.copy(tangent);

    // yAxis = completes basis
    yAxis.crossVectors(zAxis, xAxis).normalize();

    // ✅ FIX: keep tiles from flipping upside-down
    // If yAxis points downward, flip x/y to maintain upright orientation
    if (yAxis.dot(UP) < 0){
      xAxis.multiplyScalar(-1);
      yAxis.multiplyScalar(-1);
    }

    // re-orthonormalize (important)
    xAxis.crossVectors(yAxis, zAxis).normalize();

    basis.makeBasis(xAxis, yAxis, zAxis);
    qTmp.setFromRotationMatrix(basis);

    // ✅ keep quaternion continuous over time
    keepQuatContinuous(qTmp, qPrev);

    group.quaternion.copy(qTmp);

    // title reacts to hover
    title.material.opacity = clamp01(vis01 * (0.22 + 0.78 * item.hover));
  }

  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}
