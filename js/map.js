const us = d3.json('https://unpkg.com/us-atlas@1/us/10m.json');
const covid = d3.csv('../data/time_series_covid19_confirmed_US.csv');

const width = 1920;
const height = 1080;
const svg = d3.select("svg")
              .attr("width", width)
              .attr("height", height);
const defaultScale = d3.geoAlbersUsa().scale();
const projection = d3.geoAlbersUsa().translate([480, 300]).scale(1280);
const path = d3.geoPath();
const startDate = new Date("1/22/2020");
const endDate = new Date("7/22/2020");

const mapping = {
        "01" : "Alabama",
        "02" : "Alaska",
        "60" : "American Samoa",
        "03" : "American Samoa",
        "04" : "Arizona",
        "05" : "Arkansas",
        "81" : "Baker Island",
        "06" : "California",
        "07" : "Canal Zone",
        "08" : "Colorado",
        "09" : "Connecticut",
        "10" : "Delaware",
        "11" : "District of Columbia",
        "12" : "Florida",
        "64" : "Federated States of Micronesia",
        "13" : "Georgia",
        "14" : "Guam *",
        "66" : "Guam",
        "15" : "Hawaii",
        "84" : "Howland Island",
        "16" : "Idaho",
        "17" : "Illinois",
        "18" : "Indiana",
        "19" : "Iowa",
        "86" : "Jarvis Island",
        "67" : "Johnston Atoll",
        "20" : "Kansas",
        "21" : "Kentucky",
        "89" : "Kingman Reef",
        "22" : "Louisiana",
        "23" : "Maine",
        "68" : "Marshall Islands",
        "24" : "Maryland",
        "25" : "Massachusetts",
        "26" : "Michigan",
        "71" : "Midway Islands",
        "27" : "Minnesota",
        "28" : "Mississippi",
        "29" : "Missouri",
        "30" : "Montana",
        "76" : "Navassa Island",
        "31" : "Nebraska",
        "32" : "Nevada",
        "33" : "New Hampshire",
        "34" : "New Jersey",
        "35" : "New Mexico",
        "36" : "New York",
        "37" : "North Carolina",
        "38" : "North Dakota",
        "69" : "Northern Mariana Islands",
        "39" : "Ohio",
        "40" : "Oklahoma",
        "41" : "Oregon",
        "70" : "Palau",
        "95" : "Palmyra Atoll",
        "42" : "Pennsylvania",
        "43" : "Puerto Rico *",
        "72" : "Puerto Rico",
        "44" : "Rhode Island",
        "45" : "South Carolina",
        "46" : "South Dakota",
        "47" : "Tennessee",
        "48" : "Texas",
        "74" : "U.S. Minor Outlying Islands",
        "49" : "Utah",
        "50" : "Vermont",
        "51" : "Virginia",
        "52" : "Virgin Islands of the U.S. *",
        "78" : "Virgin Islands of the U.S.",
        "79" : "Wake Island",
        "53" : "Washington",
        "54" : "West Virginia",
        "55" : "Wisconsin",
        "56" : "Wyoming"
      }

function formatDate(date) {
  var tmp = new Date(date)
  return (tmp.getMonth() + 1) + "/" + tmp.getDate() + "/2020";
}

function getDates(startDate, stopDate) {
    var dateArray = [];
    var currentDate = startDate;
    var stopDate = stopDate;
    while (currentDate < stopDate) {
        dateArray.push(formatDate(currentDate + 1));
        currentDate.setDate(currentDate.getDate() + 1);
    }
    dateArray.push(formatDate(currentDate + 1));
    return dateArray;
}

const allDate = getDates(new Date("1/22/2020"), new Date("7/22/2020"));

var tooltip = d3.select("body")
                	.append("div")
                  .attr("class", "tooltip")
                  .style("opacity", 0);
                	// .style("position", "absolute")
                	// .style("z-index", "10")
                	// .style("visibility", "hidden")
                  // .style("font-size", "16pt")
                  // .style("border", "solid");

Promise.all([us, covid])
  .then(function (values) {
    var map = values[0];
    var covidData = values[1];
    console.log(covidData);
    var stateFeatures = topojson.feature(map, map.objects.states).features;
    var logScale = d3.scaleLog().domain([0.1,20695922]).range([1,13]);

    // map
    svg.append("g").selectAll("states")
        .data(stateFeatures)
        .enter()
        .insert("path", ".graticule")
          .attr("class", "states")
          .attr("d", path)
        .on('mouseover', function(d, i) {
          var currentState = this;
          d3.select(this)
              .style('fill-opacity', 1);
          tooltip.transition().duration(200)
                  .style("opacity", .9);
          tooltip.html(mapping[d.id]);
          tooltip.style("visibility", "visible");
        })
        .on('mousemove', function() {
          return tooltip.style("top", (event.pageY-10)+"px").style("left",(event.pageX+10)+"px");
        })
        .on('mouseout', function(d, i) {
            var currentState = this;
            d3.select(this)
                .style('fill-opacity', .7);
            tooltip.style("visibility", "hidden");
        });

    // circle
    svg.append("g").attr("pointer-events", "none").selectAll("circle")
        .data(covidData.filter(coordinate => projection([coordinate.Lon, coordinate.Lat]) !== null))
        .enter()
        .append("circle")
          .attr("fill", "red")
          .attr("r", function(d) {return logScale(Number(d['Total']));})
          .attr("cx", function(d) {return projection([d.Lon, d.Lat])[0];})
          .attr("cy", function(d) {return projection([d.Lon, d.Lat])[1];})
          .style("fill-opacity", 0)
          .style("stoke-opacity", 0)
          .transition().duration(3000)
          .style("fill-opacity", 0.13)
          .style("stoke-opacity", 0.9);

    svg.append("input")
				.attr("id", "currSelectedDate")
				.on("input", function input() {
					drawCircles();
				});
  });

function drawCircles() {
  var currDate = document.getElementById("currSelectedDate").value;
  var join = svg.append("g").attr("pointer-events", "none").selectAll("circle")
      .data(covidData.filter(coordinate => projection([coordinate.Lon, coordinate.Lat]) !== null))
  var enter = join.enter()
  var exit = join.exit()

      enter.append("circle")
        .attr("fill", "red")
        .attr("r", function(d) {return logScale(Number(d[currDate]));})
        .attr("cx", function(d) {return projection([d.Lon, d.Lat])[0];})
        .attr("cy", function(d) {return projection([d.Lon, d.Lat])[1];})
        .style("fill-opacity", 0)
        .style("stoke-opacity", 0)
        .transition().duration(1000)
        .style("fill-opacity", 0.13)
        .style("stoke-opacity", 0.9);

      exit.remove();
};
