import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import type { SpotifyRow } from '../types';

interface DurationScatterProps {
  data: SpotifyRow[];
  colors: Record<string, string>;
  selectedType: string | null;
}

function DurationScatter({ data, colors, selectedType }: DurationScatterProps) {
  const ref = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;

    const svg = d3.select(ref.current);
    svg.selectAll('*').remove();

    if (!data.length) return;

    const margin = { top: 20, right: 30, bottom: 50, left: 60 };
    const width = 960 - margin.left - margin.right;
    const height = 320 - margin.top - margin.bottom;

    const root = svg
      .attr('viewBox', `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const filtered = selectedType ? data.filter((d) => d.album_type === selectedType) : data;
    const sample = d3.shuffle(filtered.slice()).slice(0, 2500);

    const xScale = d3.scaleLinear()
      .domain([0, d3.max(sample, (d) => d.track_duration_min) || 10])
      .nice()
      .range([0, width]);

    const yScale = d3.scaleLinear()
      .domain([0, 100])
      .range([height, 0]);

    const xAxisG = root.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale).ticks(8));

    xAxisG.selectAll('text').style('font-size', '11px');

    const yAxisG = root.append('g')
      .attr('class', 'y-axis')
      .call(d3.axisLeft(yScale).ticks(6));

    yAxisG.selectAll('text').style('font-size', '11px');

    root.append('text')
      .attr('x', width / 2)
      .attr('y', height + 40)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .text('Track Duration (minutes)');

    root.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -height / 2)
      .attr('y', -45)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .text('Track Popularity');

    const clipId = `clip-${Math.random().toString(36).slice(2)}`;
    root.append('clipPath')
      .attr('id', clipId)
      .append('rect')
      .attr('width', width)
      .attr('height', height);

    const pointsLayer = root.append('g')
      .attr('clip-path', `url(#${clipId})`);

    const tooltip = root.append('g')
      .style('pointer-events', 'none')
      .style('opacity', 0);

    const tooltipBox = tooltip.append('rect')
      .attr('width', 220)
      .attr('height', 82)
      .attr('fill', '#ffffff')
      .attr('stroke', '#333')
      .attr('rx', 6);

    const tooltipTitle = tooltip.append('text')
      .attr('x', 8)
      .attr('y', 18)
      .style('font-size', '11px')
      .style('font-weight', '600');

    const tooltipArtist = tooltip.append('text')
      .attr('x', 8)
      .attr('y', 34)
      .style('font-size', '10px');

    const tooltipAlbum = tooltip.append('text')
      .attr('x', 8)
      .attr('y', 50)
      .style('font-size', '10px');

    const tooltipMetrics = tooltip.append('text')
      .attr('x', 8)
      .attr('y', 66)
      .style('font-size', '10px');

    const circles = pointsLayer.selectAll('circle')
      .data(sample)
      .join('circle')
      .attr('cx', (d) => xScale(d.track_duration_min))
      .attr('cy', (d) => yScale(d.track_popularity))
      .attr('r', 3)
      .attr('fill', (d) => colors[d.album_type] || '#888')
      .attr('opacity', selectedType ? 0.75 : 0.35)
      .on('mousemove', (event, d) => {
        const [mx, my] = d3.pointer(event, svg.node() as SVGSVGElement);
        tooltip
          .attr('transform', `translate(${mx + 12},${my - 12})`)
          .style('opacity', 1);

        const title = `${d.track_name.slice(0, 26)}`;
        const artist = `Artist: ${d.artist_name.slice(0, 30)}`;
        const album = `Album: ${d.album_name.slice(0, 30)}`;
        const metrics = `Popularity: ${d.track_popularity} | Duration: ${d.track_duration_min.toFixed(2)} min`;

        tooltipTitle.text(title);
        tooltipArtist.text(artist);
        tooltipAlbum.text(album);
        tooltipMetrics.text(metrics);

        const width = Math.max(
          180,
          tooltipTitle.node()?.getComputedTextLength() || 0,
          tooltipArtist.node()?.getComputedTextLength() || 0,
          tooltipAlbum.node()?.getComputedTextLength() || 0,
          tooltipMetrics.node()?.getComputedTextLength() || 0
        ) + 16;
        tooltipBox.attr('width', width);
      })
      .on('mouseleave', () => {
        tooltip.style('opacity', 0);
      });

    const zoomed = (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
      const transform = event.transform;
      const zx = transform.rescaleX(xScale);
      const zy = transform.rescaleY(yScale);

      xAxisG.call(d3.axisBottom(zx).ticks(8) as any);
      yAxisG.call(d3.axisLeft(zy).ticks(6) as any);

      circles
        .attr('cx', (d) => zx(d.track_duration_min))
        .attr('cy', (d) => zy(d.track_popularity));
    };

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 12])
      .translateExtent([[0, 0], [width, height]])
      .extent([[0, 0], [width, height]])
      .on('zoom', zoomed);

    svg.call(zoom as any);

    root.append('text')
      .attr('x', width)
      .attr('y', -6)
      .attr('text-anchor', 'end')
      .style('font-size', '11px')
      .text('Scroll to zoom, drag to pan');
  }, [data, colors, selectedType]);

  return <svg ref={ref} className="chart" />;
}

export default DurationScatter;
