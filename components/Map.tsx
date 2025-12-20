import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Location } from '../types';

interface MapProps {
  center: Location;
  markers?: Array<{ loc: Location; color: string; label: string }>;
  trackingHistory?: Location[];
  showRoute?: boolean;
}

const Map: React.FC<MapProps> = ({ center, markers = [], trackingHistory = [], showRoute = true }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedMarkerIdx, setSelectedMarkerIdx] = useState<number | null>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const width = 400;
    const height = 300;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Map Background
    svg.append("rect")
      .attr("width", width)
      .attr("height", height)
      .attr("fill", "#0F172A");

    // Static Grid lines
    for (let i = 0; i < 20; i++) {
      svg.append("line").attr("x1", i * 30).attr("y1", 0).attr("x2", i * 30).attr("y2", height).attr("stroke", "#ffffff").attr("stroke-width", 0.5).attr("opacity", 0.05);
      svg.append("line").attr("x1", 0).attr("y1", i * 30).attr("x2", width).attr("y2", i * 30).attr("stroke", "#ffffff").attr("stroke-width", 0.5).attr("opacity", 0.05);
    }

    const xScale = d3.scaleLinear().domain([center.lng - 0.04, center.lng + 0.04]).range([0, width]);
    const yScale = d3.scaleLinear().domain([center.lat - 0.04, center.lat + 0.04]).range([height, 0]);

    // Route Rendering
    if (showRoute && markers.length >= 2) {
      const lineGenerator = d3.line<Location>()
        .x(d => xScale(d.lng))
        .y(d => yScale(d.lat))
        .curve(d3.curveBasis);

      const proposedData: Location[] = [
        markers[0].loc,
        { lat: (markers[0].loc.lat + markers[1].loc.lat) / 2 + 0.003, lng: (markers[0].loc.lng + markers[1].loc.lng) / 2 - 0.003 },
        markers[1].loc
      ];

      svg.append("path")
        .datum(proposedData)
        .attr("fill", "none")
        .attr("stroke", "#B87333")
        .attr("stroke-width", 2)
        .attr("stroke-dasharray", "8,5")
        .attr("opacity", 0.5)
        .attr("d", lineGenerator);
    }

    // Historical Tracking Breadcrumbs
    if (trackingHistory && trackingHistory.length > 1) {
      const actualLineGenerator = d3.line<Location>()
        .x(d => xScale(d.lng))
        .y(d => yScale(d.lat))
        .curve(d3.curveLinear);

      svg.append("path")
        .datum(trackingHistory)
        .attr("fill", "none")
        .attr("stroke", "#1E40AF")
        .attr("stroke-width", 3)
        .attr("stroke-linecap", "round")
        .attr("d", actualLineGenerator);

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

    // Interactive Markers
    markers.forEach((m, idx) => {
      const isSelected = selectedMarkerIdx === idx;
      const g = svg.append("g")
        .attr("class", "cursor-pointer")
        .on("click", (event) => {
          event.stopPropagation();
          setSelectedMarkerIdx(idx);
        });
      
      // Marker Aura / Glow
      g.append("circle")
        .attr("cx", xScale(m.loc.lng))
        .attr("cy", yScale(m.loc.lat))
        .attr("r", isSelected ? 22 : 15)
        .attr("fill", m.color)
        .attr("opacity", isSelected ? 0.4 : 0.2)
        .append("animate")
        .attr("attributeName", "r")
        .attr("values", isSelected ? "18;26;18" : "10;30;10")
        .attr("dur", "3s")
        .attr("repeatCount", "indefinite");

      // Core Marker Icon
      g.append("circle")
        .attr("cx", xScale(m.loc.lng))
        .attr("cy", yScale(m.loc.lat))
        .attr("r", isSelected ? 9 : 7)
        .attr("fill", m.color)
        .attr("stroke", "#ffffff")
        .attr("stroke-width", isSelected ? 3 : 2);

      // Label above marker
      g.append("text")
        .attr("x", xScale(m.loc.lng))
        .attr("y", yScale(m.loc.lat) - (isSelected ? 24 : 18))
        .attr("text-anchor", "middle")
        .attr("font-size", isSelected ? "10px" : "8px")
        .attr("font-weight", "900")
        .attr("fill", isSelected ? "#ffffff" : "#94a3b8")
        .text(m.label);
    });

    // Deselect logic
    svg.on("click", () => {
      setSelectedMarkerIdx(null);
    });

  }, [center, markers, trackingHistory, showRoute, selectedMarkerIdx]);

  const selectedMarker = selectedMarkerIdx !== null ? markers[selectedMarkerIdx] : null;

  return (
    <div className="w-full bg-slate-950 overflow-hidden relative shadow-2xl border-y border-white/5">
      {/* Legend */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 pointer-events-none">
        <div className="bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)] animate-pulse"></div>
          <span className="text-[7px] font-black uppercase text-white tracking-widest italic">Node Monitoring Active</span>
        </div>
      </div>

      {/* Marker Detail Overlay */}
      {selectedMarker && (
        <div className="absolute bottom-4 left-4 right-4 z-[60] animate-slide-up pointer-events-auto">
          <div className="bg-slate-900/95 backdrop-blur-xl border border-white/10 p-5 rounded-[28px] shadow-2xl flex items-center justify-between ring-1 ring-white/20">
            <div className="flex items-center gap-4">
              <div 
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg transform rotate-3"
                style={{ backgroundColor: selectedMarker.color }}
              >
                <i className="fa-solid fa-location-dot text-lg"></i>
              </div>
              <div>
                <h4 className="text-[11px] font-black uppercase text-white tracking-tight italic">
                  {selectedMarker.label}
                </h4>
                <div className="flex flex-col gap-0.5 mt-1">
                   <span className="text-[8px] font-bold text-slate-500 uppercase flex items-center gap-1">
                      <i className="fa-solid fa-crosshairs text-[6px]"></i> LAT {selectedMarker.loc.lat.toFixed(6)}
                   </span>
                   <span className="text-[8px] font-bold text-slate-500 uppercase flex items-center gap-1">
                      <i className="fa-solid fa-crosshairs text-[6px]"></i> LNG {selectedMarker.loc.lng.toFixed(6)}
                   </span>
                </div>
              </div>
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); setSelectedMarkerIdx(null); }}
              className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-colors border border-white/5"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
        </div>
      )}

      <svg ref={svgRef} viewBox="0 0 400 300" className="w-full h-auto cursor-crosshair"></svg>
    </div>
  );
};

export default Map;