
import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Location, SavedNode } from '../types';

interface MapProps {
  center: Location;
  markers?: Array<{ loc: Location; color: string; label: string; isLive?: boolean; id?: string }>;
  activeMissions?: Array<{ from: Location; to: Location; id: string }>;
  trackingHistory?: Location[];
  showRoute?: boolean;
  onSaveNode?: (node: SavedNode) => void;
}

const Map: React.FC<MapProps> = ({ center, markers = [], activeMissions = [], trackingHistory = [], showRoute = true, onSaveNode }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedMarkerIdx, setSelectedMarkerIdx] = useState<number | null>(null);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 2000);
    return () => clearInterval(timer);
  }, []);

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

    // Dynamic Grid (subtle parallax-ish grid)
    const gridG = svg.append("g").attr("opacity", 0.05);
    for (let i = 0; i < 20; i++) {
      gridG.append("line").attr("x1", i * 30).attr("y1", 0).attr("x2", i * 30).attr("y2", height).attr("stroke", "#ffffff").attr("stroke-width", 0.5);
      gridG.append("line").attr("x1", 0).attr("y1", i * 30).attr("x2", width).attr("y2", i * 30).attr("stroke", "#ffffff").attr("stroke-width", 0.5);
    }

    const xScale = d3.scaleLinear().domain([center.lng - 0.04, center.lng + 0.04]).range([0, width]);
    const yScale = d3.scaleLinear().domain([center.lat - 0.04, center.lat + 0.04]).range([height, 0]);

    // Active Mission Vectors (Connections between customer and provider)
    activeMissions.forEach(mission => {
      const x1 = xScale(mission.from.lng);
      const y1 = yScale(mission.from.lat);
      const x2 = xScale(mission.to.lng);
      const y2 = yScale(mission.to.lat);

      // Gradient for mission line
      const gradId = `grad-${mission.id}`;
      const defs = svg.append("defs");
      const linearGradient = defs.append("linearGradient")
          .attr("id", gradId)
          .attr("x1", x1)
          .attr("y1", y1)
          .attr("x2", x2)
          .attr("y2", y2)
          .attr("gradientUnits", "userSpaceOnUse");

      linearGradient.append("stop").attr("offset", "0%").attr("stop-color", "#3b82f6");
      linearGradient.append("stop").attr("offset", "100%").attr("stop-color", "#06b6d4");

      const line = svg.append("line")
        .attr("x1", x1)
        .attr("y1", y1)
        .attr("x2", x2)
        .attr("y2", y2)
        .attr("stroke", `url(#${gradId})`)
        .attr("stroke-width", 2)
        .attr("stroke-dasharray", "4,4")
        .attr("opacity", 0.6);

      line.append("animate")
        .attr("attributeName", "stroke-dashoffset")
        .attr("from", "20")
        .attr("to", "0")
        .attr("dur", "1s")
        .attr("repeatCount", "indefinite");
    });

    // Standard Route Rendering (History)
    if (showRoute && trackingHistory.length > 1) {
      const lineGenerator = d3.line<Location>()
        .x(d => xScale(d.lng))
        .y(d => yScale(d.lat))
        .curve(d3.curveBasis);

      svg.append("path")
        .datum(trackingHistory)
        .attr("fill", "none")
        .attr("stroke", "#ffffff")
        .attr("stroke-width", 1)
        .attr("opacity", 0.2)
        .attr("d", lineGenerator);
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
      
      const markerX = xScale(m.loc.lng);
      const markerY = yScale(m.loc.lat);

      // Marker Glow
      const glow = g.append("circle")
        .attr("cx", markerX)
        .attr("cy", markerY)
        .attr("r", isSelected ? 24 : 15)
        .attr("fill", m.color)
        .attr("opacity", isSelected ? 0.5 : 0.2);

      if (m.isLive) {
        glow.append("animate")
          .attr("attributeName", "r")
          .attr("values", `${isSelected ? 24 : 15};${isSelected ? 35 : 22};${isSelected ? 24 : 15}`)
          .attr("dur", "2s")
          .attr("repeatCount", "indefinite");
      }

      // Core Marker
      g.append("circle")
        .attr("cx", markerX)
        .attr("cy", markerY)
        .attr("r", isSelected ? 10 : 6)
        .attr("fill", m.color)
        .attr("stroke", "#ffffff")
        .attr("stroke-width", isSelected ? 3 : 1.5);

      // Status indicator for Live Agents
      if (m.isLive) {
        g.append("circle")
          .attr("cx", markerX + 4)
          .attr("cy", markerY - 4)
          .attr("r", 2.5)
          .attr("fill", "#10b981")
          .attr("stroke", "#0F172A")
          .attr("stroke-width", 0.5);
      }

      // Label
      g.append("text")
        .attr("x", markerX)
        .attr("y", markerY - (isSelected ? 28 : 16))
        .attr("text-anchor", "middle")
        .attr("font-size", isSelected ? "10px" : "7px")
        .attr("font-weight", "900")
        .attr("fill", "#ffffff")
        .attr("class", "uppercase italic tracking-tighter")
        .text(m.label);
    });

    svg.on("click", () => setSelectedMarkerIdx(null));

  }, [center, markers, activeMissions, trackingHistory, showRoute, selectedMarkerIdx, tick]);

  const selectedMarker = selectedMarkerIdx !== null ? markers[selectedMarkerIdx] : null;

  const handleCopyCoords = () => {
    if (!selectedMarker) return;
    const coords = `${selectedMarker.loc.lat.toFixed(6)}, ${selectedMarker.loc.lng.toFixed(6)}`;
    navigator.clipboard.writeText(coords);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  const handleSaveNodeAction = () => {
    if (!selectedMarker || !onSaveNode) return;
    onSaveNode({
      id: 'node-' + Math.random().toString(36).substr(2, 5).toUpperCase(),
      name: selectedMarker.label || 'Saved Node',
      icon: 'fa-solid fa-location-dot',
      loc: selectedMarker.loc
    });
    setSelectedMarkerIdx(null);
  };

  return (
    <div className="w-full bg-slate-950 overflow-hidden relative shadow-2xl border-y border-white/5">
      {selectedMarker && (
        <div className="absolute bottom-4 left-4 right-4 z-[60] animate-slide-up">
          <div className="bg-slate-900/95 backdrop-blur-2xl border border-white/10 p-5 rounded-[32px] shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: selectedMarker.color }}>
                  <i className="fa-solid fa-location-dot"></i>
                </div>
                <div>
                  <h4 className="text-[12px] font-black uppercase text-white tracking-tight italic">{selectedMarker.label}</h4>
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{selectedMarker.loc.lat.toFixed(4)}, {selectedMarker.loc.lng.toFixed(4)}</p>
                </div>
              </div>
              <button onClick={() => setSelectedMarkerIdx(null)} className="text-slate-400 hover:text-white"><i className="fa-solid fa-xmark"></i></button>
            </div>
            <div className="flex gap-2">
               <button 
                onClick={handleSaveNodeAction}
                className="flex-1 bg-white/5 hover:bg-white/10 text-[9px] font-black uppercase tracking-widest py-3 rounded-xl border border-white/5 transition-colors italic flex items-center justify-center gap-2 text-white"
               >
                 <i className="fa-solid fa-bookmark"></i> Save Node
               </button>
               <button 
                onClick={handleCopyCoords}
                className={`flex-1 text-[9px] font-black uppercase tracking-widest py-3 rounded-xl transition-all border italic ${copyFeedback ? 'bg-emerald-600/20 text-emerald-500 border-emerald-500' : 'bg-blue-600/10 text-blue-500 border-blue-600/20'}`}
               >
                 {copyFeedback ? 'Copied!' : 'Copy Coords'}
               </button>
            </div>
          </div>
        </div>
      )}
      <svg ref={svgRef} viewBox="0 0 400 300" className="w-full h-auto cursor-crosshair touch-none"></svg>
    </div>
  );
};

export default Map;
