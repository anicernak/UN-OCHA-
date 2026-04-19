import "server-only";

import { readFile, readdir } from "fs/promises";
import path from "path";

import {
  type GapRankingCatalog,
  type GapRankingRecord,
  type GapRankingSelection,
  getSelectionKey,
} from "@/lib/gap-rankings-shared";

export type MapDataRecord = {
  iso3: string;
  country: string;
  overlooked_score: number;
  severity: number;
  population_in_need: number;
};

type RawGapRankingRecord = {
  iso3?: unknown;
  country_name?: unknown;
  people_in_need?: unknown;
  requirements?: unknown;
  funding?: unknown;
  coverage_ratio?: unknown;
  gap_score?: unknown;
};

type RawMapDataRecord = {
  iso3?: unknown;
  country?: unknown;
  overlooked_score?: unknown;
  severity?: unknown;
  population_in_need?: unknown;
};

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

function parseRankingFileName(fileName: string): GapRankingSelection | null {
  if (!fileName.startsWith("gap_rankings_") || !fileName.endsWith(".json")) {
    return null;
  }

  const baseName = fileName.slice(0, -".json".length);

  if (baseName.endsWith("_with_temporal")) {
      return {
      crisisCategory: baseName
        .slice("gap_rankings_".length, -"_with_temporal".length)
        .trim()
        .toUpperCase(),
      includeTemporalFactor: "Yes",
    };
  }

  if (baseName.endsWith("_no_temporal")) {
    return {
      crisisCategory: baseName
        .slice("gap_rankings_".length, -"_no_temporal".length)
        .trim()
        .toUpperCase(),
      includeTemporalFactor: "No",
    };
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
      return JSON.parse(fileContents) as T;
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

    return parsed
      .map((row) => normalizeRow(row as RawGapRankingRecord))
      .filter((row): row is GapRankingRecord => row !== null);
  } catch {
    return [];
  }
}

export async function loadGapRankingsCatalog(): Promise<GapRankingCatalog> {
  const directoryCandidates = [
    path.join(process.cwd(), "data/rankings"),
    path.join(process.cwd(), "../data/rankings"),
  ];

  for (const directoryPath of directoryCandidates) {
    try {
      const fileNames = await readdir(directoryPath);
      const jsonFiles = fileNames.filter((fileName) => fileName.endsWith(".json"));
      const rankingsBySelection: Record<string, GapRankingRecord[]> = {};
      const categories = new Set<string>();
      const selections: GapRankingSelection[] = [];

      for (const fileName of jsonFiles) {
        const selection = parseRankingFileName(fileName);

        if (!selection) {
          continue;
        }

        const filePath = path.join(directoryPath, fileName);
        const parsed = JSON.parse(await readFile(filePath, "utf8")) as unknown;

        if (!Array.isArray(parsed)) {
          continue;
        }

        const records = parsed
          .map((row) => normalizeRow(row as RawGapRankingRecord))
          .filter((row): row is GapRankingRecord => row !== null);

        categories.add(selection.crisisCategory);
        selections.push(selection);
        rankingsBySelection[getSelectionKey(selection)] = records;
      }

      if (selections.length > 0) {
        return {
          categories: Array.from(categories).sort((a, b) => a.localeCompare(b)),
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
    selections: [
      { crisisCategory: "ALL", includeTemporalFactor: "No" },
      { crisisCategory: "ALL", includeTemporalFactor: "Yes" },
    ],
    rankingsBySelection: {
      [getSelectionKey({ crisisCategory: "ALL", includeTemporalFactor: "No" })]:
        fallbackRankings,
      [getSelectionKey({ crisisCategory: "ALL", includeTemporalFactor: "Yes" })]:
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
