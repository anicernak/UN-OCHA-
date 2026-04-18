"use client";

import { useId, useMemo, useState } from "react";

import type { GapRankingRecord } from "@/lib/gap-rankings";

const DEFAULT_THRESHOLD = 5_000_000;
const DEFAULT_ROW_LIMIT = 15;

function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function formatPercent(value: number) {
  return new Intl.NumberFormat("en", {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(value);
}

type RankingsTableProps = {
  rankings: GapRankingRecord[];
};

export function RankingsTable({ rankings }: RankingsTableProps) {
  const thresholdId = useId();
  const rowLimitId = useId();
  const [threshold, setThreshold] = useState(DEFAULT_THRESHOLD);
  const [rowLimit, setRowLimit] = useState(DEFAULT_ROW_LIMIT);

  const filteredRankings = useMemo(() => {
    return rankings
      .filter((row) => row.gapScore >= threshold)
      .sort((a, b) => b.gapScore - a.gapScore)
      .slice(0, rowLimit);
  }, [rankings, rowLimit, threshold]);

  return (
    <section className="rounded-[2rem] border border-stone-900/10 bg-stone-50/90 p-6 shadow-[0_24px_80px_rgba(72,50,22,0.08)] backdrop-blur sm:p-8">
      <div className="flex flex-col gap-6 border-b border-stone-900/10 pb-6">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-900/70">
            MVP filter
          </p>
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Show only countries above your chosen gap threshold
          </h2>
          <p className="max-w-2xl text-sm leading-6 text-stone-700 sm:text-base">
            This keeps the table focused on the highest-priority gaps instead of
            rendering every country.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-medium text-stone-800">
              Minimum gap score (USD)
            </span>
            <input
              id={thresholdId}
              type="number"
              min={0}
              step={100000}
              value={threshold}
              onChange={(event) =>
                setThreshold(Number(event.currentTarget.value) || 0)
              }
              className="rounded-2xl border border-stone-300 bg-white px-4 py-3 text-base outline-none transition focus:border-stone-950"
            />
            <span className="text-sm text-stone-600">
              Currently showing countries with a gap score of at least{" "}
              <strong>{formatCurrency(threshold)}</strong>.
            </span>
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-stone-800">
              Max rows to display
            </span>
            <input
              id={rowLimitId}
              type="number"
              min={1}
              max={100}
              value={rowLimit}
              onChange={(event) =>
                setRowLimit(Math.max(1, Number(event.currentTarget.value) || 1))
              }
              className="rounded-2xl border border-stone-300 bg-white px-4 py-3 text-base outline-none transition focus:border-stone-950"
            />
            <span className="text-sm text-stone-600">
              Filtered result count: <strong>{filteredRankings.length}</strong>
            </span>
          </label>
        </div>
      </div>

      {filteredRankings.length === 0 ? (
        <div className="py-12 text-center text-stone-600">
          No countries match the current threshold.
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-stone-900/10">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse bg-white text-left">
              <thead className="bg-stone-900 text-xs uppercase tracking-[0.2em] text-stone-200">
                <tr>
                  <th className="px-4 py-4 font-medium">Rank</th>
                  <th className="px-4 py-4 font-medium">Country Name</th>
                  <th className="px-4 py-4 font-medium">ISO3</th>
                  <th className="px-4 py-4 font-medium">People In Need</th>
                  <th className="px-4 py-4 font-medium">Requirements</th>
                  <th className="px-4 py-4 font-medium">Funding</th>
                  <th className="px-4 py-4 font-medium">Coverage</th>
                  <th className="px-4 py-4 font-medium">Gap Score</th>
                </tr>
              </thead>
              <tbody>
                {filteredRankings.map((row, index) => (
                  <tr
                    key={row.iso3}
                    className="border-t border-stone-200 text-sm text-stone-800"
                  >
                    <td className="px-4 py-4 font-medium text-stone-500">
                      {index + 1}
                    </td>
                    <td className="px-4 py-4 font-medium">{row.countryName}</td>
                    <td className="px-4 py-4 font-semibold">{row.iso3}</td>
                    <td className="px-4 py-4">
                      {formatCompactNumber(row.peopleInNeed)}
                    </td>
                    <td className="px-4 py-4">
                      {formatCurrency(row.requirements)}
                    </td>
                    <td className="px-4 py-4">
                      {formatCurrency(row.funding)}
                    </td>
                    <td className="px-4 py-4">
                      {formatPercent(row.coverageRatio)}
                    </td>
                    <td className="px-4 py-4 font-semibold text-amber-900">
                      {formatCurrency(row.gapScore)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
