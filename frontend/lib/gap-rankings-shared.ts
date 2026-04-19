export type GapRankingRecord = {
  iso3: string;
  countryName: string;
  peopleInNeed: number;
  requirements: number;
  funding: number;
  coverageRatio: number;
  gapScore: number;
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
