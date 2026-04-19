"use client";

import { useMemo, useState } from "react";

import { scaleLinear } from "d3-scale";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from "react-simple-maps";

import type { GapRankingRecord, GapRankingSelection } from "@/lib/gap-rankings-shared";

const geoUrl = "https://raw.githubusercontent.com/lotusms/world-map-data/master/world.json";

type GeographyProperties = {
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
  includeTemporalFactor: GapRankingSelection["includeTemporalFactor"];
};

function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
    minimumFractionDigits: 0,
  }).format(value);
}

function createHeatScale(maxGapScore: number) {
  return scaleLinear<string>()
    .domain([0, Math.max(maxGapScore * 0.35, 1), Math.max(maxGapScore, 1)])
    .range(["#fee2e2", "#f87171", "#7f1d1d"]);
}

export default function WorldMap({
  rankings,
  selectedCategory,
  includeTemporalFactor,
}: WorldMapProps) {
  const [tooltip, setTooltip] = useState<string | null>(null);

  const rankingsByIso3 = useMemo(() => {
    return new Map(rankings.map((row) => [row.iso3, row]));
  }, [rankings]);

  const maxGapScore = useMemo(() => {
    return rankings.reduce((currentMax, row) => Math.max(currentMax, row.gapScore), 0);
  }, [rankings]);

  const heatScale = useMemo(() => createHeatScale(maxGapScore), [maxGapScore]);

  return (
    <div className="relative h-[600px] w-full overflow-hidden rounded-2xl border border-stone-900/10 bg-[#170f0f] shadow-[0_24px_80px_rgba(72,50,22,0.18)]">
      <div className="absolute left-4 top-4 z-10 rounded-xl border border-red-950/40 bg-stone-950/80 p-4 backdrop-blur-md">
        <h3 className="text-lg font-bold text-stone-50">Humanitarian Heatmap</h3>
        <p className="mt-1 max-w-sm text-sm text-stone-300">
          Category <strong>{selectedCategory}</strong> with temporal factor{" "}
          <strong>{includeTemporalFactor}</strong>.
        </p>
        <p className="mt-1 text-sm text-stone-400">
          Darker red marks higher uncovered need in the current table results.
        </p>
        <div className="mt-3 flex items-center gap-2 text-xs text-stone-300">
          <div className="h-3 w-3 rounded-full bg-[#fee2e2]" />
          <span>Lower</span>
          <div className="ml-2 h-3 w-3 rounded-full bg-[#f87171]" />
          <span>Higher</span>
          <div className="ml-2 h-3 w-3 rounded-full bg-[#7f1d1d]" />
          <span>Highest</span>
        </div>
      </div>

      {tooltip && (
        <div className="absolute bottom-4 right-4 z-10 max-w-xs rounded-md bg-red-700 px-4 py-3 text-sm font-medium text-white shadow-lg">
          {tooltip}
        </div>
      )}

      <ComposableMap projectionConfig={{ scale: 145 }}>
        <ZoomableGroup center={[20, 0]} zoom={1}>
          <Geographies geography={geoUrl}>
            {({ geographies }: { geographies: GeographyFeature[] }) =>
              geographies.map((geo) => {
                const iso3 = geo.properties.ISO_A3 ?? geo.properties.ISO_A3_EH ?? "";
                const countryRanking = rankingsByIso3.get(iso3);
                const fill = countryRanking ? heatScale(countryRanking.gapScore) : "#2a1c1c";

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onMouseEnter={() => {
                      if (countryRanking) {
                        setTooltip(
                          `${countryRanking.countryName}: ${formatCompactNumber(countryRanking.gapScore)} uncovered people`,
                        );
                        return;
                      }

                      setTooltip(geo.properties.NAME || geo.properties.name || "Unknown");
                    }}
                    onMouseLeave={() => setTooltip(null)}
                    fill={fill}
                    stroke="#120c0c"
                    strokeWidth={0.6}
                    style={{
                      default: { outline: "none" },
                      hover: {
                        fill: countryRanking ? "#991b1b" : "#3b2a2a",
                        outline: "none",
                        cursor: "pointer",
                        strokeWidth: 1,
                      },
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
