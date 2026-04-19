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
  includeTemporalFactor: GapRankingSelection["includeTemporalFactor"];
};

const alpha2ToIso3: Record<string, string> = {
  AF: "AFG",
  BF: "BFA",
  CF: "CAF",
  CM: "CMR",
  CO: "COL",
  GT: "GTM",
  HN: "HND",
  HT: "HTI",
  ML: "MLI",
  MM: "MMR",
  MZ: "MOZ",
  NE: "NER",
  NG: "NGA",
  SD: "SDN",
  SV: "SLV",
  SO: "SOM",
  SS: "SSD",
  TD: "TCD",
  UA: "UKR",
  VE: "VEN",
  YE: "YEM",
  CD: "COD",
};

const countryNameToIso3: Record<string, string> = {
  afghanistan: "AFG",
  "burkina faso": "BFA",
  cameroon: "CMR",
  chad: "TCD",
  colombia: "COL",
  "central african republic": "CAF",
  "democratic republic of the congo": "COD",
  "dem. rep. congo": "COD",
  "dr congo": "COD",
  "el salvador": "SLV",
  guatemala: "GTM",
  haiti: "HTI",
  honduras: "HND",
  mali: "MLI",
  myanmar: "MMR",
  mozambique: "MOZ",
  niger: "NER",
  nigeria: "NGA",
  somalia: "SOM",
  "south sudan": "SSD",
  sudan: "SDN",
  ukraine: "UKR",
  venezuela: "VEN",
  yemen: "YEM",
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

function normalizeCountryName(value: string) {
  return value.trim().toLowerCase();
}

function getRankingIso3(properties: GeographyProperties) {
  const alpha2 = properties["Alpha-2"]?.trim().toUpperCase();

  if (alpha2 && alpha2ToIso3[alpha2]) {
    return alpha2ToIso3[alpha2];
  }

  const iso3 = properties.ISO_A3?.trim().toUpperCase() ?? properties.ISO_A3_EH?.trim().toUpperCase();

  if (iso3) {
    return iso3;
  }

  const countryName = properties.NAME ?? properties.name;

  if (countryName) {
    return countryNameToIso3[normalizeCountryName(countryName)] ?? "";
  }

  return "";
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
                const iso3 = getRankingIso3(geo.properties);
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
