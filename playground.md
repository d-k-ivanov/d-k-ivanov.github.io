---
layout: default
title: Playground
permalink: /playground/
---

## Android Development

| **Armenian Alphabet for Android** | **Russian Alphabet for Android** |
|:=================================:|:================================:|
| <a href="https://play.google.com/store/apps/details?id=com.pupupon.armenianalphabet" target="_blank"><img src="/assets/img/projects/ArmenianAlphabet.gif" alt="Armeinan Alphabet"/></a> | <a href="https://play.google.com/store/apps/details?id=com.pupupon.russian_alphabet" target="_blank"><img src="/assets/img/projects/RussianAlphabet.gif" alt="Russian Alphabet"/></a> |

## Arcanoid on OpenGL

<a href="https://github.com/d-k-ivanov/sandbox-gamedev/tree/main/opengl-arcanoid" target="_blank">
  <img src="/assets/img/projects/OpenglArcanoid.gif" alt="Arcanoid Opengl"/>
</a>

## 2D Action RPG on CSharp

2D Action RPG on CSharp with Godot based on [Heartbeast Lessons](https://www.youtube.com/watch?v=mAbG8Oi-SvQ&list=PL9FzW-m48fn2SlrW0KoLT4n5egNdX-W9a)

<a href="https://github.com/d-k-ivanov/sandbox-gamedev/tree/main/godot-2d-action-rpg" target="_blank">
  <img src="/assets/img/projects/godot-2d-action-rpg.gif" alt="2D Action RPG on CSharp with Godot"/>
</a>

## TurboRED Company Website

<img id="myImg" src="/assets/img/projects/TurboRED.png" alt="Turbored Home Page">

<!-- The Modal Window -->
<div id="projects_modal" class="modal">
  <span class="close">&times;</span>
  <img class="modal-content" id="placeholder" alt="">
  <div id="caption"></div>
</div>

<script>
    var modal       = document.getElementById('projects_modal');
    var img         = document.getElementById('myImg');
    var modalImg    = document.getElementById("placeholder");
    var captionText = document.getElementById("caption");

    img.onclick = function(){
        modal.style.display = "block";
        modalImg.src = this.src;
        captionText.innerHTML = this.alt;
    }

    // Get the <span> element that closes the modal
    var span = document.getElementsByClassName("close")[0];

    // When the user clicks on <span> (x), close the modal
    span.onclick = function()
    {
        modal.style.display = "none";
    }

modal.onclick = function ()
    {
        modal.style.display = "none";
    }
</script>
