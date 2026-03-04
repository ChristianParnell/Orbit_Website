// =======================
// Fog (JPG black -> transparent) — STRONG + always visible
// =======================
const fogGroup = new THREE.Group();
scene.add(fogGroup);

// tiny helper: show missing fog as on-screen hint
function fogWarn(msg) {
  console.warn(msg);
  if (hintEl) hintEl.textContent = `Fog: ${msg}`;
}

const fogTex = new THREE.TextureLoader(manager).load(
  ASSETS.fog,
  (t) => {
    t.colorSpace = THREE.SRGBColorSpace;
    t.minFilter = THREE.LinearFilter;
    t.magFilter = THREE.LinearFilter;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(1.0, 1.0);
  },
  undefined,
  () => fogWarn(`failed to load ${ASSETS.fog} (check path + filename case)`)
);

// shader: key black out using luminance, but with SUPER forgiving thresholds
function makeFogMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: false,                 // ✅ IMPORTANT: fog always renders
    blending: THREE.NormalBlending,   // more visible than additive
    uniforms: {
      uMap: { value: fogTex },
      uOpacity: { value: 0.55 },      // ✅ stronger
      uBlackCut: { value: 0.02 },     // ✅ lower cutoff so dark fog survives
      uSoft: { value: 0.70 },         // ✅ smoother fade
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

        // black -> transparent (forgiving)
        float a = smoothstep(uBlackCut, uBlackCut + uSoft, luma);

        // softer edges so it feels like fog
        float edge = smoothstep(0.02, 0.25, vUv.x) * smoothstep(0.02, 0.25, vUv.y) *
                     smoothstep(0.02, 0.25, 1.0 - vUv.x) * smoothstep(0.02, 0.25, 1.0 - vUv.y);
        a *= edge;

        if(a < 0.01) discard;
        gl_FragColor = vec4(uTint, a * uOpacity);
      }
    `
  });
}

const fogPuffs = [];
const fogBelt = [];

(function createFog() {
  // 1) “belt” around the center so you ALWAYS see fog
  const beltCount = 10;
  const beltGeo = new THREE.PlaneGeometry(7.5, 4.6, 1, 1);
  for (let i = 0; i < beltCount; i++) {
    const mat = makeFogMaterial();
    mat.uniforms.uOpacity.value = 0.42; // belt is subtle but present

    const m = new THREE.Mesh(beltGeo, mat);

    const ang = (i / beltCount) * Math.PI * 2;
    const radius = 4.2;
    const yBase = 1.2;

    m.userData = {
      kind: "belt",
      ang,
      radius,
      yBase,
      spin: (Math.random() * 2 - 1) * 0.08,
      seed: Math.random() * 1000,
    };

    m.position.set(Math.cos(ang) * radius, yBase, Math.sin(ang) * radius);
    m.rotation.z = Math.random() * Math.PI * 2;
    fogGroup.add(m);
    fogBelt.push(m);
  }

  // 2) drifting puffs (the “alive” fog)
  const puffCount = 34;
  const puffGeo = new THREE.PlaneGeometry(3.4, 3.4, 1, 1);

  for (let i = 0; i < puffCount; i++) {
    const mat = makeFogMaterial();
    mat.uniforms.uOpacity.value = 0.28 + Math.random() * 0.28; // ✅ stronger

    const m = new THREE.Mesh(puffGeo, mat);

    const radius = 2.2 + Math.random() * 7.0;
    const ang = Math.random() * Math.PI * 2;
    const yBase = -0.8 + Math.random() * 6.0;

    m.userData = {
      kind: "puff",
      radius,
      ang,
      yBase,
      speed: 0.05 + Math.random() * 0.14,
      bobAmp: 0.20 + Math.random() * 0.55,
      spin: (Math.random() * 2 - 1) * 0.22,
      drift: 0.25 + Math.random() * 0.70,
      scaleBase: 0.85 + Math.random() * 1.8,
      seed: Math.random() * 1000
    };

    m.scale.setScalar(m.userData.scaleBase);
    fogGroup.add(m);
    fogPuffs.push(m);
  }

  fogGroup.position.y = 0.0;
})();