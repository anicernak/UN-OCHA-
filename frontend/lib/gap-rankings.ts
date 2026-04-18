import { readFile } from "node:fs/promises";
import path from "node:path";

export type GapRankingRecord = {
  iso3: string;
  countryName: string;
  peopleInNeed: number;
  requirements: number;
  funding: number;
  coverageRatio: number;
  gapScore: number;
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

export async function loadGapRankings() {
  const filePath = path.join(process.cwd(), "data", "gap-rankings-2025.json");

  try {
    const fileContents = await readFile(filePath, "utf8");
    const parsed = JSON.parse(fileContents);

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

export async function loadMapData() {
  const filePath = path.join(process.cwd(), "data", "map_data.json");
  try {
    const fileContents = await readFile(filePath, "utf8");
    return JSON.parse(fileContents);
  } catch (e) {
    console.error("Error loading map data:", e);
    return [];
  }
}
