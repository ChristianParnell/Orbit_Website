# Orbit Website Rewrite GitHub Pages Setup


- `/assets/audio/ambient.mp3`
- `/assets/backgrounds/sky_sphere.jpg`
- `/assets/covers/...`
- `/assets/models/me_on_hill.fbx`
- `/assets/textures/fog.png`

## Files in this rewrite

Replace or add these into repo:

- `index.html`
- `styles.css`
- `/js/config.js`
- `/js/main.js`
- `/pages/*.html`
- `/pages/page.css`
- `/pages/js/*.js`
- `.nojekyll`

## Deployment steps

1. Back up your current repo.
2. Copy these new files into the repo root and matching folders.
3. Keep your existing `/assets` folder exactly where it is.
4. Commit and push to `main`.
5. In GitHub:
   - Open **Settings**
   - Go to **Pages**
   - Set source to **Deploy from a branch**
   - Branch: **main**
   - Folder: **/(root)**
6. Wait for Pages to rebuild.

## Important notes

- This build uses plain static HTML/CSS/JS.
- It uses Three.js from a CDN, so there is no build process.
- All page links are relative and GitHub Pages safe.
- Audio only starts after the **Enter site** button is pressed.

## First edits to make

### Replace placeholder text
Edit:
- `/pages/js/page-about.js`
- `/pages/js/page-gallery.js`
- `/pages/js/page-achievements.js`
- `/pages/js/page-contact.js`
- `/pages/js/page-fab.js`
- `/pages/js/page-sketchfab.js`
- `/pages/js/page-22minutes.js`

### Change or add orbit folders
Edit:
- `/js/config.js`

Each item has:
- `title`
- `subtitle`
- `href`
- `cover`

### Tweak the helix or camera
Edit:
- `/js/config.js`

Useful values:
- `cameraRadius`
- `coverRadius`
- `turns`
- `scrollSpeed`
- `cameraHeightTop`
- `cameraHeightBottom`
- `coverHeightTop`
- `coverHeightBottom`



## Import map fix
This package uses a browser import map in `index.html` so GitHub Pages can resolve `three` and `three/addons/` without a bundler. Keep the `<script type="importmap">` block intact.
