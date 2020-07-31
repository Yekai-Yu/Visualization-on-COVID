const us = d3.json('https://unpkg.com/us-atlas@1/us/10m.json');
const covid = d3.csv('../data/time_series_covid19_confirmed_US.csv');
const stateCodeMapping = d3.json('../data/stateMapping.json');
const dailyTotal = d3.json('../data/dailyTotal.json');

const width = 1000;
const height = 600;
const svg = d3.select("#map")
              .attr("width", width)
              .attr("height", height);

const defaultScale = d3.geoAlbersUsa().scale();
const projection = d3.geoAlbersUsa().translate([480, 300]).scale(1280);
const path = d3.geoPath();
var stateCodeToName = {};
var mapping = {};

var globleData = [];

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

var tooltip = d3.select("body")
                	.append("div")
                  .attr("class", "tooltip")
                  .style("opacity", 0);

var logScale = d3.scaleLog().domain([0.1,20695922]).range([1,13]);

Promise.all([us, covid, stateCodeMapping, dailyTotal])
  .then(function (values) {
    var map = values[0];
    var covidData = values[1];
    // console.log(covidData);
    globleData = covidData;
    var stateFeatures = topojson.feature(map, map.objects.states).features;
    mapping = values[2];
    // console.log(values[3]);
    dailyDataCollection = values[3];
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
        })
        .on('click', function(d, i) {
          var sliderInput = document.getElementById("currSelectedDate");
          var dateSelection = allDate[sliderInput.value];
          drawOneStateChart(mapping[d.id], dateSelection);
        });
    // circle
    svg.append("g").attr("pointer-events", "none").selectAll("circle")
        .data(covidData.filter(coordinate => projection([coordinate.Lon, coordinate.Lat]) !== null))
        .enter()
        .append("circle")
          .attr("fill", "red")
          .attr("r", function(d) {return !isNaN(logScale(Number(d['Total']))) ? logScale(Number(d['Total'])) : 0;})
          .attr("cx", function(d) {return projection([d.Lon, d.Lat])[0];})
          .attr("cy", function(d) {return projection([d.Lon, d.Lat])[1];})
          .style("fill-opacity", 0)
          .style("stoke-opacity", 0)
          .transition().duration(3000)
          .style("fill-opacity", 0.13)
          .style("stoke-opacity", 0.9);

    drawStateChart(dailyDataCollection);
  });

// slider
d3.select("#mapBlock")
    .append("div").append("input")
      .attr("type", "range")
      .attr("min", 0)
      .attr("max", allDate.length - 1)
      .attr("value", allDate.length - 1)
      .attr("step", "1")
      .attr("id", "currSelectedDate")
      .on("input", function input() {
        drawCircles();
      });

var colorTimeScale = d3.scaleTime().domain([startDate, endDate]).range([1,0.2]);

function drawCircles() {
  svg.selectAll("circle").remove();
  var sliderInput = document.getElementById("currSelectedDate");
  var output = document.getElementById("currDate");
  var currDate = allDate[sliderInput.value];
  output.innerHTML = currDate;
  sliderInput.oninput = function() {
    output.innerHTML = currDate;
  }
  var join = svg.append("g").attr("pointer-events", "none").selectAll("circle")
      .data(globleData.filter(coordinate => projection([coordinate.Lon, coordinate.Lat]) !== null));
  var enter = join.enter();

  enter.append("circle")
    .attr("fill", "red")
    .attr("r", function(d) {return !isNaN(logScale(Number(d[currDate]))) ? logScale(Number(d[currDate])) : 0;})
    .attr("cx", function(d) {return projection([d.Lon, d.Lat])[0];})
    .attr("cy", function(d) {return projection([d.Lon, d.Lat])[1];})
    .style("fill-opacity", function(d) {return colorTimeScale(new Date(currDate));})
    .style("stoke-opacity", 0.9);

};


/*
  plot each county of a selected state on a given date
*/
function drawOneStateChart(stateName, date) {
  console.log(stateName);
  console.log(date);
  var svg = d3.select("#oneStateChart")
                .attr("width", width)
                .attr("height", height);

}

function drawStateChart(dailyData) {
  /*
  * line chart
  */
  // chart to show state overview
  var margin = ({top: 20, right: 30, bottom: 30, left: 40});

  var stateChartSVG = d3.select("#stateChart")
                          .attr("width", width)
                          .attr("height", height);
  var line = d3.line()
                .x(function(d) { /*console.log(d);*/ return xScale(new Date(d.date)); })
                .y(function(d) { return yScale(d.cases); });
  var xScale = d3.scaleTime()
                  .domain([startDate, endDate])
                  .range([margin.left, width - margin.right]);
  // var xScale = d3.scaleOrdinal()
  //                 .domain(allDate)
  //                 .range([margin.left, width - margin.right]);
  var yScale = d3.scaleLog()
                  .domain([1, dailyData[dailyData.length - 1].cases]).nice()
                  .range([height - margin.bottom, margin.top]);
  var xAxis = stateChartSVG.append("g")
                            .attr("class", "stateX")
                            .attr("transform", `translate(0,${height - margin.bottom})`)
                            .call(d3.axisBottom(xScale));
  // var xAxis = d3.axisBottom(xScale);
  var yAxis = stateChartSVG.append("g")
                            .attr("class", "stateY")
                            .attr("transform", `translate(${margin.left},0)`)
                            .call(d3.axisLeft(yScale).ticks(10, "~s"));
  // var yAxis = d3.axisLeft(yScale).ticks(10, "~s");

  function transition(path) {
          path.transition()
              .duration(3000)
              .attrTween("stroke-dasharray", tweenDash);
  };

  function tweenDash() {
    var l = this.getTotalLength(),
        i = d3.interpolateString("0," + l, l + "," + l);
    return function (t) {
      return i(t);
    };
  };

  stateChartSVG.append("path")
                .datum(dailyData)
                .attr("class", "stateLine")
                .attr("fill", "none")
                .attr("stroke", "steelblue")
                .attr("stroke-width", 1.5)
                .attr("d", line)
                .call(transition);

// zoom
  stateChartSVG.call(zoom);

  function zoom(svg) {
    var extent = [
			[margin.left, margin.top],
			[width - margin.right, height - margin.top]
		];

		var zooming = d3.zoom()
			.scaleExtent([1, 3])
			.translateExtent(extent)
			.extent(extent)
			.on("zoom", zoomed);

		svg.call(zooming);

		function zoomed() {

			xScale.range([margin.left, width - margin.right]
				.map(d => d3.event.transform.applyX(d)));

			svg.select(".stateLine")
				.attr("d", line);

			svg.select(".stateX")
				.call(d3.axisBottom(xScale)
					.tickSizeOuter(0));
		}
	}

// brush to zoom-in
  // var brush = d3.brushX()
  //                 .extent([[0, 0], [width - margin.right, height - margin.bottom]])
  //                 .on("end", updateChart);
  // stateChartSVG.append("g")
  //               .attr("class", "brush")
  //               .call(brush);

  var idleTimeout;
  function idled() {
    idleTimeout = null;
  };

  function updateChart() {
    extent = d3.event.selection;
    var xSelectLeft;
    var xSelectRight;
    // console.log(extent);
    // console.log(extent ? xScale.invert(extent[0]) : NaN);
    // console.log(extent ? xScale.invert(extent[1]) : NaN);
    if(!extent) {
      if(!idleTimeout) {
        return idleTimeout = setTimeout(idled, 350);
      }
        //
    } else {
      xSelectLeft = xScale.invert(extent[0]);
      xSelectRight = xScale.invert(extent[1]);
      // console.log(xSelectLeft);
      // console.log(xSelectRight);
      xScale.domain([xScale.invert(extent[0]), xScale.invert(extent[1])]);
      stateChartSVG.select(".brush")
                    .call(brush.move, null);
    }

    xAxis.transition().duration(1000)
          .call(d3.axisBottom(xScale));

    stateChartSVG.select(".stateLine")
                  .transition()
                  .duration(1000)
                  .attr("d", line);
  }

  stateChartSVG.on("dblclick", function() {
    xScale.domain([startDate, endDate]);
    xAxis.transition().call(d3.axisBottom(xScale));
    stateChartSVG.select(".stateLine")
                  .transition()
                  .attr("d", line);
  });
}
