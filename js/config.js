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
  modelFBX: "./assets/models/moth/moth.fbx"
};

export const SCENE_CONFIG = {
  scrollSpeed: 0.00042,
  touchSpeed: 0.0018
};

export const MOTH_CONFIG = {
  storageKey: "orbitSpecterMothV4",
  sizeRatioToModelHeight: 0.10,
  modelYawOffset: 0,
  modelPitchOffset: 0,
  modelRollOffset: 0,
  patrolRadiusMin: 1.15,
  patrolRadiusMax: 2.20,
  patrolHeightMin: -0.18,
  patrolHeightMax: 1.70,
  flySpeed: 1.35,
  diveSpeed: 1.85,
  arrivalRadius: 0.12,
  hoverPerchDelay: 0.10,
  coverPerchLift: 0.07,
  coverPerchForward: 0.05,
  clickEvadeLift: 0.24,
  clickEvadePush: 0.28,
  shellCount: 120,
  shellAlpha: 0.38,
  shellPointScale: 0.85,
  trailCount: 180,
  trailEmitInterval: 0.02,
  trailLife: 0.78,
  trailDrag: 1.85,
  trailSpeedFactor: 0.26,
  trailVelocityJitter: 0.14,
  trailAlpha: 0.80,
  trailPointScale: 0.95,
  meshSampleLimit: 320,
  voidRadius: 0.58,
  voidDepth: 1.20,
  voidSpawnRadius: 2.25,
  voidHeightMin: -0.85,
  voidHeightMax: 1.85,
  voidConsumeDistance: 0.18,
  voidConsumeRate: 0.90,
  nestMax: 6,
  nestChancePerLanding: 0.24,
  nestDepositDelay: 7.0,
  nestScaleMin: 0.08,
  nestScaleMax: 0.16,
  vitalityDrainPerSecond: 0.003,
  vitalityRecoveryPerSecond: 0.011,
  offlineDrainPerHour: 0.05,
  sadThreshold: 0.28,
  swarmThreshold: 1.10,
  stateSaveInterval: 5.0
};
