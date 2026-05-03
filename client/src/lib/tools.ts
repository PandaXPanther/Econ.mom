// Centralized tools catalog for The Mother Of Econ
// Edit here to update across the entire site (hub, methodology page, footer)

export type ToolStatus = "live" | "beta" | "soon";

export interface Tool {
  slug: string;
  number: string;        // editorial roman-numeral or roman style
  name: string;
  tagline: string;       // short pitch
  blurb: string;         // longer description
  status: ToolStatus;
  category: "Macro" | "Micro" | "Tools" | "Education" | "Trade" | "Local" | "Policy";
  icon: string;          // emoji-free symbol (lucide name)
  flagship?: boolean;
  citations: { label: string; url?: string }[];
  methodology: string[];  // bullet methodology points
}

export const TOOLS: Tool[] = [
  {
    slug: "frq-grader",
    number: "I",
    name: "AP FRQ Grader",
    tagline: "College Board–rubric scoring for every AP Macro & Micro free-response.",
    blurb:
      "Paste your FRQ response. The grader scores it against the official College Board rubric, point-by-point, with line-level feedback and a 5/5 rewrite. Trained on every released CB rubric 2018–2025.",
    status: "live",
    category: "Education",
    icon: "graduation-cap",
    flagship: true,
    citations: [
      { label: "College Board AP Macroeconomics Course & Exam Description", url: "https://apcentral.collegeboard.org/courses/ap-macroeconomics" },
      { label: "College Board AP Microeconomics CED", url: "https://apcentral.collegeboard.org/courses/ap-microeconomics" },
      { label: "College Board released FRQs and scoring guidelines, 2018–2025", url: "https://apcentral.collegeboard.org/courses/ap-macroeconomics/exam" },
    ],
    methodology: [
      "Rubric loaded directly from College Board's published scoring guidelines for every released exam (2018–2025) plus the current Course & Exam Description.",
      "Each FRQ part is graded against its specific rubric points (e.g., 'correctly labeled S/D graph with axes', 'identifies new equilibrium').",
      "Graph checks parse user-described diagrams (or uploaded images via OCR) for axis labels, curve shifts, and equilibrium markers.",
      "The 5/5 rewrite is generated to satisfy every rubric point with the exact terminology graders are trained to reward.",
      "Graders calibrated against College Board sample responses graded 0/5, 3/5, and 5/5 to ensure consistent point allocation.",
    ],
  },
  {
    slug: "tarifflab",
    number: "II",
    name: "TariffLab",
    tagline: "Deadweight loss, CS/PS, revenue, and employment effects of any tariff — done right.",
    blurb:
      "Pick a sector or HS code, set a tariff rate, and TariffLab computes the deadweight-loss triangle, consumer/producer surplus shifts, government revenue, and employment effects using USITC and Peterson Institute elasticities.",
    status: "live",
    category: "Trade",
    icon: "ship",
    flagship: true,
    citations: [
      { label: "USITC Economic Working Paper EE-2024 (Ahmad & Schreiber, sector elasticities)", url: "https://www.usitc.gov/publications/332/working_papers" },
      { label: "Fajgelbaum, Goldberg, Kennedy, Khandelwal (2020) — 'Return to Protectionism'", url: "https://academic.oup.com/qje/article/135/1/1/5626442" },
      { label: "Broda & Weinstein (2006) — 'Globalization and the Gains from Variety'", url: "https://academic.oup.com/qje/article/121/2/541/1884045" },
      { label: "Executive Order 14257 (April 2, 2025) — Reciprocal Tariff", url: "https://www.federalregister.gov/" },
      { label: "U.S. Census Bureau — international trade data by HS code", url: "https://www.census.gov/foreign-trade/" },
    ],
    methodology: [
      "Median Armington elasticity of substitution σ = 5.65 (NAICS 3-digit) from USITC EE-2024 (Ahmad & Schreiber). Older σ ≈ 3.10 (Broda-Weinstein) shown as alternate.",
      "Pass-through coefficients calibrated to Fajgelbaum et al. (2020): ~100% incidence on US importers/consumers for US tariffs; ~68% incomplete pass-through for retaliatory tariffs.",
      "Deadweight loss approximated as ½ × Δquantity × tariff (linear S/D approximation around the equilibrium).",
      "2025 baseline integrates EO 14257's universal 10% ad valorem and Annex II exemptions (copper, pharma, semis, lumber, critical minerals, energy).",
      "Retaliation matrix tracks Canadian, Chinese (MOFCOM), and EU (Reg. 2025/1564) responses as of last refresh.",
      "Aggregate baseline anchored to US 2024 imports of $3,295.6B (BEA / Census USA Trade Online).",
    ],
  },
  {
    slug: "textbook-atlas",
    number: "III",
    name: "Textbook Atlas",
    tagline: "Every AP Econ concept — with the live FRED chart that makes it real.",
    blurb:
      "A living textbook. Click 'Phillips Curve' and see the current US Phillips curve scatter, updated monthly. 'Quantity Theory' renders M2 vs. nominal GDP in real time. Every concept, every chart, every citation.",
    status: "live",
    category: "Education",
    icon: "atlas",
    citations: [
      { label: "Federal Reserve Economic Data (FRED) — St. Louis Fed", url: "https://fred.stlouisfed.org/" },
      { label: "U.S. Bureau of Labor Statistics", url: "https://www.bls.gov/" },
      { label: "U.S. Bureau of Economic Analysis", url: "https://www.bea.gov/" },
      { label: "Penn World Tables 10.01 (Solow inputs)", url: "https://www.rug.nl/ggdc/productivity/pwt/" },
    ],
    methodology: [
      "AS-AD axes anchored to GDPC1 (real GDP) and GDPDEF (implicit deflator). LRAS = GDPPOT.",
      "Phillips curve plots UNRATE × 12-month % change in CPIAUCSL.",
      "Money market: M2SL × FEDFUNDS, with WALCL overlay for QE/QT cycles.",
      "Loanable funds: GS10–GS2 spread plus MORTGAGE30US and BAA10Y for risk premia.",
      "Solow growth: capital stock (RKNANPUSA666NRUG) and output (RGDPNAUSA666NRUG) from PWT 10.01.",
      "Beveridge curve: JTSJOL × UNRATE; yield curve: DGS1MO through DGS30 daily snapshots.",
    ],
  },
  {
    slug: "shock-sim",
    number: "IV",
    name: "Shock Simulator",
    tagline: "Paste a news headline. See the S/D graph shift correctly. Every time.",
    blurb:
      "Paste any economics headline ('OPEC cuts production by 2M bpd'). Shock Simulator classifies it (supply, demand, expectations, policy) and renders the correct supply-and-demand graph shift with elasticities, citing the underlying market data.",
    status: "beta",
    category: "Macro",
    icon: "zap",
    citations: [
      { label: "Ramey, V. (2016) — 'Macroeconomic Shocks and Their Propagation', Handbook of Macroeconomics", url: "https://econweb.ucsd.edu/~vramey/research/Ramey_Macro_Shocks_Handbook.pdf" },
      { label: "Auerbach & Gorodnichenko (2012) — 'Measuring the Output Responses to Fiscal Policy'", url: "https://www.aeaweb.org/articles?id=10.1257/pol.4.2.1" },
      { label: "Romer & Romer narrative monetary shocks; Gertler-Karadi HFI", url: "https://www.aeaweb.org/articles?id=10.1257/0002828042002651" },
    ],
    methodology: [
      "Monetary IRFs to a 25-bp federal-funds shock drawn from Ramey (2016) using narrative (Romer-Romer Greenbook) and high-frequency identification.",
      "Fiscal multipliers state-dependent per Auerbach & Gorodnichenko (2012): recession multiplier ≈ 3.5 (CI 0.6–6.3); near-zero in expansion.",
      "Real-GDP, consumption, investment, and employment paths follow the published 3-year IRF responses (recession +0.33% / expansion -0.05% / linear +0.19%).",
      "Headline classifier maps news copy to a hand-built taxonomy of shock types before triggering the appropriate IRF panel.",
    ],
  },
  {
    slug: "shadow-fed",
    number: "V",
    name: "Shadow Fed",
    tagline: "What the Fed should do — published every week, with a public track record.",
    blurb:
      "A public, weekly Taylor-rule-derived rate recommendation. When the FOMC meets, Shadow Fed logs the gap between its prediction and the real decision. Watch a live track record of monetary-policy accuracy stretch back month after month.",
    status: "beta",
    category: "Macro",
    icon: "landmark",
    citations: [
      { label: "Taylor (1993) — 'Discretion versus Policy Rules in Practice'", url: "https://web.stanford.edu/~johntayl/Onlinepaperscombinedbyyear/1993/Discretion_versus_Policy_Rules_in_Practice.pdf" },
      { label: "FOMC Summary of Economic Projections (quarterly since Jan 2012)", url: "https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm" },
      { label: "Nakamura, Riblier & Steinsson (2025) — Jackson Hole symposium paper on FAIT deviations", url: "https://www.kansascityfed.org/research/jackson-hole-economic-symposium/" },
      { label: "Federal Reserve Board H.15 — Selected Interest Rates", url: "https://www.federalreserve.gov/releases/h15/" },
    ],
    methodology: [
      "Default rule: standard Taylor (1993) — r = r* + π + 0.5(π − π*) + 0.5(y − y*).",
      "FAIT-modified variant integrates an asymmetric reaction parameter and inertial smoothing, matching the Powell-era reaction function.",
      "SEP scoring uses median, central tendency, and full distribution (e.g., March 2026 dot plot: 7 dots at 3.625%, 7 at 3.375%, long-run 2.625–3.875%).",
      "Counterfactual path comparison vs. FRB/US-style standard rule (which would have lifted off summer 2021 and reached ≈8% by late 2022).",
      "Inputs (CPI, Core PCE, U-rate, NAIRU) auto-update from FRED on Mondays at 09:00 ET.",
    ],
  },
  {
    slug: "paper-decoder",
    number: "VI",
    name: "Econ Paper Decoder",
    tagline: "Turn any NBER, JEP, or AER paper into a citation block in 60 seconds.",
    blurb:
      "Upload a working paper. Decoder returns: plain-English abstract, the identification strategy (RCT, diff-in-diff, IV, RDD) explained with a methodology diagram, headline findings, and a 30-second citation block.",
    status: "beta",
    category: "Tools",
    icon: "file-search",
    citations: [
      { label: "NBER Working Papers", url: "https://www.nber.org/papers" },
      { label: "Imbens & Lemieux (2007) — 'Regression Discontinuity Designs'", url: "https://www.nber.org/papers/w13039" },
      { label: "Angrist & Pischke — Mostly Harmless Econometrics" },
    ],
    methodology: [
      "PDF parsed and chunked; an LLM extracts abstract, methodology section, identification strategy, and headline tables.",
      "Methodology classifier maps to: RCT, DiD, IV, RDD, synthetic control, structural model, descriptive.",
      "RDD diagnostics scan for McCrary density tests; absence triggers a replication red-flag.",
      "DiD diagnostics check for parallel-trends event-study plots; IV diagnostics demand first-stage F > 10.",
      "Citation block includes title, authors, journal, year, finding magnitude, and a one-sentence framing.",
    ],
  },
  {
    slug: "news-translator",
    number: "VII",
    name: "Econ News Translator",
    tagline: "Paste any economic headline. See the model, the graph, the prediction.",
    blurb:
      "The reverse of Shock Simulator. Paste any economic news — a Fed announcement, an OPEC cut, a tariff, a CPI print — and Translator identifies which textbook model applies, draws the predicted graph shift, names the FRED series to watch, and tells you what theory says happens next.",
    status: "live",
    category: "Tools",
    icon: "newspaper",
    flagship: true,
    citations: [
      { label: "Mankiw — Principles of Economics, 9e (model inventory)" },
      { label: "Federal Reserve Economic Data (FRED)", url: "https://fred.stlouisfed.org/" },
      { label: "Blanchard, O. — Macroeconomics, 8e (transmission mechanisms)" },
      { label: "AP Macroeconomics & Microeconomics CEDs (College Board)", url: "https://apcentral.collegeboard.org/" },
    ],
    methodology: [
      "Headline classifier maps copy to one of the canonical textbook models: AS-AD, IS-LM, Phillips Curve, Loanable Funds, Money Market, Solow Growth, S/D (sector), Trade.",
      "Each classification triggers a deterministic graph treatment (which curve shifts, which direction) using AP-CED conventions.",
      "Predictions name the FRED series most likely to move first and the magnitude regime (small / moderate / large) drawn from comparable historical episodes.",
      "Output is structured: Model · Shift · FRED watch list · Textbook prediction · Confidence band.",
      "Built to invert Shock Simulator: Shock Sim takes a curated shock and shows the response; Translator takes raw news and identifies the shock.",
    ],
  },
  {
    slug: "us-econ",
    number: "VIII",
    name: "US Econ Dashboard",
    tagline: "All 50 states. Click one. See the counties.",
    blurb:
      "Pick any state to see its labor, cost-of-living, and education metrics — then drill into county-level data. Sourced from BLS LAUS, state QCEW filings, MIT Living Wage Calculator, and the National Center for Education Statistics.",
    status: "beta",
    category: "Local",
    icon: "map",
    citations: [
      { label: "BLS Local Area Unemployment Statistics (LAUS)", url: "https://www.bls.gov/lau/" },
      { label: "BLS Quarterly Census of Employment and Wages (QCEW)", url: "https://www.bls.gov/cew/" },
      { label: "MIT Living Wage Calculator", url: "https://livingwage.mit.edu/" },
      { label: "National Center for Education Statistics (NCES) — state graduation rates", url: "https://nces.ed.gov/" },
      { label: "Zillow Home Value Index (ZHVI)", url: "https://www.zillow.com/research/data/" },
    ],
    methodology: [
      "State-level: BLS LAUS unemployment, QCEW total nonfarm payrolls, MIT Living Wage state median, NCES 4-year cohort graduation rate.",
      "County drilldown: BLS LAUS county series + ZHVI median home value where available; counties limited to top-population subset for performance.",
      "Colorado specialist data preserved: CDLE QCEW Q2 2024 cleanup adjustment (+19.4%); county graduation rates from CDE district-aggregated cohorts.",
      "All state and county records ship with last-observation timestamps and source URLs. National baseline: mean hourly wage $32.66 (US QCEW).",
    ],
  },
  {
    slug: "econlever",
    number: "IX",
    name: "EconLever",
    tagline: "Four levers. Ten years of growth, deficit, and inequality.",
    blurb:
      "The original sister project, now embedded. Move four policy sliders — top marginal tax, corporate tax, social welfare spending, federal funds rate — and watch a 10-year projection of US real GDP growth, the federal deficit, and the Gini coefficient redraw. Calibrated to peer-reviewed macro literature.",
    status: "live",
    category: "Policy",
    icon: "sliders",
    flagship: true,
    citations: [
      { label: "EconLever original — econlever.org", url: "https://econlever.org" },
      { label: "Romer & Romer (2010) — 'The Macroeconomic Effects of Tax Changes'", url: "https://www.aeaweb.org/articles?id=10.1257/aer.100.3.763" },
      { label: "Auerbach & Gorodnichenko (2012) — state-dependent multipliers", url: "https://www.aeaweb.org/articles?id=10.1257/pol.4.2.1" },
      { label: "Piketty, Saez & Zucman (2018) — 'Distributional National Accounts'", url: "https://www.nber.org/papers/w22945" },
      { label: "CBO — The Budget and Economic Outlook (annual baseline)", url: "https://www.cbo.gov/about/products/budget-economic-data" },
    ],
    methodology: [
      "Baseline: 2025 US — GDP growth 2.1%, federal deficit $1.83T, Gini 0.415, top marginal tax 37%, corporate tax 21%, welfare 11.4% GDP, fed funds 3.25%.",
      "Tax-elasticity coefficients calibrated to Romer & Romer (2010) tax-change multipliers and to CBO's economic projections.",
      "Spending multiplier state-dependent per Auerbach & Gorodnichenko (2012); higher in slack regimes, near-zero in expansion.",
      "Inequality channel uses Piketty-Saez-Zucman top-1%/bottom-50% income elasticities to map tax/transfer changes onto Gini movement.",
      "Improvement over the original econlever.org: USITC EE-2024 elasticities for trade pass-through, current 3.25% policy rate baseline, FAIT-modified Taylor reaction.",
      "Illustrative simulation; coefficients calibrated to mainstream macroeconomic literature; not a substitute for DSGE/VAR analysis.",
    ],
  },
];

export const TOOL_BY_SLUG = Object.fromEntries(TOOLS.map(t => [t.slug, t]));
