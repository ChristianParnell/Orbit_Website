# Website Link 
https://christianparnell.github.io/Orbit_Website/

# Orbit Profile Website — Development Log

## Development Timeline

### 24/02
Spent the day learning how to build the website from scratch. I explored HTML and coding with help from ChatGPT, which gave me the information I needed to start creating the site. I was not used to HTML or C#, so this felt like a strong introduction and sparked a new interest in coding.

### 25/02
Worked on setting up the pages during lecture time. I ran into issues with live server hosting through Visual Studio, so I shifted toward using **GitHub Pages** instead. This became an important solution for launching and editing the site online. Went and worked on the foundations of the website, primarly collecting inspiration, most notably from: https://paperplanes.world/
Paper planes website has a center model which I want to use as a model of my self instead and instead of planes maybe profiles. Included these to make a base for this website. Possibly work on API if there is time in future. 

### 27/02
Added fog to the site, but it broke the visual result. After troubleshooting, it seemed the issue came from transparency and the opacity map.

### 28/02
Ran into layout problems where the tiles were too far away from the model and at the wrong rotation, making the scene feel too wide and open. I adjusted the composition and agnles aswell as brought everything closer to the centre. Worked on collecting images from past work and uploading them to Github to be used for the covers of the files.
<img width="2048" height="1422" alt="Screenshot 2026-03-05 185929" src="https://github.com/user-attachments/assets/a5dec10b-8707-422f-ba22-4476c0aa1c7e" />


### 01/03
Refined the folder helix effect. The speed and corkscrew spiral around the model were too fast, so I slowed and improved them. I also created more spacing between folders so the model would be more visible. I aslo created a model for the center of the project using Blender

### 02/03
Worked through major lighting issues. Light from the sky sphere was casting additional light onto the folder covers. I fixed that problem, but the model was still unlit and corrupted because the GL file could not be accessed properly for textures.

<img width="1840" height="915" alt="dwwd" src="https://github.com/user-attachments/assets/ee187fad-306f-42bf-905f-f604451a8d39" />

### 04/03
Re-imported and resized the model. The rock base became larger and covered more of the bottom of the scene. This improved the overall flow of the helix folders moving up the website and made the composition feel more convincing. Futher I corrected alot of spacing issues with the folders and started getting the headers to work. 
<img width="2048" height="1198" alt="wdwdw" src="https://github.com/user-attachments/assets/5c5470fd-6133-445e-b632-c5062d191603" />
### 05/03
The model still had no texture, and the issue could not be resolved at the time. I decided to stop pushing that problem for now and return to it later. I also adjusted folder title placement, since the titles were sitting too far away from the folders, and both the folder and title were fading too far from the camera.

<img width="1870" height="899" alt="Screenshot 2026-03-09 122534" src="https://github.com/user-attachments/assets/a24d49d0-dbb8-437c-89cf-abfa05b766b9" />
### 09/03
Made the largest redesign so far. I completely reworked the website into a **code-breaking / corrupted files** visual style.

Key changes included:
- Introduced binary-style animated visuals inspired by a reference I found online.
- 
  Refrence: [https://www.pond5.com/stock-footage/item/311123919-binary-code-human-face-disintegrating-animation?dd_referrer=https%3A%2F%2Fwww.google.com%2F](https://www.vecteezy.com/video/66877641-binary-code-human-face-disintegrating-animation)
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

Implemented the following limits to the Js.main script:
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

  
## Final Product_ Project_2: 
Overall, I am very pleased with the outcome of this project. My design goal was to create a website that resembled a digital network or matrix-like system, and I feel I came close to achieving that vision. This is most evident on the main page, where the network aesthetic is strongest. In contrast, the subpages act as a kind of sanctuary from the chaos of the homepage. I believe this works well for their purpose, as they function more like professional portfolio pages, with a cleaner and more corporate feel, while still retaining elements of design and subtle colour. In relation to this website, these themes i felt resembled my portfolio as I do alot of coding with C++, probably more than any other design or modeling work. Which brough me to this matrix effect theme.
<img width="1898" height="944" alt="qsq" src="https://github.com/user-attachments/assets/4cce46fd-d649-4e3e-89fa-e865c04d86c7" />



## Generative System:
## Idea:
For my generative system ill be introducing a living creature that will co-exisit with my main center character. Following the code corruption theme, I felt the best suitable inahbitant would be a Spectral Moth.
This Spectral Moth will feed off of code corruption within the website, The moth will also leave a trail of binary to float around behind its wake, and will be attracted to the users interactions with the website. The moth can also be interacted with and may fly to any Project cover when the user is hovering over one. 

Additional: the Spectral Moth feeds of Glitch voids that can be created by the User, These glitch voids are made but left clicking in an open space, this will attract the spectral moth to that location to feed off the corription, if not fed in a while the spectral moth will become hungry and slow down, and possibly show sadness.

### 15/04
Created The Moth Model, Rigged the model. 
<img width="1102" height="600" alt="Screenshot 2026-04-21 125534" src="https://github.com/user-attachments/assets/6edbc467-0066-45cb-85b0-f2370f0bc615" />

### 19/04
Added Animations to Moth Model- Comprised of :
-F_Fly
-F_Fly_Sad
-F_Land
-F_Land_Idle
-F_Land_to_TakeOff
-F_Void_Inspect
-F_Backflip

Anmiation for behaviours within the website, May still make changed easily as its only an FBX file. 
Animation was made pretty easy, As i used Inverse Kinimatics to help make the motion and flow of the moth more realistic and acceptable. Ill use code to drive the motion within the 3D space, and the animations will play based on the triggers done through code. Potetially going to have timing or snapping issues, but will resolve when testing this system out. 

<img width="540" height="854" alt="Animations_Stored" src="https://github.com/user-attachments/assets/228b4b76-6eea-4b82-b85f-ea6e157de440" />
<img width="954" height="571" alt="Screenshot 2026-04-21 125454" src="https://github.com/user-attachments/assets/66face92-1d7c-4319-b7a4-a19d49a4d779" />


### 20/04
Worked on some behaviour of the moth within the website using Chatgpt, nothing really seemed good yet, mainly worked on ideas, and how this moth will live inside the website. 

### 21/04
Uploaded all filed to the website Repo and got the moth to interacte with the website, Got a black Hole ( Binary Void ) and the Moths Patrol around the scene Working. Unfortunatly not the Animations.  I am using the saem shader Binary effect from the center model of the moth, to stay on theme. The Moth seems to flow well, but needs parameters to slow is speed and potentaly have better sline motion rather constant motion, to achive a more realistic effect. Will look into futher scale and parameter changes, as well as black hole consumptin time. 

The moth may also do s sick backflip if cliked on :)

I discovered the issue with the animations, The website expected seperate FBX files containing each animation, which to me seemed expsensive, so i compressed all animations into a single FBX file that also contains the model, and armeture itself. Pending test, but hopefully this will resolve any further issues. 

### 24/04
the moth now has a real home on the PerchBone, it uses land -> perch idle -> takeoff flow for resting there, it feeds on activity, gets tired and returns home, becomes cautious or trusting based on how the user moves, collects fragments and deposits them into a persistent nest, gets corrupted by the glitch void and recovers at home, and visibly changes the site by letting neglected covers gather binary dust while attention cleans them.

### Big Update:
animation states are mapped for fly, flySad, land, perch, takeoff, feed, and backflip land -> perch idle -> takeoff flow is built in, so the moth can properly settle and leave using authored animation clips rather than snapping between states  and the finished-event handling was tightened so actions only hand off when the currently active action actually finishes and now the moth now tracks signa lLevel, fatigue, trust, corruption, vitality, and fragmentCharge
signal rises from hovered covers, pointer movement, wheel activity, open panel presence

### Interaction

renderer DOM listeners were added for pointermove, wheel, and pointerdown. Pointer speed is measured to distinguish gentle vs aggressive interaction. Gentle movement increases trust, aggressive movement increases aggression/fear state 
this makes the moth either companion-like or evasive depending on how the user behaves

### Behavior priority:

if a void is active and corruption is too high, it avoids the void and heads home
if the user is too aggressive, it flees
if it is tired or weak it heads home
if a hovered cover is available, it may approach and perch on it
if trust is high and aggression is low, it enters companion behavior and follows closer to the user
otherwise it patrols
<img width="363" height="489" alt="Screenshot 2026-04-29 182753" src="https://github.com/user-attachments/assets/b8be43ed-9645-40a4-a1b5-4ba9413a7d44" />
<img width="354" height="482" alt="Screenshot 2026-04-29 182740" src="https://github.com/user-attachments/assets/27268b56-0356-4e18-9d78-d4456643d10d" />
<img width="994" height="784" alt="Screenshot 2026-04-29 182826" src="https://github.com/user-attachments/assets/1d63c0d0-93fb-4a1c-9d27-571df07e2c64" />


### Void behavior:

double-clicking empty space can still create the glitch void
the moth can approach it and enter a feed state
the void acts like dangerous food: attractive, but corrupting
clearing the void increases corruption slightly, which pushes the moth toward recovery behavior at home

### 25/04
The moth now uses a stable world-up flight basis instead of the drifting up-vector that was making it roll upside down and “fight” itself. Its heading also now prefers its actual frame-to-frame travel direction, so it should face where it is really moving rather than changing behavior depending on where it is in the scene.

For the backflip, I locked it down so it is animation-only while the clip plays. During Backflip, the code now freezes the moth’s world position and world rotation every frame, zeros its movement velocity, and disables the extra visual bank/pitch motion. So the FBX animation is the only thing driving that move now.

### Cursor-attraction behavior Added
The moth now has a low-priority, random cursor-attraction behavior. It only starts while the moth is already patrolling, only when the cursor is fairly close, and only when higher-priority needs are not taking over. So it will not override home-resting, fleeing, cover-hover landing, void behavior, takeoff, or backflip.

### Stripped Backflip from code.
stripping backflip out completely now — not just the animation trigger, but the related state/logic too, so it stops poisoning the moth behavior. left-clicking directly on the moth is now consumed and does nothing, so it should not trigger the old stuttering path anymore. Double-click void spawning is unchanged.

What I removed:
the backflip clip binding,
the backflip state and guard logic,
the backflip-only update block,
and the left-click trigger that was calling the backflip.


### 26/04
The moth still faces the direction it travels, but it no longer tries to instantly yaw toward every tiny velocity change. I added velocity steering limits, low-speed facing freeze, max turn-rate limits, and reduced bank/pitch so it should stop doing those sharp glitchy maneuvers.
I also made PerchBone Branch thats on the Main FBX center object, which is now made as the highest-priority bone name. This is th moths home now. 
New Logic flow:
<img width="363" height="489" alt="Screenshot 2026-04-29 182753" src="https://github.com/user-attachments/assets/f1ea2516-3b1f-46d2-8404-8789795e9269" />


Double click empty space → binary void appears.
Moth flies to the void.
Moth plays F_Void_Inspect while feeding.
When feeding finishes, it immediately goes home to the perch bone.
When it reaches the bone, it plays F_Land.
Then it stays in F_Land_Idle on the perch bone.

### 28/04
The point light now anchors to the center of the moth, not the root origin.
The trail now emits from the moth’s center/body area instead of above or below it.


<img width="346" height="373" alt="Screenshot 2026-04-28 171819" src="https://github.com/user-attachments/assets/8f5b32ef-ec8c-4ab5-b6dc-fb7c337ea326" />

### 28/04
Debugging and fixing the colsonle, issues Getting issues from the velocity jitter inside moveToward() function, And fixed the yawn logic when doing evasive rotations. 
Added better transition logic, when moth does break within the 3D space. that interference coming from pointer movement still feeding into aggression pointer curiosity hover-loss while the moth is already committed to behaviours So I made a new complete direct replacement that locks the moth’s interaction state until the sequence is finished.


<img width="994" height="784" alt="Screenshot 2026-04-29 182826" src="https://github.com/user-attachments/assets/370b8a31-a513-4533-a5ff-64fd675065b4" />



### 29/04
Fixed gittering and FInaly Stabalized the moths rotation in the world, The rotation offset is still an issue, which seems i canno't fix, but sorta unoticable at the current adjusted speed.
Vortex positioning fixed, so it doesnt spawn far away from  the POV.
Behaviours feel more connected now, with after feeding on a vortex the moth moves to perch on the branch. the limit timer is 5 seconds perched then the moth returns to patrol, and any interactions the user has with covers or void spawns will priorities the moth to that postion, to perch on a cover or feed on the vortx. 
The moth also feels more agrivated based on the users mouse speed, and should make eratic movments as well as change color faster. When the moth is fed and moving to Perch is should change color to a dimmer color. If the moth is negletad it now shows a light off white color, that fades to other random colors to show sadness. 

The user's input to spawn the void is also made as double left click and sinlge left click to interact with the moth. 
The backflip logic was still present and completly removed, which made the moth more stable. 
Overall, Adding further features are too advanced and does not work well, with the current setup. 
AND happy the moth is finaly able to navigate the website ok. The oriantation of the moth is something i have tried to fix for ages, and its just not facing its heading in the 3D space. 


