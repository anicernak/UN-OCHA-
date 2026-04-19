# Technical Documentation: The Geo-Insight Humanitarian Gap Analyzer
**Project Goal:** *Empowering Human Judgment through Transparent Analytics*

## 1. The Mission: Human Lives Behind the Data
In the humanitarian sector, a "data point" isn't just a number; it represents a child in need, a displaced family, or a community without water. For a publicly funded organization like the UN, the stakes are twofold: a mistake in funding allocation isn't just an operational error—it is a human tragedy and a catastrophic risk to organizational reputation. 

Recent history has shown the dangers of "black-box" autonomization, where AI mistakes have led to devastating real-world consequences. We built this tool with a foundational philosophy: **Automate the understanding, but never the decision.** Our goal is to speed up the workflow of UN fund managers by providing intuitive, real-time insights while ensuring that every final choice remains firmly in human hands.

## 2. Comprehensive Data Sources
To ensure the highest accuracy, we integrated multiple high-authority humanitarian data streams:

*   **INFORM Severity Index (Monthly, Jan 2025 – March 2026):** Provides the baseline for crisis urgency, trends, and the complexity of the operating environment.
*   **Humanitarian Needs Overview (HNO 2025):** The definitive source for "Scale" metrics, including total Population in Need (PiN), Targeted populations, and Reached populations.
*   **Financial Tracking Service (FTS 2023–2026):** Tracks global humanitarian contributions, requirements, and funding percentages at both the country and cluster (sector) levels.
*   **Common Operational Datasets (COD):** Baseline administrative population data used to calculate need density relative to total population.
*   **Country-Based Pooled Funds (CBPF):** Integrated to analyze localized funding efficiency versus global international aid.

## 3. The "Glass Box" Design Philosophy
To prevent the risks associated with autonomous decision-making, we implemented a **"Glass Box"** approach to transparency. Every filter and metric is accompanied by an **Info Button** that reveals:
*   **The Mathematical Formula:** No hidden weights or black-box algorithms.
*   **The Intuitive Summary:** Plain-English explanations of the representative metrics.
*   **The Data Pedigree:** A direct link to which of the datasets above powered the calculation.

## 4. Key Assumptions
We believe transparency requires stating our assumptions clearly so they can be challenged by human experts:
1.  **Temporal Stability:** We assume that historical funding patterns from 2023–2025 are predictive of structural neglect in 2026.
2.  **Linear Weighting:** For our master ranking, we assume Severity, Need Density, and Funding Gaps are equally critical (30% each) unless adjusted by a manager.
3.  **ISO3 Integrity:** We assume ISO3 country codes are the stable "glue" for joining disparate UN datasets.
4.  **Reporting Lags:** We assume a 30-day reporting lag in FTS data and provide "Last Updated" timestamps to the user.

## 5. Methodology: Understanding vs. Deciding
While our tool uses advanced modeling, we have strictly limited its scope to **Data Imputation** rather than **Decision Prediction**. These Data Imputations were performed with the help of a Random Forest based on attributes like severinity, countries and crisis. By that we could gather much more data, and especially not give a disadvantage to the countires were little data is available.

*   **What we model:** We use Random Forest imputation to fill in missing "People In Need" figures where data is historically thin or reports are delayed. This creates a more complete picture for the fund manager to analyze.
*   **What we do NOT model:** We decidedly did not develop models that "predict" where aid should go. The tool surfaces the *gap*, but the human expert decides the *response*.

### The Core Metric: Weighted Mismatch Index (WMI)
The analyzer ranks crises using a transparent weighted formula:
$$WMI = (S \times 0.3) + (N_{density} \times 0.3) + (G_{funding} \times 0.3) + (C \times 0.1)$$
*Where S = Severity, N = Need %, G = Funding Gap, and C = Complexity.*

## 6. Summary for Decision-Makers
This tool is built to be a force-multiplier for the UN's mission. It removes the manual labor of cleaning and cross-referencing hundreds of spreadsheets, allowing fund managers to focus on human strategy. By providing a transparent, intuitive interface, we protect the organization from reputational risk and, most importantly, ensure that aid is directed based on visible, verifiable need.
