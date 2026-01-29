<script lang="ts">
  import { onMount } from 'svelte';
  import * as d3 from 'd3';

  let chartContainer: HTMLDivElement;

  interface SpotifyData {
    track_id: string;
    track_name: string;
    track_number: number;
    track_popularity: number;
    explicit: boolean;
    artist_name: string;
    artist_popularity: number;
    artist_followers: number;
    artist_genres: string;
    album_id: string;
    album_name: string;
    album_release_date: string;
    album_total_tracks: number;
    album_type: string;
    track_duration_min: number;
  }

  interface ArtistData {
    artist_name: string;
    followers: number;
  }

  onMount(async () => {
    // Load data
    const data = await d3.csv('/data/spotify_data clean.csv', (d: any) => ({
      track_id: d.track_id,
      track_name: d.track_name,
      track_number: +d.track_number,
      track_popularity: +d.track_popularity,
      explicit: d.explicit === 'TRUE',
      artist_name: d.artist_name,
      artist_popularity: +d.artist_popularity,
      artist_followers: +d.artist_followers,
      artist_genres: d.artist_genres,
      album_id: d.album_id,
      album_name: d.album_name,
      album_release_date: d.album_release_date,
      album_total_tracks: +d.album_total_tracks,
      album_type: d.album_type,
      track_duration_min: +d.track_duration_min
    })) as SpotifyData[];

    // Aggregate data by artist - get unique artists with their follower counts
    const artistMap = new Map<string, number>();
    data.forEach(d => {
      if (!artistMap.has(d.artist_name)) {
        artistMap.set(d.artist_name, d.artist_followers);
      }
    });

    // Convert to array and sort by followers
    const artistData: ArtistData[] = Array.from(artistMap, ([artist_name, followers]) => ({
      artist_name,
      followers
    })).sort((a, b) => b.followers - a.followers);

    // Get top 15 artists
    const topArtists = artistData.slice(0, 15);

    // Set up dimensions with margin convention
    const margin = { top: 40, right: 30, bottom: 120, left: 80 };
    const width = 900 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    // Create SVG
    const svg = d3.select(chartContainer)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Create scales
    const xScale = d3.scaleBand()
      .domain(topArtists.map(d => d.artist_name))
      .range([0, width])
      .padding(0.2);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(topArtists, d => d.followers) || 0])
      .nice()
      .range([height, 0]);

    // Create and add axes
    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3.axisLeft(yScale)
      .tickFormat(d => d3.format('.2s')(d));

    svg.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${height})`)
      .call(xAxis)
      .selectAll('text')
      .attr('transform', 'rotate(-45)')
      .style('text-anchor', 'end')
      .attr('dx', '-0.5em')
      .attr('dy', '0.5em');

    svg.append('g')
      .attr('class', 'y-axis')
      .call(yAxis);

    // Add bars
    svg.selectAll('.bar')
      .data(topArtists)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', d => xScale(d.artist_name) || 0)
      .attr('y', d => yScale(d.followers))
      .attr('width', xScale.bandwidth())
      .attr('height', d => height - yScale(d.followers))
      .attr('fill', 'steelblue')
      .attr('opacity', 0.8)
      .on('mouseover', function() {
        d3.select(this).attr('opacity', 1);
      })
      .on('mouseout', function() {
        d3.select(this).attr('opacity', 0.8);
      });

    // Add chart title
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', -10)
      .attr('text-anchor', 'middle')
      .style('font-size', '16px')
      .style('font-weight', 'bold')
      .text('Top 15 Artists by Follower Count');

    // Add axis labels
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', height + margin.bottom - 10)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .text('Artist Name');

    svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -height / 2)
      .attr('y', -margin.left + 20)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .text('Number of Followers');
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
    background-color: #f9f9f9;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }

  .chart-container {
    width: 100%;
    max-width: 100%;
  }

  :global(.bar) {
    cursor: pointer;
  }

  :global(.x-axis text),
  :global(.y-axis text) {
    font-size: 12px;
  }

  :global(.x-axis path),
  :global(.x-axis line),
  :global(.y-axis path),
  :global(.y-axis line) {
    stroke: #333;
  }
</style>
