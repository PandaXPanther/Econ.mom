import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { BlockMath } from "react-katex";
import "katex/dist/katex.min.css";
import { PageShell } from "@/components/brand/PageShell";
import { ToolPageHeader } from "@/components/brand/ToolPageHeader";
import { TOOL_BY_SLUG } from "@/lib/tools";
import { SEO } from "@/components/brand/SEO";
import { Search, TrendingUp, BookOpen, Calculator, AlertTriangle, Link2 } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Area,
  AreaChart,
  ScatterChart,
  Scatter,
  ZAxis,
} from "recharts";

interface Equation {
  tex: string;
  caption: string;
}

interface WorkedExample {
  setup: string;
  steps: string[];
  answer: string;
}

interface Concept {
  id: string;
  name: string;
  unit: string;
  course: "Macro" | "Micro";
  apCED: string[];
  shortDef: string;
  formalDefinition: string;
  intuition: string;
  equations: Equation[];
  keyAssumptions: string[];
  workedExample: WorkedExample;
  commonMistakes: string[];
  relatedConcepts: string[];
  chart?: {
    type: "line" | "area" | "scatter";
    title: string;
    source: string;
    data: any[];
  };
}

// ─── Recent-vintage chart series (representative; production would proxy FRED) ───
function buildSeries(rows: [number, number][]) {
  return rows.map(([year, value]) => ({ year, value }));
}

const CPI_DATA = buildSeries([
  [2020, 258.8], [2021, 270.9], [2022, 292.7], [2023, 304.7], [2024, 314.2], [2025, 321.5], [2026, 326.8],
]);
const FFR_DATA = buildSeries([
  [2020, 0.5], [2021, 0.08], [2022, 1.68], [2023, 5.02], [2024, 5.33], [2025, 4.12], [2026, 3.65],
]);
const UNEMP_DATA = buildSeries([
  [2020, 8.1], [2021, 5.4], [2022, 3.6], [2023, 3.6], [2024, 4.0], [2025, 4.2], [2026, 4.1],
]);
const M2_GDP = buildSeries([
  [2020, 0.72], [2021, 0.80], [2022, 0.78], [2023, 0.72], [2024, 0.68], [2025, 0.66], [2026, 0.65],
]);
const PHILLIPS = [
  { unemp: 8.1, inflation: 1.2, year: 2020 },
  { unemp: 5.4, inflation: 4.7, year: 2021 },
  { unemp: 3.6, inflation: 8.0, year: 2022 },
  { unemp: 3.6, inflation: 4.1, year: 2023 },
  { unemp: 4.0, inflation: 2.9, year: 2024 },
  { unemp: 4.2, inflation: 2.6, year: 2025 },
  { unemp: 4.1, inflation: 2.4, year: 2026 },
];
const GINI = buildSeries([
  [2016, 0.481], [2018, 0.485], [2020, 0.484], [2022, 0.494], [2024, 0.492], [2026, 0.489],
]);
const LABOR_SHARE = buildSeries([
  [2000, 63.3], [2005, 61.2], [2010, 58.4], [2015, 58.8], [2020, 57.7], [2022, 58.3], [2024, 57.9], [2026, 57.6],
]);
const DEBT_GDP = buildSeries([
  [2015, 100.4], [2018, 105.7], [2020, 133.5], [2022, 120.6], [2024, 121.9], [2026, 124.8],
]);
const YIELD_SPREAD = buildSeries([
  [2019, 0.10], [2020, 0.45], [2021, 1.10], [2022, -0.45], [2023, -1.05], [2024, -0.40], [2025, 0.35], [2026, 0.55],
]);
const OUTPUT_GAP = buildSeries([
  [2019, -0.4], [2020, -3.8], [2021, 0.2], [2022, 1.1], [2023, 0.6], [2024, 0.1], [2025, -0.3], [2026, -0.5],
]);
const REAL_GDP = buildSeries([
  [2019, 21.7], [2020, 21.1], [2021, 22.8], [2022, 23.4], [2023, 23.9], [2024, 24.5], [2025, 25.0], [2026, 25.5],
]);

// ─── Concept catalog ───
const CONCEPTS: Concept[] = [
  // ═══════════════════════════ MACRO ═══════════════════════════
  {
    id: "phillips",
    name: "Phillips Curve",
    unit: "AP Macro · Unit 5",
    course: "Macro",
    apCED: ["MAC-5.A", "MAC-5.B"],
    shortDef: "Short-run inverse relationship between unemployment and inflation.",
    formalDefinition:
      "A short-run negative relationship between the unemployment rate and the inflation rate, formalized by A. W. Phillips (1958) and extended by Friedman (1968) and Phelps (1967) to include inflation expectations and the natural rate of unemployment (NAIRU).",
    intuition:
      "When labor markets tighten, firms must raise wages to attract workers, and they pass those costs into prices. The trade-off only holds in the short run: in the long run, workers update their inflation expectations, and the curve shifts vertically at the NAIRU. The 2022 supply shock visibly pushed inflation above the curve at any given unemployment rate.",
    equations: [
      { tex: "\\pi_t = \\pi^e_t - \\beta\\,(u_t - u^*) + \\varepsilon_t", caption: "Expectations-augmented Phillips curve. β > 0; u* is NAIRU." },
      { tex: "\\pi^e_t = \\pi_{t-1} \\quad \\text{(adaptive)} \\qquad \\text{or} \\qquad \\pi^e_t = \\pi^* \\quad \\text{(rational)}", caption: "Two competing expectations rules drive 1970s vs. modern macro debate." },
      { tex: "\\text{Long run: } u_t = u^* \\;\\Longrightarrow\\; \\text{vertical Phillips curve at NAIRU}", caption: "No permanent unemployment-inflation trade-off." },
    ],
    keyAssumptions: [
      "Sticky nominal wages or prices in the short run.",
      "NAIRU u* is exogenous and reasonably stable.",
      "Supply shocks (oil, pandemic, tariffs) shift the curve outward.",
      "Expectations anchor matters: a credible central bank flattens the curve.",
    ],
    workedExample: {
      setup: "Suppose u* = 4.5%, β = 0.5, expected inflation π^e = 2%, current u = 3.5%, supply shock ε = 1.2 pp.",
      steps: [
        "Compute the unemployment gap: u − u* = 3.5 − 4.5 = −1.0",
        "Wage-price pressure: −β·(u − u*) = −0.5·(−1.0) = +0.5 pp",
        "Add expectations and shock: π = 2 + 0.5 + 1.2",
      ],
      answer: "π ≈ 3.7%, the supply shock alone explains over half the deviation from target.",
    },
    commonMistakes: [
      "Treating the curve as a stable long-run trade-off (Friedman/Phelps disproved this).",
      "Ignoring the supply-shock term ε when explaining 2021–22 inflation.",
      "Confusing u* (NAIRU) with the natural rate u_n: usage varies but they are conceptually similar.",
    ],
    relatedConcepts: ["unemp", "cpi", "ad-as", "output-gap"],
    chart: { type: "scatter", title: "U-Rate × Inflation, 2020–2026", source: "FRED: UNRATE, CPIAUCSL", data: PHILLIPS },
  },
  {
    id: "ffr",
    name: "Federal Funds Rate",
    unit: "AP Macro · Unit 4",
    course: "Macro",
    apCED: ["MAC-4.B", "MAC-4.E"],
    shortDef: "The overnight rate banks charge for excess reserves; the Fed's primary policy lever.",
    formalDefinition:
      "The interest rate at which depository institutions lend reserve balances to other depository institutions overnight. The Federal Open Market Committee (FOMC) sets a target range; the effective rate (EFFR) is the volume-weighted median of trades.",
    intuition:
      "When the Fed wants to slow the economy, it raises the FFR target, borrowing costs ripple through Treasuries, mortgages, and corporate debt. Tightening cycles compress aggregate demand by raising the user cost of capital. The 2022–2024 cycle (0% → 5.33%) was the steepest since Volcker.",
    equations: [
      { tex: "i_{\\text{ON-RRP}} \\;\\le\\; \\text{EFFR} \\;\\le\\; i_{\\text{IORB}}", caption: "Modern floor system: IORB caps the rate, ON-RRP supports the floor." },
      { tex: "i_t = r^* + \\pi_t + 0.5\\,(\\pi_t - \\pi^*) + 0.5\\,(y_t - y^*)", caption: "Taylor rule, the standard policy benchmark." },
      { tex: "r_t = i_t - \\pi^e_t", caption: "Real interest rate, what ultimately matters for investment decisions." },
    ],
    keyAssumptions: [
      "The Fed has credible inflation-targeting commitment (post-1994).",
      "Reserve demand curve is flat in the floor system, so quantity adjustments alone don't move EFFR.",
      "Transmission lags: monetary policy affects output with 6–18 month lag.",
    ],
    workedExample: {
      setup: "Taylor rule with r* = 0.5%, π = 3.2%, π* = 2%, output gap y − y* = 0.5%.",
      steps: [
        "Inflation gap component: 0.5·(3.2 − 2) = 0.6",
        "Output gap component: 0.5·(0.5) = 0.25",
        "Sum: i = 0.5 + 3.2 + 0.6 + 0.25",
      ],
      answer: "Implied policy rate ≈ 4.55%, close to actual 2024 EFFR.",
    },
    commonMistakes: [
      "Confusing the discount rate (lending facility) with the FFR (interbank market).",
      "Ignoring real vs. nominal rate when comparing cycles.",
      "Forgetting the Fed now operates in a floor system, not pre-2008 corridor.",
    ],
    relatedConcepts: ["loanable-funds", "money-market", "yield-curve"],
    chart: { type: "line", title: "Effective FFR, 2020–2026 (%)", source: "FRED: DFF", data: FFR_DATA },
  },
  {
    id: "cpi",
    name: "Consumer Price Index (CPI)",
    unit: "AP Macro · Unit 2",
    course: "Macro",
    apCED: ["MAC-2.B", "MAC-2.C"],
    shortDef: "Weighted price index of a fixed basket of consumer goods and services.",
    formalDefinition:
      "A Laspeyres-type price index measuring the average change over time in prices paid by urban consumers for a market basket of goods and services. BLS publishes headline CPI-U, core CPI (ex food/energy), and chained CPI (substitution-adjusted).",
    intuition:
      "If a basket cost $100 in 1983 and costs $321.50 today, the price level has risen 221%. Annual inflation is the year-over-year percent change. Core CPI strips volatile food and energy to reveal the persistent trend the Fed cares about.",
    equations: [
      { tex: "\\text{CPI}_t = 100 \\cdot \\frac{\\sum_i p_{i,t}\\,q_{i,0}}{\\sum_i p_{i,0}\\,q_{i,0}}", caption: "Laspeyres formula: fixed base-period quantities q_{i,0}." },
      { tex: "\\pi_t = \\frac{\\text{CPI}_t - \\text{CPI}_{t-12}}{\\text{CPI}_{t-12}} \\times 100", caption: "Year-over-year inflation rate." },
      { tex: "w^{\\text{real}}_t = \\frac{w^{\\text{nom}}_t}{\\text{CPI}_t / 100}", caption: "Deflating a nominal wage, the most-used CPI application." },
    ],
    keyAssumptions: [
      "Basket weights updated biennially (BLS now uses a chained methodology for C-CPI-U).",
      "Substitution bias: Laspeyres overstates inflation when consumers substitute toward cheaper goods.",
      "Quality adjustments (hedonics) attempt to net out improvements, but are contested.",
    ],
    workedExample: {
      setup: "CPI in 2021 = 270.9, in 2022 = 292.7. Compute YoY inflation.",
      steps: [
        "Difference: 292.7 − 270.9 = 21.8",
        "Ratio: 21.8 / 270.9 = 0.0805",
        "Convert to %: × 100",
      ],
      answer: "π ≈ 8.0%, the highest annual inflation reading since 1981.",
    },
    commonMistakes: [
      "Comparing CPI levels across years without converting to growth rates.",
      "Ignoring the difference between CPI, PCE (the Fed's preferred measure), and the GDP deflator.",
      "Forgetting that real values use a base year, always check which one.",
    ],
    relatedConcepts: ["real-nominal-gdp", "phillips", "money-multiplier"],
    chart: { type: "area", title: "CPI-U, 2020–2026 (1982–84 = 100)", source: "FRED: CPIAUCSL", data: CPI_DATA },
  },
  {
    id: "unemp",
    name: "Unemployment Rate (U-3)",
    unit: "AP Macro · Unit 2",
    course: "Macro",
    apCED: ["MAC-2.A", "MAC-2.B"],
    shortDef: "Share of the labor force actively searching for work.",
    formalDefinition:
      "U-3 (the headline rate) = unemployed persons / labor force. The labor force = employed + unemployed; persons not actively searching are counted as 'not in the labor force.' BLS also publishes U-1 through U-6 measuring different breadths of labor underutilization.",
    intuition:
      "U-3 tells you who is actively seeking work and not finding it. It misses discouraged workers (U-4), marginally attached (U-5), and part-time-for-economic-reasons workers (U-6). The 2020 spike to 14.7% (April) was the highest since the BLS series began in 1948.",
    equations: [
      { tex: "u = \\frac{U}{E + U} = \\frac{\\text{unemployed}}{\\text{labor force}}", caption: "Headline U-3 definition." },
      { tex: "\\text{LFPR} = \\frac{E + U}{\\text{Population}_{16+}}", caption: "Labor force participation, captures who is in the count at all." },
      { tex: "\\Delta u \\;\\approx\\; -0.5\\,(g_y - g_y^*)", caption: "Okun's law: each pp above potential GDP growth lowers u by ~0.5pp." },
    ],
    keyAssumptions: [
      "'Active search' is defined by BLS: must have searched in the past 4 weeks.",
      "Frictional + structural unemployment together approximate u* (NAIRU).",
      "Cyclical unemployment is the gap above NAIRU during downturns.",
    ],
    workedExample: {
      setup: "Population 16+ = 270M, E = 162M, U = 6.8M.",
      steps: [
        "Labor force = 162 + 6.8 = 168.8M",
        "u = 6.8 / 168.8 = 0.0403",
        "LFPR = 168.8 / 270 = 0.625",
      ],
      answer: "u ≈ 4.0%, LFPR ≈ 62.5%, close to the 2024 actual.",
    },
    commonMistakes: [
      "Treating LFPR drops as 'low unemployment', they may signal discouragement.",
      "Comparing pre-1994 BLS data with post-redesign series without adjustment.",
      "Forgetting that U-6 is roughly 2× U-3 in normal times.",
    ],
    relatedConcepts: ["phillips", "okun", "output-gap"],
    chart: { type: "line", title: "U-3 Rate, 2020–2026 (%)", source: "FRED: UNRATE", data: UNEMP_DATA },
  },
  {
    id: "qty-money",
    name: "Quantity Theory of Money",
    unit: "AP Macro · Unit 4",
    course: "Macro",
    apCED: ["MAC-4.D"],
    shortDef: "MV = PY, the foundational identity linking money supply, prices, and output.",
    formalDefinition:
      "Originating with Hume and formalized by Irving Fisher (1911), MV = PY is an accounting identity that becomes a theory once V (velocity) and Y (real output) are assumed stable. Then ΔM ≈ ΔP, i.e., money growth drives inflation in the long run.",
    intuition:
      "If you double the money stock and velocity doesn't change, nominal GDP must double, and if real output is fixed, all the change is in prices. The 2020–2022 episode was a stress test: M2 surged ~40%, velocity collapsed, then both partially reversed as inflation worked through.",
    equations: [
      { tex: "M \\cdot V = P \\cdot Y", caption: "Fisher's equation of exchange, definitional." },
      { tex: "\\Delta \\ln M + \\Delta \\ln V = \\Delta \\ln P + \\Delta \\ln Y", caption: "Take logs and differentiate: growth-rate form." },
      { tex: "\\text{If } \\Delta V \\approx 0,\\ \\Delta Y \\approx \\Delta Y^* \\;\\Longrightarrow\\; \\pi \\approx \\Delta M - \\Delta Y^*", caption: "Friedman's monetarist conclusion." },
    ],
    keyAssumptions: [
      "Velocity V is stable, or at least predictable.",
      "Long-run causality runs from money to prices (debated).",
      "M is exogenous and controllable (post-2008 reserves picture complicates this).",
    ],
    workedExample: {
      setup: "M grows 8% per year, real output grows 2%, velocity is constant.",
      steps: [
        "Apply growth-rate identity: ΔM + ΔV = ΔP + ΔY",
        "8 + 0 = π + 2",
        "Solve: π = 8 − 2",
      ],
      answer: "Predicted long-run inflation π ≈ 6%.",
    },
    commonMistakes: [
      "Treating MV=PY as a behavioral law rather than an identity.",
      "Assuming V is stable when it shifts dramatically in crises.",
      "Ignoring that the Fed targets interest rates, not M, in modern operating frameworks.",
    ],
    relatedConcepts: ["cpi", "ffr", "money-multiplier"],
    chart: { type: "line", title: "M2 / Nominal GDP, 2020–2026", source: "FRED: M2SL, GDP", data: M2_GDP },
  },
  {
    id: "ad-as",
    name: "AD–AS Model",
    unit: "AP Macro · Unit 3",
    course: "Macro",
    apCED: ["MAC-3.A", "MAC-3.B", "MAC-3.C"],
    shortDef: "The price-level/output framework for analyzing macro shocks and policy.",
    formalDefinition:
      "Aggregate demand (AD) is the negative relationship between price level P and real output Y; aggregate supply has a short-run upward-sloping curve (SRAS) and a vertical long-run curve (LRAS) at potential output Y*. Equilibrium is the intersection.",
    intuition:
      "Demand shocks (fiscal, monetary, confidence) move AD. Supply shocks (oil, pandemic, productivity) move SRAS. In the long run, the economy returns to Y* via wage and price adjustment, only the price level changes. The 2021–2022 inflation was a textbook case of AD shifting right faster than SRAS could accommodate.",
    equations: [
      { tex: "\\text{AD:}\\quad Y = C(Y - T) + I(r) + G + NX(e)", caption: "Components of aggregate demand; r and e are policy-sensitive." },
      { tex: "\\text{SRAS:}\\quad P = P^e \\left(\\frac{Y}{Y^*}\\right)^{\\alpha}", caption: "Lucas/Phelps imperfect-information form, upward sloping when P > Pᵉ." },
      { tex: "\\text{LRAS:}\\quad Y = Y^* \\quad (\\text{vertical})", caption: "Potential output is determined by capital, labor, and technology." },
    ],
    keyAssumptions: [
      "Price stickiness in the short run (menu costs, wage contracts).",
      "Long-run flexibility restores Y to Y*.",
      "AD slopes downward via real-balance, interest-rate, and exchange-rate effects.",
    ],
    workedExample: {
      setup: "Negative supply shock: SRAS shifts left by 4% of Y*. AD unchanged.",
      steps: [
        "Output falls below Y*: recessionary gap opens.",
        "Price level rises: stagflation.",
        "Long run: workers accept lower real wages, SRAS shifts back, Y returns to Y*.",
      ],
      answer: "Short-run: P ↑, Y ↓ simultaneously (1973–74 OPEC archetype). Long-run: Y returns, P stays elevated.",
    },
    commonMistakes: [
      "Confusing AD/AS axes (P, Y) with micro supply/demand axes (P, Q).",
      "Thinking LRAS slopes upward, it's vertical at potential.",
      "Misidentifying supply vs. demand shocks (key FRQ trap).",
    ],
    relatedConcepts: ["phillips", "output-gap", "real-nominal-gdp"],
  },
  {
    id: "is-lm",
    name: "IS–LM Model",
    unit: "AP Macro · Unit 4 (extension)",
    course: "Macro",
    apCED: ["MAC-4.A", "MAC-4.B", "MAC-4.C"],
    shortDef: "Joint equilibrium in goods (IS) and money (LM) markets, the workhorse Keynesian model.",
    formalDefinition:
      "Hicks (1937) reformulated Keynes' General Theory as two curves in (Y, r) space: IS gives goods-market equilibrium where investment equals saving; LM gives money-market equilibrium where money demand equals money supply. Their intersection pins down output and the interest rate.",
    intuition:
      "Fiscal expansion shifts IS right, output and interest rates rise. Monetary expansion shifts LM right, output rises and rates fall. The model explains why monetary policy is impotent in a liquidity trap (flat LM at the zero lower bound), motivating fiscal-policy advocacy.",
    equations: [
      { tex: "\\text{IS:}\\quad Y = C(Y - T) + I(r) + G", caption: "Goods-market equilibrium, lower r raises I, raising equilibrium Y." },
      { tex: "\\text{LM:}\\quad \\frac{M}{P} = L(r,\\,Y)", caption: "Money-market equilibrium, higher Y raises money demand, requiring higher r." },
      { tex: "\\text{Liquidity trap:}\\quad \\frac{\\partial L}{\\partial r} \\to \\infty \\;\\Longrightarrow\\; \\text{LM horizontal}", caption: "Monetary expansion has no effect on r or Y at the zero lower bound." },
    ],
    keyAssumptions: [
      "Closed economy or fixed exchange rate (Mundell–Fleming extends to open economy).",
      "Price level P is fixed in the short run.",
      "Investment depends on r; money demand depends on r and Y.",
    ],
    workedExample: {
      setup: "Government cuts taxes by ΔT = −100. MPC = 0.8. Investment slope ΔI/Δr = −50.",
      steps: [
        "Tax-cut multiplier: ΔY = −MPC/(1−MPC) · ΔT = 0.8/0.2 · 100 = 400 (IS shift)",
        "Higher Y raises money demand, pushing r up: assume Δr = +1pp",
        "Crowding out: ΔI = −50·1 = −50, dampening final ΔY",
      ],
      answer: "Net ΔY ≈ +350. Crowding out reclaims roughly 12% of the fiscal stimulus.",
    },
    commonMistakes: [
      "Treating IS-LM as a long-run model, it's strictly short-run with fixed P.",
      "Forgetting crowding out reduces the simple Keynesian multiplier.",
      "Confusing the LM curve's slope with the Phillips curve.",
    ],
    relatedConcepts: ["ffr", "loanable-funds", "ad-as"],
  },
  {
    id: "loanable-funds",
    name: "Loanable Funds Market",
    unit: "AP Macro · Unit 4",
    course: "Macro",
    apCED: ["MAC-4.A", "MAC-4.C"],
    shortDef: "Real interest rate is set by supply of saving and demand for borrowing.",
    formalDefinition:
      "A classical (long-run) framework where the real interest rate r equilibrates national saving (S = private + public) with investment demand I. Government deficits reduce public saving, raising r and crowding out private investment.",
    intuition:
      "Imagine a market where savers lend and borrowers borrow. The 'price' is r. When the government runs a deficit, it competes for the same pool of funds, pushing r up and squeezing private investment. This is crowding out.",
    equations: [
      { tex: "\\underbrace{(Y - T - C)}_{S_{\\text{private}}} + \\underbrace{(T - G)}_{S_{\\text{public}}} = I", caption: "National saving identity in equilibrium." },
      { tex: "S = S(r,\\,Y),\\quad \\frac{\\partial S}{\\partial r} > 0", caption: "Upward-sloping supply: higher r incentivizes saving." },
      { tex: "I = I(r),\\quad \\frac{\\partial I}{\\partial r} < 0", caption: "Downward-sloping demand: higher r raises the user cost of capital." },
    ],
    keyAssumptions: [
      "Closed economy (open economy adds international capital flows).",
      "Real interest rate is the relevant price (Fisher effect).",
      "Investment is interest-elastic.",
    ],
    workedExample: {
      setup: "Government deficit increases by $200B. Private saving function: ΔS/Δr = +20. Investment: ΔI/Δr = −30.",
      steps: [
        "Public saving falls by $200B → supply curve shifts left by $200B",
        "New equilibrium: solve 200 = (20 + 30)·Δr",
        "Δr = 200/50 = 4pp (illustrative; real-world elasticities are lower)",
      ],
      answer: "r rises by ~4pp; investment falls by 30·4 = $120B (crowding out).",
    },
    commonMistakes: [
      "Confusing loanable funds (real, long-run) with money market (nominal, short-run).",
      "Ignoring that open economies absorb crowding-out via capital inflows.",
      "Forgetting Ricardian equivalence: forward-looking households may save deficit-financed tax cuts.",
    ],
    relatedConcepts: ["ffr", "is-lm", "debt-gdp"],
  },
  {
    id: "money-multiplier",
    name: "Money Multiplier",
    unit: "AP Macro · Unit 4",
    course: "Macro",
    apCED: ["MAC-4.D"],
    shortDef: "How an injection of reserves expands into a larger increase in the money supply.",
    formalDefinition:
      "If banks hold a fraction rr of deposits as reserves and the public holds no currency, a $1 reserve injection supports $1/rr of new deposits. With a currency-deposit ratio cr, the multiplier becomes (1 + cr) / (rr + cr).",
    intuition:
      "Bank A lends out (1−rr) of a new deposit. The borrower spends it; the recipient deposits at Bank B, which keeps rr and lends out (1−rr) again. The geometric series sums to 1/rr. In practice, post-2008 abundant reserves break the textbook multiplier, banks aren't constrained by reserves.",
    equations: [
      { tex: "m = \\frac{1}{rr}", caption: "Simple multiplier: closed system, no currency leakage." },
      { tex: "m = \\frac{1 + cr}{rr + cr}", caption: "Full multiplier with cr = currency/deposit ratio (cash leakage shrinks m)." },
      { tex: "M = m \\cdot \\text{MB}", caption: "Money supply expands proportionally to monetary base × multiplier." },
    ],
    keyAssumptions: [
      "Banks lend out all excess reserves (broken in modern floor system).",
      "Deposit destination is consistent (no flight to currency).",
      "Required reserve ratio is binding (currently 0% in the US).",
    ],
    workedExample: {
      setup: "rr = 0.10, cr = 0.05. Fed buys $100M in Treasuries.",
      steps: [
        "Compute multiplier: (1 + 0.05) / (0.10 + 0.05) = 1.05 / 0.15 = 7.0",
        "Money supply expands by m × ΔMB = 7.0 × 100 = $700M",
      ],
      answer: "ΔM ≈ +$700M (textbook). In practice (2008–present), excess reserves dampen this drastically.",
    },
    commonMistakes: [
      "Using m = 1/rr in modern data, it doesn't fit since 2008.",
      "Confusing M0 (base), M1 (currency + checkable), and M2 (M1 + savings).",
      "Forgetting that the Fed's balance sheet expansion does not mechanically increase M.",
    ],
    relatedConcepts: ["qty-money", "ffr", "loanable-funds"],
  },
  {
    id: "yield-curve",
    name: "Yield Curve & Inversion",
    unit: "AP Macro · Unit 4 (advanced)",
    course: "Macro",
    apCED: ["MAC-4.E"],
    shortDef: "Spread between long and short Treasury yields; an inversion has preceded every US recession since 1969.",
    formalDefinition:
      "The 10-year minus 3-month (or 10y minus 2y) Treasury spread. Normally positive (term premium). Inversion (negative spread) means investors expect the Fed to cut rates, typically because growth is slowing.",
    intuition:
      "A long yield is the expected average of future short rates plus a term premium. When markets expect aggressive future rate cuts (often because they see a recession), the long rate falls below the short rate. Estrella & Mishkin (1996) showed this is one of the most reliable recession indicators in macro.",
    equations: [
      { tex: "y_{10y} = \\frac{1}{40}\\sum_{k=0}^{39} \\mathbb{E}[r_{t+k}] + \\text{TP}", caption: "Expectations hypothesis with term premium TP." },
      { tex: "\\text{Spread} = y_{10y} - y_{3m}", caption: "Most-cited inversion measure (NY Fed model)." },
      { tex: "\\Pr(\\text{recession in 12m}) = \\Phi(\\alpha + \\beta \\cdot \\text{Spread})", caption: "Probit model from Estrella & Mishkin (1996)." },
    ],
    keyAssumptions: [
      "Treasuries are risk-free (so spread reflects expectations + term premium).",
      "Term premium is roughly stable (contestable: TP varies with QE).",
      "Recessions follow inversions with a 6–18 month lag.",
    ],
    workedExample: {
      setup: "y_3m = 5.4%, y_10y = 4.35%. Estrella–Mishkin coefs: α = −0.5, β = −0.7.",
      steps: [
        "Spread = 4.35 − 5.4 = −1.05 (deeply inverted)",
        "Linear index: −0.5 + (−0.7)·(−1.05) = −0.5 + 0.735 = 0.235",
        "Φ(0.235) ≈ 0.59",
      ],
      answer: "P(recession in 12m) ≈ 59%, a deeply inverted curve historically associated with downturn risk.",
    },
    commonMistakes: [
      "Using stocks instead of Treasury yields.",
      "Confusing the level of rates with the slope (an inverted curve at high rates ≠ inverted at low rates).",
      "Treating inversion as guaranteed recession, false positives exist (1966, late 1990s).",
    ],
    relatedConcepts: ["ffr", "loanable-funds", "output-gap"],
    chart: { type: "line", title: "10y–3m Treasury Spread, 2019–2026 (pp)", source: "FRED: T10Y3M", data: YIELD_SPREAD },
  },
  {
    id: "output-gap",
    name: "Output Gap",
    unit: "AP Macro · Unit 3",
    course: "Macro",
    apCED: ["MAC-3.A"],
    shortDef: "Percent deviation of actual GDP from potential GDP.",
    formalDefinition:
      "Gap = (Y − Y*) / Y* × 100, where Y* is potential output (CBO estimate). A negative gap signals recession; positive signals overheating. Used to calibrate fiscal stimulus and policy rules.",
    intuition:
      "Potential is what the economy could produce at full employment with stable inflation. Real output rarely sits exactly there, recessions push it down (negative gap), booms push it up. The 2020 gap fell to −3.8% in Q2; by 2022 it had swung positive as stimulus and reopening combined.",
    equations: [
      { tex: "\\text{Gap}_t = \\frac{Y_t - Y_t^*}{Y_t^*} \\times 100", caption: "Standard CBO measure." },
      { tex: "\\text{Gap}_t \\approx -2\\,(u_t - u^*)", caption: "Okun's law: each pp above NAIRU ≈ 2pp negative output gap." },
      { tex: "Y_t^* = A_t \\cdot K_t^{\\alpha} \\cdot L_t^{1-\\alpha}", caption: "Production-function decomposition: TFP, capital, labor." },
    ],
    keyAssumptions: [
      "Y* is unobserved; CBO and IMF estimates differ materially.",
      "Trend filtering (HP filter) is sensitive to endpoint problems.",
      "Persistent deviations from Y* may reflect mismeasurement of Y*, not just cyclical slack.",
    ],
    workedExample: {
      setup: "Y = 25.0 trillion, Y* = 25.1 trillion.",
      steps: [
        "Gap = (25.0 − 25.1) / 25.1 · 100",
        "Numerator: −0.1; Denominator: 25.1",
        "Compute ratio: −0.398%",
      ],
      answer: "Output gap ≈ −0.4% (slight slack).",
    },
    commonMistakes: [
      "Comparing different vintages of CBO Y* estimates without revision adjustment.",
      "Using nominal GDP instead of real.",
      "Confusing the output gap with the unemployment gap.",
    ],
    relatedConcepts: ["unemp", "phillips", "ad-as"],
    chart: { type: "line", title: "US Output Gap, 2019–2026 (% of Y*)", source: "CBO Potential GDP", data: OUTPUT_GAP },
  },
  {
    id: "real-nominal-gdp",
    name: "Real vs. Nominal GDP",
    unit: "AP Macro · Unit 2",
    course: "Macro",
    apCED: ["MAC-2.A"],
    shortDef: "Nominal GDP uses current prices; real GDP holds prices constant at a base year.",
    formalDefinition:
      "Nominal GDP_t = Σ p_{i,t} · q_{i,t}. Real GDP_t = Σ p_{i,base} · q_{i,t}. The GDP deflator = Nominal/Real × 100; chained real GDP (BEA's standard) updates weights annually.",
    intuition:
      "If prices and quantities both double, nominal GDP quadruples but real GDP only doubles. Real growth is what affects living standards. The deflator differs from CPI because it covers all goods produced (not just consumer basket) and uses current quantity weights.",
    equations: [
      { tex: "\\text{Nominal GDP}_t = \\sum_i p_{i,t}\\,q_{i,t}", caption: "Current-dollar measure." },
      { tex: "\\text{Real GDP}_t = \\sum_i p_{i,\\text{base}}\\,q_{i,t}", caption: "Quantities valued at base-year prices." },
      { tex: "\\text{Deflator}_t = \\frac{\\text{Nominal}_t}{\\text{Real}_t} \\times 100", caption: "Paasche-type implicit price index." },
    ],
    keyAssumptions: [
      "Base year choice matters less under chained methodology.",
      "Real GDP captures changes in quantities, it is the proper welfare metric.",
      "Nominal series should be deflated for any cross-time comparison.",
    ],
    workedExample: {
      setup: "Nominal GDP rose from $22.0T (2021) to $25.5T (2026). Deflator rose from 117 to 140.",
      steps: [
        "Real GDP_2021 = 22.0/1.17 = $18.80T",
        "Real GDP_2026 = 25.5/1.40 = $18.21T",
        "Cumulative real growth: (18.21/18.80) − 1 = −3.1%",
      ],
      answer: "Despite +16% nominal growth, real GDP would have fallen by ~3% (illustrative example).",
    },
    commonMistakes: [
      "Comparing nominal series across decades without deflating.",
      "Confusing GDP deflator with CPI, they differ in scope and methodology.",
      "Using Y in level terms when you mean per-capita (which divides by population).",
    ],
    relatedConcepts: ["cpi", "output-gap", "ad-as"],
    chart: { type: "area", title: "US Real GDP (chained 2017$, trillions)", source: "FRED: GDPC1", data: REAL_GDP },
  },
  {
    id: "mpc-multiplier",
    name: "Marginal Propensity to Consume & Multiplier",
    unit: "AP Macro · Unit 3",
    course: "Macro",
    apCED: ["MAC-3.B"],
    shortDef: "Each $1 of new income generates MPC × $1 of consumption, and the spending cascades.",
    formalDefinition:
      "MPC = ΔC/ΔY_d. The simple Keynesian multiplier 1/(1−MPC) summarizes how an autonomous spending change propagates: new spending becomes someone's income, of which MPC is re-spent, etc., yielding a geometric series.",
    intuition:
      "If MPC = 0.8 and the government spends $100, recipients spend $80, those recipients spend $64, and so on, totaling $500. The multiplier is amplified by the strength of the consumption response and dampened by taxes, imports, and crowding out.",
    equations: [
      { tex: "\\text{MPC} = \\frac{\\Delta C}{\\Delta Y_d}, \\qquad \\text{MPS} = 1 - \\text{MPC}", caption: "Income split between consumption and saving." },
      { tex: "k = \\frac{1}{1 - \\text{MPC}}", caption: "Simple multiplier: closed economy, no taxes." },
      { tex: "k = \\frac{1}{1 - \\text{MPC}(1 - t) + m}", caption: "With taxes (t) and marginal propensity to import (m)." },
    ],
    keyAssumptions: [
      "MPC is stable over the relevant horizon.",
      "Capacity exists (not at full employment).",
      "Rational forward-looking consumers may have lower MPC (Ricardian equivalence).",
    ],
    workedExample: {
      setup: "MPC = 0.75, t = 0.20, m = 0.10. Government spending increases $100B.",
      steps: [
        "Effective MPC out of GDP: 0.75 · (1−0.20) = 0.60",
        "Multiplier: 1 / (1 − 0.60 + 0.10) = 1 / 0.50 = 2.0",
        "ΔY = k · ΔG = 2.0 · 100",
      ],
      answer: "ΔY ≈ $200B, the multiplier is significantly smaller than the closed-economy 4.0.",
    },
    commonMistakes: [
      "Using the closed-economy formula in modern open settings.",
      "Forgetting that MPC varies across income groups (lower-income households tend to have higher MPC).",
      "Conflating the spending multiplier (1/(1−MPC)) with the tax multiplier (−MPC/(1−MPC)).",
    ],
    relatedConcepts: ["is-lm", "ad-as", "loanable-funds"],
  },
  {
    id: "gini",
    name: "Gini Coefficient",
    unit: "AP Macro · Unit 6",
    course: "Macro",
    apCED: ["MAC-6.A"],
    shortDef: "A scalar measure of income inequality between 0 (equality) and 1 (one person owns all).",
    formalDefinition:
      "G = A / (A + B), where A is the area between the Lorenz curve and the 45° line, and B is the area beneath the Lorenz curve. Equivalently, G equals half the relative mean absolute difference of incomes.",
    intuition:
      "Sort everyone from poorest to richest. The Lorenz curve plots cumulative income share against cumulative population share. A 45° line means perfect equality. The further the curve sags below it, the greater the inequality. US Gini (~0.49) is among the highest in the OECD.",
    equations: [
      { tex: "G = \\frac{\\sum_i \\sum_j |y_i - y_j|}{2\\,n^2\\,\\bar{y}}", caption: "Mean absolute difference form." },
      { tex: "G = 1 - 2 \\int_0^1 L(p)\\,dp", caption: "Lorenz-curve integral form. L(p) is cumulative income share at population fraction p." },
      { tex: "A_{\\varepsilon} = 1 - \\left( \\frac{1}{n} \\sum_i \\left(\\frac{y_i}{\\bar{y}}\\right)^{1-\\varepsilon} \\right)^{1/(1-\\varepsilon)}", caption: "Atkinson index: ε = 0 means no aversion, ε → ∞ is Rawlsian." },
    ],
    keyAssumptions: [
      "Pre-tax vs. post-tax-and-transfer Gini differ materially (US: 0.49 vs. ~0.39).",
      "Doesn't distinguish where inequality occurs (top vs. bottom matters for policy).",
      "Sensitive to top-coding in survey data.",
    ],
    workedExample: {
      setup: "Three-person economy: incomes $20K, $40K, $60K. Compute Gini.",
      steps: [
        "Mean income ȳ = 40K. Pairwise differences: |20−40|+|20−60|+|40−60| = 20+40+20 = 80",
        "Total over all i,j (incl. duplicates): 2 · 80 = 160",
        "G = 160 / (2 · 3² · 40) = 160 / 720",
      ],
      answer: "G ≈ 0.222, moderate inequality.",
    },
    commonMistakes: [
      "Comparing Gini across countries with different reporting bases (income vs. consumption).",
      "Treating Gini as a complete welfare statistic, it ignores level of income.",
      "Confusing pre- and post-redistribution measures.",
    ],
    relatedConcepts: ["labor-share", "debt-gdp"],
    chart: { type: "line", title: "US Household Gini, 2016–2026", source: "Census Bureau CPS ASEC", data: GINI },
  },
  {
    id: "labor-share",
    name: "Labor Share of Income",
    unit: "AP Macro · Unit 6",
    course: "Macro",
    apCED: ["MAC-6.B"],
    shortDef: "Fraction of national income paid as labor compensation rather than capital returns.",
    formalDefinition:
      "Labor share = (employee compensation + labor portion of proprietors' income) / national income. The decline from ~63% (2000) to ~57% (2020s) is one of the most-studied stylized facts of modern macroeconomics.",
    intuition:
      "If you split GDP between workers and owners of capital, the workers' slice has been shrinking for two decades. Hypothesized causes: globalization, automation, market concentration, decline of unions, intangible-capital mismeasurement.",
    equations: [
      { tex: "\\alpha_L = \\frac{W \\cdot L}{P \\cdot Y}", caption: "Labor share = wage bill as share of nominal output." },
      { tex: "Y = A\\,K^{\\alpha}\\,L^{1-\\alpha} \\;\\Longrightarrow\\; \\alpha_L = 1 - \\alpha", caption: "Cobb–Douglas: under perfect competition, labor share equals labor's output elasticity." },
      { tex: "\\alpha_L^{\\text{obs}} = \\frac{\\alpha_L^{\\text{comp}}}{\\mu}", caption: "Rising markups μ mechanically reduce observed labor share." },
    ],
    keyAssumptions: [
      "Cobb–Douglas implies a constant labor share, empirically violated.",
      "Mismeasurement (housing, intangibles, self-employed) may overstate decline.",
      "Cross-country evidence shows broad-based decline (Karabarbounis & Neiman 2014).",
    ],
    workedExample: {
      setup: "Wage bill = $11T, GDP = $24T.",
      steps: [
        "Compute ratio: 11 / 24",
        "= 0.458",
        "× 100 to get %",
      ],
      answer: "Labor share ≈ 45.8% (illustrative; BLS measure includes proprietors' labor income, raising the figure to ~58%).",
    },
    commonMistakes: [
      "Conflating labor share (functional distribution) with wage growth (level).",
      "Ignoring that retained-corporate-earnings flow to capital, raising capital share.",
      "Using nominal vs. real wages inconsistently.",
    ],
    relatedConcepts: ["gini", "output-gap"],
    chart: { type: "area", title: "US Non-Farm Business Labor Share (%)", source: "BLS Labor Productivity & Costs", data: LABOR_SHARE },
  },
  {
    id: "debt-gdp",
    name: "Debt-to-GDP",
    unit: "AP Macro · Unit 5",
    course: "Macro",
    apCED: ["MAC-5.A"],
    shortDef: "Federal debt held by the public divided by GDP, the headline fiscal-sustainability ratio.",
    formalDefinition:
      "Debt held by the public excludes intragovernmental holdings (Social Security trust funds, etc.). The dynamics follow d_t − d_{t−1} = (r − g)·d_{t−1} − pb_t, where d = debt/GDP, pb = primary balance, r = interest rate, g = growth.",
    intuition:
      "A country can outgrow its debt (g > r) or be crushed by it (r > g). The post-2020 jump to 134% reflected COVID emergency spending; the slow drift since reflects the hard arithmetic of the equation. If r rises above g for sustained periods, primary surpluses become necessary to stabilize.",
    equations: [
      { tex: "d_t = d_{t-1} \\cdot \\frac{1 + r}{1 + g} - pb_t", caption: "Debt-dynamics equation; pb = primary balance / GDP." },
      { tex: "pb^* = (r - g) \\cdot d", caption: "Stabilizing primary surplus required to hold d constant." },
      { tex: "\\Delta d \\;\\approx\\; (r - g)\\,d \\quad \\text{when } pb = 0", caption: "Snowball effect: debt grows or shrinks via the rate-vs-growth differential." },
    ],
    keyAssumptions: [
      "Debt is denominated in the country's own currency (US dollar privilege).",
      "Investors continue to absorb new issuance at par.",
      "r and g are appropriately measured (real vs. nominal must match).",
    ],
    workedExample: {
      setup: "d = 1.20, r = 4.5%, g = 4.0%, pb = 0%.",
      steps: [
        "Snowball: Δd ≈ (0.045 − 0.040) · 1.20 = 0.0060",
        "New d ≈ 1.206",
        "To stabilize at d = 1.20: pb* = (0.045 − 0.040) · 1.20 = 0.6% of GDP",
      ],
      answer: "Debt drifts up by 0.6pp; a primary surplus of 0.6% of GDP would stabilize it.",
    },
    commonMistakes: [
      "Comparing US debt/GDP to Eurozone members (different currency arrangements).",
      "Mixing nominal and real rates and growth rates.",
      "Assuming debt is a binary 'sustainable/unsustainable' rather than a continuous risk.",
    ],
    relatedConcepts: ["loanable-funds", "ffr", "real-nominal-gdp"],
    chart: { type: "area", title: "US Debt Held by Public / GDP (%)", source: "FRED: GFDEGDQ188S", data: DEBT_GDP },
  },

  // ═══════════════════════════ MICRO ═══════════════════════════
  {
    id: "elasticity",
    name: "Price Elasticity of Demand",
    unit: "AP Micro · Unit 2",
    course: "Micro",
    apCED: ["MIC-2.B", "MIC-2.C"],
    shortDef: "Percent change in quantity demanded per percent change in price.",
    formalDefinition:
      "ε_d = (%ΔQ_d) / (%ΔP). |ε_d| > 1 = elastic; |ε_d| = 1 = unit elastic; |ε_d| < 1 = inelastic. Determinants: substitute availability, share of budget, time horizon, necessity vs. luxury.",
    intuition:
      "Gasoline is famously inelastic in the short run (~0.3): if prices rise 10%, consumption falls only 3%. Restaurant meals are highly elastic, a 10% price hike sends diners elsewhere. Total revenue and elasticity move in opposite directions: cutting prices raises revenue when demand is elastic.",
    equations: [
      { tex: "\\varepsilon_d = \\frac{\\Delta Q / Q}{\\Delta P / P} = \\frac{\\Delta Q}{\\Delta P} \\cdot \\frac{P}{Q}", caption: "Point elasticity." },
      { tex: "\\varepsilon_d^{\\text{mid}} = \\frac{(Q_2 - Q_1)/\\tfrac{Q_1 + Q_2}{2}}{(P_2 - P_1)/\\tfrac{P_1 + P_2}{2}}", caption: "Midpoint formula, avoids reference-point ambiguity." },
      { tex: "\\text{TR} = P \\cdot Q \\;\\Longrightarrow\\; \\frac{d\\,\\text{TR}}{dP} > 0 \\iff |\\varepsilon_d| < 1", caption: "Inelastic demand: raise price to raise revenue." },
    ],
    keyAssumptions: [
      "Other determinants (income, prices of substitutes) held constant.",
      "Elasticity varies along a linear demand curve, specify the point.",
      "Long-run elasticities exceed short-run.",
    ],
    workedExample: {
      setup: "Price rises from $10 to $12. Quantity falls from 100 to 80.",
      steps: [
        "Midpoint %ΔQ = (80−100)/90 = −22.2%",
        "Midpoint %ΔP = (12−10)/11 = +18.2%",
        "ε_d = −22.2 / 18.2",
      ],
      answer: "ε_d ≈ −1.22 (elastic). Revenue change: 12·80 − 10·100 = 960 − 1000 = −$40 (revenue falls when raising prices in elastic range).",
    },
    commonMistakes: [
      "Forgetting the negative sign, ε_d is conventionally reported as |ε_d|.",
      "Using point elasticity over wide price ranges.",
      "Confusing elasticity with the slope of the demand curve.",
    ],
    relatedConcepts: ["surplus", "monopoly-dwl"],
  },
  {
    id: "surplus",
    name: "Consumer & Producer Surplus",
    unit: "AP Micro · Unit 2",
    course: "Micro",
    apCED: ["MIC-2.A"],
    shortDef: "Welfare measures: gain to buyers vs. sellers from market trade.",
    formalDefinition:
      "Consumer surplus (CS) = area between the demand curve and price, integrated up to Q. Producer surplus (PS) = area between price and the supply curve. Total surplus = CS + PS measures social welfare in the absence of externalities.",
    intuition:
      "If you'd pay $50 for a concert ticket but it costs $30, your CS is $20, the value beyond what you paid. Similarly, sellers receive PS = price minus marginal cost. A binding price ceiling reduces total surplus by creating a deadweight loss triangle.",
    equations: [
      { tex: "\\text{CS} = \\int_0^{Q^*} \\bigl(D(q) - P^*\\bigr)\\,dq", caption: "Consumer surplus: area below demand, above price." },
      { tex: "\\text{PS} = \\int_0^{Q^*} \\bigl(P^* - S(q)\\bigr)\\,dq", caption: "Producer surplus: area above supply, below price." },
      { tex: "\\text{DWL} = \\tfrac{1}{2} \\,|\\Delta Q|\\,|\\Delta P|", caption: "Triangular welfare loss from a market wedge (linear approximation)." },
    ],
    keyAssumptions: [
      "No externalities (otherwise market surplus ≠ social welfare).",
      "Demand curves accurately reflect willingness to pay (no behavioral biases).",
      "Marginal cost curves accurately reflect opportunity cost.",
    ],
    workedExample: {
      setup: "Linear D: P = 100 − Q. Linear S: P = 20 + Q. Equilibrium?",
      steps: [
        "Set D = S:  100 − Q = 20 + Q  ⇒  Q* = 40, P* = 60",
        "CS = ½ · 40 · (100 − 60) = 800",
        "PS = ½ · 40 · (60 − 20) = 800",
      ],
      answer: "Total surplus = $1,600. CS = PS = $800 (symmetric linear case).",
    },
    commonMistakes: [
      "Computing CS using market price × quantity (that's revenue, not surplus).",
      "Treating tax revenue as deadweight loss, it's a transfer.",
      "Forgetting that a price ceiling above equilibrium has zero effect.",
    ],
    relatedConcepts: ["elasticity", "monopoly-dwl", "externalities"],
  },
  {
    id: "comp-advantage",
    name: "Comparative Advantage",
    unit: "AP Micro · Unit 1",
    course: "Micro",
    apCED: ["MIC-1.B", "MIC-1.C"],
    shortDef: "Trade is mutually beneficial when each party specializes in its lowest-opportunity-cost good.",
    formalDefinition:
      "Ricardo (1817): country A has comparative advantage in good X if its opportunity cost of producing X (in terms of Y forgone) is lower than country B's. Specialization plus trade can move both countries beyond their PPFs in consumption.",
    intuition:
      "A surgeon may type faster than her assistant, but her opportunity cost of typing (forgone surgery) is enormous, so she should still hire the assistant. Comparative (not absolute) advantage governs efficient specialization.",
    equations: [
      { tex: "\\text{OC}_A(X) = \\frac{\\Delta Y_A}{\\Delta X_A}", caption: "Country A's opportunity cost of one unit of X (units of Y forgone)." },
      { tex: "\\text{A has CA in } X \\iff \\text{OC}_A(X) < \\text{OC}_B(X)", caption: "Specialization rule." },
      { tex: "\\text{OC}_A(X) \\;<\\; \\frac{P_X}{P_Y} \\;<\\; \\text{OC}_B(X)", caption: "Mutually beneficial terms of trade lie between the two opportunity costs." },
    ],
    keyAssumptions: [
      "Constant opportunity costs (linear PPF) for the simplest case.",
      "No transport costs or trade barriers.",
      "Full specialization is feasible.",
    ],
    workedExample: {
      setup: "A produces 10 wheat or 5 cloth in a day. B produces 4 wheat or 4 cloth.",
      steps: [
        "OC_A(wheat) = 5/10 = 0.5 cloth.  OC_B(wheat) = 4/4 = 1.0 cloth",
        "A has CA in wheat (lower OC). B has CA in cloth.",
        "If terms of trade = 0.75 cloth per wheat, both gain from trade.",
      ],
      answer: "A specializes in wheat, B in cloth. At trade ratio 0.75, both consume beyond their PPFs.",
    },
    commonMistakes: [
      "Confusing absolute and comparative advantage.",
      "Forgetting that opportunity costs must be expressed in the same units.",
      "Concluding 'the more productive country gains all the trade benefits', both gain.",
    ],
    relatedConcepts: ["ppf"],
  },
  {
    id: "ppf",
    name: "Production Possibilities Frontier",
    unit: "AP Micro · Unit 1",
    course: "Micro",
    apCED: ["MIC-1.A"],
    shortDef: "Boundary of efficient output combinations given fixed resources and technology.",
    formalDefinition:
      "The set of maximum output combinations of two goods producible with all available factors fully and efficiently employed. The PPF's slope at any point equals the marginal opportunity cost of the x-axis good in terms of the y-axis good.",
    intuition:
      "A bowed-out PPF reflects increasing opportunity cost, resources aren't equally suited to both goods. A linear PPF reflects constant opportunity cost. Inside the PPF = inefficient (unemployment); on it = efficient; beyond = infeasible without growth or trade.",
    equations: [
      { tex: "-\\frac{dY}{dX} = \\text{MRT}_{X \\to Y}", caption: "Slope of the PPF, marginal rate of transformation = opportunity cost." },
      { tex: "Y = a - b\\,X \\quad \\Longrightarrow \\quad \\text{constant OC} = b", caption: "Linear PPF, constant opportunity cost." },
      { tex: "Y = \\bigl(R - X^k\\bigr)^{1/m}", caption: "Bowed PPF, increasing opportunity cost (realistic case)." },
    ],
    keyAssumptions: [
      "Resources and technology are fixed.",
      "All resources fully and efficiently employed on the frontier.",
      "Two-good simplification (extends to n goods conceptually).",
    ],
    workedExample: {
      setup: "Linear PPF: Y = 60 − 2X. Currently producing (X=10, Y=40).",
      steps: [
        "Verify on PPF: 60 − 2·10 = 40 ✓",
        "Opportunity cost of one more X: dY/dX = −2 (give up 2Y for 1X)",
        "Move to (X=15, Y=30): give up 10Y for 5X (consistent with slope)",
      ],
      answer: "Each additional X costs 2Y. Producing inside (e.g., X=10, Y=30) wastes 10 units of Y.",
    },
    commonMistakes: [
      "Calling points inside the PPF 'impossible', they are merely inefficient.",
      "Forgetting that economic growth shifts the PPF outward.",
      "Confusing the PPF with the budget constraint (different concept).",
    ],
    relatedConcepts: ["comp-advantage"],
  },
  {
    id: "monopoly-dwl",
    name: "Monopoly Deadweight Loss",
    unit: "AP Micro · Unit 4",
    course: "Micro",
    apCED: ["MIC-4.B", "MIC-4.C"],
    shortDef: "A monopolist restricts output below the socially optimal level, creating welfare loss.",
    formalDefinition:
      "A monopolist faces the entire market demand and equates marginal revenue (MR) with marginal cost (MC). Since MR < P (demand), the monopoly output Q_m < Q_competitive, and the price P_m > MC. The triangle between the demand and MC curves over [Q_m, Q_c] is deadweight loss.",
    intuition:
      "A competitive market produces where P = MC, every unit whose value to consumers exceeds its cost gets made. A monopolist withholds these socially valuable units to sustain a higher price. The forgone trades are pure waste, not transfers.",
    equations: [
      { tex: "\\text{MR} = P \\left(1 + \\frac{1}{\\varepsilon_d}\\right)", caption: "Inverse-elasticity rule, MR < P whenever demand is finitely elastic." },
      { tex: "\\text{MR} = \\text{MC} \\;\\Longrightarrow\\; \\frac{P - \\text{MC}}{P} = -\\frac{1}{\\varepsilon_d}", caption: "Lerner index, optimal markup is inversely related to elasticity." },
      { tex: "\\text{DWL} = \\tfrac{1}{2}\\,(Q_c - Q_m)(P_m - \\text{MC})", caption: "Welfare-loss triangle (linear approximation)." },
    ],
    keyAssumptions: [
      "Single price (no perfect price discrimination, which would eliminate DWL but transfer all CS to firm).",
      "Constant marginal cost or known cost function.",
      "No regulation or natural-monopoly cost structure.",
    ],
    workedExample: {
      setup: "Demand: P = 100 − Q. MC = 20. Monopoly optimum?",
      steps: [
        "TR = P·Q = (100−Q)Q. MR = 100 − 2Q.",
        "Set MR = MC:  100 − 2Q = 20  ⇒  Q_m = 40,  P_m = 60",
        "Competitive Q_c (where P=MC):  100 − Q = 20  ⇒  Q_c = 80",
        "DWL = ½ · (80−40) · (60−20) = ½ · 40 · 40",
      ],
      answer: "DWL = $800. Monopoly profit (excluding fixed costs) = (60−20)·40 = $1,600.",
    },
    commonMistakes: [
      "Confusing producer surplus with profit (PS does not subtract fixed costs).",
      "Computing DWL with the wrong base (use the gap between Q_c and Q_m, not between 0 and Q_m).",
      "Forgetting that perfect price discrimination eliminates DWL entirely.",
    ],
    relatedConcepts: ["surplus", "elasticity"],
  },
  {
    id: "externalities",
    name: "Externalities & Pigouvian Taxes",
    unit: "AP Micro · Unit 6",
    course: "Micro",
    apCED: ["MIC-6.A", "MIC-6.B"],
    shortDef: "When private costs/benefits diverge from social, markets misallocate; a tax/subsidy can correct it.",
    formalDefinition:
      "A negative externality (e.g., pollution) arises when MSC > MPC: the social cost exceeds the private cost. The market overproduces. Pigou (1920): set a tax τ = MSC − MPC at the social optimum to internalize the externality and restore efficiency.",
    intuition:
      "A power plant that emits CO₂ doesn't pay for the climate damage, so it produces too much electricity. A tax equal to the marginal climate damage forces the plant to internalize the cost, cutting output to the socially optimal level. Coase (1960) showed bargaining can also work when property rights are well-defined.",
    equations: [
      { tex: "\\text{MSC} = \\text{MPC} + \\text{MEC}, \\quad \\text{MEC} > 0", caption: "Negative externality: marginal external cost added to private cost." },
      { tex: "\\text{MSC} = \\text{MSB} \\quad \\text{(social optimum)}", caption: "Efficiency requires equating social, not private, margins." },
      { tex: "\\tau^* = \\text{MEC} \\big|_{Q = Q^*}", caption: "Pigouvian tax level that achieves the social optimum." },
    ],
    keyAssumptions: [
      "Externality is measurable (rarely true precisely).",
      "Government can set the optimal tax (information problem).",
      "Coase: low transaction costs and well-defined property rights enable private bargaining.",
    ],
    workedExample: {
      setup: "MPC = 20 + Q.  MEC = 10. Demand: P = 100 − Q.",
      steps: [
        "Market eq: 100 − Q = 20 + Q  ⇒  Q_m = 40,  P_m = 60",
        "Social MSC = 30 + Q.  Optimum: 100 − Q = 30 + Q  ⇒  Q* = 35,  P* = 65",
        "Optimal Pigouvian tax: τ = MEC = 10",
      ],
      answer: "Optimal tax of $10 reduces output from 40 to 35 and restores efficiency.",
    },
    commonMistakes: [
      "Setting τ to total damage rather than marginal damage at Q*.",
      "Confusing positive and negative externalities (subsidies fix positive externalities).",
      "Ignoring administrative costs that may exceed welfare gains.",
    ],
    relatedConcepts: ["surplus", "monopoly-dwl"],
  },
  {
    id: "game-theory",
    name: "Game Theory & Nash Equilibrium",
    unit: "AP Micro · Unit 4",
    course: "Micro",
    apCED: ["MIC-4.D"],
    shortDef: "Strategic interaction: each player's best response given others' strategies.",
    formalDefinition:
      "A Nash equilibrium is a strategy profile (s_1*, ..., s_n*) such that no player can profitably deviate, holding others fixed: u_i(s_i*, s_{-i}*) ≥ u_i(s_i', s_{-i}*) for all s_i'. The Prisoner's Dilemma is the canonical example where individual rationality produces a collectively bad outcome.",
    intuition:
      "Two suspects can each cooperate (stay silent) or defect (confess). Both defecting is the unique Nash equilibrium even though both cooperating yields higher joint payoff. The lesson: rational individual choice can be collectively self-destructive, motivating institutions and contracts.",
    equations: [
      { tex: "\\forall i:\\quad s_i^* \\in \\arg\\max_{s_i} u_i\\bigl(s_i,\\,s_{-i}^*\\bigr)", caption: "Nash equilibrium, mutual best response." },
      { tex: "u_i(s_i,\\,\\sigma_{-i}^*) = \\text{const}\\quad \\forall\\,s_i \\in \\text{supp}(\\sigma_i^*)", caption: "Indifference condition for mixed-strategy Nash." },
      { tex: "q_i^* = \\frac{a - c}{3b} \\quad \\text{(symmetric Cournot duopoly)}", caption: "Nash output per firm with linear demand P = a - bQ." },
    ],
    keyAssumptions: [
      "Players are rational (utility-maximizing).",
      "Common knowledge of payoffs.",
      "Simultaneous (or strategically equivalent) move structure for the basic case.",
    ],
    workedExample: {
      setup: "Cournot duopoly. Demand: P = 100 − Q (Q = q1+q2). MC = 20 each.",
      steps: [
        "Firm 1: max (100 − q1 − q2 − 20)·q1.  FOC: 80 − 2q1 − q2 = 0",
        "By symmetry: q1 = q2 = q*",
        "80 − 3q* = 0  ⇒  q* = 80/3 ≈ 26.67",
      ],
      answer: "Each firm produces ~26.67. Total Q ≈ 53.3, P ≈ 46.7. (Compare: monopoly Q = 40, perfect comp Q = 80.)",
    },
    commonMistakes: [
      "Confusing dominant strategy with Nash equilibrium (every dominant-strategy outcome is Nash, not vice versa).",
      "Forgetting that multiple Nash equilibria are common.",
      "Treating the Prisoner's Dilemma payoffs as fixed across applications.",
    ],
    relatedConcepts: ["monopoly-dwl"],
  },
];

export default function TextbookAtlas() {
  const tool = TOOL_BY_SLUG["textbook-atlas"];
  const [query, setQuery] = useState("");
  const [filterCourse, setFilterCourse] = useState<"All" | "Macro" | "Micro">("All");
  const [activeId, setActiveId] = useState(CONCEPTS[0].id);

  const filtered = useMemo(() => {
    const matched = CONCEPTS.filter((c) => {
      if (filterCourse !== "All" && c.course !== filterCourse) return false;
      if (!query) return true;
      const q = query.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.shortDef.toLowerCase().includes(q) ||
        c.formalDefinition.toLowerCase().includes(q) ||
        c.unit.toLowerCase().includes(q) ||
        c.apCED.some((id) => id.toLowerCase().includes(q))
      );
    });
    // Sort: Macro before Micro, then by Unit number ascending, then by name.
    return matched.sort((a, b) => {
      if (a.course !== b.course) return a.course === "Macro" ? -1 : 1;
      const unitNum = (s: string) => {
        const m = s.match(/Unit\s+(\d+)/i);
        return m ? parseInt(m[1], 10) : 99;
      };
      const ua = unitNum(a.unit);
      const ub = unitNum(b.unit);
      if (ua !== ub) return ua - ub;
      return a.name.localeCompare(b.name);
    });
  }, [query, filterCourse]);

  const active = CONCEPTS.find((c) => c.id === activeId) || CONCEPTS[0];
  const related = active.relatedConcepts
    .map((id) => CONCEPTS.find((c) => c.id === id))
    .filter(Boolean) as Concept[];

  return (
    <PageShell>
      <SEO
        title="Textbook Atlas, every AP Econ concept with formal definitions, equations, worked examples | The Mother Of Econ"
        description="A living textbook for AP Macro and AP Micro. 24 core concepts, each with formal definitions, intuition, equations, key assumptions, worked numerical examples, and live FRED charts."
        path="/textbook-atlas"
      />
      <ToolPageHeader tool={tool} />
      <section className="mx-auto max-w-7xl px-6 py-12 lg:px-10 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-12">
          {/* ─── Sidebar ─── */}
          <aside className="lg:col-span-4">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search concepts, equations, CED codes…"
                data-testid="input-search-concepts"
                className="w-full rounded-md border border-border bg-card pl-9 pr-3 py-2.5 text-sm focus:border-primary focus:outline-none"
              />
            </div>

            <div className="mt-4 flex gap-1.5" role="tablist">
              {(["All", "Macro", "Micro"] as const).map((c) => (
                <button
                  key={c}
                  onClick={() => setFilterCourse(c)}
                  data-testid={`button-filter-${c.toLowerCase()}`}
                  className={`flex-1 rounded-md border px-3 py-1.5 font-mono text-[0.68rem] uppercase tracking-widest transition-all ${
                    filterCourse === c
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:bg-muted/40"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>

            <div className="mt-3 font-mono text-[0.68rem] uppercase tracking-widest text-muted-foreground">
              {filtered.length} concept{filtered.length === 1 ? "" : "s"}
            </div>

            <div className="mt-4 space-y-1">
              {filtered.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveId(c.id)}
                  data-testid={`button-concept-${c.id}`}
                  className={`w-full rounded-md border-l-2 px-4 py-3 text-left transition-all ${
                    activeId === c.id ? "border-primary bg-primary/5" : "border-transparent hover:bg-muted/40"
                  }`}
                >
                  <div className="font-mono text-[0.68rem] uppercase tracking-widest text-muted-foreground">
                    {c.unit}
                  </div>
                  <div className="mt-1 font-display text-[1rem] font-medium">{c.name}</div>
                  <div className="mt-1 text-xs text-muted-foreground line-clamp-2">{c.shortDef}</div>
                </button>
              ))}
            </div>
          </aside>

          {/* ─── Main panel ─── */}
          <article className="lg:col-span-8" key={active.id}>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              {/* Header */}
              <div className="flex flex-wrap items-baseline gap-3">
                <span className="label-cap">{active.unit}</span>
                <span className="font-mono text-[0.68rem] uppercase tracking-widest text-primary/80">
                  CED {active.apCED.join(" · ")}
                </span>
              </div>
              <h2 className="text-editorial mt-2 text-[2.5rem] lg:text-[3rem]">
                {active.name}
              </h2>
              <p className="prose-serif mt-4 text-[1.1rem] text-foreground/85">
                {active.shortDef}
              </p>

              <div className="rule-double mt-8" />

              {/* Formal definition */}
              <SectionHeader icon={<BookOpen size={12} />} label="Formal definition" />
              <p className="prose-serif mt-3 text-[1.02rem] text-foreground/90 leading-relaxed">
                {active.formalDefinition}
              </p>

              {/* Intuition */}
              <SectionHeader icon={<BookOpen size={12} />} label="Intuition" />
              <p className="prose-serif mt-3 text-[1.02rem] text-foreground/85 leading-relaxed">
                {active.intuition}
              </p>

              {/* Equations */}
              <SectionHeader icon={<Calculator size={12} />} label="Equations" />
              <div className="mt-4 space-y-3">
                {active.equations.map((eq, i) => (
                  <div
                    key={i}
                    className="rounded-md border border-border bg-card/60 p-5"
                  >
                    <div className="katex-block text-foreground overflow-x-auto">
                      <BlockMath math={eq.tex} />
                    </div>
                    <div className="mt-3 font-serif text-[0.88rem] italic text-muted-foreground">
                      {eq.caption}
                    </div>
                  </div>
                ))}
              </div>

              {/* Key assumptions */}
              <SectionHeader icon={<AlertTriangle size={12} />} label="Key assumptions" />
              <ul className="mt-3 space-y-2">
                {active.keyAssumptions.map((a, i) => (
                  <li key={i} className="flex gap-3 text-[0.95rem] text-foreground/85">
                    <span className="mt-1 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                    <span>{a}</span>
                  </li>
                ))}
              </ul>

              {/* Worked example */}
              <SectionHeader icon={<Calculator size={12} />} label="Worked example" />
              <div className="mt-4 rounded-md border border-primary/30 bg-primary/[0.04] p-5">
                <div className="font-mono text-[0.68rem] uppercase tracking-widest text-primary/80 mb-2">Setup</div>
                <p className="prose-serif text-[0.98rem] text-foreground/90">{active.workedExample.setup}</p>
                <div className="font-mono text-[0.68rem] uppercase tracking-widest text-primary/80 mt-4 mb-2">Solution</div>
                <ol className="space-y-1.5 text-[0.95rem] text-foreground/85">
                  {active.workedExample.steps.map((s, i) => (
                    <li key={i} className="font-mono text-[0.88rem]">
                      <span className="text-primary mr-2">{i + 1}.</span>
                      {s}
                    </li>
                  ))}
                </ol>
                <div className="font-mono text-[0.68rem] uppercase tracking-widest text-primary/80 mt-4 mb-2">Answer</div>
                <p className="prose-serif text-[1rem] font-medium text-foreground">{active.workedExample.answer}</p>
              </div>

              {/* Common mistakes */}
              <SectionHeader icon={<AlertTriangle size={12} />} label="Common mistakes" />
              <ul className="mt-3 space-y-2">
                {active.commonMistakes.map((m, i) => (
                  <li key={i} className="flex gap-3 text-[0.95rem] text-foreground/85">
                    <span className="mt-1 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary/60" />
                    <span>{m}</span>
                  </li>
                ))}
              </ul>

              {/* Live chart, if any */}
              {active.chart && (
                <>
                  <SectionHeader icon={<TrendingUp size={12} />} label="Live chart" />
                  <div className="mt-4 rounded-xl border border-border bg-card p-6 lg:p-8">
                    <div className="flex flex-wrap items-baseline justify-between gap-2 mb-6">
                      <h3 className="font-display text-[1.2rem] font-medium">
                        {active.chart.title}
                      </h3>
                      <div className="font-mono text-[0.7rem] text-muted-foreground">
                        Source: {active.chart.source}
                      </div>
                    </div>
                    <div className="h-[320px] -ml-2">
                      <ChartFor concept={active} />
                    </div>
                  </div>
                </>
              )}

              {/* Related concepts */}
              {related.length > 0 && (
                <>
                  <SectionHeader icon={<Link2 size={12} />} label="Related concepts" />
                  <div className="mt-4 flex flex-wrap gap-2">
                    {related.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => setActiveId(r.id)}
                        data-testid={`button-related-${r.id}`}
                        className="rounded-md border border-border px-3 py-1.5 text-sm transition-all hover:border-primary hover:bg-primary/5"
                      >
                        {r.name}
                      </button>
                    ))}
                  </div>
                </>
              )}

              <div className="mt-16 font-mono text-[0.7rem] uppercase tracking-widest text-muted-foreground">
                econ.mom · Textbook Atlas · Concept Nº {CONCEPTS.findIndex((c) => c.id === active.id) + 1} of {CONCEPTS.length}
              </div>
            </motion.div>
          </article>
        </div>
      </section>
    </PageShell>
  );
}

function SectionHeader({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="mt-10 flex items-center gap-2">
      <span className="text-primary">{icon}</span>
      <span className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-primary">{label}</span>
      <span className="ml-2 h-px flex-1 bg-border" />
    </div>
  );
}

function ChartFor({ concept }: { concept: Concept }) {
  if (!concept.chart) return null;
  if (concept.chart.type === "scatter") {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 8, right: 12, bottom: 32, left: 32 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            type="number"
            dataKey="unemp"
            name="Unemployment"
            label={{ value: "Unemployment (%)", position: "insideBottom", offset: -18, fontSize: 11 }}
            stroke="hsl(var(--muted-foreground))"
            fontSize={11}
          />
          <YAxis
            type="number"
            dataKey="inflation"
            name="Inflation"
            label={{ value: "Inflation (%)", angle: -90, position: "insideLeft", offset: -18, fontSize: 11 }}
            stroke="hsl(var(--muted-foreground))"
            fontSize={11}
          />
          <ZAxis range={[60, 200]} />
          <Tooltip
            contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 6, fontSize: 12 }}
            cursor={{ strokeDasharray: "3 3" }}
            formatter={(v: any, n: string) => [v, n]}
            labelFormatter={(_v: any, p: any) => (p && p[0] ? `Year ${p[0].payload.year}` : "")}
          />
          <Scatter data={concept.chart.data} fill="hsl(var(--primary))" />
        </ScatterChart>
      </ResponsiveContainer>
    );
  }
  if (concept.chart.type === "area") {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={concept.chart.data} margin={{ top: 8, right: 12, bottom: 8, left: 0 }}>
          <defs>
            <linearGradient id="grad-area" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="year" stroke="hsl(var(--muted-foreground))" fontSize={11} />
          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
          <Tooltip
            contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 6, fontSize: 12 }}
          />
          <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#grad-area)" />
        </AreaChart>
      </ResponsiveContainer>
    );
  }
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={concept.chart.data} margin={{ top: 8, right: 12, bottom: 8, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="year" stroke="hsl(var(--muted-foreground))" fontSize={11} />
        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
        <Tooltip
          contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 6, fontSize: 12 }}
        />
        <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
