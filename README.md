# Orbit Profile Website — Development Log

## Development Timeline

### 24/02
Spent the day learning how to build the website from scratch. I explored HTML and coding with help from ChatGPT, which gave me the information I needed to start creating the site. I was not used to HTML or C#, so this felt like a strong introduction and sparked a new interest in coding.

### 25/02
Worked on setting up the pages during lecture time. I ran into issues with live server hosting through Visual Studio, so I shifted toward using **GitHub Pages** instead. This became an important solution for launching and editing the site online.

### 27/02
Added fog to the site, but it broke the visual result. After troubleshooting, it seemed the issue came from transparency and the opacity map.

### 28/02
Ran into layout problems where the tiles were too far away from the model, making the scene feel too wide and open. I adjusted the composition and brought everything closer to the centre.
<img width="2048" height="1422" alt="Screenshot 2026-03-05 185929" src="https://github.com/user-attachments/assets/a5dec10b-8707-422f-ba22-4476c0aa1c7e" />


### 01/03
Refined the folder helix effect. The speed and corkscrew spiral around the model were too fast, so I slowed and improved them. I also created more spacing between folders so the model would be more visible.
<img width="2048" height="1198" alt="wdwdw" src="https://github.com/user-attachments/assets/5c5470fd-6133-445e-b632-c5062d191603" />
### 02/03
Worked through major lighting issues. Light from the sky sphere was casting additional light onto the folder covers. I fixed that problem, but the model was still unlit and corrupted because the GL file could not be accessed properly for textures.

<img width="1840" height="915" alt="dwwd" src="https://github.com/user-attachments/assets/ee187fad-306f-42bf-905f-f604451a8d39" />

### 04/03
Re-imported and resized the model. The rock base became larger and covered more of the bottom of the scene. This improved the overall flow of the helix folders moving up the website and made the composition feel more convincing.

### 05/03
The model still had no texture, and the issue could not be resolved at the time. I decided to stop pushing that problem for now and return to it later. I also adjusted folder title placement, since the titles were sitting too far away from the folders, and both the folder and title were fading too far from the camera.

<img width="1870" height="899" alt="Screenshot 2026-03-09 122534" src="https://github.com/user-attachments/assets/a24d49d0-dbb8-437c-89cf-abfa05b766b9" />
### 09/03
Made the largest redesign so far. I completely reworked the website into a **code-breaking / corrupted files** visual style.

Key changes included:
- Introduced binary-style animated visuals inspired by a reference I found online.
- Used ChatGPT to help modify the CSS and `main.js` for binary effects.
- Made the centre model transparent and switched to a solid dark-blue background.
- Built a colour ramp from Adobe Color palettes and used it to drive the binary visuals.
- Fixed early issues where the binary numbers were too large.
- Generated an AI code-flux background video with low transparency to support the blue palette.
- Added binary streams escaping from the central model into the cover files, with numbers scaling up as they approach the covers.
- Added a random “breach” event where a cover file appears infected and code gets sucked into it.

<img width="1698" height="871" alt="Screenshot 2026-03-09 144352" src="https://github.com/user-attachments/assets/fa1770a2-e483-4138-81f5-6d36b53270ba" />
<img width="1715" height="911" alt="Screenshot 2026-03-09 140950" src="https://github.com/user-attachments/assets/37776f53-c735-4a03-bca7-54fc10c8e732" />


![lines-code-software-several-colors-notebook-closeup-photo-front-end-applications-color-concept-developer-working-269120023 (1)](https://github.com/user-attachments/assets/4b69e12b-630d-4ba3-a0f7-b49ceabe9552)

<img width="1704" height="913" alt="Screenshot 2026-03-09 224551" src="https://github.com/user-attachments/assets/da61d6b0-8280-499a-a588-56bce8453fcf" />







These changes made the website feel much more active, chaotic, and visually complete.

### 10/03
Made Animations.



<img width="607" height="624" alt="Screenshot 2026-03-09 224854" src="https://github.com/user-attachments/assets/6ce6480d-d007-4ca7-bed3-bec2955d0882" />

<img width="556" height="679" alt="Screenshot 2026-03-09 224746" src="https://github.com/user-attachments/assets/95e72f65-162e-4162-9538-84264cdacc7b" />

### 12/03
Worked on render performance to reduce strain on the GPU and CPU.

Implemented the following limits:
- `modelPointLimit: 8000`
- `streamPerCover: 120`
- `focusTunnelParticles: 180`
- `pixel ratio: 1.5`
- `60 FPS cap`

### 14/03
Focused on the internal pages and began filling out the **About**, **Contact**, and **Achievements** sections with proper content.

I also:
- Organised the gallery more effectively.
- Added 10 videos and 10 images.
- Compressed media to stay under GitHub’s 100 MB upload limit.
- Adjusted `pages.js` so each video displays a front-cover preview image before loading.
- Kept rendered still images working correctly.

## Feedback and Iteration

### 19/03 — Feedback
Feedback highlighted that the sub-pages such as **About**, **Contact**, and **Gallery** did not feel visually consistent with the main website.

Suggested improvements included:
- Use the rainbow binary-code colour treatment in headers.
- Push the sub-pages further into the same design language.
- Explore an arc-radar / technical interface aesthetic.
- Bring the glitch effect into the sub-page headings.
- Add a slow automatic helix rotation on the main page.
- Add a delayed prompt after 10 seconds of inactivity telling the user to scroll and click covers.



<img width="900" height="600" alt="1038116 (1)" src="https://github.com/user-attachments/assets/c4425abb-7907-4fe8-bbd5-6b0cc365fb64" />

### 22/03
Updated the CSS for the website folders and sub-pages.

This update:
- Brightened the sub-pages while keeping the dark technical base.
- Added code-colour gradients to headers, labels, and UI chips.
- Gave media, link, and timeline cards a stronger illuminated hover state.
- Added subtle grid and scanline overlays so the pages felt more networked.
- Kept the existing HTML and JS structure intact, avoiding a full template rewrite.
- Removed the diagnostics tab on the main page.
- Added a note that the website is intended for laptop or PC use only.

I also updated the sub-pages so they felt much closer to the main Orbit site rather than like separate darker pages.

### Expanded 22/03 Changes
The **About**, **Achievements**, **Gallery**, and **Contact** pages were redesigned to share a stronger coded-network identity with:
- Brighter accent colours
- Animated data sweeps
- Glitch-style heading details
- Active “node” styling on cards and panels

Each page now has its own subtle identity while remaining within the same system:
- **About** leans cyan
- **Gallery** leans violet
- **Contact** uses a lime-blue signal tone
- **Achievements** feels more certified / system-log inspired

Additional upgrades included:
- Hero status badges
- Sticky side navigation on larger screens
- Better hover feedback
- Animated scan brackets
- A more terminal-like lightbox style
- Low-opacity code-rain layers in hero areas

The gallery interactions were pushed further with binary particle hover effects and more responsive media-card behaviour. Overall, the site became more colourful and polished and more consistent with the main website’s visual theme.

### Later 22/03 Adjustments
Spent more time refining the sub-page content and interaction behaviour.

Additional changes included:
- Added an **idle orbit** after 8 seconds of inactivity.
- Added **quick-access tabs** to jump directly to pages or covers.
- Updated the centre model’s animation loop.
- Made the model trip if the user orbits too aggressively.
- Created a visual connection between the headers and page covers so they feel linked through the same network system.
- Increased the force threshold for the trip/orbit scroll effect because it was previously too gentle.
<img width="337" height="242" alt="Screenshot 2026-03-24 003648" src="https://github.com/user-attachments/assets/7b1785d5-8d51-4ae4-ba50-c4bb6ff486be" />

### 23/03
- remove the shared subpage navigation feature
- replace the header styling with a looping loader-spectrum effect based on your main-site loading bar colors
- add an idle terminal-network scan effect to the media cards
- added a moving spectrum border on hover for the cards and the opened lightbox dialog
- update the gallery page text so it no longer mentions quick navigation
<img width="1037" height="798" alt="Screenshot 2026-03-24 003248" src="https://github.com/user-attachments/assets/98748ef6-d9e4-4df6-8493-e028c92a1ee9" />

### Further:
- Added a more cinematic landing experience with a camera fly-in intro.
- Several polish fixes were also made to restore the correct placement of UI elements like the quick access panel
- Brightened and strengthened cover/header visibility where they had become too dark.
- Updated gallery media labels from generic actions like “Play” and “View” toward clearer wording such as “Video” and “Image.”
- Removed Covers and pormpts of the main page untill intro finished.
- Cleaned up visual clutter on the main page.
- Increased the landing-page background blur for a cleaner, more focused first impression.
- Spent the latest pushes restoring and stabilizing render-page.js after shared subpage syntax errors appeared.
<img width="954" height="696" alt="wd" src="https://github.com/user-attachments/assets/020ecaac-9763-47a3-a00f-011c19ff4488" />

  
## Final Product: 
<img width="1898" height="944" alt="qsq" src="https://github.com/user-attachments/assets/4cce46fd-d649-4e3e-89fa-e865c04d86c7" />

