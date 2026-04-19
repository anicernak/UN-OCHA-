'use client';

import React, { useState } from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';
import { scaleLinear } from 'd3-scale';
import type { MapDataRecord } from '@/lib/gap-rankings-shared';

// High-quality GeoJSON URL
const geoUrl = "https://raw.githubusercontent.com/lotusms/world-map-data/master/world.json";

// Color scale: Green (Safe) -> Yellow -> Red (Overlooked)
const colorScale = scaleLinear<string, string>()
  .domain([0, 40, 75]) 
  .range(["#22c55e", "#eab308", "#ef4444"]);

interface WorldMapProps {
  data: MapDataRecord[];
}

export default function WorldMap({ data }: WorldMapProps) {
  const [tooltip, setTooltip] = useState<string | null>(null);

  return (
    <div className="relative w-full h-[600px] bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">
      <div className="absolute top-4 left-4 z-10 bg-slate-900/80 p-4 rounded-lg border border-slate-700 backdrop-blur-md">
        <h3 className="text-white font-bold text-lg">Humanitarian Gap Map</h3>
        <p className="text-slate-400 text-sm">Darker red indicates more overlooked crises</p>
        <div className="flex items-center mt-3 gap-2">
            <div className="w-3 h-3 bg-[#22c55e] rounded-full"></div>
            <span className="text-xs text-slate-300">Well Funded</span>
            <div className="w-3 h-3 bg-[#ef4444] rounded-full ml-2"></div>
            <span className="text-xs text-slate-300">Overlooked</span>
        </div>
      </div>

      {tooltip && (
        <div className="absolute bottom-4 right-4 z-10 bg-indigo-600 text-white p-3 rounded-md shadow-lg text-sm font-medium animate-in fade-in slide-in-from-bottom-2">
          {tooltip}
        </div>
      )}

      <ComposableMap projectionConfig={{ scale: 145 }}>
        <ZoomableGroup center={[20, 0]} zoom={1}>
          <Geographies geography={geoUrl}>
            {({ geographies }: { geographies: any[] }) =>
              geographies.map((geo: any) => {
                const countryData = data.find((d) => d.iso3 === geo.properties.ISO_A3 || d.iso3 === geo.properties.ISO_A3_EH);
                const score = countryData ? countryData.overlooked_score : null;
                
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onMouseEnter={() => {
                      if (countryData) {
                        setTooltip(`${countryData.country}: Score ${countryData.overlooked_score}`);
                      } else {
                        setTooltip(geo.properties.NAME || geo.properties.name);
                      }
                    }}
                    onMouseLeave={() => setTooltip(null)}
                    fill={score !== null ? colorScale(score) : "#1e293b"}
                    stroke="#0f172a"
                    strokeWidth={0.5}
                    style={{
                      default: { outline: "none" },
                      hover: { fill: "#6366f1", outline: "none", cursor: "pointer", strokeWidth: 1 },
                      pressed: { outline: "none" },
                    }}
                  />
                );
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>
    </div>
  );
}
