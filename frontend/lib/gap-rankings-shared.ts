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

export const CATEGORY_LABELS: Record<string, string> = {
  ALL: "All",
  CCM: "Camp Coordination and Camp Management",
  CSS: "Coordination and Support Services",
  EDU: "Education",
  ERY: "Early Recovery",
  FSC: "Food Security",
  HEA: "Health",
  LOG: "Logistics",
  MPC: "Multipurpose Cash",
  MS: "Multi-Sector",
  NUT: "Nutrition",
  PRO: "Protection",
  "PRO-CPN": "Protection - Child Protection",
  "PRO-GBV": "Protection - Gender-Based Violence",
  "PRO-HLP": "Protection - Housing, Land and Property",
  "PRO-MIN": "Protection - Mine Action",
  SHL: "Shelter",
  TEL: "Emergency Telecommunications",
  WSH: "Water, Sanitation and Hygiene",
};

function normalizeCategoryToken(value: string) {
  return value.trim().toUpperCase();
}

export function getSelectionKey(selection: GapRankingSelection) {
  return `${normalizeCategoryToken(selection.crisisCategory)}::${selection.includeTemporalFactor}`;
}

export function getCategoryLabel(categoryCode: string) {
  return CATEGORY_LABELS[normalizeCategoryToken(categoryCode)] ?? categoryCode;
}
