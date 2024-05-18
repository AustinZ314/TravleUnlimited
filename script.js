var countries = ["Afghanistan","Albania","Algeria","Andorra","Angola","Anguilla","Antigua &amp; Barbuda","Argentina","Armenia","Aruba","Australia","Austria","Azerbaijan","Bahamas","Bahrain","Bangladesh","Barbados","Belarus","Belgium","Belize","Benin","Bermuda","Bhutan","Bolivia","Bosnia &amp; Herzegovina","Botswana","Brazil","British Virgin Islands","Brunei","Bulgaria","Burkina Faso","Burundi","Cambodia","Cameroon","Canada","Cape Verde","Cayman Islands","Central Arfrican Republic","Chad","Chile","China","Colombia","Congo","Cook Islands","Costa Rica","Cote D Ivoire","Croatia","Cuba","Curacao","Cyprus","Czech Republic","Denmark","Djibouti","Dominica","Dominican Republic","Ecuador","Egypt","El Salvador","Equatorial Guinea","Eritrea","Estonia","Ethiopia","Falkland Islands","Faroe Islands","Fiji","Finland","France","French Polynesia","French West Indies","Gabon","Gambia","Georgia","Germany","Ghana","Gibraltar","Greece","Greenland","Grenada","Guam","Guatemala","Guernsey","Guinea","Guinea Bissau","Guyana","Haiti","Honduras","Hong Kong","Hungary","Iceland","India","Indonesia","Iran","Iraq","Ireland","Isle of Man","Israel","Italy","Jamaica","Japan","Jersey","Jordan","Kazakhstan","Kenya","Kiribati","Kosovo","Kuwait","Kyrgyzstan","Laos","Latvia","Lebanon","Lesotho","Liberia","Libya","Liechtenstein","Lithuania","Luxembourg","Macau","Macedonia","Madagascar","Malawi","Malaysia","Maldives","Mali","Malta","Marshall Islands","Mauritania","Mauritius","Mexico","Micronesia","Moldova","Monaco","Mongolia","Montenegro","Montserrat","Morocco","Mozambique","Myanmar","Namibia","Nauro","Nepal","Netherlands","Netherlands Antilles","New Caledonia","New Zealand","Nicaragua","Niger","Nigeria","North Korea","Norway","Oman","Pakistan","Palau","Palestine","Panama","Papua New Guinea","Paraguay","Peru","Philippines","Poland","Portugal","Puerto Rico","Qatar","Reunion","Romania","Russia","Rwanda","Saint Pierre &amp; Miquelon","Samoa","San Marino","Sao Tome and Principe","Saudi Arabia","Senegal","Serbia","Seychelles","Sierra Leone","Singapore","Slovakia","Slovenia","Solomon Islands","Somalia","South Africa","South Korea","South Sudan","Spain","Sri Lanka","St Kitts &amp; Nevis","St Lucia","St Vincent","Sudan","Suriname","Swaziland","Sweden","Switzerland","Syria","Taiwan","Tajikistan","Tanzania","Thailand","Timor L'Este","Togo","Tonga","Trinidad &amp; Tobago","Tunisia","Turkey","Turkmenistan","Turks &amp; Caicos","Tuvalu","Uganda","Ukraine","United Arab Emirates","United Kingdom","United States of America","Uruguay","Uzbekistan","Vanuatu","Vatican City","Venezuela","Vietnam","Virgin Islands (US)","Yemen","Zambia","Zimbabwe"];

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
var displayedNames = []; // List of currently displayed countries' names
var displayedCoords = [] // List of currently displayed countries' coordinates
var path = []; // Shortest path between source and target countries
// var manualZoom = false; // If user manually zooms, then do not re-center when displaying new countries
var duration = 750; // Set zoom and function timeout duration

// Select and display source and target countries on load
document.addEventListener('DOMContentLoaded', async function() {
    displayMapLines();
    var response = await fetch('./neighbors.json');
    const data = (await response.json()).countries;
    var endpoints = pickRandom(data);
    console.log(endpoints);
    
    path = findShortestPath(data, endpoints[0], endpoints[1]);
    path = findAlternatePaths(data);

    // Find new countries for source and target if too close (less than 2 countries in between)
    while(path.length <= 3) {
        endpoints = pickRandom(data);
        console.log(endpoints);
        path = findShortestPath(data, endpoints[0], endpoints[1]);
        path = findAlternatePaths(data);
    }
    console.log(path);

    const displayData = await d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson");
    displayCountry(displayData.features, endpoints[0], "#f5bac8");
    displayCountry(displayData.features, endpoints[1], "#95cade");
    document.getElementById('title').innerHTML = "Today I'd like to go from " + endpoints[0] + " to " + endpoints[1];
})

async function addCountry() {
    var countryID = document.querySelector("#user-input");

    const displayData = await d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson");
    var displayed = displayCountry(displayData.features, countryID.value, "#e8cfae");
    
    const checkWin = (displayedCountry) => Array.isArray(displayedCountry) ? displayedCountry.some(checkWin): displayedNames.includes(displayedCountry);

    if(path.every(checkWin)) {
        alert("You win!");
    }

    if(displayed) {
        if(document.getElementById('past-guesses-list').innerHTML == '') document.getElementById('past-guesses-list').innerHTML = countryID.value;
        else document.getElementById('past-guesses-list').innerHTML = document.getElementById('past-guesses-list').innerHTML + countryID.value;

        var found = false;
        path.forEach((country) => {
            if(country == countryID.value) {
                document.getElementById('past-guesses-list').innerHTML = document.getElementById('past-guesses-list').innerHTML + " 🟩" + "<br>";
                found = true;
            }
        });
        if(!found) document.getElementById('past-guesses-list').innerHTML = document.getElementById('past-guesses-list').innerHTML + " 🟥" + "<br>";
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
function displayCountry(data, countryName, color) {
    var newCountry = data.find(country => country.properties.name === countryName)
    if(newCountry === undefined) {
        alert("Unknown country name: " + countryName);
        return false;
    }

    if(displayedNames.includes(countryName)) {
        alert("Country already guessed: " + countryName);
        return false;
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
        .attr("stroke-width", "0.3"); 
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
    // Remove currently displayed countries from the path and add back parallels and meridians
    svg.selectAll("path").remove();
    displayedNames = [];
    displayedCoords = [];
    path = [];
    displayMapLines();

    // Pick new source and target countries
    var response = await fetch('./neighbors.json');
    const data = (await response.json()).countries;
    var endpoints = pickRandom(data);
    console.log(endpoints);
    
    path = findShortestPath(data, endpoints[0], endpoints[1]);
    path = findAlternatePaths(data);
    while(path.length <= 3) {
        endpoints = pickRandom(data);
        console.log(endpoints);
        path = findShortestPath(data, endpoints[0], endpoints[1]);
    }
    console.log(path);
    const displayData = await d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson");
    displayCountry(displayData.features, endpoints[0], "#f5bac8");
    displayCountry(displayData.features, endpoints[1], "#95cade");
    document.getElementById('title').innerHTML = "Today I'd like to go from " + endpoints[0] + " to " + endpoints[1];
}   

// Autocomplete function for user input
// inp is the id of a text field element
// arr is an array of all of the countries
function autocomplete(inp, arr) {
    var currentFocus;
    inp.addEventListener("input", function(e) {
        var div1, div2, val = this.value;
        closeAllLists();
        if (!val) { return false;}
        currentFocus = -1;
        div1 = document.createElement("DIV");
        div1.setAttribute("id", this.id + "autocomplete-list");
        div1.setAttribute("class", "autocomplete-items");
        this.parentNode.appendChild(div1);

        for (let i = 0; i < arr.length; i++) {
            if (arr[i].substr(0, val.length).toUpperCase() == val.toUpperCase()) {
                div2 = document.createElement("DIV");
                div2.innerHTML = "<strong>" + arr[i].substr(0, val.length) + "</strong>";
                div2.innerHTML += arr[i].substr(val.length);
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
        if (x) x = x.getElementsByTagName("div");
        if (e.keyCode == 40) {
            currentFocus++;
            addActive(x);
        } else if (e.keyCode == 38) {
            currentFocus--;
            addActive(x);
        } else if (e.keyCode == 13) {
            e.preventDefault();
            if (currentFocus > -1) {
                if (x) x[currentFocus].click();
            }
        }
    });

    function addActive(x) {
        if (!x) return false;
        removeActive(x);
        if (currentFocus >= x.length) currentFocus = 0;
        if (currentFocus < 0) currentFocus = (x.length - 1);
        x[currentFocus].classList.add("autocomplete-active");
    }

    function removeActive(x) {
        for (var i = 0; i < x.length; i++) {
            x[i].classList.remove("autocomplete-active");
        }
    }

    function closeAllLists(elmnt) {
        var x = document.getElementsByClassName("autocomplete-items");
        for (var i = 0; i < x.length; i++) {
            if (elmnt != x[i] && elmnt != inp) {
                x[i].parentNode.removeChild(x[i]);
            }
        }
    }

    document.addEventListener("click", function (e) {
        closeAllLists(e.target);
    });
}

autocomplete(document.getElementById("user-input"), countries);