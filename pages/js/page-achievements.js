import { renderPage } from "./render-page.js";

renderPage({
  title: "Achievements",
  kicker: "Highlights",
  theme: "achievements",
  status: {
    label: "Verification",
    value: "CERTIFIED // TRACKING",
    note: "Milestone records surfaced as academic, creative, and professional proof points.",
    strength: 5
  },
  intro:
    "A selection of the milestones that best show my growth across creative practice, public exhibition, independent project work, and professional responsibility.",
  heroImage: "../assets/covers/achievements.jpg",
  heroCaption:
    "Creative wins, public-facing work, and the steps that helped shape my direction.",
  tags: ["Milestones", "Exhibition", "Released Work", "Leadership"],
  timeline: [
    {
      year: "2019",
      title: "Distinctions in Visual Art",
      description:
        "My final Visual Art examination projects included an animated short film and two interactive video games. The work received distinctions from the external moderator at Westville Boys High School."
    },
    {
      year: "2022",
      title: "Te Aro Virtual Reality Exhibit",
      description:
        "Exhibited two virtual reality simulations at Victoria University of Wellington’s Te Aro Campus, giving my work a public audience in an exhibition setting."
    },
    {
      year: "2024",
      title: "First commercial game release",
      description:
        "Released 22 Minutes on Steam as an Alpha 0.1 solo indie project, marking my first commercial game launch and a major step in turning personal development work into a public release."
    },
    {
      year: "Recent",
      title: "Leadership progression",
      description:
        "Progressed from Team Lead into Assistant Store Manager, building on years of customer-facing experience with stronger responsibility in team support, administration, and day-to-day operations."
    }
  ],
  sections: [
    {
      title: "Creative and academic milestones",
      body: [
        "Distinctions in Visual Art and Business Studies gave me an early foundation in both creative thinking and practical problem-solving.",
        "Exhibiting virtual reality work at Te Aro showed that my practice could function in a public and experiential setting, not just as coursework.",
        "Releasing 22 Minutes on Steam marked a shift from student and personal experimentation into published independent work."
      ]
    },
    {
      title: "Professional growth",
      body: [
        "My experience also includes more than five years of customer service across retail and hospitality, where I built strong communication, organisation, and follow-through.",
        "Roles involving independent store operation, stock and cash handling, order processing, and team support helped me develop trust, adaptability, and leadership under pressure.",
        "That professional background matters here because it shows consistency and responsibility alongside the creative work."
      ]
    },
    {
      title: "What these milestones show",
      body:
        "Taken together, these achievements show a mix of creativity, technical growth, public presentation, and real-world reliability. They reflect someone building toward a professional creative career with both practical work ethic and strong personal drive."
    }
  ],
  links: [
    {
      title: "About",
      description:
        "Read the broader story behind my background, studies, and creative direction.",
      href: "./about.html"
    },
    {
      title: "Open Gallery",
      description:
        "See the work that sits behind these milestones and ongoing projects.",
      href: "./gallery.html"
    },
    {
      title: "Contact",
      description:
        "Open the contact page for collaboration, work, or project enquiries.",
      href: "./contact.html"
    }
  ],
  footerNote:
    "This page now focuses on proof points that build trust: distinctions, exhibition work, a public game release, and clear leadership growth."
});
