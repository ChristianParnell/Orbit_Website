
import { renderPage } from "./render-page.js";

renderPage({
  title: "About",
  kicker: "Background",
  theme: "about",
  status: {
    label: "Signal",
    value: "IDENTITY // STABLE",
    note: "Profile node synced to the orbit system.",
    strength: 4
  },
  intro: "I’m driven by a passion for building visual experiences, combining animation, VFX, design, and game development into one evolving creative practice.",
  heroImage: "../assets/covers/about.JPG",
  heroCaption: "I’m based in New Zealand, passionate about animation, design, and building immersive digital experiences.",
  tags: ["Animation", "Game Development", "3D", "Visual Storytelling"],
  sections: [
    {
      title: "Who I am",
      body: [
        "Hi, I’m Christian Parnell, a South African-born creative now based in New Zealand. I moved here at 18 to pursue my dream of working professionally in animation, and I feel incredibly lucky to now call this place home. I am currently studying Animation, Visual Effects, and Media Design under a Bachelor of Design Innovation, where I continue to grow my skills across storytelling, design, and digital production.",
        "My passion for animation has also led me into game development, opening up a wider creative world of coding, design, and interactive experiences. With four games completed, one published and another on the way, I feel closer than ever to building a professional career doing what I love."
      ]
    },
    {
      title: "What this site is for",
      body: [
        "Introduce yourself professionally.",
        "Show a curated body of work.",
        "Give people a clear route into your projects.",
        "Create one home for your evolving portfolio."
      ]
    }
  ],
  timeline: [
    {
      year: "2026",
      title: "What I'm working on at the moment",
      description: "Thylassaphobia & Animation Intro for OblixStudio."
    },
    {
      year: "Next",
      title: "Depth",
      description: "I’m a multidisciplinary creative based in New Zealand, with a background in animation, VFX, media design, and game development. My work is driven by a passion for storytelling, immersive world-building, and combining visual creativity with technical skill across digital projects."
    }
  ],
  links: [
    {
      title: "Open Gallery",
      description: "Jump to the page designed for videos, stills, and featured work.",
      href: "./gallery.html"
    },
    {
      title: "Contact",
      description: "Add your email, social links, and collaboration details here.",
      href: "./contact.html"
    }
  ],
  footerNote: "Tip: keep this page short, sharp, and recognisably you. It should sound like you talking, not a generic artist bio."
});
