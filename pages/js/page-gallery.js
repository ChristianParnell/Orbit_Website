import { renderPage } from "./render-page.js";

const videoItems = [
  {
    type: "video",
    title: "Portfolio Showreel 2026",
    description: "Main edited reel featuring motion, design, game work, 3D and final presentation shots.",
    src: "../assets/gallery/videos/video-01-showreel.mp4",
    thumbTime: 2.2,
    placeholder: "Showreel video"
  },
  {
    type: "video",
    title: "22 Minutes — Gameplay Trailer",
    description: "Trailer-style edit showing gameplay beats, environment tension and pacing from the project.",
    src: "../assets/gallery/videos/video-02-22-minutes-trailer.mp4",
    thumbTime: 3.0,
    placeholder: "Gameplay trailer"
  },
  {
    type: "video",
    title: "Fun Animation",
    description: "An animation-focused piece showing movement, timing and visual energy.",
    src: "../assets/gallery/videos/Video-03-Fun-Animation.mp4",
    thumbTime: 1.8,
    placeholder: "Fun animation video"
  },
  {
    type: "video",
    title: "Woe — Intro",
    description: "An introduction sequence with a more cinematic and stylised presentation.",
    src: "../assets/gallery/videos/video-04-Woe-Intro.mp4",
    thumbTime: 2.4,
    placeholder: "Intro video"
  },
  {
    type: "video",
    title: "Character Animation Test",
    description: "Character motion study showing timing, posing, movement arcs and polish in a short animation pass.",
    src: "../assets/gallery/videos/video-05-character-animation.mp4",
    thumbTime: 1.6,
    placeholder: "Character animation test"
  },
  {
    type: "video",
    title: "Underwater Horror Prototype",
    description: "Prototype footage focused on atmosphere, underwater movement and tension-building visual language.",
    src: "../assets/gallery/videos/video-06-underwater-prototype.mp4",
    thumbTime: 2.8,
    placeholder: "Underwater prototype"
  },
  {
    type: "video",
    title: "VFX Breakdown",
    description: "Effect layers, pass breakdowns and composited results presented in a single before-and-after edit.",
    src: "../assets/gallery/videos/video-07-vfx-breakdown.mp4",
    thumbTime: 2.0,
    placeholder: "VFX breakdown"
  },
  {
    type: "video",
    title: "UI Motion Graphics Pass",
    description: "Motion design experiments for title cards, user interfaces and graphic transitions.",
    src: "../assets/gallery/videos/video-08-ui-motion-pass.mp4",
    thumbTime: 1.5,
    placeholder: "UI motion pass"
  },
  {
    type: "video",
    title: "Lighting Study Sequence",
    description: "A mood-driven sequence comparing different lighting grades and cinematic scene treatment.",
    src: "../assets/gallery/videos/video-09-lighting-study.mp4",
    thumbTime: 2.6,
    placeholder: "Lighting study"
  },
  {
    type: "video",
    title: "Turntable Presentation",
    description: "A clean turntable render showing off modelling, surfacing and overall silhouette from all angles.",
    src: "../assets/gallery/videos/video-10-turntable.mp4",
    thumbTime: 1.2,
    placeholder: "Turntable presentation"
  }
];

const renderItems = [
  {
    type: "image",
    title: "Hero Render — Orbit Portrait",
    description: "Primary hero still for the portfolio, designed to feel cinematic and strong at a glance.",
    src: "../assets/gallery/renders/render-01-orbit-portrait.png",
    placeholder: "Hero render"
  },
  {
    type: "image",
    title: "Environment Render — Dusk Scene",
    description: "Wide environmental frame focused on mood, depth and spatial composition.",
    src: "../assets/gallery/renders/render-02-dusk-environment.png",
    placeholder: "Environment render"
  },
  {
    type: "image",
    title: "Character Render — Front View",
    description: "Front-facing presentation render with a clean pose and readable lighting.",
    src: "../assets/gallery/renders/render-03-character-front.png",
    placeholder: "Character front render"
  },
  {
    type: "image",
    title: "Character Render — Profile View",
    description: "Profile still highlighting form, texture read and side silhouette.",
    src: "../assets/gallery/renders/render-04-character-profile.png",
    placeholder: "Character profile render"
  },
  {
    type: "image",
    title: "Prop Render — Diving Helmet",
    description: "Prop-focused render showing material finish, shape detail and surface wear.",
    src: "../assets/gallery/renders/render-05-diving-helmet.png",
    placeholder: "Prop render"
  },
  {
    type: "image",
    title: "Scene Render — Underwater Bell",
    description: "A still focused on industrial underwater storytelling and environmental tension.",
    src: "../assets/gallery/renders/render-06-underwater-bell.png",
    placeholder: "Scene render"
  },
  {
    type: "image",
    title: "Material Study — Wet Metal",
    description: "Surface and shader study testing reflection, roughness and wet material response.",
    src: "../assets/gallery/renders/render-07-wet-metal-study.png",
    placeholder: "Material study"
  },
  {
    type: "image",
    title: "Stylised Frame — Blue Grade",
    description: "A graded still exploring stronger stylisation, contrast and cooler tonal control.",
    src: "../assets/gallery/renders/render-08-blue-grade.png",
    placeholder: "Stylised frame"
  },
  {
    type: "image",
    title: "Composition Still — Wide Shot",
    description: "A wider framing pass focused on layout, foreground depth and readability.",
    src: "../assets/gallery/renders/render-09-wide-composition.png",
    placeholder: "Composition still"
  },
  {
    type: "image",
    title: "Final Beauty Render",
    description: "A polished final render intended as one of the strongest stills in the set.",
    src: "../assets/gallery/renders/render-10-final-beauty.png",
    placeholder: "Final beauty render"
  }
];

renderPage({
  title: "Gallery",
  kicker: "Selected Work",
  intro:
    "A navigable archive of video work and render stills. Click any card to open it in a larger semi full-screen viewer, making this page your main visual showcase hub.",
  heroImage: "../assets/covers/gallery.png",
  heroCaption:
    "Designed as a clean portfolio gallery with quick navigation, titled sections and large media viewing.",
  tags: ["Showreel", "Animation", "Video", "Renders", "3D", "Games"],
  quickNav: [
    { id: "video-work", label: "Video Work" },
    { id: "render-stills", label: "Render Stills" }
  ],
  mediaGroups: [
    {
      id: "video-work",
      title: "Video Work",
      intro:
        "Ten video slots for reels, gameplay captures, motion tests, breakdowns and presentation edits.",
      items: videoItems
    },
    {
      id: "render-stills",
      title: "Render Stills",
      intro:
        "Ten render slots for hero images, environments, materials, props and polished final beauty shots.",
      items: renderItems
    }
  ],
  sections: [
    {
      title: "How this gallery is organised",
      body: [
        "Use the quick navigation buttons at the top to jump straight to videos or renders.",
        "Each card has a proper title and description so the page reads like a curated portfolio, not a file dump.",
        "Videos open in a large overlay player, while renders open in the same viewer for a more focused look.",
        "Video thumbnails should now be generated from a frame inside each MP4 rather than using one shared cover image."
      ]
    }
  ],
  links: [
    {
      title: "22 Minutes",
      description: "Open the project page for a deeper look at one featured game project.",
      href: "./twenty-two-minutes.html"
    }
  ],
  footerNote:
    "Place your files inside ../assets/gallery/videos/ and ../assets/gallery/renders/. Video cards are set up to use a captured frame from each MP4 as the preview image."
});