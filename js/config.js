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
  storageKey: "orbitSpecterMothV4",
  pointLimit: 1380,
  outlinePointLimit: 920,
  sizeRatioToModelHeight: 0.0936,
  modelYawOffset: Math.PI,
  modelPitchOffset: 0,
  modelRollOffset: 0,
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
  trailJitter: 0.08,
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
  patrolRepickMin: 1.8,
  patrolRepickMax: 3.4,
  patrolRecoveryMargin: 0.96,
  patrolRecoverySpeedScale: 1.2,
  patrolCenterPull: 0.12,
  stuckSpeedThreshold: 0.045,
  stuckDistanceThreshold: 0.24,
  stuckTimeout: 1.05,

  flySpeed: 1.55,
  diveSpeed: 2.00,
  flySadSpeedScale: 0.62,
  approachSlowRadius: 0.42,
  turnLerp: 0.22,
  turnLerpFast: 0.28,
  headingTargetBlend: 0.18,
  headingVelocityBlend: 0.82,

  hoverPerchDelay: 0.10,
  perchDistance: 0.16,
  landTriggerDistance: 0.18,
  coverPerchLift: 0.065,
  coverPerchForward: 0.055,
  coverPerchLerp: 0.18,

  takeoffRiseHeight: 0.20,
  takeoffMotionScale: 1.0,

  voidSpawnRadius: 2.25,
  voidHeightMin: -0.9,
  voidHeightMax: 1.8,
  voidHoverRadius: 0.18,
  voidConsumeDistance: 0.20,
  voidInspectDuration: 5.0,
  satiatedDuration: 8.0,
  voidParticleCount: 320,
  voidDepth: 0.88,

  nestMax: 5,
  nestChancePerPerch: 0.22,
  nestDepositDelay: 7.5,
  vitalityDrainPerSecond: 0.0026,
  vitalityRecoveryPerSecond: 0.01,
  offlineDrainPerHour: 0.05,
  sadThreshold: 0.30,

  homePerchBoneName: "PerchBone",
  homePerchOffset: { x: 0.0, y: 0.015, z: 0.0 },
  homePerchForward: 0.09,
  homePerchLift: 0.025,
  homeApproachDistance: 0.18,
  homePerchLerp: 0.16,

  signalDecayPerSecond: 0.070,
  signalHoverBoost: 0.42,
  signalPointerBoost: 0.22,
  signalWheelBoost: 0.08,
  signalPanelBoost: 0.12,
  signalAudioBoost: 0.18,

  fatigueFlightPerSecond: 0.050,
  fatigueStimulusPerSecond: 0.042,
  fatigueRestRecoveryPerSecond: 0.22,

  trustGainPerSecond: 0.12,
  trustLossPerSecond: 0.34,

  corruptionGainPerSecond: 0.16,
  corruptionRestRecoveryPerSecond: 0.17,
  corruptionSignalDamp: 0.28,

  gentlePointerSpeed: 0.35,
  aggressivePointerSpeed: 1.10,
  aggressiveWheelThreshold: 620,

  homeRestThreshold: 0.52,
  homeLeaveThreshold: 0.34,

  fragmentCollectPerSecond: 0.16,
  fragmentDepositThreshold: 1.0,

  companionTrustThreshold: 0.42,
  companionDistance: 0.36,
  companionLift: 0.08,

  cursorAttractChancePerSecond: 0.20,
  cursorAttractDistance: 0.92,
  cursorAttractMinDuration: 1.8,
  cursorAttractMaxDuration: 3.6,
  cursorAttractCooldownMin: 2.4,
  cursorAttractCooldownMax: 5.8,
  cursorTargetPullBack: 0.10,
  cursorTargetLift: 0.03,
  cursorTouchDistance: 0.11,
  cursorTouchHoldMin: 0.65,
  cursorTouchHoldMax: 1.05,
  cursorTrustThreshold: 0.20,
  cursorAggressionMax: 0.42,
  cursorFollowSpeedScale: 0.92,

  residueIncreasePerSecond: 0.040,
  residueCleansePerSecond: 0.26,
  residueOpacityMax: 0.55,
  residueScaleMin: 0.10,
  residueScaleMax: 0.26,

  pagePreferences: {
    about: 1.0,
    gallery: 0.35,
    achievements: -0.85,
    fab: -0.10,
    sketchfab: -0.12,
    "twenty-two-minutes": 0.22,
    contact: 0.25
  }
};
