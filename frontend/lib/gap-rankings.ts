import "server-only";

import { readFile, readdir } from "fs/promises";
import path from "path";

import {
  type GapRankingCatalog,
  type GapRankingRecord,
  type GapRankingSelection,
  type MapDataRecord,
  getSelectionKey,
} from "@/lib/gap-rankings-shared";

type RawGapRankingRecord = {
  iso3?: unknown;
  country_name?: unknown;
  people_in_need?: unknown;
  requirements?: unknown;
  funding?: unknown;
  coverage_ratio?: unknown;
  reach_ratio?: unknown;
  gap_score?: unknown;
};

type RawMapDataRecord = {
  iso3?: unknown;
  country?: unknown;
  overlooked_score?: unknown;
  severity?: unknown;
  population_in_need?: unknown;
};

type TooltipRecord = {
  drivers?: string[];
  clusters?: string[];
  population_categories?: string[];
  metrics?: {
    total_population?: number;
    targeted?: number;
    affected?: number;
    reached?: number;
    reached_pct?: number;
    uncovered_num?: number;
    uncovered_pct?: number;
  };
};

function normalizeTooltipMetrics(metrics?: TooltipRecord["metrics"]) {
  return {
    total_population: metrics?.total_population ?? 0,
    targeted: metrics?.targeted ?? 0,
    affected: metrics?.affected ?? 0,
    reached: metrics?.reached ?? 0,
    reached_pct: metrics?.reached_pct ?? 0,
    uncovered_num: metrics?.uncovered_num ?? 0,
    uncovered_pct: metrics?.uncovered_pct ?? 0,
  };
}

function toNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

function normalizeRow(row: RawGapRankingRecord): GapRankingRecord | null {
  const iso3 = typeof row.iso3 === "string" ? row.iso3.trim().toUpperCase() : "";
  const countryName = typeof row.country_name === "string" ? row.country_name.trim() : "";
  const peopleInNeed = toNumber(row.people_in_need);
  const requirements = toNumber(row.requirements);
  const funding = toNumber(row.funding);
  const coverageRatio = toNumber(row.coverage_ratio);
  const reachRatio = toNumber(row.reach_ratio);
  const gapScore = toNumber(row.gap_score);

  if (
    !iso3 ||
    !countryName ||
    peopleInNeed === null ||
    requirements === null ||
    funding === null ||
    coverageRatio === null ||
    gapScore === null
  ) {
    return null;
  }

  return {
    iso3,
    countryName,
    peopleInNeed,
    requirements,
    funding,
    coverageRatio,
    reachRatio,
    gapScore,
  };
}

function normalizeMapRow(row: RawMapDataRecord): MapDataRecord | null {
  const iso3 = typeof row.iso3 === "string" ? row.iso3.trim().toUpperCase() : "";
  const country = typeof row.country === "string" ? row.country.trim() : "";
  const overlookedScore = toNumber(row.overlooked_score);
  const severity = toNumber(row.severity);
  const populationInNeed = toNumber(row.population_in_need);

  if (
    !iso3 ||
    !country ||
    overlookedScore === null ||
    severity === null ||
    populationInNeed === null
  ) {
    return null;
  }

  return {
    iso3,
    country,
    overlooked_score: overlookedScore,
    severity,
    population_in_need: populationInNeed,
  };
}

function dedupeRankingRecords(records: GapRankingRecord[]) {
  const recordsByIso3 = new Map<string, GapRankingRecord>();

  for (const record of records) {
    const existing = recordsByIso3.get(record.iso3);

    if (!existing) {
      recordsByIso3.set(record.iso3, record);
      continue;
    }

    const requirements = Math.max(existing.requirements, record.requirements);
    const funding = Math.max(existing.funding, record.funding);
    const peopleInNeed = existing.peopleInNeed + record.peopleInNeed;
    const weightedReachRatio = (() => {
      const existingWeight = existing.reachRatio === null ? 0 : existing.peopleInNeed;
      const recordWeight = record.reachRatio === null ? 0 : record.peopleInNeed;
      const totalWeight = existingWeight + recordWeight;

      if (totalWeight === 0) {
        return null;
      }

      return (
        ((existing.reachRatio ?? 0) * existingWeight) +
        ((record.reachRatio ?? 0) * recordWeight)
      ) / totalWeight;
    })();

    recordsByIso3.set(record.iso3, {
      iso3: record.iso3,
      countryName: existing.countryName || record.countryName,
      peopleInNeed,
      requirements,
      funding,
      coverageRatio:
        requirements > 0 ? Math.min(Math.max(funding / requirements, 0), 1) : 0,
      reachRatio: weightedReachRatio,
      gapScore: existing.gapScore + record.gapScore,
    });
  }

  return Array.from(recordsByIso3.values());
}

function scoreRecords(records: GapRankingRecord[]) {
  return records.reduce(
    (score, record) => score + (record.reachRatio !== null ? 1 : 0),
    0,
  );
}

function parseRankingFileName(fileName: string): GapRankingSelection | null {
  if (!fileName.startsWith("gap_rankings_") || !fileName.endsWith(".json")) {
    return null;
  }

  const baseName = fileName.slice(0, -".json".length);
  const demographicSuffixes = ["_all", "_children", "_women", "_men"] as const;

  let nameWithoutDemographic = baseName;
  let demographicCategory = "ALL";

  for (const suffix of demographicSuffixes) {
    if (baseName.endsWith(suffix)) {
      nameWithoutDemographic = baseName.slice(0, -suffix.length);
      demographicCategory = suffix.slice(1).toUpperCase();
      break;
    }
  }

  const temporalPatterns: Array<{
    suffix: string;
    temporalMode: GapRankingSelection["temporalMode"];
  }> = [
    { suffix: "_wmi_plus_historical_neglect", temporalMode: "WMI_PLUS_HISTORICAL_NEGLECT" },
    { suffix: "_historical_neglect_only", temporalMode: "HISTORICAL_NEGLECT_ONLY" },
    { suffix: "_current_wmi", temporalMode: "CURRENT_WMI" },
    { suffix: "_with_temporal", temporalMode: "WMI_PLUS_HISTORICAL_NEGLECT" },
    { suffix: "_no_temporal", temporalMode: "CURRENT_WMI" },
  ];

  for (const pattern of temporalPatterns) {
    if (nameWithoutDemographic.endsWith(pattern.suffix)) {
      return {
        crisisCategory: nameWithoutDemographic
          .slice("gap_rankings_".length, -pattern.suffix.length)
          .trim()
          .toUpperCase(),
        temporalMode: pattern.temporalMode,
        demographicCategory,
      };
    }
  }

  return null;
}

async function readJsonFromCandidates<T>(fileNames: string[]) {
  const candidatePaths = fileNames.map((fileName) =>
    path.join(process.cwd(), fileName),
  );

  for (const filePath of candidatePaths) {
    try {
      const fileContents = await readFile(filePath, "utf8");
      return JSON.parse(fileContents.replace(/\bNaN\b/g, "null")) as T;
    } catch {
      continue;
    }
  }

  throw new Error(`Unable to load JSON from any candidate path: ${candidatePaths.join(", ")}`);
}

export async function loadGapRankings() {
  try {
    const parsed = await readJsonFromCandidates<unknown>([
      "data/gap_rankings_2025.json",
      "../data/gap_rankings_2025.json",
    ]);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return dedupeRankingRecords(
      parsed
        .map((row) => normalizeRow(row as RawGapRankingRecord))
        .filter((row): row is GapRankingRecord => row !== null),
    );
  } catch {
    return [];
  }
}

export async function loadGapRankingsCatalog(): Promise<GapRankingCatalog> {
  const directoryCandidates = [
    path.join(process.cwd(), "data/rankings"),
    path.join(process.cwd(), "../data/rankings"),
    "data/rankings",
  ];

  // Load rich tooltip info
  let tooltips: Record<string, TooltipRecord> = {};
  try {
    // Try multiple paths for the tooltip file
    const tooltipPaths = [
        path.join(process.cwd(), "data", "country_tooltips.json"),
        path.join(process.cwd(), "frontend", "data", "country_tooltips.json"),
        path.join(process.cwd(), "..", "data", "country_tooltips.json"),
        path.join(process.cwd(), "..", "frontend", "data", "country_tooltips.json"),
        "data/country_tooltips.json"
    ];
    
    for (const p of tooltipPaths) {
        try {
            const data = await readFile(p, "utf8");
            tooltips = JSON.parse(data.replace(/\bNaN\b/g, "null")) as Record<string, TooltipRecord>;
            console.log(`Loaded tooltips from ${p}`);
            break;
        } catch { continue; }
    }
  } catch(e) {
    console.warn("Could not load rich tooltips", e);
  }

  for (const directoryPath of directoryCandidates) {
    try {
      const fileNames = await readdir(directoryPath);
      const jsonFiles = fileNames.filter((fileName) => fileName.endsWith(".json"));
      const rankingsBySelection: Record<string, GapRankingRecord[]> = {};
      const categories = new Set<string>();
      const demographicCategories = new Set<string>();
      const selections: GapRankingSelection[] = [];

      for (const fileName of jsonFiles) {
        const selection = parseRankingFileName(fileName);

        if (!selection) {
          continue;
        }

        const filePath = path.join(directoryPath, fileName);
        const parsed = JSON.parse(
          (await readFile(filePath, "utf8")).replace(/\bNaN\b/g, "null"),
        ) as unknown;

        if (!Array.isArray(parsed)) {
          continue;
        }

        const records = dedupeRankingRecords(
          parsed
          .map((row) => normalizeRow(row as RawGapRankingRecord))
          .filter((row): row is GapRankingRecord => row !== null),
        );

        // MERGE RICH TOOLTIP DATA
        records.forEach(r => {
            const extra = tooltips[r.iso3.toUpperCase()];
            if (extra) {
                r.details = {
                    drivers: extra.drivers || [],
                    clusters: extra.clusters || [],
                    categories: extra.population_categories || [],
                    metrics: normalizeTooltipMetrics(extra.metrics),
                };
            }
        });

        categories.add(selection.crisisCategory);
        demographicCategories.add(selection.demographicCategory);

        const selectionKey = getSelectionKey(selection);
        const existingRecords = rankingsBySelection[selectionKey];

        if (!existingRecords) {
          selections.push(selection);
          rankingsBySelection[selectionKey] = records;
          continue;
        }

        if (scoreRecords(records) > scoreRecords(existingRecords)) {
          rankingsBySelection[selectionKey] = records;
        }
      }

      if (selections.length > 0) {
        return {
          categories: Array.from(categories).sort((a, b) => a.localeCompare(b)),
          demographicCategories: Array.from(demographicCategories).sort((a, b) =>
            a.localeCompare(b),
          ),
          selections: selections.sort((a, b) =>
            getSelectionKey(a).localeCompare(getSelectionKey(b)),
          ),
          rankingsBySelection,
        };
      }
    } catch {
      continue;
    }
  }

  const fallbackRankings = await loadGapRankings();

  return {
    categories: ["ALL"],
    demographicCategories: ["ALL"],
    selections: [
      { crisisCategory: "ALL", temporalMode: "CURRENT_WMI", demographicCategory: "ALL" },
      { crisisCategory: "ALL", temporalMode: "WMI_PLUS_HISTORICAL_NEGLECT", demographicCategory: "ALL" },
      { crisisCategory: "ALL", temporalMode: "HISTORICAL_NEGLECT_ONLY", demographicCategory: "ALL" },
    ],
    rankingsBySelection: {
      [getSelectionKey({ crisisCategory: "ALL", temporalMode: "CURRENT_WMI", demographicCategory: "ALL" })]:
        fallbackRankings,
      [getSelectionKey({ crisisCategory: "ALL", temporalMode: "WMI_PLUS_HISTORICAL_NEGLECT", demographicCategory: "ALL" })]:
        fallbackRankings,
      [getSelectionKey({ crisisCategory: "ALL", temporalMode: "HISTORICAL_NEGLECT_ONLY", demographicCategory: "ALL" })]:
        fallbackRankings,
    },
  };
}

export type { GapRankingCatalog, GapRankingRecord, GapRankingSelection };

export async function loadMapData() {
  try {
    const parsed = await readJsonFromCandidates<unknown>([
      "data/map_data.json",
      "../data/map_data.json",
    ]);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((row) => normalizeMapRow(row as RawMapDataRecord))
      .filter((row): row is MapDataRecord => row !== null);
  } catch (e) {
    console.error("Error loading map data:", e);
    return [];
  }
}
