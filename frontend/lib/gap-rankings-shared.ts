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

function normalizeCategoryToken(value: string) {
  return value.trim().toUpperCase();
}

export function getSelectionKey(selection: GapRankingSelection) {
  return `${normalizeCategoryToken(selection.crisisCategory)}::${selection.includeTemporalFactor}`;
}
