import * as d3 from 'd3';
import * as topojson from 'topojson';
import {legendColor} from 'd3-svg-legend';

export function myVis() {

  const sliderSnap = function (min, max) {

  const range = [min, max + 1]

  const w = 400;
  const h = 90;
  const margin = {top: 30,
                bottom: 30,
                left: 40,
                right: 40};

  const width = w - margin.left - margin.right;
  const height = h - margin.top - margin.bottom;

  const x = d3.scaleLinear()
    .domain(range)  
    .range([0, width]); 
  
  const svg = d3
    .select('#middle')
    .append('svg')
    .attr('id', 'slidersvg')
    .attr('width', w)
    .attr('height', h);
  const g = svg.append('g').attr('transform', `translate(${margin.left}, ${margin.top})`)
  
  g.append('g').selectAll('line')
    .data(d3.range(range[0], range[1]+1))
    .enter()
    .append('line')
    .attr('x1', d => x(d)).attr('x2', d => x(d))
    .attr('y1', 0).attr('y2', height)
    .style('stroke', '#ccc')
  
  const labelL = g.append('text')
    .attr('id', 'labelleft')
    .attr('x', 0)
    .attr('y', height + 5)
    .text(range[0])

  const labelR = g.append('text')
    .attr('id', 'labelright')
    .attr('x', 0)
    .attr('y', height + 5)
    .text(range[1])

  const brush = d3.brushX()
    .extent([[0,0], [width, height]])
    .on('brush', function() {
      const s = d3.event.selection;
      labelL.attr('x', s[0])
        .text(Math.round(x.invert(s[0])))
      labelR.attr('x', s[1])
        .text(Math.round(x.invert(s[1])) - 1)     
      handle.attr("display", null).attr("transform", function(d, i) { return `translate(${[ s[i], - height / 4]})`; });
    })
    .on('end', function() {
      if (!d3.event.sourceEvent) return;
      const d0 = d3.event.selection.map(x.invert);
      const d1 = d0.map(Math.round)
      d3.select(this).transition().call(d3.event.target.move, d1.map(x))
      const s = d3.event.selection;
      const eventHandler = d3.select('#eventhandler');
      svg.node().value = s.map(d => Math.round(x.invert(d)));
      const event = new Event('change');
      eventHandler.node().dispatchEvent(event);
    })

  const gBrush = g.append("g")
      .attr("class", "brush")
      .call(brush)

  const brushResizePath = function(d) {
      const e = Number(d.type == "e");
      const x = e ? 1 : -1;
      const y = height / 2;
      return `M${  .5 * x  },${  y  }A6,6 0 0 ${  e  } ${  6.5 * x  },${  y + 6  }V${  2 * y - 6 
        }A6,6 0 0 ${  e  } ${  .5 * x  },${  2 * y  }Z` + `M${  2.5 * x  },${  y + 8  }V${  2 * y - 8 
        }M${  4.5 * x  },${  y + 8  }V${  2 * y - 8}`;
  }

  const handle = gBrush.selectAll(".handle--custom")
    .data([{type: "w"}, {type: "e"}])
    .enter().append("path")
    .attr("class", "handle--custom")
    .attr("stroke", "#000")
    .attr("fill", '#eee')
    .attr("cursor", "ew-resize")
    .attr("d", brushResizePath);
    
  gBrush.selectAll(".overlay")
    .each(function(d) { d.type = "selection"; })
    .on("mousedown touchstart", brushcentered)
  
  function brushcentered() {
    const dx = x(1) - x(0);
    const cx = d3.mouse(this)[0];
    const x0 = cx - dx / 2;
    const x1 = cx + dx / 2;
    d3.select(this.parentNode).call(brush.move, x1 > width ? [width - dx, width] : x0 < 0 ? [0, dx] : [x0, x1]);
  }
  
  gBrush.call(brush.move, range.map(x))
  
  return svg.node()

}

const myslider = sliderSnap(2001, 2019)

  const svg = d3.select('.svgcontainer').append('svg').attr('width', 1200).attr('height', 500)

  const margin = {top: 40, right: 200, bottom: 60, left: 60};
  const width = Number(svg.attr('width')) - margin.left - margin.right;
  const height = Number(svg.attr('height')) - margin.top - margin.bottom;
  const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

  d3.csv('data/ceilings_v3.csv').then(function(data) {
    data.forEach(function(d) {
      d.Value = Number(d.Value);
      d.Year = Number(d.Year);
    });

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

    update(data, 2001, 2019);

    d3.select('#eventhandler').on('change', function() {
      const leftlabel = d3.select('#labelleft');
      const leftyear = Number(leftlabel.text());
      const rightlabel = d3.select('#labelright');
      const rightyear = Number(rightlabel.text());
      update(data, leftyear, rightyear);
    });

    function update(data, startyear, endyear) {

    g.selectAll('*').remove();

      const filt = data.filter(function(d) {
        return d.Year >= Number(startyear) && d.Year <= Number(endyear);
      });

      const filtgroupData = d3
        .nest()
        .key(function(d) {
          return d.Year + d.Region;
        })
        .rollup(function(d, i) {
          let d2 = {Year: d[0].Year, Region: d[0].Region};
          d.forEach(function(d) {
            d2[d.Type] = d.Value; 
          });
          return d2;
        })
        .entries(filt)
        .map(function(d) {
          return d.value;
        });

      const z = d3.scaleOrdinal().range([0.7, 1.0, 0.25]);
      z.domain(
        data.map(function(d) {
          return d.Type;
        }),
      );
      const keys = z.domain();

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
          return d.Region;
        }),
      );

      const filtstackData = d3
        .stack()
        .offset(d3.stackOffsetNone)
        .keys(keys)(filtgroupData); 

      const x0 = d3
        .scaleBand()
        .rangeRound([0, width])
        .paddingInner(0.2); 

      const x1 = d3.scaleBand(); 

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

      const serie = g
        .selectAll('.serie')
        .data(filtstackData)
        .enter()
        .append('g')
        .attr('class', 'serie')
        .attr('opacity', function(d) {
          return z(d.key);
        });

      serie
        .selectAll('rect')
        .data(function(d) {
          return d;
        })
        .enter()
        .append('rect')
        .attr('class', 'serie-rect')
        .attr('transform', function(d) {
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
          smallkeys.forEach(function(k) {
            if (d.data[k] > 0) {
              txt += `<b>${k}:</b> ${d.data[k]}<br/>`;
            }
          });
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
  const geosvg = d3
    .select('.mapcontainer')
    .append('svg')
    .attr('id', 'map')
    .attr('width', 900)
    .attr('height', 460);

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
      d3.csv('data/origins.csv'),
      d3.csv('data/for_choro_postal_fin.csv')
    ]).then(function(files) {
      const tilegram = files[0];
      const choro = files[1];
      const origins = files[2];
      const finchoro = files[3];
      const tiles = topojson.feature(tilegram, tilegram.objects.tiles);
          origins.forEach(function(d) {
            d.value = Number(d.value);
          });
                  const thecsvdata = [];
                  choro.forEach(function(d) {
                    thecsvdata.push({
                      statecode: d.Code,
                      statename: d.State,
                      value: Number(d.value),
                    });
                  });

                  const thebigcsvdata = [];
                  finchoro.forEach(function(d) {
                    thebigcsvdata.push({
                      statecode: d.Code,
                      statename: d.State,
                      value: Number(d.value),
                      origregion: d['World Region']
                    });
                  });

                  console.log("the big csv", thebigcsvdata);

                  const theregions = [];
                      const lookup = {};

                      for (let datum, i = 0; (datum = finchoro[i++]); ) {
                        const region = datum['World Region'];

                        if (!(region in lookup)) {
                          lookup[region] = 1;
                          theregions.push(region);
                        }
                      }
                
                      console.log(theregions);
        
      let regionselector = d3
      .select('#regionselector')
      .append('select')
      .attr('id', 'selectormenu')
      .selectAll('option')
      .data(theregions)
      .enter()
      .append('option')
      .text(function(d) {
        return d;
      })
      .attr('value', function(d) {
        return d;
      });

                     d3.select('#selectormenu').on('change', function(d) {
                       console.log(
                         d3.select('#selectormenu').property('value'),
                       );
                       let chosenregion = d3.select('#selectormenu').property('value');
                      //  let chosenregion = "Europe";
                       console.log('selected region', chosenregion);
                             const regfilt = thebigcsvdata.filter(function(d) {
                               return (d.origregion === chosenregion);
                             });
                             console.log("filter region", regfilt);
                       hexmap(regfilt, chosenregion);
                     });
        
        hexmap(
          thebigcsvdata.filter(function(d) {
            return d.origregion === "All";
          }),
          'All');


        function hexmap(csvdata, regionname) {
          d3.selectAll('#statechart').remove();
          console.log("data going into map", csvdata);

          const stateCodes = [];
          const stateNames = [];
          const colorValues = [];

          tilegram.objects.tiles.geometries.forEach(function(geometry) {
            if (stateCodes.indexOf(geometry.properties.state) === -1) {
              stateCodes.push(geometry.properties.state);
              stateNames.push(
                csvdata.find(
                  ({statecode}) => statecode === geometry.properties.state).statename
              );
              colorValues.push(
                csvdata.find(
                  ({statecode}) => statecode === geometry.properties.state
                ).value,
              );
            }
          });

          console.log(regionname, stateCodes, stateNames, colorValues);

              const max = Math.max(...colorValues);
              const numSteps = 5;
              const steps = [...new Array(numSteps)].map(
                (_, idx) => (idx + 1) / numSteps,
              );
              steps.unshift(0);
              console.log("steps", steps);
              const linear = d3
                .scaleQuantile()
                .domain(steps.map(d => d * max))
                .range(steps.map(d => d3.interpolateBlues(d)));
              
            console.log(linear.domain(), linear.range());

        //  const linear = d3
        //    .scaleSequential(d3.interpolateBlues)
        //    .domain(d3.extent(colorValues));

          // const linear = d3
          //   .scaleQuantile()
          //   .domain(colorValues)
          //   .range(d3.schemeBlues[7]);

          geosvg
            .append('g')
            .attr('class', 'legendSequential')
            .attr('transform', 'translate(730,20)')
            .style('font', '12px sans-serif');

    const legendSequential = legendColor()
      .shapeWidth(30)
      .cells(7)
      .orient('vertical')
      .scale(linear)
      .title('Number of 2018 Placements')
      .labelFormat(d3.format('.0f'));

          geosvg.select('.legendSequential').call(legendSequential);

          const transform = d3.geoTransform({
            point: function(x, y) {
              this.stream.point(x * 0.75, -y * 0.75);
            },
          });

          const path = d3.geoPath().projection(transform);

          const g2 = geosvg
            .append('g')
            .attr('transform', 'translate(-250,450)');

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
              const txt = `<b>${stateNames[i]}<br/>${colorValues[i]}</b>`;
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
              const thisstate = stateNames[i];
              const statefilt =
                regionname === 'All'
                  ? origins.filter(function(d) {
                      // console.log("region filtering for bar", regionname, d)
                      return d.target === thisstate;
                    })
                  : origins.filter(function(d) {
                      // console.log("region filtering for bar", regionname, d)
                      return (
                        d.target === thisstate &&
                        d['World Region'] === regionname
                      );
                    });
              console.log('regionname rn', regionname);
              console.log('statefilt', statefilt);
              addchart(d, colorValues[i], thisstate, statefilt);
            });

            // g2.selectAll('.state-label')
            // .data(tiles.features)
            // .enter()
            // .append('text')
            // .style('font-size', '14')
            // .attr('class', 'shadow')
            // .attr('transform', function(d) {
            //   return `translate(${path.centroid(d)})`;
            // })
            // .attr('dy', '.35em')
            // .attr('dx', '-10px')
            // .text(function(d) {
            //   return d.properties.state;
            // })

          g2.selectAll('.state-label')
            .data(tiles.features)
            .enter()
            .append('text')
            .style('font-size', '14')
            .style('fill', function(d, i) {
              // return colorValues[i] > 1000 ? '#FFFFFF' : '#000';
              return (linear(colorValues[i]) ===
                linear.range()[linear.range().length - 1] ||
                linear(colorValues[i]) ===
                  linear.range()[linear.range().length - 2])
                ? '#FFFFFF'
                : '#000';
            })
            .attr('class', function(d) {
              return `state-label state-label-${d.id}`;
            })
            .attr('transform', function(d) {
              return `translate(${path.centroid(d)})`;
            })
            .attr('dy', '.35em')
            .attr('dx', '-10px')
            .text(function(d) {
              return d.properties.state;
            })
            .on('mouseover', function(d, i) {
              div2
                .transition()
                .duration(200)
                .style('opacity', 0.8);
              let txt = `<b>${stateNames[i]}<br/>${colorValues[i]}</b>`;
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
              const thisstate = stateNames[i];
              const statefilt =
                regionname === 'All'
                  ? origins.filter(function(d) {
                      // console.log("region filtering for bar", regionname, d)
                      return d.target === thisstate;
                    })
                  : origins.filter(function(d) {
                      // console.log("region filtering for bar", regionname, d)
                      return (
                        d.target === thisstate &&
                        d['World Region'] === regionname
                      );
                    });
              // const statefilt = origins.filter(function(d) {
              //   // console.log("region filtering for bar", regionname, d)
              //   return d.target === thisstate && d['World Region'] === regionname;
              // });
              console.log('regionname rn', regionname);
              console.log('statefilt', statefilt);
              addchart(d, colorValues[i], thisstate, statefilt);
            });
        }

        

    });

    function addchart(geodata, labelnum, labeltext, actualdata) {
              actualdata = actualdata.sort(function(a, b) {
                return d3.ascending(a.value, b.value);
              });
      d3.selectAll('#statechart').remove();

    const margin = {top: 25, right: 200, bottom: 30, left: 120};
    const width = 900 - margin.left - margin.right;
    const  height = 400 - margin.top - margin.bottom;

    const y = d3
      .scaleBand()
      .range([height, 0])
      .padding(0.1);

    const x = d3.scaleLinear().range([0, width]);

    const svg = d3
      .select('.mapchart')
      .append('svg')
      .attr('id', 'statechart')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

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
      .attr('transform', `translate(0,${height})`)
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

  // REFERENCES:
  // for the slider:
  // https://observablehq.com/@sarah37/snapping-range-slider-with-d3-brush
  // https://bl.ocks.org/Fil/2d43867ba1f36a05459c7113c7f6f98a
  // https://bl.ocks.org/mbostock/6498000
  // https://stackoverflow.com/a/22024786
  // for the grouped stacked bar chart:
  // https://bl.ocks.org/SpaceActuary/6233700e7f443b719855a227f4749ee5
  // for the hexmap:
  // https://github.com/PitchInteractiveInc/tilegrams/blob/master/MANUAL.md
  // https://gist.github.com/eesur/8678df74ee7efab6d645de07a79ebcc5
  // https://bl.ocks.org/eesur/8678df74ee7efab6d645de07a79ebcc5
  // for the additional bar chart:
  // https://bl.ocks.org/hrecht/f84012ee860cb4da66331f18d588eee3
  // https://bl.ocks.org/caravinden/eb0e5a2b38c8815919290fa838c6b63b
  // for legends:
  // https://d3-legend.susielu.com/