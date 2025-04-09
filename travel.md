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

<div id="datamap" style="height: 30vh; position: relative;" ></div>
<!-- <div id="datamap" style="position: relative;" ></div> -->

<script src="/assets/js/d3.min.js"></script>
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

    // render map
    var map = new Datamap({
        element: document.getElementById('datamap'),
        projection: 'mercator', // big world map
        responsive: true,
        // countries don't listed in dataset will be painted with this color
        fills: { defaultFill: '#F5F5F5' },
        data: dataset,
        geographyConfig: {
            borderColor: '#DEDEDE',
            highlightBorderWidth: 1,
            // Change color on mouse hover
            highlightFillColor: function(geo) {
                return geo['fillColor'] || '#E5E5E5';
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
