import * as THREE from "https://esm.sh/three@0.160.0";
import { GLTFLoader } from "https://esm.sh/three@0.160.0/examples/jsm/loaders/GLTFLoader.js";

/* ---------------- URL helper ---------------- */
const BASE_URL = new URL("./", import.meta.url);
const u = (p) => new URL(p, BASE_URL).href;

/* ---------------- DOM ---------------- */
const canvas = document.getElementById("webgl");
const loaderEl = document.getElementById("loader");
const loaderFill = document.getElementById("loaderFill");
const loaderPct = document.getElementById("loaderPct");
const hintEl = document.getElementById("hint");

const panel = document.getElementById("panel");
const panelTitle = document.getElementById("panelTitle");
const panelBody = document.getElementById("panelBody");
const panelClose = document.getElementById("panelClose");

function clamp01(x){ return Math.max(0, Math.min(1, x)); }
function smoothstep(e0, e1, x){
  const t = clamp01((x - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
}
function damp(current, target, lambda, dt){
  return THREE.MathUtils.lerp(current, target, 1 - Math.exp(-lambda * dt));
}
function keepQuatContinuous(q, prev){
  if (q.dot(prev) < 0) { q.x *= -1; q.y *= -1; q.z *= -1; q.w *= -1; }
  prev.copy(q);
}

if (!canvas) console.error("Canvas #webgl not found");

/* ---------------- Palette ---------------- */
const PAL = {
  sky:  new THREE.Color("#91C6FF"),
  deep: new THREE.Color("#464C52"),
  text: new THREE.Color("#E8EEF2"),
};

/* ---------------- Assets ---------------- */
const ASSETS = {
  sky:   u("assets/backgrounds/sky_sphere.jpg"),
  audio: u("assets/audio/ambient.mp3"),
};

// ✅ IMPORTANT: try BOTH folders (models + the common typo modles)
const MODEL_CANDIDATES = [
  u("assets/models/me_on_hill.glb"),
  u("assets/modles/me_on_hill.glb"),
  u("assets/models/me on hill.glb"),
  u("assets/modles/me on hill.glb"),
];

// fog texture candidates (your file name “fogall”)
const FOG_EXTS = ["png","webp","jpg","jpeg"];
const FOG_CANDIDATES = FOG_EXTS.map(ext => u(`assets/textures/fogall.${ext}`));

/* ---------------- Chapters ---------------- */
const CHAPTERS = [
  { id:"about",        label:"About",              page:u("pages/about.html"),              coverKey:"about" },
  { id:"gallery",      label:"Gallery",            page:u("pages/gallery.html"),            coverKey:"gallery" },
  { id:"achievements", label:"Achievements",       page:u("pages/achievements.html"),       coverKey:"achievements" },
  { id:"contact",      label:"Contact",            page:u("pages/contact.html"),            coverKey:"contact" },

  { id:"fab",       label:"Fab Profile",        href:"https://www.fab.com/sellers/Oblix%20Studio",               coverKey:"fab" },
  { id:"steam",     label:"22 Minutes (Steam)", href:"https://store.steampowered.com/app/2765180/22_Minutes/",   coverKey:"steam_22minutes" },
  { id:"sketchfab", label:"Sketchfab Models",   href:"https://sketchfab.com/OblixStudio/models",                coverKey:"sketchfab" },
];

(function assignProgress(){
  const n = CHAPTERS.length;
  for (let i=0;i<n;i++){
    CHAPTERS[i].progress = (i + 1) / (n + 1);
  }
})();

/* ---------------- Tuning ---------------- */
const T = {
  // scroll feel
  scrollSensitivity: 0.000006,
  dragSensitivity: 0.010,
  maxVel: 0.0030,
  dampingActive: 9.0,
  dampingIdle: 34.0,
  idleDelayMs: 120,
  stopEps: 0.00002,

  // camera
  camAzimuth: Math.PI * 0.5,
  camRadius: 16.2,
  camYBase: 5.5,
  camYBob: 0.18,
  lookY: 2.2,

  // helix ribbon
  helixRadius: 6.2,
  helixThetaOffset: Math.PI * 0.5,
  helixAngleStep: 1.22,
  helixPitch: 3.10,
  helixYOffset: 4.4,
  helixFrontPull: 0.65,
  helixRadiusGrow: 0.28,

  visibleRange: 2.25,
  fadeSoftness: 1.10,

  // tile geometry
  tileW: 4.05,
  tileH: 2.45,
  tileCurve: 0.08,

  // base-on-helix alignment
  tileBaseOnHelix: true,

  // ✅ FIX: tilt tiles to follow corkscrew ribbon (not vertical)
  // 0 = old "vertical/radial" mount, 1 = ribbon-tilt frame
  ribbonTiltMix: 0.92,

  // small extra lean around tangent axis if you want it “more on its side”
  extraLeanDeg: 0, // try 10 if you want more

  titleOffset: { x: -1.75, y: 0.05, z: 0.62 },

  // hover animation
  hoverDamp: 10.0,
  flagAmp: 0.22,
  flagSpeed: 6.5,
  revealWidth: 0.09,

  // ✅ upright fix
  flipAxis: "Z", // "Z" | "X" | "Y"

  // ✅ make model bigger
  modelTargetSize: 14.5, // was ~9.6
  modelYOffset: -0.15,
};

/* ---------------- Loading Manager ---------------- */
const manager = new THREE.LoadingManager();
manager.onProgress = (_url, loaded, total) => {
  const pct = total ? Math.round((loaded / total) * 100) : 0;
  loaderFill && (loaderFill.style.width = `${pct}%`);
  loaderPct && (loaderPct.textContent = `${pct}%`);
};
manager.onLoad = () => {
  setTimeout(() => loaderEl?.classList.add("is-hidden"), 250);
  hintEl && (hintEl.textContent = "Scroll / drag • Hover tiles • Click to open");
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
scene.fog = new THREE.Fog(PAL.deep.getHex(), 18, 110);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth/window.innerHeight, 0.1, 900);
const clock = new THREE.Clock();

/* ---------------- Lights ---------------- */
scene.add(new THREE.HemisphereLight(PAL.sky.getHex(), PAL.deep.getHex(), 1.1));
const key = new THREE.DirectionalLight(0xffffff, 1.05);
key.position.set(4.2, 6.4, 3.2);
scene.add(key);

const fill = new THREE.DirectionalLight(0xffffff, 0.35);
fill.position.set(-3.5, 2.2, 6.5);
scene.add(fill);

const rim = new THREE.DirectionalLight(PAL.sky.getHex(), 0.55);
rim.position.set(-6.0, 2.6, -3.8);
scene.add(rim);

/* ---------------- Background Sphere ---------------- */
function makeSkyFallback(){
  const w=1024,h=512;
  const c=document.createElement("canvas"); c.width=w; c.height=h;
  const ctx=c.getContext("2d");
  const g=ctx.createLinearGradient(0,0,0,h);
  g.addColorStop(0, "#91C6FF");
  g.addColorStop(0.48, "#6786A7");
  g.addColorStop(1, "#464C52");
  ctx.fillStyle=g; ctx.fillRect(0,0,w,h);
  const tex=new THREE.CanvasTexture(c);
  tex.colorSpace=THREE.SRGBColorSpace;
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

/* ---------------- Model ---------------- */
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

function loadGLTFAny(urls){
  const loader = new GLTFLoader(manager);
  const tryAt = (i) => {
    if (i >= urls.length){
      console.warn("Model missing/failed (all attempts):", urls);
      addFallbackModel();
      return;
    }
    const url = urls[i];
    console.log("Trying model:", url);

    loader.load(
      url,
      (gltf)=>{
        if (modelLoaded) return;
        modelLoaded = true;

        const model = gltf.scene;

        // auto scale to target size (BIGGER)
        const box = new THREE.Box3().setFromObject(model);
        const size = new THREE.Vector3();
        box.getSize(size);
        const maxAxis = Math.max(size.x, size.y, size.z);
        const scale = T.modelTargetSize / Math.max(0.0001, maxAxis);
        model.scale.setScalar(scale);

        // center it
        const box2 = new THREE.Box3().setFromObject(model);
        const centerPoint = new THREE.Vector3();
        box2.getCenter(centerPoint);
        model.position.sub(centerPoint);

        model.position.y += T.modelYOffset;
        model.rotation.y = THREE.MathUtils.degToRad(10);

        center.add(model);
        console.log("✅ Model loaded:", url);
      },
      undefined,
      ()=>tryAt(i+1)
    );
  };
  tryAt(0);
}

loadGLTFAny(MODEL_CANDIDATES);
setTimeout(()=>{ if(!modelLoaded) addFallbackModel(); }, 2000);

/* ---------------- Covers ---------------- */
const COVER_EXTS = ["jpg","jpeg","png","webp"];
function coverCandidates(key){
  return COVER_EXTS.map(ext => u(`assets/covers/${key}.${ext}`));
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

/* ---------------- Cover Shader ---------------- */
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

function loadTextureAny(urls, onOk, onFail){
  const loader = new THREE.TextureLoader(manager);
  const tryAt = (i) => {
    if (i >= urls.length){
      onFail && onFail(urls);
      return;
    }
    loader.load(
      urls[i],
      (tex)=>onOk(tex, urls[i]),
      undefined,
      ()=>tryAt(i+1)
    );
  };
  tryAt(0);
}

/* ---------------- Tiles ---------------- */
const tileGroup = new THREE.Group();
scene.add(tileGroup);

const clickableMeshes = [];
const tileItems = [];
const TILE_BASE_OFFSET_Y = T.tileBaseOnHelix ? (T.tileH * 0.5) : 0.0;

(function createTiles(){
  for (let i=0;i<CHAPTERS.length;i++){
    const ch = CHAPTERS[i];

    const root = new THREE.Group();
    const content = new THREE.Group();
    content.position.y = TILE_BASE_OFFSET_Y;
    root.add(content);

    const coverGeo = new THREE.PlaneGeometry(T.tileW, T.tileH, 30, 1);
    const coverMat = makeCoverMaterial();

    loadTextureAny(
      coverCandidates(ch.coverKey),
      (tex)=>{
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 8;
        tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
        coverMat.uniforms.uTex.value = tex;
        const img = tex.image;
        if (img && img.width && img.height){
          coverMat.uniforms.uTexAspect.value = img.width / img.height;
        }
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

    content.add(cover);
    content.add(title);
    tileGroup.add(root);

    clickableMeshes.push(cover);

    const item = { group:root, cover, title, chapter:ch, index:i, hover:0, hoverTarget:0, qPrev:new THREE.Quaternion() };
    cover.userData.item = item;
    tileItems.push(item);
  }
})();

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
  timeline.value = clamp01(ch.progress);
  timeline.vel = 0;
  timeline.lastInteractT = performance.now();

  if (ch.href) window.open(ch.href, "_blank", "noopener,noreferrer");
  else openPanel(ch).catch(()=>{});
});

/* ---------------- Timeline input ---------------- */
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

/* ---------------- Flip helpers ---------------- */
const qFlipX = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0), Math.PI);
const qFlipY = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0), Math.PI);
const qFlipZ = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,0,1), Math.PI);
function applyFlip(q){
  if (T.flipAxis === "X") q.multiply(qFlipX);
  else if (T.flipAxis === "Y") q.multiply(qFlipY);
  else q.multiply(qFlipZ);
}

/* ---------------- Fog cards using fogall texture ---------------- */
const fogGroup = new THREE.Group();
scene.add(fogGroup);
let fogTex = null;
const fogCards = [];

function makeFogMaterial(tex){
  // Works even if fog image has NO alpha channel: alpha comes from luminance.
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: true,
    side: THREE.DoubleSide,
    uniforms: {
      uTex: { value: tex },
      uOpacity: { value: 0.28 },
      uSoft: { value: 0.35 },
      uTime: { value: 0.0 },
      uScroll: { value: new THREE.Vector2(0.015, 0.0) },
    },
    vertexShader: `
      varying vec2 vUv;
      void main(){
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      uniform sampler2D uTex;
      uniform float uOpacity;
      uniform float uSoft;
      uniform float uTime;
      uniform vec2 uScroll;

      void main(){
        vec2 uv = vUv + uScroll * uTime;

        vec3 c = texture2D(uTex, uv).rgb;
        float lum = dot(c, vec3(0.299,0.587,0.114));

        // soft threshold so black becomes transparent
        float a = smoothstep(uSoft, 1.0, lum) * uOpacity;

        // subtle vertical fade to avoid a hard card edge
        float edge = smoothstep(0.0, 0.18, vUv.y) * smoothstep(0.0, 0.18, 1.0 - vUv.y);
        a *= edge;

        gl_FragColor = vec4(vec3(1.0), a);
      }
    `
  });
}

function spawnFog(tex){
  fogTex = tex;
  fogTex.wrapS = fogTex.wrapT = THREE.RepeatWrapping;
  fogTex.colorSpace = THREE.SRGBColorSpace;
  fogTex.anisotropy = 8;

  const mat = makeFogMaterial(fogTex);
  const geo = new THREE.PlaneGeometry(16, 10, 1, 1);

  // A few big fog cards around the model
  const placements = [
    { x:  0.0, y: 2.2, z:  0.0, s: 2.6 },
    { x: -3.0, y: 2.6, z:  2.5, s: 2.2 },
    { x:  3.2, y: 2.4, z:  2.0, s: 2.1 },
    { x:  0.5, y: 3.2, z: -2.8, s: 2.3 },
  ];

  for (let i=0;i<placements.length;i++){
    const p = placements[i];
    const m = new THREE.Mesh(geo, mat.clone());
    m.position.set(p.x, p.y, p.z);
    m.scale.setScalar(p.s);
    m.renderOrder = 999; // draw late
    fogGroup.add(m);
    fogCards.push(m);
  }

  console.log("✅ fogall loaded and fog cards spawned");
}

// load fogall from candidates
loadTextureAny(
  FOG_CANDIDATES,
  (tex, url)=>{
    console.log("✅ fogall texture loaded:", url);
    spawnFog(tex);
  },
  (attempted)=>{
    console.warn("Fog (fogall) missing/failed. Attempted:", attempted);
  }
);

/* ---------------- Helix frame temps ---------------- */
const UP = new THREE.Vector3(0,1,0);
const radialOut = new THREE.Vector3();
const radialIn  = new THREE.Vector3();
const tangent   = new THREE.Vector3();
const ribbonN   = new THREE.Vector3(); // binormal-ish
const xAxis     = new THREE.Vector3();
const yAxis     = new THREE.Vector3();
const zAxis     = new THREE.Vector3();
const basis     = new THREE.Matrix4();
const qTmp      = new THREE.Quaternion();

/* ---------------- Loop ---------------- */
requestAnimationFrame(tick);
function tick(){
  const dt = Math.min(0.033, clock.getDelta());
  const time = clock.getElapsedTime();

  // timeline damping
  const idleMs = performance.now() - timeline.lastInteractT;
  const damping = (idleMs <= T.idleDelayMs || dragging) ? T.dampingActive : T.dampingIdle;
  timeline.vel *= Math.exp(-damping * dt);
  if (!dragging && Math.abs(timeline.vel) < T.stopEps) timeline.vel = 0;
  timeline.value = clamp01(timeline.value + timeline.vel);

  // camera
  const camY = T.camYBase + Math.sin(time*0.35)*T.camYBob;
  camera.position.set(Math.cos(T.camAzimuth)*T.camRadius, camY, Math.sin(T.camAzimuth)*T.camRadius);
  camera.lookAt(0, T.lookY, 0);

  // fog animate (billboard + gentle scroll)
  for (const card of fogCards){
    card.lookAt(camera.position.x, card.position.y, camera.position.z);
    card.material.uniforms.uTime.value = time;
  }

  // helix
  const centerIdx = progressToIndex(timeline.value);
  const dy_dtheta = -(T.helixPitch / Math.max(1e-6, T.helixAngleStep));

  for (const item of tileItems){
    const { group, cover, title, index, qPrev } = item;
    const rel = index - centerIdx;

    const theta = T.helixThetaOffset + rel * T.helixAngleStep;

    const frontBoost = (1.0 - Math.min(1.0, Math.abs(rel))) * T.helixFrontPull;
    const r = T.helixRadius + Math.abs(rel)*T.helixRadiusGrow + frontBoost;

    const yPos = T.helixYOffset - rel*T.helixPitch + Math.sin(time*0.9 + index*0.6)*0.06;
    group.position.set(Math.cos(theta)*r, yPos, Math.sin(theta)*r);

    // fade
    const dAbs = Math.abs(rel);
    const vis = 1.0 - smoothstep(T.visibleRange - T.fadeSoftness, T.visibleRange + T.fadeSoftness, dAbs);
    const vis01 = clamp01(vis);

    // hover
    item.hover = damp(item.hover, item.hoverTarget, T.hoverDamp, dt);

    // shader uniforms
    const mat = cover.material;
    mat.uniforms.uOpacity.value = vis01;
    mat.uniforms.uTime.value = time;
    mat.uniforms.uHover.value = item.hover;

    // --- ORIENTATION FIX ---
    // radial out/in
    radialOut.set(Math.cos(theta), 0, Math.sin(theta)).normalize();
    radialIn.copy(radialOut).multiplyScalar(-1);

    // helix tangent (includes vertical slope)
    tangent.set(-Math.sin(theta), dy_dtheta, Math.cos(theta)).normalize();

    // ribbon normal (tilts upward): tangent x inward
    ribbonN.copy(tangent).cross(radialIn).normalize();

    // mix between old vertical mount (radialOut) and ribbon tilt normal
    zAxis.copy(radialOut).lerp(ribbonN, T.ribbonTiltMix).normalize();

    // width direction along tangent
    xAxis.copy(tangent).normalize();

    // yAxis from z x x to keep orthonormal
    yAxis.copy(zAxis).cross(xAxis).normalize();

    // ensure upright
    if (yAxis.dot(UP) < 0){
      xAxis.multiplyScalar(-1);
      yAxis.multiplyScalar(-1);
      zAxis.multiplyScalar(-1);
    }

    // ensure tile faces outward-ish (not inward)
    if (zAxis.dot(radialOut) < 0){
      zAxis.multiplyScalar(-1);
      yAxis.multiplyScalar(-1);
    }

    // build quaternion
    basis.makeBasis(xAxis, yAxis, zAxis);
    qTmp.setFromRotationMatrix(basis);

    // optional extra lean around tangent (xAxis)
    if (T.extraLeanDeg !== 0){
      const qLean = new THREE.Quaternion().setFromAxisAngle(xAxis, THREE.MathUtils.degToRad(T.extraLeanDeg));
      qTmp.multiply(qLean);
    }

    // upright flip (if needed)
    applyFlip(qTmp);

    keepQuatContinuous(qTmp, qPrev);
    group.quaternion.copy(qTmp);

    title.material.opacity = clamp01(vis01 * (0.22 + 0.78 * item.hover));
  }

  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}
