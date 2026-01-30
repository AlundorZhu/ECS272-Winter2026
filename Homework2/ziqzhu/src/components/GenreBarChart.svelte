<script lang="ts">
  import { onMount } from 'svelte';
  import * as d3 from 'd3';

  let chartContainer: HTMLDivElement;

  interface SpotifyData {
    track_popularity: number;
    explicit: boolean;
    artist_genres: string;
    track_duration_min: number;
  }

  interface GenreStats {
    genre: string;
    explicitPct: number;
    avgDuration: number;
    avgPopularity: number;
    trackCount: number;
  }

  interface BarData {
    genre: string;
    metric: string;
    value: number;
  }

  const topGenres = ['pop', 'country', 'hip hop', 'rock', 'indie', 'folk', 'rap', 'soundtrack'];

  const metricColors: { [key: string]: string } = {
    'explicitPct': '#e15759',
    'avgDuration': '#4e79a7',
    'avgPopularity': '#59a14f'
  };

  const metricLabels: { [key: string]: string } = {
    'explicitPct': 'Explicit %',
    'avgDuration': 'Avg Duration (min)',
    'avgPopularity': 'Avg Popularity'
  };

  function parseGenres(genreString: string): string[] {
    if (!genreString || genreString === 'NaN' || genreString === '') return [];
    return genreString
      .replace(/[\[\]'"]/g, '')
      .split(',')
      .map(g => g.trim())
      .filter(g => g.length > 0);
  }

  function categorizeGenre(genres: string[]): string | null {
    if (!genres || genres.length === 0) return null;
    for (let genre of genres) {
      if (topGenres.includes(genre)) return genre;
    }
    return null;
  }

  onMount(async () => {
    // Load data
    const data = await d3.csv('/data/spotify_data clean.csv', (d: any) => ({
      track_popularity: +d.track_popularity,
      explicit: d.explicit === 'TRUE',
      artist_genres: d.artist_genres,
      track_duration_min: +d.track_duration_min
    })) as SpotifyData[];

    // Filter data with valid genres
    const dataWithGenres = data
      .map(d => ({
        ...d,
        genre: categorizeGenre(parseGenres(d.artist_genres))
      }))
      .filter(d => d.genre !== null);

    // Calculate genre statistics
    const genreMap = d3.rollup(
      dataWithGenres,
      v => ({
        explicitPct: (d3.sum(v, d => d.explicit ? 1 : 0) / v.length) * 100,
        avgDuration: d3.mean(v, d => d.track_duration_min) || 0,
        avgPopularity: d3.mean(v, d => d.track_popularity) || 0,
        trackCount: v.length
      }),
      d => d.genre
    );

    // Convert to array and sort by track count
    const genreStats: GenreStats[] = Array.from(genreMap, ([genre, stats]) => ({
      genre: genre!,
      ...stats
    })).sort((a, b) => b.trackCount - a.trackCount);

    // Take top genres
    const topGenreStats = genreStats.slice(0, 10);

    // Set up dimensions
    const margin = { top: 50, right: 30, bottom: 100, left: 70 };
    const width = 600 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    // Create SVG
    const svg = d3.select(chartContainer)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Prepare data for grouped bars
    const metrics = ['explicitPct', 'avgDuration', 'avgPopularity'];
    const barData: BarData[] = [];

    topGenreStats.forEach(genre => {
      metrics.forEach(metric => {
        barData.push({
          genre: genre.genre,
          metric: metric,
          value: genre[metric as keyof Omit<GenreStats, 'genre' | 'trackCount'>]
        });
      });
    });

    // Create scales
    const x0 = d3.scaleBand()
      .domain(topGenreStats.map(d => d.genre))
      .range([0, width])
      .padding(0.2);

    const x1 = d3.scaleBand()
      .domain(metrics)
      .range([0, x0.bandwidth()])
      .padding(0.1);

    // Normalize values for better comparison
    // Explicit: 0-100%, Duration: scale to 0-100, Popularity: 0-100
    const maxDuration = d3.max(topGenreStats, d => d.avgDuration) || 1;

    const yScale = d3.scaleLinear()
      .domain([0, 100])
      .range([height, 0]);

    // Function to normalize values for display
    function normalizeValue(metric: string, value: number): number {
      if (metric === 'explicitPct' || metric === 'avgPopularity') {
        return value;
      } else if (metric === 'avgDuration') {
        return (value / maxDuration) * 100;
      }
      return value;
    }

    // Add bars
    const genreGroups = svg.selectAll('.genre-group')
      .data(topGenreStats)
      .join('g')
      .attr('class', 'genre-group')
      .attr('transform', d => `translate(${x0(d.genre)},0)`);

    genreGroups.selectAll('.bar')
      .data(d => metrics.map(metric => ({
        genre: d.genre,
        metric: metric,
        value: d[metric as keyof Omit<GenreStats, 'genre' | 'trackCount'>],
        normalizedValue: normalizeValue(metric, d[metric as keyof Omit<GenreStats, 'genre' | 'trackCount'>])
      })))
      .join('rect')
      .attr('class', 'bar')
      .attr('x', d => x1(d.metric) || 0)
      .attr('y', d => yScale(d.normalizedValue))
      .attr('width', x1.bandwidth())
      .attr('height', d => height - yScale(d.normalizedValue))
      .attr('fill', d => metricColors[d.metric])
      .attr('opacity', 0.85)
      .on('mouseover', function(event, d) {
        d3.select(this).attr('opacity', 1);

        // Create tooltip
        const tooltip = svg.append('g')
          .attr('class', 'tooltip')
          .attr('transform', `translate(${(x0(d.genre) || 0) + (x1(d.metric) || 0) + x1.bandwidth() / 2},${yScale(d.normalizedValue) - 10})`);

        const text = d.metric === 'avgDuration'
          ? d.value.toFixed(2)
          : d.value.toFixed(1);

        const bbox = { width: 60, height: 25 };

        tooltip.append('rect')
          .attr('x', -bbox.width / 2)
          .attr('y', -bbox.height)
          .attr('width', bbox.width)
          .attr('height', bbox.height)
          .attr('fill', 'white')
          .attr('stroke', '#333')
          .attr('rx', 4);

        tooltip.append('text')
          .attr('x', 0)
          .attr('y', -8)
          .attr('text-anchor', 'middle')
          .style('font-size', '11px')
          .style('font-weight', 'bold')
          .text(text);
      })
      .on('mouseout', function() {
        d3.select(this).attr('opacity', 0.85);
        svg.selectAll('.tooltip').remove();
      });

    // Add axes
    const xAxis = d3.axisBottom(x0);
    const yAxis = d3.axisLeft(yScale).ticks(10);

    svg.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${height})`)
      .call(xAxis)
      .selectAll('text')
      .attr('transform', 'rotate(-45)')
      .style('text-anchor', 'end')
      .attr('dx', '-0.5em')
      .attr('dy', '0.5em')
      .style('font-size', '11px');

    svg.append('g')
      .attr('class', 'y-axis')
      .call(yAxis)
      .selectAll('text')
      .style('font-size', '11px');

    // Add chart title
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', -20)
      .attr('text-anchor', 'middle')
      .style('font-size', '16px')
      .style('font-weight', 'bold')
      .text('Genre Characteristics Comparison');

    // Add axis label
    svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -height / 2)
      .attr('y', -50)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .text('Normalized Value (0-100)');

    // Add legend
    const legend = svg.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${width - 180}, -30)`);

    metrics.forEach((metric, i) => {
      const legendRow = legend.append('g')
        .attr('transform', `translate(${i * 65}, 0)`);

      legendRow.append('rect')
        .attr('width', 12)
        .attr('height', 12)
        .attr('fill', metricColors[metric])
        .attr('opacity', 0.85);

      legendRow.append('text')
        .attr('x', 16)
        .attr('y', 10)
        .style('font-size', '10px')
        .text(metricLabels[metric]);
    });

    // Add note about normalization
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', height + margin.bottom - 10)
      .attr('text-anchor', 'middle')
      .style('font-size', '9px')
      .style('font-style', 'italic')
      .style('fill', '#666')
      .text('Note: Duration is normalized to 0-100 scale for comparison');
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

  :global(.bar) {
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
