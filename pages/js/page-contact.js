import { renderPage } from "./render-page.js";

renderPage({
  title: "Contact",
  kicker: "Get in touch",
  theme: "contact",
  status: {
    label: "Network",
    value: "LINK OPEN // AVAILABLE",
    note: "Best for collaboration, creative opportunities, freelance enquiries, and portfolio conversations.",
    strength: 4
  },
  intro:
    "Kia ora — I’m Christian Parnell, a Wellington-based creative studying Design Innovation with a double major in Animation VFX and Media Design. I’m always keen to connect about animation, game development, design, digital storytelling, and customer-facing creative work.",
  heroImage: "../assets/covers/contact.jpg",
  heroCaption:
    "Open for collaboration, creative opportunities, freelance conversations, and portfolio enquiries from New Zealand and beyond.",
  tags: ["Email", "Phone", "Collaboration", "Creative Work"],
  links: [
    {
      title: "christianparnell2024@gmail.com",
      description: "Best email for project, work, and collaboration enquiries.",
      href: "mailto:christianparnell2024@gmail.com",
      external: true
    },
    {
      title: "022 020 3272",
      description: "Direct contact number.",
      href: "tel:+64220203272",
      external: true
    },
    {
      title: "GitHub",
      description: "Orbit Website repository and code work.",
      href: "https://github.com/ChristianParnell/Orbit_Website",
      external: true
    },
    {
      title: "22 Minutes on Steam",
      description: "My published solo indie game project.",
      href: "https://store.steampowered.com/app/2765180/22_Minutes/",
      external: true
    },
    {
      title: "Sketchfab",
      description: "3D work and digital asset presence.",
      href: "https://sketchfab.com/OblixStudio",
      external: true
    }
  ],
  sections: [
    {
      title: "kia ora",
      body: [
        "I’m currently based in Wellington 7010, New Zealand.",
        "The easiest way to reach me is by email, especially for project discussions, freelance work, portfolio feedback, and creative collaboration.",
        "I’m happy to talk about animation, VFX, media design, game development, customer-facing roles, and multidisciplinary creative opportunities."
      ]
    },
    {
      title: "What I bring",
      body: [
        "I combine creative practice with several years of experience in customer service, retail, hospitality, and team support.",
        "My background includes independent responsibility, handling customers in fast-paced environments, processing orders accurately, and communicating clearly under pressure.",
        "Alongside that, I’m building a portfolio across animation, visual storytelling, digital content creation, 3D work, and game development."
      ]
    },
    {
      title: "Current focus",
      body: [
        "Final-year Bachelor of Design Innovation student at Te Herenga Waka — Victoria University of Wellington, double majoring in Animation VFX and Media Design.",
        "Developing personal creative projects, including game work, portfolio pieces, and digital world-building across multiple mediums.",
        "Looking for opportunities where creativity, communication, design thinking, and technical experimentation can all work together."
      ]
    },
    {
      title: "Good fit enquiries",
      body: [
        "Creative collaboration and portfolio-based work.",
        "Animation, media design, game development, and digital content opportunities.",
        "Customer-facing, communications, retail, or hybrid creative roles where strong people skills matter.",
        "References are available on request."
      ]
    }
  ],
  timeline: [
    {
      year: "Now",
      title: "Wellington, New Zealand",
      description:
        "Studying, building new portfolio work, and open to professional opportunities and collaborations."
    },
    {
      year: "2024",
      title: "22 Minutes released",
      description:
        "Released the Alpha 0.1 version of my solo indie game 22 Minutes on Steam, adding a public release to my creative portfolio."
    },
    {
      year: "Ongoing",
      title: "Creative + customer experience",
      description:
        "Bringing together visual storytelling, game development, and years of frontline customer and team experience into one evolving practice."
    }
  ],
  footerNote:
    "This contact page now reflects real CV information while keeping it portfolio-friendly. If you want, the next step is adding your Vimeo and social links once you decide which accounts you want public."
});
