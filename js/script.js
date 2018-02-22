// Create SVG and padding variables
var h = document.getElementById("plot").clientHeight;
var w = document.getElementById("plot").clientWidth;
var paddingRight = 0.3*w;
var paddingPercentage = 0.05;
var paddingBottom = paddingPercentage*h;
var paddingLeft = paddingPercentage*w;
var paddingTop = paddingPercentage*h;

var svg1 = d3.select("#plot").append("svg")
    .attr("height", h)
    .attr("width", w);

var formatSeconds = d3.timeParse("%H:%M:%S");
// rowConverter function
var rowConverter = function(d) {
  return {
      index: +d.Index,
      year: +d.Year,
      time: formatSeconds(d.Time).getSeconds() + formatSeconds(d.Time).getMinutes()*60 + formatSeconds(d.Time).getHours()*3600
    };
  }

// Load data for both men (0) and women (1)
var dataset;
var womensDataset;
var mensDataset;

d3.csv("../data/allData.csv", rowConverter, function(data) {
  dataset = data;
  //Print data to console as table, for verification
  //console.table(dataset, ["index", "year", "time"]);

  //Create separate datasets for men and women
  mensDataset = dataset.slice(0,120);
  womensDataset = dataset.slice(121,173);

  // Create  scales
  var xMin = d3.min(dataset, function(d) {return d.year;});
  var xMax = d3.max(dataset, function(d) {return d.year;});
  var maxY = d3.max(dataset, function(d) {return d.time;} );

  var xScale = d3.scaleLinear()
			.domain([xMin, xMax])
			.range([0, w-paddingRight-paddingLeft]);

  var yScale = d3.scaleLinear()
      .domain([6000, maxY])
      .range([h-paddingBottom-paddingTop,0]);

  // Plot symbols
  svg1.selectAll(".pointM")
      .data(dataset)
      .enter().append("path")
      .attr("class", "pointM")
      .attr("d", d3.symbol().type(d3.symbolCircle))
      .attr("fill", "none")
      .attr("stroke", "black")
      .attr("transform", function(d) { return "translate(" + (xScale(d.year)+paddingLeft) + "," + (yScale(d.time)+paddingBottom ) + ")"; });

  // Create axes
  var xAxis = d3.axisBottom();
  xAxis.scale(xScale);

  svg1.append("g")
      .attr("transform", "translate(" + paddingLeft+ "," + (h-paddingBottom) + ")")
      .attr("class", "axis")
      .call(xAxis);

  var yAxis = d3.axisLeft();
  yAxis.scale(yScale);
  svg1.append("g")
      .attr("transform", "translate(" + paddingLeft + "," + paddingTop+ ")")
      .attr("class", "axis")
      .call(yAxis);

}); //End of allData d3.csv
