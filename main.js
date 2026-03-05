// main.js (GitHub Pages safe, no bundler)
// Uses esm.sh so GLTFLoader works in the browser without importmaps.

import * as THREE from "https://esm.sh/three@0.160.0";
import { GLTFLoader } from "https://esm.sh/three@0.160.0/examples/jsm/loaders/GLTFLoader.js";

/* ---------------- Base URL helper ---------------- */
const BASE_URL = new URL("./", import.meta.url);
const u = (p) => new URL(p, BASE_URL).href;

/* ---------------- DOM ---------------- */
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

/* ---------------- Utilities ---------------- */
const clamp01 = (x) => Math.max(0, Math.min(1, x));
function smoothstep(edge0, edge1, x) {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}
function damp(current, target, lambda, dt) {
  return THREE.MathUtils.lerp(current, target, 1 - Math.exp(-lambda * dt));
}
function keepQuatContinuous(q, prev) {
  if (q.dot(prev) < 0) { q.x *= -1; q.y *= -1; q.z *= -1; q.w *= -1; }
  prev.copy(q);
}

/* ---------------- Palette ---------------- */
const PAL = {
  sky:  new THREE.Color("#91C6FF"),
  deep: new THREE.Color("#464C52"),
  text: new THREE.Color("#E8EEF2"),
};

/* ---------------- Assets ---------------- */
const ASSETS = {
  sky:   u("assets/backgrounds/sky_sphere.jpg"),
  fog:   u("assets/textures/fog.jpg"),     // used for animated fog cards (works even without alpha)
  audio: u("assets/audio/ambient.mp3"),
};

const MODEL_CANDIDATES = [
  u("assets/models/me_on_hill.glb"),
  u("assets/models/me on hill.glb"),
];

/* ---------------- Chapters ---------------- */
const CHAPTERS = [
  { id:"about",        label:"About",              page:u("pages/about.html"),              coverKey:"about" },
  { id:"gallery",      label:"Gallery",            page:u("pages/gallery.html"),            coverKey:"gallery" },
  { id:"achievements", label:"Achievements",       page:u("pages/achievements.html"),       coverKey:"achievements" },
  { id:"contact",      label:"Contact",            page:u("pages/contact.html"),            coverKey:"contact" },

  { id:"fab",       label:"Fab Profile",        href:"https://www.fab.com/sellers/Oblix%20Studio",              coverKey:"fab" },
  { id:"steam",     label:"22 Minutes (Steam)", href:"https://store.steampowered.com/app/2765180/22_Minutes/",  coverKey:"steam_22minutes" },
  { id:"sketchfab", label:"Sketchfab Models",   href:"https://sketchfab.com/OblixStudio/models",                coverKey:"sketchfab" },
];

(function assignProgress(){
  const n = CHAPTERS.length;
  for (let i = 0; i < n; i++) CHAPTERS[i].progress = (i + 1) / (n + 1);
})();

/* ---------------- Tuning ---------------- */
const T = {
  // input feel (slower, smoother)
  wheelSpeed: 0.00085,
  dragSpeed:  0.060,
  friction:   0.86,     // per 60fps step (applied smoothly)
  follow:     0.10,     // how quickly value follows target
  maxVel:     0.07,     // clamp velocity for safety

  // camera orbit (bridge from your working orbit)
  orbitTurns: 1.35,
  orbitRadius: 14.2,
  pitchStartDeg: 64,
  pitchEndDeg: 78,
  lookY: 1.85,
  camYAdd: 0.55,

  // helix layout
  helixRadius: 7.1,
  helixAngleStep: 0.92,
  helixPitch: 2.55,
  helixYOffset: 4.0,
  helixRadiusGrow: 0.18,
  helixFrontPull: 0.75,
  visibleRange: 2.35,
  fadeSoftness: 1.10,

  // tile geometry + shading
  tileW: 4.05,
  tileH: 2.45,
  tileCurve: 0.08,
  titleOffset: { x: -1.75, y: 0.05, z: 0.62 },

  // hover
  hoverDamp: 10.0,
  flagAmp: 0.22,
  flagSpeed: 6.5,
  revealWidth: 0.09,

  // ✅ Orientation fix (THIS is the big one)
  bankDeg: 40,               // “on its side” corkscrew vibe
  pitchFactor: 0.75,         // how much slope pitch to apply (keeps it from going vertical)
  faceOutward: true,         // readable covers (faces camera side)
  extraYawDeg: 0,            // if you want a tiny twist, set e.g. 6

  // fog
  fogNear: 6,
  fogFar: 48,
  fogCards: 12,
};

/* ---------------- Loading Manager ---------------- */
const manager = new THREE.LoadingManager();
manager.onProgress = (_url, loaded, total) => {
  const pct = total ? Math.round((loaded / total) * 100) : 0;
  if (loaderFill) loaderFill.style.width = `${pct}%`;
  if (loaderPct) loaderPct.textContent = `${pct}%`;
};
manager.onLoad = () => {
  setTimeout(() => loaderEl?.classList.add("is-hidden"), 250);
  if (hintEl) hintEl.textContent = "Scroll / drag • Hover tiles • Click to open";
};

/* ---------------- Renderer / Scene / Camera ---------------- */
const renderer = new THREE.WebGLRenderer({ canvas, antialias:true, alpha:false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.07;

const scene = new THREE.Scene();
scene.background = PAL.deep.clone();

// ✅ fog now actually visible
scene.fog = new THREE.Fog(PAL.deep.getHex(), T.fogNear, T.fogFar);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth/window.innerHeight, 0.1, 900);
const clock = new THREE.Clock();

/* ---------------- Lights ---------------- */
scene.add(new THREE.HemisphereLight(PAL.sky.getHex(), PAL.deep.getHex(), 1.05));
const key = new THREE.DirectionalLight(0xffffff, 0.95);
key.position.set(4.2, 5.8, 3.2);
scene.add(key);
const rim = new THREE.DirectionalLight(PAL.sky.getHex(), 0.55);
rim.position.set(-6.0, 2.6, -3.8);
scene.add(rim);

/* ---------------- Background Sphere (fallback + optional image) ---------------- */
function makeSkyFallback(){
  const w=1024,h=512;
  const c=document.createElement("canvas"); c.width=w; c.height=h;
  const ctx=c.getContext("2d");
  const g=ctx.createLinearGradient(0,0,0,h);
  g.addColorStop(0, "#91C6FF");
  g.addColorStop(0.48, "#6786A7");
  g.addColorStop(1, "#464C52");
  ctx.fillStyle=g; ctx.fillRect(0,0,w,h);

  // soft stars
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  for (let i=0;i<900;i++){
    const x=Math.random()*w, y=Math.random()*h, r=Math.random()*1.2;
    ctx.globalAlpha = 0.12 + Math.random()*0.55;
    ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill();
  }
  ctx.globalAlpha = 1;

  const tex=new THREE.CanvasTexture(c);
  tex.colorSpace=THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
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
  (tex)=>{
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    bg.material.map = tex;
    bg.material.needsUpdate = true;
  },
  undefined,
  ()=>{}
);

/* ---------------- Center / Ground ---------------- */
const center = new THREE.Group();
scene.add(center);

{
  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(7.0, 96),
    new THREE.MeshStandardMaterial({ color: 0x2b3138, roughness: 1.0, metalness: 0.0 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = 0;
  center.add(ground);
}

/* ---------------- Model (guaranteed) ---------------- */
let modelLoaded = false;

function addFallbackModel(){
  if (modelLoaded) return;
  modelLoaded = true;

  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.85, 1.8, 10, 18),
    new THREE.MeshStandardMaterial({ color: PAL.text.getHex(), roughness:0.85, metalness:0.02 })
  );
  body.position.set(0, 1.25, 0);
  center.add(body);

  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(2.3, 2.7, 0.75, 28),
    new THREE.MeshStandardMaterial({ color: 0x1f252b, roughness:1.0, metalness:0.0 })
  );
  base.position.y = 0.35;
  center.add(base);

  hintEl && (hintEl.textContent = "⚠️ Model missing → showing fallback");
}

function fitCenterAndFloor(model, desiredSize = 12.0){
  const box = new THREE.Box3().setFromObject(model);
  const size = new THREE.Vector3();
  box.getSize(size);

  const maxAxis = Math.max(size.x, size.y, size.z);
  const scale = desiredSize / Math.max(0.0001, maxAxis);
  model.scale.setScalar(scale);

  // recalc after scale
  const box2 = new THREE.Box3().setFromObject(model);
  const centerPt = new THREE.Vector3();
  const minPt = new THREE.Vector3();
  box2.getCenter(centerPt);
  box2.getMin(minPt);

  model.position.sub(centerPt); // center at origin
  model.position.y -= minPt.y;  // put bottom on ground (y=0)
  model.position.y += 0.02;     // tiny lift to avoid z-fighting
}

function loadGLTFAny(urls){
  const loader = new GLTFLoader(manager);
  const tryAt = (i) => {
    if (i >= urls.length){
      console.warn("Model missing/failed:", urls);
      addFallbackModel();
      return;
    }
    loader.load(
      urls[i],
      (gltf)=>{
        if (modelLoaded) return;
        modelLoaded = true;

        const model = gltf.scene;
        fitCenterAndFloor(model, 13.5); // ✅ bigger + centered

        model.rotation.y = THREE.MathUtils.degToRad(12);
        center.add(model);

        hintEl && (hintEl.textContent = "Model loaded ✅ Scroll / drag to orbit");
      },
      undefined,
      ()=>tryAt(i+1)
    );
  };
  tryAt(0);
}
loadGLTFAny(MODEL_CANDIDATES);
setTimeout(()=>{ if(!modelLoaded) addFallbackModel(); }, 1600);

/* ---------------- Fog Cards (uses fog.jpg even without alpha) ---------------- */
const fogGroup = new THREE.Group();
scene.add(fogGroup);

function makeFogMaterial(tex){
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: true,
    uniforms: {
      uTex: { value: tex },
      uOpacity: { value: 0.18 },
      uTime: { value: 0.0 },
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
      uniform sampler2D uTex;
      uniform float uOpacity;
      uniform float uTime;

      void main(){
        // subtle drift
        vec2 uv = vUv;
        uv.x += sin(uTime * 0.15 + vUv.y * 3.0) * 0.02;
        uv.y += cos(uTime * 0.12 + vUv.x * 2.0) * 0.02;

        vec3 t = texture2D(uTex, uv).rgb;

        // fog.jpg likely has no alpha → use luminance as alpha
        float a = dot(t, vec3(0.3333));
        a = smoothstep(0.10, 0.92, a);

        // soft edges
        float edge = smoothstep(0.0, 0.12, vUv.x) * smoothstep(0.0, 0.12, vUv.y) *
                     smoothstep(0.0, 0.12, 1.0 - vUv.x) * smoothstep(0.0, 0.12, 1.0 - vUv.y);

        a *= edge;

        gl_FragColor = vec4(vec3(0.92), a * uOpacity);
      }
    `
  });
}

const fogPlanes = [];
new THREE.TextureLoader(manager).load(
  ASSETS.fog,
  (tex)=>{
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;

    for (let i = 0; i < T.fogCards; i++){
      const geo = new THREE.PlaneGeometry(10.5, 6.5);
      const mat = makeFogMaterial(tex);
      mat.uniforms.uOpacity.value = 0.12 + (i / (T.fogCards - 1)) * 0.10;

      const m = new THREE.Mesh(geo, mat);
      m.userData.seed = Math.random() * 1000;
      m.userData.baseY = 1.2 + Math.random() * 3.2;
      m.userData.scale = 0.85 + Math.random() * 0.65;
      m.scale.setScalar(m.userData.scale);

      fogGroup.add(m);
      fogPlanes.push(m);
    }
  },
  undefined,
  ()=>console.warn("Fog texture missing/failed:", ASSETS.fog)
);

/* ---------------- Covers (try multiple extensions) ---------------- */
const COVER_EXTS = ["jpg","jpeg","png","webp"];
function coverCandidates(key){
  return COVER_EXTS.map(ext => u(`assets/covers/${key}.${ext}`));
}
function loadTextureAny(urls, onOk, onFail){
  const loader = new THREE.TextureLoader(manager);
  const tryAt = (i) => {
    if (i >= urls.length){ onFail && onFail(); return; }
    loader.load(urls[i], (tex)=>onOk(tex, urls[i]), undefined, ()=>tryAt(i+1));
  };
  tryAt(0);
}

function makeFallbackCoverTexture(){
  const w=1024, h=640;
  const c=document.createElement("canvas"); c.width=w; c.height=h;
  const ctx=c.getContext("2d");
  const g=ctx.createLinearGradient(0,0,w,h);
  g.addColorStop(0, "#91C6FF");
  g.addColorStop(0.50, "#6786A7");
  g.addColorStop(1, "#464C52");
  ctx.fillStyle=g; ctx.fillRect(0,0,w,h);
  const tex=new THREE.CanvasTexture(c);
  tex.colorSpace=THREE.SRGBColorSpace;
  tex.anisotropy=8;
  return tex;
}
const FALLBACK_COVER_TEX = makeFallbackCoverTexture();

/* ---------------- Title Texture ---------------- */
function makeTitleTexture(text){
  const w=1024,h=256;
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
  tex.colorSpace=THREE.SRGBColorSpace;
  tex.anisotropy=8;
  return tex;
}

/* ---------------- Cover Shader (B/W -> reveal -> color) ---------------- */
const TILE_ASPECT = T.tileW / T.tileH;

function makeCoverMaterial(){
  return new THREE.ShaderMaterial({
    transparent:true,
    depthWrite:false,
    side:THREE.DoubleSide,
    uniforms:{
      uTex:{ value: FALLBACK_COVER_TEX },
      uTexAspect:{ value: 1.0 },
      uTileAspect:{ value: TILE_ASPECT },
      uOpacity:{ value: 0.0 },
      uCurve:{ value: T.tileCurve },
      uTime:{ value: 0.0 },
      uHover:{ value: 0.0 },
      uFlagAmp:{ value: T.flagAmp },
      uFlagSpeed:{ value: T.flagSpeed },
      uRevealW:{ value: T.revealWidth }
    },
    vertexShader: `
      varying vec2 vUv;
      uniform float uCurve, uTime, uHover, uFlagAmp, uFlagSpeed;
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
      uniform float uTexAspect, uTileAspect;
      uniform float uOpacity, uTime, uHover, uRevealW;

      vec2 coverUV(vec2 uv, float texA, float tileA){
        vec2 s = vec2(1.0);
        if (texA > tileA) s.x = texA / tileA;
        else s.y = tileA / texA;
        return (uv - 0.5) * s + 0.5;
      }

      void main(){
        vec2 uv = coverUV(vUv, uTexAspect, uTileAspect);
        vec4 t = texture2D(uTex, uv);

        float g = dot(t.rgb, vec3(0.299,0.587,0.114));
        vec3 gray = vec3(g);

        float wave = sin(vUv.y * 7.0 + uTime * 7.0) * 0.03 * uHover;
        float edge = -0.20 + uHover * 1.20 + wave;
        float m = 1.0 - smoothstep(edge - uRevealW, edge + uRevealW, vUv.x);

        vec3 col = mix(gray, t.rgb, m);
        gl_FragColor = vec4(col, uOpacity);
      }
    `
  });
}

/* ---------------- Tiles ---------------- */
const tileGroup = new THREE.Group();
scene.add(tileGroup);

const clickableMeshes = [];
const tileItems = [];

(function createTiles(){
  for (let i=0;i<CHAPTERS.length;i++){
    const ch = CHAPTERS[i];

    const coverGeo = new THREE.PlaneGeometry(T.tileW, T.tileH, 30, 1);
    const coverMat = makeCoverMaterial();

    loadTextureAny(
      coverCandidates(ch.coverKey),
      (tex)=>{
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 8;
        coverMat.uniforms.uTex.value = tex;
        const img = tex.image;
        if (img && img.width && img.height) coverMat.uniforms.uTexAspect.value = img.width / img.height;
      },
      ()=>console.warn("Cover missing/failed:", ch.coverKey)
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

    const item = { group:g, cover, title, chapter:ch, index:i, hover:0, hoverTarget:0, qPrev:new THREE.Quaternion() };
    cover.userData.item = item;
    tileItems.push(item);
  }
})();

/* ---------------- Chapter UI dots ---------------- */
let activeChapterId = null;

function buildChapterUI(){
  chaptersEl.innerHTML = "";
  CHAPTERS.forEach((ch) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "chapterDot";
    dot.title = ch.label;
    dot.addEventListener("click", () => {
      timeline.target = clamp01(ch.progress);
      timeline.velocity = 0;

      if (ch.href) window.open(ch.href, "_blank", "noopener,noreferrer");
      else openPanel(ch).catch(()=>{});
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

/* ---------------- Panel ---------------- */
panelClose?.addEventListener("click", closePanel);
window.addEventListener("keydown", (e)=>{ if(e.key==="Escape") closePanel(); });

async function openPanel(ch){
  if (!panel || !panelTitle || !panelBody) return;
  panelTitle.textContent = ch.label;
  panel.classList.add("is-open");
  panel.setAttribute("aria-hidden","false");
  try{
    const res = await fetch(ch.page, { cache:"no-store" });
    if (!res.ok) throw new Error(res.status);
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

/* ---------------- Hover + click picking ---------------- */
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
canvas.addEventListener("pointerleave", ()=>setHovered(null));

canvas.addEventListener("click", (e)=>{
  if (panel?.classList.contains("is-open")) return;

  updatePointerNDC(e);
  raycaster.setFromCamera(pointerNdc, camera);
  const hits = raycaster.intersectObjects(clickableMeshes, false);
  if (!hits.length) return;

  const ch = hits[0].object.userData.chapter;
  timeline.target = clamp01(ch.progress);
  timeline.velocity = 0;
  timeline.lastInteractT = performance.now();

  if (ch.href) window.open(ch.href, "_blank", "noopener,noreferrer");
  else openPanel(ch).catch(()=>{});
});

/* ---------------- Timeline input (smooth orbit, no snapping) ---------------- */
const timeline = { value:0.02, target:0.02, velocity:0, lastInteractT:performance.now() };

function normalizeWheel(e){
  let dy = e.deltaY;
  if (e.deltaMode===1) dy *= 16;
  else if (e.deltaMode===2) dy *= window.innerHeight;
  return dy;
}

window.addEventListener("wheel", (e)=>{
  e.preventDefault();
  timeline.lastInteractT = performance.now();
  timeline.velocity += normalizeWheel(e) * T.wheelSpeed;
  timeline.velocity = THREE.MathUtils.clamp(timeline.velocity, -T.maxVel, T.maxVel);
}, { passive:false });

let dragging=false;
let dragStartX=0;
let dragStartTarget=0;

canvas.addEventListener("pointerdown",(e)=>{
  dragging=true;
  timeline.lastInteractT=performance.now();
  dragStartX=e.clientX;
  dragStartTarget=timeline.target;
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener("pointermove",(e)=>{
  if(!dragging) return;
  timeline.lastInteractT=performance.now();
  const dx=(e.clientX-dragStartX)/Math.max(1,window.innerWidth);
  timeline.target = clamp01(dragStartTarget - dx * T.dragSpeed);
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

/* ---------------- Resize ---------------- */
window.addEventListener("resize", ()=>{
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});

/* ---------------- Orientation temps ---------------- */
const UP = new THREE.Vector3(0,1,0);
const zAxis = new THREE.Vector3(); // forward/normal
const xAxis = new THREE.Vector3(); // right
const yAxis = new THREE.Vector3(); // up
const basis = new THREE.Matrix4();
const qTmp = new THREE.Quaternion();

const qBank = new THREE.Quaternion();
const qPitch = new THREE.Quaternion();
const qYaw = new THREE.Quaternion();

function computeSlopeAngle(r){
  // helix slope angle relative to horizontal arc length
  const horiz = Math.max(0.0001, r * T.helixAngleStep);
  return Math.atan2(T.helixPitch, horiz);
}

/* ---------------- Loop ---------------- */
requestAnimationFrame(tick);
function tick(){
  const dt = Math.min(0.033, clock.getDelta());
  const time = clock.getElapsedTime();

  // smooth inertial feel
  timeline.velocity *= Math.pow(T.friction, dt * 60);
  timeline.target = clamp01(timeline.target + timeline.velocity);
  timeline.value = THREE.MathUtils.lerp(timeline.value, timeline.target, 1 - Math.pow(1 - T.follow, dt * 60));

  // orbit camera (bridge from your working orbit)
  const azimuth = timeline.value * T.orbitTurns * Math.PI * 2.0;
  const pitchStart = THREE.MathUtils.degToRad(T.pitchStartDeg);
  const pitchEnd   = THREE.MathUtils.degToRad(T.pitchEndDeg);
  const pitch = THREE.MathUtils.lerp(pitchStart, pitchEnd, smoothstep(0.06, 0.94, timeline.value));

  const y = Math.cos(pitch) * T.orbitRadius;
  const rr = Math.sin(pitch) * T.orbitRadius;
  const cx = Math.cos(azimuth) * rr;
  const cz = Math.sin(azimuth) * rr;

  camera.position.set(cx, y + T.camYAdd, cz);
  camera.lookAt(0, T.lookY, 0);

  // subtle background motion
  bg.rotation.y = azimuth * 0.18 + 0.35;
  bg.rotation.x = Math.sin(azimuth * 0.12) * 0.03;

  // fog cards (billboard + drift)
  if (fogPlanes.length){
    const dir = new THREE.Vector3(camera.position.x, 0, camera.position.z).normalize();
    for (let i=0;i<fogPlanes.length;i++){
      const p = fogPlanes[i];
      const seed = p.userData.seed || 0;

      const d = 3.2 + i * 2.35;
      p.position.set(
        dir.x * d + Math.sin(time * 0.22 + seed) * 1.2,
        p.userData.baseY + Math.sin(time * 0.35 + seed) * 0.35,
        dir.z * d + Math.cos(time * 0.20 + seed) * 1.2
      );

      // billboard
      p.quaternion.copy(camera.quaternion);

      p.material.uniforms.uTime.value = time;
    }
  }

  // helix tiles (tied to camera azimuth so the flow feels “locked” and intentional)
  const centerIdx = progressToIndex(timeline.value);
  const bank = THREE.MathUtils.degToRad(T.bankDeg);
  const yaw  = THREE.MathUtils.degToRad(T.extraYawDeg);

  for (const item of tileItems){
    const { group, cover, title, index, qPrev } = item;
    const rel = index - centerIdx;

    // camera-anchored helix angle
    const theta = azimuth + rel * T.helixAngleStep;

    const frontBoost = (1.0 - Math.min(1.0, Math.abs(rel))) * T.helixFrontPull;
    const r = T.helixRadius + Math.abs(rel)*T.helixRadiusGrow + frontBoost;

    const yPos = T.helixYOffset - rel*T.helixPitch + Math.sin(time*0.9 + index*0.6)*0.06;
    group.position.set(Math.cos(theta)*r, yPos, Math.sin(theta)*r);

    // visibility by index distance
    const dAbs = Math.abs(rel);
    const vis = 1.0 - smoothstep(T.visibleRange - T.fadeSoftness, T.visibleRange + T.fadeSoftness, dAbs);
    const vis01 = clamp01(vis);

    // hover easing
    item.hover = damp(item.hover, item.hoverTarget, T.hoverDamp, dt);

    // shader uniforms
    const mat = cover.material;
    mat.uniforms.uOpacity.value = vis01;
    mat.uniforms.uTime.value = time;
    mat.uniforms.uHover.value = item.hover;

    // ✅ Stable orientation:
    // - face outward (readable from camera side)
    // - add “corkscrew bank” (~40°) + gentle slope pitch (no vertical freakout)
    zAxis.set(Math.cos(theta), 0, Math.sin(theta)).normalize(); // outward
    if (!T.faceOutward) zAxis.multiplyScalar(-1);

    xAxis.crossVectors(UP, zAxis).normalize();       // right
    yAxis.crossVectors(zAxis, xAxis).normalize();    // up (stable)

    basis.makeBasis(xAxis, yAxis, zAxis);
    qTmp.setFromRotationMatrix(basis);

    const slope = computeSlopeAngle(r) * T.pitchFactor;
    qBank.setFromAxisAngle(new THREE.Vector3(0,0,1), bank);     // local roll (corkscrew)
    qPitch.setFromAxisAngle(new THREE.Vector3(1,0,0), -slope);  // local pitch (gentle)
    qYaw.setFromAxisAngle(new THREE.Vector3(0,1,0), yaw);       // optional tiny twist

    qTmp.multiply(qYaw);
    qTmp.multiply(qBank);
    qTmp.multiply(qPitch);

    keepQuatContinuous(qTmp, qPrev);
    group.quaternion.copy(qTmp);

    title.material.opacity = clamp01(vis01 * (0.22 + 0.78 * item.hover));
  }

  // chapter dots + hint
  const near = nearestChapter(timeline.value);
  if (activeChapterId !== near.id){
    activeChapterId = near.id;
    setActiveDot(activeChapterId);
    if (hintEl) hintEl.textContent = `${near.label} • Hover / click tile`;
  }

  // subtle center motion
  center.rotation.y = Math.sin(time * 0.22) * 0.05;

  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}
