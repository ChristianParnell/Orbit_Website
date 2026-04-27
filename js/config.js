
export const ORBIT_ITEMS = [
  {
    id: "about",
    title: "About",
    subtitle: "A little about me",
    href: "./pages/about.html",
    cover: "./assets/covers/about.JPG",
    theme: "Who I am"
  },
  {
    id: "gallery",
    title: "Gallery",
    subtitle: "Animations & Projects",
    href: "./pages/gallery.html",
    cover: "./assets/covers/gallery.png",
    theme: "Moving image"
  },
  {
    id: "achievements",
    title: "Achievements",
    subtitle: "Highlights & Milestones",
    href: "./pages/achievements.html",
    cover: "./assets/covers/achievements.jpg",
    theme: "Milestones"
  },
  {
    id: "fab",
    title: "FAB",
    subtitle: "Online Asset Store",
    href: "https://www.fab.com/sellers/Oblix%20Studio",
    cover: "./assets/covers/fab.png",
    theme: "Digital assets"
  },
  {
    id: "sketchfab",
    title: "Sketchfab",
    subtitle: "3D Model Asset store",
    href: "https://sketchfab.com/OblixStudio",
    cover: "./assets/covers/sketchfab.png",
    theme: "3D work"
  },
  {
    id: "twenty-two-minutes",
    title: "22 Minutes",
    subtitle: "Published on Steam",
    href: "https://store.steampowered.com/app/2765180/22_Minutes/",
    cover: "./assets/covers/steam_22minutes.png",
    theme: "Game development"
  },
  {
    id: "contact",
    title: "Contact",
    subtitle: "Reach out · Collaborate",
    href: "./pages/contact.html",
    cover: "./assets/covers/contact.jpg",
    theme: "Let’s talk"
  }
];

export const ASSETS = {
  modelGLB: "",
  modelGLTF: "",
  modelFBX: "./assets/models/me_on_hill.fbx"
};

export const MOTH_ASSETS = {
  modelFBX: "./assets/models/moth/moth.fbx",
  modelGLB: "",
  modelGLTF: "",
  motions: {}
};

export const SCENE_CONFIG = {
  scrollSpeed: 0.00042,
  touchSpeed: 0.0018
};

export const MOTH_CONFIG = {
  storageKey: "orbitSpecterMothV2",
  pointLimit: 1380,
  outlinePointLimit: 920,
  sizeRatioToModelHeight: 0.0936,
  // FBX visibility/orientation is kept from the original working moth setup.
  // If the moth still flies sideways in your browser, press [ or ] with the debug HUD open,
  // then copy the displayed yaw value back here.
  modelYawOffset: -Math.PI / 2,
  modelPitchOffset: 0,
  modelRollOffset: 0,
  meshOpacity: 0.48,
  meshEmissiveIntensity: 0.34,
  debugOverlay: true,
  shellMotionStrength: 1.25,
  shellPointSizeMin: 0.42,
  shellPointSizeMax: 0.82,
  shellPointAlphaMin: 0.34,
  shellPointAlphaMax: 0.72,
  binaryBrightness: 1.42,
  outlineBrightness: 2.05,
  outlineExpand: 0.018,
  outlinePointSizeMin: 0.82,
  outlinePointSizeMax: 1.48,
  outlineAlpha: 1.0,
  trailCount: 180,
  trailEmitInterval: 0.02,
  trailLife: 0.85,
  trailDrag: 2.1,
  trailSpeed: 0.32,
  trailJitter: 0.035,
  trailPointSizeMin: 0.7,
  trailPointSizeMax: 1.3,
  trailAlpha: 0.84,

  patrolRadiusMin: 1.75,
  patrolRadiusMax: 3.40,
  patrolHeightMin: -0.10,
  patrolHeightMax: 1.55,
  patrolFrontMin: 0.35,
  patrolFrontMax: 1.35,
  patrolSideSpan: 1.25,
  patrolViewMargin: 0.78,
  patrolViewYMin: -0.48,
  patrolViewYMax: 0.46,
  patrolRepickMin: 2.8,
  patrolRepickMax: 5.2,
  patrolRecoveryMargin: 0.96,
  patrolRecoverySpeedScale: 1.2,
  patrolCenterPull: 0.12,


  flySpeed: 1.18,
  diveSpeed: 1.46,
  flySadSpeedScale: 0.72,
  approachSlowRadius: 0.68,
  turnLerp: 0.14,
  turnLerpFast: 0.20,
  headingTargetBlend: 0.14,
  headingVelocityBlend: 0.86,
  turnResponse: 7.0,
  turnResponseFast: 10.0,
  headingSmoothing: 5.4,
  velocityResponse: 2.25,
  visualBankMax: 0.10,
  visualBankResponse: 3.6,
  visualPitchMax: 0.055,
  visualPitchResponse: 3.2,

  hoverPerchDelay: 0.10,
  perchDistance: 0.12,
  landTriggerDistance: 0.12,
  coverPerchLift: 0.065,
  coverPerchForward: 0.055,
  coverPerchLerp: 0.18,

  takeoffRiseHeight: 0.20,
  takeoffMotionScale: 1.0,
  // Backflip is animation-only in moth-system.js. No push/lift values are used.

  voidSpawnRadius: 2.25,
  voidHeightMin: -0.9,
  voidHeightMax: 1.8,
  voidHoverRadius: 0.18,
  voidConsumeDistance: 0.20,
  voidInspectDuration: 5.0,
  satiatedDuration: 8.0,

  voidParticleCount: 920,
  voidDepth: 1.08,
  voidVortexRadius: 1.08,
  voidVortexArms: 7,
  voidVortexTwist: 11.5,
  voidVortexSpin: 2.25,
  voidVortexCollapseSpeed: 0.42,

  nestMax: 5,
  nestChancePerPerch: 0.22,
  nestDepositDelay: 7.5,
  vitalityDrainPerSecond: 0.0026,
  vitalityRecoveryPerSecond: 0.01,
  offlineDrainPerHour: 0.05,
  sadThreshold: 0.30,

  // [MOTH PATCH 2026-04-27] Behaviour system tuning.
  // These are optional overrides; moth-system.js also contains safe defaults.
  interactionTracking: true,
  moodUpdateRate: 0.12,
  signalIdleDecay: 0.055,
  signalHoverGain: 0.52,
  signalPointerGain: 0.22,
  hungerSignalWeight: 0.36,
  fatigueFlightGain: 0.055,
  fatigueRestRecovery: 0.18,
  fatigueIdleRecovery: 0.055,
  fatigueShelterThreshold: 0.72,
  overwhelmAggressionThreshold: 0.58,
  overwhelmFatigueThreshold: 0.88,
  overwhelmCorruptionThreshold: 0.72,
  overwhelmDurationMin: 1.35,
  overwhelmDurationMax: 2.75,
  trustGainGentle: 0.035,
  trustLossAggressive: 0.12,
  pointerCuriosityTrustMin: 0.34,
  pointerCuriositySignalMin: 0.22,
  pointerCuriosityDistance: 0.34,
  pointerCuriosityCooldown: 0.18,
  investigateCoverDuration: 1.15,
  investigateCoverRadius: 0.20,
  investigateCoverSpeed: 2.0,
  perchEdgeWalk: 0.055,
  shelterCoverIndex: 0,
  shelterAvoidCoverIndex: 2,
  shelterLandDistance: 0.16,
  nestTrustMin: 0.48,
  voidCautionOrbitDuration: 1.35,
  voidCautionOrbitRadius: 0.26,
  voidCorruptionGain: 0.055,
  voidCorruptionDecay: 0.018,
  voidCorruptionFleeThreshold: 0.82,
  trailHungryScale: 0.46,
  trailFedScale: 1.32,
  visualHungryPatchiness: 0.42,

  // [MOTH STABILITY PATCH 2026-04-27]
  // Smooth movement override: removes frantic scene jitter while keeping readable states.
  movementJitterScale: 0.0,
  restlessTargetDriftScale: 0.18,
  fleeTwitchScale: 0.0,
  pointerBreatheScale: 0.22,
  patrolEarlyRepickEnabled: false,
  smoothMaxAcceleration: 2.35,
  smoothMaxSpeed: 1.38,
  arrivalStopDistance: 0.045,
  arrivalBrakeResponse: 7.0,
  recoveryAssistScale: 0.45,
  softBoundaryClamp: true,
  softBoundaryStrength: 0.18
};
