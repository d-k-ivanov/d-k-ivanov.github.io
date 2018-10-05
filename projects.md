---
layout: page
title: Projects
permalink: /projects/
---

### Armenian Alphabet Quiz for Android

<a href="https://play.google.com/store/apps/details?id=com.pupupon.armenianalphabet" target="_blank">
  <img src="../images/projects/ArmenianAlphabetQuizDroid.gif" alt="Armeinan Alphabet Quiz" style="width: 200px; margin:0px 50px 0px 50px;"/>
</a>

### TurboRED Company Website

<img id="myImg" src="../images/projects/TurboRED.png" alt="Turbored Home Page" style="width: 300px; margin:0px 50px 0px 50px;">

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
