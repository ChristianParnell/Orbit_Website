import { renderPage } from "./render-page.js";

renderPage({
  title: "22 Minutes",
  kicker: "Game Project",
  intro: "Use this page as a feature project landing page. It suits one major game or worldbuilding project where you want more room for concept, gameplay, mood, process, and visual development.",
  heroImage: "../assets/covers/steam_22minutes.png",
  heroCaption: "A focused project page for one of your flagship game ideas or releases.",
  tags: ["Game Design", "Worldbuilding", "Interaction", "Pitch"],
  sections: [
    {
      title: "Project overview",
      body: "Write a sharp summary here: the concept, the world, the player role, the tone, and what makes the project memorable."
    },
    {
      title: "What to show",
      body: [
        "A short trailer or gameplay clip.",
        "Concept art or environment stills.",
        "Key mechanics.",
        "Your role and process."
      ]
    }
  ],
  media: [
    {
      type: "video",
      title: "Trailer placeholder",
      description: "Swap this for a project trailer or proof-of-concept clip.",
      src: "",
      placeholder: "Trailer Placeholder"
    },
    {
      type: "image",
      title: "Feature still",
      description: "Use a polished hero image, key art, or gameplay frame.",
      src: "../assets/covers/steam_22minutes.png"
    }
  ],
  links: [
    {
      title: "Open gallery",
      description: "Keep related frames and motion pieces connected from here.",
      href: "./gallery.html"
    }
  ]
});
