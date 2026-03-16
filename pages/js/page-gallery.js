import { renderPage } from "./render-page.js";

const videoItems = [
  {
    type: "video",
    title: "Portfolio Showreel 2026",
    description: "Main edited reel featuring a collection of animations I have created.",
    src: "../assets/gallery/videos/video-01-showreel.mp4",
    thumbTime: 2.2,
    placeholder: "Showreel video"
  },
  {
    type: "video",
    title: "22 Minutes — Gameplay Trailer",
    description: "A showcase of 22 Minutes. Huge spoiler if you have not played it yet ;)",
    src: "../assets/gallery/videos/video-02-22-minutes-trailer.mp4",
    thumbTime: 3.0,
    placeholder: "Gameplay trailer"
  },
  {
    type: "video",
    title: "Fun Animation",
    description: "A fun animation featuring movement, timing and visual energy.",
    src: "../assets/gallery/videos/Video-03-Fun-Animation.mp4",
    thumbTime: 1.8,
    placeholder: "Fun animation video"
  },
  {
    type: "video",
    title: "Woe — Intro",
    description: "Woe intro for an unpublished game, introducing the premise.",
    src: "../assets/gallery/videos/video-04-Woe-Intro.mp4",
    thumbTime: 2.4,
    placeholder: "Intro video"
  },
  {
    type: "video",
    title: "Space Ship Animation",
    description: "An animation study focused on timing, motion, posing and overall polish.",
    src: "../assets/gallery/videos/video-05-character-animation.mp4",
    thumbTime: 1.6,
    placeholder: "Space ship animation"
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
    description: "In 2021 I designed this game, but could not finish it because the scope became too massive. I kept the name and later began a new version of Woe, following a similar world design.",
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
    description: "An illustration of the illusion of movement created through individual sequential photographs.",
    src: "../assets/gallery/videos/video-09-lighting-study.mp4",
    thumbTime: 2.6,
    placeholder: "Stop motion animation"
  },
  {
    type: "video",
    title: "Spider Motion Capture",
    description: "A project combining CGI with real-life footage, focused on motion and visual integration.",
    src: "../assets/gallery/videos/video-10-turntable.mp4",
    thumbTime: 1.2,
    placeholder: "Spider motion capture"
  }
];

const renderItems = [
  {
    type: "image",
    title: "Hero Render Orbit Portrait",
    description: "Experimenting with swamp and nature aesthetics through Blender and through a sci-fi lens.",
    src: "../assets/gallery/renders/render-01-orbit-portrait.png",
    placeholder: "Hero render"
  },
  {
    type: "image",
    title: "22 Minutes Reactor Core",
    description: "A wide environmental frame focused on depth and spatial composition for my game 22 Minutes.",
    src: "../assets/gallery/renders/render-02-dusk-environment.png",
    placeholder: "Environment render"
  },
  {
    type: "image",
    title: "WW2 Render",
    description: "A front-facing render featuring procedural clouds and dramatic lighting.",
    src: "../assets/gallery/renders/render-03-character-front.png",
    placeholder: "WW2 render"
  },
  {
    type: "image",
    title: "All Blacks Photobooth Concept",
    description: "An initial concept developed for an All Blacks photobooth arcade experience.",
    src: "../assets/gallery/renders/render-04-character-profile.png",
    placeholder: "All Blacks concept"
  },
  {
    type: "image",
    title: "Ocean Render",
    description: "Experimental water physics with high-paced animation — render still in progress.",
    src: "../assets/gallery/renders/render-05-diving-helmet.png",
    placeholder: "Ocean render"
  },
  {
    type: "image",
    title: "Asteroid Belt",
    description: "Early production render for a university capstone featuring a space battle across an asteroid belt.",
    src: "../assets/gallery/renders/render-06-underwater-bell.png",
    placeholder: "Asteroid belt render"
  },
  {
    type: "image",
    title: "Motion Design Animation Render",
    description: "Experimental motion animation created with hand-drawn 2D Photoshop assets.",
    src: "../assets/gallery/renders/render-07-wet-metal-study.png",
    placeholder: "Motion design render"
  },
  {
    type: "image",
    title: "Woe 2.0",
    description: "Woe 2.0 — currently in production, featuring the opening scene inside the spaceship.",
    src: "../assets/gallery/renders/render-08-blue-grade.png",
    placeholder: "Woe 2.0 render"
  },
  {
    type: "image",
    title: "Character Animation Render",
    description: "A frame captured from an emotion-driven animation.",
    src: "../assets/gallery/renders/render-09-wide-composition.png",
    placeholder: "Character animation render"
  },
  {
    type: "image",
    title: "Woe 2.0 Bunker",
    description: "A render still from Woe 2.0 featuring one of the hidden bunkers.",
    src: "../assets/gallery/renders/render-10-final-beauty.png",
    placeholder: "Woe 2.0 bunker render"
  }
];

renderPage({
  title: "Gallery",
  kicker: "Selected Work",
  intro:
    "A navigable archive of my video work and render stills. Click any card to expand it into a larger, near full-screen viewer, turning this page into a central visual showcase.",
  heroImage: "../assets/covers/gallery.png",
  heroCaption: "Designed as a clean portfolio gallery.",
  tags: ["Showreel", "Animation", "Video", "Renders", "3D", "Games"],
  quickNav: [
    { id: "video-work", label: "Video Work" },
    { id: "render-stills", label: "Render Stills" }
  ],
  mediaGroups: [
    {
      id: "video-work",
      title: "Video Work",
      intro: "A selection of reels, gameplay captures, motion tests and presentation edits.",
      items: videoItems
    },
    {
      id: "render-stills",
      title: "Render Stills",
      intro: "A collection of stills including environments, concepts, experiments and production renders.",
      items: renderItems
    }
  ],
  sections: [
    {
      title: "Hey! Welcome to my Gallery Page.",
      body: [
        "Use the quick navigation buttons at the top to jump straight to videos or renders.",
        "I really hope you enjoy this selection. It is not my full collection, but rather 20 pieces from my ongoing projects.",
        "Unfortunately, some of my latest work is still under development and not ready to be shown yet, but I hope the pieces included here provide a strong impression of my work so far."
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
  footerNote: "Heyy, you have reached the end of the Gallery :)"
});