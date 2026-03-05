import * as THREE from "https://esm.sh/three@0.160.0";
import { GLTFLoader } from "https://esm.sh/three@0.160.0/examples/jsm/loaders/GLTFLoader.js";

/* -------------------- URL helper -------------------- */
const BASE_URL = new URL("./", import.meta.url);
const u = (p) => new URL(p, BASE_URL).href;

/* -------------------- DOM -------------------- */
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

/* -------------------- utils -------------------- */
function clamp01(x){ return Math.max(0, Math.min(1, x)); }
function smoothstep(e0, e1, x){
  const t = clamp01((x - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
}
function damp(current, target, lambda, dt){
  return THREE.MathUtils.lerp(current, target, 1 - Math.exp(-lambda * dt));
}
function hardFail(msg, err){
  console.error(msg, err || "");
  if (hintEl) hintEl.textContent = `❌ ${msg}`;
}
// prevent sudden 180° quaternion sign flips
function keepQuatContinuous(q, prev){
  if (q.dot(prev) < 0) { q.x *= -1; q.y *= -1; q.z *= -1; q.w *= -1; }
  prev.copy(q);
}

if (!canvas) hardFail("Canvas #webgl not found.");
if (!hintEl) hardFail("HUD #hint not found.");
if (!chaptersEl) hardFail("HUD #chapters not found.");

console.log("✅ Helix + Covers main.js loaded. THREE revision:", THREE.REVISION);
hintEl.textContent = "Scene starting…";

/* -------------------- palette -------------------- */
const PAL = {
  sky:  new THREE.Color("#91C6FF"),
  deep: new THREE.Color("#464C52"),
  text: new THREE.Color("#E8EEF2"),
};

/* -------------------- assets -------------------- */
const ASSETS = {
  model: u("assets/models/me_on_hill.glb"),          // if missing: fallback model will show
  sky:   u("assets/backgrounds/sky_sphere.jpg"),     // optional
  fog:   u("assets/textures/fog.jpg"),               // optional
  audio: u("assets/audio/ambient.mp3"),              // optional
};

/* -------------------- tiles data (covers + links) -------------------- */
const CHAPTERS = [
  { id:"about",        label:"About",              page:u("pages/about.html"),              cover:u("assets/covers/about.jpg") },
  { id:"gallery",      label:"Gallery",            page:u("pages/gallery.html"),            cover:u("assets/covers/gallery.jpg") },
  { id:"achievements", label:"Achievements",       page:u("pages/achievements.html"),       cover:u("assets/covers/achievements.jpg") },
  { id:"contact",      label:"Contact",            page:u("pages/contact.html"),            cover:u("assets/covers/contact.jpg") },

  { id:"fab",       label:"Fab Profile",        href:"https://www.fab.com/sellers/Oblix%20Studio",               cover:u("assets/covers/fab.jpg") },
  { id:"steam",     label:"22 Minutes (Steam)", href:"https://store.steampowered.com/app/2765180/22_Minutes/",   cover:u("assets/covers/steam_22minutes.jpg") },
  { id:"sketchfab", label:"Sketchfab Models",   href:"https://sketchfab.com/OblixStudio/models",                cover:u("assets/covers/sketchfab.jpg") },
];

// evenly space “progress” across all tiles
(function assignProgress(){
  const n = CHAPTERS.length;
  for (let i=0;i<n;i++){
    CHAPTERS[i].progress = (i + 1) / (n + 1);
  }
})();

/* -------------------- tuning -------------------- */
const T = {
  // input feel
  scrollSensitivity: 0.000006,
  dragSensitivity: 0.010,
  maxVel: 0.0030,
  dampingActive: 9.0,
  dampingIdle: 34.0,
  idleDelayMs: 120,
  stopEps: 0.00002,

  // camera / framing
  camAzimuth: Math.PI * 0.5, // camera on +Z looking to origin
  camRadius: 16.2,
  camYBase: 5.5,
  camYBob: 0.18,
  lookY: 1.95,

  // model
  modelTargetSize: 9.6,
  modelLift: -0.25,
  modelYawDeg: 10,

  // ✅ helix ribbon
  helixRadius: 6.4,
  helixThetaOffset: Math.PI * 0.5,
  helixAngleStep: 1.22,     // tighter wrap = bigger spin per tile
  helixPitch: 3.10,         // vertical rise per tile
  helixYOffset: 4.4,
  helixFrontPull: 0.65,
  helixRadiusGrow: 0.28,

  // fade
  visibleRange: 2.25,
  fadeSoftness: 1.10,

  // tiles
  tileW: 4.05,
  tileH: 2.45,
  tileCurve: 0.080,
  titleOffset: { x: -1.75, y: 0.05, z: 0.62 },

  // hover anim
  hoverDamp: 10.0,
  flagAmp: 0.22,
  flagSpeed: 6.5,
  revealWidth: 0.09,
};

/* -------------------- loading manager -------------------- */
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

/* -------------------- renderer / scene / camera -------------------- */
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

const clock = new THREE.Clock();

/* -------------------- lights -------------------- */
scene.add(new THREE.HemisphereLight(PAL.sky.getHex(), PAL.deep.getHex(), 1.05));
const key = new THREE.DirectionalLight(0xffffff, 0.95);
key.position.set(4.2, 5.8, 3.2);
scene.add(key);
const rim = new THREE.DirectionalLight(PAL.sky.getHex(), 0.55);
rim.position.set(-6.0, 2.6, -3.8);
scene.add(rim);

/* -------------------- background sphere -------------------- */
function makeSkyFallback(){
  const w = 1024, h = 512;
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const ctx = c.getContext("2d");
  const g = ctx.createLinearGradient(0,0,0,h);
  g.addColorStop(0, "#91C6FF");
  g.addColorStop(0.48, "#6786A7");
  g.addColorStop(1, "#464C52");
  ctx.fillStyle = g;
  ctx.fillRect(0,0,w,h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
const bg = new THREE.Mesh(
  new THREE.SphereGeometry(160, 48, 48),
  new THREE.MeshBasicMaterial({ map: makeSkyFallback(), side: THREE.BackSide })
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

/* -------------------- fog puffs (optional) -------------------- */
function makeFogTextureFallback(){
  const w=512, h=512;
  const c=document.createElement("canvas"); c.width=w; c.height=h;
  const ctx=c.getContext("2d");
  ctx.fillStyle="black";
  ctx.fillRect(0,0,w,h);
  for(let i=0;i<95;i++){
    const x=Math.random()*w, y=Math.random()*h;
    const r=50+Math.random()*150;
    const grd=ctx.createRadialGradient(x,y,0,x,y,r);
    grd.addColorStop(0, "rgba(255,255,255,0.95)");
    grd.addColorStop(1, "rgba(0,0,0,0.0)");
    ctx.globalAlpha = 0.17 + Math.random()*0.25;
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(x,y,r,0,Math.PI*2);
    ctx.fill();
  }
  ctx.globalAlpha=1;
  const tex=new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  return tex;
}
let fogTex = makeFogTextureFallback();

new THREE.TextureLoader(manager).load(
  ASSETS.fog,
  (t) => {
    t.colorSpace = THREE.SRGBColorSpace;
    t.minFilter = THREE.LinearFilter;
    t.magFilter = THREE.LinearFilter;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    fogTex = t;
  },
  undefined,
  () => {}
);

const fogGroup = new THREE.Group();
scene.add(fogGroup);

function makeFogMaterial(){
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.NormalBlending,
    uniforms: {
      uMap:      { value: fogTex },
      uOpacity:  { value: 0.55 },
      uBlackCut: { value: 0.02 },
      uSoft:     { value: 0.86 },
      uTint:     { value: PAL.sky.clone().lerp(PAL.text, 0.55) }
    },
    vertexShader: `
      varying vec2 vUv;
      void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
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
        float luma = dot(c, vec3(0.299,0.587,0.114));
        float a = smoothstep(uBlackCut, uBlackCut + uSoft, luma);
        float edge = smoothstep(0.02,0.22,vUv.x)*smoothstep(0.02,0.22,vUv.y)*
                     smoothstep(0.02,0.22,1.0-vUv.x)*smoothstep(0.02,0.22,1.0-vUv.y);
        a *= edge;
        if(a < 0.01) discard;
        gl_FragColor = vec4(uTint, a * uOpacity);
      }
    `
  });
}

const fogPuffs = [];
(function createFog(){
  const puffCount = 44;
  const puffGeo = new THREE.PlaneGeometry(6.3, 6.3);
  for (let i=0;i<puffCount;i++){
    const mat = makeFogMaterial();
    mat.uniforms.uOpacity.value = 0.20 + Math.random()*0.42;
    const m = new THREE.Mesh(puffGeo, mat);
    m.userData = {
      ang: Math.random()*Math.PI*2,
      radius: 3.2 + Math.random()*9.8,
      yBase: -0.8 + Math.random()*7.2,
      speed: 0.05 + Math.random()*0.12,
      bobAmp: 0.22 + Math.random()*0.65,
      spin: (Math.random()*2-1)*0.22,
      drift: 0.35 + Math.random()*0.95,
      scaleBase: 0.90 + Math.random()*2.4,
      seed: Math.random()*1000
    };
    m.scale.setScalar(m.userData.scaleBase);
    fogGroup.add(m);
    fogPuffs.push(m);
  }
})();

/* -------------------- audio (optional) -------------------- */
const audioState = { started:false };
async function ensureAudio(){
  if (audioState.started) return;
  audioState.started = true;
  try{
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioCtx();
    const res = await fetch(ASSETS.audio, { cache:"no-store" });
    if (!res.ok) throw new Error(res.status);
    const arr = await res.arrayBuffer();
    const buf = await ctx.decodeAudioData(arr);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const gain = ctx.createGain();
    gain.gain.value = 0.52;
    src.connect(gain);
    gain.connect(ctx.destination);
    src.start(0);
  }catch(e){
    console.warn("Audio missing/failed:", e);
  }
}
function gestureKick(){ ensureAudio().catch(()=>{}); }
window.addEventListener("pointerdown", gestureKick, { once:true });
window.addEventListener("wheel", gestureKick, { once:true, passive:true });
window.addEventListener("keydown", gestureKick, { once:true });

/* -------------------- cover fallback texture -------------------- */
function makeFallbackCoverTexture(){
  const w=1024, h=640;
  const c=document.createElement("canvas"); c.width=w; c.height=h;
  const ctx=c.getContext("2d");
  const g = ctx.createLinearGradient(0,0,w,h);
  g.addColorStop(0, "#91C6FF");
  g.addColorStop(0.50, "#6786A7");
  g.addColorStop(1, "#464C52");
  ctx.fillStyle=g;
  ctx.fillRect(0,0,w,h);
  const tex=new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}
const FALLBACK_COVER_TEX = makeFallbackCoverTexture();

/* -------------------- title texture -------------------- */
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

/* -------------------- tiles materials (BW -> flap -> color) -------------------- */
const TILE_ASPECT = T.tileW / T.tileH;

function makeCoverMaterial(){
  return new THREE.ShaderMaterial({
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

        // folder curve
        float x = p.x;
        p.z -= (x*x) * uCurve;

        // flag flap on hover
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
        vec2 s = vec2(1.0);
        if (texA > tileA) s.x = texA / tileA;
        else s.y = tileA / texA;
        return (uv - 0.5) * s + 0.5;
      }

      void main(){
        vec2 uv = coverUV(vUv, uTexAspect, uTileAspect);
        vec4 t = texture2D(uTex, uv);

        float g = dot(t.rgb, vec3(0.299, 0.587, 0.114));
        vec3 gray = vec3(g);

        // reveal sweep (flag edge) left -> right
        float wave = sin(vUv.y * 7.0 + uTime * 7.0) * 0.03 * uHover;
        float edge = -0.20 + uHover * 1.20 + wave;
        float m = 1.0 - smoothstep(edge - uRevealW, edge + uRevealW, vUv.x);

        vec3 col = mix(gray, t.rgb, m);
        gl_FragColor = vec4(col, uOpacity);
      }
    `
  });
}

/* -------------------- tiles creation -------------------- */
const tileGroup = new THREE.Group();
scene.add(tileGroup);

const clickableMeshes = [];
const tileItems = [];

const texLoader = new THREE.TextureLoader(manager);

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
      group:g,
      cover,
      title,
      chapter:ch,
      index:i,
      hover:0,
      hoverTarget:0,
      qPrev: new THREE.Quaternion()
    };
    cover.userData.item = item;
    tileItems.push(item);
  }
})();

/* -------------------- model load (with fallback) -------------------- */
const center = new THREE.Group();
scene.add(center);

let modelLoaded = false;

function addFallbackModel(){
  if (modelLoaded) return;
  modelLoaded = true;
  console.warn("Using fallback model (GLB missing/failed).");

  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.85, 1.8, 10, 18),
    new THREE.MeshStandardMaterial({ color: PAL.text.getHex(), roughness:0.85, metalness:0.02 })
  );
  body.position.set(0, 1.25, 0);
  center.add(body);

  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(2.3, 2.7, 0.75, 28),
    new THREE.MeshStandardMaterial({ color: 0x2b3138, roughness:1.0, metalness:0.0 })
  );
  base.position.y = 0.35;
  center.add(base);
}

const gltfLoader = new GLTFLoader(manager);
gltfLoader.load(
  ASSETS.model,
  (gltf) => {
    if (modelLoaded) return;
    modelLoaded = true;

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
    console.log("✅ Model loaded:", ASSETS.model);
  },
  undefined,
  () => {
    console.warn("Model missing/failed:", ASSETS.model);
    addFallbackModel();
  }
);

// safety fallback if load never resolves
setTimeout(() => { if (!modelLoaded) addFallbackModel(); }, 1500);

/* -------------------- panel -------------------- */
panelClose?.addEventListener("click", closePanel);
window.addEventListener("keydown", (e) => { if (e.key === "Escape") closePanel(); });

async function openPanel(ch){
  if (!panel || !panelTitle || !panelBody) return;
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
}

/* -------------------- hover + click picking -------------------- */
const raycaster = new THREE.Raycaster();
const pointerNdc = new THREE.Vector2();
let hoveredItem = null;

function updatePointerNDC(e){
  const rect = canvas.getBoundingClientRect();
  pointerNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  pointerNdc.y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
}
function setHovered(next){
  if (hoveredItem === next) return;
  if (hoveredItem) hoveredItem.hoverTarget = 0;
  hoveredItem = next;
  if (hoveredItem) hoveredItem.hoverTarget = 1;
  canvas.style.cursor = hoveredItem ? "pointer" : "default";
}

canvas.addEventListener("pointermove", (e)=>{
  if (panel?.classList.contains("is-open")) { setHovered(null); return; }
  updatePointerNDC(e);
  raycaster.setFromCamera(pointerNdc, camera);
  const hits = raycaster.intersectObjects(clickableMeshes, false);
  if (!hits.length){ setHovered(null); return; }
  setHovered(hits[0].object.userData.item || null);
});
canvas.addEventListener("pointerleave", ()=> setHovered(null));

canvas.addEventListener("click", async (e)=>{
  if (panel?.classList.contains("is-open")) return;

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
  }else{
    openPanel(ch).catch(()=>{});
  }
});

/* -------------------- chapter dots UI -------------------- */
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

/* -------------------- timeline input -------------------- */
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

/* -------------------- resize -------------------- */
window.addEventListener("resize", ()=>{
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});

/* -------------------- temps -------------------- */
const UP = new THREE.Vector3(0,1,0);
const radial = new THREE.Vector3();
const tangent = new THREE.Vector3();

const xAxis = new THREE.Vector3();
const yAxis = new THREE.Vector3();
const zAxis = new THREE.Vector3();
const basis = new THREE.Matrix4();
const qTmp = new THREE.Quaternion();

// ✅ upright fix: constant 180° around local Z
const qFlipZ = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,0,1), Math.PI);

/* -------------------- render loop -------------------- */
requestAnimationFrame(tick);
function tick(){
  const dt = Math.min(0.033, clock.getDelta());
  const time = clock.getElapsedTime();

  // smooth decel
  const idleMs = performance.now() - timeline.lastInteractT;
  const damping = (idleMs <= T.idleDelayMs || dragging) ? T.dampingActive : T.dampingIdle;
  timeline.vel *= Math.exp(-damping * dt);
  if (!dragging && Math.abs(timeline.vel) < T.stopEps) timeline.vel = 0;
  timeline.value = clamp01(timeline.value + timeline.vel);

  // camera fixed
  const camY = T.camYBase + Math.sin(time*0.35)*T.camYBob;
  camera.position.set(Math.cos(T.camAzimuth)*T.camRadius, camY, Math.sin(T.camAzimuth)*T.camRadius);
  camera.lookAt(0, T.lookY, 0);

  // background drift
  bg.rotation.y = 0.35 + time*0.01;

  // fog update
  fogTex && fogPuffs.forEach((m)=>{
    if (m.material?.uniforms?.uMap) m.material.uniforms.uMap.value = fogTex;
    const d=m.userData;
    d.ang += dt*d.speed;

    const driftX = Math.sin(time*0.22 + d.seed)*d.drift;
    const driftZ = Math.cos(time*0.20 + d.seed)*d.drift;
    const breath = Math.sin(time*0.15 + d.seed)*0.90;
    const yy = d.yBase + Math.sin(time*0.70 + d.seed)*d.bobAmp;

    m.position.set(
      Math.cos(d.ang)*(d.radius + breath) + driftX,
      yy,
      Math.sin(d.ang)*(d.radius + breath) + driftZ
    );
    m.rotation.z += dt*d.spin;
    m.scale.setScalar(d.scaleBase*(0.92 + 0.18*Math.sin(time*0.35 + d.seed)));
    m.lookAt(camera.position);
  });

  // HUD highlight
  const near = nearestChapter(timeline.value);
  if (activeChapterId !== near.id){
    activeChapterId = near.id;
    setActiveDot(activeChapterId);
  }
  if (!panel?.classList.contains("is-open")){
    hintEl.textContent = near.href ? `${near.label} • Click to open link` : `${near.label} • Click to open`;
  }

  // helix driver
  const centerIdx = progressToIndex(timeline.value);
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

    // cover shader uniforms
    const mat = cover.material;
    mat.uniforms.uOpacity.value = vis01;
    mat.uniforms.uTime.value = time;
    mat.uniforms.uHover.value = item.hover;

    // -------- ribbon orientation (stable) --------
    // zAxis = radial outward (front tile faces camera when in front)
    radial.set(Math.cos(theta), 0, Math.sin(theta)).normalize();
    zAxis.copy(radial);

    // xAxis = helix tangent direction (diagonal along corkscrew)
    tangent.set(-Math.sin(theta), dy_dtheta, Math.cos(theta)).normalize();
    xAxis.copy(tangent);

    // yAxis completes basis
    yAxis.crossVectors(zAxis, xAxis).normalize();

    // keep upright (no inside-out)
    if (yAxis.dot(UP) < 0){
      xAxis.multiplyScalar(-1);
      yAxis.multiplyScalar(-1);
    }

    // re-orthonormalize
    xAxis.crossVectors(yAxis, zAxis).normalize();

    basis.makeBasis(xAxis, yAxis, zAxis);
    qTmp.setFromRotationMatrix(basis);

    // ✅ THE FIX: flip tiles upright
    qTmp.multiply(qFlipZ);

    // ✅ keep quaternion continuous
    keepQuatContinuous(qTmp, qPrev);

    group.quaternion.copy(qTmp);

    // title reacts to hover
    title.material.opacity = clamp01(vis01 * (0.22 + 0.78 * item.hover));
  }

  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}
