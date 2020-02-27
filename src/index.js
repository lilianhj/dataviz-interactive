import * as d3 from 'd3';
export function myVis() {
  // create SVG

  const svg = d3.select('svg');
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

    console.log('data', data);

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

    console.log('here are years', result, resultend);

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
        console.log(d);
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
            console.log(d);
            return d;
          });

    // default view is from 2016-2019

    update(data, 2016, 2019);

    // when an option is selected from the dropdown, use it to perform filtering by calling the update function

    let startindex = 0;
    let index = 0;

    d3.select('#endselector').on('change', function(d) {
      const index = this.value;
      if (
        d3.select('#startselector').property('value') === 'Select Start Year'
      ) {
        console.log('reassigning start year to 2016');
        startindex = 2016;
        console.log('startindex is now', startindex);
      } else {
        startindex = d3.select('#startselector').property('value');
      }
      console.log(
        "here's the chosen start year",
        d3.select('#startselector').property('value'),
        typeof d3.select('#startselector').property('value'),
      );
      console.log("here's the chosen end year", index);
      update(data, startindex, index);
    });

       d3.select('#startselector').on('change', function(d) {
         const startindex = this.value;
         if (
           d3.select('#endselector').property('value') === 'Select End Year'
         ) {
           console.log('reassigning end year to 2019');
           index = 2019;
           console.log('index is now', index);
         } else {
           index = d3.select('#endselector').property('value');
         }
         console.log(
           "here's the chosen start year",
           this.value,
           typeof this.value,
         );
         console.log("here's the chosen end year", d3.select('#endselector').property('value'));
         update(data, startindex, index);
       });

    // the update function that is called upon dropdown filtering

    function update(data, startyear, endyear) {

    g.selectAll('*').remove();

      console.log(
        'HERE WE ARE IN THE UPDATE FUNCTION',
        "here's data",
        data,
        "here's input year to start",
        startyear, "typeof", 
        typeof startyear,
        "here's input year to end", endyear, "typeof", typeof endyear
      );

      // show a five-year window at max

      console.log("startyear plus 4", startyear + 4)

      //const endyear = Number(startyear) + 4;

      console.log('here is the endyear', endyear);

      // filter the data

      const filt = data.filter(function(d) {
        return d.Year >= Number(startyear) && d.Year <= Number(endyear);
      });

      console.log("HERE'S THE FILTERED DATA", filt);

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
      console.log('filtgroupData', filtgroupData);

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

      console.log('filtstackData', filtstackData);

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

      console.log('x0 domain', x0.domain());
      console.log('x1 domain', x1.domain());
      console.log('y domain', y.domain());

      // this operates at the level of admission type. sets opacity
      const serie = g
        .selectAll('.serie')
        .data(filtstackData)
        .enter()
        .append('g')
        .attr('class', 'serie')
        .attr('opacity', function(d) {
          console.log('here is serie', d);
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
          console.log('here is serie-rect', d);
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
            console.log(k, d.data[k]);
            if (d.data[k] > 0) {
              txt += `<b>${k}:</b> ${d.data[k]}<br/>`;
            }
          });
          console.log('txt', txt);
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
