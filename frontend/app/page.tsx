import { RankingsDashboard } from "@/components/rankings-dashboard";
import { loadGapRankingsCatalog } from "@/lib/gap-rankings";

export default async function Home() {
  const catalog = await loadGapRankingsCatalog();

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-slate-50 sm:px-10 lg:px-16">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <header className="space-y-4">
          <p className="text-xs font-bold uppercase tracking-[0.4em] text-indigo-500">
            UN-OCHA Geo-Insight
          </p>
          <h1 className="text-4xl font-black tracking-tighter sm:text-6xl text-white">
            Humanitarian WMI <span className="text-indigo-500">Analyzer</span>
          </h1>
          <p className="max-w-3xl text-base font-medium text-indigo-200 sm:text-lg">
            WMI, or Weighted Mismatch Index, is a single score showing where humanitarian needs are most out of balance with the funding response.
          </p>
          <p className="max-w-3xl text-lg text-slate-400 leading-relaxed">
            A real-time analytical engine surfacing the Weighted Mismatch Index
            across active crises. Use the filters below to identify where
            severity, need density, funding gaps, and complexity align most sharply.
          </p>
        </header>

        <RankingsDashboard catalog={catalog} />
        
        <footer className="mt-12 border-t border-slate-800 pt-8 text-center text-slate-500 text-sm">
          <p>© 2026 Datathon Annelictorianmilian Team. All calculations based on publicly available OCHA, FTS, and HNO datasets.</p>
        </footer>
      </div>
    </main>
  );
}
