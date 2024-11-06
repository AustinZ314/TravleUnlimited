var countries = ["Afghanistan","Angola","Albania","United Arab Emirates","Argentina","Armenia","Antarctica","French Southern and Antarctic Lands","Australia","Austria","Azerbaijan","Burundi","Belgium","Benin","Burkina Faso","Bangladesh","Bulgaria","The Bahamas","Bosnia and Herzegovina","Belarus","Belize","Bolivia","Brazil","Brunei","Bhutan","Botswana","Central African Republic","Canada","Switzerland","Chile","China","Ivory Coast","Cameroon","Democratic Republic of the Congo","Republic of the Congo","Colombia","Costa Rica","Cuba","Northern Cyprus","Cyprus","Czech Republic","Germany","Djibouti","Denmark","Dominican Republic","Algeria","Ecuador","Egypt","Eritrea","Spain","Estonia","Ethiopia","Finland","Fiji","Falkland Islands","France","Gabon","England","Georgia","Ghana","Guinea","Gambia","Guinea Bissau","Equatorial Guinea","Greece","Greenland","Guatemala","Guyana","Honduras","Croatia","Haiti","Hungary","Indonesia","India","Ireland","Iran","Iraq","Iceland","Israel","Italy","Jamaica","Jordan","Japan","Kazakhstan","Kenya","Kyrgyzstan","Cambodia","South Korea","Kosovo","Kuwait","Laos","Lebanon","Liberia","Libya","Sri Lanka","Lesotho","Lithuania","Luxembourg","Latvia","Morocco","Moldova","Madagascar","Mexico","Macedonia","Mali","Myanmar","Montenegro","Mongolia","Mozambique","Mauritania","Malawi","Malaysia","Namibia","New Caledonia","Niger","Nigeria","Nicaragua","Netherlands","Norway","Nepal","New Zealand","Oman","Pakistan","Panama","Peru","Philippines","Papua New Guinea","Poland","Puerto Rico","North Korea","Portugal","Paraguay","Qatar","Romania","Russia","Rwanda","Western Sahara","Saudi Arabia","Sudan","South Sudan","Senegal","Solomon Islands","Sierra Leone","El Salvador","Somaliland","Somalia","Republic of Serbia","Suriname","Slovakia","Slovenia","Sweden","Swaziland","Syria","Chad","Togo","Thailand","Tajikistan","Turkmenistan","East Timor","Trinidad and Tobago","Tunisia","Turkey","Taiwan","United Republic of Tanzania","Uganda","Ukraine","Uruguay","USA","Uzbekistan","Venezuela","Vietnam","Vanuatu","West Bank","Yemen","South Africa","Zambia","Zimbabwe"];

// The svg
const svg = d3.select("svg"),
    width = +svg.attr("width"),
    height = +svg.attr("height");

const projection = d3.geoMercator()
    .center([0, 0])
    .scale(width / 1.5 / Math.PI)
    .translate([width / 2, height / 2]);

function displayMapLines() {
    // Define path generator for displaying parallels and meridians
    var path = d3.geoPath()
        .projection(projection  );

    // Display parallels
    svg.selectAll(".parallels")
        .data(d3.range(-90, 91, 10))
        .enter().append("path")
        .attr("class", "parallels")
        .style("stroke", "gray")
        .style("stroke-width", 0.2)
        .attr("d", function(d) {
            const coords = d3.range(-180, 181, 1).map(function(x) {
                return [x, d];
            });
            return path({ type: "LineString", coordinates: coords });
        });

    // Display meridians
    svg.selectAll(".meridians")
        .data(d3.range(-180, 181, 10))
        .enter().append("path")
        .attr("class", "meridians")
        .style("stroke", "gray")
        .style("stroke-width", 0.2)
        .attr("d", function(d) {
            return path({type: "LineString", coordinates: [[d, -90], [d, 90]]});
        });
}

// Create zoom behavior function
const padding = 500;
const zoom = d3.zoom()
    .scaleExtent([0.4, 20])
    .translateExtent([[-padding, -padding*1.5], [width + padding, height + padding*1.5]])
    .on("zoom", zoomed);

// Called when there is a zoom event like scrolling or button clicks
function zoomed(e) {
    d3.selectAll("path")
        .attr("transform", e.transform);
}

d3.select("svg")
    .call(zoom);

function handleZoom(scaleFactor) {
    // manualZoom = true; // Prevent viewBox from adjusting since user manually zoomed
    svg.transition()
        .call(zoom.scaleBy, scaleFactor);
}


// GLOBAL VARIABLES
var displayedNames = [];    // List of currently displayed countries' names
var displayedCoords = []    // List of currently displayed countries' coordinates
var path = [];              // Shortest path between source and target countries
// var manualZoom = false;  // If user manually zooms, then do not re-center when displaying new countries
var duration = 750;         // Set zoom and function timeout duration
var guesses = 0;            // How many guesses the player has used
var maxGuesses = 0;         // Total guesses allowed before player loses

// Select and display source and target countries on load
document.addEventListener('DOMContentLoaded', async function() {

    displayMapLines();
    var response = await fetch('./neighbors.json');
    const data = (await response.json()).countries;
    var endpoints = pickRandom(data);
    //console.log(endpoints);

    endpoints[0] = "Democratic Republic of the Congo";
    endpoints[1] = "Nigeria";

    path = findShortestPath(data, endpoints[0], endpoints[1]);
    path = findAlternatePaths(data);

    // Find new countries for source and target if too close (less than 2 countries in between)
    while(path.length <= 3) {
        endpoints = pickRandom(data);
        //console.log(endpoints);
        path = findShortestPath(data, endpoints[0], endpoints[1]);
        path = findAlternatePaths(data);
    }
    //console.log(path);
    maxGuesses = Math.floor((path.length - 2) * 1.5 + 2);

    const displayData = await d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson");
    displayCountry(displayData.features, endpoints[0], "#f5bac8", false);
    displayCountry(displayData.features, endpoints[1], "#95cade", false);
    document.getElementById('title').innerHTML = `Today, I want to go from <span class="start-country">${endpoints[0]}</span> to <span class="end-country">${endpoints[1]}</span>.`;
    document.getElementById('guess-button').innerHTML = "Guess (0/" + maxGuesses + ")";

    // Display tutorial
    setTimeout(() => {
        dispTutorial();
    }, 300);
})

document.getElementById("close-tutorial").addEventListener("click", hideTutorial);
document.getElementById("close-gameover").addEventListener("click", hideGameover);

function toggleTutorial() {
    const tut = document.getElementById("tutorial-tab");
    if (tut.style.display === "none" || tut.style.opacity === "0") {
        dispTutorial();
    } else {
        hideTutorial();
    }
}

function dispTutorial() {
    const tut = document.getElementById("tutorial-tab");
    const overlay = document.querySelector(".overlay");

    tut.style.display = "block";
    overlay.style.display = "block";
    setTimeout(() => {
        tut.style.opacity = "1";
        overlay.style.opacity = "1";
        tut.style.transform = "translate(-50%, -50%)";
    }, 0)
}

function hideTutorial() {
    const tut = document.getElementById("tutorial-tab");
    const overlay = document.querySelector(".overlay");

    tut.style.opacity = "0";
    overlay.style.opacity = "0";
    setTimeout(() => {
        tut.style.display = "none";
        overlay.style.display = "none";
    }, 300);
}

function dispGameover() {
    const gameover = document.getElementById("gameover-tab");
    const overlay = document.querySelector(".overlay");

    gameover.style.display = "block";
    overlay.style.display = "block";
    setTimeout(() => {
        gameover.style.opacity = "1";
        overlay.style.opacity = "1";
        gameover.style.transform = "translate(-50%, -50%)";
    }, 0);
}

function hideGameover() {
    const gameover = document.getElementById("gameover-tab");
    const overlay = document.querySelector(".overlay");

    gameover.style.opacity = "0";
    overlay.style.opacity = "0";
    setTimeout(() => {
        gameover.style.display = "none";
        overlay.style.display = "none";
    }, 300);
}

async function addCountry() {
    var countryID = document.querySelector("#user-input");
    const pastGuesses = document.getElementById('past-guesses-list');
    const guessButton = document.getElementById('guess-button');
    const answer = document.getElementById('answer');

    const displayData = await d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson");

    var inPath = checkItemInPath(path, countryID.value);
    var displayed = false;
    if(inPath) displayed = displayCountry(displayData.features, countryID.value, "#e8cfae", false);
    else displayed = displayCountry(displayData.features, countryID.value, "#a9a59d", false);

    const checkWin = (displayedCountry) => Array.isArray(displayedCountry) ? displayedCountry.some(checkWin): displayedNames.includes(displayedCountry);

    if(displayed) {
        if(pastGuesses.innerHTML == '') pastGuesses.innerHTML = countryID.value;
        else pastGuesses.innerHTML = pastGuesses.innerHTML + countryID.value;

        if(inPath) pastGuesses.innerHTML = pastGuesses.innerHTML + " 🟩" + "<br>";
        else pastGuesses.innerHTML = pastGuesses.innerHTML + " 🟥" + "<br>";
    } else {
        document.getElementById('user-input').value = '';
        return;
    }

    guesses++;
    guessButton.innerHTML = "Guess (" + guesses + "/" + maxGuesses + ")";

    if(path.every(checkWin)) {
        document.getElementById('gameover-title').innerHTML = "Congratulations!";
        document.getElementById('gameover-body').innerHTML = "You won! 🎉";
        answer.innerHTML = "";
        dispGameover();

        confetti({
            spread: 360,
            particleCount: 100,
            origin: { x: 0.5, y: 0.5 },
            colors: ['#ff0000', '#00ff00', '#0000ff', '#ff0', '#ff00ff'],
        });

        guessButton.disabled = true;
        guessButton.backgroundColor = '#cccccc';
    } else if(guesses >= maxGuesses) {
        document.getElementById('gameover-title').innerHTML = "Game Over!";
        document.getElementById('gameover-body').innerHTML = "You lost :(";
        answer.innerHTML = "Shortest Path:";
        path.splice(0, 1);
        path.splice(path.length - 1, 1);
        displayPath(path, answer, displayData.features, 0, false);
        dispGameover();
        guessButton.disabled = true;
        guessButton.backgroundColor = '#cccccc';
    }
}

// Check path recursively to account for alternative paths
function checkItemInPath(pathItem, inputCountry) {
    for(let country of pathItem) {
        if(Array.isArray(country)) {
            if(checkItemInPath(country, inputCountry)) {
                return true;
            }
        } else if(country == inputCountry){
            return true;
        }
    }
    return false;
}

function displayPath(pathItem, answer, data, count, recall) {
    for(let country of pathItem) {
        if(Array.isArray(country)) {
            displayPath(country, answer, data, 0, true);
        } else {
            if(count >= 1 && recall) break;
            answer.innerHTML = answer.innerHTML + "<br> > " + country;
            displayCountry(data, country, "#e8cfae", true);
            count++;
        }
    }
}

function pickRandom(countries) {
    var sourceIndex = Math.floor(Math.random()*177);
    var targetIndex = Math.floor(Math.random()*177);
    while(sourceIndex === targetIndex) targetIndex = Math.floor(Math.random()*177);
    const sourceCountry = countries[sourceIndex].id;
    const targetCountry = countries[targetIndex].id;
    return [sourceCountry, targetCountry];
}

// Add given country to the svg by filtering for selected country
function displayCountry(data, countryName, color, gameEnd) {
    var newCountry = data.find(country => country.properties.name === countryName);
    const error = document.getElementById('input-error');

    if(!gameEnd) {
        if(newCountry === undefined) {
            //alert("Unknown country name: " + countryName);
            error.innerHTML = "Unknown country name: " + countryName;
            error.style.display = "block";

            setTimeout(() => {
                error.style.display = "none";
            }, 2000);
            return false;
        }

        if(displayedNames.includes(countryName)) {
            //alert("Country already guessed: " + countryName);
            error.innerHTML = "Country already guessed: " + countryName;

            error.style.display = "block";

            setTimeout(() => {
                error.style.display = "none";
            }, 2000);
            return false;
        }
    }

    addCountryToSVG(newCountry, color); // Display country if already in viewBox

    // Convert coordinates to corresponding values on the SVG
    const svgCoordinates = [];
    const coordinates = newCountry.geometry.coordinates;
    coordinates.forEach((coords) => {
        coords.forEach((coords2) => {
            if(typeof coords2[0] != "number") {
                coords2.forEach((coords3) => {
                    svgCoordinates.push(projection(coords3));
                })
            } else {
                svgCoordinates.push(projection(coords2));
            } 
        });
    });
    displayedCoords.push(svgCoordinates);
    displayedNames.push(countryName);

    // manualZoom prevents country from displaying correctly if country is outside of viewBox
    // Will attempt to display country in original position on SVG without considering adjusted viewBox
    // if(!manualZoom && displayedNames.length > 1) adjustDisplay(calculateBounds(displayedCoords), 30);
    if(displayedNames.length > 1) adjustDisplay(calculateBounds(displayedCoords), 30);

    // Re-display country after zoom if it was outside of viewBox
    setTimeout(function() { 
        addCountryToSVG(newCountry, color);
    }, duration * .58);

    return true;
}

// Add country's coordinates to the path
function addCountryToSVG(country, color) {
    svg.append("g")
        .selectAll("path")
        .data([country])
        .join("path")
        .attr("fill", color)
        .attr("d", d3.geoPath()
            .projection(projection))
        .attr("stroke", "black")
        .attr("stroke-width", "0.3")
}

// Translate and zoom to center on currently displayed countries
function adjustDisplay(bounds, paddingPercentage) {
    // Find midpoint of map area defined
    const zoomMidX = (bounds[0][0] + bounds[1][0]) / 2;
    const zoomMidY = (bounds[0][1] + bounds[1][1]) / 2;

    // Find size of current map area
    const minXY = bounds[0];
    const maxXY = bounds[1];
    var zoomWidth = Math.abs(minXY[0] - maxXY[0]);
    var zoomHeight = Math.abs(minXY[1] - maxXY[1]);
    
    // Increase map area to include padding
    zoomWidth = zoomWidth * (1 + paddingPercentage / 100);
    zoomHeight = zoomHeight * (1 + paddingPercentage / 100);

    // Find scale required for area to fill svg
    const maxXscale = width / zoomWidth;
    const maxYscale = height / zoomHeight;
    var zoomScale = Math.min(maxXscale, maxYscale);

    // Find screen pixel equivalent once scaled
    const offsetX = zoomScale * zoomMidX;
    const offsetY = zoomScale * zoomMidY;

    // Find the amount to translate to re-center
    var translateHorizontal = width / 2 - offsetX;
    var translateVertical = height / 2 - offsetY;
    
    svg.transition()
        .duration(duration)
        .call(
            zoom.transform, 
            d3.zoomIdentity.translate(translateHorizontal, translateVertical).scale(zoomScale)
        );

    // manualZoom = false; // Set manualZoom to false if user clicks 'Reset Zoom' button
  }

// Calculate the max and min currently displayed coordinates
function calculateBounds(displayedCoords) {
    let minX = Number.MAX_VALUE,
        minY = Number.MAX_VALUE,
        maxX = Number.MIN_VALUE,
        maxY = Number.MIN_VALUE;

    displayedCoords.forEach((coords) => {
        coords.forEach((coords2) => {
            if(coords2[0] < minX) minX = coords2[0];
            if(coords2[1] < minY) minY = coords2[1];
            if(coords2[0] > maxX) maxX = coords2[0];
            if(coords2[1] > maxY) maxY = coords2[1];
        });
    });

    return [[minX, minY], [maxX, maxY]];
}

// Use Dijkstra's algorithm to find shortest path from source to target
// Each country is represented by a node
// Neighboring countries have a distance of 1
function findShortestPath(countries, source, target) {
    var dist = {};
    var prev = {};
    var vertices = [];
    for(var i = 0; i < countries.length; i++) {
        var vertex = countries[i];
        dist[vertex.id] = Infinity;
        prev[vertex.id] = null;
        vertices.push(vertex);
    }
    dist[source] = 0;

    // Find the vertex having smallest distance from source country
    while(vertices.length > 0) {
        var u = vertices.reduce(function(p, current) {return !p || dist[current.id] < dist[p.id] ? current : p;}, null);
        if(u.id == target) break;
        const index = vertices.indexOf(u);
        vertices.splice(index, 1);
        if(u.neighbors && Array.isArray(u.neighbors)) {
            for(let i = 0; i < u.neighbors.length; i++) {
                var v = u.neighbors[i];
                const alt = dist[u.id] + 1;
                if(alt < dist[v]) {
                    dist[v] = alt;
                    prev[v] = u;
                }
            }
        }
    }

    var result = [];
    while(target) {
        result.splice(0, 0, target);
        target = prev[target] ? prev[target].id : null;
    }

    // Any empty array return means there is no path. For example one of the countries is an island.
    if(result.length === 1) {
        return [];
    }

    return result;
}

// Look for alternative paths with the same length as the shortest path
// A country that borders the i + 1 and i - 1 indices on the path is can be a substitute for i
function findAlternatePaths(countries) {
    var newPath = path;
    for(let i = 1; i < path.length - 1; i++) {
        var neighbors = countries.find(country => country.id === path[i]).neighbors;
        for(let j = 0; j < neighbors.length; j++) {
            var neighborsOfNeighbor = countries.find(country => country.id === neighbors[j]).neighbors;
            if(neighborsOfNeighbor.includes(path[i - 1]) && neighborsOfNeighbor.includes(path[i + 1])) {
                newPath[i] = [path[i], neighbors[j]];
            }
        }
    }
    return newPath;
}

// Clear current display and select two new countries to play again
async function restart() {
    const guessButton = document.getElementById('guess-button');
    const restartButton = document.getElementById('restart-button');
    restartButton.disabled = true;

    // Remove currently displayed countries from the path and add back parallels and meridians
    svg.selectAll("path").remove();
    displayedNames = [];
    displayedCoords = [];
    path = [];
    displayMapLines();
    document.getElementById('past-guesses-list').innerHTML = "";

    // Pick new source and target countries
    var response = await fetch('./neighbors.json');
    const data = (await response.json()).countries;
    var endpoints = pickRandom(data);
    //console.log(endpoints);
    
    path = findShortestPath(data, endpoints[0], endpoints[1]);
    path = findAlternatePaths(data);
    while(path.length <= 3) {
        endpoints = pickRandom(data);
        //console.log(endpoints);
        path = findShortestPath(data, endpoints[0], endpoints[1]);
    }
    //console.log(path);

    guesses = 0;
    maxGuesses = Math.floor((path.length - 2) * 1.5 + 2);
    const displayData = await d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson");
    displayCountry(displayData.features, endpoints[0], "#f5bac8", false);
    displayCountry(displayData.features, endpoints[1], "#95cade", false);
    document.getElementById('title').innerHTML = `Today, I want to go from <span class="start-country">${endpoints[0]}</span> to <span class="end-country">${endpoints[1]}</span>.`;
    guessButton.innerHTML = "Guess (0/" + maxGuesses + ")";
    guessButton.disabled = false;
    document.getElementById('user-input').value = '';

    setTimeout(() => {
        restartButton.disabled = false;
    }, 500);
}

// Autocomplete function for user input
// inp is the id of a text field element
// arr is an array of all of the countries
function autocomplete(inp, arr) {
    var currentFocus;
    inp.addEventListener("input", function(e) {
        var div1, div2, val = this.value;
        closeAllLists();
        if(!val) { return false;}
        currentFocus = -1;
        div1 = document.createElement("DIV");
        div1.setAttribute("id", this.id + "autocomplete-list");
        div1.setAttribute("class", "autocomplete-items");
        this.parentNode.appendChild(div1);

        for(let i = 0; i < arr.length; i++) {
            let matchIndex = arr[i].toUpperCase().indexOf(val.toUpperCase());
            if(matchIndex > -1) {
                div2 = document.createElement("DIV");

                div2.innerHTML = arr[i].substring(0, matchIndex);
                div2.innerHTML += "<strong>" + arr[i].substring(matchIndex, matchIndex + val.length) + "</strong>";
                div2.innerHTML += arr[i].substring(matchIndex + val.length);

                div2.innerHTML += "<input type='hidden' value='" + arr[i] + "'>";
                div2.addEventListener("click", function(e) {
                    inp.value = this.getElementsByTagName("input")[0].value;
                    closeAllLists();
                });
                div1.appendChild(div2);
            }
        }
    });

    inp.addEventListener("keydown", function(e) {
        var x = document.getElementById(this.id + "autocomplete-list");
        if(x) x = x.getElementsByTagName("div");
        if(e.keyCode == 40) {
            currentFocus++;
            addActive(x);
        } else if(e.keyCode == 38) {
            currentFocus--;
            addActive(x);
        } else if(e.keyCode == 13) {
            e.preventDefault();
            if(currentFocus > -1) {
                if(x) x[currentFocus].click();
            }
        }
    });

    function addActive(x) {
        if(!x) return false;
        removeActive(x);
        if(currentFocus >= x.length) currentFocus = 0;
        if(currentFocus < 0) currentFocus = (x.length - 1);
        x[currentFocus].classList.add("autocomplete-active");
    }

    function removeActive(x) {
        for(var i = 0; i < x.length; i++) {
            x[i].classList.remove("autocomplete-active");
        }
    }

    function closeAllLists(elmnt) {
        var x = document.getElementsByClassName("autocomplete-items");
        for(var i = 0; i < x.length; i++) {
            if(elmnt != x[i] && elmnt != inp) {
                x[i].parentNode.removeChild(x[i]);
            }
        }
    }

    document.addEventListener("click", function (e) {
        closeAllLists(e.target);
    });
}

autocomplete(document.getElementById("user-input"), countries);