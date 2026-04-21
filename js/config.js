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
  motions: {
    fly: "./assets/models/moth/F_Fly.fbx",
    flySad: "./assets/models/moth/F_Fly_Sad.fbx",
    land: "./assets/models/moth/F_Land.fbx",
    perch: "./assets/models/moth/F_Land_Idle.fbx",
    takeoff: "./assets/models/moth/F_Land_to_TakeOff.fbx",
    feed: "./assets/models/moth/F_Void_Inspect.fbx",
    backflip: "./assets/models/moth/F_Backflip.fbx"
  }
};

export const SCENE_CONFIG = {
  scrollSpeed: 0.00042,
  touchSpeed: 0.0018
};

export const MOTH_CONFIG = {
  storageKey: "orbitSpecterMothV1",
  pointLimit: 520,
  sizeRatioToModelHeight: 0.078,
  patrolRadiusMin: 1.18,
  patrolRadiusMax: 2.28,
  patrolHeightMin: -0.2,
  patrolHeightMax: 1.9,
  flySpeed: 1.55,
  diveSpeed: 2.25,
  perchDistance: 0.18,
  coverPerchLift: 0.065,
  coverPerchForward: 0.06,
  hoverPerchDelay: 0.12,
  trailCount: 180,
  trailEmitInterval: 0.026,
  trailLife: 0.82,
  trailSpread: 0.026,
  trailVelocityJitter: 0.18,
  trailSpeedFactor: 0.26,
  trailDrag: 1.7,
  trailAlpha: 0.82,
  trailPointScale: 1.0,
  voidSpawnRadius: 2.25,
  voidHeightMin: -0.9,
  voidHeightMax: 1.8,
  voidParticleCount: 320,
  voidDepth: 0.88,
  ghostCount: 6,
  nestMax: 5,
  nestChancePerPerch: 0.22,
  nestDepositDelay: 7.5,
  vitalityDrainPerSecond: 0.0032,
  vitalityRecoveryPerSecond: 0.0095,
  offlineDrainPerHour: 0.05,
  sadThreshold: 0.28,
  swarmThreshold: 1.25,
  clickEvadeLift: 0.28,
  clickEvadePush: 0.22
};
