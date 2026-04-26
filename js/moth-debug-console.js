function clamp01(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  if (n <= 0) return 0;
  if (n >= 1) return 1;
  return n;
}

function getByPath(obj, path) {
  if (!obj) return undefined;
  let cur = obj;
  for (const key of path) {
    if (cur == null) return undefined;
    cur = cur[key];
  }
  return cur;
}

function firstDefined(obj, candidates) {
  for (const candidate of candidates) {
    if (typeof candidate === "function") {
      try {
        const value = candidate(obj);
        if (value !== undefined && value !== null) return value;
      } catch {}
      continue;
    }
    const value = getByPath(obj, candidate);
    if (value !== undefined && value !== null) return value;
  }
  return undefined;
}

function toNumber(value, fallback = undefined) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function inferMagnitude(vec) {
  if (!vec || typeof vec !== "object") return undefined;
  const x = Number(vec.x ?? 0);
  const y = Number(vec.y ?? 0);
  const z = Number(vec.z ?? 0);
  if (![x, y, z].every(Number.isFinite)) return undefined;
  return Math.sqrt(x * x + y * y + z * z);
}

function boolText(value) {
  return value ? "yes" : "no";
}

function buildSnapshot(mothSystem) {
  if (!mothSystem) return null;

  const vitality = clamp01(firstDefined(mothSystem, [
    ["vitality"],
    ["state", "vitality"],
    ["debugState", "vitality"]
  ]) ?? 0);

  const signal = clamp01(firstDefined(mothSystem, [
    ["signalLevel"],
    ["signal"],
    ["state", "signalLevel"],
    ["debugState", "signal"],
    () => mothSystem.satiatedUntil ? Math.min(1, Math.max(0, (Number(mothSystem.satiatedUntil) || 0) - (performance.now() / 1000)) / 8) : undefined
  ]) ?? 0);

  const fatigue = clamp01(firstDefined(mothSystem, [
    ["fatigue"],
    ["fatigueLevel"],
    ["state", "fatigue"],
    ["debugState", "fatigue"]
  ]) ?? 0);

  const trust = clamp01(firstDefined(mothSystem, [
    ["trust"],
    ["trustLevel"],
    ["bond"],
    ["debugState", "trust"]
  ]) ?? 0);

  const aggression = clamp01(firstDefined(mothSystem, [
    ["aggression"],
    ["aggressionLevel"],
    ["aggro"],
    ["debugState", "aggression"],
    (m) => {
      const mode = String(m.mode || "").toLowerCase();
      if (!mode) return undefined;
      if (mode.includes("flee") || mode.includes("attack") || mode.includes("void")) return 0.8;
      if (mode.includes("patrol")) return 0.18;
      if (mode.includes("perch")) return 0.08;
      return 0.3;
    }
  ]) ?? 0);

  const corruption = clamp01(firstDefined(mothSystem, [
    ["corruption"],
    ["corruptionLevel"],
    ["state", "corruption"],
    ["debugState", "corruption"],
    (m) => m.voidState?.active ? 0.4 : undefined
  ]) ?? 0);

  const fragments = clamp01(firstDefined(mothSystem, [
    ["fragmentCharge"],
    ["fragments"],
    ["fragmentLevel"],
    ["state", "fragmentCharge"],
    ["debugState", "fragments"]
  ]) ?? 0);

  const residue = clamp01(firstDefined(mothSystem, [
    ["residueLevel"],
    ["avgResidue"],
    ["debugState", "residue"],
    (m) => {
      const covers = m.coverResidue || m.coverResidues || m.residueByCover;
      if (!covers) return undefined;
      const values = Array.isArray(covers)
        ? covers.map((entry) => Number(entry?.level ?? entry ?? 0)).filter(Number.isFinite)
        : Object.values(covers).map((entry) => Number(entry?.level ?? entry ?? 0)).filter(Number.isFinite);
      if (!values.length) return 0;
      return values.reduce((a, b) => a + b, 0) / values.length;
    }
  ]) ?? 0);

  const hunger = clamp01(firstDefined(mothSystem, [
    ["hunger"],
    ["hungerLevel"],
    ["debugState", "hunger"],
    () => 1 - vitality * 0.75 - signal * 0.25
  ]) ?? 0);

  const speed = toNumber(firstDefined(mothSystem, [
    ["speed"],
    ["debugState", "speed"],
    (m) => inferMagnitude(m.velocity)
  ]), 0) || 0;

  const mode = String(firstDefined(mothSystem, [
    ["mode"],
    ["state", "mode"],
    ["debugState", "mode"]
  ]) ?? "unknown");

  const action = String(firstDefined(mothSystem, [
    ["currentActionKey"],
    ["pendingActionKey"],
    ["debugState", "action"]
  ]) ?? "none");

  const nests = toNumber(firstDefined(mothSystem, [
    (m) => Array.isArray(m.nests) ? m.nests.length : undefined,
    ["debugState", "nests"]
  ]), 0) || 0;

  const ready = Boolean(firstDefined(mothSystem, [
    ["ready"],
    ["debugState", "ready"]
  ]));

  const visible = Boolean(firstDefined(mothSystem, [
    ["visible"],
    (m) => m.root?.visible
  ]));

  const perched = Boolean(firstDefined(mothSystem, [
    ["perched"],
    ["debugState", "perched"]
  ]));

  const voidActive = Boolean(firstDefined(mothSystem, [
    (m) => m.voidState?.active,
    ["debugState", "voidActive"]
  ]));

  return {
    hunger,
    signal,
    fatigue,
    trust,
    aggression,
    corruption,
    vitality,
    fragments,
    residue,
    mode,
    action,
    ready,
    visible,
    perched,
    voidActive,
    nests,
    speed
  };
}

function createBarRow(label, accent) {
  const row = document.createElement("div");
  row.style.display = "grid";
  row.style.gridTemplateColumns = "58px 1fr 42px";
  row.style.alignItems = "center";
  row.style.gap = "8px";
  row.style.fontSize = "11px";
  row.style.lineHeight = "1";
  row.style.margin = "0 0 7px 0";

  const labelEl = document.createElement("div");
  labelEl.textContent = label.toUpperCase();
  labelEl.style.opacity = "0.82";
  labelEl.style.letterSpacing = "0.11em";
  labelEl.style.whiteSpace = "nowrap";

  const track = document.createElement("div");
  track.style.position = "relative";
  track.style.height = "7px";
  track.style.borderRadius = "999px";
  track.style.background = "rgba(255,255,255,0.08)";
  track.style.overflow = "hidden";
  track.style.boxShadow = "inset 0 0 0 1px rgba(255,255,255,0.06)";

  const fill = document.createElement("div");
  fill.style.position = "absolute";
  fill.style.left = "0";
  fill.style.top = "0";
  fill.style.bottom = "0";
  fill.style.width = "0%";
  fill.style.borderRadius = "999px";
  fill.style.background = accent;
  fill.style.boxShadow = `0 0 12px ${accent}`;
  fill.style.transition = "width 120ms linear, opacity 120ms linear";

  const valueEl = document.createElement("div");
  valueEl.textContent = "0%";
  valueEl.style.textAlign = "right";
  valueEl.style.opacity = "0.92";
  valueEl.style.fontVariantNumeric = "tabular-nums";

  track.appendChild(fill);
  row.append(labelEl, track, valueEl);

  return {
    row,
    set(value) {
      const pct = Math.round(clamp01(value) * 100);
      fill.style.width = `${pct}%`;
      fill.style.opacity = pct <= 2 ? "0.25" : "1";
      valueEl.textContent = `${pct}%`;
    }
  };
}

function createInfoRow(label) {
  const row = document.createElement("div");
  row.style.display = "grid";
  row.style.gridTemplateColumns = "58px 1fr";
  row.style.gap = "8px";
  row.style.fontSize = "11px";
  row.style.margin = "0 0 5px 0";

  const labelEl = document.createElement("div");
  labelEl.textContent = label.toUpperCase();
  labelEl.style.opacity = "0.65";
  labelEl.style.letterSpacing = "0.11em";

  const valueEl = document.createElement("div");
  valueEl.textContent = "-";
  valueEl.style.textAlign = "right";
  valueEl.style.fontVariantNumeric = "tabular-nums";
  valueEl.style.overflow = "hidden";
  valueEl.style.textOverflow = "ellipsis";
  valueEl.style.whiteSpace = "nowrap";

  row.append(labelEl, valueEl);

  return {
    row,
    set(value) {
      valueEl.textContent = value;
    }
  };
}

export function mountMothDebugConsole(options = {}) {
  if (window.__orbitMothDebugConsole) return window.__orbitMothDebugConsole;

  const mountId = options.mountId || "orbit-moth-debug-console";
  const title = options.title || "Moth Console";
  const collapsedByDefault = options.collapsed !== false;
  const host = document.createElement("div");
  host.id = mountId;
  host.style.position = "fixed";
  host.style.top = "14px";
  host.style.right = "14px";
  host.style.zIndex = "99999";
  host.style.display = "flex";
  host.style.flexDirection = "column";
  host.style.alignItems = "flex-end";
  host.style.gap = "8px";
  host.style.pointerEvents = "auto";
  host.style.fontFamily = 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.textContent = "MOTH DEBUG";
  toggle.style.border = "0";
  toggle.style.cursor = "pointer";
  toggle.style.borderRadius = "999px";
  toggle.style.padding = "8px 12px";
  toggle.style.background = "rgba(5,10,18,0.92)";
  toggle.style.color = "#d8f6ff";
  toggle.style.boxShadow = "0 10px 28px rgba(0,0,0,0.34), inset 0 0 0 1px rgba(47,228,255,0.28)";
  toggle.style.backdropFilter = "blur(12px)";
  toggle.style.fontSize = "11px";
  toggle.style.letterSpacing = "0.14em";
  toggle.style.fontWeight = "700";

  const panel = document.createElement("section");
  panel.style.width = "285px";
  panel.style.maxWidth = "calc(100vw - 28px)";
  panel.style.borderRadius = "16px";
  panel.style.padding = "12px 12px 10px";
  panel.style.background = "linear-gradient(180deg, rgba(8,16,28,0.94), rgba(4,8,16,0.92))";
  panel.style.color = "#effbff";
  panel.style.boxShadow = "0 14px 38px rgba(0,0,0,0.42), inset 0 0 0 1px rgba(47,228,255,0.18)";
  panel.style.backdropFilter = "blur(14px)";
  panel.style.border = "1px solid rgba(255,255,255,0.06)";
  panel.style.overflow = "hidden";

  const header = document.createElement("div");
  header.style.display = "flex";
  header.style.justifyContent = "space-between";
  header.style.alignItems = "center";
  header.style.gap = "10px";
  header.style.marginBottom = "10px";

  const titleEl = document.createElement("div");
  titleEl.textContent = title;
  titleEl.style.fontSize = "12px";
  titleEl.style.fontWeight = "700";
  titleEl.style.letterSpacing = "0.15em";
  titleEl.style.color = "#bdf2ff";

  const statusEl = document.createElement("div");
  statusEl.textContent = "waiting";
  statusEl.style.fontSize = "10px";
  statusEl.style.letterSpacing = "0.14em";
  statusEl.style.padding = "5px 7px";
  statusEl.style.borderRadius = "999px";
  statusEl.style.background = "rgba(255,255,255,0.08)";
  statusEl.style.color = "#d7ecf4";

  header.append(titleEl, statusEl);

  const barsWrap = document.createElement("div");
  barsWrap.style.marginBottom = "8px";

  const barDefs = [
    ["Hunger", "linear-gradient(90deg, #f97316, #fb7185)"],
    ["Signal", "linear-gradient(90deg, #22d3ee, #3b82f6)"],
    ["Fatigue", "linear-gradient(90deg, #94a3b8, #e2e8f0)"],
    ["Trust", "linear-gradient(90deg, #10b981, #22c55e)"],
    ["Aggro", "linear-gradient(90deg, #ef4444, #f97316)"],
    ["Corrupt", "linear-gradient(90deg, #8b5cf6, #ec4899)"],
    ["Vitality", "linear-gradient(90deg, #84cc16, #22c55e)"],
    ["Fragments", "linear-gradient(90deg, #a855f7, #60a5fa)"],
    ["Residue", "linear-gradient(90deg, #64748b, #cbd5e1)"]
  ];

  const barMap = {};
  for (const [label, accent] of barDefs) {
    const row = createBarRow(label, accent);
    barMap[label.toLowerCase()] = row;
    barsWrap.appendChild(row.row);
  }

  const divider = document.createElement("div");
  divider.style.height = "1px";
  divider.style.margin = "9px 0 9px";
  divider.style.background = "linear-gradient(90deg, rgba(47,228,255,0.0), rgba(47,228,255,0.28), rgba(47,228,255,0.0))";

  const infoWrap = document.createElement("div");
  const infoDefs = ["Mode", "Action", "Perched", "Void", "Visible", "Ready", "Nests", "Speed"];
  const infoMap = {};
  for (const label of infoDefs) {
    const row = createInfoRow(label);
    infoMap[label.toLowerCase()] = row;
    infoWrap.appendChild(row.row);
  }

  panel.append(header, barsWrap, divider, infoWrap);
  host.append(toggle, panel);
  document.body.appendChild(host);

  let collapsed = collapsedByDefault;
  function applyCollapsedState() {
    panel.style.display = collapsed ? "none" : "block";
    toggle.textContent = collapsed ? "MOTH DEBUG" : "HIDE MOTH DEBUG";
  }
  toggle.addEventListener("click", () => {
    collapsed = !collapsed;
    applyCollapsedState();
  });
  applyCollapsedState();

  let externalMothSystem = null;

  const api = {
    setMothSystem(instance) {
      externalMothSystem = instance || null;
    }
  };

  function currentMothSystem() {
    return externalMothSystem || window.__orbitMothSystem || null;
  }

  function render() {
    const mothSystem = currentMothSystem();
    const snap = buildSnapshot(mothSystem);

    if (!snap) {
      statusEl.textContent = "offline";
      statusEl.style.background = "rgba(255,255,255,0.08)";
      statusEl.style.color = "#d7ecf4";
      for (const row of Object.values(barMap)) row.set(0);
      infoMap.mode.set("waiting");
      infoMap.action.set("-");
      infoMap.perched.set("-");
      infoMap.void.set("-");
      infoMap.visible.set("-");
      infoMap.ready.set("-");
      infoMap.nests.set("-");
      infoMap.speed.set("-");
      requestAnimationFrame(render);
      return;
    }

    statusEl.textContent = snap.ready ? "live" : "boot";
    statusEl.style.background = snap.ready ? "rgba(16,185,129,0.16)" : "rgba(59,130,246,0.14)";
    statusEl.style.color = snap.ready ? "#9bf6c6" : "#b7d7ff";

    barMap.hunger.set(snap.hunger);
    barMap.signal.set(snap.signal);
    barMap.fatigue.set(snap.fatigue);
    barMap.trust.set(snap.trust);
    barMap.aggro.set(snap.aggression);
    barMap.corrupt.set(snap.corruption);
    barMap.vitality.set(snap.vitality);
    barMap.fragments.set(snap.fragments);
    barMap.residue.set(snap.residue);

    infoMap.mode.set(snap.mode);
    infoMap.action.set(snap.action);
    infoMap.perched.set(boolText(snap.perched));
    infoMap.void.set(boolText(snap.voidActive));
    infoMap.visible.set(boolText(snap.visible));
    infoMap.ready.set(boolText(snap.ready));
    infoMap.nests.set(String(snap.nests));
    infoMap.speed.set(snap.speed.toFixed(2));

    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
  window.__orbitMothDebugConsole = api;
  return api;
}
