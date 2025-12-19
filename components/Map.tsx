import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Location } from '../types';

interface MapProps {
  center: Location;
  markers?: Array<{ loc: Location; color: string; label: string }>;
  trackingHistory?: Location[]; // The "Actual Path"
  showRoute?: boolean; // The "Proposed Path"
}

const Map: React.FC<MapProps> = ({ center, markers = [], trackingHistory = [], showRoute = true }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const width = 400;
    const height = 300;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Night Vision Dark Slate Background
    svg.append("rect")
      .attr("width", width)
      .attr("height", height)
      .attr("fill", "#0F172A");

    // Strategic Logistics Grid (Low Opacity)
    for (let i = 0; i < 20; i++) {
      svg.append("line").attr("x1", i * 30).attr("y1", 0).attr("x2", i * 30).attr("y2", height).attr("stroke", "#ffffff").attr("stroke-width", 0.5).attr("opacity", 0.05);
      svg.append("line").attr("x1", 0).attr("y1", i * 30).attr("x2", width).attr("y2", i * 30).attr("stroke", "#ffffff").attr("stroke-width", 0.5).attr("opacity", 0.05);
    }

    const xScale = d3.scaleLinear().domain([center.lng - 0.04, center.lng + 0.04]).range([0, width]);
    const yScale = d3.scaleLinear().domain([center.lat - 0.04, center.lat + 0.04]).range([height, 0]);

    // 1. Proposed Path (Dashed Copper)
    if (showRoute && markers.length >= 2) {
      const lineGenerator = d3.line<any>()
        .x(d => xScale(d.lng))
        .y(d => yScale(d.lat))
        .curve(d3.curveBasis);

      const proposedData = [
        markers[0].loc,
        { lat: (markers[0].loc.lat + markers[1].loc.lat) / 2 + 0.003, lng: (markers[0].loc.lng + markers[1].loc.lng) / 2 - 0.003 },
        markers[1].loc
      ];

      svg.append("path")
        .datum(proposedData)
        .attr("fill", "none")
        .attr("stroke", "#B87333") // Burnished Copper
        .attr("stroke-width", 2)
        .attr("stroke-dasharray", "8,5")
        .attr("opacity", 0.5)
        .attr("d", lineGenerator);
    }

    // 2. Actual Tracking History (Solid Royal Blue + Breadcrumbs)
    if (trackingHistory && trackingHistory.length > 1) {
      const actualLineGenerator = d3.line<any>()
        .x(d => xScale(d.lng))
        .y(d => yScale(d.lat))
        .curve(d3.curveLinear);

      svg.append("path")
        .datum(trackingHistory)
        .attr("fill", "none")
        .attr("stroke", "#1E40AF") // Royal Blue
        .attr("stroke-width", 3)
        .attr("stroke-linecap", "round")
        .attr("d", actualLineGenerator);

      // Persistent dots for others to see the exact path maintained
      trackingHistory.forEach((loc, idx) => {
        if (idx % 3 === 0) {
          svg.append("circle")
            .attr("cx", xScale(loc.lng))
            .attr("cy", yScale(loc.lat))
            .attr("r", 2)
            .attr("fill", "#1E40AF")
            .attr("opacity", 0.4);
        }
      });
    }

    // 3. Dynamic Markers
    markers.forEach(m => {
      const g = svg.append("g");
      
      // Node Pulse (Radar Effect)
      g.append("circle")
        .attr("cx", xScale(m.loc.lng))
        .attr("cy", yScale(m.loc.lat))
        .attr("r", 15)
        .attr("fill", m.color)
        .attr("opacity", 0.2)
        .append("animate")
        .attr("attributeName", "r")
        .attr("values", "10;30;10")
        .attr("dur", "3s")
        .attr("repeatCount", "indefinite");

      g.append("circle")
        .attr("cx", xScale(m.loc.lng))
        .attr("cy", yScale(m.loc.lat))
        .attr("r", 7)
        .attr("fill", m.color)
        .attr("stroke", "#ffffff")
        .attr("stroke-width", 2);

      g.append("text")
        .attr("x", xScale(m.loc.lng))
        .attr("y", yScale(m.loc.lat) - 18)
        .attr("text-anchor", "middle")
        .attr("font-size", "8px")
        .attr("font-weight", "900")
        .attr("fill", "#ffffff")
        .attr("class", "uppercase tracking-[0.2em] italic")
        .text(m.label);
    });

  }, [center, markers, trackingHistory, showRoute]);

  return (
    <div className="w-full bg-slate-950 overflow-hidden relative shadow-2xl border-y border-white/5">
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        <div className="bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
          <span className="text-[7px] font-black uppercase text-white tracking-widest italic">Live Breadcrumbs</span>
        </div>
        <div className="bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-amber-600"></div>
          <span className="text-[7px] font-black uppercase text-white tracking-widest italic">Target Corridor</span>
        </div>
      </div>
      <svg ref={svgRef} viewBox="0 0 400 300" className="w-full h-auto"></svg>
    </div>
  );
};

export default Map;