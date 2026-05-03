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
  category: "Macro" | "Micro" | "Tools" | "Education" | "Trade" | "Local";
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
      { label: "USITC Trade Policy Information System (sector elasticities)", url: "https://www.usitc.gov/" },
      { label: "Peterson Institute for International Economics — tariff working papers", url: "https://www.piie.com/" },
      { label: "Kee, Nicita & Olarreaga (2008) 'Import Demand Elasticities and Trade Distortions'", url: "https://doi.org/10.1162/rest.90.4.666" },
      { label: "U.S. Census Bureau — international trade data by HS code", url: "https://www.census.gov/foreign-trade/" },
    ],
    methodology: [
      "Deadweight loss approximated as ½ × Δquantity × tariff (linear S/D approximation around the equilibrium).",
      "Consumer surplus loss = trapezoid under demand curve between Q_free-trade and Q_post-tariff.",
      "Producer surplus gain = domestic-only producer surplus rectangle, computed with US export-supply elasticity.",
      "Government revenue = tariff rate × imports under the new equilibrium.",
      "Employment effects use sector-specific output elasticities of labor demand from BLS Industry Productivity data.",
      "Elasticities sourced from Kee, Nicita & Olarreaga (2008) and updated with USITC TPIS estimates where available.",
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
      { label: "Mankiw, N. G. — Principles of Economics, 9e (concept inventory)" },
    ],
    methodology: [
      "Concept catalog mirrors the AP Macro and Micro Course & Exam Descriptions unit-by-unit.",
      "Each concept page renders a live chart pulled from FRED's public API on page load.",
      "Definitions are written from scratch, not pulled from any single textbook, and cross-referenced against Mankiw, Krugman, and the College Board CED.",
      "Charts are interactive: pan, zoom, hover-readout. Citations to the underlying data series are shown directly under each chart.",
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
      { label: "Mankiw — Principles of Economics, Ch. 4–6 (S/D framework)" },
      { label: "BLS, BEA, EIA, USDA — sector-specific market data" },
    ],
    methodology: [
      "An LLM classifies the headline against a hand-built taxonomy of shock types (supply shift, demand shift, expectations shift, policy shock, sectoral spillover).",
      "Each classification triggers the appropriate graph treatment — supply shock shifts S left, etc. — never both curves unless explicitly justified.",
      "Elasticities pulled from sector-specific BLS and EIA data so the magnitude of price/quantity change is realistic.",
      "Output cites the underlying data sources for any quantitative claim.",
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
      { label: "Taylor (1993) 'Discretion versus Policy Rules in Practice'", url: "https://web.stanford.edu/~johntayl/Onlinepaperscombinedbyyear/1993/Discretion_versus_Policy_Rules_in_Practice.pdf" },
      { label: "Federal Reserve Board — H.15 Selected Interest Rates", url: "https://www.federalreserve.gov/releases/h15/" },
      { label: "FRED — Effective Federal Funds Rate, CPI, Core PCE, Unemployment Rate" },
    ],
    methodology: [
      "Default rule: standard Taylor (1993) — r = r* + π + 0.5(π − π*) + 0.5(y − y*). Users can switch to the inertial rule or the balanced-approach rule.",
      "Inputs (CPI, Core PCE, U-rate, NAIRU) auto-update from FRED every Monday at 09:00 ET.",
      "Predictions logged to a public, immutable feed. After each FOMC decision, the gap is computed and added to the running track record.",
      "Track record is shown as a sparkline plus a table on the tool page.",
    ],
  },
  {
    slug: "paper-decoder",
    number: "VI",
    name: "Econ Paper Decoder",
    tagline: "Turn any NBER, JEP, or AER paper into an extemp citation in 60 seconds.",
    blurb:
      "Upload a working paper. Decoder returns: plain-English abstract, the identification strategy (RCT, diff-in-diff, IV, RDD) explained with a methodology diagram, headline findings, and a debate-ready 30-second citation block.",
    status: "beta",
    category: "Tools",
    icon: "file-search",
    citations: [
      { label: "NBER Working Papers", url: "https://www.nber.org/papers" },
      { label: "Journal of Economic Perspectives — AEA", url: "https://www.aeaweb.org/journals/jep" },
      { label: "Angrist & Pischke — Mostly Harmless Econometrics (methodology taxonomy)" },
    ],
    methodology: [
      "PDF parsed and chunked. An LLM extracts the abstract, methodology section, identification strategy, and headline tables.",
      "Methodology classified against a hand-built taxonomy: RCT, diff-in-diff, IV, regression discontinuity, synthetic control, structural model, descriptive.",
      "Each strategy renders a plain-English diagram of which variables play which role (treatment, control, instrument, etc.).",
      "Citation block includes paper title, authors, journal, year, finding magnitude, and a one-sentence framing for extemp use.",
    ],
  },
  {
    slug: "extemp-engine",
    number: "VII",
    name: "Extemp Engine",
    tagline: "Seven-minute economics extemp speeches with cited stats and Colorado examples.",
    blurb:
      "Built by an extemper for extempers. Give it a prompt and Extemp Engine returns a 7-minute speech with hooks, both sides steel-manned, three real cited statistics per side, Colorado and global examples, and a printable teleprompter view.",
    status: "live",
    category: "Tools",
    icon: "mic",
    citations: [
      { label: "NSDA Extemporaneous Speaking Rules", url: "https://www.speechanddebate.org/" },
      { label: "Bloomberg, FT, Economist, WSJ, NYT — cited within each generated speech" },
    ],
    methodology: [
      "Speech structure follows competitive extemp norms: AGD → link → restate → significance → question → preview → 2 contentions (each with claim, warrant, impact) → answer + tieback.",
      "Three cited statistics per side, sourced from current major-publication coverage of the topic.",
      "Colorado examples included by default (the engine knows the founder is Colorado-based and ties impact to local economic data).",
      "Output formatted for Virtual Teleprompter Pro and printable on a single page.",
    ],
  },
  {
    slug: "colorado-econ",
    number: "VIII",
    name: "Colorado Econ Dashboard",
    tagline: "Hyperlocal CO labor, cost-of-living, and education-outcomes data — all in one place.",
    blurb:
      "Colorado-only economic dashboard pulling CDLE, BLS, and Colorado Department of Education data. County-by-county unemployment, cost-of-living indices, education outcomes, and youth employment. Built for the Colorado financial-literacy mission.",
    status: "beta",
    category: "Local",
    icon: "mountain",
    citations: [
      { label: "Colorado Department of Labor and Employment", url: "https://cdle.colorado.gov/" },
      { label: "BLS Local Area Unemployment Statistics", url: "https://www.bls.gov/lau/" },
      { label: "Colorado Department of Education", url: "https://www.cde.state.co.us/" },
      { label: "MIT Living Wage Calculator", url: "https://livingwage.mit.edu/" },
    ],
    methodology: [
      "Labor data: BLS LAUS county-level, monthly. CDLE QCEW industry employment, quarterly.",
      "Cost-of-living: MIT Living Wage Calculator (county) + BLS regional CPI.",
      "Education: CO Dept of Ed annual reports — graduation, post-secondary enrollment, FAFSA completion.",
      "All series are auto-fetched on page load. Citations and last-updated timestamps shown next to every chart.",
    ],
  },
];

export const TOOL_BY_SLUG = Object.fromEntries(TOOLS.map(t => [t.slug, t]));
