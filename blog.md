---
layout: default
title : Blog
permalink: /blog/
---

{% include JB/setup.html %}

{% assign posts_collate = site.posts %}
<div class="page card">
    {% include JB/posts_collate.html %}
</div>
