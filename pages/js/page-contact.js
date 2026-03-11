import { renderPage } from "./render-page.js";

renderPage({
  title: "Contact",
  kicker: "Get in touch",
  intro: "Hey!",
  heroImage: "../assets/covers/contact.jpg",
  heroCaption: "I'm Super keen on getting in contact to collabortate",
  tags: ["Email", "Links", "Collaboration", "CV"],
  links: [
    {
      title: "oblixstudio@gmail.com",
      description: "Company Email",
      href: "christianparenll2024@gmai..com",
      external: true
    },
    {
      title: "LinkedIn",
      description: "Job Protfolio",
      href: "https://www.linkedin.com/",
      external: true
    },
    {
      title: "GitHub",
      description: "https://github.com/ChristianParnell/Orbit_Website",
      href: "https://github.com/",
      external: true
    }
  ],
  sections: [
    {
      title: "Suggested copy",
      body: "I’m open to creative collaboration, design opportunities, and conversations around animation, game development, 3D work, and digital storytelling."
    },
    {
      title: "Nice additions",
      body: [
        "A downloadable CV.",
        "Time zone or location.",
        "Preferred kind of enquiry.",
        "One short line about what you’re looking for next."
      ]
    }
  ],
  footerNote: "If you want, this page can later be upgraded to a real contact form using Formspree, Basin, or another static-site form service."
});
