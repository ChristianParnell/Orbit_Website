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
