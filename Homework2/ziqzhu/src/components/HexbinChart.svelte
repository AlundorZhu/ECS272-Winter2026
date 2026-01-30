<script lang="ts">
  import { onMount } from 'svelte';
  import * as d3 from 'd3';
  import { hexbin } from 'd3-hexbin';

  let chartContainer: HTMLDivElement;

  interface SpotifyData {
    track_id: string;
    track_name: string;
    track_popularity: number;
    artist_name: string;
    artist_followers: number;
  }

  onMount(async () => {
    // Load data
    const data = await d3.csv('/data/spotify_data clean.csv', (d: any) => ({
      track_id: d.track_id,
      track_name: d.track_name,
      track_popularity: +d.track_popularity,
      artist_name: d.artist_name,
      artist_followers: +d.artist_followers
    })) as SpotifyData[];

    // Filter out invalid data
    const validData = data.filter(d =>
      d.artist_followers > 0 &&
      d.track_popularity >= 0 &&
      !isNaN(d.artist_followers) &&
      !isNaN(d.track_popularity)
    );

    // Set up dimensions
    const margin = { top: 20, right: 120, bottom: 90, left: 90 };
    const width = 1100 - margin.left - margin.right;
    const height = 520 - margin.top - margin.bottom;

    // Create SVG
    const svg = d3.select(chartContainer)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Create scales
    const xScale = d3.scaleLog()
      .domain([
        d3.min(validData, d => d.artist_followers) || 1000,
        d3.max(validData, d => d.artist_followers) || 150000000
      ])
      .range([0, width])
      .nice();

    const yScale = d3.scaleLinear()
      .domain([0, 100])
      .range([height, 0]);

    // Create hexbin generator with padding to avoid axis overlap
    const hexbinGenerator = hexbin<SpotifyData>()
      .x(d => xScale(d.artist_followers))
      .y(d => yScale(d.track_popularity))
      .radius(12)
      .extent([[15, 15], [width - 15, height - 15]]);

    const bins = hexbinGenerator(validData);

    // Color scale based on density
    const colorScale = d3.scaleSequential(d3.interpolateYlOrRd)
      .domain([0, d3.max(bins, d => d.length) || 1]);

    // Add hexagons
    svg.selectAll('.hexagon')
      .data(bins)
      .join('path')
      .attr('class', 'hexagon')
      .attr('d', hexbinGenerator.hexagon())
      .attr('transform', d => `translate(${d.x},${d.y})`)
      .attr('fill', d => colorScale(d.length))
      .attr('stroke', '#fff')
      .attr('stroke-width', 0.5)
      .attr('opacity', 0.9)
      .on('mouseover', function(event, d) {
        d3.select(this)
          .attr('opacity', 1)
          .attr('stroke-width', 2);

        // Create tooltip
        const tooltip = svg.append('g')
          .attr('class', 'tooltip')
          .attr('transform', `translate(${d.x + 20},${d.y})`);

        tooltip.append('rect')
          .attr('width', 120)
          .attr('height', 50)
          .attr('fill', 'white')
          .attr('stroke', '#333')
          .attr('rx', 4);

        tooltip.append('text')
          .attr('x', 10)
          .attr('y', 20)
          .style('font-size', '12px')
          .text(`Tracks: ${d.length}`);

        tooltip.append('text')
          .attr('x', 10)
          .attr('y', 38)
          .style('font-size', '10px')
          .text(`Artists: ${new Set(d.map((t: SpotifyData) => t.artist_name)).size}`);
      })
      .on('mouseout', function() {
        d3.select(this)
          .attr('opacity', 0.9)
          .attr('stroke-width', 0.5);
        svg.selectAll('.tooltip').remove();
      });

    // Add axes
    const xAxis = d3.axisBottom(xScale)
      .tickFormat(d => {
        const val = d.valueOf();
        if (val >= 1000000) return `${(val / 1000000).toFixed(0)}M`;
        if (val >= 1000) return `${(val / 1000).toFixed(0)}K`;
        return val.toString();
      })
      .ticks(5);

    const yAxis = d3.axisLeft(yScale)
      .ticks(10);

    svg.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${height + 20})`)
      .call(xAxis)
      .selectAll('text')
      .style('font-size', '11px');

    svg.append('g')
      .attr('class', 'y-axis')
      .call(yAxis)
      .selectAll('text')
      .style('font-size', '11px');

    // Add axis labels
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', height + 65)
      .attr('text-anchor', 'middle')
      .style('font-size', '13px')
      .text('Artist Followers (log scale)');

    svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -height / 2)
      .attr('y', -60)
      .attr('text-anchor', 'middle')
      .style('font-size', '13px')
      .text('Track Popularity');

    // Add color legend
    const legendWidth = 20;
    const legendHeight = 200;
    const legend = svg.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${width + 30}, ${height / 2 - legendHeight / 2})`);

    const legendScale = d3.scaleLinear()
      .domain([0, d3.max(bins, d => d.length) || 1])
      .range([legendHeight, 0]);

    const legendAxis = d3.axisRight(legendScale)
      .ticks(5)
      .tickFormat(d => d3.format('.0f')(d as number));

    // Create gradient for legend
    const defs = svg.append('defs');
    const gradient = defs.append('linearGradient')
      .attr('id', 'legend-gradient')
      .attr('x1', '0%')
      .attr('y1', '100%')
      .attr('x2', '0%')
      .attr('y2', '0%');

    const numStops = 10;
    for (let i = 0; i <= numStops; i++) {
      gradient.append('stop')
        .attr('offset', `${(i / numStops) * 100}%`)
        .attr('stop-color', colorScale((i / numStops) * (d3.max(bins, d => d.length) || 1)));
    }

    legend.append('rect')
      .attr('width', legendWidth)
      .attr('height', legendHeight)
      .style('fill', 'url(#legend-gradient)');

    legend.append('g')
      .attr('transform', `translate(${legendWidth}, 0)`)
      .call(legendAxis)
      .selectAll('text')
      .style('font-size', '10px');

    legend.append('text')
      .attr('x', legendWidth / 2)
      .attr('y', -10)
      .attr('text-anchor', 'middle')
      .style('font-size', '11px')
      .style('font-weight', 'bold')
      .text('Density');
  });
</script>

<div class="chart-wrapper">
  <div bind:this={chartContainer} class="chart-container"></div>
</div>

<style>
  .chart-wrapper {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 20px;
    background-color: #ffffff;
    border-radius: 8px;
  }

  .chart-container {
    width: 100%;
    max-width: 100%;
  }

  :global(.hexagon) {
    cursor: pointer;
  }

  :global(.x-axis path),
  :global(.x-axis line),
  :global(.y-axis path),
  :global(.y-axis line) {
    stroke: #333;
  }

  :global(.tooltip text) {
    font-family: system-ui, sans-serif;
  }
</style>
