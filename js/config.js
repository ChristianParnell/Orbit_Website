
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
  storageKey: "orbitSpecterMothV3Stable",
  pointLimit: 1380,
  outlinePointLimit: 920,
  sizeRatioToModelHeight: 0.0936,
  // FBX visibility/orientation is kept from the original working moth setup.
  // If the moth still flies sideways in your browser, press [ or ] with the debug HUD open,
  // then copy the displayed yaw value back here.
  modelYawOffset: -Math.PI / 2,
  modelPitchOffset: 0,
  modelRollOffset: 0,
  meshOpacity: 0.38,
  meshEmissiveIntensity: 0.34,
  debugOverlay: true,
  // Keeps state lighting centered inside the moth without drawing a visible glow ball.
  auraOpacity: 0.0,
  auraVisible: false,
  trailSpawnBehindDistance: 0.018,
  hitProxyDebugVisible: false,
  shellMotionStrength: 0.82,
  shellPointSizeMin: 0.42,
  shellPointSizeMax: 0.82,
  shellPointAlphaMin: 0.34,
  shellPointAlphaMax: 0.72,
  binaryBrightness: 1.68,
  outlineBrightness: 2.15,
  outlineExpand: 0.018,
  outlinePointSizeMin: 0.82,
  outlinePointSizeMax: 1.48,
  outlineAlpha: 1.0,
  trailCount: 180,
  trailEmitInterval: 0.038,
  trailLife: 0.85,
  trailDrag: 2.1,
  trailSpeed: 0.32,
  trailJitter: 0.018,
  trailPointSizeMin: 0.7,
  trailPointSizeMax: 1.3,
  trailAlpha: 0.84,

  patrolRadiusMin: 1.85,
  patrolRadiusMax: 3.65,
  patrolHeightMin: -0.18,
  patrolHeightMax: 1.75,
  patrolFrontMin: 0.48,
  patrolFrontMax: 1.55,
  patrolSideSpan: 1.55,
  patrolViewMargin: 0.78,
  patrolViewYMin: -0.48,
  patrolViewYMax: 0.46,
  patrolRepickMin: 4.8,
  patrolRepickMax: 8.4,
  patrolRecoveryMargin: 0.96,
  patrolRecoverySpeedScale: 1.2,
  patrolCenterPull: 0.12,


  flySpeed: 0.92,
  diveSpeed: 1.02,
  flySadSpeedScale: 0.72,
  approachSlowRadius: 1.05,
  turnLerp: 0.050,
  turnLerpFast: 0.070,
  headingTargetBlend: 0.10,
  headingVelocityBlend: 0.90,
  turnResponse: 2.35,
  turnResponseFast: 3.10,
  headingVelocityMin: 0.090,
  headingMinSpeed: 0.14,
  headingDeadzone: 0.070,
  headingSmoothing: 2.15,
  velocityResponse: 2.05,

  // [MOTH NO-YAW-STUTTER 2026-04-28]
  // Keep the moth aligned to travel, but with very slow, gated turns.
  // This prevents the sideways yaw jitter/stutter that happens when the target changes quickly.
  velocityFacingMinSpeed: 0.090,
  velocityHeadingBlendMin: 0.006,
  velocityHeadingBlendMax: 0.060,
  turnAlphaMax: 0.090,
  noYawStutterMode: true,
  orientationFreezeSpeed: 0.075,
  orientationFreezeDistance: 0.145,
  orientationMaxTurnDegreesPerSecond: 26,
  orientationMaxTurnFastDegreesPerSecond: 34,
  velocitySteeringMaxTurnDegreesPerSecond: 38,
  orientationUseWorldUpInFlight: true,
  orientationMinAngleDegrees: 2.8,

  patrolVisibilityGrace: 0.40,
  recoveryVisibilityGrace: 0.45,
  animationFadeLoop: 0.28,
  animationFadeOnce: 0.20,
  visualBankMax: 0.025,
  visualBankResponse: 2.2,
  visualPitchMax: 0.020,
  visualPitchResponse: 2.1,

  hoverPerchDelay: 0.38,
  perchDistance: 0.12,
  landTriggerDistance: 0.12,
  coverPerchLift: 0.065,
  coverPerchForward: 0.055,
  coverPerchLerp: 0.075,

  takeoffRiseHeight: 0.20,
  takeoffMotionScale: 1.0,

  // [MOTH HOME PERCH 2026-04-28]
  // The moth's resting/home spot is a named bone inside me_on_hill.fbx.
  // Recommended bone name in Blender/FBX: PerchBone. The code also accepts Perch Bone and names containing perch/rest/home.
  homePerchEnabled: true,
  homePerchBoneNames: [
    "PerchBone",
    "Perch Bone",
    "perchbone",
    "PERCHBONE",
    "Moth_PerchBone",
    "MothPerchBone",
    "moth_perch_bone",
    "Moth_Perch",
    "moth_perch",
    "Perch",
    "perch",
    "Perch_Bone",
    "perch_bone",
    "MothRest",
    "Moth_Rest",
    "Rest_Perch"
  ],
  homePerchForwardAxis: "-Z",
  homePerchUpAxis: "Y",
  homePerchSideAxis: "X",
  homePerchForwardOffset: 0.0,
  homePerchLiftOffset: 0.0,
  homePerchSideOffset: 0.0,
  homePerchRestDelay: 8.0,
  homePerchSignalThreshold: 0.24,
  homePerchFatigueThreshold: 0.70,
  homePerchApproachSpeedScale: 0.56,
  homePerchApproachDistance: 0.17,
  homePerchLandingDistance: 0.095,
  homePerchLandingSnapDistance: 0.035,
  homePerchLandingCycle: true,
  homePerchSettleLerp: 0.14,
  homePerchTurnLerp: 0.13,
  homePerchUseCoreAnchor: true,
  // After feeding from a binary void, the moth flies home and lands into F_Land_Idle.
  homePerchAfterFeed: true,
  homePerchAfterFeedDelay: 0.0,
  // Sleeping look when the moth is fully idle on PerchBone.
  homePerchSleepingBrightness: 0.28,
  homePerchSleepingTrailAlpha: 0.02,

  // Backflip must be animation-only. These stay zero so code never pushes/rotates the moth.
  backflipPush: 0.0,
  backflipLift: 0.0,

  voidSpawnRadius: 2.25,
  voidHeightMin: -0.9,
  voidHeightMax: 1.8,
  voidHoverRadius: 0.24,
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
  fatigueFlightGain: 0.032,
  fatigueRestRecovery: 0.18,
  fatigueIdleRecovery: 0.055,
  fatigueShelterThreshold: 0.72,
  overwhelmAggressionThreshold: 0.82,
  overwhelmFatigueThreshold: 0.96,
  overwhelmCorruptionThreshold: 0.82,
  overwhelmDurationMin: 2.6,
  overwhelmDurationMax: 4.8,
  trustGainGentle: 0.035,
  trustLossAggressive: 0.12,
  pointerCuriosityTrustMin: 0.34,
  pointerCuriositySignalMin: 0.22,
  pointerCuriosityDistance: 0.42,
  pointerCuriosityCooldown: 0.18,
  investigateCoverDuration: 2.1,
  investigateCoverRadius: 0.14,
  investigateCoverSpeed: 0.82,
  perchEdgeWalk: 0.055,
  shelterCoverIndex: 0,
  shelterAvoidCoverIndex: 2,
  shelterLandDistance: 0.16,
  nestTrustMin: 0.48,
  voidCautionOrbitDuration: 2.2,
  voidCautionOrbitRadius: 0.24,
  voidCorruptionGain: 0.055,
  voidCorruptionDecay: 0.018,
  voidCorruptionFleeThreshold: 0.82,
  trailHungryScale: 0.46,
  trailFedScale: 1.32,
  visualHungryPatchiness: 0.14
};
