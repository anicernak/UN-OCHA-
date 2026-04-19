"use client";

import type {
  GapRankingRecord,
} from "@/lib/gap-rankings-shared";

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
    <section className="bg-slate-900 border border-slate-800 rounded-[2rem] p-8 shadow-2xl overflow-hidden">
      <div className="flex flex-col gap-2 border-b border-slate-800 pb-6 mb-6">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-indigo-500">
          Analysis Results
        </p>
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl text-white">
          Detailed Ranking Table
        </h2>
        <p className="text-sm text-slate-400">
          Showing <strong>{rankings.length}</strong> crises based on your current strategy.
        </p>
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
                  <th className="px-6 py-4 font-bold border-b border-slate-800 text-right">People In Need</th>
                  <th className="px-6 py-4 font-bold border-b border-slate-800 text-right">Requirements</th>
                  <th className="px-6 py-4 font-bold border-b border-slate-800 text-right">Funding</th>
                  <th className="px-6 py-4 font-bold border-b border-slate-800 text-right">Reach Ratio</th>
                  <th className="px-6 py-4 font-bold border-b border-slate-800 text-right">Coverage</th>
                  <th className="px-6 py-4 font-bold border-b border-slate-800 text-right">Uncovered</th>
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
                      <span className="px-2 py-1 rounded text-xs font-bold bg-sky-900/30 text-sky-300">
                        {formatOptionalPercent(row.reachRatio)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${row.coverageRatio < 0.3 ? 'bg-red-900/30 text-red-400' : 'bg-emerald-900/30 text-emerald-400'}`}>
                        {formatPercent(row.coverageRatio)}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-indigo-300 text-right">
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
