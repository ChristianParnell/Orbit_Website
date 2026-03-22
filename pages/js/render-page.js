function slugify(value) {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeAttr(value) {
  return escapeHtml(value);
}

function fileNameFromPath(src) {
  const clean = String(src || "").split("?")[0].split("#")[0];
  return clean.split("/").filter(Boolean).pop() || "asset";
}

function buildStatusBars(strength = 3) {
  const total = 5;
  const safeStrength = Math.max(0, Math.min(total, Number(strength) || 0));
  return Array.from({ length: total }, (_, index) => {
    const active = index < safeStrength;
    return `<span class="status-panel__bar${active ? " is-active" : ""}" aria-hidden="true"></span>`;
  }).join("");
}

function renderSectionBlock(section) {
  const id = escapeAttr(section.id || slugify(section.title || "section"));
  const title = escapeHtml(section.title || "");
  const body = Array.isArray(section.body)
    ? `<ul>${section.body.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
    : `<p>${escapeHtml(section.body || "")}</p>`;

  return `
    <section class="section-block" id="${id}" data-observe-section>
      <p class="section-label">Node</p>
      <h2>${title}</h2>
      ${body}
    </section>
  `;
}

function renderMediaPreview(item) {
  const type = item.type || "image";
  const title = item.title || "Media preview";
  const src = item.src || "";
  const poster = item.poster || "";
  const placeholder = item.placeholder || "Add media here";
  const thumbTime = Number.isFinite(Number(item.thumbTime)) ? Number(item.thumbTime) : 1.5;

  if (type === "video") {
    if (poster) {
      return `
        <img src="${escapeAttr(poster)}" alt="${escapeAttr(title)} poster" />
      `;
    }

    return `
      <div
        class="media-card__thumb js-video-thumb"
        data-video-src="${escapeAttr(src)}"
        data-video-title="${escapeAttr(title)}"
        data-thumb-time="${escapeAttr(thumbTime)}"
      >
        <img class="media-card__thumb-image" hidden alt="" />
        <div class="media-card__thumb-fallback">${escapeHtml(placeholder)}</div>
      </div>
    `;
  }

  if ((type === "image" || type === "render") && src) {
    return `<img src="${escapeAttr(src)}" alt="${escapeAttr(title)}" />`;
  }

  return `<div class="media-card__frame--placeholder">${escapeHtml(placeholder)}</div>`;
}

function renderMediaCard(item, groupTitle = "Collection") {
  const type = item.type || "image";
  const title = item.title || "Untitled";
  const description = item.description || "";
  const src = item.src || "";
  const badge = type === "video" ? "Video" : type === "embed" ? "Embed" : "Render";
  const hasOpenableMedia = Boolean(src);
  const filename = fileNameFromPath(src);

  const frame = `
    <div class="media-card__frame">
      ${renderMediaPreview(item)}
      <div class="media-card__particle-layer" aria-hidden="true"></div>
      <span class="media-card__action">${type === "video" ? "Play" : "View"}</span>
      <span class="media-card__icon ${type === "video" ? "" : "media-card__icon--view"}">${type === "video" ? "▶" : "⤢"}</span>
      <span class="media-card__filename">${escapeHtml(filename)}</span>
    </div>
  `;

  const frameWrapper = hasOpenableMedia
    ? `
      <button
        class="media-card__trigger js-open-media"
        type="button"
        data-media-type="${escapeAttr(type)}"
        data-media-src="${escapeAttr(src)}"
        data-media-poster="${escapeAttr(item.poster || "")}"
        data-media-title="${escapeAttr(title)}"
        data-media-description="${escapeAttr(description)}"
        data-media-filename="${escapeAttr(filename)}"
        data-media-group="${escapeAttr(groupTitle)}"
      >
        ${frame}
      </button>
    `
    : `<div class="media-card__static">${frame}</div>`;

  return `
    <article class="media-card media-card--gallery media-card--${escapeAttr(type)}">
      ${frameWrapper}
      <div class="media-card__body">
        <div class="media-card__topline">
          <span class="media-badge">${escapeHtml(badge)}</span>
          <span class="media-card__node">${escapeHtml(groupTitle)}</span>
        </div>
        <h3>${escapeHtml(title)}</h3>
        <p>${escapeHtml(description)}</p>
      </div>
    </article>
  `;
}

function renderMediaGroup(group) {
  const groupId = group.id || slugify(group.title || "gallery-section");
  const groupTitle = group.title || "Gallery Section";
  const groupIntro = group.intro || "";
  const items = Array.isArray(group.items) ? group.items : [];

  return `
    <section class="section-card media-section" id="${escapeAttr(groupId)}" data-observe-section>
      <div class="media-section__header">
        <div>
          <p class="section-label">Collection</p>
          <h2>${escapeHtml(groupTitle)}</h2>
        </div>
        ${groupIntro ? `<p class="media-section__intro">${escapeHtml(groupIntro)}</p>` : ""}
      </div>
      <div class="media-grid media-grid--gallery">
        ${items.map((item) => renderMediaCard(item, groupTitle)).join("")}
      </div>
    </section>
  `;
}

function createNavItems({ sections, mediaGroups, timeline, links }) {
  const items = [];

  sections.forEach((section) => {
    items.push({
      id: section.id || slugify(section.title || "section"),
      label: section.navLabel || section.title || "Section"
    });
  });

  mediaGroups.forEach((group) => {
    items.push({
      id: group.id || slugify(group.title || "gallery-section"),
      label: group.navLabel || group.title || "Collection"
    });
  });

  if (timeline.length) {
    items.push({ id: "timeline", label: "Timeline" });
  }

  if (links.length) {
    items.push({ id: "related-projects", label: "Links" });
  }

  return items;
}

function wireLightbox(shell) {
  const lightbox = shell.querySelector("#mediaLightbox");
  const viewer = shell.querySelector("#mediaLightboxViewer");
  const titleEl = shell.querySelector("#mediaLightboxTitle");
  const typeEl = shell.querySelector("#mediaLightboxType");
  const descEl = shell.querySelector("#mediaLightboxDescription");
  const fileEl = shell.querySelector("#mediaLightboxFile");
  const labelEl = shell.querySelector("#mediaLightboxLabel");

  if (!lightbox || !viewer || !titleEl || !typeEl || !descEl || !fileEl || !labelEl) {
    return;
  }

  const closeLightbox = () => {
    lightbox.hidden = true;
    document.body.classList.remove("lightbox-open");
    viewer.innerHTML = "";
    titleEl.textContent = "";
    typeEl.textContent = "";
    descEl.textContent = "";
    fileEl.textContent = "viewer://idle";
    labelEl.textContent = "terminal://standby";
  };

  const openLightbox = (button) => {
    const type = button.dataset.mediaType || "image";
    const src = button.dataset.mediaSrc || "";
    const poster = button.dataset.mediaPoster || "";
    const title = button.dataset.mediaTitle || "Media";
    const description = button.dataset.mediaDescription || "";
    const filename = button.dataset.mediaFilename || fileNameFromPath(src);
    const group = button.dataset.mediaGroup || "Archive";

    if (!src) return;

    viewer.innerHTML = type === "video"
      ? `<video class="media-lightbox__video" controls playsinline ${poster ? `poster="${escapeAttr(poster)}"` : ""} src="${escapeAttr(src)}"></video>`
      : `<img class="media-lightbox__image" src="${escapeAttr(src)}" alt="${escapeAttr(title)}" />`;

    titleEl.textContent = title;
    typeEl.textContent = type === "video" ? "Video" : "Render";
    descEl.textContent = description;
    fileEl.textContent = filename;
    labelEl.textContent = `${group.toLowerCase()}://active`;
    lightbox.hidden = false;
    document.body.classList.add("lightbox-open");
  };

  shell.addEventListener("click", (event) => {
    const openTrigger = event.target.closest(".js-open-media");
    const closeTrigger = event.target.closest("[data-close-lightbox]");

    if (openTrigger) {
      openLightbox(openTrigger);
      return;
    }

    if (closeTrigger) {
      closeLightbox();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !lightbox.hidden) {
      closeLightbox();
    }
  });
}

function initVideoThumbnails(shell) {
  const thumbFrames = shell.querySelectorAll(".js-video-thumb");

  thumbFrames.forEach((frame) => {
    const src = frame.dataset.videoSrc || "";
    const title = frame.dataset.videoTitle || "Video thumbnail";
    const requestedTime = Number(frame.dataset.thumbTime || 1.5);
    const image = frame.querySelector(".media-card__thumb-image");
    const fallback = frame.querySelector(".media-card__thumb-fallback");

    if (!src || !image) return;

    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = "anonymous";

    let cleanedUp = false;

    const cleanup = () => {
      if (cleanedUp) return;
      cleanedUp = true;
      video.removeAttribute("src");
      video.load();
    };

    const fail = () => {
      if (fallback) fallback.hidden = false;
      image.hidden = true;
      cleanup();
    };

    const captureFrame = () => {
      try {
        const width = video.videoWidth;
        const height = video.videoHeight;

        if (!width || !height) {
          fail();
          return;
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          fail();
          return;
        }

        ctx.drawImage(video, 0, 0, width, height);
        image.src = canvas.toDataURL("image/jpeg", 0.86);
        image.alt = `${title} thumbnail`;
        image.hidden = false;
        if (fallback) fallback.hidden = true;
        cleanup();
      } catch (error) {
        fail();
      }
    };

    video.addEventListener(
      "loadedmetadata",
      () => {
        const duration = Number(video.duration);
        const maxSeek = Number.isFinite(duration) && duration > 0
          ? Math.max(0, duration - 0.15)
          : requestedTime;
        const safeTime = Math.max(0.1, Math.min(requestedTime, maxSeek || requestedTime));
        video.currentTime = safeTime;
      },
      { once: true }
    );

    video.addEventListener("seeked", captureFrame, { once: true });
    video.addEventListener("error", fail, { once: true });
    video.src = src;
    video.load();
  });
}

function initSectionObserver(shell) {
  const navLinks = Array.from(shell.querySelectorAll("[data-nav-target]"));
  const targetMap = new Map();

  navLinks.forEach((link) => {
    const targetId = link.dataset.navTarget;
    if (targetId) targetMap.set(targetId, link);
  });

  const sections = Array.from(
    shell.querySelectorAll("[data-observe-section], .section-block[id], .media-section[id], #timeline, #related-projects")
  );

  if (!sections.length || !navLinks.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const id = entry.target.id;
        const link = targetMap.get(id);
        if (!link) return;

        if (entry.isIntersecting) {
          navLinks.forEach((item) => item.classList.remove("is-active"));
          link.classList.add("is-active");
          shell
            .querySelectorAll(`.quick-nav__link[href="#${CSS.escape(id)}"]`)
            .forEach((item) => item.classList.add("is-active"));
        } else {
          shell
            .querySelectorAll(`.quick-nav__link[href="#${CSS.escape(id)}"]`)
            .forEach((item) => item.classList.remove("is-active"));
        }
      });
    },
    {
      rootMargin: "-35% 0px -45% 0px",
      threshold: 0.1
    }
  );

  sections.forEach((section) => observer.observe(section));
}

function initIdlePulse() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  let timeoutId = null;

  const schedule = () => {
    window.clearTimeout(timeoutId);
    document.body.classList.remove("is-idle-nav");
    timeoutId = window.setTimeout(() => {
      document.body.classList.add("is-idle-nav");
    }, 3800);
  };

  ["mousemove", "keydown", "scroll", "touchstart", "pointerdown"].forEach((eventName) => {
    window.addEventListener(eventName, schedule, { passive: true });
  });

  schedule();
}

function spawnBinaryParticles(frame, density = 7) {
  const layer = frame.querySelector(".media-card__particle-layer");
  if (!layer) return;

  const glyphs = ["0", "1", "01", "{ }", "10", "<>"];
  layer.innerHTML = "";

  for (let index = 0; index < density; index += 1) {
    const particle = document.createElement("span");
    particle.className = "binary-particle";
    particle.textContent = glyphs[Math.floor(Math.random() * glyphs.length)];
    particle.style.left = `${54 + Math.random() * 28}%`;
    particle.style.top = `${60 + Math.random() * 18}%`;
    particle.style.setProperty("--dx", `${-18 - Math.random() * 72}px`);
    particle.style.setProperty("--dy", `${-28 - Math.random() * 92}px`);
    particle.style.setProperty("--rot", `${-14 + Math.random() * 28}deg`);
    particle.style.animationDelay = `${Math.random() * 0.14}s`;
    layer.appendChild(particle);
  }
}

function initGalleryParticles(shell) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const cards = shell.querySelectorAll(".media-card--gallery");
  cards.forEach((card) => {
    const frame = card.querySelector(".media-card__frame");
    if (!frame) return;

    const density = () => (document.body.dataset.pageTheme === "gallery" ? 10 : 6);
    card.addEventListener("mouseenter", () => spawnBinaryParticles(frame, density()));
    card.addEventListener("focusin", () => spawnBinaryParticles(frame, 6));
  });
}

function decorateHeadings(shell) {
  const headingSelectors = ".hero-copy h1, .section-card h2, .section-card h3, .media-card h3, .timeline-card h3, .link-card h3";
  shell.querySelectorAll(headingSelectors).forEach((heading) => {
    const text = heading.textContent.trim();
    if (!text) return;
    heading.dataset.text = text;
    heading.classList.add("fx-heading");
  });

  shell.querySelectorAll(".kicker, .section-label, .timeline-year, .media-lightbox__type").forEach((label) => {
    const text = label.textContent.trim();
    if (!text) return;
    label.dataset.label = text;
  });
}

export function renderPage(config) {
  const shell = document.getElementById("pageShell");
  if (!shell) return;

  const {
    title = "Untitled Page",
    kicker = "",
    intro = "",
    heroImage = "",
    heroCaption = "",
    externalLink = null,
    backHref = "../index.html",
    tags = [],
    sections = [],
    media = [],
    mediaGroups = [],
    timeline = [],
    links = [],
    footerNote = "",
    quickNav = [],
    theme = slugify(title),
    status = null
  } = config;

  document.body.dataset.pageTheme = theme;
  shell.dataset.theme = theme;

  const normalizedSections = sections.map((section) => ({
    ...section,
    id: section.id || slugify(section.title || "section")
  }));

  const normalizedMediaGroups = mediaGroups.length
    ? mediaGroups.map((group) => ({
        ...group,
        id: group.id || slugify(group.title || "collection")
      }))
    : media.length
      ? [
          {
            id: "featured-work",
            title: "Featured Work",
            intro: "A selected set of work from this page.",
            items: media
          }
        ]
      : [];

  const autoNavItems = createNavItems({
    sections: normalizedSections,
    mediaGroups: normalizedMediaGroups,
    timeline,
    links
  });

  const normalizedQuickNav = quickNav.length
    ? quickNav
    : autoNavItems.slice(0, Math.max(2, Math.min(autoNavItems.length, 5)));

  const sideNavItems = autoNavItems.length ? autoNavItems : normalizedQuickNav;

  const pageStatus = status || {
    label: "Signal",
    value: `${String(title).toUpperCase()} // ACTIVE`,
    note: "Sub-page uplink synced to the main orbit.",
    strength: 4
  };

  const navLinkMarkup = (item, extraClass = "") => {
    const href = item.href || `#${item.id}`;
    const targetId = item.id || href.replace(/^#/, "");
    const external = Boolean(item.external || /^https?:|^mailto:|^tel:/i.test(href));
    return `
      <a
        class="${extraClass}"
        href="${escapeAttr(href)}"
        ${targetId ? `data-nav-target="${escapeAttr(targetId)}"` : ""}
        ${external ? 'target="_blank" rel="noreferrer noopener"' : ""}
      >
        <span>${escapeHtml(item.label || item.title || "Link")}</span>
      </a>
    `;
  };

  shell.className = "page-shell";
  shell.innerHTML = `
    <div class="page-shell__fx" aria-hidden="true"></div>

    <nav class="page-nav">
      <a class="back-link" href="${escapeAttr(backHref)}">← Back to orbit</a>
      ${externalLink
        ? `<a class="out-link" href="${escapeAttr(externalLink.href || "#")}" target="_blank" rel="noreferrer noopener">${escapeHtml(externalLink.label || "Open link")} ↗</a>`
        : ""}
    </nav>

    <header class="page-hero">
      <div class="hero-copy">
        ${kicker ? `<p class="kicker">${escapeHtml(kicker)}</p>` : ""}
        <h1>${escapeHtml(title)}</h1>

        <div class="status-panel" aria-label="Page status">
          <div class="status-panel__head">
            <p class="status-panel__label">${escapeHtml(pageStatus.label || "Signal")}</p>
            <p class="status-panel__value">${escapeHtml(pageStatus.value || "ACTIVE")}</p>
          </div>
          <div class="status-panel__bars">${buildStatusBars(Number(pageStatus.strength) || 4)}</div>
          ${pageStatus.note ? `<p class="status-panel__note">${escapeHtml(pageStatus.note)}</p>` : ""}
        </div>

        ${intro ? `<p class="hero-intro">${escapeHtml(intro)}</p>` : ""}

        ${tags.length
          ? `
            <ul class="tags">
              ${tags.map((tag) => `<li>${escapeHtml(tag)}</li>`).join("")}
            </ul>
          `
          : ""}

        ${normalizedQuickNav.length
          ? `
            <nav class="quick-nav" aria-label="Quick navigation">
              ${normalizedQuickNav.map((item) => navLinkMarkup(item, "quick-nav__link")).join("")}
            </nav>
          `
          : ""}
      </div>

      <div class="hero-media">
        ${heroImage
          ? `<img src="${escapeAttr(heroImage)}" alt="${escapeAttr(title)} hero image" />`
          : `<div class="hero-media__empty">Gallery preview</div>`}
        ${heroCaption ? `<div class="hero-media__overlay">${escapeHtml(heroCaption)}</div>` : ""}
      </div>
    </header>

    ${sideNavItems.length
      ? `
        <aside class="side-nav" aria-label="Section navigation">
          <div class="side-nav__inner">
            <p class="section-label">Navigation</p>
            <div class="side-nav__links">
              ${sideNavItems.map((item) => navLinkMarkup(item, "side-nav__link")).join("")}
            </div>
            <p class="side-nav__note">Sticky scan index for faster movement across the page.</p>
          </div>
        </aside>
      `
      : ""}

    <main class="page-grid">
      ${normalizedSections.length
        ? `<section class="section-card">${normalizedSections.map(renderSectionBlock).join("")}</section>`
        : ""}

      ${normalizedMediaGroups.map(renderMediaGroup).join("")}

      ${timeline.length
        ? `
          <section class="section-card" id="timeline" data-observe-section>
            <p class="section-label">Signal log</p>
            <h2>Timeline</h2>
            <div class="timeline-grid">
              ${timeline
                .map(
                  (item) => `
                    <article class="timeline-card">
                      <p class="timeline-year">${escapeHtml(item.year || "")}</p>
                      <h3>${escapeHtml(item.title || "")}</h3>
                      <p>${escapeHtml(item.description || "")}</p>
                    </article>
                  `
                )
                .join("")}
            </div>
          </section>
        `
        : ""}

      ${links.length
        ? `
          <section class="section-card" id="related-projects" data-observe-section>
            <p class="section-label">Links</p>
            <h2>Related Projects</h2>
            <div class="links-grid">
              ${links
                .map((item) => {
                  const href = item.href || "#";
                  const external = Boolean(item.external || /^https?:|^mailto:|^tel:/i.test(href));
                  return `
                    <a class="link-card" href="${escapeAttr(href)}" ${external ? 'target="_blank" rel="noreferrer noopener"' : ""}>
                      <div class="link-card__body">
                        <p class="section-label">Uplink</p>
                        <h3>${escapeHtml(item.title || "Untitled")}</h3>
                        <p>${escapeHtml(item.description || "")}</p>
                      </div>
                    </a>
                  `;
                })
                .join("")}
            </div>
          </section>
        `
        : ""}
    </main>

    ${footerNote ? `<p class="footer-note">${escapeHtml(footerNote)}</p>` : ""}

    <div class="media-lightbox" id="mediaLightbox" hidden>
      <div class="media-lightbox__backdrop" data-close-lightbox></div>
      <div class="media-lightbox__dialog" role="dialog" aria-modal="true" aria-labelledby="mediaLightboxTitle">
        <button class="media-lightbox__close" type="button" data-close-lightbox aria-label="Close media viewer">✕</button>
        <div class="media-lightbox__terminal">
          <span id="mediaLightboxLabel">terminal://standby</span>
          <span id="mediaLightboxFile">viewer://idle</span>
        </div>
        <div class="media-lightbox__viewer" id="mediaLightboxViewer"></div>
        <div class="media-lightbox__meta">
          <p class="media-lightbox__type" id="mediaLightboxType"></p>
          <h3 id="mediaLightboxTitle"></h3>
          <p id="mediaLightboxDescription"></p>
        </div>
      </div>
    </div>
  `;

  decorateHeadings(shell);
  wireLightbox(shell);
  initVideoThumbnails(shell);
  initSectionObserver(shell);
  initGalleryParticles(shell);
  initIdlePulse();
}
