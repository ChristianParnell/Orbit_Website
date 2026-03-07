import { renderPage } from "./render-page.js";

renderPage({
  title: "About",
  kicker: "Background",
  intro: "This page is built as a clean foundation for your personal portfolio. Use it to introduce your design voice, animation background, game development focus, and the kind of work you want people to remember after leaving the site.",
  heroImage: "../assets/covers/about.JPG",
  heroCaption: "Swap this copy for a short personal statement or a one-line design philosophy.",
  tags: ["Animation", "Game Development", "3D", "Visual Storytelling"],
  sections: [
    {
      title: "Who I am",
      body: "Write this in your own voice. Keep it direct and personal. Explain what kind of designer you are, what kinds of worlds or experiences you like building, and what pulls you toward motion, interaction, atmosphere, and storytelling."
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
      year: "Now",
      title: "Portfolio foundation",
      description: "This rewrite gives you a solid static setup that is easy to expand page by page."
    },
    {
      year: "Next",
      title: "Add project depth",
      description: "Replace placeholders with final text, stills, trailers, and embedded work."
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
