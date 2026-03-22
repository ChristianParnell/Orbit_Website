
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
  const file = clean.split("/").filter(Boolean).pop() || "asset";
  return file;
}

function buildStatusBars(strength = 3) {
  return Array.from({ length: 5 }, (_, index) => {
    const fill = index < strength ? "1" : "0.12";
    return `<span class="hero-status__bar" style="--bar-fill:${fill}"></span>`;
  }).join("");
}

function renderSectionBlock(section) {
  const id = escapeAttr(section.id || slugify(section.title || "section"));
  const title = escapeHtml(section.title || "");
  const body = Array.isArray(section.body)
    ? `<ul>${section.body.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
    : `<p>${escapeHtml(section.body || "")}</p>`;

  return `
    <div class="section-block" id="${id}">
      <h2 class="section-heading">${title}</h2>
      ${body}
    </div>
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
        <div class="media-card__frame">
          <span class="media-card__particle-layer" aria-hidden="true"></span>
          <img src="${escapeAttr(poster)}" alt="${escapeAttr(title)} poster" loading="lazy" />
          <span class="media-card__icon">▶</span>
        </div>
      `;
    }

    return `
      <div
        class="media-card__frame js-video-thumb"
        data-video-src="${escapeAttr(src)}"
        data-video-title="${escapeAttr(title)}"
        data-thumb-time="${escapeAttr(thumbTime)}"
      >
        <span class="media-card__particle-layer" aria-hidden="true"></span>
        <img
          class="media-card__thumb-image"
          alt="${escapeAttr(title)} thumbnail"
          loading="lazy"
          hidden
          style="position:absolute; inset:0; width:100%; height:100%; object-fit:cover;"
        />
        <div
          class="media-card__thumb-fallback"
          style="display:grid; place-items:center; width:100%; height:100%; padding:24px; text-align:center; color:rgba(237,245,255,0.62); letter-spacing:0.08em; text-transform:uppercase; font-size:0.85rem;"
        >
          <span>${escapeHtml(placeholder)}</span>
        </div>
        <span class="media-card__icon">▶</span>
      </div>
    `;
  }

  if ((type === "image" || type === "render") && src) {
    return `
      <div class="media-card__frame">
        <span class="media-card__particle-layer" aria-hidden="true"></span>
        <img src="${escapeAttr(src)}" alt="${escapeAttr(title)}" loading="lazy" />
        <span class="media-card__icon media-card__icon--view">⤢</span>
      </div>
    `;
  }

  return `
    <div class="media-card__frame media-card__frame--placeholder">
      <span>${escapeHtml(placeholder)}</span>
    </div>
  `;
}

function renderMediaCard(item, groupTitle = "Collection") {
  const type = item.type || "image";
  const title = item.title || "Untitled";
  const description = item.description || "";
  const src = item.src || "";
  const poster = item.poster || "";
  const badge = type === "video" ? "Video" : type === "embed" ? "Embed" : "Render";
  const hasOpenableMedia = Boolean(src);
  const filename = fileNameFromPath(src);
  const cardClass = type === "video" ? "media-card--video" : "media-card--render";

  return `
    <article class="media-card media-card--gallery ${cardClass}">
      ${
        hasOpenableMedia
          ? `
            <button
              class="media-card__trigger js-open-media"
              type="button"
              data-media-type="${escapeAttr(type)}"
              data-media-src="${escapeAttr(src)}"
              data-media-poster="${escapeAttr(poster)}"
              data-media-title="${escapeAttr(title)}"
              data-media-description="${escapeAttr(description)}"
              data-media-filename="${escapeAttr(filename)}"
              data-media-group="${escapeAttr(groupTitle)}"
            >
              ${renderMediaPreview(item)}
              <span class="media-card__action">${type === "video" ? "Play" : "View"}</span>
            </button>
          `
          : `
            <div class="media-card__static">
              ${renderMediaPreview(item)}
            </div>
          `
      }
      <div class="media-card__body">
        <div class="media-card__topline">
          <span class="media-badge">${escapeHtml(badge)}</span>
        </div>
        <h3 class="media-heading">${escapeHtml(title)}</h3>
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
    <section class="section-card media-section" id="${escapeAttr(groupId)}">
      <div class="media-section__header">
        <div>
          <p class="section-label">Collection</p>
          <h2 class="section-heading">${escapeHtml(groupTitle)}</h2>
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

  if (!lightbox || !viewer || !titleEl || !typeEl || !descEl || !fileEl || !labelEl) return;

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

    viewer.innerHTML =
      type === "video"
        ? `
          <video
            class="media-lightbox__video"
            src="${escapeAttr(src)}"
            ${poster ? `poster="${escapeAttr(poster)}"` : ""}
            controls
            autoplay
            playsinline
          ></video>
        `
        : `
          <img
            class="media-lightbox__image"
            src="${escapeAttr(src)}"
            alt="${escapeAttr(title)}"
          />
        `;

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
        const maxSeek =
          Number.isFinite(duration) && duration > 0 ? Math.max(0, duration - 0.15) : requestedTime;
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
    if (targetId) {
      targetMap.set(targetId, link);
    }
  });

  const sections = Array.from(shell.querySelectorAll("[data-observe-section], .section-block[id], .media-section[id], #timeline, #related-projects"));
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
          shell.querySelectorAll(`.quick-nav__link[href="#${CSS.escape(id)}"]`).forEach((item) => {
            item.classList.add("is-active");
          });
        } else {
          shell.querySelectorAll(`.quick-nav__link[href="#${CSS.escape(id)}"]`).forEach((item) => {
            item.classList.remove("is-active");
          });
        }
      });
    },
    { rootMargin: "-35% 0px -45% 0px", threshold: 0.1 }
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

    card.addEventListener("mouseenter", () => {
      spawnBinaryParticles(frame, document.body.dataset.pageTheme === "gallery" ? 10 : 6);
    });

    card.addEventListener("focusin", () => {
      spawnBinaryParticles(frame, 6);
    });
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

  const pageStatus =
    status ||
    {
      label: "Signal",
      value: `${title.toUpperCase()} // ACTIVE`,
      note: "Sub-page uplink synced to the main orbit.",
      strength: 4
    };

  shell.className = "page-shell";
  shell.innerHTML = `
    <nav class="page-nav">
      <a class="back-link" href="${escapeAttr(backHref)}">← Back to orbit</a>
      ${
        externalLink
          ? `
            <a class="out-link" href="${escapeAttr(externalLink.href)}" target="_blank" rel="noreferrer">
              ${escapeHtml(externalLink.label || "Open link")} ↗
            </a>
          `
          : ""
      }
    </nav>

    <header class="page-hero">
      <section class="hero-copy card-node">
        <div class="hero-copy__topline">
          <div>
            ${kicker ? `<p class="kicker">${escapeHtml(kicker)}</p>` : ""}
            <h1 class="title-glitch">${escapeHtml(title)}</h1>
          </div>

          <aside class="hero-status" aria-label="page status">
            <span class="hero-status__eyebrow">${escapeHtml(pageStatus.label || "Signal")}</span>
            <p class="hero-status__value">${escapeHtml(pageStatus.value || "ACTIVE")}</p>
            <div class="hero-status__meta">
              ${buildStatusBars(Number(pageStatus.strength) || 4)}
            </div>
            ${
              pageStatus.note
                ? `<p class="hero-status__note">${escapeHtml(pageStatus.note)}</p>`
                : ""
            }
          </aside>
        </div>

        ${intro ? `<p class="hero-intro">${escapeHtml(intro)}</p>` : ""}

        ${
          tags.length
            ? `
              <ul class="tags">
                ${tags.map((tag) => `<li>${escapeHtml(tag)}</li>`).join("")}
              </ul>
            `
            : ""
        }

        ${
          normalizedQuickNav.length
            ? `
              <div class="quick-nav">
                ${normalizedQuickNav
                  .map(
                    (item) => `
                      <a class="quick-nav__link" href="#${escapeAttr(item.id)}">${escapeHtml(item.label)}</a>
                    `
                  )
                  .join("")}
              </div>
            `
            : ""
        }
      </section>

      <aside class="hero-media card-node">
        ${
          heroImage
            ? `<img src="${escapeAttr(heroImage)}" alt="${escapeAttr(title)} hero image" />`
            : `<div class="hero-media__empty">Gallery preview</div>`
        }
        ${heroCaption ? `<div class="hero-media__overlay">${escapeHtml(heroCaption)}</div>` : ""}
      </aside>
    </header>

    <div class="page-layout">
      ${
        sideNavItems.length
          ? `
            <aside class="page-side-nav card-node">
              <p class="page-side-nav__label">Navigation</p>
              <nav class="page-side-nav__list" aria-label="Sub-page sections">
                ${sideNavItems
                  .map(
                    (item) => `
                      <a class="page-side-nav__link" href="#${escapeAttr(item.id)}" data-nav-target="${escapeAttr(item.id)}">
                        ${escapeHtml(item.label)}
                      </a>
                    `
                  )
                  .join("")}
              </nav>
              <p class="page-side-nav__meta">Sticky scan index for faster movement across the page.</p>
            </aside>
          `
          : ""
      }

      <div class="page-grid">
        ${
          normalizedSections.length
            ? `
              <section class="section-card card-node" data-observe-section id="${escapeAttr(normalizedSections[0].id)}-anchor">
                ${normalizedSections.map(renderSectionBlock).join("")}
              </section>
            `
            : ""
        }

        ${normalizedMediaGroups.map(renderMediaGroup).join("")}

        ${
          timeline.length
            ? `
              <section class="section-card card-node" id="timeline" data-observe-section>
                <h2 class="timeline-heading">Timeline</h2>
                <div class="timeline-grid">
                  ${timeline
                    .map(
                      (item) => `
                        <article class="timeline-card card-node">
                          <span class="timeline-year">${escapeHtml(item.year || "")}</span>
                          <h3>${escapeHtml(item.title || "")}</h3>
                          <p>${escapeHtml(item.description || "")}</p>
                        </article>
                      `
                    )
                    .join("")}
                </div>
              </section>
            `
            : ""
        }

        ${
          links.length
            ? `
              <section class="section-card card-node" id="related-projects" data-observe-section>
                <h2 class="link-heading">Related Projects</h2>
                <div class="links-grid">
                  ${links
                    .map(
                      (item) => `
                        <a
                          class="link-card card-node"
                          href="${escapeAttr(item.href || "#")}"
                          ${item.external ? 'target="_blank" rel="noreferrer"' : ""}
                        >
                          <div class="link-card__body">
                            <h3>${escapeHtml(item.title || "")}</h3>
                            <p>${escapeHtml(item.description || "")}</p>
                          </div>
                        </a>
                      `
                    )
                    .join("")}
                </div>
              </section>
            `
            : ""
        }
      </div>
    </div>

    ${footerNote ? `<p class="footer-note">${escapeHtml(footerNote)}</p>` : ""}

    <div class="media-lightbox" id="mediaLightbox" hidden>
      <div class="media-lightbox__backdrop" data-close-lightbox></div>
      <div class="media-lightbox__dialog" role="dialog" aria-modal="true" aria-labelledby="mediaLightboxTitle">
        <button
          class="media-lightbox__close"
          type="button"
          aria-label="Close viewer"
          data-close-lightbox
        >
          ✕
        </button>

        <div class="media-lightbox__terminalbar">
          <span class="media-lightbox__terminal-label" id="mediaLightboxLabel">terminal://standby</span>
          <span class="media-lightbox__terminal-file" id="mediaLightboxFile">viewer://idle</span>
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

  wireLightbox(shell);
  initVideoThumbnails(shell);
  initSectionObserver(shell);
  initGalleryParticles(shell);
  initIdlePulse();
}
