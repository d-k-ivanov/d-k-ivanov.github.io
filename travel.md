---
layout: travel
title: Travel
permalink: /travel/
---

<!-- <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width">
    <style>
        html {
            overflow-x: hidden;
            overflow-y: hidden;
        }
        .active { fill: gray !important;}
        .DatamapDiv {
            /* border:1px dotted gray; */
            /* background-color: #0077be; */
            width: 100vw;
            height: 100vh;
            position: relative;
        }
        /*.datamaps-key dt, .datamaps-key dd {float: none !important;}
        .datamaps-key {right: -50px; top: 0;}*/
    </style>
</head> -->

<div id="datamap"></div>

<script src="/assets/js/d3.min.js"></script>
<script src="https://unpkg.com/d3-geo-projection@0.2.16/d3.geo.projection.min.js"></script>
<script src="/assets/js/topojson.js"></script>
<script src="/assets/js/datamaps.world.hires.min.js"></script>

<script>
    function getRandomColor() {
        var letters = '0123456789ABCDEF';
        var color = '#';
        for (var i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }

    // Datamaps expect data in format:
    // { "USA": { "fillColor": "#42a844", numberOfWhatever: 75},
    //   "FRA": { "fillColor": "#8dc386", numberOfWhatever: 43 } }
    var dataset = {
        "ARG": { "fillColor":  getRandomColor() },
        "ARM": { "fillColor":  getRandomColor() },
        "AUT": { "fillColor":  getRandomColor() },
        "BLR": { "fillColor":  getRandomColor() },
        "BRA": { "fillColor":  getRandomColor() },
        "CHN": { "fillColor":  getRandomColor() },
        "CYP": { "fillColor":  getRandomColor() },
        "CZE": { "fillColor":  getRandomColor() },
        "DEU": { "fillColor":  getRandomColor() },
        "ECU": { "fillColor":  getRandomColor() },
        "EGY": { "fillColor":  getRandomColor() },
        "ESP": { "fillColor":  getRandomColor(), isHome: true },
        "FRA": { "fillColor":  getRandomColor() },
        "GRC": { "fillColor":  getRandomColor() },
        "IDN": { "fillColor":  getRandomColor() },
        "ITA": { "fillColor":  getRandomColor() },
        "LTU": { "fillColor":  getRandomColor() },
        "LVA": { "fillColor":  getRandomColor() },
        "NLD": { "fillColor":  getRandomColor() },
        "PER": { "fillColor":  getRandomColor() },
        "PRT": { "fillColor":  getRandomColor() },
        "RUS": { "fillColor":  getRandomColor(), isHome: true },
        "TUN": { "fillColor":  getRandomColor() },
        "TUR": { "fillColor":  getRandomColor() },
        "UKR": { "fillColor":  getRandomColor() },
        "URY": { "fillColor":  getRandomColor() },
        "VAT": { "fillColor":  getRandomColor() }
    };

    var cities = [
        { country: 'Armenia', name: 'Yerevan', latitude: 40.1872, longitude: 44.5152 },
        { country: 'China', name: 'Beijing', latitude: 39.9042, longitude: 116.4074 },
        { country: 'China', name: 'Luoyang', latitude: 34.6197, longitude: 112.454 },
        { country: 'China', name: "Xi'an", latitude: 34.3416, longitude: 108.9398 },
        { country: 'France', name: 'Paris', latitude: 48.8566, longitude: 2.3522 },
        { country: 'Germany', name: 'Berlin', latitude: 52.52, longitude: 13.405 },
        { country: 'Italy', name: 'Rome', latitude: 41.9028, longitude: 12.4964 },
        { country: 'Peru', name: 'Lima', latitude: -12.0464, longitude: -77.0428 },
        { country: 'Portugal', name: 'Lisbon', latitude: 38.7223, longitude: -9.1393 },
        { country: 'Russia', name: 'Moscow', latitude: 55.7558, longitude: 37.6173 },
        { country: 'Russia', name: 'Saint Petersburg', latitude: 59.9343, longitude: 30.3351 },
        { country: 'Spain', name: 'A Coruna', latitude: 43.3623, longitude: -8.4115 },
        { country: 'Spain', name: 'Bilbao', latitude: 43.263, longitude: -2.935 },
        { country: 'Spain', name: 'Cadiz', latitude: 36.5271, longitude: -6.2886 },
        { country: 'Spain', name: 'Cordoba', latitude: 37.8882, longitude: -4.7794 },
        { country: 'Spain', name: 'Granada', latitude: 37.1773, longitude: -3.5986 },
        { country: 'Spain', name: 'Leon', latitude: 42.5987, longitude: -5.5671 },
        { country: 'Spain', name: 'Madrid', latitude: 40.4168, longitude: -3.7038 },
        { country: 'Spain', name: 'Malaga', latitude: 36.7213, longitude: -4.4214 },
        { country: 'Spain', name: 'Oviedo', latitude: 43.3619, longitude: -5.8494 },
        { country: 'Spain', name: 'Salamanca', latitude: 40.9701, longitude: -5.6635 },
        { country: 'Spain', name: 'Santander', latitude: 43.4623, longitude: -3.8099 },
        { country: 'Spain', name: 'Santiago de Compostela', latitude: 42.8782, longitude: -8.5448 },
        { country: 'Spain', name: 'Seville', latitude: 37.3891, longitude: -5.9845 },
        { country: 'Spain', name: 'Valencia', latitude: 39.4699, longitude: -0.3763 },
        { country: 'Spain', name: 'Valladolid', latitude: 41.6523, longitude: -4.7286 },
    ];

    // render map
    var map = new Datamap({
        element: document.getElementById('datamap'),
        projection: 'eckert4',
        responsive: true,
        // responsive: false,
        // countries don't listed in dataset will be painted with this color
        fills: { defaultFill: '#F5F5F5', city: '#000000' },
        data: dataset,
        geographyConfig: {
            borderColor: '#DEDEDE',
            highlightBorderWidth: 1,
            popupOnHover: false,
            // Change color on mouse hover
            highlightFillColor: function(geo) {
                return geo['fillColor'] || '#F5F5F5';
            },
            highlightBorderColor: '#B7B7B7',
            // show desired information in tooltip
            popupTemplate: function(geo, data) {
                // don't show tooltip if country don't present in dataset
                // if (!data) { return ['<div class="hoverinfo">',
                //     '<strong>', geo.properties.name, '</strong>',
                //     '</div>'].join(''); }
                if (!data) { return ; }
                if (data.isHome) { return ['<div class="hoverinfo">',
                    '<strong>', geo.properties.name, '</strong>',
                    '<br><strong>Home</strong>',
                    '</div>'].join(''); }
                else {
                    return ['<div class="hoverinfo">',
                    '<strong>', geo.properties.name, '</strong>',
                    '</div>'].join('');
                }
            }
        }
    });

    var cityRadius = 4;
    map.bubbles(cities, {
        borderWidth: 1,
        borderColor: '#FFFFFF',
        fillKey: 'city',
        radius: cityRadius,
        popupOnHover: true,
        popupTemplate: function(geo, data) {
            return ['<div class="hoverinfo">',
                '<strong>', data.name, '</strong>',
                '<br>', data.country,
                '</div>'].join('');
        }
    });

    function enableMapZoom(map) {
        var zoom = d3.behavior.zoom()
            .scaleExtent([1, 8])
            .on('zoom', function() {
                map.svg.selectAll('g').attr(
                    'transform',
                    'translate(' + d3.event.translate + ')scale(' + d3.event.scale + ')'
                );
                map.svg.selectAll('.datamaps-bubble').attr('r', cityRadius / d3.event.scale);
            });

        map.svg.call(zoom);
    }

    enableMapZoom(map);

    var mapElement = document.getElementById('datamap');
    var tooltip = document.createElement('div');
    tooltip.className = 'country-tooltip';
    tooltip.style.zIndex = '10001';
    tooltip.style.position = 'absolute';
    tooltip.style.display = 'none';
    tooltip.style.pointerEvents = 'none';
    mapElement.appendChild(tooltip);

    function updateTooltip(event) {
        var region = event.target.closest && event.target.closest('.datamaps-subunit');

        if (!region) {
            if (event.type === 'mouseover') {
                tooltip.style.display = 'none';
            }
            return;
        }

        var geo = region.__data__;
        var data = dataset[geo.id];

        if (!data) {
            tooltip.style.display = 'none';
            return;
        }

        tooltip.innerHTML = map.options.geographyConfig.popupTemplate(geo, data);
        tooltip.style.display = 'block';

        var mapBounds = mapElement.getBoundingClientRect();
        var pointerX = event.clientX - mapBounds.left;
        var pointerY = event.clientY - mapBounds.top;
        var left = pointerX - tooltip.offsetWidth / 2;

        left = Math.max(0, Math.min(left, mapBounds.width - tooltip.offsetWidth));
        tooltip.style.left = Math.round(left) + 'px';
        tooltip.style.top = Math.max(0, Math.round(pointerY - tooltip.offsetHeight - 12)) + 'px';
    }

    mapElement.addEventListener('mouseover', updateTooltip);
    mapElement.addEventListener('mousemove', updateTooltip);
    mapElement.addEventListener('mouseleave', function() {
        tooltip.style.display = 'none';
    });

    window.addEventListener('resize', function(event){
        map.resize();
    });

    // window.setInterval(function() {
    //     map.updateChoropleth({
    //         "ARG": { "fillColor":  getRandomColor() },
    //         "ARM": { "fillColor":  getRandomColor() },
    //         "AUT": { "fillColor":  getRandomColor() },
    //         "BLR": { "fillColor":  getRandomColor() },
    //         "BRA": { "fillColor":  getRandomColor() },
    //         "CHN": { "fillColor":  getRandomColor() },
    //         "CYP": { "fillColor":  getRandomColor() },
    //         "CZE": { "fillColor":  getRandomColor() },
    //         "ECU": { "fillColor":  getRandomColor() },
    //         "EGY": { "fillColor":  getRandomColor() },
    //         "ESP": { "fillColor":  getRandomColor() },
    //         "GRC": { "fillColor":  getRandomColor() },
    //         "IDN": { "fillColor":  getRandomColor() },
    //         "ITA": { "fillColor":  getRandomColor() },
    //         "LTU": { "fillColor":  getRandomColor() },
    //         "LVA": { "fillColor":  getRandomColor() },
    //         "NLD": { "fillColor":  getRandomColor() },
    //         "PER": { "fillColor":  getRandomColor() },
    //         "RUS": { "fillColor":  getRandomColor() },
    //         "TUN": { "fillColor":  getRandomColor() },
    //         "TUR": { "fillColor":  getRandomColor() },
    //         "UKR": { "fillColor":  getRandomColor() },
    //         "VAT": { "fillColor":  getRandomColor() }
    //     });
    // }, 2000);

</script>
