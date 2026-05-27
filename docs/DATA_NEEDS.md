# Data Brief, for Gemini 3.1 Pro Deep Think

> **Purpose.** The Mother of Econ currently ships with hand-curated, citation-grounded sample datasets for each tool. This document lists everything we'd need from a Deep Think research run to swap those samples for full, defensible datasets, so the site goes from "demo with three good examples" to "live, sourced reference."
>
> Format every dataset as a `.json` file we can drop into `client/src/data/<tool>/<filename>.json`. Include `source_url`, `series_id` (where applicable), `last_observation`, and `methodology_note` on every record.

---

## 1 · TariffLab, `client/src/data/tarifflab/`

**Goal.** Pass-through and deadweight-loss simulation across all major US import sectors with retaliation modeling.

| File | Schema | Source |
|---|---|---|
| `sector_elasticities.json` | 50 HS-2 sectors × `{ε_d, ε_s, ε_x, source, ci_low, ci_high}` | USITC EE-2024-XX series + Broda-Weinstein 2006 update + Fajgelbaum et al. 2020 *QJE* |
| `2025_tariff_actions.json` | All Trump-2 tariff EOs from Jan 2025 → present, with HS codes, rates, effective dates, exemptions | Federal Register + USTR Section 301/232 docket |
| `retaliation_matrix.json` | Major-trading-partner retaliation announcements (CN, EU, CA, MX, IN), products, rates, dates | MOFCOM, EU OJ, Global Affairs Canada |
| `sectoral_baselines.json` | 2024 import value, domestic prod, employment per HS-2 | BEA + Census USA Trade Online + BLS QCEW |

**Key questions for Deep Think.**
1. Best published elasticity estimates by HS-2 chapter (with confidence bands).
2. Empirical pass-through coefficients from 2018-19 trade war (Amiti-Redding-Weinstein, Cavallo et al.).
3. Updated estimates incorporating 2025-26 tariff actions if any working papers exist.

---

## 2 · Textbook Atlas, `client/src/data/atlas/`

**Goal.** Live, sourced data behind every standard AP Macro / AP Micro graph.

| Graph | FRED Series | Range |
|---|---|---|
| AS-AD | `GDPC1`, `GDPDEF`, `GDPPOT` | 1950-now, quarterly |
| Phillips Curve | `UNRATE`, `CPIAUCSL` (12-mo % chg) | 1948-now, monthly |
| Money Market | `M2SL`, `FEDFUNDS`, `DFF`, `WALCL` | 1959-now |
| Loanable Funds | `GS10`, `GS2`, `MORTGAGE30US`, `BAA10Y` | 1953-now |
| Solow Growth | `RKNANPUSA666NRUG` (capital), `RGDPNAUSA666NRUG` | Penn World Tables 10.01 |
| Output Gap | `GDPC1`, `GDPPOT` | 1949-now |
| Beveridge Curve | `JTSJOL`, `UNRATE` | 2000-now, monthly |
| Yield Curve | `DGS1MO`, `DGS3MO` … `DGS30` | 1990-now, daily snapshots |

**Plus:** raw labor-force participation, prime-age EPOP, real wages by quintile (BLS NLSY-equivalent), PCE-by-component breakdown.

**Deliverable.** One JSON per graph, plus a `series_metadata.json` with units, seasonal adjustment, last revision date.

---

## 3 · Shadow Fed, `client/src/data/shadow-fed/`

**Goal.** Score user dot-plot guesses against the FOMC. Need historical projections and a Taylor-rule benchmark.

| File | Contents | Source |
|---|---|---|
| `sep_history.json` | Every Summary of Economic Projections from Mar 2012 → Mar 2026, fed funds median + central tendency + range, by horizon | FederalReserve.gov SEP archive |
| `dot_plots.json` | Individual dot-plot points (anonymized) for each meeting | Federal Reserve Board files |
| `taylor_rule_inputs.json` | Real-time output gap + core PCE inflation at each meeting date | FRED `GDPC1`, `GDPPOT`, `PCEPILFE` |
| `greenbook_history.json` *(optional, lagged 5 yr)* | Fed staff Greenbook/Tealbook macro forecasts vs. SEP | Philadelphia Fed Real-Time Data Set |

**Key question.** Best closed-form of the post-pandemic Taylor-rule modification (Yellen-modified, Bernanke-fix, Powell flexible-AIT) for an explicit benchmark.

---

## 4 · Shock Simulator, `client/src/data/shock-sim/`

**Goal.** Calibrated AS/AD shock library with empirically-grounded magnitudes.

| File | Contents |
|---|---|
| `historical_shocks.json` | 1973 oil, 1979 Volcker, 1990 Gulf War, 2001 dot-com, 2008 GFC, 2011 Fukushima/EU debt, 2020 COVID, 2022 Russia-Ukraine, with output, inflation, unemployment paths and IRFs from VAR studies (Kilian, Stock-Watson, Romer-Romer) |
| `monetary_irfs.json` | 25-bp Fed funds shock IRFs on output, prices, unemployment (Christiano-Eichenbaum-Evans + updated Ramey 2016 *Handbook*) |
| `fiscal_multipliers.json` | Spending vs. tax multipliers by state-of-cycle (Auerbach-Gorodnichenko, IMF WEO Oct 2020) |

---

## 5 · AP FRQ Grader, `client/src/data/frq-grader/`

**Goal.** Authoritative rubric coverage and a corpus to validate the grader.

| File | Contents |
|---|---|
| `released_frqs.json` | Every released AP Macro + Micro FRQ 2010-2024, full text + College Board scoring guidelines |
| `rubric_decision_tree.json` | Each rubric point's accept/reject criteria, common errors flagged in CB Chief Reader reports |
| `chief_reader_reports.json` | 2010-2024 score distributions + commonly missed points |

**Source.** AP Central + collegeboard.org public FRQ archive.

---

## 6 · Econ Paper Decoder, `client/src/data/paper-decoder/`

**Goal.** A trained corpus so the decoder can recognize methods and red-flag weak inference.

| File | Contents |
|---|---|
| `nber_corpus_2020_2026.jsonl` | 200+ NBER WPs across labor, macro, trade, public, abstract, method tags, identification strategy, key tables |
| `aer_jpe_qje_corpus.jsonl` | Top-3 journals 2018-2025, same schema |
| `method_taxonomy.json` | DiD, RDD, IV, RCT, structural, calibration, event study, synthetic control, with diagnostic checks (parallel trends, McCrary, weak-IV F, etc.) |
| `replication_redflags.json` | Common issues from replication archives (Brodeur, Rauh) |

---

## 7 · Extemp Engine, `client/src/data/extemp/`

**Goal.** Continuously refreshed brief library across ETOC/NIETOC topic domains.

| File | Contents |
|---|---|
| `topic_briefs.json` | 60-100 hand-built briefs across: US econ policy, trade, monetary, fiscal, inequality, tech regulation, climate-econ, healthcare, education, immigration, labor markets, housing, energy, geopolitics-econ |
| Per brief: AGD candidates, link, restate, significance, framing question, preview, 2 contentions × 3 cited stats each, answer, tieback. Every stat has source URL + retrieval date. |

---

## 8 · Colorado Econ Dashboard, `client/src/data/colorado/`

**Currently shipped with hand-curated 12-county data. Needed for full version:**

| File | Contents |
|---|---|
| `co_lau.json` | Monthly LAUS unemployment + LF for all 64 counties, 2008-now | BLS LAUS |
| `co_qcew.json` | Annual QCEW employment + wages by NAICS-2 by county | BLS QCEW |
| `co_living_wage.json` | MIT Living Wage Calculator, 1A-2K family configs by county | livingwage.mit.edu |
| `co_school_grad.json` | District 4-year grad rates 2010-now | CDE |
| `co_housing.json` | Median home + rent by county | Zillow ZORI/ZHVI + HUD FMR |
| `co_pop_demo.json` | County demographics, age, ed attainment | Census ACS 5-yr |

---

## Acceptance Criteria for Each Dataset

1. **Source URL** on every record (no "internal compilation").
2. **Last observation date** + **retrieval timestamp**.
3. **Methodology note** explaining transformations (deflation, seasonal adjustment, smoothing).
4. **Confidence intervals or standard errors** where the source provides them.
5. **License check**, only CC-BY, CC-0, US gov public domain, or fair-use permitted academic data.
6. **No proprietary terminal data** (Bloomberg, Refinitiv, Haver), must be reproducible from public sources.

## Output Format

```
data-deliverable/
  tarifflab/
    sector_elasticities.json
    2025_tariff_actions.json
    ...
  atlas/
    as_ad.json
    phillips.json
    ...
  ...
  README.md   ← list every file, row count, source URL, last update
```

Drop into `client/src/data/` and the existing tool components will read them via `import` statements (currently they import small `sample-*.ts` files, swapping in real JSON requires only the type signature to match).

---

*Saras Totey · econ.mom · 2026*
