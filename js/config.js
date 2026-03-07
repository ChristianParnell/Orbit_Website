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
    href: "./pages/fab.html",
    cover: "./assets/covers/fab.png",
    theme: "Digital assets"
  },
  {
    id: "sketchfab",
    title: "Sketchfab",
    subtitle: "3D Model Asset store",
    href: "./pages/sketchfab.html",
    cover: "./assets/covers/sketchfab.png",
    theme: "3D work"
  },
  {
    id: "twenty-two-minutes",
    title: "22 Minutes",
    subtitle: "Published on Steam",
    href: "./pages/twenty-two-minutes.html",
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
  background: "./assets/backgrounds/background.jpg",
  sky: "./assets/backgrounds/sky_sphere.jpg",
  fog: "./assets/textures/fog.png",
  modelGLB: "./assets/models/me_on_hill.glb",
  model: "./assets/models/me_on_hill.fbx"
};
export const SCENE_CONFIG = {
  folderCount: ORBIT_ITEMS.length,
  cameraRadius: 5.25,
  coverRadius: 6.85,
  turns: 1.72,
  cameraHeightTop: 2.3,
  cameraHeightBottom: -1.9,
  coverHeightTop: 2.2,
  coverHeightBottom: -2.2,
  scrollSpeed: 0.00068,
  touchSpeed: 0.0012,
  folderWidth: 1.85,
  folderHeight: 1.15,
  folderSpacingBias: 0.1
};
