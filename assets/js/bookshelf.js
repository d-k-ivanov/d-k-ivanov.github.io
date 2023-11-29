function getRandomInt(min, max)
{
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice(array)
{
    return array[Math.floor(Math.random() * array.length)];
}

let spines = Object.values(document.getElementsByClassName("spine"));
let covers = Object.values(document.getElementsByClassName("cover"));
let tops   = Object.values(document.getElementsByClassName("top"));

// Patterns: https://projects.verou.me/css3patterns/
let availablePatterns = [
    "argyle",
    "diagonal",
    "madras",
    "pyramid",
    "stairs",
    "tartan",
];

let availableColors = [
    "maroon",
    "darkgreen",
    "darkolivegreen",
    "brown",
    "saddlebrown",
    "sienna",
    "midnightblue",
];

// assign a random height, pattern and colour to each book
spines.map(function (s, i)
{
    let randomHeight            = getRandomInt(220, 240);
    s.style.height              = `${randomHeight}px`;
    s.style.top                 = `${280 - randomHeight}px`;

    // Use patterns to draw root cover
    // let randomPattern           = randomChoice(availablePatterns);
    // let randomColor             = randomChoice(availableColors);
    // s.style.backgroundColor     = randomColor;
    // s.style.backgroundImage     = `var(--${randomPattern})`;

    // Use ofiginal image to draw root cover:
    s.style.backgroundImage     = covers[i].style.backgroundImage;
    s.style.backgroundSize      = "100% 100%";
    s.style.backgroundRepeat    = "no-repeat";
    // s.style.filter           = "grayscale(100%)";

    covers[i].style.height      = `${randomHeight}px`;
    covers[i].style.top         = `${280 - randomHeight}px`;
    tops[i].style.top           = `${280 - randomHeight}px`;
});
