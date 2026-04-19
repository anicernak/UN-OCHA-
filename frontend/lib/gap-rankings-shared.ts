export type GapRankingRecord = {
  iso3: string;
  countryName: string;
  peopleInNeed: number;
  requirements: number;
  funding: number;
  coverageRatio: number;
  reachRatio: number | null;
  gapScore: number;
  details?: {
    drivers: string[];
    clusters: string[];
    categories: string[];
    metrics: {
        total_population: number;
        targeted: number;
        affected: number;
        reached: number;
        reached_pct: number;
        uncovered_num: number;
        uncovered_pct: number;
    }
  }
};

export type GapRankingSelection = {
  crisisCategory: string;
  includeTemporalFactor: "Yes" | "No";
};

export type GapRankingCatalog = {
  categories: string[];
  selections: GapRankingSelection[];
  rankingsBySelection: Record<string, GapRankingRecord[]>;
};

export type MapDataRecord = {
  iso3: string;
  country: string;
  overlooked_score: number;
  severity: number;
  population_in_need: number;
};

function normalizeCategoryToken(value: string) {
  return value.trim().toUpperCase();
}

export function getSelectionKey(selection: GapRankingSelection) {
  return `${normalizeCategoryToken(selection.crisisCategory)}::${selection.includeTemporalFactor}`;
}
