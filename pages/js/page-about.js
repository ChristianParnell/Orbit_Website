import { renderPage } from "./render-page.js";

renderPage({
  title: "About",
  kicker: "Background",
  intro: "Hey I'm Still adding to this",
  heroImage: "../assets/covers/about.JPG",
  heroCaption: "Will ad a personal Statement here",
  tags: ["Animation", "Game Development", "3D", "Visual Storytelling"],
  sections: [
    {
      title: "Who I am",
      body: "will talk about how i am a designer"
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
