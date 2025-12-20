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
  const [copyFeedback, setCopyFeedback] = useState(false);

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
        .attr("r", isSelected ? 24 : 15)
        .attr("fill", m.color)
        .attr("opacity", isSelected ? 0.5 : 0.2)
        .append("animate")
        .attr("attributeName", "r")
        .attr("values", isSelected ? "20;28;20" : "10;30;10")
        .attr("dur", isSelected ? "1.5s" : "3s")
        .attr("repeatCount", "indefinite");

      // Core Marker Icon
      g.append("circle")
        .attr("cx", xScale(m.loc.lng))
        .attr("cy", yScale(m.loc.lat))
        .attr("r", isSelected ? 10 : 7)
        .attr("fill", m.color)
        .attr("stroke", "#ffffff")
        .attr("stroke-width", isSelected ? 4 : 2)
        .style("filter", isSelected ? "drop-shadow(0 0 8px rgba(255,255,255,0.5))" : "none");

      // Label above marker
      g.append("text")
        .attr("x", xScale(m.loc.lng))
        .attr("y", yScale(m.loc.lat) - (isSelected ? 28 : 18))
        .attr("text-anchor", "middle")
        .attr("font-size", isSelected ? "11px" : "8px")
        .attr("font-weight", "900")
        .attr("fill", isSelected ? "#ffffff" : "#94a3b8")
        .attr("class", "uppercase tracking-tighter italic")
        .text(m.label);
    });

    // Deselect logic
    svg.on("click", () => {
      setSelectedMarkerIdx(null);
    });

  }, [center, markers, trackingHistory, showRoute, selectedMarkerIdx]);

  const selectedMarker = selectedMarkerIdx !== null ? markers[selectedMarkerIdx] : null;

  const handleCopyCoords = () => {
    if (!selectedMarker) return;
    const coords = `${selectedMarker.loc.lat.toFixed(6)}, ${selectedMarker.loc.lng.toFixed(6)}`;
    navigator.clipboard.writeText(coords);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  return (
    <div className="w-full bg-slate-950 overflow-hidden relative shadow-2xl border-y border-white/5 group">
      {/* Map Legend & Status */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 pointer-events-none">
        <div className="bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2 shadow-lg">
          <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)] animate-pulse"></div>
          <span className="text-[7px] font-black uppercase text-white tracking-widest italic">Live Node Monitoring</span>
        </div>
      </div>

      {/* Detail Overlay Card */}
      {selectedMarker && (
        <div className="absolute bottom-4 left-4 right-4 z-[60] animate-slide-up pointer-events-auto">
          <div className="bg-slate-900/95 backdrop-blur-2xl border border-white/10 p-5 rounded-[32px] shadow-2xl ring-1 ring-white/20 overflow-hidden relative">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-32 h-32 opacity-20 blur-3xl rounded-full translate-x-10 -translate-y-10" style={{ backgroundColor: selectedMarker.color }}></div>
            
            <div className="flex items-start justify-between relative z-10">
              <div className="flex items-center gap-4">
                <div 
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-xl transform rotate-3 border-2 border-white/20"
                  style={{ backgroundColor: selectedMarker.color }}
                >
                  <i className="fa-solid fa-satellite-dish text-xl"></i>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-[12px] font-black uppercase text-white tracking-tight italic">
                      {selectedMarker.label}
                    </h4>
                    <span className="bg-emerald-500/20 text-emerald-500 text-[7px] font-black px-1.5 py-0.5 rounded-full uppercase border border-emerald-500/20">Online</span>
                  </div>
                  
                  <div className="flex flex-col gap-1 mt-2">
                    <div className="flex items-center gap-3">
                       <span className="text-[8.5px] font-black text-slate-400 uppercase flex items-center gap-1.5">
                          <i className="fa-solid fa-location-crosshairs text-blue-500"></i> {selectedMarker.loc.lat.toFixed(6)} N
                       </span>
                       <span className="text-[8.5px] font-black text-slate-400 uppercase flex items-center gap-1.5">
                          <i className="fa-solid fa-location-crosshairs text-blue-500"></i> {selectedMarker.loc.lng.toFixed(6)} E
                       </span>
                    </div>
                    <p className="text-[7px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Last Signal: Just Now • Precision: <span className="text-white">±2m</span></p>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col gap-2">
                <button 
                  onClick={(e) => { e.stopPropagation(); setSelectedMarkerIdx(null); }}
                  className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-all border border-white/5 hover:bg-white/10"
                >
                  <i className="fa-solid fa-xmark text-sm"></i>
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleCopyCoords(); }}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all border ${copyFeedback ? 'bg-emerald-500/20 border-emerald-500 text-emerald-500' : 'bg-white/5 border-white/5 text-slate-400 hover:text-blue-400 hover:bg-white/10'}`}
                >
                  <i className={`fa-solid ${copyFeedback ? 'fa-check' : 'fa-copy'} text-sm`}></i>
                </button>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="mt-4 pt-4 border-t border-white/5 flex gap-2">
               <button className="flex-1 bg-white/5 hover:bg-white/10 text-[9px] font-black uppercase tracking-widest py-2.5 rounded-xl border border-white/5 transition-colors italic">View Link History</button>
               <button className="flex-1 bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest py-2.5 rounded-xl shadow-lg shadow-blue-600/20 active:scale-95 transition-all italic">Ping Node</button>
            </div>
          </div>
        </div>
      )}

      <svg ref={svgRef} viewBox="0 0 400 300" className="w-full h-auto cursor-crosshair touch-none"></svg>
      
      {/* Zoom / Interaction Indicator */}
      <div className="absolute top-1/2 right-4 -translate-y-1/2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <div className="w-1 h-8 bg-white/10 rounded-full relative overflow-hidden">
          <div className="absolute top-1/4 left-0 right-0 h-1/2 bg-blue-500 rounded-full"></div>
        </div>
      </div>
    </div>
  );
};

export default Map;