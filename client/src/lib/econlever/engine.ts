/**
 * EconLever Economic Engine
 * ----------------------------------------------------------------------------
 * A transparent, closed-loop simulator that maps four U.S. policy levers
 * to a 10-year projection of GDP growth, the federal deficit, and the
 * Gini coefficient (income inequality).
 *
 * IMPORTANT: This engine uses SIMPLIFIED PROPORTIONAL MATHEMATICS as a
 * pedagogical tool. Coefficients are calibrated to be directionally
 * consistent with mainstream literature on supply-side, Keynesian, and
 * monetarist macroeconomic theory, but they are NOT a substitute for a
 * full DSGE or VAR model. See `/about` for citations and methodology.
 *
 * All calibration constants are exported so they can be replaced with
 * coefficients drawn from peer-reviewed literature without changing the
 * surrounding UI logic.
 * ----------------------------------------------------------------------------
 */

// ─────────────────────────────────────────────────────────────────────────────
// Inputs / Outputs
// ─────────────────────────────────────────────────────────────────────────────

export interface PolicyLevers {
  /** Top marginal personal income tax rate, percent (10–70). */
  topMarginalTax: number;
  /** Statutory corporate income tax rate, percent (10–40). */
  corporateTax: number;
  /** Federal social welfare spending as a share of GDP, percent (5–30). */
  welfareSpending: number;
  /** Federal funds target rate, percent (0–10). */
  fedFundsRate: number;
}

export interface YearProjection {
  year: number;
  /** Real GDP growth that year, percent. */
  gdpGrowth: number;
  /** Federal deficit as a share of GDP, percent (positive = deficit). */
  deficit: number;
  /** Gini coefficient (0 = perfect equality, 1 = perfect inequality). */
  gini: number;
}

export interface SimulationResult {
  series: YearProjection[];
  /** Average annual real GDP growth across the 10-year window. */
  avgGdpGrowth: number;
  /** Cumulative deficit % of GDP across 10 years. */
  cumulativeDeficit: number;
  /** Final Gini coefficient at year 10. */
  finalGini: number;
  /** Change in Gini from year 0 to year 10 (positive = more unequal). */
  giniDelta: number;
  /** Qualitative regime label (Supply-Side, Keynesian, Mixed, etc.) */
  regime: PolicyRegime;
}

export type PolicyRegime =
  | "Supply-Side"
  | "Keynesian Expansion"
  | "Austerity / Restrictive"
  | "Progressive Redistribution"
  | "Mixed / Centrist";

// ─────────────────────────────────────────────────────────────────────────────
// Baseline calibration (anchored to ~2025 U.S. values)
// ─────────────────────────────────────────────────────────────────────────────

export const BASELINE = {
  /** Calendar year of the calibration anchor. */
  baseYear: 2025,
  /** First year of the projection window. */
  projectionStartYear: 2026,
  /** Final year of the projection window (10-year horizon). */
  projectionEndYear: 2036,
  /** Long-run potential real GDP growth, percent. */
  potentialGdpGrowth: 2.0,
  /** Baseline federal deficit % of GDP. */
  deficit: 6.0,
  /** Baseline Gini coefficient. */
  gini: 0.415,
  /** Reference values at which a lever is "neutral" (no impact vs. baseline). */
  neutral: {
    topMarginalTax: 37, // current U.S. top marginal rate
    corporateTax: 21,   // current U.S. statutory corporate rate
    welfareSpending: 14, // approx. share of GDP
    fedFundsRate: 4.5,   // approx. neutral nominal rate
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Coefficient table, REPLACE WITH CITED VALUES FROM RESEARCH
// Each entry maps a lever's deviation from "neutral" to its directional impact
// on GDP, deficit, and Gini. Sign conventions:
//   GDP   → positive = boost, negative = drag
//   DEFICIT → positive = widens, negative = narrows
//   GINI  → positive = more unequal, negative = more equal
// ─────────────────────────────────────────────────────────────────────────────

export const COEFFICIENTS = {
  // Top marginal income tax
  // Romer & Romer (2010): tax increases lower GDP; top rates have milder macro
  // impact than broad taxes. Piketty, Saez & Stantcheva (2014): higher top
  // rates compress top 1% income shares.
  topMarginalTax: {
    gdpPerPoint: -0.015,     // Romer & Romer (2010)
    deficitPerPoint: -0.060, // sizable revenue offset, narrow base (top earners)
    giniPerPoint: -0.0012,   // Piketty/Saez/Stantcheva (2014)
  },
  // Corporate income tax
  // Mertens & Ravn (2013): corporate tax cuts stimulate short-run investment
  // and GDP. Tax incidence falls largely on capital owners; cuts widen disparity.
  corporateTax: {
    gdpPerPoint: -0.040,     // Mertens & Ravn (2013)
    deficitPerPoint: -0.120, // high revenue loss/point, moderate dynamic offset
    giniPerPoint: -0.0008,   // capital incidence channel
  },
  // Welfare spending (transfers, EITC, SNAP, ACA subsidies, child tax credits)
  // Ramey (2011) / Auerbach & Gorodnichenko (2012): transfer multipliers are
  // positive but < 1 (~0.5–0.8). Strong direct redistribution channel.
  welfareSpending: {
    gdpPerPoint: 0.080,      // Ramey (2011); Auerbach & Gorodnichenko (2012)
    deficitPerPoint: 0.850,  // direct outflow, modest growth offset
    giniPerPoint: -0.0045,   // direct redistribution compresses Gini
  },
  // Federal Funds Rate
  // Bernanke & Blinder (1992): 100bps tightening reduces GDP significantly over
  // 12–24 months. Coibion et al. (2017): contractionary monetary policy
  // systematically increases inequality.
  fedFundsRate: {
    gdpPerPoint: -0.150,     // Bernanke & Blinder (1992)
    deficitPerPoint: 0.220,  // higher sovereign debt service costs
    giniPerPoint: 0.0015,    // Coibion et al. (2017)
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Core simulation
// ─────────────────────────────────────────────────────────────────────────────

/** Compute one-year impact deltas vs. baseline given the policy levers. */
function impactsFromLevers(levers: PolicyLevers) {
  const dTopTax = levers.topMarginalTax - BASELINE.neutral.topMarginalTax;
  const dCorpTax = levers.corporateTax - BASELINE.neutral.corporateTax;
  const dWelfare = levers.welfareSpending - BASELINE.neutral.welfareSpending;
  const dFed = levers.fedFundsRate - BASELINE.neutral.fedFundsRate;

  const gdpDelta =
    dTopTax * COEFFICIENTS.topMarginalTax.gdpPerPoint +
    dCorpTax * COEFFICIENTS.corporateTax.gdpPerPoint +
    dWelfare * COEFFICIENTS.welfareSpending.gdpPerPoint +
    dFed * COEFFICIENTS.fedFundsRate.gdpPerPoint;

  const deficitDelta =
    dTopTax * COEFFICIENTS.topMarginalTax.deficitPerPoint +
    dCorpTax * COEFFICIENTS.corporateTax.deficitPerPoint +
    dWelfare * COEFFICIENTS.welfareSpending.deficitPerPoint +
    dFed * COEFFICIENTS.fedFundsRate.deficitPerPoint;

  const giniAnnualPressure =
    dTopTax * COEFFICIENTS.topMarginalTax.giniPerPoint +
    dCorpTax * COEFFICIENTS.corporateTax.giniPerPoint +
    dWelfare * COEFFICIENTS.welfareSpending.giniPerPoint +
    dFed * COEFFICIENTS.fedFundsRate.giniPerPoint;

  return { gdpDelta, deficitDelta, giniAnnualPressure };
}

/**
 * Run the 10-year projection. Gini accumulates yearly pressure with a
 * mean-reverting decay term so that policy "shocks" don't compound forever.
 */
export function simulate(levers: PolicyLevers): SimulationResult {
  const { gdpDelta, deficitDelta, giniAnnualPressure } = impactsFromLevers(levers);

  const series: YearProjection[] = [];
  let gini = BASELINE.gini;

  // Mean-reversion: each year, Gini moves slightly back toward baseline
  const decay = 0.08;

  for (let i = 0; i <= 10; i++) {
    // Slight diminishing returns on growth shocks across the decade
    const fade = 1 - i * 0.015;
    const gdpGrowth = clamp(BASELINE.potentialGdpGrowth + gdpDelta * fade, -3, 7);
    const deficit = clamp(BASELINE.deficit + deficitDelta, -2, 18);

    if (i > 0) {
      // accumulate inequality pressure with mean reversion
      gini = gini + giniAnnualPressure - decay * (gini - BASELINE.gini);
    }
    gini = clamp(gini, 0.30, 0.60);

    series.push({
      year: BASELINE.projectionStartYear + i,
      gdpGrowth: round2(gdpGrowth),
      deficit: round2(deficit),
      gini: round3(gini),
    });
  }

  const avgGdpGrowth = round2(
    series.reduce((s, y) => s + y.gdpGrowth, 0) / series.length
  );
  const cumulativeDeficit = round1(series.reduce((s, y) => s + y.deficit, 0));
  const finalGini = series[series.length - 1].gini;
  const giniDelta = round3(finalGini - BASELINE.gini);
  const regime = classifyRegime(levers);

  return { series, avgGdpGrowth, cumulativeDeficit, finalGini, giniDelta, regime };
}

// ─────────────────────────────────────────────────────────────────────────────
// Regime classification
// ─────────────────────────────────────────────────────────────────────────────

export function classifyRegime(levers: PolicyLevers): PolicyRegime {
  const lowTax =
    levers.topMarginalTax < 30 && levers.corporateTax < 21;
  const highTax =
    levers.topMarginalTax >= 45 || levers.corporateTax >= 30;
  const lowWelfare = levers.welfareSpending < 12;
  const highWelfare = levers.welfareSpending >= 20;
  const tightMoney = levers.fedFundsRate >= 6;
  const looseMoney = levers.fedFundsRate <= 2;

  if (lowTax && lowWelfare) return "Supply-Side";
  if (highWelfare && highTax) return "Progressive Redistribution";
  if (highWelfare && looseMoney) return "Keynesian Expansion";
  if (lowWelfare && tightMoney && highTax) return "Austerity / Restrictive";
  return "Mixed / Centrist";
}

// ─────────────────────────────────────────────────────────────────────────────
// Dynamic analysis text, generated from regime + magnitudes
// ─────────────────────────────────────────────────────────────────────────────

export function generateAnalysis(
  levers: PolicyLevers,
  result: SimulationResult
): { headline: string; body: string; tags: string[] } {
  const { regime, avgGdpGrowth, finalGini, giniDelta, cumulativeDeficit } = result;

  const direction =
    giniDelta > 0.005 ? "widening" : giniDelta < -0.005 ? "narrowing" : "stable";
  const growthLabel =
    avgGdpGrowth > 2.5 ? "above-trend" : avgGdpGrowth < 1.5 ? "below-trend" : "near-potential";

  const headlines: Record<PolicyRegime, string> = {
    "Supply-Side":
      `Supply-side regime: ${growthLabel} growth, ${direction} disparity.`,
    "Keynesian Expansion":
      `Keynesian expansion: aggregate demand boosted, ${direction} disparity.`,
    "Austerity / Restrictive":
      `Restrictive stance: liquidity withdrawn, growth ${growthLabel}.`,
    "Progressive Redistribution":
      `Progressive redistribution: equality prioritized, growth ${growthLabel}.`,
    "Mixed / Centrist":
      `Centrist policy mix: ${growthLabel} growth, disparity ${direction}.`,
  };

  const tagsByRegime: Record<PolicyRegime, string[]> = {
    "Supply-Side": ["capital investment", "wealth concentration", "trickle-down"],
    "Keynesian Expansion": ["aggregate demand", "fiscal multiplier", "liquidity"],
    "Austerity / Restrictive": ["disinflation", "credit tightening", "fiscal consolidation"],
    "Progressive Redistribution": ["transfer payments", "post-tax equity", "labor share"],
    "Mixed / Centrist": ["balanced policy", "incremental reform", "neutral stance"],
  };

  const bodyByRegime: Record<PolicyRegime, string> = {
    "Supply-Side": [
      `Lower marginal and corporate rates shift the mix toward private capital investment and short-run output. Projected average real GDP growth comes in at ${avgGdpGrowth.toFixed(2)}%. With thinner transfers, those gains land disproportionately at the top, and the Gini coefficient drifts to ${finalGini.toFixed(3)}.`,
      `The pattern echoes 1981 to 1989: stronger headline growth alongside a structural rise in pre-tax disparity that post-tax transfers were not large enough to absorb.`,
    ].join(" "),
    "Keynesian Expansion": [
      `Expansive welfare spending and an accommodative Fed inject liquidity at the bottom of the distribution, where the marginal propensity to consume is highest. Aggregate demand strengthens. Projected average growth: ${avgGdpGrowth.toFixed(2)}%. The cumulative deficit widens to ${cumulativeDeficit.toFixed(1)}% of GDP across the decade.`,
      `Inequality narrows because transfers act as a direct redistributive channel; the fiscal multiplier compounds the labor share of income.`,
    ].join(" "),
    "Austerity / Restrictive": [
      `Restrictive fiscal and monetary settings withdraw liquidity from the economy. Growth runs ${growthLabel} at ${avgGdpGrowth.toFixed(2)}%, while higher debt service costs paradoxically keep the deficit elevated near ${(cumulativeDeficit/11).toFixed(1)}% of GDP per year.`,
      `Asset-holders are partially insulated by higher real returns; wage-earners and borrowers absorb the contraction, leaving the Gini coefficient at ${finalGini.toFixed(3)}.`,
    ].join(" "),
    "Progressive Redistribution": [
      `High marginal taxation funds substantial social welfare spending, producing the strongest direct redistributive effect modeled here. The Gini coefficient settles at ${finalGini.toFixed(3)} (Δ ${giniDelta >= 0 ? "+" : ""}${giniDelta.toFixed(3)} from baseline).`,
      `Average growth of ${avgGdpGrowth.toFixed(2)}% reflects the trade-off between transfer-driven aggregate demand and reduced after-tax incentives for high-end capital formation.`,
    ].join(" "),
    "Mixed / Centrist": [
      `Levers sit close to the calibrated U.S. neutral baseline. Projected average GDP growth of ${avgGdpGrowth.toFixed(2)}% and a final Gini of ${finalGini.toFixed(3)} indicate marginal deviation from current policy.`,
      `Use this configuration as a control case before stress-testing more aggressive supply-side or redistributive scenarios.`,
    ].join(" "),
  };

  return {
    headline: headlines[regime],
    body: bodyByRegime[regime],
    tags: tagsByRegime[regime],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Scenario presets, one-click historical snapshots
// ─────────────────────────────────────────────────────────────────────────────

export const PRESETS: Array<{ id: string; label: string; description: string; levers: PolicyLevers }> = [
  {
    id: "current",
    label: "2025 Baseline",
    description: "Current U.S. policy stance (post-TCJA, post-IRA).",
    levers: { topMarginalTax: 37, corporateTax: 21, welfareSpending: 14, fedFundsRate: 4.5 },
  },
  {
    id: "reagan",
    label: "Reaganomics (1986)",
    description: "Tax Reform Act regime: low marginal rates, lean welfare.",
    levers: { topMarginalTax: 28, corporateTax: 34, welfareSpending: 11, fedFundsRate: 7.5 },
  },
  {
    id: "newdeal",
    label: "Post-War Keynesian",
    description: "1950s–60s consensus: high top rates, rising transfers.",
    levers: { topMarginalTax: 65, corporateTax: 38, welfareSpending: 18, fedFundsRate: 3.0 },
  },
  {
    id: "nordic",
    label: "Nordic-Style",
    description: "Progressive redistribution with active fiscal stabilization.",
    levers: { topMarginalTax: 55, corporateTax: 22, welfareSpending: 26, fedFundsRate: 2.5 },
  },
  {
    id: "austerity",
    label: "Austerity Stress Test",
    description: "Lean welfare, restrictive monetary policy.",
    levers: { topMarginalTax: 42, corporateTax: 28, welfareSpending: 8, fedFundsRate: 7.0 },
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────────────────────────────────────

function clamp(n: number, min: number, max: number) {
  return Math.min(Math.max(n, min), max);
}
function round1(n: number) { return Math.round(n * 10) / 10; }
function round2(n: number) { return Math.round(n * 100) / 100; }
function round3(n: number) { return Math.round(n * 1000) / 1000; }
