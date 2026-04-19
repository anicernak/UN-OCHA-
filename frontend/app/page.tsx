import { RankingsDashboard } from "@/components/rankings-dashboard";
import { loadGapRankingsCatalog } from "@/lib/gap-rankings";

export default async function Home() {
  const rankingsCatalog = await loadGapRankingsCatalog();

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#f6f1e7_0%,#efe7d8_35%,#e2d3be_100%)] px-6 py-10 text-stone-950 sm:px-10 lg:px-16">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <section className="grid gap-6 rounded-[2rem] border border-stone-900/10 bg-stone-50/85 p-8 shadow-[0_24px_80px_rgba(72,50,22,0.12)] backdrop-blur md:grid-cols-[1.4fr_0.6fr]">
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-900/70">
              Humanitarian Funding Gap
            </p>
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
              Global Overlooked Crisis Index
            </h1>
            <p className="max-w-2xl text-base leading-7 text-stone-700 sm:text-lg">
              Visualizing the mismatch between humanitarian need and funding. 
              Darker red areas indicate crises where the gap is most acute.
            </p>
          </div>

          <div className="grid gap-4 rounded-[1.5rem] bg-stone-900 px-5 py-6 text-stone-50">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-stone-400">
                Data Points
              </p>
              <p className="mt-2 text-4xl font-semibold">
                {rankingsCatalog.categories.length}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-stone-400">
                Source
              </p>
              <p className="mt-2 text-sm leading-6 text-stone-200">
                Integrated OCHA + FTS Data
              </p>
            </div>
          </div>
        </section>

        <RankingsDashboard catalog={rankingsCatalog} />
      </div>
    </main>
  );
}
