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
        { country: 'Argentina', name: 'Buenos Aires', latitude: -34.6037, longitude: -58.3816 },
        { country: 'Argentina', name: 'Córdoba', latitude: -31.4201, longitude: -64.1888 },
        { country: 'Argentina', name: 'La Rioja', latitude: -29.4116, longitude: -66.8558 },
        { country: 'Argentina', name: 'Mendoza', latitude: -32.8895, longitude: -68.8458 },
        { country: 'Argentina', name: 'Puerto Iguazú', latitude: -25.595, longitude: -54.588 },
        { country: 'Argentina', name: 'Salta', latitude: -24.7821, longitude: -65.4232 },
        { country: 'Argentina', name: 'San Salvador de Jujuy', latitude: -24.1858, longitude: -65.2995 },
        { country: 'Armenia', name: 'Khor Virap', latitude: 39.8789, longitude: 44.5760 },
        { country: 'Armenia', name: 'Tatev', latitude: 39.3852, longitude: 46.2408 },
        { country: 'Armenia', name: 'Yerevan', latitude: 40.1872, longitude: 44.5152 },
        { country: 'Austria', name: 'Vienna', latitude: 48.2082, longitude: 16.3738 },
        { country: 'Belarus', name: 'Polotsk', latitude: 55.485, longitude: 28.776 },
        { country: 'Brazil', name: 'Foz do Iguaçu', latitude: -25.5163, longitude: -54.585 },
        { country: 'China', name: 'Beijing', latitude: 39.9042, longitude: 116.4074 },
        { country: 'China', name: 'Luoyang', latitude: 34.6197, longitude: 112.454 },
        { country: 'China', name: "Xi'an", latitude: 34.3416, longitude: 108.9398 },
        { country: 'Cyprus', name: 'Larnaca', latitude: 34.9186, longitude: 33.6232 },
        { country: 'Cyprus', name: 'Limassol', latitude: 34.7071, longitude: 33.0226 },
        { country: 'Cyprus', name: 'Nicosia', latitude: 35.1856, longitude: 33.3823 },
        { country: 'Cyprus', name: 'Paphos', latitude: 34.7754, longitude: 32.4242 },
        { country: 'Czech Republic', name: 'Prague', latitude: 50.0755, longitude: 14.4378 },
        { country: 'Ecuador', name: 'Quito', latitude: -0.1807, longitude: -78.4678 },
        { country: 'Egypt', name: 'Cairo', latitude: 30.0444, longitude: 31.2357 },
        { country: 'Egypt', name: 'Hurghada', latitude: 27.2579, longitude: 33.8116 },
        { country: 'Egypt', name: 'Sharm El Sheikh', latitude: 27.9158, longitude: 34.3299 },
        { country: 'France', name: 'Paris', latitude: 48.8566, longitude: 2.3522 },
        { country: 'Germany', name: 'Berlin', latitude: 52.52, longitude: 13.405 },
        { country: 'Greece', name: 'Rhodes', latitude: 36.4277, longitude: 28.2186 },
        { country: 'Indonesia', name: 'Denpasar', latitude: -8.65, longitude: 115.2167 },
        { country: 'Indonesia', name: 'Jakarta', latitude: -6.2088, longitude: 106.8456 },
        { country: 'Indonesia', name: 'Pemuteran', latitude: -8.2125, longitude: 114.5894 },
        { country: 'Indonesia', name: 'Sukapura', latitude: -7.9425, longitude: 112.953 },
        { country: 'Indonesia', name: 'Surakarta', latitude: -7.5656, longitude: 110.831 },
        { country: 'Indonesia', name: 'Ubud', latitude: -8.5069, longitude: 115.2624 },
        { country: 'Indonesia', name: 'Yogyakarta', latitude: -7.7956, longitude: 110.3695 },
        { country: 'Italy', name: 'Bari', latitude: 41.1256, longitude: 16.8679 },
        { country: 'Italy', name: 'Matera', latitude: 40.6666, longitude: 16.6048 },
        { country: 'Italy', name: 'Naples', latitude: 40.8518, longitude: 14.2681 },
        { country: 'Italy', name: 'Ostia Antica', latitude: 41.7311, longitude: 12.3094 },
        { country: 'Italy', name: 'Rome', latitude: 41.9028, longitude: 12.4964 },
        { country: 'Italy', name: 'Salerno', latitude: 40.6824, longitude: 14.7681 },
        { country: 'Italy', name: 'Tivoli', latitude: 41.9619, longitude: 12.8079 },
        { country: 'Latvia', name: 'Riga', latitude: 56.9496, longitude: 24.1052 },
        { country: 'Lithuania', name: 'Trakai', latitude: 54.6461, longitude: 24.9347 },
        { country: 'Lithuania', name: 'Vilnius', latitude: 54.6872, longitude: 25.2797 },
        { country: 'Netherlands', name: 'Amsterdam', latitude: 52.3676, longitude: 4.9041 },
        { country: 'Peru', name: 'Aguas Calientes', latitude: -13.1631, longitude: -72.545 },
        { country: 'Peru', name: 'Arequipa', latitude: -16.409, longitude: -71.5375 },
        { country: 'Peru', name: 'Caral', latitude: -10.8917, longitude: -77.5231 },
        { country: 'Peru', name: 'Chachapoyas', latitude: -6.2306, longitude: -77.8728 },
        { country: 'Peru', name: 'Cusco', latitude: -13.5319, longitude: -71.9675 },
        { country: 'Peru', name: 'Lima', latitude: -12.0464, longitude: -77.0428 },
        { country: 'Peru', name: 'Nasca', latitude: -14.835, longitude: -74.938 },
        { country: 'Peru', name: 'Paracas', latitude: -13.865, longitude: -76.254 },
        { country: 'Peru', name: 'Puno', latitude: -15.8402, longitude: -70.0219 },
        { country: 'Peru', name: 'Trujillo', latitude: -8.109, longitude: -79.0215 },
        { country: 'Portugal', name: 'Lisbon', latitude: 38.7223, longitude: -9.1393 },
        { country: 'Russia', name: 'Belgorod', latitude: 50.6106, longitude: 36.5802 },
        { country: 'Russia', name: 'Moscow', latitude: 55.7558, longitude: 37.6173 },
        { country: 'Russia', name: 'Saint Petersburg', latitude: 59.9343, longitude: 30.3351 },
        { country: 'Russia', name: 'Sochi', latitude: 43.5853, longitude: 39.7203 },
        { country: 'Spain', name: 'A Coruna', latitude: 43.3623, longitude: -8.4115 },
        { country: 'Spain', name: 'Avila', latitude: 40.6565, longitude: -4.6818 },
        { country: 'Spain', name: 'Bilbao', latitude: 43.263, longitude: -2.935 },
        { country: 'Spain', name: 'Cadiz', latitude: 36.5271, longitude: -6.2886 },
        { country: 'Spain', name: 'Cordoba', latitude: 37.8882, longitude: -4.7794 },
        { country: 'Spain', name: 'Estepona', latitude: 36.4271, longitude: -5.1453 },
        { country: 'Spain', name: 'Granada', latitude: 37.1773, longitude: -3.5986 },
        { country: 'Spain', name: 'Jerez de la Frontera', latitude: 36.6850, longitude: -6.1260 },
        { country: 'Spain', name: 'Leon', latitude: 42.5987, longitude: -5.5671 },
        { country: 'Spain', name: 'Madrid', latitude: 40.4168, longitude: -3.7038 },
        { country: 'Spain', name: 'Malaga', latitude: 36.7213, longitude: -4.4214 },
        { country: 'Spain', name: 'Oviedo', latitude: 43.3619, longitude: -5.8494 },
        { country: 'Spain', name: 'Pontevedra', latitude: 42.4333, longitude: -8.6333 },
        { country: 'Spain', name: 'Ronda', latitude: 36.7423, longitude: -5.1663 },
        { country: 'Spain', name: 'Salamanca', latitude: 40.9701, longitude: -5.6635 },
        { country: 'Spain', name: 'Santander', latitude: 43.4623, longitude: -3.8099 },
        { country: 'Spain', name: 'Santiago de Compostela', latitude: 42.8782, longitude: -8.5448 },
        { country: 'Spain', name: 'Segovia', latitude: 40.9429, longitude: -4.1086 },
        { country: 'Spain', name: 'Seville', latitude: 37.3891, longitude: -5.9845 },
        { country: 'Spain', name: 'Toledo', latitude: 39.8628, longitude: -4.0273 },
        { country: 'Spain', name: 'Valencia', latitude: 39.4699, longitude: -0.3763 },
        { country: 'Spain', name: 'Valladolid', latitude: 41.6523, longitude: -4.7286 },
        { country: 'Tunisia', name: 'Douz', latitude: 33.4578, longitude: 9.0286 },
        { country: 'Tunisia', name: 'El Jem', latitude: 35.3000, longitude: 10.7000 },
        { country: 'Tunisia', name: 'Monastir', latitude: 35.7778, longitude: 10.8264 },
        { country: 'Tunisia', name: 'Sousse', latitude: 35.8256, longitude: 10.63699 },
        { country: 'Tunisia', name: 'Tunis', latitude: 36.8065, longitude: 10.1815 },
        { country: 'Turkey', name: 'Antalya', latitude: 36.8969, longitude: 30.7133 },
        { country: 'Turkey', name: 'Istanbul', latitude: 41.0082, longitude: 28.9784 },
        { country: 'Ukraine', name: 'Kharkiv', latitude: 49.9935, longitude: 36.2304 },
        { country: 'Ukraine', name: 'Kyiv', latitude: 50.4501, longitude: 30.5234 },
        { country: 'Ukraine', name: 'Simferopol', latitude: 44.9521, longitude: 34.1024 },
        { country: 'Uruguay', name: 'Montevideo', latitude: -34.9011, longitude: -56.1645 },
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
            borderColor: '#B7B7B7',
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
