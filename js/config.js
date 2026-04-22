
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
  pointLimit: 500,
  outlinePointLimit: 800,
  sizeRatioToModelHeight: 0.0936,
  modelYawOffset: Math.PI / 2,
  modelPitchOffset: 0,
  modelRollOffset: 0, 
  shellMotionStrength: 1.25,
  shellPointSizeMin: 0.46,
  shellPointSizeMax: 0.96,
  shellPointAlphaMin: 0.24,
  shellPointAlphaMax: 0.54,
  binaryBrightness: 1.16,
  outlineBrightness: 1.55,
  outlineExpand: 0.018,
  outlinePointSizeMin: 0.78,
  outlinePointSizeMax: 1.02,
  outlineAlpha: 0.92,
  trailCount: 280,
  trailEmitInterval: 0.02,
  trailLife: 1.35,
  trailDrag: 2.1,
  trailSpeed: 0.32,
  trailJitter: 0.08,
  trailPointSizeMin: 0.7,
  trailPointSizeMax: 1.8,
  trailAlpha: 0.88,

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


  flySpeed: 1.85,
  diveSpeed: 2.00,
  flySadSpeedScale: 0.62,
  approachSlowRadius: 0.42,
  turnLerp: 0.22,
  turnLerpFast: 0.28,
  headingTargetBlend: 0.18,
  headingVelocityBlend: 0.82,

  hoverPerchDelay: 0.05,
  perchDistance: 0.12,
  landTriggerDistance: 0.12,
  coverPerchLift: 0.035,
  coverPerchForward: 0.035,
  coverPerchLerp: 0.18,

  takeoffRiseHeight: 0.10,
  takeoffMotionScale: 1.0,
  backflipPush: 0.25,
  backflipLift: 0.10,

  voidSpawnRadius: 2.25,
  voidHeightMin: -0.9,
  voidHeightMax: 1.8,
  voidHoverRadius: 0.18,
  voidConsumeDistance: 0.20,
  voidInspectDuration: 5.0,
  satiatedDuration: 8.0,

  voidParticleCount: 320,
  voidDepth: 0.88,

  nestMax: 0,  
  nestChancePerPerch: 0.22,
  nestDepositDelay: 7.5,
  vitalityDrainPerSecond: 0.0026,
  vitalityRecoveryPerSecond: 0.01,
  offlineDrainPerHour: 0.05,
  sadThreshold: 0.30
};
