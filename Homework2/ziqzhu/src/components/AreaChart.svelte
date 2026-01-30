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

  const topGenres = ['pop', 'hip hop', 'country', 'edm', 'soundtrack', 'r&b', 'latin', 'classical', 'rock', 'k-pop', 'anime', 'indie', 'folk', 'soul', 'emo', 'jazz', 'blues', 'gospel', 'afrobeats', 'reggae', 'disco'];
  const genreColors: { [key: string]: string } = {
    'pop': '#e45756',        // Red
    'hip hop': '#72b7b2',    // Teal
    'country': '#f58518',    // Orange
    'edm': '#eeca3b',        // Yellow
    'soundtrack': '#b279a2', // Purple
    'r&b': '#ff9da6',        // Pink
    'latin': '#76b7b2',      // Light teal
    'classical': '#9d755d',  // Brown
    'rock': '#54a24b',       // Green
    'k-pop': '#af7aa1',      // Mauve
    'anime': '#ffbe7d',      // Light orange
    'indie': '#4c78a8',      // Blue
    'folk': '#b07aa1',       // Light purple
    'soul': '#8B4789',       // Deep purple
    'emo': '#D84797',        // Hot pink
    'jazz': '#6A8D73',       // Sage green
    'blues': '#4682B4',      // Steel blue
    'gospel': '#DAA520',     // Goldenrod
    'afrobeats': '#E8743B',  // Burnt orange
    'reggae': '#228B22',     // Forest green
    'disco': '#FF1493',      // Deep pink
    'no genre': '#e0e0e0',   // Very light gray
    'other': '#5a5a5a'       // Darker gray
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
    if (!genres || genres.length === 0) return 'no genre';

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
      if (genreLower.includes('rap')) {  // Catches emo rap, cloud rap, rage rap, etc.
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
          genreLower.includes('bass') || genreLower.includes('synthwave') ||
          genreLower.includes('moombahton') || genreLower.includes('phonk') ||
          genreLower.includes('trance') || genreLower.includes('dubstep') ||
          genreLower.includes('drumstep') || genreLower.includes('downtempo') ||
          genreLower.includes('trip hop')) {
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

      // Soul (includes motown, neo soul, trap soul)
      if (genreLower.includes('soul') && !genreLower.includes('r&b')) {
        return 'soul';
      }
      if (genreLower.includes('motown')) {
        return 'soul';
      }

      // Emo (but not emo rap, which is caught by hip hop)
      if (genreLower.includes('emo') && !genreLower.includes('rap')) {
        return 'emo';
      }

      // Jazz
      if (genreLower.includes('jazz') && !genreLower.includes('rap')) {
        return 'jazz';
      }

      // Blues
      if (genreLower.includes('blues')) {
        return 'blues';
      }

      // Gospel/Christian
      if (genreLower.includes('gospel') || genreLower.includes('christian')) {
        return 'gospel';
      }

      // Afrobeats/Afropop
      if (genreLower.includes('afrobeat') || genreLower.includes('afropop') ||
          genreLower.includes('afro beat')) {
        return 'afrobeats';
      }

      // Reggae/Dancehall (excluding reggaeton which is latin)
      if ((genreLower.includes('reggae') || genreLower.includes('dancehall') ||
           genreLower.includes('ska')) && !genreLower.includes('reggaeton')) {
        return 'reggae';
      }

      // Disco/Funk (but not g-funk which is hip hop)
      if (genreLower.includes('disco') ||
          (genreLower.includes('funk') && !genreLower.includes('g-funk'))) {
        return 'disco';
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
    const allGenres = topGenres
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
    const margin = { top: 20, right: 280, bottom: 60, left: 80 };
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

    // Add legend (two columns)
    const legend = svg.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${width + 20}, 0)`);

    const itemsPerColumn = Math.ceil(allGenres.length / 2);
    const columnWidth = 130;

    allGenres.forEach((genre, i) => {
      const column = Math.floor(i / itemsPerColumn);
      const row = i % itemsPerColumn;

      const legendRow = legend.append('g')
        .attr('transform', `translate(${column * columnWidth}, ${row * 22})`);

      legendRow.append('rect')
        .attr('width', 16)
        .attr('height', 16)
        .attr('fill', genreColors[genre] || '#999')
        .attr('opacity', 0.8);

      legendRow.append('text')
        .attr('x', 22)
        .attr('y', 12)
        .style('font-size', '11px')
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
