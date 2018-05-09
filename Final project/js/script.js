//GENERAL VARIABLE INITIALIZATION
let w = document.getElementsByClassName("plot")[0].clientWidth;
let h = w*0.80;
let paddingPercentage = 0.10;
let paddingTop = paddingPercentage*h;
let paddingBottom = paddingPercentage*h;
let paddingLeft = paddingPercentage*w;
let paddingRight = (paddingPercentage/2)*w;
let boundaries = {left: paddingLeft, right: w-paddingRight, top: paddingTop, bottom: h-paddingBottom};

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

    // _____Choropleth_________

    // Colors for boroughs
    let color = ['#eff3ff','#c6dbef','#9ecae1','#6baed6','#3182bd','#08519c'];

    // Create projection
    let offset = [w/2, h/2] //Center projection in the middle of SVG
    let scale = 30000;
    let center = d3.geoCentroid(json);
    let projection = d3.geoMercator()
                        .scale(scale)
                        .center(center)
                        .translate(offset);

    // Define path generator
    let path = d3.geoPath()
    	 		        .projection(projection);
    let bounds = path.bounds(json);
    let boundx0 = bounds[0][0];
    let boundx1 = bounds[1][0];
    let boundy0 = bounds[0][1];
    let boundy1 = bounds[1][1];
    s = .85 / Math.max((boundx1 - boundx0) / svgGeo.attr("width"), (boundy1 - boundy0) / svgGeo.attr("height"));
    console.log(s);
    projection.scale(s*scale);

    //Bind data and create one path per GeoJSON feature
    let paths = svgGeo.selectAll("path")
        .data(json.features)
        .enter()
        .append("path")
        .attr("d", path)
        // .style("fill", function(d, i) {
        //   return color[i];
        .style("fill", function(d, i) {
          return color[i%6];
        })
        .style("stroke", "black");

    // function linking timeline selection with data______
    let colorFunc = function() {

    }

    // ______Loading collision data______
    let rowConverterCollisions = function(d) {
      return {
          // ym: new Date(20+d.ym.slice(0,2), parseInt(d.ym.slice(3,5))-1),
          ym: parseInt(d.ym.slice(0,2)+d.ym.slice(3,5)),
          ymDate: new Date(20+d.ym.slice(0,2), parseInt(d.ym.slice(3,5))-1),
          zip: parseInt(d.zip_code),
          incidentCount: parseInt(d.incident_count)
          // hour: parseInt(d.time.slice(0,-3)),
          // lonLat: [+d.longitude, +d.latitude]
        };
      }

    // d3.csv("../data/cleanedCollisionData.csv", rowConverterCollisions, function(d) {
    d3.csv("../data/cleanedCollisionDataGrouped.csv", rowConverterCollisions, function(d) {
      let collisionData = d;
      console.log(collisionData.slice(0,10));

      // //Draw murder locations as circles
      // let circles = svgGeo.selectAll("circle")
      //   .data(collisionData.slice(0,700))     // Only able to plot a slice <100,000
      //   .enter()
      //   .append("circle")
      //   .attr("cx", function(d) {
      //     //console.log(projection(d.lonLat)[0])
      //     return projection(d.lonLat)[0];
      //   })
      //   .attr("cy", function(d) {
      //     return projection(d.lonLat)[1];
      //   })
      //   .attr("r", 3)
      //   .attr("class", "non-brushed");

      // _____Timeline_________
      let nestData = d3.nest()
        .key(function(d) {return d.ym; })
        // .key(function (d) {return d.ym.getFullYear(); })
        // .key(function (d) {return d.ym.getMonth(); })
        .sortKeys(d3.ascending)
        .rollup(function (leaves) {return {"ymIncidents": d3.sum(leaves, function (d) {return d.incidentCount; })} })
        .entries(collisionData);
      console.log(nestData);

      // Timeline scales
      let xMinTimeline = d3.min(collisionData, function(d) {return d.ymDate; });  //Perhaps compute in advance?
      console.log(xMinTimeline);
      let xMaxTimeline = d3.max(collisionData, function(d) {return d.ymDate; });  //Perhaps compute in advance?
      console.log(xMaxTimeline);
      let xScaleTimeline = d3.scaleTime()
        .domain([xMinTimeline, xMaxTimeline])
        .range([boundaries.left,boundaries.right]);

      let yMinTimeline = 0;
      let yMaxTimeline = d3.max(nestData, function(d) {return d.value.ymIncidents; });
      console.log("Max y-value: " + yMaxTimeline);
      let yScaleTimeline = d3.scaleLinear()
        .domain([yMinTimeline, yMaxTimeline])
        .range([(boundaries.bottom/2), boundaries.top]);
      console.log("boundaries.bottom: " + boundaries.bottom);
      console.log("boundaries.top: " + boundaries.top);

      // Timeline chart
      let area = d3.area()
      //   //.defined(function(d) {return d.values.length >= 0; })
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

      //Area timeline axes
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

      //FUNCTION DEFINITIONS
      // let isBrushed = function(brush_coords, cx, cy) {
      //   let x0 = brush_coords[0][0],
      //       x1 = brush_coords[1][0],
      //       y0 = brush_coords[0][1],
      //       y1 = brush_coords[1][1];
      //   // console.log(x0 <= cx && cx <= x1 && y0 <= cy && cy <= y1);
      //   console.log("x0: " + x0 + " cx: " + cx + " x1: " + x1 + " y0: " + y0 + " cy: " + cy + " y1: " + y1);
      //   return x0 <= cx && cx <= x1 && y0 <= cy && cy <= y1;
      // }
      //
      // let highlightBrushedCircles = function() {
      //   // console.log("highlightBrushedCircles was called");
      //   if (d3.event.selection != null) {
      //     // revert circles to initial style
      //     circles.attr("class", "non-brushed");
      //
      //     let brush_coords = d3.brushSelection(this);
      //     // console.log(brush_coords);
      //
      //     // style brushed circles
      //     circles.filter(function() {
      //            let cx = d3.select(this).attr("cx");
      //            let cy = d3.select(this).attr("cy");
      //            return isBrushed(brush_coords, cx, cy); })
      //         .attr("class", "brushed");
      //     }
      // }
      //
      // Color scale
      let color = d3.scaleLinear()
          .domain([yMinTimeline, yMaxTimeline])
          .range([.3, 1]);

      let updateChoropleth = function() {
        if (!d3.event.selection) return;
        console.log(d3.event.selection);

        // Reverse engineer the time interval
        let startInterval = xScaleTimeline.invert(d3.event.selection[0]);
        let endInterval = xScaleTimeline.invert(d3.event.selection[1]);
        console.log(startInterval);
        console.log(endInterval);

        // Filter collisionData
        let tempDataChoro = collisionData.filter(function (d) {return (d.ymDate >= startInterval) && (d.ymDate <= endInterval); });
        console.log(tempDataChoro);

        // Nest on zip code
        let nestDataChoro = d3.nest()
            .key(function (d) {return d.zip; })
            .rollup(function (leaves) {return {"zipIncidents": d3.sum(leaves, function (d) {return d.incidentCount; })} })
            .entries(tempDataChoro);
        console.log(nestDataChoro);

        // Update choropleth colors
        


        //Clear colors in choropleth (to take care of not all zip codes being updated)
        // //Bind data and create one path per GeoJSON feature
        // let paths = svgGeo.selectAll("path")
        //     .data(json.features)
        //     .enter()
        //     .append("path")
        //     .attr("d", path)
        //     // .style("fill", function(d, i) {
        //     //   return color[i];
        //     .style("fill", function(d, i) {
        //       return color[i%6];
        //     })
        //     .style("stroke", "black");

       //Programmed clearing of brush after mouse-up
       // d3.select(this).call(brush.move, null);

       //Selected datapoints
       // let d_brushed =  d3.selectAll(".brushed").data();
       // console.log(d_brushed);
     }
      //  //Update histogram with new data
      //  svgHist.selectAll("rect")
      //     .data(binHistogram(d_brushed))
      //     .transition()
      //     .duration(500)
      //     .attr("x", function(d, i) {return xScale(i); })
      //     .attr("y", function(d) {
      //       // console.log(d);
      //       return yScale(d.length); })
      //     .attr("width", xScale.bandwidth())
      //     .attr("height", function(d) {
      //       // console.log(h,paddingBottom,yScale(d.length));
      //       return h-yScale(d.length)-paddingBottom; });
      // }
      //
      //Create brush
      let brush = d3.brushX()
      //   .on("brush", highlightBrushedCircles)
        .on("end", updateChoropleth);
      //
      svgTimeline.append("g") // size could be adjusted to only fill within axes
          .call(brush);
      //
      // //HISTOGRAM
      // //Histogram generator
      // let histGenerator = d3.histogram()
      //     .value(function(d) {return d.time; })
      //     .domain([0,24])
      //     .thresholds(23); //Creates 23+1 bins
      //
      // let binHistogram = function(someData) {
      //   let bins = histGenerator(someData);
      //   // console.log(bins);
      //   return bins;
      // }
      //
      // //Histogram scales
      // let xScale = d3.scaleBand()
      //   .domain(d3.range(24))
      //   .range([paddingLeft, w-paddingRight])
      //   .round(true)
      //   .paddingInner(0.05);
      //
      // let yMin = 0;
      // let yMax = 25;
      // let yScale = d3.scaleLinear()
      //   .domain([0,yMax])
      //   // .range([0,h-paddingBottom]);
      //   .range([h-paddingBottom, paddingTop]);
      //
      // //Histogram axes
      // let xAxis = d3.axisBottom()
      //   .scale(xScale);
      //
      // svgHist.append("g")
      //   .call(xAxis)
      //   .attr("class", "axis")
      //   .attr("transform", "translate(0," + (h - paddingBottom) + ")");
      //
      // let yAxis = d3.axisLeft()
      //   .scale(yScale)
      //   .ticks(5);
      //
      // svgHist.append("g")
      //   .call(yAxis)
      //   .attr("class", "axis")
      //   .attr("transform", "translate(" + paddingLeft + ",0)");
      //
      // //Histogram axes labels
      // svgHist.append("text")
      //   .attr("transform", "translate(" + ((w/2)) + " ," + h*0.99 + ")")
      //   .style("text-anchor", "middle")
      //   .text("Hour of the day");
      //
      // svgHist.append("text")
      //   .attr("transform", "rotate(-90)")
      //   .attr("x", 0-h/2)
      //   .attr("y", paddingLeft/3)
      //   .style("text-anchor", "middle")
      //   .text("No of murders");
      //
      // //Histogram bars
      // svgHist.selectAll("rect")
      //   .data(binHistogram(collisionData))
      //   .enter()
      //   .append("rect")
      //   .attr("x", function(d, i) {return xScale(i); })
      //   .attr("y", function(d) {return yScale(d.length); })
      //   .attr("width", xScale.bandwidth())
      //   .attr("height", function(d) {
      //     // console.log(h,paddingBottom,yScale(d.length));
      //     return h-paddingBottom-yScale(d.length); })
      //   .attr("fill", "steelblue");

    }); //End of d3.csv for collision data
  }); //End of D3.csv for geodata
})(); //End of anonymous function call

// //GEOPLOT WITH TIMELINE
// (function() {
//   d3.json("../data/boroughs.json", function(json) { //Perhaps create a function instead of repeating
//     //Color for the boroughs
//     let color = ['#eff3ff','#c6dbef','#9ecae1','#6baed6','#3182bd','#08519c'];
//
//     //Create projection
//     let offset = [w/2, h/2] //Center projection in the middle of SVG
//     let scale = 30000;
//     let center = d3.geoCentroid(json);
//     let projection = d3.geoMercator()
//                         .scale(scale)
//                         .center(center)
//                         .translate(offset);
//
//     //Define path generator
//     let path = d3.geoPath()
//     	 		        .projection(projection);
//     let bounds = path.bounds(json);
//     let boundx0 = bounds[0][0];
//     let boundx1 = bounds[1][0];
//     let boundy0 = bounds[0][1];
//     let boundy1 = bounds[1][1];
//     s = .85 / Math.max((boundx1 - boundx0) / svg.attr("width"), (boundy1 - boundy0) / svg.attr("height"));
//     // console.log(s);
//     projection.scale(s*scale);
//
//     //Bind data and create one path per GeoJSON feature
//     let paths = svgGeoTime.selectAll("path")
//         .data(json.features)
//         .enter()
//         .append("path")
//         .attr("d", path)
//         .style("fill", function(d, i) {
//           return color[i]; })
//         .style("stroke", "black");
//
//     //Borough labels
//     svgGeoTime.selectAll("text")
//       .data(json.features)
//       .enter()
//       .append("text")
//       .attr("class", "label")
//       .attr("x", function(d) {
//       return path.centroid(d)[0]; })
//       .attr("y", function(d) {
//       return path.centroid(d)[1]; })
//       .text(function(d) {return d.properties.BoroName; });
//
//     //Load murder data
//     let parseTime = d3.timeParse("%m/%d/%Y");
//     let rowConverterMurderDays = function(d) {
//       return {
//           date: parseTime(d.Date),
//           lonLat: [+d.Longitude, +d.Latitude]
//         };
//       };
//
//     d3.csv("../data/allMurders_2006_20016.csv", rowConverterMurderDays, function(d) {
//       let murderData = d;
//       // console.log(murderData);
//       murderData.sort(function(x,y) {return d3.ascending(x.date, y.date); });
//       //console.log(murderData);
//
//       let nestData = d3.nest()
//         .key(function (d) {return d.date; })
//         .entries(murderData);
//       //console.log(nestData);
//
//
//       //Draw murder locations as circles
//       let circles = svgGeoTime.selectAll("circle")
//           .data(murderData)
//           .enter()
//           .append("circle")
//           .attr("cx", function(d) {
//             return projection(d.lonLat)[0];
//           })
//           .attr("cy", function(d) {
//             return projection(d.lonLat)[1];
//           })
//           .attr("r", 3)
//           .attr("class", "hidden");
//
//       //Area plot timeline scales
//       let xMinTimeline = d3.min(murderData, function(d) {return d.date; });
//       // console.log(xMinTimeline);
//       let xMaxTimeline = d3.max(murderData, function(d) {return d.date; });
//       // console.log(xMaxTimeline);
//       let xScaleTimeline = d3.scaleTime()
//         .domain([xMinTimeline, xMaxTimeline])
//         .range([boundaries.left,boundaries.right]);
//       // console.log(xScaleTimeline);
//
//       let yMinTimeline = 0;
//       let yMaxTimeline = d3.max(nestData, function(d) {return d.values.length; });
//       // console.log("Max y-value: " + yMaxTimeline);
//       let yScaleTimeline = d3.scaleLinear()
//         .domain([yMinTimeline, yMaxTimeline])
//         .range([(boundaries.bottom/2), boundaries.top]);
//       // console.log("boundaries.bottom: " + boundaries.bottom);
//       // console.log("boundaries.top: " + boundaries.top);
//
//       //Area timeline chart
//       area = d3.area()
//         //.defined(function(d) {return d.values.length >= 0; })
//         .x(function(d) {
//           //console.log(d.key);
//           //console.log(xScaleTimeline(new Date(d.key)));
//           return xScaleTimeline(new Date(d.key)); })
//         .y0(function(d) {
//           //console.log("y0: " + yScaleTimeline.range()[0]);
//           return yScaleTimeline.range()[0]; })
//         .y1(function(d) {
//           // console.log(d.values.length);
//           // console.log("y1: "+ yScaleTimeline(d.values.length));
//           return yScaleTimeline(d.values.length); });
//
//       let geoPath = svgGeoTimeLine.append("path")
//         .datum(nestData)
//         .attr("class", "area")
//         .attr("d", area);
//
//       //Area timeline axes
//       let xAxis = d3.axisBottom();
//       xAxis.scale(xScaleTimeline);
//       svgGeoTimeLine.append("g")
//           .attr("transform", "translate(" + 0 + "," + boundaries.bottom/2 + ")")
//           .attr("class", "axis")
//           .call(xAxis);
//
//       let yAxis = d3.axisLeft();
//       yAxis.scale(yScaleTimeline);
//       svgGeoTimeLine.append("g")
//           .attr("transform", "translate(" + boundaries.left + "," +0 + ")")
//           .attr("class", "axis")
//           .call(yAxis);
//
//       //Geo plot brush functions
//       let isBrushed = function(d, startDate, endDate) {
//         // let x0 = brush_coords[0][0];
//         // let x1 = brush_coords[1][0];
//         // let startDate = xScaleTimeline.invert(x0);
//         // let endDate = xScaleTimeline.invert(x1);
//         //console.log(d.date >= startDate && d.date <= endDate);
//         return d.date >= startDate && d.date <= endDate;
//       }
//
//       let isCrossBrushed = function(crossBrushCoordinates, cx, cy) {
//         let x0 = crossBrushCoordinates[0][0],
//             x1 = crossBrushCoordinates[1][0],
//             y0 = crossBrushCoordinates[0][1],
//             y1 = crossBrushCoordinates[1][1];
//         // console.log(x0 <= cx && cx <= x1 && y0 <= cy && cy <= y1);
//         //console.log("x0: " + x0 + " cx: " + cx + " x1: " + x1 + " y0: " + y0 + " cy: " + cy + " y1: " + y1);
//         return x0 <= cx && cx <= x1 && y0 <= cy && cy <= y1;
//       }
//
//       let highlightBrushedCircles = function() {
//         // console.log("highlightBrushedCircles was called");
//         if (d3.event.selection != null) {
//           // revert circles to initial style
//           circles.attr("class", "hidden");
//
//           let brush_coords = d3.brushSelection(this);
//           // console.log(brush_coords);
//           let x0 = brush_coords[0];
//           let x1 = brush_coords[1];
//           let startDate = xScaleTimeline.invert(x0);
//           let endDate = xScaleTimeline.invert(x1);
//
//           // style brushed circles
//           circles.filter(function(d) {
//                  //let cx = d3.select(this).attr("cx");
//                  //let cy = d3.select(this).attr("cy");
//                  return isBrushed(d, startDate, endDate); })
//               .attr("class", "brushed");
//           }
//       }
//
//       let crossBrush = function() {
//         if (d3.event.selection != null) {
//           // revert circles to initial style
//           //circles.attr("class", "hidden");
//
//           let crossbrush_coords = d3.brushSelection(this);
//           // console.log(brush_coords);
//
//           // style brushed circles
//           circles.filter(function() {
//                  let cx = d3.select(this).attr("cx");
//                  let cy = d3.select(this).attr("cy");
//
//                  if (d3.select(this).attr("class") != "hidden") {
//                    console.log(this);
//                    return isCrossBrushed(crossbrush_coords, cx, cy); }
//                 else {return false; }})
//               .attr("class", "crossbrushed");
//           }
//       }
//
//       let updateHistogram = function() {
//           if (!d3.event.selection) return;
//
//           console.log("UpdateHisto was called");
//
//           let d_brushed =  d3.selectAll(".crossbrushed").data();
//           //console.log(d_brushed);
//
//           //Update histogram with new data
//           // svgHist.selectAll("rect")
//           //    .data(binHistogram(d_brushed))
//           //    .transition()
//           //    .duration(500)
//           //    .attr("x", function(d, i) {return xScale(i); })
//           //    .attr("y", function(d) {
//           //      // console.log(d);
//           //      return yScale(d.length); })
//           //    .attr("width", xScale.bandwidth())
//           //    .attr("height", function(d) {
//           //      // console.log(h,paddingBottom,yScale(d.length));
//           //      return h-yScale(d.length)-paddingBottom; });
//       }
//
//       let brush = d3.brushX()
//         .extent([
//           [boundaries.left, boundaries.top],
//           [boundaries.right, yScaleTimeline.range()[0]] ])
//         .on("brush", highlightBrushedCircles);
//         // .on("end", updateHistogram);
//
//       svgGeoTimeLine.append("g")
//         .call(brush);
//
//       let geoBrush = d3.brush()
//         .on("brush", crossBrush)
//         .on("end", updateHistogram);
//
//       svgGeoTime.append("g")
//           .call(geoBrush);
//
//           // let highlightBrushedCircles = function() {
//           //   // console.log("highlightBrushedCircles was called");
//           //   if (d3.event.selection != null) {
//           //     // revert circles to initial style
//           //     circles.attr("class", "non-brushed");
//           //
//           //     let brush_coords = d3.brushSelection(this);
//           //     // console.log(brush_coords);
//           //
//           //     // style brushed circles
//           //     circles.filter(function() {
//           //            let cx = d3.select(this).attr("cx");
//           //            let cy = d3.select(this).attr("cy");
//           //            return isBrushed(brush_coords, cx, cy); })
//           //         .attr("class", "brushed");
//           //     }
//           // }
//
//
//
//
//
//
//     }); //End of d3.csv all murder data 2006-2016
//   });//End of d3.csv for geodata
// })(); //End of anonymous function
