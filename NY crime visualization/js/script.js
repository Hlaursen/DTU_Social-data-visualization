// Create SVG and padding variables
var h = document.getElementsByClassName("plot")[0].clientHeight;
var w = document.getElementsByClassName("plot")[0].clientWidth;
var paddingRight = 0.3*w;
var paddingPercentage = 0.05;
var paddingBottom = paddingPercentage*h;
var paddingLeft = paddingPercentage*w;
var paddingTop = paddingPercentage*h;

// Plot variable definition
let piePlot = d3.select("#piePlot");
//let title = plot.append("h4").text("Hello");

var pieSvg = piePlot.append("svg")
    .attr("height", h)
    .attr("width", w);

// FUNCTION DEFINITIONS
//var formatSeconds = d3.timeParse("%H:%M:%S");
// rowConverter function

var rowConverterPie = function(d) {
  return {
      borough: d.Borough,
      crimeCount: +d.CrimeCount
    };
  }

var rowConverterStack = function(d) {
  return {
      borough: d.Borough,
      crimeCount: +d.CrimeCount
    };
  }
//
// let handleMouseOver = (dot, d) => {
// 	// Use mouse coordinates for tooltip position
// 	let xPos = d3.event.clientX + 10
// 	let yPos = d3.event.clientY - 40
//
// 	// Update the tooltip position
//   d3.select("#tooltip")
// 		.style("left", xPos + "px")
//     .style("top", yPos + "px")
//
// 	// Update the tooltip information
// 	d3.select("#winner_p").text(d.winner);
//   d3.select("#country_p").text(d.country);
//   d3.select("#time_p").text(d.time);
//
// 	// Show the tooltip
// 	d3.select("#tooltip").classed("hidden", false)
//
//   // Highlight the current dot
// 	d3.select(dot).attr("fill", "steelblue")
// }
//
// let handleMouseOut = dot => {
// 	//Hide the tooltip again
// 	d3.select("#tooltip").classed("hidden", true)
//
// 	// Remove highlight from the current dot
// 	d3.select(dot)
// 		.transition()
// 		.duration(250)
//     .attr("fill", "none");
// }
//
//
var pieDataset;
// Load data for both men (0) and women (1)
d3.csv("../data/pie.csv", rowConverterPie, function(data) {

  pieDataset = data;
  let pieSum = 0;
  pieDataset.forEach(function(entry) {
    pieSum += entry.crimeCount;
  });

  //Print data to console as table, for verification
  console.table(pieDataset, ["borough", "crimeCount"]);

  //Setup for pieChart
  var color = d3.scaleOrdinal(d3.schemeCategory10);
  var outerRadius = h / 2;
  var innerRadius = h / 4;
  var arc = d3.arc()
      .innerRadius(innerRadius)
      .outerRadius(outerRadius);

  var pie = d3.pie()
      .value(function(d) { return d.crimeCount; });

  //Set up groups
	var arcs = pieSvg.selectAll("g.arc")
				  .data(pie(pieDataset))
				  .enter()
				  .append("g")
				  .attr("class", "arc")
				  .attr("transform", "translate(" + outerRadius + "," + outerRadius + ")");

  //Draw arc paths
	arcs.append("path")
	    .attr("fill", function(d, i) {
	    	return color(i);
	    })
	    .attr("d", arc);

	//Labels
	arcs.append("text")
	    .attr("transform", function(d) {
	    	return "translate(" + arc.centroid(d) + ")";
	    })
	    .attr("text-anchor", "middle")
      .attr("fill", "white")
	    .text(function(d) {
        console.log(d.data.borough);
        return Math.floor(d.value/pieSum*100)+"%";
	    });

  //Legend
  pieSvg.selectAll("rect")
    .data(pieDataset)
    .enter()
    .append('rect')
    .attr("x", (w-100))
    .attr("y", function(d,i) {return 100+i*20; })
    .attr("width", 10)
    .attr("height", 10)
    .style("fill", function (d, i) {
    return color(i) });
    // This part still doesn't work
  pieSvg.selectAll("text")
    .data(pieDataset)
    .enter()
    .append('text')
    .attr("x", (w-100))
    .attr("y", function(d,i) {return 100+i*20; })
    .text(function (d) {
      console.log("Hello");
      return d.borough; });

  // legend = pieSvg.append("g")
  //     .attr("class","legend")
  //     .attr("transform","translate(50,30)")
  //     .style("font-size","12px")
  //     .call(d3.legend);

}); //End of d3.csv for pieData

var stackDataset;




//   // Create  scales
//   var xMin = d3.min(dataset, function(d) {return d.year;});
//   var xMax = d3.max(dataset, function(d) {return d.year;});
//   var maxY = d3.max(dataset, function(d) {return d.time;} );
//
//   var xScale = d3.scaleLinear()
// 			.domain([xMin, xMax])
// 			.range([0, w-paddingRight-paddingLeft]);
//
//   var yScale = d3.scaleLinear()
//       .domain([6000, maxY])
//       .range([h-paddingBottom-paddingTop,0]);
//
//   // Plot mens data
//   svg1.selectAll(".pointM")
//       .data(mensDataset)
//       .enter().append("path")
//       .attr("class", "pointM")
//       .attr("d", d3.symbol().type(d3.symbolCircle))
//       .attr("fill", "none")
//       .attr("stroke", "black")
//       .attr("transform", function(d) { return "translate(" + (xScale(d.year)+paddingLeft) + "," + (yScale(d.time)+paddingBottom ) + ")"; })
//       .on("mouseover", function(d) {
//         handleMouseOver(this, d)
//       })
//       .on("mouseout", function() {
//         handleMouseOut(this)
//       });
//
//   // Plot womens data
//   svg1.selectAll(".pointW")
//       .data(womensDataset)
//       .enter().append("path")
//       .attr("class", "pointW")
//       .attr("d", d3.symbol().type(d3.symbolTriangle))
//       .attr("fill", "none")
//       .attr("stroke", "black")
//       .attr("transform", function(d) { return "translate(" + (xScale(d.year)+paddingLeft) + "," + (yScale(d.time)+paddingBottom ) + ")"; })
//       .on("mouseover", function(d) {
//         handleMouseOver(this, d)
//       })
//       .on("mouseout", function() {
//         handleMouseOut(this)
//       });
//
//   // Create axes
//   var xAxis = d3.axisBottom();
//   xAxis.scale(xScale);
//
//   svg1.append("g")
//       .attr("transform", "translate(" + paddingLeft+ "," + (h-paddingBottom) + ")")
//       .attr("class", "axis")
//       .call(xAxis);
//
//   var yAxis = d3.axisLeft();
//   yAxis.scale(yScale);
//   svg1.append("g")
//       .attr("transform", "translate(" + paddingLeft + "," + paddingTop+ ")")
//       .attr("class", "axis")
//       .call(yAxis);
//
// }); //End of allData d3.csv
