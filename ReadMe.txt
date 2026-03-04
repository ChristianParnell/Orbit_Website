Orbit_Profile_Website

24/02 -> Spent a day working on figuring out how to do this website thing. What code? HTML?? I asked chat GPT, and has all the info i needed on creating a html file as well as coding it. I wasn’t used to using html and Js, all i know is C+ so this was very cool! Love coding and got a new found love for this.

25/02 -> Got to lecture and needed help setting up pages! Chat GPT let me down on live server hosting though Visual studios, as there just isn’t anything like that. So using Github Pages is huge for launching the website and editing it.

2/03 -> I did some reasearch on some cooler website designs, that didn't envolve any game mechanics, I wanted to rebuild and redifine the website to protray myself, this would most suit a personaly profile wbsite. after checking out some banga personal websites online, i had an idea of using not the traditional scroll down formate, but scroll orbit around a mesh of myself. i attempted this and still got errors. 

4/03 -> I found the brickwall error using chat gpt i found my index.html does include the module script: <script type="module" src="./main.js?v=6"></script>
But my main.js starts with import * as THREE from "three"; and import { GLTFLoader } from "three/addons/..." In a plain browser + GitHub Pages setup, bare module specifiers like "three" do not resolve unless you use an import map (or a bundler)." after cracking this i achived a website again. I’m using esm.sh for the imports, because it rewrites Three.js addon imports properly in the browser (CDNs like jsDelivr often break GLTFLoader unless I also set an importmap).
