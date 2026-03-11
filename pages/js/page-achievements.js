import { renderPage } from "./render-page.js";

renderPage({
  title: "Achievements",
  kicker: "Highlights",
  intro: "Hey, Here is the page im still working on.",
  heroImage: "../assets/covers/achievements.jpg",
  heroCaption: "A page for the moments, wins, and milestones worth surfacing clearly.",
  tags: ["Milestones", "Experience", "Study", "Recognition"],
  timeline: [
    {
      year: "Add Date",
      title: "Featured milestone",
      description: "Replace this with a real achievement, exhibition, internship, release, or award."
    },
    {
      year: "Add Date",
      title: "Project launch",
      description: "Use this slot for a finished portfolio piece or public release."
    },
    {
      year: "Add Date",
      title: "Professional step",
      description: "Add work experience, leadership, or a moment that helped shape your direction."
    }
  ],
  sections: [
    {
      title: "What belongs here",
      body: [
        "Academic achievements that matter to your portfolio.",
        "Industry or freelance wins.",
        "Public-facing releases.",
        "Anything that builds trust or shows growth."
      ]
    },
    {
      title: "Keep it focused",
      body: "This page works best when it feels selective. Put the strongest and most relevant milestones here rather than everything you’ve ever done."
    }
  ]
});
