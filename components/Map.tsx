import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Location } from '../types';

interface MapProps {
  center: Location;
  markers?: Array<{ loc: Location; color: string; label: string }>;
  showRoute?: boolean;
}

const Map: React.FC<MapProps> = ({ center, markers = [], showRoute = true }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const width = 400;
    const height = 300;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Background
    svg.append("rect")
      .attr("width", width)
      .attr("height", height)
      .attr("fill", "#f8fafc");

    // Grid (Mock Streets)
    for (let i = 0; i < 20; i++) {
      svg.append("line").attr("x1", i * 30).attr("y1", 0).attr("x2", i * 30).attr("y2", height).attr("stroke", "#e2e8f0").attr("stroke-width", 1).attr("opacity", 0.5);
      svg.append("line").attr("x1", 0).attr("y1", i * 30).attr("x2", width).attr("y2", i * 30).attr("stroke", "#e2e8f0").attr("stroke-width", 1).attr("opacity", 0.5);
    }

    const xScale = d3.scaleLinear().domain([center.lng - 0.04, center.lng + 0.04]).range([0, width]);
    const yScale = d3.scaleLinear().domain([center.lat - 0.04, center.lat + 0.04]).range([height, 0]);

    // Draw Route Line
    if (showRoute && markers.length >= 2) {
      const lineGenerator = d3.line<any>()
        .x(d => xScale(d.lng))
        .y(d => yScale(d.lat))
        .curve(d3.curveBasis);

      // Create a slightly wiggly path between the two primary markers to simulate city streets
      const routeData = [
        markers[0].loc,
        { lat: markers[0].loc.lat + (markers[1].loc.lat - markers[0].loc.lat) * 0.3 + 0.002, lng: markers[0].loc.lng + (markers[1].loc.lng - markers[0].loc.lng) * 0.7 - 0.002 },
        { lat: markers[0].loc.lat + (markers[1].loc.lat - markers[0].loc.lat) * 0.7 - 0.002, lng: markers[0].loc.lng + (markers[1].loc.lng - markers[0].loc.lng) * 0.3 + 0.002 },
        markers[1].loc
      ];

      // Route Glow
      svg.append("path")
        .datum(routeData)
        .attr("fill", "none")
        .attr("stroke", "#FF6B00")
        .attr("stroke-width", 8)
        .attr("stroke-linecap", "round")
        .attr("d", lineGenerator)
        .attr("opacity", 0.1);

      // Animated Dash Path
      const path = svg.append("path")
        .datum(routeData)
        .attr("fill", "none")
        .attr("stroke", "#FF6B00")
        .attr("stroke-width", 3)
        .attr("stroke-dasharray", "10,5")
        .attr("stroke-linecap", "round")
        .attr("d", lineGenerator);

      path.append("animate")
        .attr("attributeName", "stroke-dashoffset")
        .attr("from", "100")
        .attr("to", "0")
        .attr("dur", "3s")
        .attr("repeatCount", "indefinite");
    }

    // Draw markers
    markers.forEach(m => {
      const g = svg.append("g");
      
      // Pulse for active markers (like Partner/Courier)
      if (m.label === 'Partner' || m.label === 'Courier') {
        g.append("circle")
          .attr("cx", xScale(m.loc.lng))
          .attr("cy", yScale(m.loc.lat))
          .attr("r", 15)
          .attr("fill", m.color)
          .attr("opacity", 0.3)
          .append("animate")
          .attr("attributeName", "r")
          .attr("values", "8;22;8")
          .attr("dur", "1.5s")
          .attr("repeatCount", "indefinite");
      }

      // Marker Shadow
      g.append("circle")
        .attr("cx", xScale(m.loc.lng))
        .attr("cy", yScale(m.loc.lat) + 2)
        .attr("r", 8)
        .attr("fill", "black")
        .attr("opacity", 0.1);

      // Main Marker
      g.append("circle")
        .attr("cx", xScale(m.loc.lng))
        .attr("cy", yScale(m.loc.lat))
        .attr("r", 8)
        .attr("fill", m.color)
        .attr("stroke", "white")
        .attr("stroke-width", 2.5);

      // Label
      g.append("text")
        .attr("x", xScale(m.loc.lng))
        .attr("y", yScale(m.loc.lat) - 14)
        .attr("text-anchor", "middle")
        .attr("font-size", "10px")
        .attr("font-weight", "900")
        .attr("fill", "#0A1F44")
        .attr("class", "uppercase tracking-tighter")
        .text(m.label);
    });

  }, [center, markers, showRoute]);

  return (
    <div className="w-full bg-slate-50 dark:bg-slate-900 overflow-hidden shadow-inner border-b border-slate-100 dark:border-white/5">
      <svg ref={svgRef} viewBox="0 0 400 300" className="w-full h-auto"></svg>
    </div>
  );
};

export default Map;