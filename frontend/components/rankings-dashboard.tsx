"use client";

import { useMemo, useState } from "react";

import { RankingsTable } from "@/components/rankings-table";
import WorldMap from "@/components/WorldMap";
import type {
  GapRankingCatalog,
  GapRankingSelection,
} from "@/lib/gap-rankings-shared";
import { getSelectionKey } from "@/lib/gap-rankings-shared";

const DEFAULT_THRESHOLD = 5_000_000;

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
    <>
      <section className="w-full">
        <WorldMap
          rankings={filteredRankings}
          selectedCategory={selectedCategory}
          includeTemporalFactor={includeTemporalFactor}
        />
      </section>

      <RankingsTable
        categories={catalog.categories}
        selectedCategory={selectedCategory}
        onSelectedCategoryChange={setSelectedCategory}
        includeTemporalFactor={includeTemporalFactor}
        onIncludeTemporalFactorChange={setIncludeTemporalFactor}
        threshold={threshold}
        onThresholdChange={setThreshold}
        rankings={filteredRankings}
      />
    </>
  );
}
