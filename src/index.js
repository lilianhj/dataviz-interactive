import * as d3 from 'd3';
import * as topojson from 'topojson';
import { legendColor } from 'd3-svg-legend';

export function myVis() {
  // create SVG

  // https://observablehq.com/@sarah37/snapping-range-slider-with-d3-brush
  let slider_snap = function(min, max) {

  var range = [min, max + 1]

  // set width and height of svg
  var w = 400
  var h = 100
  var margin = {top: 30,
                bottom: 30,
                left: 40,
                right: 40}

  // dimensions of slider bar
  var width = w - margin.left - margin.right;
  var height = h - margin.top - margin.bottom;

  // create x scale
  var x = d3.scaleLinear()
    .domain(range)  // data space
    .range([0, width]);  // display space
  
  // create svg and translated g
  var svg = d3
    .select('#middle')
    .append('svg')
    .attr('id', 'slidersvg')
    .attr('width', w)
    .attr('height', h);
  const g = svg.append('g').attr('transform', `translate(${margin.left}, ${margin.top})`)
  
  // draw background lines
  g.append('g').selectAll('line')
    .data(d3.range(range[0], range[1]+1))
    .enter()
    .append('line')
    .attr('x1', d => x(d)).attr('x2', d => x(d))
    .attr('y1', 0).attr('y2', height)
    .style('stroke', '#ccc')
  
  // labels
  var labelL = g.append('text')
    .attr('id', 'labelleft')
    .attr('x', 0)
    .attr('y', height + 5)
    .text(range[0])

  var labelR = g.append('text')
    .attr('id', 'labelright')
    .attr('x', 0)
    .attr('y', height + 5)
    .text(range[1])

  // define brush
  var brush = d3.brushX()
    .extent([[0,0], [width, height]])
    .on('brush', function() {
      var s = d3.event.selection;
      // update and move labels
      labelL.attr('x', s[0])
        .text(Math.round(x.invert(s[0])))
      labelR.attr('x', s[1])
        .text(Math.round(x.invert(s[1])) - 1)
      // move brush handles      
      handle.attr("display", null).attr("transform", function(d, i) { return "translate(" + [ s[i], - height / 4] + ")"; });
    })
    .on('end', function() {
      if (!d3.event.sourceEvent) return;
      var d0 = d3.event.selection.map(x.invert);
      var d1 = d0.map(Math.round)
      d3.select(this).transition().call(d3.event.target.move, d1.map(x))
            // update view
      // if the view should only be updated after brushing is over, 
      // move these two lines into the on('end') part below
      var s = d3.event.selection;
      var eventHandler = d3.select('#eventhandler');
      console.log("eventhandler", eventHandler);
      svg.node().value = s.map(d => Math.round(x.invert(d)));
      let event = new Event('change');
      eventHandler.node().dispatchEvent(event);
    })

  // append brush to g
  var gBrush = g.append("g")
      .attr("class", "brush")
      .call(brush)

  // add brush handles (from https://bl.ocks.org/Fil/2d43867ba1f36a05459c7113c7f6f98a)
  var brushResizePath = function(d) {
      var e = +(d.type == "e"),
          x = e ? 1 : -1,
          y = height / 2;
      return "M" + (.5 * x) + "," + y + "A6,6 0 0 " + e + " " + (6.5 * x) + "," + (y + 6) + "V" + (2 * y - 6) +
        "A6,6 0 0 " + e + " " + (.5 * x) + "," + (2 * y) + "Z" + "M" + (2.5 * x) + "," + (y + 8) + "V" + (2 * y - 8) +
        "M" + (4.5 * x) + "," + (y + 8) + "V" + (2 * y - 8);
  }

  var handle = gBrush.selectAll(".handle--custom")
    .data([{type: "w"}, {type: "e"}])
    .enter().append("path")
    .attr("class", "handle--custom")
    .attr("stroke", "#000")
    .attr("fill", '#eee')
    .attr("cursor", "ew-resize")
    .attr("d", brushResizePath);
    
  // override default behaviour - clicking outside of the selected area 
  // will select a small piece there rather than deselecting everything
  // https://bl.ocks.org/mbostock/6498000
  gBrush.selectAll(".overlay")
    .each(function(d) { d.type = "selection"; })
    .on("mousedown touchstart", brushcentered)
  
  function brushcentered() {
    var dx = x(1) - x(0), // Use a fixed width when recentering.
    cx = d3.mouse(this)[0],
    x0 = cx - dx / 2,
    x1 = cx + dx / 2;
    d3.select(this.parentNode).call(brush.move, x1 > width ? [width - dx, width] : x0 < 0 ? [0, dx] : [x0, x1]);
  }
  
  // select entire range
  gBrush.call(brush.move, range.map(x))

    var getRange = function() {
      var range = d3
        .brushSelection(gBrush.node())
        .map(d => Math.round(x.invert(d)));
      return range;
    };
  
  // https://stackoverflow.com/a/22024786
  return svg.node()

// return {getRange: getRange}
}

let myslider = slider_snap(2001, 2019)

// console.log("slider range", myslider.getRange());

  // const svg = d3.select('svg');
  const svg = d3.select('.svgcontainer').append('svg').attr('width', 960).attr('height', 500)

  const margin = {top: 40, right: 200, bottom: 60, left: 60};
  const width = Number(svg.attr('width')) - margin.left - margin.right;
  const height = Number(svg.attr('height')) - margin.top - margin.bottom;
  const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

  // read in data and make viz

  d3.csv('data/ceilings_v3.csv').then(function(data) {
    // get data from csv
    data.forEach(function(d) {
      d.Value = Number(d.Value);
      d.Year = Number(d.Year);
    });

    // console.log('data', data);

    // get unique years to make dropdown options

    const lookup = {};
    const result = ['Select Start Year'];
    const resultend = ['Select End Year'];

    for (let datum, i = 0; (datum = data[i++]); ) {
      const year = datum.Year;

      if (!(year in lookup)) {
        lookup[year] = 1;
        result.push(year);
        resultend.push(year);
      }
    }

    // console.log('here are years', result, resultend);

    // making tooltip div

      const div = d3
        .select('body')
        .append('div')
        .attr('class', 'tooltip')
        .style('opacity', 0);

      const tooltip = g
        .append('g')
        .attr('class', 'tooltip')
        .style('display', 'none');

      tooltip
        .append('rect')
        .attr('width', 60)
        .attr('height', 20)
        .attr('fill', 'white')
        .style('opacity', 0.5);

      tooltip
        .append('text')
        .attr('x', 30)
        .attr('dy', '1.2em')
        .style('text-anchor', 'middle')
        .attr('font-size', '12px')
        .attr('font-weight', 'bold');

    // make dropdown

    const startselector = d3
      .select('#middle')
      .append('select')
      .attr('id', 'startselector')
      .selectAll('option')
      .data(result)
      .enter()
      .append('option')
      .text(function(d) {
        return d;
      })
      .attr('value', function(d) {
        // console.log(d);
        return d;
      });

        const endselector = d3
          .select('#middle')
          .append('select')
          .attr('id', 'endselector')
          .selectAll('option')
          .data(resultend)
          .enter()
          .append('option')
          .text(function(d) {
            return d;
          })
          .attr('value', function(d) {
            // console.log(d);
            return d;
          });

    // default view is from 2016-2019

    update(data, 2016, 2019);

    // trying with slider

    d3.select('#eventhandler').on('change', function() {
      console.log('changing');
      var slider = myslider;
      console.log(slider);
      var leftlabel = d3.select('#labelleft');
      console.log('left label', leftlabel.text());
      let leftyear = Number(leftlabel.text());
      console.log('left year', leftyear);
      var rightlabel = d3.select('#labelright');
      console.log('right label', rightlabel.text());
      let rightyear = Number(rightlabel.text());
      console.log('right year', rightyear);
      // console.log(myslider.getRange());
      update(data, leftyear, rightyear);
    });

    // when an option is selected from the dropdown, use it to perform filtering by calling the update function

    d3.select('#endselector').on('change', function(d) {
      let startindex = d3.select('#startselector').property('value');
      const index = this.value;
      if (startindex === 'Select Start Year') {
        // console.log("reassigning default startyear");
        startindex = 2001;
      }
      // console.log(
      //   "here's the chosen start year", startindex
      // );
      // console.log("here's the chosen end year", index);
      update(data, startindex, index);
    });

       d3.select('#startselector').on('change', function(d) {
         const startindex = this.value;
         let index = d3.select('#endselector').property('value');
         if (index === 'Select End Year') {
          //  console.log("reassigning default endyear");
           index = 2019;
         }
        //  console.log(
        //    "here's the chosen start year",
        //    this.value,
        //    typeof this.value,
        //  );
        //  console.log("here's the chosen end year", index);
         update(data, startindex, index);
       });

    // the update function that is called upon dropdown filtering

    function update(data, startyear, endyear) {

    g.selectAll('*').remove();

      // console.log(
      //   'HERE WE ARE IN THE UPDATE FUNCTION',
      //   "here's data",
      //   data,
      //   "here's input year to start",
      //   startyear, "typeof", 
      //   typeof startyear,
      //   "here's input year to end", endyear, "typeof", typeof endyear
      // );

      // show a five-year window at max

      // console.log("startyear plus 4", startyear + 4)

      // // const endyear = Number(startyear) + 4;

      // console.log('here is the endyear', endyear);

      // filter the data

      const filt = data.filter(function(d) {
        // console.log(
        //   'here are final startyears and endyears for filtering',
        //   startyear,
        //   typeof startyear,
        //   endyear,
        //   typeof endyear,
        // );
        return d.Year >= Number(startyear) && d.Year <= Number(endyear);
      });

      // console.log("HERE'S THE FILTERED DATA", filt);

      const filtgroupData = d3
        .nest()
        .key(function(d) {
          return d.Year + d.Region;
        })
        .rollup(function(d, i) {
          // console.log(d[0]) //this is every year/region/type combi. use this to get the first two levels of the nesting, i.e. year/region
          let d2 = {Year: d[0].Year, Region: d[0].Region};
          d.forEach(function(d) {
            d2[d.Type] = d.Value; 
            // the third level of the nesting, i.e. type of admissions
          });
          // console.log("rollup d", d, d2);
          // console.log("here's d2", d2)
          return d2;
        })
        .entries(filt)
        .map(function(d) {
          return d.value;
        });

      // filtered grouped data, not yet stacked
      // console.log('filtgroupData', filtgroupData);

      // z is the scale that maps admission types onto opacity
      const z = d3.scaleOrdinal().range([0.7, 1.0, 0.25]);
      z.domain(
        data.map(function(d) {
          return d.Type;
        }),
      );
      const keys = z.domain();

      // x1color is the scale that maps regions onto colors
      const x1color = d3.scaleOrdinal([
        '#1696d2',
        '#ec008b',
        '#b589da',
        '#8c564b',
        '#55b748',
        '#fd7f23',
      ]);
      x1color.domain(
        data.map(function(d) {
          // console.log(d.Region);
          return d.Region;
        }),
      );

      // stack the grouped data
      const filtstackData = d3
        .stack()
        .offset(d3.stackOffsetNone)
        .keys(keys)(filtgroupData); 
        // the groupData thing just feeds in the dataset

      // console.log('filtstackData', filtstackData);

      const x0 = d3
        .scaleBand()
        .rangeRound([0, width])
        .paddingInner(0.2); 
        // space between groups - i.e. between years

      const x1 = d3.scaleBand(); 
      // space within groups - i.e. between regions

      x0.domain(
        filt.map(function(d) {
          return d.Year;
        }),
      );
      x1.domain(
        filt.map(function(d) {
          return d.Region;
        }),
      )
        .rangeRound([0, x0.bandwidth()])
        .padding(0.05);

      const y = d3
        .scaleLinear()
        .range([height, 0])
        .domain([
          0,
          filtstackData.reduce((max, row) => {
            return Math.max(max, ...row.map(d => d[1]));
          }, -Infinity),
        ]);

      // console.log('x0 domain', x0.domain());
      // console.log('x1 domain', x1.domain());
      // console.log('y domain', y.domain());

      // this operates at the level of admission type. sets opacity
      const serie = g
        .selectAll('.serie')
        .data(filtstackData)
        .enter()
        .append('g')
        .attr('class', 'serie')
        .attr('opacity', function(d) {
          // console.log('here is serie', d);
          return z(d.key);
        });

      // this operates at the level of years and regions, sets colors and positions
      serie
        .selectAll('rect')
        .data(function(d) {
          return d;
        })
        .enter()
        .append('rect')
        .attr('class', 'serie-rect')
        .attr('transform', function(d) {
          // console.log('here is serie-rect', d);
          return `translate(${x0(d.data.Year)},0)`;
        })
        .attr('x', function(d) {
          return x1(d.data.Region);
        })
        .attr('fill', function(d) {
          return x1color(d.data.Region);
        })
        .attr('y', function(d) {
          return y(d[1]);
        })
        .attr('height', function(d) {
          return y(d[0]) - y(d[1]);
        })
        .attr('width', x1.bandwidth())
        .on('mouseover', function(d) {
          div
            .transition()
            .duration(200)
            .style('opacity', 0.8);
          const smallkeys = z.domain();
          let txt = `<b>${d.data.Region}</b><br/>`;
          // let tot = 0
          smallkeys.forEach(function(k) {
            // console.log(k, d.data[k]);
            if (d.data[k] > 0) {
              txt += `<b>${k}:</b> ${d.data[k]}<br/>`;
            }
          });
          // console.log('txt', txt);
          div
            .html(txt)
            .style('left', `${d3.event.pageX}px`)
            .style('top', `${d3.event.pageY - 28}px`);
          d3.select(this)
            .attr('stroke', x1color(d.data.Region))
            .attr('stroke-width', 3);
        })
        .on('mouseout', function(d) {
          div
            .transition()
            .duration(200)
            .style('opacity', 0);
          d3.select(this).attr('stroke', 'none');
        });

      g.selectAll('.serie-rect')
        .exit()
        .remove();

      g.append('g')
        .attr('class', 'axis')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x0));

      g.append('g')
        .attr('class', 'axis')
        .call(d3.axisLeft(y))
        .append('text')
        .attr('x', -10)
        .attr('y', -10)
        .attr('dy', '0.32em')
        .attr('fill', '#000')
        .attr('font-weight', 'bold')
        .attr('text-anchor', 'start')
        .text('Admissions');

      const countrylegend = g
        .selectAll('countrylegend')
        .data(x1color.domain())
        .enter()
        .append('g')
        .attr('class', 'countrylegend');

      countrylegend
        .append('rect')
        .attr('x', width + 50)
        .attr('y', (d, i) => {
          return i * 20;
        })
        .attr('dy', '.35em')
        .attr('width', 10)
        .attr('height', 10)
        .attr('fill', x1color);

      countrylegend
        .append('text')
        .attr('x', width + 65)
        .attr('y', (d, i) => {
          return i * 20 + 5;
        })
        .attr('dy', '.35em')
        .style('font', '10px sans-serif')
        .text(function(d) {
          return d;
        });

      countrylegend
        .on('mouseover', function(reg) {
          d3.selectAll('.serie-rect')
            .filter(function(d) {
              return d.data.Region === reg;
            })
            .attr('stroke', 'black')
            // .attr('stroke', function(d) {return x1color(d.data.Region)})
            .attr('stroke-width', 4);
        })
        .on('mouseout', function(reg) {
          d3.selectAll('.serie-rect')
            .filter(function(d) {
              return d.data.Region === reg;
            })
            .attr('stroke', 'none');
        });

      g.append('text')
        .attr('x', width / 2)
        .attr('y', 0 - margin.top / 2)
        .attr('text-anchor', 'middle')
        .style('font', '18px sans-serif')
        .style('font-weight', 'bold')
        .text('Annual Refugee Ceilings and Actual Admissions');

        g
          .append('text')
          .attr('x', width + 50)
          .attr('y', height + 30)
          .attr('text-anchor', 'left')
          .style('font', '10px sans-serif')
          .style('font-style', 'italic')
          .text('Data available for 2001 to 2019');

    }
  });
}

export function myGeoVis() {
  // console.log("help me");
  const geosvg = d3
    .select('.mapcontainer')
    .append('svg')
    .attr('id', 'map')
    .attr('width', 1200)
    .attr('height', 700);
    // .style('background-color', 'steelblue')

          const div2 = d3
            .select('body')
            .append('div')
            .attr('class', 'tooltip2')
            .style('opacity', 0);

          const tooltip = geosvg
            .append('g')
            .attr('class', 'tooltip2')
            .style('display', 'none');

          tooltip
            .append('rect')
            .attr('width', 60)
            .attr('height', 20)
            .attr('fill', 'white')
            .style('opacity', 0.5);

          tooltip
            .append('text')
            .attr('x', 30)
            .attr('dy', '1.2em')
            .style('text-anchor', 'middle')
            .attr('font-size', '12px')
            .attr('font-weight', 'bold');

    Promise.all([
      d3.json('data/tiles-topo-us.json'),
      d3.csv('data/for_choro_postal.csv'),
      d3.csv('data/origins.csv')
    ]).then(function (files) {
      const tilegram = files[0];
      const choro = files[1];
      const origins = files[2];
      const tiles = topojson.feature(tilegram, tilegram.objects.tiles);
          origins.forEach(function(d) {
            d.value = Number(d.value);
          });
      // console.log('tiles', tiles, 'choro', choro, 'origins', origins);
                  const csvdata = [];
                  choro.forEach(function(d) {
                    csvdata.push({
                      statecode: d.Code,
                      statename: d.State,
                      value: Number(d.value),
                    });
                  });
      //     console.log("csvdata", csvdata);

        // build list of state codes
        const stateCodes = [];
        // build list of state names
        const stateNames = [];
        // build a list of colour values
        const colorValues = [];

        tilegram.objects.tiles.geometries.forEach(function (geometry) {
          // console.log(geometry.properties.state);
          // console.log(csvdata.find(({statecode}) => statecode === geometry.properties.state));
            if (stateCodes.indexOf(geometry.properties.state) === -1) {
                stateCodes.push(geometry.properties.state);
                // pass in state names
                stateNames.push(csvdata.find(({statecode}) => statecode === geometry.properties.state).statename);
                // pass in colour values
                colorValues.push(csvdata.find(({statecode}) => statecode === geometry.properties.state).value);
            }
        });

        // console.log('stateCodes', stateCodes);
        // console.log('stateNames', stateNames);
        // console.log('colorValues', colorValues);

        const linear = d3
          .scaleSequential(d3.interpolateBlues)
          .domain(d3.extent(colorValues));

        // console.log("domain", linear.domain());
        // console.log("color", linear(500));
      
        geosvg
          .append('g')
          .attr('class', 'legendSequential')
          .attr('transform', 'translate(950,20)')
          .style("font","12px sans-serif");

        const legendSequential = legendColor()
          .shapeWidth(30)
          .cells(10)
          .orient('vertical')
          .scale(linear)
          .title('Number of 2018 Placements')
          .labelFormat(d3.format('.0f'));

      geosvg.select('.legendSequential').call(legendSequential);

          const transform = d3.geoTransform({
            point: function(x, y) {
              this.stream.point(x, -y);
            },
          });

          const path = d3.geoPath().projection(transform);

          const g2 = geosvg.append('g').attr('transform', 'translate(-350,600)');

        // const newsvg = d3
        //   .select('.mapcontainer')
        //   .append('g')
        //   .attr('id', 'g3')
        //   .attr('opacity', 0);
        
        // newsvg.append('svg')
        // .attr('id', 'mapchart')
        // .attr('width', 450)
        // .attr('height', 500)
        // //.style('background-color', 'lightgrey')

        const borders = g2
          .selectAll('.tiles')
          .data(tiles.features)
          .enter()
          .append('path')
          .attr('d', path)
          .attr('class', 'border')
          .attr('fill', function(d, i) {
            return linear(colorValues[i]);
          })
          .attr('stroke', '#130C0E')
          .attr('stroke-width', 4)
          .on('mouseover', function(d, i) {
          div2
            .transition()
            .duration(200)
            .style('opacity', 0.8);
          let txt = `<b>${stateNames[i]}<br/>${colorValues[i]}</b>`;
          // console.log('txt', txt);
          div2
            .html(txt)
            .style('left', `${d3.event.pageX}px`)
            .style('top', `${d3.event.pageY - 28}px`);
          d3.select(this).attr('stroke-width', 6);
        })
        .on('mouseout', function(d) {
          div2
            .transition()
            .duration(200)
            .style('opacity', 0);
           d3.select(this).attr('stroke-width', 4);
        })
        .on('click', function(d, i) {
                    			// d3.selectAll('.tiles')
                          //   .style('opacity', 0.15)
                          //   .filter(function(d, i) {
                          //     //console.log("hmm")
                          //     return d.id == thisone.id;
                          //     // return d.Species == type;
                          //   })
                          //   .style('opacity', 1);
            const thisstate = stateNames[i];
            const statefilt = origins.filter(function(d) {
                    return (d.target === thisstate);
                  });
            // console.log("statefilt", statefilt)
            addchart(d, colorValues[i], thisstate, statefilt);
          });
    
            g2.selectAll('.state-label')
              .data(tiles.features)
              .enter()
              .append('text')
              .style('fill', function(d, i) {
                // console.log("label colour", colorValues[i]);
                return colorValues[i] > 1000 ? '#FFFFFF' : '#000';
              })
              .attr('class', function(d) {
                return 'state-label state-label-' + d.id;
              })
              .attr('transform', function(d) {
                return 'translate(' + path.centroid(d) + ')';
              })
              .attr('dy', '.35em')
              .attr('dx', '-10px')
              .text(function(d) {
                return d.properties.state;
              });
        // how do i legend...

        

    });

    function addchart(geodata, labelnum, labeltext, actualdata) {
      // console.log("for label", geodata.properties.state, labeltext, labelnum);
      // console.log('actual data in function', actualdata);
              actualdata = actualdata.sort(function(a, b) {
                return d3.ascending(a.value, b.value);
              });
      // console.log("we sorting now", actualdata);
      // d3.selectAll('#charttext').remove();
      d3.selectAll('#statechart').remove();
      // d3.selectAll('#mapchart').remove()

      // const chartsvg = d3.select("#g3")
      // const chartsvg = d3.select("#mapchart")

    // d3.select('.mapcontainer').append('text')
    // .attr('id', 'charttext')
    // .attr('x', 0)
    // .attr('y', 0)
    //     .text(d => {
    //       console.log("argh", geodata.properties.state)
    //       return `State: ${labeltext}, Total: ${labelnum}`;
    //     });

    const margin = {top: 40, right: 200, bottom: 30, left: 120};
    const width = 960 - margin.left - margin.right;
    const  height = 500 - margin.top - margin.bottom;

    // set the ranges
    const y = d3
      .scaleBand()
      .range([height, 0])
      .padding(0.1);

    const x = d3.scaleLinear().range([0, width]);


    const svg = d3
      .select('.mapcontainer')
      .append('svg')
      .attr('id', 'statechart')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    x.domain([
      0,
      d3.max(actualdata, function(d) {
        return d.value;
      }),
    ]);
    y.domain(
      actualdata.map(function(d) {
        return d.Country;
      }),
    );
    const x1color = d3.scaleOrdinal([
            '#1696d2',
            '#ec008b',
            '#b589da',
            '#55b748',
            '#fd7f23',
          ]);
    
      x1color.domain([
        'Africa',
        'East Asia',
        'Europe',
        'Latin America/Caribbean',
        'Near East/South Asia',
      ]);
          // x1color.domain(
          //   actualdata.map(function(d) {
          //     // console.log(d.Region);
          //     return d['World Region'];
          //   }),
          // );


    svg
      .selectAll('.bar')
      .data(actualdata)
      .enter()
      .append('g')
      .attr('class', 'bars')
      .append('rect')
      .attr('class', 'bar')
      .attr('width', function(d) {
        return x(d.value);
      })
      .attr('y', function(d) {
        return y(d.Country);
      })
      .attr('fill', function(d) {
        return x1color(d['World Region']);
      })
      .attr('height', y.bandwidth());

      const bars = svg.selectAll(".bars");
      bars
        .append('text')
        .attr('class', 'label')
        .attr('y', function(d) {
          console;
          return y(d.Country) + y.bandwidth() / 2 + 4;
        })
        .attr('x', function(d) {
          return x(d.value) + 3;
        })
        .style('font', '10px sans-serif')
        .text(function(d) {
          return d.value;
        });

    svg
      .append('g')
      .attr('transform', 'translate(0,' + height + ')')
      .call(d3.axisBottom(x));

    svg.append('g').call(d3.axisLeft(y));

      svg.selectAll('countrylegend')
      .data(x1color.domain())
      .enter()
      .append('g')
      .attr('class', 'chartlegend');

    const countrylegend = svg.selectAll(".chartlegend");

          countrylegend
            .append('rect')
            .attr('x', width + 50)
            .attr('y', (d, i) => {
              // console.log("get country", d, i)
              return i * 20;
            })
            .attr('dy', '.35em')
            .attr('width', 10)
            .attr('height', 10)
            .attr('fill', x1color);

          countrylegend
            .append('text')
            .attr('x', width + 65)
            .attr('y', (d, i) => {
              return i * 20 + 5;
            })
            .attr('dy', '.35em')
            .style('font', '10px sans-serif')
            .text(function(d) {
              return d;
            });

              countrylegend
                .on('mouseover', function(reg) {
                  svg.selectAll('.bar')
                    .filter(function(d) {
                      return d['World Region'] === reg;
                    })
                    .attr('stroke', 'black')
                    // .attr('stroke', function(d) {return x1color(d.data.Region)})
                    .attr('stroke-width', 4);
                })
                .on('mouseout', function(reg) {
                  svg.selectAll('.bar')
                    .filter(function(d) {
                      return d['World Region'] === reg;
                    })
                    .attr('stroke', 'none');
                });
      
         svg
           .append('text')
           .attr('x', width / 2)
           .attr('y', 0 - margin.top / 2)
           .attr('text-anchor', 'middle')
           .style('font', '14px sans-serif')
           .style('font-weight', 'bold')
           .text(`State: ${labeltext}, Total: ${labelnum}`);
 

    }
  }