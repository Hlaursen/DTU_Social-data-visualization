//GENERAL VARIABLE INITIALIZATION
let w = document.getElementsByClassName("plot")[0].clientWidth;
let h = w*0.75;
let paddingRight = 0.3*w;
let paddingPercentage = 0.05;
let paddingBottom = paddingPercentage*h;
let paddingLeft = paddingPercentage*w;
let paddingTop = paddingPercentage*h;

let rowConverterPie = function(d) {
  return {
      borough: d.Borough,
      crimeCount: +d.CrimeCount
    };
  }

let rowConverterStack = function(d) {
  return {
      borough: d.Borough,
      crimeCount: +d.CrimeCount
    };
  }

//CREATE PIE PLOT
d3.csv("../NY crime visualization/data/pie.csv", rowConverterPie, function(data) {
  //FUNCTIONS
  let handleMouseOver = (slice, d) => {
  	// Use mouse coordinates for tooltip position
  	let xPos = d3.event.clientX + 10
  	let yPos = d3.event.clientY - 40

    // Update the tooltip position
    d3.select("#pieTooltip")
  		.style("left", xPos + "px")
      .style("top", yPos + "px")

  	// Update the tooltip information
  	d3.select("#borough_p").text(d.data.borough);
    d3.select("#crime_p").text(d.data.crimeCount);

    // Show the tooltip
  	d3.select("#pieTooltip").classed("hidden", false)

    // Highlight the current slice
  	d3.select(slice).attr("opacity", 0.75).style("cursor", "pointer");
  }

  let handleMouseOut = slice => {
  	//Hide the tooltip again
  	d3.select("#pieTooltip").classed("hidden", true)

  	// Remove highlight from the current slice
  	d3.select(slice)
  		.transition()
  		.duration(250)
      .attr("opacity", 1.0);
  };

  let handleMouseHover = item => {
    d3.select(item).style("cursor", "pointer").style("opacity", 0.75);
  }
  let handleMouseHoverOut = item => {
    d3.select(item).style("opacity", 1.0);
  }

  //LOAD DATASET
  let pieDataset = data;
  let pieSum = 0;
  pieDataset.forEach(function(entry) {
    pieSum += entry.crimeCount;
  });

  //Print data to console as table, for verification
  //console.table(pieDataset, ["borough", "crimeCount"]);

  //DRAW PIE CHART
  //Setup variables for pie chart
  let color = d3.scaleOrdinal(d3.schemeCategory10);
  let outerRadius = h / 3;
  let innerRadius = h / 7;
  let outerDiameter = outerRadius*2;
  let squareDimensions = (h/2)/10;

  let arc = d3.arc()
      .innerRadius(innerRadius)
      .outerRadius(outerRadius);

  let piePlot = d3.select("#piePlot");
  let pieSvg = piePlot.append("svg")
      .attr("height", h)
      .attr("width", w);

  let pieGroup = pieSvg.append("g")
      .attr("class", "pieGroup");

  let pie = d3.pie()
      .value(function(d) { return d.crimeCount; });

	let arcs = pieGroup.selectAll("g.arc")
				  .data(pie(pieDataset))
				  .enter()
				  .append("g")
				  .attr("class", "arc")
				  .attr("transform", "translate(" + outerRadius + "," + outerRadius + ")");

  arcs.attr("transform", "translate(" + outerRadius*1.25 + "," + h/2 + ")");

  //Draw arc paths
	arcs.append("path")
	    .attr("fill", function(d, i) {
        return color(i);
	    })
	    .attr("d", arc);

  arcs.on("mouseover", function(d) {
      handleMouseOver(this, d)
    })
    .on("mouseout", function(d) {handleMouseOut(this,d); });

	//Wedge labels
	arcs.append("text")
      .attr("class", "labelText")
      .attr("transform", function(d) {
	    	return "translate(" + arc.centroid(d) + ")";
	    })
	    .attr("text-anchor", "middle")
      .attr("font-size", squareDimensions)
	    .text(function(d) {
        return Math.floor(d.value/pieSum*100)+"%";
	    });

  //LEGEND
  //Group rects and text together
  let legend = pieSvg
      .append("g")
      .attr("transform", function() {return "translate(" + (((w-outerDiameter)/3)+outerDiameter) + "," + (h/4) + ")"; });

  legend.selectAll("rect")
    .data(pieDataset)
    .enter()
    .append('rect')
    .attr("y", function(d,i) {return (2*i*squareDimensions)+squareDimensions/2; })
    .attr("width", squareDimensions)
    .attr("height", squareDimensions)
    .style("fill", function (d, i) {
    return color(i) })
    .on("click", function(d) {console.log("Do something here. Borough: " + d.borough); })
    .on("mouseover", function() {handleMouseHover(this)} )
    .on("mouseout", function() {handleMouseHoverOut(this)} );

  legend.selectAll("text")
    .data(pieDataset)
    .enter()
    .append("text")
    .attr("class", "legendText")
    .attr("x", 2*squareDimensions)
    .attr("y", function(d,i) {return (2*i*squareDimensions)+squareDimensions/2; })
    .attr("font-size", squareDimensions)
    .attr("dominant-baseline", "hanging") //y position based on top line of text
    .text(function(d) {return d.borough; })
    .on("click", function(d) {console.log("Do something here. Borough: " + d.borough); })
    .on("mouseover", function() {handleMouseHover(this)} )
    .on("mouseout", function() {handleMouseHoverOut(this)} );

  // //Set tooltip fontsize to change dynamically
  d3.select("#pieTooltip")
    .style("font-size", (squareDimensions*0.8)+"px");

}); //End of d3.csv for pieData

let stackDataset;




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
