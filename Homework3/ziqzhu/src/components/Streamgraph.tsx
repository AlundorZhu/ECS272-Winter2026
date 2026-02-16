import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import type { SpotifyRow } from '../types';

interface StreamgraphProps {
  data: SpotifyRow[];
  albumTypes: string[];
  colors: Record<string, string>;
  selectedType: string | null;
  onSelectType: (type: string) => void;
}

function Streamgraph({ data, albumTypes, colors, selectedType, onSelectType }: StreamgraphProps) {
  const ref = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;

    const svg = d3.select(ref.current);
    svg.selectAll('*').remove();

    if (!data.length) return;

    const margin = { top: 20, right: 20, bottom: 40, left: 60 };
    const width = 960 - margin.left - margin.right;
    const height = 320 - margin.top - margin.bottom;

    const root = svg
      .attr('viewBox', `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const yearMap = d3.rollups(
      data,
      (rows) => {
        const counts = new Map<string, number>();
        albumTypes.forEach((t) => counts.set(t, 0));
        rows.forEach((r) => counts.set(r.album_type, (counts.get(r.album_type) || 0) + 1));
        return counts;
      },
      (d) => d.release_year
    );

    const yearData = yearMap
      .map(([year, counts]) => {
        const entry: Record<string, number> & { year: number } = { year };
        albumTypes.forEach((t) => {
          entry[t] = counts.get(t) || 0;
        });
        return entry;
      })
      .sort((a, b) => a.year - b.year);

    const xScale = d3.scaleLinear()
      .domain(d3.extent(yearData, (d) => d.year) as [number, number])
      .range([0, width]);

    const stack = d3.stack<Record<string, number> & { year: number }>()
      .keys(albumTypes)
      .offset(d3.stackOffsetWiggle);

    const series = stack(yearData);

    const yExtent = d3.extent(series.flatMap((s) => s.flatMap((d) => [d[0], d[1]]))) as [number, number];
    const yScale = d3.scaleLinear()
      .domain([yExtent[0], yExtent[1]])
      .range([height, 0]);

    const area = d3.area<d3.SeriesPoint<Record<string, number> & { year: number }>>()
      .x((d) => xScale(d.data.year))
      .y0((d) => yScale(d[0]))
      .y1((d) => yScale(d[1]))
      .curve(d3.curveCatmullRom);

    root.selectAll('path.stream')
      .data(series)
      .join('path')
      .attr('class', 'stream')
      .attr('fill', (d) => colors[d.key] || '#999')
      .attr('opacity', (d) => (selectedType && selectedType !== d.key ? 0.2 : 0.85))
      .attr('d', area)
      .on('click', (_, d) => onSelectType(d.key))
      .append('title')
      .text((d) => `${d.key}`);

    root.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale).ticks(8).tickFormat(d3.format('d')))
      .selectAll('text')
      .style('font-size', '11px');

    root.append('g')
      .call(d3.axisLeft(yScale).ticks(6))
      .selectAll('text')
      .style('font-size', '11px');

    root.append('text')
      .attr('x', width / 2)
      .attr('y', height + 32)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .text('Release Year');

    root.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -height / 2)
      .attr('y', -45)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .text('Release Volume');
  }, [data, albumTypes, colors, selectedType, onSelectType]);

  return <svg ref={ref} className="chart" />;
}

export default Streamgraph;
