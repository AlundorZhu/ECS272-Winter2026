import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import type { SpotifyRow } from '../types';

interface ParallelCoordinatesProps {
  data: SpotifyRow[];
  albumTypes: string[];
  colors: Record<string, string>;
  selectedType: string | null;
}

function ParallelCoordinates({ data, albumTypes, colors, selectedType }: ParallelCoordinatesProps) {
  const ref = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;

    const svg = d3.select(ref.current);
    svg.selectAll('*').remove();

    if (!data.length) return;

    const margin = { top: 20, right: 20, bottom: 30, left: 50 };
    const width = 960 - margin.left - margin.right;
    const height = 360 - margin.top - margin.bottom;

    const root = svg
      .attr('viewBox', `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const filtered = selectedType ? data.filter((d) => d.album_type === selectedType) : data;
    const shuffled = d3.shuffle(filtered.slice());
    const sample = shuffled.slice(0, 800);

    const dimensions = [
      { key: 'track_popularity', label: 'Track Popularity', scale: d3.scaleLinear().domain([0, 100]).range([height, 0]) },
      { key: 'artist_popularity', label: 'Artist Popularity', scale: d3.scaleLinear().domain([0, 100]).range([height, 0]) },
      { key: 'artist_followers', label: 'Followers (log)', scale: d3.scaleLog().domain([
        Math.max(1, d3.min(sample, (d) => d.artist_followers) || 1),
        d3.max(sample, (d) => d.artist_followers) || 1
      ]).range([height, 0]) },
      { key: 'track_duration_min', label: 'Duration (min)', scale: d3.scaleLinear().domain([
        0,
        d3.max(sample, (d) => d.track_duration_min) || 10
      ]).range([height, 0]) }
    ];

    const xScale = d3.scalePoint()
      .domain(dimensions.map((d) => d.key))
      .range([0, width]);

    const line = d3.line<[number, number]>()
      .x((d) => d[0])
      .y((d) => d[1]);

    const foreground = root.append('g').attr('class', 'parallel-lines');

    foreground.selectAll('path')
      .data(sample)
      .join('path')
      .attr('d', (row) => line(dimensions.map((dim) => [
        xScale(dim.key) as number,
        dim.scale((row as any)[dim.key]) as number
      ])) as string)
      .attr('fill', 'none')
      .attr('stroke', (row) => colors[row.album_type] || '#888')
      .attr('stroke-width', 0.7)
      .attr('opacity', selectedType ? 0.75 : 0.22);

    const axisGroup = root.append('g');

    dimensions.forEach((dim) => {
      const axis = d3.axisLeft(dim.scale as d3.AxisScale<d3.NumberValue>).ticks(5);
      const axisG = axisGroup.append('g')
        .attr('transform', `translate(${xScale(dim.key)},0)`)
        .call(axis);

      axisG.selectAll('text').style('font-size', '12px');
      axisG.selectAll('path, line').attr('stroke', '#666');

      axisGroup.append('text')
        .attr('x', xScale(dim.key))
        .attr('y', height + 20)
        .attr('text-anchor', 'middle')
        .style('font-size', '13px')
        .text(dim.label);
    });

    root.append('text')
      .attr('x', 0)
      .attr('y', -6)
      .style('font-size', '12px')
      .text(`Sample of ${sample.length} tracks for readability`);
  }, [data, albumTypes, colors, selectedType]);

  return <svg ref={ref} className="chart" />;
}

export default ParallelCoordinates;
