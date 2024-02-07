---
layout: post
description: fun cartoons from kids' drawings
date: 2024-02-07
---
<h1> Fun cartoons from kids' drawings </h1>

**TL;DR: Scroll down if you want to see the result.**

Raising children is difficult. Every day, you must answer unusual questions, be better than you are in front of your children, and teach morality and justice. And everything should be done entertainingly. Insane…

I'd like to share my recipe for making my kids happy spending just one simple evening. We will make an animation film from the kids' drawings. There is no limitation on the drawings' quality or sanity of the picture. The more insane the picture is, the better and means more fun.

What kind of qualities does this grow? Goal making, reachability of any endeavours, that children's works have no difference than works of grown-ups. And that imagination can make anything come true.

The essential tools we need:

- Digital scanner — we need to bring pictures to your computer somehow. If you don't have a scanner, you can just take photos on your phone. The image quality is not so critical. The fun is essential.
- [OpenShot Video Editor](https://www.openshot.org/) — to combine everything easily.
- [Shotcut Video Editor](https://shotcut.org/) — to more complex operation with video clips. We're using it for cropping video files to the length we need.
- [Pant.Net](https://www.getpaint.net/) or a similar image editing tool. The only usage here is to crop and resize images to the appropriate size to fit the viewport.
- [The ANIMATED DRAWINGS website](https://sketch.metademolab.com/) — an astonishing AI project from Meta to animate kids' drawings using AI. It can't create an entire film for us (maybe someday, but not now), but can provide us with short samples.
- [Unscreen.com](https://www.unscreen.com/) — a project where you can remove the background from any video. The free version is limited to 5 seconds (that's why we need the Shotcut), but it's enough for our purposes.
- You may use [FreeSound](https://freesound.org/) to get more sound effects for your film.
- And [FreePD](https://freepd.com/) to get COPYRIGHT FREE music for your film to share on YouTube or wherever.

## Preparing the drawings

The dullest part. You need to scan images, cut them, rotate them (I believe your kids don't put enough effort into aligning them on the scanner's glass), and resize them to the appropriate size. I want to recommend asking your children to draw characters and footage (background) separately to save your precious time. For the final size, I'm using any combination of **$16/9$** aspect ratio. Normally, it's **$1280×720$(HD)** or **$1920×1080$(FullHD)**, but no more. Creating 4k cartoons from kid's drawings is overkill.

**Here is an example of the initial and cropped images:**

<img id="myImg" alt="prepating-the-drawings" src="/assets/blog/2024/02-07-prepating-the-drawings.gif" width="100%"/>

## Animating the characters

Okay, all drawings are scanned, cropped and resized. It's time to create the first animations. This is my kids' favourite part. The magic of making their characters live. The ANIMATED DRAWINGS website is our best assistant here. Just upload the image with a character and follow the simple instructions on the website. Advice: don't make the mask perfect, always separate hands and legs, even if they seem inseparable — there is always a way.

**Here is what we get:**

<img id="myImg" alt="02-07-animating-the-characters" src="/assets/blog/2024/02-07-animating-the-characters.gif" width="100%"/>

## Transparent background on characters' frames

Okay, what's next? Of course, at this point, we should start OpenShot and arrange our cut images on the timeline, but for the article, it's better to describe each step first. Just keep in mind that you need to start creating a film timeline to be able to decide what to do next. So, in the article, our next step would be «removing the background from frames with characters to be able to put it on top of a footage frames». For these purposes, let's go to the [unscreen.com](https://www.unscreen.com/).

Remember, the free version of [unscreen.com](https://www.unscreen.com/) supports only 5-second long videos, so you may need to crop the video. I use [Shotcut](https://shotcut.org/) for this:

<img id="myImg" alt="02-07-animating-the-characters" src="/assets/blog/2024/02-07-cut-the-video.gif" width="100%"/>

On the [unscreen.com](https://www.unscreen.com/) the workflow is straightforward, you upload the video, and it magically removes the background. The free version allows downloading a GIF file or a folder with N-frames. I haven't found a way to use GIFs, so, in our case, only a set of Single Frames allows us to reach our goals.

<img id="myImg" alt="02-07-unscreen" src="/assets/blog/2024/02-07-unscreen.gif" width="100%"/>

## Combining everything together

Finally, we've reached the point when we will compile everything using [OpenShot](https://www.openshot.org/). I'm going to show you my workflow, but the task is purely creative. To record effect sounds and narration, we're using WhatsApp and any available music as a soundtrack (check the tools and websites I've put at the beginning of the article).

**The key points are:**

- Frames downloaded from the Unscreen should be put into a single folder. Then add the FIRST frame to the OpenShot and add it to the library as a sequence of frames. OpenShot will add the sequence of frames generated from all files in the folder automatically.
- There are two cool video effects loved by children: «Wave» and «Color Shift».
- Every length is easily adjustable with a mouse, so there is no need to crop clips in some external tool or put multiple similar frames one by one. Just click the mouse.
- Use multiple tracks to allow frames to overlap each other.

<img id="myImg" alt="02-07-openshot-project" src="/assets/blog/2024/02-07-openshot-project.jpg" width="100%"/>

## The Result

<iframe width="100%" height="794" src="https://www.youtube.com/embed/gzPC_XJ5HCk" title="Lilly and Harry (Home Kids&#39; Cartoon)" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
