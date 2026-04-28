// Orbit Website — Moth Behaviour Stabilizer
// Drop into: js/moth-behaviour-stabilizer.js
// Purpose: smooth navigation, readable creature intent, and visible mood/state language.

const PATCHED_FLAG = Symbol.for("orbit.website.moth.behaviourStabilizer.v1");
const STATE_KEY = Symbol.for("orbit.website.moth.intentState.v1");

const STATE_VISUALS = {
  booting: {
    label: "BOOTING",
    primary: "#8ee7ff",
    secondary: "#b04dff",
    aura: 0.22,
    brightness: 1.08,
    alpha: 0.78,
  },
  patrolling: {
    label: "PATROLLING",
    primary: "#2fe4ff",
    secondary: "#33ff88",
    aura: 0.24,
    brightness: 1.0,
    alpha: 0.82,
  },
  curious: {
    label: "CURIOUS",
    primary: "#ff57ce",
    secondary: "#2fe4ff",
    aura: 0.46,
    brightness: 1.18,
    alpha: 0.94,
  },
  hungry: {
    label: "HUNGRY / SEARCHING",
    primary: "#ff8b2d",
    secondary: "#ffe166",
    aura: 0.36,
    brightness: 0.94,
    alpha: 0.72,
  },
  fed: {
    label: "FED / BRIGHT",
    primary: "#33ff88",
    secondary: "#2fe4ff",
    aura: 0.56,
    brightness: 1.34,
    alpha: 1.05,
  },
  safe: {
    label: "SAFE / NESTING",
    primary: "#b04dff",
    secondary: "#2fe4ff",
    aura: 0.34,
    brightness: 1.08,
    alpha: 0.90,
  },
  overwhelmed: {
    label: "OVERWHELMED",
    primary: "#4b7dff",
    secondary: "#d9f2ff",
    aura: 0.58,
    brightness: 0.86,
    alpha: 0.64,
  },
  corrupted: {
    label: "CORRUPTED",
    primary: "#ff57ce",
    secondary: "#6d2cff",
    aura: 0.62,
    brightness: 1.16,
    alpha: 0.88,
  },
  void: {
    label: "VOID DRAWN",
    primary: "#33ff88",
    secondary: "#0aff6c",
    aura: 0.70,
    brightness: 1.22,
    alpha: 1.0,
  },
  landing: {
    label: "LANDING",
    primary: "#ffe166",
    secondary: "#33ff88",
    aura: 0.42,
    brightness: 1.08,
    alpha: 0.94,
  },
  backflip: {
    label: "BACKFLIP // ANIMATION ONLY",
    primary: "#ffe166",
    secondary: "#ff57ce",
    aura: 0.76,
    brightness: 1.28,
    alpha: 1.0,
  },
};

function clamp01(value) {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Number.isFinite(value) ? value : min));
}

function smooth01(value) {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
}

function expAlpha(delta, response) {
  return 1 - Math.exp(-Math.max(0, delta) * Math.max(0.001, response));
}

function chooseStateKey(moth) {
  const mode = String(moth?.mode || "").toLowerCase();
  const mood = String(moth?.mood || "").toLowerCase();
  const combined = `${mode} ${mood}`;

  if (combined.includes("backflip")) return "backflip";
  if (combined.includes("corrupt")) return "corrupted";
  if (combined.includes("void") || combined.includes("inspect")) return "void";
  if (combined.includes("overwhelm") || combined.includes("flee")) return "overwhelmed";
  if (combined.includes("land") || combined.includes("approachcover")) return "landing";
  if (combined.includes("safe") || combined.includes("nest") || combined.includes("shelter")) return "safe";
  if (combined.includes("fed") || combined.includes("bright") || Number(moth?.vitality || 0) > 0.76) return "fed";
  if (combined.includes("hungry") || combined.includes("search") || Number(moth?.hunger || 0) > 0.62) return "hungry";
  if (combined.includes("curious") || combined.includes("investigate") || combined.includes("pointer")) return "curious";
  if (combined.includes("boot") || combined.includes("wake")) return "booting";
  return "patrolling";
}

function makeColor(THREE, value) {
  return new THREE.Color(value || "#2fe4ff");
}

function lerpMaterialColor(material, target, alpha) {
  if (!material) return;
  const mats = Array.isArray(material) ? material : [material];
  for (const mat of mats) {
    if (!mat) continue;
    if (mat.color?.lerp) mat.color.lerp(target, alpha * 0.55);
    if (mat.emissive?.lerp) {
      mat.emissive.lerp(target, alpha * 0.72);
      mat.emissiveIntensity = Math.max(Number(mat.emissiveIntensity || 0), 0.52);
    }
    mat.needsUpdate = true;
  }
}

function updatePaletteUniform(THREE, material, primaryHex, secondaryHex, alpha) {
  const uniform = material?.uniforms?.uPalette;
  const palette = uniform?.value;
  if (!Array.isArray(palette) || !palette.length) return;

  const primary = makeColor(THREE, primaryHex);
  const secondary = makeColor(THREE, secondaryHex);
  const calm = makeColor(THREE, "#2fe4ff");

  for (let i = 0; i < palette.length; i += 1) {
    const target = i % 3 === 0 ? primary : i % 3 === 1 ? secondary : calm;
    if (palette[i]?.lerp) palette[i].lerp(target, alpha);
    else palette[i] = target.clone();
  }
}

function safePushDebug(moth, level, message) {
  try {
    if (typeof moth?.pushDebugLine === "function") moth.pushDebugLine(level, message);
    else if (typeof moth?.log === "function") moth.log(message, level);
  } catch {
    // Debug should never break the moth.
  }
}

function tuneConfig(moth) {
  if (!moth?.cfg || moth[STATE_KEY]?.configTuned) return;

  Object.assign(moth.cfg, {
    // Slower, readable navigation. This prevents sudden tiny re-targets becoming violent movement.
    patrolRepickMin: Math.max(Number(moth.cfg.patrolRepickMin || 0), 3.8),
    patrolRepickMax: Math.max(Number(moth.cfg.patrolRepickMax || 0), 6.4),
    approachSlowRadius: Math.max(Number(moth.cfg.approachSlowRadius || 0), 0.72),
    landTriggerDistance: Math.max(Number(moth.cfg.landTriggerDistance || 0), 0.16),
    pointerCuriosityCooldown: Math.max(Number(moth.cfg.pointerCuriosityCooldown || 0), 0.45),
    investigateCoverDuration: Math.max(Number(moth.cfg.investigateCoverDuration || 0), 1.9),
    investigateCoverRadius: Math.max(Number(moth.cfg.investigateCoverRadius || 0), 0.24),
    investigateCoverSpeed: Math.min(Number(moth.cfg.investigateCoverSpeed || 3.2), 1.55),
    voidCautionOrbitDuration: Math.max(Number(moth.cfg.voidCautionOrbitDuration || 0), 2.35),
    voidCautionOrbitRadius: Math.max(Number(moth.cfg.voidCautionOrbitRadius || 0), 0.42),

    // Panic thresholds are intentionally higher. The moth should show discomfort before fleeing.
    overwhelmAggressionThreshold: Math.max(Number(moth.cfg.overwhelmAggressionThreshold || 0), 0.82),
    overwhelmFatigueThreshold: Math.max(Number(moth.cfg.overwhelmFatigueThreshold || 0), 0.94),
    voidCorruptionFleeThreshold: Math.max(Number(moth.cfg.voidCorruptionFleeThreshold || 0), 0.92),
    overwhelmDurationMin: Math.max(Number(moth.cfg.overwhelmDurationMin || 0), 2.2),
    overwhelmDurationMax: Math.max(Number(moth.cfg.overwhelmDurationMax || 0), 4.2),

    // Keep the debug HUD available, but make the moth itself the state indicator.
    debugOverlay: moth.cfg.debugOverlay !== false,
  });

  moth[STATE_KEY].configTuned = true;
}

function ensureIntentState(moth, THREE) {
  if (!moth) return null;
  if (!moth[STATE_KEY]) {
    moth[STATE_KEY] = {
      configTuned: false,
      navTarget: null,
      velocity: null,
      heading: new THREE.Vector3(0, 0, -1),
      lastStateKey: "booting",
      statePulse: 0,
      aura: null,
      auraLight: null,
      backflipLock: null,
      pointerLatch: null,
      coverLatch: null,
      installedAt: typeof performance !== "undefined" ? performance.now() / 1000 : 0,
    };
  }
  tuneConfig(moth);
  ensureAura(moth, THREE);
  return moth[STATE_KEY];
}

function ensureAura(moth, THREE) {
  const state = moth?.[STATE_KEY];
  if (!state || state.aura || !moth.root) return;

  const auraMaterial = new THREE.MeshBasicMaterial({
    color: new THREE.Color("#2fe4ff"),
    transparent: true,
    opacity: 0.0,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  });

  const aura = new THREE.Mesh(new THREE.TorusGeometry(0.23, 0.008, 10, 80), auraMaterial);
  aura.name = "MothIntentAura_StateVisible";
  aura.rotation.x = Math.PI * 0.5;
  aura.position.set(0, 0.035, 0);
  aura.renderOrder = 999;
  moth.root.add(aura);

  const auraLight = new THREE.PointLight(0x2fe4ff, 0.0, 1.2, 2.0);
  auraLight.name = "MothIntentAura_Light";
  auraLight.position.set(0, 0.08, 0);
  moth.root.add(auraLight);

  state.aura = aura;
  state.auraLight = auraLight;
}

function applyStateVisuals(moth, THREE, delta = 1 / 60, elapsed = 0) {
  const state = ensureIntentState(moth, THREE);
  if (!state) return;

  const stateKey = chooseStateKey(moth);
  const visual = STATE_VISUALS[stateKey] || STATE_VISUALS.patrolling;
  const alpha = expAlpha(delta, 5.5);
  const primary = makeColor(THREE, visual.primary);
  const secondary = makeColor(THREE, visual.secondary);

  if (stateKey !== state.lastStateKey) {
    state.statePulse = 1;
    safePushDebug(moth, "VISUAL", `${STATE_VISUALS[state.lastStateKey]?.label || state.lastStateKey} → ${visual.label}`);
    state.lastStateKey = stateKey;
  }
  state.statePulse = Math.max(0, state.statePulse - delta * 1.65);

  updatePaletteUniform(THREE, moth.binaryMaterial, visual.primary, visual.secondary, alpha);
  updatePaletteUniform(THREE, moth.outlineMaterial, visual.secondary, visual.primary, alpha);

  if (moth.binaryMaterial?.uniforms) {
    if (moth.binaryMaterial.uniforms.uBrightness) {
      const current = Number(moth.binaryMaterial.uniforms.uBrightness.value || 1);
      const target = (Number(moth.cfg?.binaryBrightness || 1.42) * visual.brightness) + state.statePulse * 0.34;
      moth.binaryMaterial.uniforms.uBrightness.value = THREE.MathUtils.lerp(current, target, alpha);
    }
    if (moth.binaryMaterial.uniforms.uAlphaBoost) {
      const current = Number(moth.binaryMaterial.uniforms.uAlphaBoost.value || 1);
      moth.binaryMaterial.uniforms.uAlphaBoost.value = THREE.MathUtils.lerp(current, visual.alpha, alpha);
    }
  }

  if (moth.outlineMaterial?.uniforms) {
    if (moth.outlineMaterial.uniforms.uBrightness) {
      const current = Number(moth.outlineMaterial.uniforms.uBrightness.value || 1);
      const target = (Number(moth.cfg?.outlineBrightness || 2.05) * visual.brightness) + state.statePulse * 0.45;
      moth.outlineMaterial.uniforms.uBrightness.value = THREE.MathUtils.lerp(current, target, alpha);
    }
    if (moth.outlineMaterial.uniforms.uAlpha) {
      const current = Number(moth.outlineMaterial.uniforms.uAlpha.value || 1);
      moth.outlineMaterial.uniforms.uAlpha.value = THREE.MathUtils.lerp(current, Math.min(1.25, visual.alpha + 0.08), alpha);
    }
  }

  if (moth.modelRoot?.traverse) {
    moth.modelRoot.traverse((child) => {
      if (child?.material) lerpMaterialColor(child.material, primary, alpha * 0.62);
    });
  }

  if (state.aura) {
    const pulse = 1 + state.statePulse * 0.42 + Math.sin(elapsed * 2.2) * 0.035;
    state.aura.material.color.lerp(primary, alpha);
    state.aura.material.opacity = THREE.MathUtils.lerp(
      Number(state.aura.material.opacity || 0),
      clamp(visual.aura + state.statePulse * 0.20, 0.0, 0.86),
      alpha,
    );
    state.aura.scale.setScalar(THREE.MathUtils.lerp(state.aura.scale.x || 1, pulse, alpha));
    state.aura.rotation.z += delta * (stateKey === "void" ? 1.2 : stateKey === "curious" ? 0.72 : 0.28);
  }

  if (state.auraLight) {
    state.auraLight.color.lerp(secondary, alpha);
    state.auraLight.intensity = THREE.MathUtils.lerp(
      Number(state.auraLight.intensity || 0),
      clamp(visual.aura * 0.58 + state.statePulse * 0.25, 0, 0.75),
      alpha,
    );
  }

  moth.intentVisualLabel = visual.label;
}

function chooseSmoothFleeTarget(moth, THREE) {
  const camForward = new THREE.Vector3(0, 0, -1).applyQuaternion(moth.camera.quaternion).normalize();
  const camRight = new THREE.Vector3(1, 0, 0).applyQuaternion(moth.camera.quaternion).normalize();
  const side = Math.random() > 0.5 ? 1 : -1;
  const target = new THREE.Vector3()
    .copy(moth.orbitCenter || new THREE.Vector3())
    .addScaledVector(camForward, 0.82)
    .addScaledVector(camRight, side * 0.78);

  const minY = Number(moth.cfg?.patrolHeightMin ?? -0.1);
  const maxY = Number(moth.cfg?.patrolHeightMax ?? 1.55);
  target.y = (moth.orbitCenter?.y || 0) + THREE.MathUtils.lerp(minY + 0.52, maxY + 0.16, Math.random());

  if (typeof moth.clampPointNearCenter === "function") moth.clampPointNearCenter(target);
  return target;
}

function lockBackflipPose(moth, THREE, elapsed) {
  const state = ensureIntentState(moth, THREE);
  if (!state) return;
  if (!state.backflipLock) {
    state.backflipLock = {
      position: moth.root?.position?.clone?.() || new THREE.Vector3(),
      quaternion: moth.root?.quaternion?.clone?.() || new THREE.Quaternion(),
      startedAt: elapsed,
      endsAt: elapsed + Math.max(0.7, Number(moth.actionDurations?.get?.("backflip") || 1.05)),
    };
  }
  if (moth.root) {
    moth.root.position.copy(state.backflipLock.position);
    moth.root.quaternion.copy(state.backflipLock.quaternion);
  }
}

function finishBackflipIfDone(moth, THREE, elapsed) {
  const state = ensureIntentState(moth, THREE);
  const lock = state?.backflipLock;
  if (!lock || elapsed < lock.endsAt) return false;

  state.backflipLock = null;
  moth.flipBusy = false;
  moth.backflipState = null;
  if (typeof moth.setMode === "function") moth.setMode("patrol", "backflip animation finished");
  if (typeof moth.playLoop === "function") {
    const action = typeof moth.getPatrolFlightAction === "function" ? moth.getPatrolFlightAction() : "fly";
    moth.playLoop(action);
  }
  if (typeof moth.pickNextPatrolPoint === "function") moth.pickNextPatrolPoint();
  return true;
}

function startPureBackflip(moth, THREE, elapsed, reason = "single click") {
  const state = ensureIntentState(moth, THREE);
  if (!state || !moth.root) return false;

  state.backflipLock = null;
  lockBackflipPose(moth, THREE, elapsed);
  moth.flipBusy = true;
  moth.backflipState = {
    startedAt: elapsed,
    endsAt: state.backflipLock.endsAt,
    animationOnly: true,
  };

  if (typeof moth.setMode === "function") moth.setMode("backflip", `${reason} · animation only`);
  if (typeof moth.playOnce === "function") moth.playOnce("backflip", typeof moth.getPatrolFlightAction === "function" ? moth.getPatrolFlightAction() : "fly");
  else if (typeof moth.playLoop === "function") moth.playLoop("backflip");

  safePushDebug(moth, "BACKFLIP", "locked world transform; FBX clip only");
  return true;
}

function rayHitsMoth(moth, THREE, event) {
  if (!moth?.camera || !moth?.renderer?.domElement || !moth.hitProxy || !event) return false;
  const bounds = moth.renderer.domElement.getBoundingClientRect();
  const pointer = new THREE.Vector2(
    ((Number(event.clientX || 0) - bounds.left) / Math.max(1, bounds.width)) * 2 - 1,
    -((Number(event.clientY || 0) - bounds.top) / Math.max(1, bounds.height)) * 2 + 1,
  );
  const raycaster = moth.temp?.raycaster || new THREE.Raycaster();
  raycaster.setFromCamera(pointer, moth.camera);
  const hits = raycaster.intersectObject(moth.hitProxy, true);
  return hits.length > 0;
}

function patchMethod(proto, name, replacement) {
  const original = typeof proto[name] === "function" ? proto[name] : null;
  proto[name] = replacement(original);
}

export function installMothBehaviourStabilizer(MothSystem, THREE) {
  if (!MothSystem?.prototype || !THREE) {
    console.warn("[MothBehaviourStabilizer] Missing MothSystem or THREE.");
    return false;
  }

  const proto = MothSystem.prototype;
  if (proto[PATCHED_FLAG]) return true;
  proto[PATCHED_FLAG] = true;

  patchMethod(proto, "load", (original) => function patchedLoad(...args) {
    ensureIntentState(this, THREE);
    safePushDebug(this, "PATCH", "intent stabilizer active");
    return original ? original.apply(this, args) : undefined;
  });

  patchMethod(proto, "setMode", (original) => function patchedSetMode(nextMode, reason = "") {
    ensureIntentState(this, THREE);
    const previous = this.mode;
    let result;
    if (original) result = original.call(this, nextMode, reason);
    else {
      if (!nextMode || this.mode === nextMode) return false;
      this.mode = nextMode;
      this.behaviourNote = reason || nextMode;
      result = true;
    }
    if (previous !== this.mode) {
      const state = this[STATE_KEY];
      if (state) state.statePulse = 1;
    }
    return result;
  });

  patchMethod(proto, "moveToward", (original) => function patchedMoveToward(delta, target, speed = 1) {
    const state = ensureIntentState(this, THREE);
    if (!this.root?.position || !target?.isVector3) {
      return original ? original.call(this, delta, target, speed) : undefined;
    }

    const dt = clamp(delta, 0.001, 0.05);
    if (!state.navTarget) state.navTarget = target.clone();
    if (!state.velocity) state.velocity = this.velocity?.clone?.() || new THREE.Vector3();

    const mode = String(this.mode || "").toLowerCase();
    const targetResponse = mode.includes("landing") ? 9.5 : mode.includes("void") ? 4.8 : 3.2;
    state.navTarget.lerp(target, expAlpha(dt, targetResponse));

    const toTarget = state.navTarget.clone().sub(this.root.position);
    const distance = toTarget.length();
    const slowRadius = Math.max(0.12, Number(this.cfg?.approachSlowRadius || 0.72));
    const arrive = smooth01(distance / slowRadius);
    const intentSpeed = Math.max(0.05, Number(speed || this.cfg?.flySpeed || 1));
    const maxSpeed = intentSpeed * THREE.MathUtils.lerp(0.24, 1.0, arrive);
    const desiredVelocity = distance > 0.0001
      ? toTarget.multiplyScalar(Math.min(maxSpeed, distance / dt) / distance)
      : new THREE.Vector3();

    const response = mode.includes("landing") ? 7.8 : mode.includes("flee") ? 3.2 : 4.15;
    state.velocity.lerp(desiredVelocity, expAlpha(dt, response));

    // Hard clamp removes frame spikes from scroll/drag and tab-focus stalls.
    const maxStep = Math.max(0.005, intentSpeed * dt * 1.15);
    const step = state.velocity.clone().multiplyScalar(dt);
    if (step.length() > maxStep) step.setLength(maxStep);
    if (step.length() > distance && distance > 0.0001) step.copy(state.navTarget).sub(this.root.position);

    this.root.position.add(step);
    if (!this.velocity) this.velocity = new THREE.Vector3();
    this.velocity.copy(state.velocity);

    return this.root.position;
  });

  patchMethod(proto, "lookAtDirection", (original) => function patchedLookAtDirection(direction, turnLerp) {
    const state = ensureIntentState(this, THREE);
    if (!direction?.isVector3 || direction.lengthSq() < 0.00001) {
      return original ? original.call(this, direction, turnLerp) : undefined;
    }

    const dt = clamp(this.lastDelta || 1 / 60, 0.001, 0.05);
    state.heading.lerp(direction.clone().normalize(), expAlpha(dt, 4.2)).normalize();
    const calmerTurn = Math.min(Number(turnLerp || this.cfg?.turnLerp || 0.18), 0.16);
    return original ? original.call(this, state.heading, calmerTurn) : undefined;
  });

  patchMethod(proto, "handleInteractionPointerMove", (original) => function patchedPointerMove(event) {
    const result = original ? original.call(this, event) : undefined;
    ensureIntentState(this, THREE);

    // Input should influence mood, not kick the moth into constant panic.
    this.aggression = Math.min(Number(this.aggression || 0), 0.46);
    this.pointerEnergy = Math.min(Number(this.pointerEnergy || 0), 0.72);
    return result;
  });

  patchMethod(proto, "handleInteractionPointerDown", (original) => function patchedPointerDown(event) {
    const result = original ? original.call(this, event) : undefined;
    ensureIntentState(this, THREE);
    this.aggression = Math.min(Number(this.aggression || 0), 0.14);
    this.inputEnergy = Math.min(Number(this.inputEnergy || 0), 0.42);
    return result;
  });

  patchMethod(proto, "handleInteractionWheel", (original) => function patchedWheel(event) {
    const result = original ? original.call(this, event) : undefined;
    ensureIntentState(this, THREE);
    this.aggression = Math.min(Number(this.aggression || 0), 0.52);
    this.scrollEnergy = Math.min(Number(this.scrollEnergy || 0), 0.76);
    return result;
  });

  patchMethod(proto, "shouldFleeFromOverwhelm", () => function patchedShouldFlee() {
    if (["backflip", "takeoff", "inspectVoid", "landing", "landed"].includes(String(this.mode || ""))) return false;
    if (Number(this.corruption || 0) >= Number(this.cfg?.voidCorruptionFleeThreshold || 0.92)) return true;
    if (Number(this.aggression || 0) >= Number(this.cfg?.overwhelmAggressionThreshold || 0.82)) return true;
    return Number(this.fatigue || 0) >= Number(this.cfg?.overwhelmFatigueThreshold || 0.94)
      && Number(this.signal || 0) > 0.72;
  });

  patchMethod(proto, "startFleeOverwhelmed", () => function patchedStartFlee(elapsed = 0, reason = "overwhelmed") {
    ensureIntentState(this, THREE);
    const target = chooseSmoothFleeTarget(this, THREE);
    this.fleeState = {
      startedAt: elapsed,
      endsAt: elapsed + THREE.MathUtils.lerp(2.4, 4.0, Math.random()),
      target,
      reason,
      phaseOffset: Math.random() * Math.PI * 2,
    };
    if ((this.mode === "landed" || this.mode === "landing") && typeof this.startTakeoff === "function") this.startTakeoff(elapsed);
    if (this.mode !== "takeoff" && typeof this.setMode === "function") this.setMode("fleeOverwhelmed", `${reason} · smooth retreat`);
    if (typeof this.playLoop === "function") {
      const action = typeof this.getPatrolFlightAction === "function" ? this.getPatrolFlightAction() : "fly";
      this.playLoop(action);
    }
  });

  patchMethod(proto, "updateFleeOverwhelmed", () => function patchedUpdateFlee(delta, elapsed = 0) {
    ensureIntentState(this, THREE);
    if (!this.fleeState) this.startFleeOverwhelmed(elapsed, "panic recovery");

    const target = this.fleeState?.target || this.currentPatrolAnchor || this.orbitCenter;
    const phase = (this.fleeState?.phaseOffset || 0) + elapsed * 1.15;
    const camRight = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion).normalize();
    const breathe = new THREE.Vector3()
      .addScaledVector(camRight, Math.sin(phase) * 0.055)
      .add(new THREE.Vector3(0, Math.cos(phase * 0.7) * 0.035, 0));
    const fleeTarget = target.clone().add(breathe);

    if (typeof this.moveToward === "function") this.moveToward(delta, fleeTarget, Number(this.cfg?.flySpeed || 1.5) * 0.92);
    if (typeof this.lookAtDirection === "function" && typeof this.getTravelFacingDirection === "function") {
      this.lookAtDirection(this.getTravelFacingDirection(fleeTarget), this.cfg?.turnLerpFast || 0.18);
    }
    if (typeof this.playLoop === "function") {
      const action = typeof this.getPatrolFlightAction === "function" ? this.getPatrolFlightAction() : "fly";
      this.playLoop(action);
    }

    this.behaviourNote = "smooth retreat → regain calm";
    this.fatigue = clamp01(Number(this.fatigue || 0) - delta * 0.08);
    this.aggression = Math.max(0, Number(this.aggression || 0) - delta * 0.24);

    if (elapsed >= (this.fleeState?.endsAt || 0) || this.root.position.distanceTo(target) < 0.18) {
      this.fleeState = null;
      if (typeof this.pickNextPatrolPoint === "function") this.pickNextPatrolPoint();
      if (typeof this.setMode === "function") this.setMode("patrol", "calmed down");
    }
  });

  patchMethod(proto, "updatePointerCuriosity", (original) => function patchedPointerCuriosity(delta, elapsed = 0) {
    const state = ensureIntentState(this, THREE);
    if (!this.pointerWorldTargetValid || !this.pointerWorldTarget?.isVector3) {
      if (typeof this.setMode === "function") this.setMode("patrol", "pointer signal lost");
      return;
    }

    if (!state.pointerLatch) state.pointerLatch = this.pointerWorldTarget.clone();
    state.pointerLatch.lerp(this.pointerWorldTarget, expAlpha(delta, 1.85));

    const target = state.pointerLatch.clone();
    target.y += Math.sin(elapsed * 1.85) * 0.032;
    if (typeof this.moveToward === "function") this.moveToward(delta, target, Number(this.cfg?.flySpeed || 1.5) * 0.62);
    if (typeof this.lookAtDirection === "function" && typeof this.getTravelFacingDirection === "function") {
      this.lookAtDirection(this.getTravelFacingDirection(target), this.cfg?.turnLerp || 0.16);
    }
    if (typeof this.playLoop === "function") {
      const action = typeof this.getPatrolFlightAction === "function" ? this.getPatrolFlightAction() : "fly";
      this.playLoop(action);
    }

    this.behaviourNote = "cautious pointer curiosity · slow drift";
    if (this.root.position.distanceTo(target) < 0.16 || Number(this.aggression || 0) > 0.46 || elapsed - Number(this.lastPointerEventAt || 0) > 2.1) {
      state.pointerLatch = null;
      if (typeof this.setMode === "function") this.setMode("patrol", "pointer curiosity complete");
      if (typeof this.pickNextPatrolPoint === "function") this.pickNextPatrolPoint();
    }
  });

  patchMethod(proto, "updateCoverInvestigation", () => function patchedCoverInvestigation(delta, elapsed = 0, coverTarget) {
    ensureIntentState(this, THREE);
    if (!coverTarget || !this.investigationState) {
      this.investigationState = null;
      if (typeof this.setMode === "function") this.setMode("patrol", "lost cover target");
      return;
    }

    const duration = Math.max(1.4, Number(this.cfg?.investigateCoverDuration || 1.9));
    const t = clamp01((elapsed - Number(this.investigationState.startedAt || elapsed)) / duration);
    const phase = Number(this.investigationState.phaseOffset || 0) + elapsed * Number(this.cfg?.investigateCoverSpeed || 1.55);
    const radius = Number(this.cfg?.investigateCoverRadius || 0.24) * (1.0 - t * 0.18);
    const right = coverTarget.right || new THREE.Vector3(1, 0, 0);
    const up = coverTarget.up || new THREE.Vector3(0, 1, 0);
    const normal = coverTarget.normal || new THREE.Vector3(0, 0, 1);

    const target = coverTarget.position.clone()
      .addScaledVector(normal, 0.08 + Math.cos(phase) * radius * 0.52)
      .addScaledVector(right, Math.sin(phase) * radius)
      .addScaledVector(up, Math.sin(phase * 0.72) * 0.045);

    if (typeof this.moveToward === "function") this.moveToward(delta, target, Number(this.cfg?.flySpeed || 1.5) * 0.58);
    if (typeof this.lookAtPoint === "function") this.lookAtPoint(coverTarget.position, up, this.cfg?.turnLerp || 0.16);
    if (typeof this.playLoop === "function") {
      const action = typeof this.getPatrolFlightAction === "function" ? this.getPatrolFlightAction() : "fly";
      this.playLoop(action);
    }

    this.behaviourNote = "inspect cover · orbiting calmly";
    if (t >= 1.0) {
      if (typeof this.setMode === "function") this.setMode("approachCover", "inspection complete");
    }
  });

  patchMethod(proto, "updateVoidOrbit", () => function patchedVoidOrbit(delta, elapsed = 0, voidTarget) {
    ensureIntentState(this, THREE);
    if (!this.voidState?.active || !voidTarget) {
      if (typeof this.setMode === "function") this.setMode("patrol", "void lost");
      return;
    }

    const orbit = this.voidOrbitState || { startedAt: elapsed, duration: 2.35, phaseOffset: 0 };
    const t = clamp01((elapsed - Number(orbit.startedAt || elapsed)) / Math.max(0.001, Number(orbit.duration || 2.35)));
    const phase = Number(orbit.phaseOffset || 0) + elapsed * 1.55;
    const radius = Number(this.cfg?.voidCautionOrbitRadius || 0.42) * (1.0 - t * 0.16);
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const cameraBack = this.camera.position.clone().sub(this.voidState.position).normalize();
    const target = this.voidState.position.clone()
      .addScaledVector(right, Math.cos(phase) * radius)
      .addScaledVector(up, Math.sin(phase * 0.8) * radius * 0.46)
      .addScaledVector(cameraBack, Number(this.cfg?.voidHoverRadius || 0.18));

    if (typeof this.moveToward === "function") this.moveToward(delta, target, Number(this.cfg?.diveSpeed || 2.0) * 0.52);
    if (typeof this.lookAtPoint === "function") this.lookAtPoint(this.voidState.position, up, this.cfg?.turnLerp || 0.16);
    if (typeof this.playLoop === "function") this.playLoop("feed");

    this.behaviourNote = "void hesitation · slow orbit";
    if (Number(this.corruption || 0) >= Number(this.cfg?.voidCorruptionFleeThreshold || 0.92)) {
      this.startFleeOverwhelmed(elapsed, "void corruption spike");
      return;
    }
    if (t >= 1.0 || this.root.position.distanceTo(target) < 0.12) {
      if (typeof this.setMode === "function") this.setMode("inspectVoid", "feeding from void");
      if (this.voidState) this.voidState.inspectStartedAt = elapsed;
      if (typeof this.playLoop === "function") this.playLoop("feed");
    }
  });

  patchMethod(proto, "handleSingleClick", (original) => function patchedSingleClick(event, hoverEntry) {
    ensureIntentState(this, THREE);
    const elapsed = typeof this.getElapsed === "function" ? this.getElapsed() : 0;

    if (rayHitsMoth(this, THREE, event)) {
      return startPureBackflip(this, THREE, elapsed, "single click on moth");
    }

    return original ? original.call(this, event, hoverEntry) : false;
  });

  patchMethod(proto, "startBackflip", () => function patchedStartBackflip(elapsed = 0, reason = "single click") {
    return startPureBackflip(this, THREE, elapsed, reason);
  });

  patchMethod(proto, "updateBackflip", () => function patchedUpdateBackflip(delta, elapsed = 0) {
    lockBackflipPose(this, THREE, elapsed);
    applyStateVisuals(this, THREE, delta, elapsed);
    finishBackflipIfDone(this, THREE, elapsed);
  });

  patchMethod(proto, "updateNeedVisuals", (original) => function patchedNeedVisuals(delta, elapsed = 0, hungry) {
    if (original) original.call(this, delta, elapsed, hungry);
    applyStateVisuals(this, THREE, delta, elapsed);
  });

  patchMethod(proto, "update", (original) => function patchedUpdate(...args) {
    ensureIntentState(this, THREE);
    const result = original ? original.apply(this, args) : undefined;
    const delta = Number(args[0] || this.lastDelta || 1 / 60);
    const elapsed = typeof this.getElapsed === "function" ? this.getElapsed() : Number(args[1] || 0);

    if (String(this.mode || "") === "backflip" || this.flipBusy || this[STATE_KEY]?.backflipLock) {
      lockBackflipPose(this, THREE, elapsed);
      finishBackflipIfDone(this, THREE, elapsed);
    }

    applyStateVisuals(this, THREE, delta, elapsed);
    return result;
  });

  console.info("[MothBehaviourStabilizer] Installed. Smooth movement + visible intent states enabled.");
  return true;
}
