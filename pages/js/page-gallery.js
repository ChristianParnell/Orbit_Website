import { renderPage } from "./render-page.js";

const videoItems = [
  {
    type: "video",
    title: "Portfolio Showreel 2026",
    description: "Main edited reel featuring a collection of Animations I have done",
    src: "../assets/gallery/videos/video-01-showreel.mp4",
    thumbTime: 2.2,
    placeholder: "Showreel video"
  },
  {
    type: "video",
    title: "22 Minutes — Gameplay Trailer",
    description: "22 Minutes Showcase, Huge Spoiler if you haven't played it yet ;)",
    src: "../assets/gallery/videos/video-02-22-minutes-trailer.mp4",
    thumbTime: 3.0,
    placeholder: "Gameplay trailer"
  },
  {
    type: "video",
    title: "Fun Animation",
    description: "A fun Animation featuring movement, timing and visual energy.",
    src: "../assets/gallery/videos/Video-03-Fun-Animation.mp4",
    thumbTime: 1.8,
    placeholder: "Fun animation video"
  },
  {
    type: "video",
    title: "Woe — Intro",
    description: "Woe intro, Unpublished game introducing the premise.",
    src: "../assets/gallery/videos/video-04-Woe-Intro.mp4",
    thumbTime: 2.4,
    placeholder: "Intro video"
  },
  {
    type: "video",
    title: "Space Ship Animation",
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
    title: "Old Woe",
    description: "In 2021 I designed this game, but couldn't finish it as it was too massive of a project, I kept the name and started a new project Woe again, following simiular world design.'",
    src: "../assets/gallery/videos/video-07-vfx-breakdown.mp4",
    thumbTime: 2.0,
    placeholder: "Old Woe"
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
    title: "Stop Motion Animation",
    description: "Illustration of the illusion of movement by taking individual, sequential photos.",
    src: "../assets/gallery/videos/video-09-lighting-study.mp4",
    thumbTime: 2.6,
    placeholder: "Stop Motion Animation"
  },
  {
    type: "video",
    title: "Spider Motion Capture",
    description: "A clean turntable render showing off modelling, as well as inserting CGI into Real life footage.",
    src: "../assets/gallery/videos/video-10-turntable.mp4",
    thumbTime: 1.2,
    placeholder: "Spider Motion Capture"
  }
];

const renderItems = [
  {
    type: "image",
    title: "Hero Render Orbit Portrait",
    description: "Experimenting with Swamp and Nature Aesthetics through blender and Through a Sci-Fi Lens",
    src: "../assets/gallery/renders/render-01-orbit-portrait.png",
    placeholder: "Hero render"
  },
  {
    type: "image",
    title: "22 Minutes Reactor Core",
    description: "Wide environmental frame focused depth and spatial composition for my game 22 Minutes.",
    src: "../assets/gallery/renders/render-02-dusk-environment.png",
    placeholder: "Environment render"
  },
  {
    type: "image",
    title: "WW2 Render",
    description: "Front-Facing Render Featuring Procedural Clouds and Lighting.",
    src: "../assets/gallery/renders/render-03-character-front.png",
    placeholder: "Character front render"
  },
  {
    type: "image",
    title: "All Blacks PhotoBooth Concept",
    description: "Contracted to Develop an Initial Concept for an All Blacks Photobooth Arcade.",
    src: "../assets/gallery/renders/render-04-character-profile.png",
    placeholder: "Character profile render"
  },
  {
    type: "image",
    title: "Ocean Render",
    description: "Experimental Water Physics with High-Pace Animation — Render Still in Progress",
    src: "../assets/gallery/renders/render-05-diving-helmet.png",
    placeholder: "Prop render"
  },
  {
    type: "image",
    title: "Asteroid Belt",
    description: "Early Production Render for a University Capstone Featuring a Space Battle Across an Asteroid Belt",
    src: "../assets/gallery/renders/render-06-underwater-bell.png",
    placeholder: "Scene render"
  },
  {
    type: "image",
    title: "Motion Design Animation Render",
    description: "Experimental Motion Animation with Hand-Drawn 2D Photoshop Assets.",
    src: "../assets/gallery/renders/render-07-wet-metal-study.png",
    placeholder: "Material study"
  },
  {
    type: "image",
    title: "Woe 2.0",
    description: "Woe 2.0 — Under Production, Featuring the Opening Scene Inside the Spaceship.",
    src: "../assets/gallery/renders/render-08-blue-grade.png",
    placeholder: "Stylised frame"
  },
  {
    type: "image",
    title: "Character Animation Render",
    description: "Frame Captured from an Emotion Driven Animation",
    src: "../assets/gallery/renders/render-09-wide-composition.png",
    placeholder: "Composition still"
  },
  {
    type: "image",
    title: "Woe 2.0",
    description: "Render Still from Woe 2.0 Featuring One of the Hidden Bunkers.",
    src: "../assets/gallery/renders/render-10-final-beauty.png",
    placeholder: "Woe 2.0"
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
    "Heyy, you have reached the end of the Gallery :)"
});