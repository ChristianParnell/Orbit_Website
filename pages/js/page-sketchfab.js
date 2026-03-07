import { renderPage } from "./render-page.js";

renderPage({
  title: "Sketchfab",
  kicker: "3D Presentation",
  intro: "This page is designed for your 3D models and presentations. It gives you a branded in-site stop before sending people out to an external model viewer or embedding one directly here later.",
  heroImage: "../assets/covers/sketchfab.png",
  heroCaption: "A clean home for 3D pieces, model breakdowns, and outward links.",
  externalLink: {
    label: "Open Sketchfab",
    href: "https://sketchfab.com/"
  },
  tags: ["3D Models", "Presentation", "Breakdown", "Viewer"],
  sections: [
    {
      title: "Possible structure",
      body: [
        "Hero model embed at the top.",
        "A row of featured models below.",
        "Short notes on modelling, topology, texturing, or rendering.",
        "Links out to the live interactive viewer."
      ]
    },
    {
      title: "Why keep this page",
      body: "It lets the portfolio stay cohesive. Instead of dropping people straight onto another platform, you can frame the work first and keep the experience feeling considered."
    }
  ],
  media: [
    {
      type: "embed",
      title: "Model embed",
      description: "Replace with a real Sketchfab embed URL when you are ready.",
      src: "",
      placeholder: "Sketchfab Embed Placeholder"
    }
  ]
});
