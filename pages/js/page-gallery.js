import { renderPage } from "./render-page.js";

renderPage({
  title: "Gallery",
  kicker: "Selected Work",
  intro: "This page is structured for moving image and visual work. The cards below are ready for MP4 files, embedded videos, image stills, or breakdowns of projects. Replace the placeholders with your actual work as you build it out.",
  heroImage: "../assets/covers/gallery.png",
  heroCaption: "Use this page as the main video and showcase hub for your portfolio.",
  tags: ["Showreel", "Video", "Animation", "Screenshots"],
  media: [
    {
      type: "video",
      title: "Showreel",
      description: "Drop in your main portfolio reel here by replacing the src path in page-gallery.js.",
      src: "",
      placeholder: "Portfolio Reel Placeholder"
    },
    {
      type: "video",
      title: "Game Capture",
      description: "Use this for gameplay footage, in-engine shots, or level walk-throughs.",
      src: "",
      placeholder: "Gameplay Video Placeholder"
    },
    {
      type: "image",
      title: "Still Frame Set",
      description: "Use stills for hero shots, environment frames, or polished project thumbnails.",
      src: "../assets/covers/gallery.png"
    }
  ],
  sections: [
    {
      title: "How to use this page",
      body: [
        "Swap each media card with real videos, image stills, or embeds.",
        "Group work by theme if needed, such as animation, games, 3D, or VFX.",
        "Keep the best work nearest the top.",
        "Aim for clean thumbnails and short descriptions."
      ]
    },
    {
      title: "Suggested additions",
      body: "You can extend this layout with filters, project categories, lightboxes, or a dedicated page per project when you want to go deeper."
    }
  ],
  links: [
    {
      title: "22 Minutes",
      description: "Use the project page format for a deeper look at one featured game.",
      href: "./twenty-two-minutes.html"
    }
  ],
  footerNote: "For GitHub Pages, local MP4 files work well if you place them inside an assets/video folder and reference them with relative paths."
});
