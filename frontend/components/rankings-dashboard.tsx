"use client";

import { useMemo, useState, useId } from "react";

import { RankingsTable } from "@/components/rankings-table";
import WorldMap from "@/components/WorldMap";
import type {
  GapRankingCatalog,
  GapRankingSelection,
} from "@/lib/gap-rankings-shared";
import { getSelectionKey } from "@/lib/gap-rankings-shared";
import { AlertCircle, Info } from "lucide-react";

const DEFAULT_THRESHOLD = 5_000_000;

function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
    minimumFractionDigits: 0,
  }).format(value);
}

const FilterInfo = ({ title, description, math, assumptions, dataSource }: { 
    title: string; 
    description: string;
    math: string; 
    assumptions: string;
    dataSource: string;
}) => {
    const [open, setOpen] = useState(false);
    return (
        <div className="relative inline-block ml-2">
            <button 
                onMouseEnter={() => setOpen(true)} 
                onMouseLeave={() => setOpen(false)} 
                className="text-slate-500 hover:text-indigo-400 transition-colors"
                aria-label="Filter information"
            >
                <Info size={14} />
            </button>
            {open && (
                <div className="absolute left-0 bottom-full mb-3 z-50 w-80 p-5 bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl text-xs text-slate-200 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200">
                    <p className="font-bold text-white mb-3 text-sm border-b border-slate-700 pb-2">{title}</p>
                    <div className="space-y-3">
                        <p>{description}</p>
                        <p><span className="text-indigo-400 font-mono font-bold">Logic:</span> {math}</p>
                        <p><span className="text-amber-400 font-bold">Assumption:</span> {assumptions}</p>
                        <p className="pt-2 text-[10px] text-slate-500 italic">Source: {dataSource}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

type RankingsDashboardProps = {
  catalog: GapRankingCatalog;
};

export function RankingsDashboard({ catalog }: RankingsDashboardProps) {
  const [threshold, setThreshold] = useState(DEFAULT_THRESHOLD);
  const [selectedCategory, setSelectedCategory] = useState(
    catalog.categories[0] ?? "ALL",
  );
  const [includeTemporalFactor, setIncludeTemporalFactor] =
    useState<GapRankingSelection["includeTemporalFactor"]>("Yes");

  const thresholdId = useId();
  const categoryId = useId();
  const temporalId = useId();

  const selectedRankings = useMemo(() => {
    const preferredSelection = getSelectionKey({
      crisisCategory: selectedCategory,
      includeTemporalFactor,
    });

    return (
      catalog.rankingsBySelection[preferredSelection] ??
      catalog.rankingsBySelection[
        getSelectionKey({
          crisisCategory: selectedCategory,
          includeTemporalFactor: "No",
        })
      ] ??
      []
    );
  }, [catalog.rankingsBySelection, includeTemporalFactor, selectedCategory]);

  const filteredRankings = useMemo(() => {
    return selectedRankings
      .filter((row) => row.gapScore >= threshold)
      .sort((a, b) => b.gapScore - a.gapScore);
  }, [selectedRankings, threshold]);

  return (
    <div className="flex flex-col gap-8">
      {/* Filters in Blue Theme */}
      <section className="bg-slate-900 border border-slate-800 rounded-[2rem] p-8 shadow-2xl">
        <div className="flex flex-col gap-6">
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-indigo-500">
              Strategy & Thresholds
            </p>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl text-white">
              Filter Parameters
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center">
                <span className="text-sm font-semibold text-slate-300">
                    Crisis category
                </span>
                <FilterInfo 
                    title="Crisis Category Logic"
                    description="Filters the dataset to focus on specific types of humanitarian emergencies."
                    math="Display = { Crisis | Type == Selection }"
                    assumptions="Each crisis is assigned one primary category based on OCHA reporting, though many are multi-faceted."
                    dataSource="OCHA Situation Reports and INFORM Severity Index."
                />
              </div>
              <select
                id={categoryId}
                value={selectedCategory}
                onChange={(event) => setSelectedCategory(event.currentTarget.value)}
                className="w-full rounded-xl bg-slate-800 border border-slate-700 p-3 text-white outline-none focus:ring-2 ring-indigo-500 transition"
              >
                {catalog.categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center">
                <span className="text-sm font-semibold text-slate-300">
                    Include temporal factor
                </span>
                <FilterInfo 
                    title="Temporal Weighting"
                    description="Adjusts priority based on how long a crisis has been consistently underfunded."
                    math="Score (Adj) = Base Gap * (1 + Trend Coefficient)"
                    assumptions="Historical neglect is a leading indicator of current vulnerability and structural gaps."
                    dataSource="Financial Tracking Service (FTS) multi-year data (2023-2026)."
                />
              </div>
              <select
                id={temporalId}
                value={includeTemporalFactor}
                onChange={(event) =>
                  setIncludeTemporalFactor(
                    event.currentTarget.value as GapRankingSelection["includeTemporalFactor"],
                  )
                }
                className="w-full rounded-xl bg-slate-800 border border-slate-700 p-3 text-white outline-none focus:ring-2 ring-indigo-500 transition"
              >
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center">
              <span className="text-sm font-semibold text-slate-300">
                Minimum uncovered people: <strong className="text-indigo-400">{formatCompactNumber(threshold)}</strong>
              </span>
              <FilterInfo 
                    title="Materiality Threshold"
                    description="Sets a floor for the scale of population need to prioritize high-impact strategic responses."
                    math="Result = { Crisis | PIN - Reached >= Slider Value }"
                    assumptions="Focuses analysis on crises where the sheer volume of uncovered people requires immediate global intervention."
                    dataSource="Humanitarian Needs Overview (HNO) 2025 Targets."
                />
            </div>
            <input
              id={thresholdId}
              type="range"
              min={0}
              max={25000000}
              step={100000}
              value={threshold}
              onChange={(event) =>
                setThreshold(Number(event.currentTarget.value) || 0)
              }
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>
        </div>
      </section>

      <section className="w-full">
        <WorldMap
          rankings={filteredRankings}
          selectedCategory={selectedCategory}
          includeTemporalFactor={includeTemporalFactor}
        />
      </section>

      <div className="bg-indigo-900/20 border border-indigo-900/30 p-4 rounded-2xl flex items-center gap-3">
          <AlertCircle className="text-indigo-400" size={20} />
          <p className="text-indigo-200 text-sm italic">
            Displaying <strong>{filteredRankings.length}</strong> crises matching your criteria.
          </p>
      </div>

      <RankingsTable
        rankings={filteredRankings}
      />
    </div>
  );
}
