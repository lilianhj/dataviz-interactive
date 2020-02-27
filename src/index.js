import * as d3 from 'd3';
export function myVis() {
  // create SVG

  var svg = d3.select('svg'),
    margin = {top: 40, right: 200, bottom: 60, left: 60},
    width = +svg.attr('width') - margin.left - margin.right,
    height = +svg.attr('height') - margin.top - margin.bottom,
    g = svg
      .append('g')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

  // read in data and make viz

  d3.csv('data/ceilings_v3.csv').then(function(data) {
    // get data from csv
    data.forEach(function(d) {
      d.Value = +d.Value;
      d.Year = +d.Year;
    });

    console.log('data', data);

    // get unique years to make dropdown options

    var lookup = {};
    var result = ['Select Start Year'];

    for (var datum, i = 0; (datum = data[i++]); ) {
      var year = datum.Year;

      if (!(year in lookup)) {
        lookup[year] = 1;
        result.push(year);
      }
    }

    console.log('here are years', result);

    // make dropdown

    var selector = d3
      .select('body')
      .append('select')
      .attr('id', 'selector')
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

    // default view is from 2016-2019

    update(data, 2016);

    // when an option is selected from the dropdown, use it to perform filtering by calling the update function

    d3.select('#selector').on('change', function(d) {
      let index = this.value;
      console.log("here's the chosen year", index);
      update(data, index);
    });

    // the update function that is called upon dropdown filtering

    function update(data, startyear) {

    g.selectAll('*').remove();

      console.log(
        'HERE WE ARE IN THE UPDATE FUNCTION',
        "here's data",
        data,
        "here's input year to start",
        startyear, "typeof", 
        typeof startyear
      );

      // show a five-year window at max

      console.log("startyear plus 4", startyear + 4)

      const endyear = Number(startyear) + 4;

      console.log('here is the endyear', endyear);

      // filter the data

      const filt = data.filter(function(d) {
        return d.Year >= startyear && d.Year <= endyear;
      });

      console.log("HERE'S THE FILTERED DATA", filt);

      var filtgroupData = d3
        .nest()
        .key(function(d) {
          return d.Year + d.Region;
        })
        .rollup(function(d, i) {
          //console.log(d[0]) //this is every year/region/type combi. use this to get the first two levels of the nesting, i.e. year/region
          var d2 = {Year: d[0].Year, Region: d[0].Region};
          d.forEach(function(d) {
            d2[d.Type] = d.Value; //the third level of the nesting, i.e. type of admissions
          });
          //console.log("rollup d", d, d2);
          //console.log("here's d2", d2)
          return d2;
        })
        .entries(filt)
        .map(function(d) {
          return d.value;
        });

      //filtered grouped data, not yet stacked
      console.log('filtgroupData', filtgroupData);

      //z is the scale that maps admission types onto opacity
      var z = d3.scaleOrdinal().range([0.7, 1.0, 0.25]);
      z.domain(
        data.map(function(d) {
          return d.Type;
        }),
      );
      var keys = z.domain();

      //x1color is the scale that maps regions onto colors
      var x1color = d3.scaleOrdinal(d3.schemeCategory10);
      x1color.domain(
        data.map(function(d) {
          //console.log(d.Region);
          return d.Region;
        }),
      );

      //stack the grouped data
      var filtstackData = d3
        .stack()
        .offset(d3.stackOffsetNone)
        .keys(keys)(filtgroupData); // the groupData thing just feeds in the dataset

      console.log('filtstackData', filtstackData);

      var x0 = d3
        .scaleBand()
        .rangeRound([0, width])
        .paddingInner(0.2); //space between groups - i.e. between years

      var x1 = d3.scaleBand(); // space within groups - i.e. between regions

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

      var y = d3
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

      //making tooltip div

      var div = d3
        .select('body')
        .append('div')
        .attr('class', 'tooltip')
        .style('opacity', 0);

      // this operates at the level of admission type. sets opacity
      var serie = g
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
          return 'translate(' + x0(d.data.Year) + ',0)';
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
          let txt = '<b>' + d.data.Region + '</b><br/>';
          //let tot = 0
          smallkeys.forEach(function(k) {
            console.log(k, d.data[k]);
            if (d.data[k] > 0) {
              txt += '<b>' + k + ': </b>' + d.data[k] + '<br/>';
            }
          });
          console.log('txt', txt);
          div
            .html(txt)
            .style('left', d3.event.pageX + 'px')
            .style('top', d3.event.pageY - 28 + 'px');
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

      var countrylegend = g
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
        .attr('x', width + 60)
        .attr('y', (d, i) => {
          return i * 20 + 5;
        })
        .attr('dy', '.35em')
        .style('font-size', '10px')
        .text(function(d) {
          return d;
        });

      countrylegend
        .on('mouseover', function(reg) {
          d3.selectAll('.serie-rect')
            .filter(function(d) {
              return d.data.Region == reg;
            })
            .attr('stroke', 'black')
            .attr('stroke-width', 4);
        })
        .on('mouseout', function(reg) {
          d3.selectAll('.serie-rect')
            .filter(function(d) {
              return d.data.Region == reg;
            })
            .attr('stroke', 'none');
        });

      var tooltip = g
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
    }
  });
}
