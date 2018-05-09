//GENERAL VARIABLE INITIALIZATION
let w = document.getElementsByClassName("plot")[0].clientWidth;
let h = w*0.80;
let paddingPercentage = 0.10;
let paddingTop = paddingPercentage*h;
let paddingBottom = paddingPercentage*h;
let paddingLeft = paddingPercentage*w;
let paddingRight = (paddingPercentage/2)*w;
let boundaries = {left: paddingLeft, right: w-paddingRight, top: paddingTop, bottom: h-paddingBottom};
console.log(boundaries);
 //Create SVG elements
 var svgTimeline = d3.select("#containerTimeline")
      .append("svg")
      .attr("width", w)
      .attr("height", h/2);

var svgGeo = d3.select("#containerGeo")
     .append("svg")
     .attr("width", w)
     .attr("height", h);

var svgHist = d3.select("#containerHisto")
     .append("svg")
     .attr("width", w)
     .attr("height", h);

(function() {
  //Load in GeoJSON data
  d3.json("../data/zipcodes.geojson", function(error, json) {
    if (error) console.log("error fetching data")
    console.log(json)

    // Create projection
    let offset = [w/2, h/2] //Center projection in the middle of SVG
    let scale = 30000;
    let center = d3.geoCentroid(json);
    let projection = d3.geoMercator()
        .scale(scale)     // scaling is changed later with scaling factor s
        .center(center)
        .translate(offset);

    // Define path generator and calculate scaling factor, s
    let path = d3.geoPath()
        .projection(projection);
    let bounds = path.bounds(json);
    let boundx0 = bounds[0][0];
    let boundx1 = bounds[1][0];
    let boundy0 = bounds[0][1];
    let boundy1 = bounds[1][1];
    s = .85 / Math.max((boundx1 - boundx0) / svgGeo.attr("width"), (boundy1 - boundy0) / svgGeo.attr("height"));
    projection.scale(s*scale);

    // ______Loading collision data______
    let rowConverterCollisions = function(d) {
      return {
          ym: parseInt(d.ym.slice(0,2)+d.ym.slice(3,5)),                      // Removing '-' and parseInt
          ymDate: new Date(20+d.ym.slice(0,2), parseInt(d.ym.slice(3,5))-1),  // Needed for filtering after brushing
          zip: parseInt(d.zip_code),
          incidentCount: parseInt(d.incident_count)                           // Total number of registered collisions for ym
          // Also import number of injured/killed - needed for tooltips
        };
      }

    d3.csv("../data/cleanedCollisionDataGrouped.csv", rowConverterCollisions, function(d) {
      let collisionData = d;
      console.log(collisionData.slice(0,10));

      // Nest collisionData on ym summing up number of incidents - needed for timeline
      let nestData = d3.nest()
        .key(function(d) {return d.ym; })
        .sortKeys(d3.ascending)
        .rollup(function (leaves) {return {"ymIncidents": d3.sum(leaves, function (d) {return d.incidentCount; })} })
        .entries(collisionData);
      console.log(nestData);

      // Nest collisionData on zip code summing up number of incidents - needed for choropleth coloring
      let nestDataZip = d3.nest()
        .key(function (d) {return d.zip; })
        .rollup(function (leaves) {return {"zipIncidentsInit": d3.sum(leaves, function (d) {return d.incidentCount; })} })
        .entries(collisionData);
      console.log(nestDataZip);

      // _____Timeline_________

      // Timeline x-scale
      let xMinTimeline = d3.min(collisionData, function(d) {return d.ymDate; });  //Perhaps compute in advance?
      console.log(xMinTimeline);
      let xMaxTimeline = d3.max(collisionData, function(d) {return d.ymDate; });  //Perhaps compute in advance?
      console.log(xMaxTimeline);
      let xScaleTimeline = d3.scaleTime()
        .domain([xMinTimeline, xMaxTimeline])
        .range([boundaries.left,boundaries.right]);

      // Timeline y-scale
      let yMinTimeline = 0;
      let yMaxTimeline = d3.max(nestData, function(d) {return d.value.ymIncidents; });
      console.log("Max y-value: " + yMaxTimeline);
      let yScaleTimeline = d3.scaleLinear()
        .domain([yMinTimeline, yMaxTimeline])
        .range([(boundaries.bottom/2), boundaries.top]);

      // Draw timeline
      let area = d3.area()
        .x(function(d) {
          // console.log(20+d.key.slice(0,2), parseInt(d.key.slice(3,5))-1);
          // console.log(new Date(20+d.key.slice(0,2), parseInt(d.key.slice(3,5))-1));
          return xScaleTimeline(new Date(20+d.key.slice(0,2), parseInt(d.key.slice(2,4))-1)); })
        .y0(function(d) {
      //     //console.log("y0: " + yScaleTimeline.range()[0]);
          return yScaleTimeline.range()[0]; })
        .y1(function(d) {
      //     // console.log(d.values.length);
          // console.log("y1: "+ yScaleTimeline(d.values.length));
          return yScaleTimeline(d.value.ymIncidents); });

      let timelinePath = svgTimeline.append("path")
        .datum(nestData)
        .attr("class", "area")
        .attr("d", area);

      //Timeline axes
      let xAxis = d3.axisBottom();

      xAxis.scale(xScaleTimeline);

      svgTimeline.append("g")
          .attr("transform", "translate(" + 0 + "," + boundaries.bottom/2 + ")")
          .attr("class", "axis")
          .call(xAxis);

      let yAxis = d3.axisLeft();

      yAxis.scale(yScaleTimeline);

      svgTimeline.append("g")
          .attr("transform", "translate(" + boundaries.left + "," +0 + ")")
          .attr("class", "axis")
          .call(yAxis);

      // Choropleth function definitions

      // Prepare paths variable
      let paths = svgGeo.selectAll("path")
      .data(json.features)
      .enter()
      .append("path")
      .attr("d", path);

      let initChoropleth = function() {
        // Color scale for coloring zip codes
        let colorScaleInit = d3.scaleLinear()
        .domain([0, yMaxTimeline])
        .range(['white', 'blue']);

        // set styling of zip codes
        paths.style("fill", function(d, i) {
          // If statement handles zip codes that are not present in nestDatachoro - find a better solution
          if (nestDataZip.find(function (x) {return x.key == d.properties.postalCode; })) {
            // Cross link zip code in geoJSON file with zip codes in the filtered data and get number of incidents
            let incidents = nestDataZip.find(function (x) {return x.key == d.properties.postalCode; }).value.zipIncidentsInit;
            return colorScaleInit(incidents); }})
          .style("stroke", "black");
        }

        initChoropleth();

      let updateChoropleth = function() {
        if (!d3.event.selection) return;
        console.log(d3.event.selection);

        // Reverse engineer the time interval based on brush coordinates
        let startInterval = xScaleTimeline.invert(d3.event.selection[0]);
        let endInterval = xScaleTimeline.invert(d3.event.selection[1]);
        console.log(startInterval);
        console.log(endInterval);

        // Get collisionData in selected time interval
        let tempDataChoro = collisionData.filter(function (d) {return (d.ymDate >= startInterval) && (d.ymDate <= endInterval); });
        console.log(tempDataChoro);

        // Nest tempDataChoro on zip code
        let nestDataChoro = d3.nest()
            .key(function (d) {return d.zip; })
            .rollup(function (leaves) {return {"zipIncidents": d3.sum(leaves, function (d) {return d.incidentCount; })} })
            .entries(tempDataChoro);
        console.log(nestDataChoro);

        // Dynamic color scale
        let choroMax = d3.max(nestDataChoro, function (d) {return d.value.zipIncidents; });
        console.log(choroMax);

        let colorScale = d3.scaleLinear()
            .domain([0, choroMax])
            .range(['white', 'blue']);

        // Update choropleth colors
        paths.style("fill", function(d, i) {
              // If statement handles zip codes that are not present in nestDatachoro - find a better solution
              if (nestDataChoro.find(function (x) {return x.key == d.properties.postalCode; })) {
                // Cross link zip code in geoJSON file with zip codes in the filtered data and get number of incidents
                let incidents = nestDataChoro.find(function (x) {return x.key == d.properties.postalCode; }).value.zipIncidents;
              return colorScale(incidents); }})
            .style("stroke", "black");
     }

    //Create brush
    let brush = d3.brushX()
      .extent([[boundaries.left, 0], [boundaries.right, boundaries.bottom/2]])
      .on("end", updateChoropleth);

    svgTimeline.append("g")
        .call(brush);

    }); //End of d3.csv for collision data
  }); //End of D3.csv for geodata
})(); //End of anonymous function call
