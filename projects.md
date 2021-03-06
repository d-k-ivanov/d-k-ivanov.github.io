---
layout: page
title: Projects
permalink: /projects/
---

### Armenian Alphabet for Android

<a href="https://play.google.com/store/apps/details?id=com.pupupon.armenianalphabet" target="_blank">
  <img src="../images/projects/ArmenianAlphabet.gif" alt="Armeinan Alphabet" style="width: 200px; margin:0px 50px 0px 50px;"/>
</a>

### Russian Alphabet for Android

<a href="https://play.google.com/store/apps/details?id=com.pupupon.russian_alphabet" target="_blank">
  <img src="../images/projects/RussianAlphabet.gif" alt="Russian Alphabet" style="width: 200px; margin:0px 50px 0px 50px;"/>
</a>

### Arcanoid on OpenGL

<a href="https://github.com/d-k-ivanov/sandbox-gamedev/tree/master/opengl-arcanoid" target="_blank">
  <img src="../images/projects/OpenglArcanoid.gif" alt="Arcanoid Opengl" style="width: 1024px; margin:0px 50px 0px 50px;"/>
</a>

### 2D Action RPG on CSharp

2D Action RPG on CSharp with Godot based on [Heartbeast Lessons](https://www.youtube.com/watch?v=mAbG8Oi-SvQ&list=PL9FzW-m48fn2SlrW0KoLT4n5egNdX-W9a)

<a href="https://github.com/d-k-ivanov/sandbox-gamedev/tree/master/godot-2d-action-rpg" target="_blank">
  <img src="../images/projects/godot-2d-action-rpg.gif" alt="2D Action RPG on CSharp with Godot" style="width: 1024px; margin:0px 50px 0px 50px;"/>
</a>

### TurboRED Company Website

<img id="myImg" src="../images/projects/TurboRED.png" alt="Turbored Home Page" style="width: 1024px; margin:0px 50px 0px 50px;">

<!-- The Modal -->
<div id="myModal" class="modal">

  <!-- The Close Button -->
  <span class="close">&times;</span>

  <!-- Modal Content (The Image) -->
  <img class="modal-content" id="img01">

  <!-- Modal Caption (Image Text) -->
  <div id="caption"></div>
</div>

<script>
// Get the modal
var modal = document.getElementById('myModal');

// Get the image and insert it inside the modal - use its "alt" text as a caption
var img = document.getElementById('myImg');
var modalImg = document.getElementById("img01");
var captionText = document.getElementById("caption");
img.onclick = function(){
    modal.style.display = "block";
    modalImg.src = this.src;
    captionText.innerHTML = this.alt;
}

// Get the <span> element that closes the modal
var span = document.getElementsByClassName("close")[0];

// When the user clicks on <span> (x), close the modal
span.onclick = function() { 
  modal.style.display = "none";
}
</script>
