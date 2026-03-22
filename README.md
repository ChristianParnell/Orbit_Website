**Orbit_Profile_Website**



**24/02** -> Spent a day working on figuring out how to do this website thing. What code? HTML?? I asked chat GPT, and has all the info i needed on creating a html file as well as coding it. I wasn’t used to using html and C+ so this was very cool! Love coding and got a new found love for this.

**25/02** -> Got to lecture and needed help setting up pages! Chat GPT let me down on live server hosting though Visual studios, as there just isn’t anything like that. So using Github Pages is huge for launching the website and editing it.

**27/02** -> added some fog that broke the site. Worked on it alot, transparency issues with the opacity map seemeed to be the causing issue.

**28/03** -> came into problems with tiles being too far away from the modle, too wide and open space. Fixed brought all closer to the center. 

**1/03** -> fixed folder Helix effect. Speed and cork screw effect that orbit/spirals around modle was way too fase. Also made more space between folders so model is more visable.

**2/03** -> Huge lighting issues, light from the sky_sphere is casting addittional light to the folder covers. Fixed, but model has not lighting and currupted, the GL file cant be accesses to get textures. 






**5/03** -> the model still has no texture. Chat GPT cant resolve this issue either.  Took too long to resove stopped trying, will come back to this issue. Did amend some title text issues where the title of folders were too far away from the folder, and both folder and text fades away from camera. 

**4/03** -> Re-imported model and resized it, the rock base is now bigger, covering most the bottom scene. The flow of the folders doing a helix up the website is better, and more convincing, with this model change. 

**9/03** -> Made some Huge Changes! Biggest yet. I have completly re-done the website, I decided to go with a code breaking style, with corrupt files and effects. I found a cool image of a binary animation someone had done online, and thought would it be possible with Chat Gpt? And Yes! Its defentily. By making the model transparent and making a solid color background, there is a huge diffrence. I made a color ramp from adobe color pallets. Plugged it into the chat GPT to edit the styles and Js-Main and made some intresting color binary number effects. I had initally got some problemts with size of these binary numbers. But amended them now. I needed a video for the background and got Ai to generate a code flux background, its transparency is low and suits the color “blue” with background “dark Blue” this whole effect really completes the look. I added some binary flow exscaping the center model into the cover files, they get slightly bigger the closer they get to the cover. The website needed some more effect, and was too static, MORE CHAOS. So i added this random event were a cover file would get breached and code would get sucked into it. This works well! And you can see the binary effect better flowing out the character not just hovering over a file.



**10/03** -> Added Animations   


 
**12/03** -> Worked on limiting render performance. With GPU and CPU struggling to keep up i have implemented verables:
·	modelPointLimit: 8000
·	streamPerCover: 120
·	focusTunnelParticles: 180
·	pixel ratio 1.5
·	60 FPS cap

**14/03**-> Worked on some of the internal pages, giving about, contact and achivments content fulled. I worked on the gallery getting it organised better, and added 10 videos and 10 pictues. I had to compress them all to be under 100mg as git doesn't upload over 100mg. I got my Pages Js to cast a front cover of each video and loads that, the render stills where fine. 

**FeedBack: 19/03** -> Sub Websites eg, About, Contact, Gallery are not consistanct with the design theme. change color header for the binary code color (Rainbow) to suit the ongoing theme. Maybe could see what Chatgpt could do for some (arc Radiers theme as this is what comes to mind) for the asthetics. Possibly get the subheaders to carry on the blue, or possibly getting the glitch effect into the headers or play some role witht eh sub websites. With the main page create a slow rotation for the helix to start. if the user doesn't scroll after 10 seconds maybe have a help rpompt saying scroll and press on covers to opne? 

22/03 -> edited the CSS Pages. This is for the wubwesbite folders. What this update changes:
- Brightens the sub pages while keeping the dark technical base.
- Adds code-color gradients to headers, labels, and UI chips.
- Gives media/link/timeline cards a stronger illuminated hover state.
- Adds subtle grid / scanline overlays to make the pages feel more networked.
- Keeps the existing HTML and JS structure intact, so no template rewrite is required.

I Removed the diagnostics tab on the main page, as well as added a webiste is inteded for laptop or PC use only.

I updated the sub-pages so they feel much closer to the main Orbit site instead of looking like darker separate pages. The About, Achievements, Gallery, and Contact pages now share a stronger coded-network identity with brighter accent colors, animated data sweeps, glitch-style heading details, and active “node” styling on cards and panels.

Each page now has its own subtle accent personality while still matching the same system, so About feels more cyan, Gallery leans more violet, Contact has a lime-blue signal tone, and Achievements feels more certified/system-log inspired. I also added hero status badges, sticky side navigation on larger screens, better hover feedback, animated scan brackets, and a more terminal-like lightbox treatment.

The gallery interactions were pushed further with binary particle hover effects and more alive media-card behavior, while the hero areas now have a low-opacity code-rain layer so they feel active without becoming messy. Overall, the result is more colorful, more technical, more polished, and more consistent with the main website’s visual language.

Spent time on the contents of the Sub Pages. 
Added a Idle Orbit after 8 seconds, And quick acess tabs to jump ahead to the page you want
