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
    quickNav = []
  } = config;

  const normalizedMediaGroups = mediaGroups.length
    ? mediaGroups
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

  const normalizedQuickNav = quickNav.length
    ? quickNav
    : normalizedMediaGroups.map((group) => ({
        id: group.id || slugify(group.title || "section"),
        label: group.title || "Section"
      }));

  shell.className = "page-shell";
  shell.innerHTML = `
    <nav class="page-nav">
      <a class="back-link" href="${escapeAttr(backHref)}">← Back to orbit</a>
      ${externalLink ? `
        <a class="out-link" href="${escapeAttr(externalLink.href)}" target="_blank" rel="noreferrer">
          ${escapeHtml(externalLink.label || "Open link")} ↗
        </a>
      ` : ""}
    </nav>

    <header class="page-hero">
      <section class="hero-copy">
        ${kicker ? `<p class="kicker">${escapeHtml(kicker)}</p>` : ""}
        <h1>${escapeHtml(title)}</h1>
        ${intro ? `<p class="hero-intro">${escapeHtml(intro)}</p>` : ""}

        ${tags.length ? `
          <ul class="tags">
            ${tags.map((tag) => `<li>${escapeHtml(tag)}</li>`).join("")}
          </ul>
        ` : ""}

        ${normalizedQuickNav.length ? `
          <div class="quick-nav">
            ${normalizedQuickNav.map((item) => `
              <a class="quick-nav__link" href="#${escapeAttr(item.id)}">
                ${escapeHtml(item.label)}
              </a>
            `).join("")}
          </div>
        ` : ""}
      </section>

      <aside class="hero-media">
        ${
          heroImage
            ? `<img src="${escapeAttr(heroImage)}" alt="${escapeAttr(title)} hero image" />`
            : `<div class="hero-media__empty">Gallery preview</div>`
        }
        ${heroCaption ? `<div class="hero-media__overlay">${escapeHtml(heroCaption)}</div>` : ""}
      </aside>
    </header>

    <div class="page-grid">
      ${sections.length ? `
        <section class="section-card">
          ${sections.map((section) => `
            <div class="section-block">
              <h2>${escapeHtml(section.title || "")}</h2>
              ${
                Array.isArray(section.body)
                  ? `<ul>${section.body.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
                  : `<p>${escapeHtml(section.body || "")}</p>`
              }
            </div>
          `).join("")}
        </section>
      ` : ""}

      ${normalizedMediaGroups.map(renderMediaGroup).join("")}

      ${timeline.length ? `
        <section class="section-card">
          <h2>Timeline</h2>
          <div class="timeline-grid">
            ${timeline.map((item) => `
              <article class="timeline-card">
                <span class="timeline-year">${escapeHtml(item.year || "")}</span>
                <h3>${escapeHtml(item.title || "")}</h3>
                <p>${escapeHtml(item.description || "")}</p>
              </article>
            `).join("")}
          </div>
        </section>
      ` : ""}

      ${links.length ? `
        <section class="section-card">
          <h2>Related Projects</h2>
          <div class="links-grid">
            ${links.map((item) => `
              <a class="link-card" href="${escapeAttr(item.href || "#")}">
                <div class="link-card__body">
                  <h3>${escapeHtml(item.title || "")}</h3>
                  <p>${escapeHtml(item.description || "")}</p>
                </div>
              </a>
            `).join("")}
          </div>
        </section>
      ` : ""}
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
          <h2>${escapeHtml(groupTitle)}</h2>
        </div>
        ${groupIntro ? `<p class="media-section__intro">${escapeHtml(groupIntro)}</p>` : ""}
      </div>

      <div class="media-grid media-grid--gallery">
        ${items.map(renderMediaCard).join("")}
      </div>
    </section>
  `;
}

function renderMediaCard(item) {
  const type = item.type || "image";
  const title = item.title || "Untitled";
  const description = item.description || "";
  const src = item.src || "";
  const poster = item.poster || "";
  const placeholder = item.placeholder || "Add media here";
  const badge = type === "video" ? "Video" : type === "embed" ? "Embed" : "Render";

  const hasOpenableMedia = Boolean(src);

  return `
    <article class="media-card media-card--gallery">
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
        <h3>${escapeHtml(title)}</h3>
        <p>${escapeHtml(description)}</p>
      </div>
    </article>
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

function wireLightbox(shell) {
  const lightbox = shell.querySelector("#mediaLightbox");
  const viewer = shell.querySelector("#mediaLightboxViewer");
  const titleEl = shell.querySelector("#mediaLightboxTitle");
  const typeEl = shell.querySelector("#mediaLightboxType");
  const descEl = shell.querySelector("#mediaLightboxDescription");

  if (!lightbox || !viewer || !titleEl || !typeEl || !descEl) return;

  const closeLightbox = () => {
    lightbox.hidden = true;
    document.body.classList.remove("lightbox-open");
    viewer.innerHTML = "";
    titleEl.textContent = "";
    typeEl.textContent = "";
    descEl.textContent = "";
  };

  const openLightbox = (button) => {
    const type = button.dataset.mediaType || "image";
    const src = button.dataset.mediaSrc || "";
    const poster = button.dataset.mediaPoster || "";
    const title = button.dataset.mediaTitle || "Media";
    const description = button.dataset.mediaDescription || "";

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