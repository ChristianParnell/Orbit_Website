import * as THREE from "https://esm.sh/three@0.160.0";
import { normalizeClipName, scoreName } from "./moth-utils.js";

export const MOTH_ANIMATION_KEYS = {
  fly: ["F_Fly", "F Fly", "fly"],
  flySad: ["F_Fly_Sad", "F Fly Sad", "fly sad", "sad"],
  land: ["F_Land", "F Land", "land"],
  landIdle: ["F_Land_Idle", "F Land Idle", "land idle", "idle land"],
  takeoff: ["F_Land_to_TakeOff", "F Land to TakeOff", "land to takeoff", "takeoff"],
  voidInspect: ["F_Void_Inspect", "F Void Inspect", "void inspect", "inspect"],
  backflip: ["F_Backflip", "F Backflip", "backflip", "back flip"]
};

const ONE_SHOT_KEYS = new Set(["land", "takeoff", "voidInspect", "backflip"]);

function collectClips(root, explicit = []) {
  const seen = new Set();
  const clips = [];
  const push = (clip) => {
    if (!clip?.name || !Number.isFinite(clip.duration) || clip.duration <= 0) return;
    const key = `${clip.name}:${clip.duration}`;
    if (seen.has(key)) return;
    seen.add(key);
    clips.push(clip);
  };
  explicit.forEach(push);
  if (Array.isArray(root?.animations)) root.animations.forEach(push);
  root?.traverse?.((child) => {
    if (Array.isArray(child?.animations)) child.animations.forEach(push);
  });
  return clips;
}

function findBestClip(clips, patterns) {
  let best = null;
  let bestScore = -1;
  for (const clip of clips) {
    for (const pattern of patterns) {
      const score = scoreName(clip.name, pattern);
      if (score > bestScore) {
        bestScore = score;
        best = clip;
      }
    }
  }
  return bestScore >= 0 ? best : null;
}

export class MothAnimationController {
  constructor(root, explicitClips = [], { log = null, fade = 0.24 } = {}) {
    this.root = root;
    this.mixer = new THREE.AnimationMixer(root);
    this.log = log;
    this.fade = fade;
    this.actions = new Map();
    this.clips = collectClips(root, explicitClips);
    this.currentKey = "";
    this.requestedLoopKey = "fly";
    this.lockedUntil = 0;
    this.lockedKey = "";
    this.finishedAt = 0;
    this.available = {};
    this._bindActions();
  }

  _bindActions() {
    Object.entries(MOTH_ANIMATION_KEYS).forEach(([key, patterns]) => {
      const clip = findBestClip(this.clips, patterns);
      if (!clip) return;
      const action = this.mixer.clipAction(clip);
      action.enabled = true;
      action.clampWhenFinished = ONE_SHOT_KEYS.has(key);
      action.loop = ONE_SHOT_KEYS.has(key) ? THREE.LoopOnce : THREE.LoopRepeat;
      this.actions.set(key, action);
      this.available[key] = clip.name;
    });
    const names = Object.entries(this.available).map(([key, name]) => `${key}:${name}`).join(" | ");
    if (names) this.log?.(`animation map :: ${names}`, "MOTH");
    else this.log?.("no named moth animations found; fallback motion active", "WARN");
  }

  has(key) {
    return this.actions.has(key);
  }

  getDuration(key) {
    return this.actions.get(key)?._clip?.duration ?? 0.9;
  }

  isLocked(elapsed) {
    return elapsed < this.lockedUntil;
  }

  play(key, { elapsed = 0, loop = null, fade = this.fade, lock = false, restart = false } = {}) {
    const fallback = key === "flySad" && !this.has("flySad") ? "fly" : key;
    const action = this.actions.get(fallback);
    if (!action) {
      this.currentKey = fallback;
      return false;
    }
    if (this.isLocked(elapsed) && fallback !== this.lockedKey && !restart) return false;
    if (this.currentKey === fallback && !restart) return true;

    const previous = this.actions.get(this.currentKey);
    action.enabled = true;
    action.clampWhenFinished = ONE_SHOT_KEYS.has(fallback);
    action.loop = loop ?? (ONE_SHOT_KEYS.has(fallback) ? THREE.LoopOnce : THREE.LoopRepeat);
    action.paused = false;
    if (restart || ONE_SHOT_KEYS.has(fallback)) action.reset();
    action.setEffectiveTimeScale(1);
    action.setEffectiveWeight(1);
    action.play();

    if (previous && previous !== action) {
      previous.enabled = true;
      previous.crossFadeTo(action, fade, false);
    } else {
      action.fadeIn(Math.max(0.01, fade * 0.5));
    }

    this.currentKey = fallback;
    if (!ONE_SHOT_KEYS.has(fallback)) this.requestedLoopKey = fallback;
    if (lock || ONE_SHOT_KEYS.has(fallback)) {
      this.lockedKey = fallback;
      this.lockedUntil = elapsed + this.getDuration(fallback) * 0.92;
      this.finishedAt = this.lockedUntil;
    }
    return true;
  }

  playFlight({ elapsed = 0, sad = false } = {}) {
    if (this.isLocked(elapsed)) return;
    this.play(sad ? "flySad" : "fly", { elapsed, loop: THREE.LoopRepeat });
  }

  playLand(elapsed = 0) {
    if (this.has("land")) this.play("land", { elapsed, restart: true, lock: true, fade: 0.16 });
    else this.play("landIdle", { elapsed, fade: 0.18 });
  }

  playLandIdle(elapsed = 0) {
    if (!this.isLocked(elapsed)) this.play("landIdle", { elapsed, loop: THREE.LoopRepeat, fade: 0.18 });
  }

  playTakeoff(elapsed = 0) {
    if (this.has("takeoff")) this.play("takeoff", { elapsed, restart: true, lock: true, fade: 0.16 });
    else this.play("fly", { elapsed, fade: 0.18 });
  }

  playVoidInspect(elapsed = 0) {
    if (this.has("voidInspect")) this.play("voidInspect", { elapsed, restart: true, lock: true, fade: 0.16 });
    else this.play("fly", { elapsed, fade: 0.18 });
  }

  playBackflip(elapsed = 0) {
    if (this.has("backflip")) return this.play("backflip", { elapsed, restart: true, lock: true, fade: 0.08 });
    return false;
  }

  update(delta, elapsed) {
    this.mixer?.update(Math.max(0, delta));
    if (this.lockedKey && elapsed >= this.lockedUntil) {
      const previousLock = this.lockedKey;
      this.lockedKey = "";
      this.lockedUntil = 0;
      if (previousLock === "land") this.play("landIdle", { elapsed, loop: THREE.LoopRepeat, fade: 0.16 });
      else if (previousLock === "backflip" || previousLock === "takeoff" || previousLock === "voidInspect") {
        this.play(this.requestedLoopKey || "fly", { elapsed, loop: THREE.LoopRepeat, fade: 0.18 });
      }
    }
  }

  dispose() {
    this.mixer?.stopAllAction();
    this.actions.clear();
  }
}

export function describeClipList(root, explicit = []) {
  return collectClips(root, explicit).map((clip) => normalizeClipName(clip.name));
}
