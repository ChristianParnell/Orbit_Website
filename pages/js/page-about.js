import { renderPage } from "./render-page.js";

renderPage({
  title: "About",
  kicker: "Background",
  theme: "about",
  status: {
    label: "Profile",
    value: "CREATIVE // VERIFIED",
    note: "Final-year design student with public-facing creative work and strong customer-facing leadership experience.",
    strength: 5
  },
  intro:
    "I’m a South African-born creative based in New Zealand, studying Animation VFX and Media Design while building work across game development, digital design, and visual storytelling.",
  heroImage: "../assets/covers/about.JPG",
  heroCaption:
    "A multidisciplinary creative practice shaped by animation, design, games, and years of people-focused work.",
  tags: [
    "Animation VFX",
    "Media Design",
    "Game Development",
    "Customer Experience"
  ],
  sections: [
    {
      title: "Who I am",
      body: [
        "Hi, I’m Christian Parnell, a South African-born creative now based in New Zealand. I moved here at 18 to pursue animation professionally and now study a Bachelor of Design Innovation at Victoria University of Wellington, double majoring in Animation VFX and Media Design.",
        "My work sits between visual storytelling, digital design, and interactive media. Animation led me into game development, where I discovered a deeper interest in world-building, real-time design, and creating experiences that feel immersive, cinematic, and personal."
      ]
    },
    {
      title: "What I bring",
      body: [
        "Alongside my creative practice, I bring more than five years of customer service experience across retail and hospitality. Those roles taught me how to communicate clearly, stay composed under pressure, and handle responsibility in fast-paced environments.",
        "I’ve worked in independent responsibility roles, processed customer orders accurately, supported teams, handled stock and cash, and stepped into leadership positions including Team Lead and Assistant Store Manager. That balance of creative drive and practical reliability shapes how I work on both solo and collaborative projects."
      ]
    },
    {
      title: "Tools, interests, and direction",
      body: [
        "My skill set includes Unity, Unreal Engine, Blender, Maya, Adobe applications, and virtual reality workflows. I’m especially interested in projects that combine strong atmosphere, technical craft, and storytelling across games, moving image, and digital design.",
        "Outside of study and production, I’m into spearfishing, kitesurfing, squash, hiking, and game development. Those interests feed back into the kind of work I enjoy making: physical, immersive, and connected to a sense of movement, environment, and discovery."
      ]
    }
  ],
  timeline: [
    {
      year: "2019",
      title: "Creative foundation",
      description:
        "Graduated from Westville Boys High School with distinctions in Visual Art and Business Studies, building an early base in both creative practice and practical thinking."
    },
    {
      year: "Now",
      title: "Study + professional experience",
      description:
        "Final-year Bachelor of Design Innovation student at Victoria University of Wellington, while also bringing years of customer-facing retail and hospitality experience into my professional approach."
    },
    {
      year: "Next",
      title: "Where I’m heading",
      description:
        "Growing toward a professional creative career that combines animation, VFX, media design, and game development with strong communication, teamwork, and audience awareness."
    }
  ],
  links: [
    {
      title: "Open Gallery",
      description:
        "View a curated selection of animation, game, design, and visual work.",
      href: "./gallery.html"
    },
    {
      title: "Achievements",
      description:
        "See exhibitions, academic milestones, and released project highlights.",
      href: "./achievements.html"
    },
    {
      title: "Contact",
      description:
        "Open the contact page for collaboration, work, or project enquiries.",
      href: "./contact.html"
    }
  ],
  footerNote:
    "This page now reads more like a professional creative profile, while still sounding personal and grounded in your actual experience."
});
