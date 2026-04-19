"use client";

import { useMemo, useState, useId } from "react";

import { InfoPopover } from "@/components/info-popover";
import { RankingsTable } from "@/components/rankings-table";
import WorldMap from "@/components/WorldMap";
import type {
  GapRankingCatalog,
  GapRankingSelection,
} from "@/lib/gap-rankings-shared";
import {
  getCategoryLabel,
  getDemographicLabel,
  getTemporalModeLabel,
  getSelectionKey,
} from "@/lib/gap-rankings-shared";
import { AlertCircle } from "lucide-react";

const DEFAULT_THRESHOLD = 0;

function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
    minimumFractionDigits: 0,
  }).format(value);
}

type RankingsDashboardProps = {
  catalog: GapRankingCatalog;
};

export function RankingsDashboard({ catalog }: RankingsDashboardProps) {
  const [threshold, setThreshold] = useState(DEFAULT_THRESHOLD);
  const [selectedCategory, setSelectedCategory] = useState(
    catalog.categories[0] ?? "ALL",
  );
  const [selectedDemographic, setSelectedDemographic] = useState(
    catalog.demographicCategories[0] ?? "ALL",
  );
  const [temporalMode, setTemporalMode] =
    useState<GapRankingSelection["temporalMode"]>("CURRENT_WMI");

  const thresholdId = useId();
  const categoryId = useId();
  const demographicId = useId();
  const temporalId = useId();

  const selectedRankings = useMemo(() => {
    const preferredSelection = getSelectionKey({
      crisisCategory: selectedCategory,
      temporalMode,
      demographicCategory: selectedDemographic,
    });

    return (
      catalog.rankingsBySelection[preferredSelection] ??
      catalog.rankingsBySelection[
        getSelectionKey({
          crisisCategory: selectedCategory,
          temporalMode: "CURRENT_WMI",
          demographicCategory: selectedDemographic,
        })
      ] ??
      catalog.rankingsBySelection[
        getSelectionKey({
          crisisCategory: selectedCategory,
          temporalMode,
          demographicCategory: "ALL",
        })
      ] ??
      catalog.rankingsBySelection[
        getSelectionKey({
          crisisCategory: selectedCategory,
          temporalMode: "CURRENT_WMI",
          demographicCategory: "ALL",
        })
      ] ??
      []
    );
  }, [catalog.rankingsBySelection, temporalMode, selectedCategory, selectedDemographic]);

  const maxWmi = useMemo(() => {
    return selectedRankings.reduce((max, row) => Math.max(max, row.gapScore), 0);
  }, [selectedRankings]);

  const sliderStep = useMemo(() => {
    if (maxWmi <= 100) {
      return 0.1;
    }

    if (maxWmi <= 1_000) {
      return 1;
    }

    if (maxWmi <= 100_000) {
      return 100;
    }

    return 10_000;
  }, [maxWmi]);

  const effectiveThreshold = useMemo(
    () => Math.min(threshold, Math.max(maxWmi, 0)),
    [maxWmi, threshold],
  );

  const filteredRankings = useMemo(() => {
    return selectedRankings
      .filter((row) => row.gapScore >= effectiveThreshold)
      .sort((a, b) => b.gapScore - a.gapScore);
  }, [effectiveThreshold, selectedRankings]);

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

          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <div className="flex items-center">
                <span className="text-sm font-semibold text-slate-300">
                    Crisis category
                </span>
                <div className="ml-2">
                  <InfoPopover title="Crisis Category" ariaLabel="Crisis category information">
                    <p>
                      This filter switches the ranking to the humanitarian cluster or crisis
                      category you want to inspect. It answers: which countries rise to the top
                      when we only look at this response area?
                    </p>
                    <p className="font-serif text-xs uppercase italic tracking-[0.18em] text-slate-400">
                      <span className="font-semibold uppercase tracking-[0.22em] text-amber-400 not-italic">Source:</span>{" "}
                      Humanitarian Needs Overview data; Humanitarian Response Plan data.
                    </p>
                  </InfoPopover>
                </div>
              </div>
              <select
                id={categoryId}
                value={selectedCategory}
                onChange={(event) => setSelectedCategory(event.currentTarget.value)}
                className="w-full rounded-xl bg-slate-800 border border-slate-700 p-3 text-white outline-none focus:ring-2 ring-indigo-500 transition"
              >
                {catalog.categories.map((category) => (
                  <option key={category} value={category}>
                    {getCategoryLabel(category)}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center">
                <span className="text-sm font-semibold text-slate-300">
                    Demographic category
                </span>
                <div className="ml-2">
                  <InfoPopover title="Demographic Category" ariaLabel="Demographic category information">
                    <p>
                      This filter changes whether the ranking is based on all people or a specific
                      demographic slice such as children, women, or men. A country can rank differently for a subgroup than it
                      does for the full population if need, targeting, or reach is unevenly
                      distributed.
                    </p>
                    <p className="font-serif text-xs uppercase italic tracking-[0.18em] text-slate-400">
                      <span className="font-semibold uppercase tracking-[0.22em] text-amber-400 not-italic">Source:</span>{" "}
                      Humanitarian Needs Overview data.
                    </p>
                  </InfoPopover>
                </div>
              </div>
              <select
                id={demographicId}
                value={selectedDemographic}
                onChange={(event) => setSelectedDemographic(event.currentTarget.value)}
                className="w-full rounded-xl bg-slate-800 border border-slate-700 p-3 text-white outline-none focus:ring-2 ring-indigo-500 transition"
              >
                {catalog.demographicCategories.map((demographic) => (
                  <option key={demographic} value={demographic}>
                    {getDemographicLabel(demographic)}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center">
                <span className="text-sm font-semibold text-slate-300">
                    Temporal view
                </span>
                <div className="ml-2">
                  <InfoPopover
                    title="Temporal View"
                    ariaLabel="Temporal view information"
                    width="min(44rem, calc(100vw - 2rem))"
                    align="end"
                  >
                    <p>
                      This filter decides whether you rank countries by the current mismatch only,
                      by a score that also takes persistent underfunding into account, or by the historical
                      neglect signal on its own.
                    </p>
                    <p>
                      <span className="font-mono font-bold text-indigo-400">Current WMI:</span>{" "}
                      <span className="mt-1 block font-mono">current_wmi</span>
                    </p>
                    <p>
                      <span className="font-mono font-bold text-indigo-400">Historical neglect only:</span>
                      <span className="mt-1 block font-mono">
                        current_wmi x (0.15 + 0.03 x consecutive_years_underfunded)
                      </span>
                    </p>
                    <p>
                      <span className="font-mono font-bold text-indigo-400">Current WMI + historical neglect:</span>
                      <span className="mt-1 block font-mono">
                        current_wmi x (1.15 + 0.03 x consecutive_years_underfunded)
                      </span>
                    </p>
                    <p>
                      Use current WMI for present-day imbalance, the blended mode for
                      crises that are severe now and repeatedly underfunded, and historical-only to
                      surface long-running neglect even when the current score is lower.
                    </p>
                    <p className="font-serif text-xs uppercase italic tracking-[0.18em] text-slate-400">
                      <span className="font-semibold uppercase tracking-[0.22em] text-amber-400 not-italic">Source:</span>{" "}
                      Humanitarian Needs Overview data; Global requirements and funding data.
                    </p>
                  </InfoPopover>
                </div>
              </div>
              <select
                id={temporalId}
                value={temporalMode}
                onChange={(event) =>
                  setTemporalMode(
                    event.currentTarget.value as GapRankingSelection["temporalMode"],
                  )
                }
                className="w-full rounded-xl bg-slate-800 border border-slate-700 p-3 text-white outline-none focus:ring-2 ring-indigo-500 transition"
              >
                <option value="CURRENT_WMI">{getTemporalModeLabel("CURRENT_WMI")}</option>
                <option value="WMI_PLUS_HISTORICAL_NEGLECT">{getTemporalModeLabel("WMI_PLUS_HISTORICAL_NEGLECT")}</option>
                <option value="HISTORICAL_NEGLECT_ONLY">{getTemporalModeLabel("HISTORICAL_NEGLECT_ONLY")}</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center">
              <span className="text-sm font-semibold text-slate-300">
                Minimum WMI: <strong className="text-indigo-400">{formatCompactNumber(effectiveThreshold)}</strong>
              </span>
              <div className="ml-2">
                <InfoPopover title="Minimum WMI Threshold" ariaLabel="Minimum WMI threshold information" width="min(40rem, calc(100vw - 2rem))">
                  <p>
                    This slider removes lower-scoring countries from the map and table so you can
                    concentrate on the most acute mismatches.
                  </p>
                  <p>
                    Raising the slider does not change the formula, it only increases
                    the bar for what counts as strategically important enough to remain visible.
                  </p>
                  <p className="font-serif text-xs uppercase italic tracking-[0.18em] text-slate-400">
                    <span className="font-semibold uppercase tracking-[0.22em] text-amber-400 not-italic">Source:</span>{" "}
                    Humanitarian Needs Overview data; Humanitarian Response Plan data; Global requirements and funding data.
                  </p>
                </InfoPopover>
              </div>
            </div>
            <input
              id={thresholdId}
              type="range"
              min={0}
              max={Math.max(maxWmi, sliderStep)}
              step={sliderStep}
              value={effectiveThreshold}
              onChange={(event) =>
                setThreshold(Number(event.currentTarget.value) || 0)
              }
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
            <p className="text-sm text-slate-400">
              Currently showing crises with a WMI of at least{" "}
              <strong>{formatCompactNumber(effectiveThreshold)}</strong>.
            </p>
          </div>
        </div>
      </section>

      <section className="w-full">
        <WorldMap
          rankings={filteredRankings}
          selectedCategory={selectedCategory}
          selectedDemographic={selectedDemographic}
          temporalMode={temporalMode}
          threshold={effectiveThreshold}
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
