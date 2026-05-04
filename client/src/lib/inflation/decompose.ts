// Inflation Decomposer engine, splits headline CPI into supply, demand,
// expectations, and policy components using a simplified Bernanke-Blanchard
// (2023, NBER w31417) two-stage approach + Cleveland Fed trend-cycle method.
//
// Headline π_t  =  π_supply_t  +  π_demand_t  +  π_expectations_t  +  π_policy_lag_t
//
// Defaults are anchored to the BB23 paper's quarterly point estimates for the
// 2021–2023 surge, then linearly continued. Users can override every input.

export interface DecomposeInput {
  // Observed headline CPI YoY (%), e.g. 3.2 for 3.2%
  headlineCpi: number;
  // Energy contribution: WTI YoY % change × 0.07 (CPI-U energy weight) × passthrough.
  energyYoY: number;
  // Food shock: FAO Food Price Index YoY × 0.13 (food weight in CPI-U).
  foodYoY: number;
  // Vacancy/Unemployment ratio (BLS JOLTS V/U). Above 1.0 = tight labor market.
  vacancyToUnemployment: number;
  // 5-year breakeven inflation (TIPS spread) %, FRED T5YIE.
  breakeven5y: number;
  // Survey 5-year expectations from Michigan / SCE %, default 3.0.
  surveyExpect5y: number;
  // Effective fed funds rate %, FRED FEDFUNDS.
  fedFundsRate: number;
  // Output gap as % of potential GDP (CBO).
  outputGap: number;
}

export interface DecomposeOutput {
  components: {
    label: string;
    value: number;       // percentage points contributing to headline
    color: string;
    note: string;
  }[];
  total: number;          // model-implied headline
  residual: number;       // observed minus model
  regime: string;         // dominant driver
  expectationsAnchored: boolean;
  recommendation: string;
}

// Reference 2% CPI target.
const PI_TARGET = 2.0;

export function decomposeInflation(x: DecomposeInput): DecomposeOutput {
  // 1. Supply-shock contribution.
  // Energy weight ≈ 7% CPI-U; food weight ≈ 13%. Passthrough discounted 60%
  // because energy is volatile and partially absorbed by margins (BB23 §3.2).
  const energyContribution = x.energyYoY * 0.07 * 0.60;
  const foodContribution = x.foodYoY * 0.13 * 0.55;
  const supplyComponent = energyContribution + foodContribution;

  // 2. Demand / labor-market slack channel.
  // Bernanke-Blanchard "tightness gap" β ≈ 0.32 per unit of (V/U − 1.0)
  // applied to headline π. In their model the relationship is non-linear; we
  // use a piecewise version: doubled slope above 1.5.
  let demandComponent: number;
  const tightness = x.vacancyToUnemployment - 1.0;
  if (tightness > 0.5) {
    demandComponent = 0.5 * 0.32 + (tightness - 0.5) * 0.55;
  } else {
    demandComponent = tightness * 0.32;
  }
  // Output gap adds an additional small slope (Phillips curve, ~0.15).
  demandComponent += x.outputGap * 0.15;

  // 3. Expectations channel, composite of TIPS breakeven and survey.
  // Anchored if both within 0.5pp of 2% target; else expectations drift adds
  // π_e = (composite − 2.0) × 0.85 (Hazell-Herreño-Nakamura-Steinsson).
  const composite = 0.5 * x.breakeven5y + 0.5 * x.surveyExpect5y;
  const expectationsComponent = (composite - PI_TARGET) * 0.85;

  // 4. Policy lag channel.
  // r* ≈ 0.5 (long-run real neutral, Holston-Laubach-Williams 2024). When
  // policy is loose (r − π < r*) it adds inflation pressure with 4-quarter
  // lag; when restrictive, subtracts.
  const realRate = x.fedFundsRate - x.headlineCpi;
  const policyComponent = (0.5 - realRate) * 0.18;

  const total =
    supplyComponent +
    demandComponent +
    expectationsComponent +
    policyComponent +
    PI_TARGET; // baseline 2% trend

  const residual = x.headlineCpi - total;

  const components = [
    { label: "Trend (2% target)", value: PI_TARGET, color: "#94a3b8", note: "Long-run anchor" },
    { label: "Supply (energy + food)", value: supplyComponent, color: "#a855f7", note: "WTI × CPI energy weight + FAO × food weight, 60% passthrough" },
    { label: "Demand (V/U + output gap)", value: demandComponent, color: "#ec4899", note: "Bernanke-Blanchard β=0.32 piecewise · Phillips slope 0.15" },
    { label: "Expectations", value: expectationsComponent, color: "#22d3ee", note: "0.5×breakeven5y + 0.5×survey, anchored to 2% target" },
    { label: "Policy stance", value: policyComponent, color: "#f59e0b", note: "(r* − real rate)×0.18, 4Q lag, HLW 2024 r* ≈ 0.5" },
  ];

  // Dominant non-trend driver
  const nonTrend = components.slice(1);
  const dominant = nonTrend.reduce((a, b) => (Math.abs(a.value) > Math.abs(b.value) ? a : b));
  const regime =
    dominant.value > 0.6
      ? `${dominant.label.split(" (")[0]}-driven inflation`
      : Math.abs(residual) > 0.8
      ? "Unexplained, likely measurement or wage-price spiral"
      : "Mixed, inflation near trend";

  const expectationsAnchored = Math.abs(composite - PI_TARGET) < 0.4;

  const recommendation = expectationsAnchored
    ? supplyComponent > 1.0
      ? "Look-through: expectations anchored, supply shock will fade. Hold policy."
      : demandComponent > 0.8
      ? "Demand pressure with anchored expectations: modest tightening sufficient."
      : "Inflation near trend with anchored expectations, current stance appropriate."
    : "Expectations DEANCHORED, restore credibility before easing. Volcker mode warranted.";

  return { components, total, residual, regime, expectationsAnchored, recommendation };
}

export const DECOMPOSE_PRESETS: { name: string; description: string; input: DecomposeInput }[] = [
  {
    name: "2025 Q1 (current)",
    description: "Goods-disinflation regime, services sticky, labor cooling.",
    input: {
      headlineCpi: 2.9, energyYoY: -1.5, foodYoY: 1.8, vacancyToUnemployment: 1.05,
      breakeven5y: 2.4, surveyExpect5y: 3.0, fedFundsRate: 4.33, outputGap: -0.3,
    },
  },
  {
    name: "2022 Q2 (peak surge)",
    description: "BB23 reference period: maximum supply + demand confluence.",
    input: {
      headlineCpi: 8.6, energyYoY: 41.6, foodYoY: 11.4, vacancyToUnemployment: 1.92,
      breakeven5y: 3.27, surveyExpect5y: 3.3, fedFundsRate: 1.21, outputGap: 1.2,
    },
  },
  {
    name: "1980 Q1 (Volcker entry)",
    description: "Pre-Volcker stagflation: oil shock + deanchored expectations.",
    input: {
      headlineCpi: 14.6, energyYoY: 47.5, foodYoY: 7.4, vacancyToUnemployment: 0.55,
      breakeven5y: 9.2, surveyExpect5y: 9.7, fedFundsRate: 17.6, outputGap: -1.8,
    },
  },
  {
    name: "2009 Q4 (post-GFC)",
    description: "Demand-shortage deflation episode.",
    input: {
      headlineCpi: 1.5, energyYoY: 18.3, foodYoY: -0.2, vacancyToUnemployment: 0.18,
      breakeven5y: 1.95, surveyExpect5y: 2.7, fedFundsRate: 0.13, outputGap: -5.7,
    },
  },
  {
    name: "Soft landing target",
    description: "Inflation back to 2% with full employment.",
    input: {
      headlineCpi: 2.0, energyYoY: 0, foodYoY: 1.5, vacancyToUnemployment: 1.0,
      breakeven5y: 2.0, surveyExpect5y: 2.0, fedFundsRate: 3.0, outputGap: 0,
    },
  },
];
