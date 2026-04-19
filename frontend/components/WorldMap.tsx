"use client";

import { useMemo, useState } from "react";
import { scaleLinear } from "d3-scale";
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";
import type { GapRankingRecord, GapRankingSelection } from "@/lib/gap-rankings-shared";

const geoUrl = "https://raw.githubusercontent.com/lotusms/world-map-data/master/world.json";

type GeographyProperties = {
  "Alpha-2"?: string;
  ISO_A3?: string;
  ISO_A3_EH?: string;
  NAME?: string;
  name?: string;
};

type GeographyFeature = {
  rsmKey: string;
  properties: GeographyProperties;
};

type WorldMapProps = {
  rankings: GapRankingRecord[];
  selectedCategory: string;
  selectedDemographic: string;
  temporalMode: GapRankingSelection["temporalMode"];
  threshold: number;
};

const alpha2ToIso3: Record<string, string> = {
  AF: "AFG", BF: "BFA", CF: "CAF", CM: "CMR", CO: "COL", GT: "GTM", HN: "HND", HT: "HTI",
  ML: "MLI", MM: "MMR", MZ: "MOZ", NE: "NER", NG: "NGA", SD: "SDN", SV: "SLV", SO: "SOM",
  SS: "SSD", TD: "TCD", UA: "UKR", VE: "VEN", YE: "YEM", CD: "COD",
};

const countryNameToIso3: Record<string, string> = {
  afghanistan: "AFG", "burkina faso": "BFA", cameroon: "CMR", chad: "TCD", colombia: "COL",
  "central african republic": "CAF", "democratic republic of the congo": "COD",
  "dem. rep. congo": "COD", "dr congo": "COD", "el salvador": "SLV", guatemala: "GTM",
  haiti: "HTI", honduras: "HND", mali: "MLI", myanmar: "MMR", mozambique: "MOZ",
  niger: "NER", nigeria: "NGA", somalia: "SOM", "south sudan": "SSD", sudan: "SDN",
  ukraine: "UKR", venezuela: "VEN", yemen: "YEM",
};

function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

function getRankingIso3(properties: GeographyProperties) {
  const iso3 = properties.ISO_A3?.trim().toUpperCase() ?? properties.ISO_A3_EH?.trim().toUpperCase();
  if (iso3) return iso3;
  const alpha2 = properties["Alpha-2"]?.trim().toUpperCase();
  if (alpha2 && alpha2ToIso3[alpha2]) return alpha2ToIso3[alpha2];
  const name = properties.NAME ?? properties.name;
  if (name) return countryNameToIso3[name.toLowerCase()] ?? "";
  return "";
}

export default function WorldMap({ rankings, selectedCategory, threshold }: WorldMapProps) {
  const [hoverData, setHoverData] = useState<GapRankingRecord | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const rankingsByIso3 = useMemo(() => new Map(rankings.map((row) => [row.iso3, row])), [rankings]);
  const maxGapScore = useMemo(() => rankings.reduce((max, row) => Math.max(max, row.gapScore), 0), [rankings]);
  
  // HEAT SCALE: Indigo (Low Priority) -> Red (High Priority)
  const heatScale = useMemo(() => {
      const upper = Math.max(maxGapScore, 1);
      return scaleLinear<string>()
        .domain([0, upper * 0.35, upper])
        .range(["#312e81", "#991b1b", "#ef4444"]);
  }, [maxGapScore]);

  return (
    <div className="relative h-[650px] w-full overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl"
         onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}>
      
      {/* LEGEND */}
      <div className="absolute left-6 top-6 z-10 rounded-2xl border border-slate-700 bg-slate-900/90 p-5 backdrop-blur-xl shadow-2xl">
        <h3 className="text-sm font-black text-white uppercase tracking-widest mb-1">Humanitarian Gap</h3>
        <p className="text-[10px] text-slate-400 font-bold uppercase mb-4 tracking-tighter">Weighted Mismatch Index (WMI)</p>
        
        <div className="space-y-3">
            <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-[#ef4444] shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                <span className="text-[11px] font-bold text-slate-200">Critical Priority</span>
            </div>
            <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-[#991b1b]" />
                <span className="text-[11px] font-bold text-slate-300">High Concern</span>
            </div>
            <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-[#312e81]" />
                <span className="text-[11px] font-bold text-slate-400">Baseline / Tracked</span>
            </div>
        </div>

        <div className="mt-5 pt-4 border-t border-slate-800">
            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Context</p>
            <p className="text-[11px] text-slate-300 mt-1 leading-tight">
                Current Filter: <span className="text-white">{selectedCategory}</span><br/>
                Threshold: <span className="text-white">{formatCompactNumber(threshold)}</span>
            </p>
        </div>
      </div>

      {/* RICH TOOLTIP POPUP */}
      {hoverData && (
        <div 
            className="fixed z-50 pointer-events-none bg-slate-900/95 border border-slate-700 p-5 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl max-w-sm animate-in fade-in zoom-in-95 duration-200"
            style={{ left: mousePos.x + 20, top: mousePos.y - 20 }}
        >
          <div className="border-b border-slate-700 pb-3 mb-3">
            <h3 className="text-xl font-black text-white">{hoverData.countryName}</h3>
            <div className="flex gap-2 mt-1">
                {hoverData.details?.drivers.slice(0, 2).map(d => (
                    <span key={d} className="text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-500/30">{d}</span>
                ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">In Need</p>
                <p className="text-lg font-bold text-white">{formatCompactNumber(hoverData.peopleInNeed)}</p>
            </div>
            <div>
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest text-right">Targeted</p>
                <p className="text-lg font-bold text-white text-right">{formatCompactNumber(hoverData.details?.metrics.targeted || 0)}</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                    <span className="text-emerald-400">Reached (% of Target)</span>
                    <span className="text-slate-400">{hoverData.details?.metrics.reached_pct_of_target}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(hoverData.details?.metrics.reached_pct_of_target || 0, 100)}%` }} />
                </div>
                <p className="text-[10px] text-slate-500 italic mt-1 text-right">Actual Reached: {formatCompactNumber(hoverData.details?.metrics.reached || 0)}</p>
            </div>

            <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl mt-4">
                <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold uppercase text-red-400 tracking-widest">Uncovered (% of Total Need)</span>
                    <span className="text-xs font-black text-red-500">{hoverData.details?.metrics.uncovered_pct_of_need}%</span>
                </div>
                <p className="text-xl font-black text-white mt-1">{formatCompactNumber(hoverData.details?.metrics.uncovered_num || 0)} <span className="text-xs font-normal text-slate-400 ml-1">Left Behind</span></p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 space-y-3">
            <div className="flex justify-between items-center bg-indigo-500/10 p-2 rounded-lg">
                <span className="text-[10px] font-bold uppercase text-indigo-400">Current WMI</span>
                <span className="text-sm font-black text-white">{formatCompactNumber(hoverData.gapScore)}</span>
            </div>
            <div>
                <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Active Clusters</p>
                <p className="text-[11px] text-slate-300 leading-relaxed italic line-clamp-1">{hoverData.details?.clusters.join(', ') || 'N/A'}</p>
            </div>
          </div>
        </div>
      )}

      <ComposableMap projectionConfig={{ scale: 145 }}>
        <ZoomableGroup center={[20, 0]} zoom={1}>
          <Geographies geography={geoUrl}>
            {({ geographies }: { geographies: GeographyFeature[] }) =>
              geographies.map((geo) => {
                const iso3 = getRankingIso3(geo.properties);
                const countryRanking = rankingsByIso3.get(iso3);
                const fill = countryRanking ? heatScale(countryRanking.gapScore) : "#1e293b";

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onMouseEnter={() => countryRanking && setHoverData(countryRanking)}
                    onMouseLeave={() => setHoverData(null)}
                    fill={fill}
                    stroke="#0f172a"
                    strokeWidth={0.6}
                    style={{
                      default: { outline: "none" },
                      hover: { fill: countryRanking ? "#4f46e5" : "#334155", outline: "none", cursor: "pointer", strokeWidth: 1 },
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
