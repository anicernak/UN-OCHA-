from __future__ import annotations

import json
import re
from pathlib import Path

import pandas as pd


CRISIS_CATEGORIES = [
    "ALL",
    "CCM",
    "CSS",
    "EDU",
    "ERY",
    "FSC",
    "HEA",
    "LOG",
    "MPC",
    "MS",
    "NUT",
    "PRO",
    "PRO-CPN",
    "PRO-GBV",
    "PRO-HLP",
    "PRO-MIN",
    "SHL",
    "TEL",
    "WSH",
]

TEMPORAL_OPTIONS = ["No", "Yes"]
TEMPORAL_LAMBDA = 0.2


def repo_root() -> Path:
    return Path(__file__).resolve().parent.parent


def load_predict_pin_metrics(data_dir: Path) -> pd.DataFrame:
    monthly_frames: list[pd.DataFrame] = []

    for csv_path in sorted(data_dir.glob("predict_pin_2025*.csv")):
        match = re.search(r"predict_pin_(\d{6})\.csv$", csv_path.name)
        if not match:
            continue

        month_key = match.group(1)
        frame = pd.read_csv(
            csv_path,
            usecols=["iso3", "inform_severity_index", "complexity_of_the_crisis"],
            dtype={"iso3": "string"},
            low_memory=False,
        )
        frame["iso3"] = frame["iso3"].astype("string").str.strip().str.upper()
        frame["inform_severity_index"] = pd.to_numeric(
            frame["inform_severity_index"],
            errors="coerce",
        )
        frame["complexity_of_the_crisis"] = pd.to_numeric(
            frame["complexity_of_the_crisis"],
            errors="coerce",
        )
        frame = frame.dropna(subset=["iso3"])

        monthly_country = (
            frame.groupby("iso3", as_index=False)[
                ["inform_severity_index", "complexity_of_the_crisis"]
            ]
            .mean()
            .assign(month_key=month_key)
        )
        monthly_frames.append(monthly_country)

    if not monthly_frames:
        raise FileNotFoundError("No 2025 predict_pin CSV files found in data/final Datasets.")

    combined = pd.concat(monthly_frames, ignore_index=True)
    return (
        combined.groupby("iso3", as_index=False)[
            ["inform_severity_index", "complexity_of_the_crisis"]
        ]
        .mean()
        .rename(columns={"complexity_of_the_crisis": "complexity_operating_environment"})
    )


def load_country_names(data_dir: Path) -> pd.DataFrame:
    population = pd.read_csv(
        data_dir / "cod_population_admin0.csv",
        usecols=["ISO3", "Country"],
        dtype="string",
        low_memory=False,
    )
    population["ISO3"] = population["ISO3"].str.strip().str.upper()
    population["Country"] = population["Country"].str.strip()
    population = population.dropna(subset=["ISO3", "Country"])
    population = population[population["Country"] != ""]
    return (
        population.groupby("ISO3", as_index=False)["Country"]
        .first()
        .rename(columns={"ISO3": "iso3", "Country": "country_name"})
    )


def load_hno_by_cluster(data_dir: Path) -> pd.DataFrame:
    hno = pd.read_csv(
        data_dir / "hpc_hno_2025.csv",
        dtype="string",
        low_memory=False,
    )

    for column in ["Country ISO3", "Cluster", "Category"]:
        hno[column] = hno[column].astype("string").str.strip()

    mask = (
        hno["Country ISO3"].notna()
        & ~hno["Country ISO3"].str.startswith("#", na=False)
        & hno["Cluster"].notna()
        & ~hno["Cluster"].str.startswith("#", na=False)
        & (hno["Category"].isna() | (hno["Category"].fillna("").str.strip() == ""))
    )
    hno = hno.loc[mask].copy()

    for column in ["Population", "In Need", "Targeted", "Reached"]:
        hno[column] = pd.to_numeric(hno[column], errors="coerce").fillna(0.0)

    grouped = (
        hno.groupby(["Cluster", "Country ISO3"], as_index=False)
        .agg(
            total_population=("Population", "sum"),
            people_in_need=("In Need", "sum"),
            total_targeted=("Targeted", "sum"),
            total_reached=("Reached", "sum"),
        )
        .rename(columns={"Cluster": "cluster", "Country ISO3": "iso3"})
    )
    grouped["iso3"] = grouped["iso3"].str.upper()
    grouped["reach_ratio"] = grouped["total_reached"] / grouped["total_targeted"].replace(0, pd.NA)
    return grouped


def load_fts_current(data_dir: Path) -> pd.DataFrame:
    fts = pd.read_csv(
        data_dir / "fts_requirements_funding_global.csv",
        usecols=["countryCode", "year", "requirements", "funding"],
        dtype={"countryCode": "string"},
        low_memory=False,
    )
    fts["countryCode"] = fts["countryCode"].astype("string").str.strip().str.upper()
    fts["year"] = pd.to_numeric(fts["year"], errors="coerce")
    fts["requirements"] = pd.to_numeric(fts["requirements"], errors="coerce").fillna(0.0)
    fts["funding"] = pd.to_numeric(fts["funding"], errors="coerce").fillna(0.0)
    fts = fts.dropna(subset=["countryCode", "year"])

    return (
        fts.loc[fts["year"] == 2025]
        .groupby("countryCode", as_index=False)
        .agg(requirements=("requirements", "sum"), funding=("funding", "sum"))
        .rename(columns={"countryCode": "iso3"})
    )


def load_fts_temporal(data_dir: Path) -> pd.DataFrame:
    fts = pd.read_csv(
        data_dir / "fts_requirements_funding_global.csv",
        usecols=["countryCode", "year", "requirements", "funding"],
        dtype={"countryCode": "string"},
        low_memory=False,
    )
    fts["countryCode"] = fts["countryCode"].astype("string").str.strip().str.upper()
    fts["year"] = pd.to_numeric(fts["year"], errors="coerce")
    fts["requirements"] = pd.to_numeric(fts["requirements"], errors="coerce").fillna(0.0)
    fts["funding"] = pd.to_numeric(fts["funding"], errors="coerce").fillna(0.0)
    fts = fts.dropna(subset=["countryCode", "year"])

    historical = (
        fts.loc[fts["year"].between(2020, 2024)]
        .groupby(["countryCode", "year"], as_index=False)
        .agg(requirements=("requirements", "sum"), funding=("funding", "sum"))
    )
    historical = historical.loc[historical["requirements"] > 0].copy()

    if historical.empty:
        return pd.DataFrame(
            columns=[
                "iso3",
                "avg_gap",
                "consecutive_years_underfunded",
                "temporal_factor_value",
            ]
        )

    historical["coverage_ratio"] = (historical["funding"] / historical["requirements"]).clip(0, 1)
    historical["gap_score_year"] = historical["requirements"] * (1 - historical["coverage_ratio"])
    historical["is_underfunded"] = (historical["coverage_ratio"] < 1.0).astype(int)

    avg_gaps = (
        historical.groupby("countryCode", as_index=False)["gap_score_year"]
        .mean()
        .rename(columns={"countryCode": "iso3", "gap_score_year": "avg_gap"})
    )

    def count_consecutive_underfunded(group: pd.DataFrame) -> int:
        consecutive = 0
        for is_under in group.sort_values("year", ascending=False)["is_underfunded"]:
            if is_under == 1:
                consecutive += 1
            else:
                break
        return consecutive

    consecutive_years = (
        historical.groupby("countryCode")
        .apply(count_consecutive_underfunded)
        .reset_index(name="consecutive_years_underfunded")
        .rename(columns={"countryCode": "iso3"})
    )

    temporal = avg_gaps.merge(consecutive_years, on="iso3", how="left")
    temporal["consecutive_years_underfunded"] = (
        temporal["consecutive_years_underfunded"].fillna(0).astype(int)
    )
    temporal["temporal_factor_value"] = temporal["avg_gap"] * (
        1 + TEMPORAL_LAMBDA * temporal["consecutive_years_underfunded"]
    )

    return temporal[["iso3", "avg_gap", "consecutive_years_underfunded", "temporal_factor_value"]]


def build_rankings_for_category(
    category: str,
    include_temporal: bool,
    hno_by_cluster: pd.DataFrame,
    fts_current: pd.DataFrame,
    fts_temporal: pd.DataFrame,
    predict_pin_metrics: pd.DataFrame,
    country_names: pd.DataFrame,
) -> pd.DataFrame:
    hno = hno_by_cluster.loc[hno_by_cluster["cluster"] == category].copy()

    if hno.empty:
        return pd.DataFrame(
            columns=[
                "iso3",
                "country_name",
                "people_in_need",
                "requirements",
                "funding",
                "coverage_ratio",
                "reach_ratio",
                "total_population",
                "need_density_pct",
                "inform_severity_index",
                "complexity_operating_environment",
                "funding_gap_pct",
                "overlooked_score",
                "gap_score",
                "avg_gap",
                "consecutive_years_underfunded",
                "temporal_factor_value",
            ]
        )

    temporal = (
        fts_temporal.copy()
        if include_temporal
        else pd.DataFrame(
            {
                "iso3": pd.Series(dtype="string"),
                "avg_gap": pd.Series(dtype="float64"),
                "consecutive_years_underfunded": pd.Series(dtype="int64"),
                "temporal_factor_value": pd.Series(dtype="float64"),
            }
        )
    )

    frame = hno.merge(fts_current, on="iso3", how="inner")
    frame = frame.merge(temporal, on="iso3", how="left")
    frame = frame.merge(predict_pin_metrics, on="iso3", how="left")
    frame = frame.merge(country_names, on="iso3", how="left")

    frame["country_name"] = frame["country_name"].fillna(frame["iso3"])
    frame["avg_gap"] = frame["avg_gap"].fillna(0.0)
    frame["consecutive_years_underfunded"] = (
        frame["consecutive_years_underfunded"].fillna(0).astype(int)
    )
    frame["temporal_factor_value"] = frame["temporal_factor_value"].fillna(0.0)

    frame = frame.loc[(frame["people_in_need"] > 0) & (frame["requirements"] > 0)].copy()

    frame["coverage_ratio"] = (frame["funding"] / frame["requirements"]).clip(0, 1)
    frame["need_density_pct"] = (
        frame["people_in_need"] / frame["total_population"].replace(0, pd.NA)
    ) * 100
    frame["funding_gap_pct"] = (1 - frame["coverage_ratio"]) * 100

    frame["severity_component"] = (frame["inform_severity_index"] * 10 * 0.3).fillna(0)
    frame["need_density_component"] = (frame["need_density_pct"] * 0.3).fillna(0)
    frame["funding_gap_component"] = frame["funding_gap_pct"] * 0.3
    frame["complexity_component"] = (
        frame["complexity_operating_environment"] * 10 * 0.1
    ).fillna(0)

    frame["overlooked_score"] = (
        frame["severity_component"]
        + frame["need_density_component"]
        + frame["funding_gap_component"]
        + frame["complexity_component"]
    )
    frame["gap_score"] = frame["overlooked_score"]

    frame = frame.sort_values("overlooked_score", ascending=False).reset_index(drop=True)

    final = frame[
        [
            "iso3",
            "country_name",
            "people_in_need",
            "requirements",
            "funding",
            "coverage_ratio",
            "reach_ratio",
            "total_population",
            "need_density_pct",
            "inform_severity_index",
            "complexity_operating_environment",
            "funding_gap_pct",
            "overlooked_score",
            "gap_score",
            "avg_gap",
            "consecutive_years_underfunded",
            "temporal_factor_value",
        ]
    ].copy()

    final["people_in_need"] = final["people_in_need"].round().astype("int64")
    final["consecutive_years_underfunded"] = final["consecutive_years_underfunded"].astype("int64")

    return final


def write_json(dataframe: pd.DataFrame, output_path: Path) -> None:
    records = dataframe.where(pd.notna(dataframe), None).to_dict(orient="records")
    output_path.write_text(json.dumps(records, indent=2), encoding="utf-8")


def main() -> None:
    root = repo_root()
    data_dir = root / "data" / "final Datasets"
    output_dir = root / "data" / "rankings"
    fallback_path = root / "data" / "gap_rankings_2025.json"
    output_dir.mkdir(parents=True, exist_ok=True)

    predict_pin_metrics = load_predict_pin_metrics(data_dir)
    country_names = load_country_names(data_dir)
    hno_by_cluster = load_hno_by_cluster(data_dir)
    fts_current = load_fts_current(data_dir)
    fts_temporal = load_fts_temporal(data_dir)

    for category in CRISIS_CATEGORIES:
        for temporal_option in TEMPORAL_OPTIONS:
            include_temporal = temporal_option == "Yes"
            rankings = build_rankings_for_category(
                category=category,
                include_temporal=include_temporal,
                hno_by_cluster=hno_by_cluster,
                fts_current=fts_current,
                fts_temporal=fts_temporal,
                predict_pin_metrics=predict_pin_metrics,
                country_names=country_names,
            )
            suffix = "with_temporal" if include_temporal else "no_temporal"
            write_json(rankings, output_dir / f"gap_rankings_{category.lower()}_{suffix}.json")

    fallback = build_rankings_for_category(
        category="ALL",
        include_temporal=False,
        hno_by_cluster=hno_by_cluster,
        fts_current=fts_current,
        fts_temporal=fts_temporal,
        predict_pin_metrics=predict_pin_metrics,
        country_names=country_names,
    )
    write_json(fallback, fallback_path)

    print(f"Generated {len(CRISIS_CATEGORIES) * len(TEMPORAL_OPTIONS)} ranking files in {output_dir}")
    print(f"Generated fallback file at {fallback_path}")


if __name__ == "__main__":
    main()
