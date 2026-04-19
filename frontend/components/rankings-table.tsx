"use client";

import { InfoPopover } from "@/components/info-popover";
import type {
  GapRankingRecord,
} from "@/lib/gap-rankings-shared";
import { AlertCircle } from "lucide-react";

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

function formatOptionalPercent(value?: number | null) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "—";
  }

  return formatPercent(value);
}

function getRankingRowKey(
  iso3: string,
  countryName: string,
  peopleInNeed: number,
  gapScore: number,
  index: number,
) {
  return `${iso3}-${countryName}-${peopleInNeed}-${gapScore}-${index}`;
}

type RankingsTableProps = {
  rankings: GapRankingRecord[];
};

export function RankingsTable({
  rankings,
}: RankingsTableProps) {
  return (
    <section className="overflow-visible rounded-[2rem] border border-slate-800 bg-slate-900 p-8 shadow-2xl">
      <div className="flex flex-col gap-4 border-b border-slate-800 pb-6 mb-6">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-indigo-500">
          Analysis Results
        </p>
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl text-white">
            Detailed WMI Ranking Table
          </h2>
          <InfoPopover
            title="How To Read This Table"
            ariaLabel="Ranking table information"
            width="min(44rem, calc(100vw - 2rem))"
            side="bottom"
          >
            <p>
              This table is the ranked output of your current filters. Countries are sorted by
              descending <span className="font-mono">gapScore</span>, which is the WMI value used
              in the selected temporal mode.
            </p>
            <p>
              <span className="font-mono font-bold text-indigo-400">Rank:</span> position after
              filtering and sorting by highest WMI first.
            </p>
            <p>
              <span className="font-mono font-bold text-indigo-400">People In Need:</span> the
              number of people in need for the selected category and demographic slice.
            </p>
            <p>
              <span className="font-mono font-bold text-indigo-400">Requirements / Funding:</span>{" "}
              total requested funding and reported funding for that row.
            </p>
            <p>
              <span className="font-mono font-bold text-indigo-400">Coverage:</span>{" "}
              <span className="font-mono">funding / requirements</span>, capped between 0 and 1.
            </p>
            <p>
              <span className="font-mono font-bold text-indigo-400">Reach Ratio:</span>{" "}
              <span className="font-mono">reached / targeted</span> when that field is available;
              otherwise it is left blank.
            </p>
            <p>
              <span className="font-mono font-bold text-indigo-400">WMI:</span> the final score
              used to rank the row. In current mode it matches the current WMI; in historical views
              it comes from the precomputed temporal ranking files.
            </p>
            <p>
              Intuition: the table is helping you move from raw humanitarian inputs to a prioritized
              shortlist of crises where need, undercoverage, and structural neglect align.
            </p>
            <p className="font-serif text-xs uppercase italic tracking-[0.18em] text-slate-400">
              <span className="font-semibold uppercase tracking-[0.22em] text-amber-400 not-italic">Source:</span>{" "}
              Humanitarian Needs Overview data; Humanitarian Response Plan data; Global requirements and funding data; Global common operational datasets for population.
            </p>
          </InfoPopover>
        </div>
        <p className="text-sm text-slate-400">
          Showing <strong>{rankings.length}</strong> crises based on your current strategy.
        </p>
        <div className="flex items-start gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3">
          <AlertCircle className="mt-0.5 shrink-0 text-amber-300" size={18} />
          <p className="text-sm text-amber-100">
            <span className="font-semibold">Warning:</span> many{" "}
            <span className="italic">people_in_need</span> and{" "}
            <span className="italic">requirements</span> values are estimated by a prediction
            model rather than taken directly from reported data. In many countries, both fields are
            missing, which means the estimated requirements can depend on the estimated people in
            need. This can compound uncertainty, so these results should be interpreted with extra
            caution.
          </p>
        </div>
      </div>

      {rankings.length === 0 ? (
        <div className="py-12 text-center text-slate-500">
          No countries match the current criteria.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-800">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse bg-slate-900/50 text-left">
              <thead className="bg-slate-950 text-xs uppercase tracking-[0.2em] text-indigo-300">
                <tr>
                  <th className="px-6 py-4 font-bold border-b border-slate-800">Rank</th>
                  <th className="px-6 py-4 font-bold border-b border-slate-800">Country Name</th>
                  <th className="px-6 py-4 font-bold border-b border-slate-800">ISO3</th>
                  <th className="px-6 py-4 border-b border-slate-800 text-right font-bold">
                    <span className="inline-flex items-center justify-end gap-2">
                      <span>People In Need</span>
                      <InfoPopover
                        title="People In Need"
                        ariaLabel="People in need column information"
                        width="min(34rem, calc(100vw - 2rem))"
                        side="bottom"
                        align="end"
                      >
                        <p>
                          This column shows the estimated number of people in need for the selected
                          crisis category and demographic view.
                        </p>
                        <p>
                          It is the demand-side population measure used to understand how many
                          people require humanitarian assistance in that slice of the data.
                        </p>
                        <p className="font-serif text-xs uppercase italic tracking-[0.18em] text-slate-400">
                          <span className="font-semibold uppercase tracking-[0.22em] text-amber-400 not-italic">Source:</span>{" "}
                          Humanitarian Needs Overview data.
                        </p>
                      </InfoPopover>
                    </span>
                  </th>
                  <th className="px-6 py-4 border-b border-slate-800 text-right font-bold">
                    <span className="inline-flex items-center justify-end gap-2">
                      <span>Requirements</span>
                      <InfoPopover
                        title="Requirements"
                        ariaLabel="Requirements column information"
                        width="min(34rem, calc(100vw - 2rem))"
                        side="bottom"
                        align="end"
                      >
                        <p>
                          This column shows the total financial requirements associated with the
                          current row.
                        </p>
                        <p>
                          It is the requested funding envelope used alongside reported funding to
                          calculate coverage and the wider mismatch signal.
                        </p>
                        <p className="font-serif text-xs uppercase italic tracking-[0.18em] text-slate-400">
                          <span className="font-semibold uppercase tracking-[0.22em] text-amber-400 not-italic">Source:</span>{" "}
                          Humanitarian Response Plan data; Global requirements and funding data.
                        </p>
                      </InfoPopover>
                    </span>
                  </th>
                  <th className="px-6 py-4 font-bold border-b border-slate-800 text-right">Funding</th>
                  <th className="px-6 py-4 font-bold border-b border-slate-800 text-right">Reach Ratio</th>
                  <th className="px-6 py-4 font-bold border-b border-slate-800 text-right">Coverage</th>
                  <th className="px-6 py-4 font-bold border-b border-slate-800 text-right">WMI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {rankings.map((row, index) => (
                  <tr
                    key={getRankingRowKey(
                      row.iso3,
                      row.countryName,
                      row.peopleInNeed,
                      row.gapScore,
                      index,
                    )}
                    className="hover:bg-slate-800/50 transition-colors text-sm text-slate-300"
                  >
                    <td className="px-6 py-4 font-medium text-slate-500">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 font-semibold text-white">{row.countryName}</td>
                    <td className="px-6 py-4 font-mono text-indigo-400">{row.iso3}</td>
                    <td className="px-6 py-4 text-right">
                      {formatCompactNumber(row.peopleInNeed)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {formatCurrency(row.requirements)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {formatCurrency(row.funding)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {formatOptionalPercent(row.reachRatio)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {formatPercent(row.coverageRatio)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="rounded px-2 py-1 text-xs font-bold text-sky-300 bg-sky-900/30">
                        {formatCompactNumber(row.gapScore)}
                      </span>
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
