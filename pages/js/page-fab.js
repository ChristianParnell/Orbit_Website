import { renderPage } from "./render-page.js";

renderPage({
  title: "FAB",
  kicker: "Assets & Publishing",
  intro: "Use this page for downloadable assets, packs, published resources, or a curated list of things you’ve released. It works well as a bridge between portfolio presentation and practical distribution.",
  heroImage: "../assets/covers/fab.png",
  heroCaption: "Great for asset packs, experiments, downloads, or published files.",
  tags: ["Assets", "Publishing", "Downloads", "Toolkit"],
  sections: [
    {
      title: "What to include",
      body: [
        "Asset packs with short descriptions.",
        "Release notes or version updates.",
        "Licensing or usage notes.",
        "Screenshots and quick previews."
      ]
    },
    {
      title: "External publishing",
      body: "If you already have a live FAB page, you can keep this as a branded landing page and send people outward, or expand it into a richer archive of everything you’ve made available."
    }
  ],
  links: [
    {
      title: "Replace with FAB profile",
      description: "Update this link to your real FAB page when ready.",
      href: "https://www.fab.com/",
      external: true
    },
    {
      title: "Back to gallery",
      description: "Pair asset releases with visuals and demos from your portfolio.",
      href: "./gallery.html"
    }
  ]
});
