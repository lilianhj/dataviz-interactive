import * as d3 from 'd3';
import * as topojson from 'topojson';
import {legendColor} from 'd3-svg-legend';

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
  ]).then(files => {
    const tilegram = files[0];
    const choro = files[1];
    const origins = files[2];
    const tiles = topojson.feature(tilegram, tilegram.objects.tiles);
    origins.forEach(function(d) {
      d.value = Number(d.value);
    });
    const csvdata = [];
    choro.forEach(function(d) {
      csvdata.push({
        statecode: d.Code,
        statename: d.State,
        value: Number(d.value),
      });
    });

    const stateCodes = [];
    const stateNames = [];
    const colorValues = [];

    tilegram.objects.tiles.geometries.forEach(geometry => {
      if (stateCodes.indexOf(geometry.properties.state) === -1) {
        stateCodes.push(geometry.properties.state);
        stateNames.push(
          csvdata.find(({statecode}) => statecode === geometry.properties.state)
            .statename,
        );
        colorValues.push(
          csvdata.find(({statecode}) => statecode === geometry.properties.state)
            .value,
        );
      }
    });

    // this is the part you actually wanted me to do

    const max = Math.max(...colorValues);
    const numSteps = 5;
    const steps = [...new Array(numSteps)].map(
      (_, idx) => (idx + 1) / numSteps,
    );
    const linear = d3
      .scaleQuantize()
      .domain(steps.map(d => d * max))
      .range(steps.map(d => d3.interpolateViridis(d)));

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
      point(x, y) {
        this.stream.point(x * 0.75, -y * 0.75);
      },
    });

    const path = d3.geoPath().projection(transform);

    const g2 = geosvg.append('g').attr('transform', 'translate(-250,450)');

    g2.selectAll('.tiles')
      .data(tiles.features)
      .enter()
      .append('path')
      .attr('d', path)
      .attr('class', 'border')
      .attr('fill', (_, i) => linear(colorValues[i]))
      .attr('stroke', '#130C0E')
      .attr('stroke-width', 4)
      .on('mouseover', function(d, i) {
        div2
          .transition()
          .duration(200)
          .style('opacity', 0.8);
        div2
          .html(`<b>${stateNames[i]}<br/>${colorValues[i]}</b>`)
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
        const statefilt = origins.filter(el => el.target === thisstate);
        addchart(d, colorValues[i], thisstate, statefilt);
      });

    g2.selectAll('.state-label')
      .data(tiles.features)
      .enter()
      .append('text')
      .style('font-size', '14')
      .style('fill', function(d, i) {
        return linear(colorValues[i]) ===
          linear.range()[linear.range().length - 1]
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
        const statefilt = origins.filter(function(d) {
          return d.target === thisstate;
        });
        addchart(d, colorValues[i], thisstate, statefilt);
      });
  });

  function addchart(geodata, labelnum, labeltext, actualdata) {
    actualdata = actualdata.sort(function(a, b) {
      return d3.ascending(a.value, b.value);
    });
    d3.selectAll('#statechart').remove();

    const margin = {top: 25, right: 200, bottom: 30, left: 120};
    const width = 900 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

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
      .attr('width', d => x(d.value))
      .attr('y', d => y(d.Country))
      .attr('fill', d => x1color(d['World Region']))
      .attr('height', y.bandwidth());

    const bars = svg.selectAll('.bars');
    bars
      .append('text')
      .attr('class', 'label')
      .attr('y', d => y(d.Country) + y.bandwidth() / 2 + 4)
      .attr('x', d => x(d.value) + 3)
      .style('font', '10px sans-serif')
      .text(d => d.value);

    svg
      .append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x));

    svg.append('g').call(d3.axisLeft(y));

    svg
      .selectAll('countrylegend')
      .data(x1color.domain())
      .enter()
      .append('g')
      .attr('class', 'chartlegend');

    const countrylegend = svg.selectAll('.chartlegend');

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
      .text(d => d);

    countrylegend
      .on('mouseover', function(reg) {
        svg
          .selectAll('.bar')
          .filter(d => d['World Region'] === reg)
          .attr('stroke', 'black')
          .attr('stroke-width', 4);
      })
      .on('mouseout', function(reg) {
        svg
          .selectAll('.bar')
          .filter(d => d['World Region'] === reg)
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
