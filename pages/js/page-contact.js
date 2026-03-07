import { renderPage } from "./render-page.js";

renderPage({
  title: "Contact",
  kicker: "Get in touch",
  intro: "This page is ready for your contact details, social links, CV download, and a clear invitation for collaboration. Replace the placeholder links below with your real ones.",
  heroImage: "../assets/covers/contact.jpg",
  heroCaption: "A simple end point for collaborators, employers, and clients.",
  tags: ["Email", "Links", "Collaboration", "CV"],
  links: [
    {
      title: "Email",
      description: "Replace with your real email address.",
      href: "mailto:your@email.com",
      external: true
    },
    {
      title: "LinkedIn",
      description: "Swap this for your profile.",
      href: "https://www.linkedin.com/",
      external: true
    },
    {
      title: "GitHub",
      description: "Link to your code, experiments, or public repos.",
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
