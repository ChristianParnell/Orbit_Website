export class MothDebugConsole {
  constructor({ title = "MOTH FAMILIAR // LIVE STATE", maxEvents = 12, collapsed = false } = {}) {
    this.title = title;
    this.maxEvents = maxEvents;
    this.events = [];
    this.visible = true;
    this.snapshot = {};
    this.root = null;
    this.rows = new Map();
    this.eventList = null;
    this.badge = null;
    this._ensureStyle();
    this._build(collapsed);
  }

  _ensureStyle() {
    if (typeof document === "undefined" || document.getElementById("moth-debug-console-style")) return;
    const style = document.createElement("style");
    style.id = "moth-debug-console-style";
    style.textContent = `
      .moth-debug-console {
        position: fixed;
        right: 14px;
        bottom: 14px;
        z-index: 99999;
        width: min(360px, calc(100vw - 28px));
        color: rgba(224, 252, 255, 0.95);
        font: 11px/1.45 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
        letter-spacing: .025em;
        background: linear-gradient(145deg, rgba(2, 8, 14, .86), rgba(8, 21, 36, .72));
        border: 1px solid rgba(47, 228, 255, .32);
        border-radius: 14px;
        box-shadow: 0 0 32px rgba(47, 228, 255, .12), inset 0 0 22px rgba(176, 77, 255, .08);
        backdrop-filter: blur(14px);
        overflow: hidden;
        user-select: none;
        pointer-events: auto;
      }
      .moth-debug-console.is-hidden { display: none; }
      .moth-debug-console__head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        padding: 10px 12px 8px;
        border-bottom: 1px solid rgba(47, 228, 255, .18);
        background: linear-gradient(90deg, rgba(47, 228, 255, .08), rgba(255, 87, 206, .08));
      }
      .moth-debug-console__title { font-weight: 800; color: white; text-shadow: 0 0 10px rgba(47, 228, 255, .65); }
      .moth-debug-console__badge {
        padding: 2px 7px;
        border: 1px solid rgba(51, 255, 136, .35);
        border-radius: 999px;
        color: #9fffd2;
        background: rgba(51, 255, 136, .08);
        text-transform: uppercase;
        white-space: nowrap;
      }
      .moth-debug-console__body { padding: 10px 12px 11px; }
      .moth-debug-console__grid {
        display: grid;
        grid-template-columns: 86px 1fr 38px;
        gap: 6px 8px;
        align-items: center;
      }
      .moth-debug-console__key { color: rgba(151, 217, 255, .78); text-transform: uppercase; }
      .moth-debug-console__value { color: rgba(255,255,255,.92); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .moth-debug-console__bar {
        position: relative;
        height: 5px;
        border-radius: 999px;
        background: rgba(255,255,255,.08);
        overflow: hidden;
        box-shadow: inset 0 0 8px rgba(0,0,0,.32);
      }
      .moth-debug-console__fill {
        height: 100%;
        width: 0%;
        border-radius: inherit;
        background: linear-gradient(90deg, #2fe4ff, #33ff88, #ff57ce);
        box-shadow: 0 0 12px rgba(47, 228, 255, .55);
        transition: width .18s ease;
      }
      .moth-debug-console__events {
        margin: 10px 0 0;
        padding: 8px 0 0;
        border-top: 1px solid rgba(255,255,255,.10);
        max-height: 138px;
        overflow: hidden;
      }
      .moth-debug-console__event {
        display: grid;
        grid-template-columns: 58px 1fr;
        gap: 8px;
        padding: 2px 0;
        color: rgba(219, 246, 255, .86);
      }
      .moth-debug-console__event-level { color: rgba(255, 225, 102, .90); }
      .moth-debug-console__hint {
        margin-top: 8px;
        color: rgba(151, 217, 255, .54);
        font-size: 10px;
      }
      .moth-debug-console__head button {
        border: 0;
        background: rgba(255,255,255,.08);
        color: rgba(255,255,255,.82);
        border-radius: 8px;
        padding: 2px 7px;
        cursor: pointer;
        font: inherit;
      }
      .moth-nested {
        position: relative;
        text-shadow: 0 0 12px var(--moth-residue, #2fe4ff), 0 0 28px rgba(47,228,255,.35) !important;
        filter: saturate(1.2) brightness(1.08);
      }
      .moth-nested::after {
        content: "  // dust";
        color: var(--moth-residue, #2fe4ff);
        opacity: .72;
        font-size: .72em;
        letter-spacing: .08em;
      }
    `;
    document.head.appendChild(style);
  }

  _build(collapsed) {
    if (typeof document === "undefined") return;
    this.root = document.createElement("aside");
    this.root.className = "moth-debug-console";
    this.root.innerHTML = `
      <div class="moth-debug-console__head">
        <div class="moth-debug-console__title"></div>
        <div style="display:flex;align-items:center;gap:6px;">
          <div class="moth-debug-console__badge">BOOTING</div>
          <button type="button" aria-label="Toggle moth debug body">–</button>
        </div>
      </div>
      <div class="moth-debug-console__body">
        <div class="moth-debug-console__grid"></div>
        <div class="moth-debug-console__events"></div>
        <div class="moth-debug-console__hint">Press M to hide/show. This is the moth's live behaviour log.</div>
      </div>
    `;
    this.root.querySelector(".moth-debug-console__title").textContent = this.title;
    this.badge = this.root.querySelector(".moth-debug-console__badge");
    this.grid = this.root.querySelector(".moth-debug-console__grid");
    this.eventList = this.root.querySelector(".moth-debug-console__events");
    this.body = this.root.querySelector(".moth-debug-console__body");
    this.root.querySelector("button")?.addEventListener("click", () => this.setCollapsed(!this.collapsed));
    window.addEventListener("keydown", (event) => {
      if (event.key?.toLowerCase() === "m") this.setVisible(!this.visible);
    });
    document.body.appendChild(this.root);
    this.setCollapsed(Boolean(collapsed));
  }

  setVisible(visible) {
    this.visible = Boolean(visible);
    this.root?.classList.toggle("is-hidden", !this.visible);
  }

  setCollapsed(collapsed) {
    this.collapsed = Boolean(collapsed);
    if (this.body) this.body.style.display = this.collapsed ? "none" : "block";
    const button = this.root?.querySelector("button");
    if (button) button.textContent = this.collapsed ? "+" : "–";
  }

  _row(key, value, numeric = null) {
    if (!this.grid) return;
    let row = this.rows.get(key);
    if (!row) {
      const keyNode = document.createElement("div");
      keyNode.className = "moth-debug-console__key";
      keyNode.textContent = key;
      const valueNode = document.createElement("div");
      valueNode.className = "moth-debug-console__value";
      const bar = document.createElement("div");
      bar.className = "moth-debug-console__bar";
      const fill = document.createElement("div");
      fill.className = "moth-debug-console__fill";
      bar.appendChild(fill);
      this.grid.append(keyNode, valueNode, bar);
      row = { valueNode, bar, fill };
      this.rows.set(key, row);
    }
    row.valueNode.textContent = value;
    if (Number.isFinite(numeric)) {
      row.bar.style.visibility = "visible";
      row.fill.style.width = `${Math.max(0, Math.min(1, numeric)) * 100}%`;
    } else {
      row.bar.style.visibility = "hidden";
      row.fill.style.width = "0%";
    }
  }

  update(snapshot = {}) {
    this.snapshot = snapshot;
    const mood = snapshot.mood || "unknown";
    if (this.badge) this.badge.textContent = mood;
    this._row("mode", snapshot.mode || "—");
    this._row("behaviour", snapshot.behaviour || "—");
    this._row("animation", snapshot.animation || "—");
    this._row("target", snapshot.target || "—");
    this._row("hunger", `${Math.round((1 - (snapshot.vitality ?? 0)) * 100)}%`, 1 - (snapshot.vitality ?? 0));
    this._row("signal", `${Math.round((snapshot.signal ?? 0) * 100)}%`, snapshot.signal ?? 0);
    this._row("fatigue", `${Math.round((snapshot.fatigue ?? 0) * 100)}%`, snapshot.fatigue ?? 0);
    this._row("trust", `${Math.round((snapshot.trust ?? 0) * 100)}%`, snapshot.trust ?? 0);
    this._row("corrupt", `${Math.round((snapshot.corruption ?? 0) * 100)}%`, snapshot.corruption ?? 0);
    this._row("fragments", String(snapshot.fragments ?? 0));
  }

  push(message, level = "MOTH") {
    const safeMessage = String(message).replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c]));
    const safeLevel = String(level).replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c]));
    const time = new Date().toLocaleTimeString([], { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
    this.events.unshift({ time, level: safeLevel, message: safeMessage });
    this.events = this.events.slice(0, this.maxEvents);
    if (!this.eventList) return;
    this.eventList.innerHTML = this.events.map((event) => `
      <div class="moth-debug-console__event">
        <span class="moth-debug-console__event-level">${event.level}</span>
        <span>${event.time} // ${event.message}</span>
      </div>
    `).join("");
  }

  dispose() {
    this.root?.remove();
    this.root = null;
  }
}
