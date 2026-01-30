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
    explicit: number;
    clean: number;
    trackCount: number;
  }

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
      const genreLower = genre.toLowerCase();

      // Pop and variants (check first)
      if (genreLower.includes('pop') && !genreLower.includes('k-pop') && !genreLower.includes('c-pop')) {
        return 'pop';
      }

      // Country
      if (genreLower.includes('country')) {
        return 'country';
      }

      // Hip hop and all rap variants
      if (genreLower.includes('hip hop') || genreLower.includes('drill') || genreLower.includes('grime') || genreLower.includes('trap')) {
        return 'hip hop';
      }
      if (genreLower.includes('rap')) {
        return 'hip hop';
      }

      // Latin music
      if (genreLower.includes('latin') || genreLower.includes('reggaeton') ||
          genreLower.includes('urbano') || genreLower.includes('corrido') ||
          genreLower.includes('mexicana') || genreLower.includes('sierreño')) {
        return 'latin';
      }

      // R&B
      if (genreLower.includes('r&b') || genreLower.includes('rnb')) {
        return 'r&b';
      }

      // Rock and variants
      if (genreLower.includes('rock') || genreLower.includes('metal') ||
          genreLower.includes('grunge') || genreLower.includes('punk')) {
        return 'rock';
      }

      // EDM and electronic
      if (genreLower.includes('edm') || genreLower.includes('electronic') ||
          genreLower.includes('house') || genreLower.includes('techno') ||
          genreLower.includes('bass') || genreLower.includes('synthwave')) {
        return 'edm';
      }

      // Soundtrack
      if (genreLower.includes('soundtrack') || genreLower.includes('score')) {
        return 'soundtrack';
      }

      // Classical/orchestral
      if (genreLower.includes('classical') || genreLower.includes('medieval') ||
          genreLower.includes('neoclassical') || genreLower.includes('orchestral')) {
        return 'classical';
      }

      // Anime/otaku
      if (genreLower.includes('anime') || genreLower.includes('nightcore')) {
        return 'anime';
      }

      // Indie/Alternative
      if (genreLower.includes('indie') || genreLower.includes('alternative')) {
        return 'indie';
      }

      // Folk/Celtic
      if (genreLower.includes('folk') || genreLower.includes('celtic')) {
        return 'folk';
      }

      // K-pop
      if (genreLower.includes('k-pop') || genreLower.includes('c-pop')) {
        return 'k-pop';
      }
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
      v => {
        const explicitCount = d3.sum(v, d => d.explicit ? 1 : 0);
        const total = v.length;
        return {
          explicit: (explicitCount / total) * 100,
          clean: ((total - explicitCount) / total) * 100,
          trackCount: total
        };
      },
      d => d.genre
    );

    // Convert to array and sort by track count
    const genreStats: GenreStats[] = Array.from(genreMap, ([genre, stats]) => ({
      genre: genre!,
      ...stats
    })).sort((a, b) => b.trackCount - a.trackCount);

    // Take top 10 genres
    const topGenreStats = genreStats.slice(0, 10);

    // Set up dimensions
    const margin = { top: 20, right: 120, bottom: 100, left: 70 };
    const width = 1100 - margin.left - margin.right;
    const height = 450 - margin.top - margin.bottom;

    // Create SVG
    const svg = d3.select(chartContainer)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Create scales
    const xScale = d3.scaleBand()
      .domain(topGenreStats.map(d => d.genre))
      .range([0, width])
      .padding(0.3);

    const yScale = d3.scaleLinear()
      .domain([0, 100])
      .range([height, 0]);

    // Stack keys
    const keys = ['clean', 'explicit'];
    const stack = d3.stack<GenreStats>()
      .keys(keys)
      .order(d3.stackOrderNone);

    const series = stack(topGenreStats);

    // Colors
    const colors = {
      'clean': '#59a14f',  // Green for clean
      'explicit': '#e15759' // Red for explicit
    };

    // Add stacked bars
    svg.selectAll('.genre-group')
      .data(series)
      .join('g')
      .attr('class', 'genre-group')
      .attr('fill', d => colors[d.key as keyof typeof colors])
      .selectAll('rect')
      .data(d => d)
      .join('rect')
      .attr('x', d => xScale(d.data.genre) || 0)
      .attr('y', d => yScale(d[1]))
      .attr('width', xScale.bandwidth())
      .attr('height', d => yScale(d[0]) - yScale(d[1]))
      .attr('opacity', 0.85)
      .on('mouseover', function(event, d) {
        d3.select(this).attr('opacity', 1);

        // Get the parent group to find which key this is
        const parent = d3.select(this.parentNode as Element);
        const key = parent.datum() as d3.Series<GenreStats, string>;
        const value = d[1] - d[0];

        // Create tooltip
        const tooltip = svg.append('g')
          .attr('class', 'tooltip')
          .attr('transform', `translate(${(xScale(d.data.genre) || 0) + xScale.bandwidth() / 2},${yScale(d[1]) - 10})`);

        const text = `${value.toFixed(1)}%`;
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
    const xAxis = d3.axisBottom(xScale);
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
      .style('font-size', '12px');

    svg.append('g')
      .attr('class', 'y-axis')
      .call(yAxis)
      .selectAll('text')
      .style('font-size', '12px');

    // Add axis label
    svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -height / 2)
      .attr('y', -50)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .text('Percentage (%)');

    // Add legend
    const legend = svg.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${width + 20}, ${height / 2 - 30})`);

    const legendData = [
      { key: 'explicit', label: 'Explicit', color: colors.explicit },
      { key: 'clean', label: 'Clean', color: colors.clean }
    ];

    legendData.forEach((item, i) => {
      const legendRow = legend.append('g')
        .attr('transform', `translate(0, ${i * 25})`);

      legendRow.append('rect')
        .attr('width', 18)
        .attr('height', 18)
        .attr('fill', item.color)
        .attr('opacity', 0.85);

      legendRow.append('text')
        .attr('x', 25)
        .attr('y', 13)
        .style('font-size', '13px')
        .text(item.label);
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
