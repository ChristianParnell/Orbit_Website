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

if (!canvas) hardFail("Canvas #webgl not found.");
if (!hintEl) hardFail("HUD #hint not found.");
if (!chaptersEl) hardFail("HUD #chapters not found.");

console.log("✅ Orbit main.js loaded. THREE revision:", THREE.REVISION);
hintEl.textContent = "Scene starting…";

// Palette (from your Adobe colors)
const PAL = {
  sky:   new THREE.Color("#91C6FF"),
  sand:  new THREE.Color("#BD9C64"),
  sun:   new THREE.Color("#FCBA47"),
  slate: new THREE.Color("#6786A7"),
  moss:  new THREE.Color("#7D7361"),
  deep:  new THREE.Color("#464C52"),
  text:  new THREE.Color("#E8EEF2"),
};

// Assets (MATCH THESE FILES)
const ASSETS = {
  model: u("assets/models/me_on_hill.glb"),
  sky:   u("assets/backgrounds/sky_sphere.jpg"),
  fog:   u("assets/textures/fog.jpg"),
  audio: u("assets/audio/ambient.mp3"),
};

// Chapters
const CHAPTERS = [
  { id: "about",        label: "About",        progress: 0.10, page: u("pages/about.html") },
  { id: "gallery",      label: "Gallery",      progress: 0.35, page: u("pages/gallery.html") },
  { id: "achievements", label: "Achievements", progress: 0.60, page: u("pages/achievements.html") },
  { id: "contact",      label: "Contact",      progress: 0.85, page: u("pages/contact.html") },
];

// Tuning (BIG folders, closer to model, real corkscrew, 40° tilt that relaxes near camera)
const T = {
  scrollSensitivity: 0.00014,
  dragSensitivity: 0.014,
  inertia: 0.92,
  lerp: 0.040,

  modelTargetSize: 9.2,

  orbitTurns: 1.55,
  camRadius: 20.5,
  camYBase: 6.1,
  camYAmplitude: 1.20,
  lookY: 1.25,

  // Corkscrew path (CLOSER to model)
  spiralRadius: 12.8,
  spiralYStep: 4.9,
  spiralYOffset: 5.5,
  tileAngleStep: 3.15,
  frontPush: 0.75,
  radiusGrow: 0.65,

  visibleRange: 1.75,
  fadeSoftness: 1.15,

  // BIG folders
  tileW: 4.05,
  tileH: 2.45,
  tileCurve: 0.080,

  // Title offset (2D plane, slightly in front + left side-middle)
  titleOffset: { x: -1.75, y: 0.05, z: 0.62 },

  // Folder tilt behavior
  folderTiltDeg: 40,
  folderNearTiltDeg: 22, // straighten a bit when near camera, but not fully
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
  hintEl.textContent = "Scroll / drag • Click tiles • (audio starts on interaction)";
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

// Lights (soft)
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

// Background sphere (soft palette)
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

  const sun = ctx.createRadialGradient(w*0.72, h*0.30, 10, w*0.72, h*0.30, 260);
  sun.addColorStop(0, "rgba(252,186,71,0.26)");
  sun.addColorStop(1, "rgba(252,186,71,0.0)");
  ctx.fillStyle = sun;
  ctx.fillRect(0,0,w,h);

  ctx.fillStyle = "rgba(255,255,255,0.9)";
  for (let i=0;i<650;i++){
    const x = Math.random()*w;
    const y = Math.random()*h;
    const r = Math.random()*1.2;
    ctx.globalAlpha = 0.08 + Math.random()*0.30;
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

const bg = new THREE.Mesh(
  new THREE.SphereGeometry(160, 48, 48),
  new THREE.MeshBasicMaterial({ map: makeSkyTexture(), side: THREE.BackSide })
);
bg.material.fog = false;
bg.rotation.y = 0.35;
scene.add(bg);

// Optional real sky texture (if file exists)
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

// Fog fallback texture (ALWAYS visible fog)
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
const fogMats = [];

new THREE.TextureLoader(manager).load(
  ASSETS.fog,
  (t) => {
    t.colorSpace = THREE.SRGBColorSpace;
    t.minFilter = THREE.LinearFilter;
    t.magFilter = THREE.LinearFilter;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    fogTex = t;
    for (const m of fogMats) m.uniforms.uMap.value = fogTex;
  },
  undefined,
  () => console.warn("Fog texture missing/failed, using fallback fog texture.")
);

// Fog group around center model
const fogGroup = new THREE.Group();
scene.add(fogGroup);

function makeFogMaterial(){
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.NormalBlending,
    uniforms: {
      uMap:      { value: fogTex },
      uOpacity:  { value: 0.72 },
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
  fogMats.push(mat);
  return mat;
}

const fogPuffs = [];
(function createFog(){
  const puffCount = 58;
  const puffGeo = new THREE.PlaneGeometry(6.6, 6.6);

  for (let i=0;i<puffCount;i++){
    const mat = makeFogMaterial();
    mat.uniforms.uOpacity.value = 0.28 + Math.random()*0.46;

    const m = new THREE.Mesh(puffGeo, mat);
    m.userData = {
      ang: Math.random()*Math.PI*2,
      radius: 3.2 + Math.random()*9.8,
      yBase: -0.8 + Math.random()*8.0,
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

// Audio (loop + volume + muffled on panel open)
const audioState = {
  ctx:null, src:null, gain:null, filter:null,
  started:false,
  baseVolume: clamp01(parseFloat(localStorage.getItem("orbit_volume") ?? "0.52")),
  isMuffled:false
};

function createVolumeUI(){
  const wrap = document.createElement("div");
  Object.assign(wrap.style, {
    position:"fixed", left:"18px", bottom:"18px", zIndex:"25",
    pointerEvents:"auto", display:"flex", gap:"10px", alignItems:"center",
    padding:"10px 12px", borderRadius:"999px",
    background:"rgba(145,198,255,0.10)", border:"1px solid rgba(232,238,242,0.16)",
    backdropFilter:"blur(12px)",
    color:"rgba(232,238,242,0.92)",
    fontFamily:"ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial",
    fontSize:"12px", letterSpacing:"0.12em", textTransform:"uppercase", userSelect:"none"
  });

  const label = document.createElement("div"); label.textContent="VOL";
  const slider = document.createElement("input");
  slider.type="range"; slider.min="0"; slider.max="100";
  slider.value=String(Math.round(audioState.baseVolume*100));
  Object.assign(slider.style,{ width:"140px", accentColor:"#FCBA47", cursor:"pointer" });
  const pct = document.createElement("div"); pct.textContent=`${slider.value}%`; pct.style.opacity="0.78";

  slider.addEventListener("input", () => {
    audioState.baseVolume = clamp01(parseInt(slider.value,10)/100);
    localStorage.setItem("orbit_volume", String(audioState.baseVolume));
    pct.textContent = `${slider.value}%`;
    applyAudioTargets();
  });

  wrap.appendChild(label); wrap.appendChild(slider); wrap.appendChild(pct);
  document.body.appendChild(wrap);
}
createVolumeUI();

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

// Tile textures (soft + palette)
function makeCoverTexture(){
  const w=1024, h=640;
  const c=document.createElement("canvas"); c.width=w; c.height=h;
  const ctx=c.getContext("2d");

  const g = ctx.createLinearGradient(0,0,w,h);
  g.addColorStop(0, "#91C6FF");
  g.addColorStop(0.45, "#6786A7");
  g.addColorStop(1, "#464C52");
  ctx.fillStyle=g;
  ctx.fillRect(0,0,w,h);

  ctx.globalAlpha=0.12;
  ctx.strokeStyle="#E8EEF2";
  ctx.lineWidth=2;
  for(let i=0;i<26;i++){
    const y=(i/26)*h;
    ctx.beginPath();
    ctx.moveTo(0, y + (Math.random()*10-5));
    ctx.lineTo(w, y + (Math.random()*10-5));
    ctx.stroke();
  }
  ctx.globalAlpha=1;

  ctx.strokeStyle="rgba(252,186,71,0.65)";
  ctx.lineWidth=12;
  ctx.strokeRect(30,30,w-60,h-60);

  ctx.strokeStyle="rgba(232,238,242,0.18)";
  ctx.lineWidth=6;
  ctx.strokeRect(56,56,w-112,h-112);

  const tex=new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy=8;
  return tex;
}

// Title texture (2D canvas texture, NOT billboarded)
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

  ctx.globalAlpha=0.85;
  ctx.fillStyle="rgba(252,186,71,0.75)";
  ctx.fillRect(94, h/2+62, Math.min(700, ctx.measureText(text.toUpperCase()).width), 6);
  ctx.globalAlpha=1;

  const tex=new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy=8;
  return tex;
}

// Tiles
const tileGroup = new THREE.Group();
scene.add(tileGroup);

const clickableMeshes = [];
const tileItems = [];

(function createTiles(){
  const coverTex = makeCoverTexture();

  for (let i=0;i<CHAPTERS.length;i++){
    const ch = CHAPTERS[i];

    const coverGeo = new THREE.PlaneGeometry(T.tileW, T.tileH, 30, 1);
    const coverMat = new THREE.ShaderMaterial({
      transparent:true,
      depthWrite:false,
      side:THREE.DoubleSide,
      uniforms:{
        uMap:{ value: coverTex },
        uOpacity:{ value: 0.0 },
        uCurve:{ value: T.tileCurve },
        uWobble:{ value: 0.0 }
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
          p.y += sin((uv.x * 3.14159) + uWobble) * 0.010;
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
    tileItems.push({ group:g, cover, title, chapter:ch, index:i });
  }
})();

// Model load
const gltfLoader = new GLTFLoader(manager);
function addFallbackModel(){
  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.75, 1.5, 10, 18),
    new THREE.MeshStandardMaterial({ color:PAL.text.getHex(), roughness:0.88, metalness:0.02 })
  );
  body.position.y = -0.45;
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
    model.position.y += -1.35;

    center.add(model);
  },
  undefined,
  () => addFallbackModel()
);

// Panel logic (muffle when open)
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

// Picking
const raycaster = new THREE.Raycaster();
const pointerNdc = new THREE.Vector2();

canvas.addEventListener("click", async (e) => {
  if (panel?.classList.contains("is-open")) return;

  await ensureAudio().catch(()=>{});
  applyAudioTargets();

  const rect = canvas.getBoundingClientRect();
  pointerNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  pointerNdc.y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);

  raycaster.setFromCamera(pointerNdc, camera);
  const hits = raycaster.intersectObjects(clickableMeshes, false);
  if (!hits.length) return;

  const ch = hits[0].object.userData.chapter;
  timeline.target = ch.progress;
  openPanel(ch).catch(()=>{});
});

// Chapters dots
let activeChapterId = null;
function buildChapterUI(){
  chaptersEl.innerHTML="";
  CHAPTERS.forEach((ch)=>{
    const dot=document.createElement("button");
    dot.type="button";
    dot.className="chapterDot";
    dot.title=ch.label;
    dot.addEventListener("click", ()=>{
      timeline.target = ch.progress;
      openPanel(ch).catch(()=>{});
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

// Timeline controls
const timeline = { value:0.02, target:0.02, velocity:0, lastInteractT:performance.now() };

function normalizeWheel(e){
  let dy = e.deltaY;
  if (e.deltaMode===1) dy*=16;
  else if (e.deltaMode===2) dy*=window.innerHeight;
  return dy;
}

window.addEventListener("wheel", (e)=>{
  e.preventDefault();
  timeline.lastInteractT = performance.now();
  timeline.velocity += normalizeWheel(e) * T.scrollSensitivity;
},{ passive:false });

let dragging=false, dragStartX=0, dragStartVel=0;
canvas.addEventListener("pointerdown",(e)=>{
  dragging=true;
  timeline.lastInteractT=performance.now();
  dragStartX=e.clientX;
  dragStartVel=timeline.velocity;
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener("pointermove",(e)=>{
  if(!dragging) return;
  timeline.lastInteractT=performance.now();
  const dx=(e.clientX-dragStartX)/Math.max(1,window.innerWidth);
  timeline.velocity = dragStartVel - dx * T.dragSensitivity;
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

const vToCam = new THREE.Vector3();
const outwardDir = new THREE.Vector3();

requestAnimationFrame(tick);
function tick(){
  const dt = Math.min(0.033, clock.getDelta());
  const time = clock.getElapsedTime();

  timeline.velocity *= Math.pow(T.inertia, dt*60);
  timeline.target = clamp01(timeline.target + timeline.velocity);
  timeline.value = THREE.MathUtils.lerp(timeline.value, timeline.target, T.lerp);

  const idleMs = performance.now() - timeline.lastInteractT;
  if(!dragging && idleMs>820){
    const near = nearestChapter(timeline.value);
    timeline.target = THREE.MathUtils.lerp(timeline.target, near.progress, 0.010);
    if(activeChapterId !== near.id){
      activeChapterId = near.id;
      setActiveDot(activeChapterId);
      hintEl.textContent = `${near.label} • Click tile to open`;
    }
  }

  const azimuth = (timeline.value*T.orbitTurns)*Math.PI*2 + 1.06;
  const camY = T.camYBase + Math.sin(timeline.value*Math.PI*2)*T.camYAmplitude;

  camera.position.set(Math.cos(azimuth)*T.camRadius, camY, Math.sin(azimuth)*T.camRadius);
  camera.lookAt(0, T.lookY, 0);

  bg.rotation.y = azimuth*0.10 + 0.35;
  bg.rotation.x = Math.sin(azimuth*0.08)*0.020;

  // Fog motion (swirly around center)
  fogGroup.rotation.y += dt*0.050;
  fogGroup.position.x = Math.sin(time*0.18)*0.85 + Math.sin(time*0.53)*0.35;
  fogGroup.position.z = Math.cos(time*0.16)*0.85 + Math.cos(time*0.49)*0.35;

  for(const m of fogPuffs){
    const d=m.userData;
    d.ang += dt*d.speed;

    const driftX = Math.sin(time*0.22 + d.seed)*d.drift;
    const driftZ = Math.cos(time*0.20 + d.seed)*d.drift;
    const breath = Math.sin(time*0.15 + d.seed)*0.90;
    const y = d.yBase + Math.sin(time*0.70 + d.seed)*d.bobAmp;

    m.position.set(
      Math.cos(d.ang)*(d.radius + breath) + driftX,
      y,
      Math.sin(d.ang)*(d.radius + breath) + driftZ
    );

    m.rotation.z += dt*d.spin;
    m.scale.setScalar(d.scaleBase*(0.92 + 0.18*Math.sin(time*0.35 + d.seed)));
    m.lookAt(camera.position);
  }

  // Tiles corkscrew orbit (closer + big + 40° tilt with slight straighten near camera)
  const centerIdx = progressToIndex(timeline.value);

  for(const item of tileItems){
    const { group, cover, title, index } = item;
    const rel = index - centerIdx;

    const y = T.spiralYOffset - rel*T.spiralYStep + Math.sin(time*0.9 + index*0.6)*0.06;
    const ang = azimuth + rel*T.tileAngleStep;

    const frontBoost = (1.0 - Math.min(1.0, Math.abs(rel))) * T.frontPush;
    const r = T.spiralRadius + Math.abs(rel)*T.radiusGrow + frontBoost;

    group.position.set(Math.cos(ang)*r, y, Math.sin(ang)*r);

    // outward facing (NOT camera)
    group.lookAt(0, y, 0);
    group.rotateY(Math.PI);

    // visibility
    const dAbs = Math.abs(rel);
    const vis = 1.0 - smoothstep(
      T.visibleRange - T.fadeSoftness,
      T.visibleRange + T.fadeSoftness,
      dAbs
    );

    cover.material.uniforms.uOpacity.value = clamp01(vis);
    cover.material.uniforms.uWobble.value = time*1.1 + timeline.velocity*30.0;

    // camera relation
    vToCam.copy(camera.position).sub(group.position).normalize();

    // outward direction (used for “near camera” / facing)
    outwardDir.set(Math.cos(ang), 0, Math.sin(ang));
    const facing = clamp01(outwardDir.dot(vToCam)); // 1 near/front side

    // distance influence (helps the straighten feel)
    const dist = camera.position.distanceTo(group.position);
    const distN = clamp01(1 - (dist - 10) / 14); // ~1 near, ~0 far

    // straighten factor (never goes full)
    const straighten = clamp01(smoothstep(0.35, 0.90, facing) * distN);

    // tilt: 40° normally, but relax to ~22° near camera (never fully flat)
    const baseTilt = THREE.MathUtils.degToRad(T.folderTiltDeg);
    const nearTilt = THREE.MathUtils.degToRad(T.folderNearTiltDeg);
    const tilt = THREE.MathUtils.lerp(baseTilt, nearTilt, straighten);

    // Apply the “downward corkscrew tilt”
    group.rotateX(tilt);

    // Title fade (2D, not billboarded, fades when not facing camera)
    title.material.opacity = clamp01(smoothstep(0.12, 0.56, facing) * vis);
  }

  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}
