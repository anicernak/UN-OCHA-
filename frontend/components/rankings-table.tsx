"use client";

import { useId, useMemo, useState } from "react";

import type { GapRankingRecord } from "@/lib/gap-rankings";

const DEFAULT_THRESHOLD = 5_000_000;

function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
    minimumFractionDigits: 0,
  }).format(value);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
    minimumFractionDigits: 0,
  }).format(value);
}

function formatPercent(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "percent",
    maximumFractionDigits: 1,
    minimumFractionDigits: 0,
  }).format(value);
}

type RankingsTableProps = {
  rankings: GapRankingRecord[];
};

export function RankingsTable({ rankings }: RankingsTableProps) {
  const thresholdId = useId();
  const [threshold, setThreshold] = useState(DEFAULT_THRESHOLD);

  const filteredRankings = useMemo(() => {
    return rankings
      .filter((row) => row.gapScore >= threshold)
      .sort((a, b) => b.gapScore - a.gapScore);
  }, [rankings, threshold]);

  return (
    <section className="rounded-[2rem] border border-stone-900/10 bg-stone-50/90 p-6 shadow-[0_24px_80px_rgba(72,50,22,0.08)] backdrop-blur sm:p-8">
      <div className="flex flex-col gap-6 border-b border-stone-900/10 pb-6">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-900/70">
            MVP filter
          </p>
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Show only countries above your chosen uncovered-people threshold
          </h2>
          <p className="max-w-2xl text-sm leading-6 text-stone-700 sm:text-base">
            This keeps the table focused on countries with the highest estimated
            number of people left uncovered instead of rendering every country.
          </p>
        </div>

        <div className="grid gap-4">
          <label className="grid gap-2">
            <span className="text-sm font-medium text-stone-800">
              Minimum uncovered people
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
              Currently showing countries with an estimated uncovered population
              of at least <strong>{formatCompactNumber(threshold)}</strong>.
            </span>
          </label>
        </div>
        <p className="text-sm text-stone-600">
          Filtered result count: <strong>{filteredRankings.length}</strong>
        </p>
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
                  <th className="px-4 py-4 font-medium">Uncovered People</th>
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
                      {formatCompactNumber(row.gapScore)}
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
