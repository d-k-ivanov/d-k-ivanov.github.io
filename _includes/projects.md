<h2 id="projects" style="margin: 2px 0px -15px;">Projects</h2>

<div class="projects">
<ol class="bibliography">

{% for link in site.data.projects.main %}

<li>
<div class="pub-row">
    <div class="col-sm-3 abbr" style="position: relative;padding-right: 15px;padding-left: 15px;">
        {% if link.image %}
        <img id="myImg" src="{{ link.image }}" class="teaser img-fluid z-depth-1" style="width=100;height=40%">
        {% endif %}
        {% if link.badge %}
        <abbr class="badge">{{ link.badge }}</abbr>
        {% endif %}
    </div>
    <div class="col-sm-9" style="position: relative;padding-right: 15px;padding-left: 20px;">
        <div class="title"><a href="{{ link.page }}" target="_blank">{{ link.title }}</a></div>
        <div class="author">{{ link.authors }}</div>
        <div class="links">
            {% if link.code %}
            <a href="{{ link.code }}" class="btn btn-sm z-depth-0" role="button" target="_blank"  style="font-size:12px;">Code</a>
            {% endif %}
            {% if link.pdf %}
            <a href="{{ link.pdf }}" type="application/pdf" class="btn btn-sm z-depth-0" role="button" target="_blank" style="font-size:12px;">PDF</a>
            {% endif %}
            {% if link.demo %}
            <a href="{{ link.demo }}" class="btn btn-sm z-depth-0" role="button" target="_blank" style="font-size:12px;">Demo</a>
            {% endif %}
            {% if link.page %}
            <a href="{{ link.page }}" class="btn btn-sm z-depth-0" role="button" target="_blank"  style="font-size:12px;">Project Page</a>
            {% endif %}
            {% if link.notes %}
            <strong> <i style="color:#e74d3c">{{ link.notes }}</i></strong>
            {% endif %}
        </div>
    </div>
</div>
</li>

<br>

{% endfor %}

</ol>
</div>
