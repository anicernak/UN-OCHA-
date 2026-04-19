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
        reached: number;
        reached_pct_of_target: number;
        uncovered_num: number;
        uncovered_pct_of_need: number;
    }
  }
};

export type GapRankingSelection = {
  crisisCategory: string;
  temporalMode: "CURRENT_WMI" | "WMI_PLUS_HISTORICAL_NEGLECT" | "HISTORICAL_NEGLECT_ONLY";
  demographicCategory: string;
};

export type GapRankingCatalog = {
  categories: string[];
  demographicCategories: string[];
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

export const DEMOGRAPHIC_LABELS: Record<string, string> = {
  ALL: "All people",
  CHILDREN: "Children",
  WOMEN: "Women",
  MEN: "Men",
};

export const TEMPORAL_MODE_LABELS: Record<GapRankingSelection["temporalMode"], string> = {
  CURRENT_WMI: "Current WMI only",
  WMI_PLUS_HISTORICAL_NEGLECT: "Current WMI + historical neglect",
  HISTORICAL_NEGLECT_ONLY: "Historical neglect only",
};

function normalizeCategoryToken(value: string) {
  return value.trim().toUpperCase();
}

export function getSelectionKey(selection: GapRankingSelection) {
  return [
    normalizeCategoryToken(selection.crisisCategory),
    selection.temporalMode,
    normalizeCategoryToken(selection.demographicCategory),
  ].join("::");
}

export function getCategoryLabel(categoryCode: string) {
  return CATEGORY_LABELS[normalizeCategoryToken(categoryCode)] ?? categoryCode;
}

export function getDemographicLabel(demographicCode: string) {
  return DEMOGRAPHIC_LABELS[normalizeCategoryToken(demographicCode)] ?? demographicCode;
}

export function getTemporalModeLabel(mode: GapRankingSelection["temporalMode"]) {
  return TEMPORAL_MODE_LABELS[mode] ?? mode;
}
