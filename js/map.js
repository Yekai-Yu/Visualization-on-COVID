const us = d3.json('https://unpkg.com/us-atlas@1/us/10m.json');
const covid = d3.csv('../data/time_series_covid19_confirmed_US.csv');

const width = 1000;
const height = 700;
const svg = d3.select("svg")
              .attr("width", width)
              .attr("height", height);
const defaultScale = d3.geoAlbersUsa().scale();
const projection = d3.geoAlbersUsa().translate([480, 300]).scale(1280);
const path = d3.geoPath();
const startDate = new Date("1/22/2020");
const endDate = new Date("7/22/2020");

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

Promise.all([us])
  .then(function (values) {
    var map = values[0];
    var stateFeatures = topojson.feature(map, map.objects.states).features;

    svg.selectAll("states")
        .data(stateFeatures)
        .enter()
        .insert("path", ".graticule")
          .attr("class", "states")
          .attr("d", path)
        .on('mouseover', function(d, i) {
          var currentState = this;
          d3.select(this)
              .style('fill-opacity', 1);
        })
        .on('mouseout', function(d, i) {
            var currentState = this;
            d3.select(this)
                .style('fill-opacity', .7);
        });
  });

Promise.all([covid])
  .then(function (values) {
    var covidData = values[0];

    const delayFn = d3.scaleTime()
          .domain([new Date(startDate), new Date(endDate)])
          .range([0, 5000]);

    for (const oneDate of allDate) {
      // console.log(oneDate);
      // var oneDate = "3/22/2020";
      var todayCases = covidData.filter(data => data[oneDate] != 0);
      // console.log(todayCases);
      // console.log(delayFn(new Date(oneDate)));
      svg.selectAll("circle")
          .data(todayCases.filter(coordinate => projection([coordinate.Lon, coordinate.Lat]) !== null))
          .enter()
          .append("circle")
            .attr("r", 2)
            .attr("cx", function(d) {return projection([d.Lon, d.Lat])[0];})
            .attr("cy", function(d) {return projection([d.Lon, d.Lat])[1];})
            .style("fill-opacity", 0)
            .style("stoke-opacity", 0)
            .transition().delay(delayFn(new Date(oneDate)))
            .style("fill-opacity", 1)
            .style("stoke-opacity", 1);
      // svg.selectAll("circle").remove();
    }
    //
    console.log("Done");
    svg.append("g").selectAll("circle")
        .data(covidData.filter(coordinate => projection([coordinate.Lon, coordinate.Lat]) !== null))
        .enter()
        .append("circle")
          .attr("r", function(d) {return d['7/22/2020'] / 2000;})
          .attr("cx", function(d) {return projection([d.Lon, d.Lat])[0];})
          .attr("cy", function(d) {return projection([d.Lon, d.Lat])[1];})
          .style("fill-opacity", 0)
          .style("stoke-opacity", 0)
          .transition().duration(1000).delay(delayFn(new Date("7/22/2020")))
          .style("fill-opacity", 0.3)
          .style("stoke-opacity", 1);

  });
