import * as THREE from "https://esm.sh/three@0.160.0";

export const DEFAULT_MOTH_PALETTE = [
  "#33ff88",
  "#2fe4ff",
  "#4b7dff",
  "#b04dff",
  "#ff57ce",
  "#ff8b2d",
  "#ffe166"
];

export const MOOD_PALETTES = {
  default: DEFAULT_MOTH_PALETTE,
  sad: ["#75c8ff", "#3f8dff", "#1e5cff", "#9cc9ff", "#4a6fd8", "#76f4ff", "#d9f3ff"],
  void: ["#8b5cff", "#00e7ff", "#ff57ce", "#2fe4ff", "#b04dff", "#ffffff", "#33ff88"],
  home: ["#33ff88", "#2fe4ff", "#d9fff0", "#72ffc5", "#4bffd2", "#ffffff", "#ffe166"],
  cursor: ["#ffffff", "#ffe166", "#2fe4ff", "#ff57ce", "#33ff88", "#b04dff", "#ff8b2d"]
};

export function clamp01(value) {
  return THREE.MathUtils.clamp(Number.isFinite(value) ? value : 0, 0, 1);
}

export function randRange(min, max) {
  return min + Math.random() * (max - min);
}

export function safeNumber(value, fallback = 0) {
  return Number.isFinite(value) ? value : fallback;
}

export function normalizeClipName(name = "") {
  return String(name)
    .toLowerCase()
    .replace(/[_\-]+/g, " ")
    .replace(/[^a-z0-9 ]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function scoreName(candidate, wanted) {
  const c = normalizeClipName(candidate);
  const w = normalizeClipName(wanted);
  if (!c || !w) return -1;
  if (c === w) return 1000;
  if (c.startsWith(w)) return 800 - Math.abs(c.length - w.length);
  if (c.includes(w)) return 600 - Math.abs(c.length - w.length);
  const cTokens = new Set(c.split(" "));
  const wTokens = w.split(" ").filter(Boolean);
  const overlap = wTokens.reduce((sum, token) => sum + (cTokens.has(token) ? 1 : 0), 0);
  return overlap ? overlap * 100 - Math.abs(cTokens.size - wTokens.length) * 4 : -1;
}

export function toColor(value, fallback = "#2fe4ff") {
  if (value?.isColor) return value.clone();
  try {
    return new THREE.Color(value ?? fallback);
  } catch {
    return new THREE.Color(fallback);
  }
}

export function ensurePalette(input, fallback = DEFAULT_MOTH_PALETTE) {
  const source = Array.isArray(input) && input.length ? input : fallback;
  const colors = source.slice(0, 7).map((entry, index) => toColor(entry, fallback[index % fallback.length]));
  while (colors.length < 7) colors.push(colors[colors.length % source.length]?.clone?.() ?? toColor(fallback[colors.length % fallback.length]));
  return colors;
}

export function clonePalette(palette) {
  return ensurePalette(palette).map((color) => color.clone());
}

export function lerpPalette(current, target, alpha) {
  const amount = clamp01(alpha);
  for (let i = 0; i < 7; i += 1) {
    if (!current[i]) current[i] = target[i]?.clone?.() ?? new THREE.Color("#ffffff");
    current[i].lerp(target[i] ?? current[i], amount);
  }
  return current;
}

export function setPaletteUniforms(material, palette) {
  if (!material?.uniforms) return;
  const colors = ensurePalette(palette);
  colors.forEach((color, index) => {
    const uniform = material.uniforms[`uColor${index}`];
    if (uniform) uniform.value.copy(color);
  });
}

export function buildAccentPalette(accent) {
  const base = toColor(accent, "#2fe4ff");
  const warm = base.clone().lerp(new THREE.Color("#ffffff"), 0.42);
  const deep = base.clone().lerp(new THREE.Color("#071323"), 0.38);
  const electric = base.clone().offsetHSL(0.10, 0.18, 0.12);
  const counter = base.clone().offsetHSL(0.52, 0.22, 0.08);
  return ensurePalette([base, warm, electric, counter, deep, "#ffffff", base.clone().offsetHSL(-0.08, 0.2, 0.1)]);
}

export function vectorFromObject(value, fallback = new THREE.Vector3()) {
  if (value?.isVector3) return value.clone();
  if (value && typeof value === "object") {
    return new THREE.Vector3(
      safeNumber(Number(value.x), fallback.x),
      safeNumber(Number(value.y), fallback.y),
      safeNumber(Number(value.z), fallback.z)
    );
  }
  return fallback.clone();
}

export function smoothStep(edge0, edge1, x) {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

export function disposeObject3D(object) {
  object?.traverse?.((child) => {
    if (child.geometry?.dispose) child.geometry.dispose();
    const mats = Array.isArray(child.material) ? child.material : child.material ? [child.material] : [];
    mats.forEach((mat) => {
      Object.values(mat).forEach((value) => {
        if (value?.isTexture && value.dispose) value.dispose();
      });
      if (mat.dispose) mat.dispose();
    });
  });
}

export function collectMeshes(root) {
  const meshes = [];
  root?.traverse?.((child) => {
    if (child?.isMesh && child.geometry) meshes.push(child);
  });
  return meshes;
}

export function estimateBounds(root) {
  const box = new THREE.Box3().setFromObject(root);
  if (box.isEmpty()) return { box, size: new THREE.Vector3(1, 1, 1), center: new THREE.Vector3() };
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);
  return { box, size, center };
}

export function randomPointInView(camera, orbitCenter, cfg = {}) {
  const forward = new THREE.Vector3();
  camera.getWorldDirection(forward);
  const right = new THREE.Vector3().crossVectors(forward, camera.up).normalize();
  const up = new THREE.Vector3().copy(camera.up).normalize();
  const distance = randRange(cfg.patrolFrontMin ?? 0.75, cfg.patrolFrontMax ?? 1.85);
  const side = randRange(-(cfg.patrolSideSpan ?? 2.8), cfg.patrolSideSpan ?? 2.8);
  const height = randRange(cfg.patrolHeightMin ?? -0.25, cfg.patrolHeightMax ?? 2.2);
  return new THREE.Vector3()
    .copy(camera.position)
    .addScaledVector(forward, distance)
    .addScaledVector(right, side)
    .addScaledVector(up, height)
    .lerp(orbitCenter, cfg.patrolCenterPull ?? 0.08);
}

export function makeId(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}_${Date.now().toString(36)}`;
}
