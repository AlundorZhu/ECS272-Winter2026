<script lang="ts">
  import { onMount } from 'svelte';
  import * as d3 from 'd3';

  let chartContainer: HTMLDivElement;

  interface SpotifyData {
    track_id: string;
    track_name: string;
    track_popularity: number;
    explicit: boolean;
    artist_name: string;
    artist_followers: number;
    artist_genres: string;
    album_release_date: string;
    track_duration_min: number;
  }

  interface YearGenreCount {
    year: number;
    [genre: string]: number;
  }

  const topGenres = ['pop', 'country', 'hip hop', 'rock', 'indie', 'folk', 'rap'];
  const genreColors: { [key: string]: string } = {
    'pop': '#e45756',
    'country': '#f58518',
    'hip hop': '#72b7b2',
    'rock': '#54a24b',
    'indie': '#eeca3b',
    'folk': '#b279a2',
    'rap': '#ff9da6',
    'other': '#9d755d'
  };

  function parseGenres(genreString: string): string[] {
    if (!genreString || genreString === 'NaN' || genreString === '') return [];
    // Remove brackets, quotes, and split by comma
    return genreString
      .replace(/[\[\]'"]/g, '')
      .split(',')
      .map(g => g.trim())
      .filter(g => g.length > 0);
  }

  function categorizeGenre(genres: string[]): string {
    if (!genres || genres.length === 0) return 'other';
    for (let genre of genres) {
      if (topGenres.includes(genre)) return genre;
    }
    return 'other';
  }

  onMount(async () => {
    // Load data
    const data = await d3.csv('/data/spotify_data clean.csv', (d: any) => ({
      track_id: d.track_id,
      track_name: d.track_name,
      track_popularity: +d.track_popularity,
      explicit: d.explicit === 'TRUE',
      artist_name: d.artist_name,
      artist_followers: +d.artist_followers,
      artist_genres: d.artist_genres,
      album_release_date: d.album_release_date,
      track_duration_min: +d.track_duration_min
    })) as SpotifyData[];

    // Parse dates and filter to 2009-2025
    const filteredData = data
      .map(d => ({
        ...d,
        year: new Date(d.album_release_date).getFullYear()
      }))
      .filter(d => d.year >= 2009 && d.year <= 2025 && !isNaN(d.year));

    // Aggregate by year and genre
    const yearGenreMap = d3.rollup(
      filteredData,
      v => v.length,
      d => d.year,
      d => categorizeGenre(parseGenres(d.artist_genres))
    );

    // Convert to array format for d3.stack()
    const allGenres = topGenres.concat(['other']);
    const stackData: YearGenreCount[] = [];

    for (let year = 2009; year <= 2025; year++) {
      const yearData: YearGenreCount = { year };
      const genreMap = yearGenreMap.get(year);

      allGenres.forEach(genre => {
        yearData[genre] = genreMap?.get(genre) || 0;
      });

      stackData.push(yearData);
    }

    // Set up dimensions
    const margin = { top: 50, right: 150, bottom: 60, left: 80 };
    const width = 1200 - margin.left - margin.right;
    const height = 450 - margin.top - margin.bottom;

    // Create SVG
    const svg = d3.select(chartContainer)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Create scales
    const xScale = d3.scaleLinear()
      .domain([2009, 2025])
      .range([0, width]);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(stackData, d => {
        return allGenres.reduce((sum, genre) => sum + (d[genre] as number), 0);
      }) || 0])
      .nice()
      .range([height, 0]);

    // Create stack generator
    const stack = d3.stack<YearGenreCount>()
      .keys(allGenres)
      .order(d3.stackOrderNone)
      .offset(d3.stackOffsetNone);

    const series = stack(stackData);

    // Create area generator
    const area = d3.area<d3.SeriesPoint<YearGenreCount>>()
      .x(d => xScale(d.data.year))
      .y0(d => yScale(d[0]))
      .y1(d => yScale(d[1]))
      .curve(d3.curveMonotoneX);

    // Add areas
    svg.selectAll('.genre-area')
      .data(series)
      .join('path')
      .attr('class', 'genre-area')
      .attr('d', area)
      .attr('fill', d => genreColors[d.key] || '#999')
      .attr('opacity', 0.8)
      .on('mouseover', function() {
        d3.select(this).attr('opacity', 1);
      })
      .on('mouseout', function() {
        d3.select(this).attr('opacity', 0.8);
      });

    // Add axes
    const xAxis = d3.axisBottom(xScale)
      .tickFormat(d => d.toString())
      .ticks(8);

    const yAxis = d3.axisLeft(yScale)
      .tickFormat(d => d3.format(',')(d as number));

    svg.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${height})`)
      .call(xAxis)
      .selectAll('text')
      .style('font-size', '12px');

    svg.append('g')
      .attr('class', 'y-axis')
      .call(yAxis)
      .selectAll('text')
      .style('font-size', '12px');

    // Add chart title
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', -20)
      .attr('text-anchor', 'middle')
      .style('font-size', '18px')
      .style('font-weight', 'bold')
      .text('Music Trends Over Time (2009-2025)');

    // Add axis labels
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', height + 45)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .text('Year');

    svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -height / 2)
      .attr('y', -55)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .text('Number of Tracks');

    // Add legend
    const legend = svg.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${width + 20}, 0)`);

    allGenres.forEach((genre, i) => {
      const legendRow = legend.append('g')
        .attr('transform', `translate(0, ${i * 25})`);

      legendRow.append('rect')
        .attr('width', 18)
        .attr('height', 18)
        .attr('fill', genreColors[genre] || '#999')
        .attr('opacity', 0.8);

      legendRow.append('text')
        .attr('x', 25)
        .attr('y', 13)
        .style('font-size', '12px')
        .text(genre);
    });
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

  :global(.genre-area) {
    cursor: pointer;
  }

  :global(.x-axis path),
  :global(.x-axis line),
  :global(.y-axis path),
  :global(.y-axis line) {
    stroke: #333;
  }

  :global(.legend text) {
    font-family: system-ui, sans-serif;
  }
</style>
