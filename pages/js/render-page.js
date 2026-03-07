export function renderPage(config) {
  const shell = document.getElementById("pageShell");
  if (!shell) return;

  const {
    title,
    kicker,
    intro,
    heroImage,
    heroCaption,
    externalLink,
    tags = [],
    sections = [],
    media = [],
    timeline = [],
    links = [],
    footerNote = ""
  } = config;

  shell.className = "page-shell";

  shell.innerHTML = `
    <nav class="page-nav">
      <a class="back-link" href="../index.html">← Back to orbit</a>
      ${externalLink ? `<a class="out-link" href="${externalLink.href}" target="_blank" rel="noreferrer">${externalLink.label} ↗</a>` : ""}
    </nav>

    <section class="page-hero">
      <div class="hero-copy">
        <p class="kicker">${kicker}</p>
        <h1>${title}</h1>
        <p>${intro}</p>
        ${tags.length ? `<ul class="tags">${tags.map((tag) => `<li>${tag}</li>`).join("")}</ul>` : ""}
      </div>

      <div class="hero-media">
        <img src="${heroImage}" alt="${title}" />
        <div class="hero-media__overlay">${heroCaption}</div>
      </div>
    </section>

    <section class="page-grid">
      ${sections.length ? `
        <div class="${sections.length === 2 ? "two-col" : ""}">
          ${sections.map((section) => `
            <article class="section-card">
              <h2>${section.title}</h2>
              ${Array.isArray(section.body)
                ? `<ul>${section.body.map((item) => `<li>${item}</li>`).join("")}</ul>`
                : `<p>${section.body}</p>`}
            </article>
          `).join("")}
        </div>
      ` : ""}

      ${media.length ? `
        <div class="media-grid">
          ${media.map((item) => `
            <article class="media-card">
              <div class="media-card__frame">
                ${renderMediaFrame(item)}
              </div>
              <div class="media-card__body">
                <h3>${item.title}</h3>
                <p>${item.description}</p>
              </div>
            </article>
          `).join("")}
        </div>
      ` : ""}

      ${timeline.length ? `
        <div class="timeline-grid">
          ${timeline.map((item) => `
            <article class="timeline-card">
              <p class="kicker">${item.year}</p>
              <h3>${item.title}</h3>
              <p>${item.description}</p>
            </article>
          `).join("")}
        </div>
      ` : ""}

      ${links.length ? `
        <div class="links-grid">
          ${links.map((item) => `
            <a class="link-card" href="${item.href}" ${item.external ? 'target="_blank" rel="noreferrer"' : ""}>
              <h3>${item.title}</h3>
              <p>${item.description}</p>
            </a>
          `).join("")}
        </div>
      ` : ""}
    </section>

    ${footerNote ? `<p class="footer-note">${footerNote}</p>` : ""}
  `;
}

function renderMediaFrame(item) {
  if (item.type === "video" && item.src) {
    return `<video controls playsinline preload="metadata" src="${item.src}" poster="${item.poster || ""}"></video>`;
  }

  if (item.type === "embed" && item.src) {
    return `<iframe src="${item.src}" title="${item.title}" loading="lazy" allowfullscreen></iframe>`;
  }

  if (item.type === "image" && item.src) {
    return `<img src="${item.src}" alt="${item.title}" />`;
  }

  return `<span>${item.placeholder || "Add media here"}</span>`;
}
