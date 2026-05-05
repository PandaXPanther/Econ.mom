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
  // Explainer fields (used by ToolExplainer + tool cards)
  whatThisTeaches: string;   // 2-4 sentence plain-English explanation of what concept the tool teaches
  apUnit: string;            // AP CED unit mapping, e.g., "AP Macro Unit 4 (Financial Sector) and Unit 5 (Long-Run Consequences)"
  whoItsFor: string;         // one-line audience descriptor
  tryThis: string;           // a concrete example prompt or scenario the user can try
  howItWorks: string[];      // 3-5 plain-English bullets describing what happens when you click the button (less technical than methodology)
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
      "Graph parts include a built-in drawing canvas. Gemini's vision model reads the actual sketch and checks it for axis labels, curve names, shift direction, and equilibrium markers.",
      "The 5/5 rewrite is generated to satisfy every rubric point with the exact terminology graders are trained to reward.",
      "Graders calibrated against College Board sample responses graded 0/5, 3/5, and 5/5 to ensure consistent point allocation.",
    ],
    whatThisTeaches:
      "How College Board actually scores AP Macro and Micro free-response questions. Graders give points for hitting specific rubric language (correctly labeled axes, identified shifters, named direction of change), not for sounding smart. This tool shows you exactly which words earn which points so you can train your hand to write 5/5 responses on test day.",
    apUnit: "All AP Macro units (1 to 6) and all AP Micro units (1 to 6); rubric coverage spans every released exam 2018 to 2025.",
    whoItsFor: "AP Macro and AP Micro students prepping for the May exam.",
    tryThis: "Paste a 2024 released FRQ response (or your own attempt at one) and watch the grader call out missing rubric points line by line.",
    howItWorks: [
      "You paste your FRQ response into the box (or generate a brand-new custom FRQ on any AP topic with the 'Generate a custom FRQ' panel: pick the topic, exam (Macro / Micro), length, and difficulty, and Gemini writes you an exam-style question complete with rubric).",
      "The grader compares your answer to the official College Board rubric for that exact question (or the AI-built rubric for generated FRQs), checking for axis labels, named curves, direction of shift, and equilibrium markers.",
      "You get a point-by-point breakdown showing which rubric points you earned and which you missed.",
      "A 5/5 model rewrite is generated using the precise terminology AP graders are trained to reward.",
      "Any part that asks you to 'draw a correctly labeled graph' renders an inline drawing canvas, sketch the diagram (pen, eraser, color, label tool) and Gemini grades the actual image, not your description of it.",
    ],
  },
  {
    slug: "tarifflab",
    number: "II",
    name: "TariffLab",
    tagline: "Deadweight loss, CS/PS, revenue, and employment effects of any tariff, done right.",
    blurb:
      "Pick a sector or HS code, set a tariff rate, and TariffLab computes the deadweight-loss triangle, consumer/producer surplus shifts, government revenue, and employment effects using USITC and Peterson Institute elasticities.",
    status: "live",
    category: "Trade",
    icon: "ship",
    flagship: true,
    citations: [
      { label: "USITC Economic Working Paper EE-2024 (Ahmad & Schreiber, sector elasticities)", url: "https://www.usitc.gov/publications/332/working_papers" },
      { label: "Fajgelbaum, Goldberg, Kennedy, Khandelwal (2020), 'Return to Protectionism'", url: "https://academic.oup.com/qje/article/135/1/1/5626442" },
      { label: "Broda & Weinstein (2006), 'Globalization and the Gains from Variety'", url: "https://academic.oup.com/qje/article/121/2/541/1884045" },
      { label: "Executive Order 14257 (April 2, 2025), Reciprocal Tariff", url: "https://www.federalregister.gov/" },
      { label: "U.S. Census Bureau, international trade data by HS code", url: "https://www.census.gov/foreign-trade/" },
    ],
    methodology: [
      "Median Armington elasticity of substitution σ = 5.65 (NAICS 3-digit) from USITC EE-2024 (Ahmad & Schreiber). Older σ ≈ 3.10 (Broda-Weinstein) shown as alternate.",
      "Pass-through coefficients calibrated to Fajgelbaum et al. (2020): ~100% incidence on US importers/consumers for US tariffs; ~68% incomplete pass-through for retaliatory tariffs.",
      "Deadweight loss approximated as ½ × Δquantity × tariff (linear S/D approximation around the equilibrium).",
      "2025 baseline integrates EO 14257's universal 10% ad valorem and Annex II exemptions (copper, pharma, semis, lumber, critical minerals, energy).",
      "Retaliation matrix tracks Canadian, Chinese (MOFCOM), and EU (Reg. 2025/1564) responses as of last refresh.",
      "Aggregate baseline anchored to US 2024 imports of $3,295.6B (BEA / Census USA Trade Online).",
    ],
    whatThisTeaches:
      "Tariffs are a tax on imports, and like any tax they create deadweight loss. This tool teaches you to draw the tariff diagram correctly: shrunken consumer surplus, expanded producer surplus, government revenue rectangle, and the two deadweight loss triangles. It also shows you the empirical reality, that current US tariffs pass through almost entirely to American consumers, not foreign exporters.",
    apUnit: "AP Macro Unit 6 (Open Economy, International Trade and Finance); AP Micro Unit 6 (Market Failure and the Role of Government).",
    whoItsFor: "Students learning tariff diagrams and anyone trying to make sense of the 2025 trade-war headlines.",
    tryThis: "Set steel at a 25% tariff and watch the deadweight-loss triangle, the consumer surplus loss, and the employment number all redraw together.",
    howItWorks: [
      "You pick a sector (or HS code) and dial in a tariff rate.",
      "The model uses USITC sector elasticities and Fajgelbaum et al. pass-through rates to compute the new equilibrium price and quantity.",
      "It draws the tariff diagram with consumer surplus, producer surplus, government revenue, and deadweight loss labeled in dollars.",
      "The 2025 baseline already includes Executive Order 14257's universal 10% tariff and Annex II exemptions, so your scenarios stack on top of current policy.",
    ],
  },
  {
    slug: "textbook-atlas",
    number: "III",
    name: "Textbook Atlas",
    tagline: "Every AP Econ concept, with the live FRED chart that makes it real.",
    blurb:
      "A living textbook. Click 'Phillips Curve' and see the current US Phillips curve scatter, updated monthly. 'Quantity Theory' renders M2 vs. nominal GDP in real time. Every concept, every chart, every citation.",
    status: "live",
    category: "Education",
    icon: "atlas",
    citations: [
      { label: "Federal Reserve Economic Data (FRED), St. Louis Fed", url: "https://fred.stlouisfed.org/" },
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
    whatThisTeaches:
      "Every AP Econ graph (AS-AD, Phillips Curve, Money Market, Loanable Funds, Solow) is supposed to describe the real economy. The Atlas wires every textbook diagram to a live FRED chart so you can see whether the textbook story actually fits today's data. When the textbook diverges from reality, that gap is the lesson.",
    apUnit: "AP Macro Units 2 to 5 (Economic Indicators, National Income & Price Determination, Financial Sector, Long-Run Consequences).",
    whoItsFor: "Students who want to stop memorizing graphs and start reading them.",
    tryThis: "Open the Phillips Curve panel and see whether the unemployment-inflation trade-off the textbook draws still holds in the 2024 to 2026 data.",
    howItWorks: [
      "You click a textbook concept (Phillips Curve, AS-AD, Money Market, Loanable Funds, etc.).",
      "The Atlas pulls the relevant FRED series live (CPI, unemployment, M2, fed funds, 10-year Treasury, etc.).",
      "It plots the textbook diagram on top of the actual US data and labels every axis with the FRED series ID.",
      "Each chart updates monthly, so the version you see today is the version reflecting the most recent BLS / BEA / Fed release.",
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
      { label: "Ramey, V. (2016), 'Macroeconomic Shocks and Their Propagation', Handbook of Macroeconomics", url: "https://econweb.ucsd.edu/~vramey/research/Ramey_Macro_Shocks_Handbook.pdf" },
      { label: "Auerbach & Gorodnichenko (2012), 'Measuring the Output Responses to Fiscal Policy'", url: "https://www.aeaweb.org/articles?id=10.1257/pol.4.2.1" },
      { label: "Romer & Romer narrative monetary shocks; Gertler-Karadi HFI", url: "https://www.aeaweb.org/articles?id=10.1257/0002828042002651" },
    ],
    methodology: [
      "Monetary IRFs to a 25-bp federal-funds shock drawn from Ramey (2016) using narrative (Romer-Romer Greenbook) and high-frequency identification.",
      "Fiscal multipliers state-dependent per Auerbach & Gorodnichenko (2012): recession multiplier ≈ 3.5 (CI 0.6–6.3); near-zero in expansion.",
      "Real-GDP, consumption, investment, and employment paths follow the published 3-year IRF responses (recession +0.33% / expansion -0.05% / linear +0.19%).",
      "Headline classifier maps news copy to a hand-built taxonomy of shock types before triggering the appropriate IRF panel.",
    ],
    whatThisTeaches:
      "How an economic shock propagates through AS-AD. Supply shocks shift SRAS; demand shocks shift AD; expectations shocks move SRAS through wage- and price-setting. This tool drills the muscle memory of which curve shifts which direction so you can answer FRQ shock questions without second-guessing.",
    apUnit: "AP Macro Unit 3 (National Income and Price Determination); AP Macro Unit 4 (Financial Sector) for monetary shocks.",
    whoItsFor: "Students learning AS-AD and anyone reading the news and wondering 'wait, which curve shifts here?'",
    tryThis: "Paste a real headline like 'OPEC cuts production by 2 million barrels per day' and watch the SRAS shift left with the new equilibrium labeled.",
    howItWorks: [
      "You paste an economic headline.",
      "A classifier reads the headline and maps it to one of four shock types: supply, demand, expectations, or policy.",
      "The right diagram (AS-AD, Money Market, or Loanable Funds) renders with the correct curve shifting in the correct direction.",
      "Empirical magnitudes are pulled from Ramey (2016) for monetary shocks and Auerbach-Gorodnichenko (2012) for fiscal shocks, so 'small / medium / large' has actual numbers behind it.",
    ],
  },
  {
    slug: "shadow-fed",
    number: "V",
    name: "Shadow Fed",
    tagline: "What the Fed should do, published every week, with a public track record.",
    blurb:
      "A public, weekly Taylor-rule-derived rate recommendation. When the FOMC meets, Shadow Fed logs the gap between its prediction and the real decision. Watch a live track record of monetary-policy accuracy stretch back month after month.",
    status: "beta",
    category: "Macro",
    icon: "landmark",
    citations: [
      { label: "Taylor (1993), 'Discretion versus Policy Rules in Practice'", url: "https://web.stanford.edu/~johntayl/Onlinepaperscombinedbyyear/1993/Discretion_versus_Policy_Rules_in_Practice.pdf" },
      { label: "FOMC Summary of Economic Projections (quarterly since Jan 2012)", url: "https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm" },
      { label: "Nakamura, Riblier & Steinsson (2025), Jackson Hole symposium paper on FAIT deviations", url: "https://www.kansascityfed.org/research/jackson-hole-economic-symposium/" },
      { label: "Federal Reserve Board H.15, Selected Interest Rates", url: "https://www.federalreserve.gov/releases/h15/" },
    ],
    methodology: [
      "Default rule: standard Taylor (1993), r = r* + π + 0.5(π − π*) + 0.5(y − y*).",
      "FAIT-modified variant integrates an asymmetric reaction parameter and inertial smoothing, matching the Powell-era reaction function.",
      "SEP scoring uses median, central tendency, and full distribution (e.g., March 2026 dot plot: 7 dots at 3.625%, 7 at 3.375%, long-run 2.625–3.875%).",
      "Counterfactual path comparison vs. FRB/US-style standard rule (which would have lifted off summer 2021 and reached ≈8% by late 2022).",
      "Inputs (CPI, Core PCE, U-rate, NAIRU) auto-update from FRED on Mondays at 09:00 ET.",
    ],
    whatThisTeaches:
      "The Federal Reserve doesn't pick interest rates randomly. The Taylor Rule says r = neutral + inflation + 0.5(inflation gap) + 0.5(output gap), and most actual Fed decisions land within a percentage point of what the rule prescribes. Shadow Fed lets you watch the rule run live, compare it to the FOMC's own dot plot, and build intuition for why the Fed cuts or hikes.",
    apUnit: "AP Macro Unit 4 (Financial Sector); AP Macro Unit 5 (Long-Run Consequences of Stabilization Policies).",
    whoItsFor: "Students learning monetary policy and anyone who wants a reasoned answer to 'should the Fed cut at the next meeting?'",
    tryThis: "Open the latest CPI and unemployment release, plug them in, and see whether the Taylor Rule says the Fed should cut, hold, or hike. Then check the actual FOMC decision when it comes out.",
    howItWorks: [
      "The tool pulls fresh inputs from FRED every Monday at 9 AM ET (CPI, Core PCE, unemployment, NAIRU estimate).",
      "It runs both the original Taylor (1993) rule and a FAIT-modified variant that matches the Powell-era reaction function.",
      "It compares the rule's prescription against the FOMC's own median dot from the Summary of Economic Projections.",
      "After every FOMC meeting it logs the gap between prediction and decision, so the track record builds publicly week after week.",
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
      { label: "Imbens & Lemieux (2007), 'Regression Discontinuity Designs'", url: "https://www.nber.org/papers/w13039" },
      { label: "Angrist & Pischke, Mostly Harmless Econometrics" },
    ],
    methodology: [
      "PDF parsed and chunked; an LLM extracts abstract, methodology section, identification strategy, and headline tables.",
      "Methodology classifier maps to: RCT, DiD, IV, RDD, synthetic control, structural model, descriptive.",
      "RDD diagnostics scan for McCrary density tests; absence triggers a replication red-flag.",
      "DiD diagnostics check for parallel-trends event-study plots; IV diagnostics demand first-stage F > 10.",
      "Citation block includes title, authors, journal, year, finding magnitude, and a one-sentence framing.",
    ],
    whatThisTeaches:
      "Empirical economics papers all follow a hidden grammar: a research question, an identification strategy (RCT, diff-in-diff, IV, RDD), a headline finding, and a set of robustness checks. Once you can name those four parts on sight, you can read any NBER paper in ten minutes. This tool teaches that grammar by pulling it out of real papers for you.",
    apUnit: "Beyond AP, useful for AP Research, college applications, and any econ-curious student starting to read primary literature.",
    whoItsFor: "Students writing research papers, debate cases, or college essays that cite real economics literature.",
    tryThis: "Upload a recent NBER working paper (or paste a link) and read the structured breakdown before you commit to reading the full paper.",
    howItWorks: [
      "You upload a PDF or paste a paper URL.",
      "The tool parses the PDF, finds the abstract, methodology section, and headline tables.",
      "It classifies the identification strategy (RCT, diff-in-diff, IV, RDD, synthetic control, structural, descriptive) and runs the canonical diagnostics for that method.",
      "It returns a plain-English abstract, the strategy diagram, the headline finding, and a citation block ready to drop into a paper.",
    ],
  },
  {
    slug: "news-translator",
    number: "VII",
    name: "Econ News Translator",
    tagline: "Paste any economic headline. See the model, the graph, the prediction.",
    blurb:
      "The reverse of Shock Simulator. Paste any economic news, a Fed announcement, an OPEC cut, a tariff, a CPI print, and Translator identifies which textbook model applies, draws the predicted graph shift, names the FRED series to watch, and tells you what theory says happens next.",
    status: "live",
    category: "Tools",
    icon: "newspaper",
    flagship: true,
    citations: [
      { label: "Mankiw, Principles of Economics, 9e (model inventory)" },
      { label: "Federal Reserve Economic Data (FRED)", url: "https://fred.stlouisfed.org/" },
      { label: "Blanchard, O., Macroeconomics, 8e (transmission mechanisms)" },
      { label: "AP Macroeconomics & Microeconomics CEDs (College Board)", url: "https://apcentral.collegeboard.org/" },
    ],
    methodology: [
      "Headline classifier maps copy to one of the canonical textbook models: AS-AD, IS-LM, Phillips Curve, Loanable Funds, Money Market, Solow Growth, S/D (sector), Trade.",
      "Each classification triggers a deterministic graph treatment (which curve shifts, which direction) using AP-CED conventions.",
      "Predictions name the FRED series most likely to move first and the magnitude regime (small / moderate / large) drawn from comparable historical episodes.",
      "Output is structured: Model · Shift · FRED watch list · Textbook prediction · Confidence band.",
      "Built to invert Shock Simulator: Shock Sim takes a curated shock and shows the response; Translator takes raw news and identifies the shock.",
    ],
    whatThisTeaches:
      "Every economic news story is secretly a textbook chapter. A CPI print is the Phillips Curve. A Fed decision is the Money Market. A tariff is supply and demand for a single market. A trade-deficit headline is open-economy AS-AD. This tool teaches you to read the news the way an economist reads it, by mapping each headline to the model that explains it.",
    apUnit: "All of AP Macro and AP Micro; built specifically against the AP-CED model inventory.",
    whoItsFor: "Students prepping for AP exams and anyone trying to use real news as study material.",
    tryThis: "Paste this morning's Wall Street Journal headline (CPI release, FOMC announcement, tariff news, anything) and see which AP graph it maps to.",
    howItWorks: [
      "You paste any economic headline.",
      "A classifier maps the headline to one of the canonical AP models: AS-AD, IS-LM, Phillips Curve, Loanable Funds, Money Market, Solow, single-market S/D, or open-economy.",
      "The right graph renders with the correct curve shifting in AP-CED-conventional direction.",
      "You get a list of FRED series likely to move first, a textbook-grounded prediction, and a confidence band so you know when the model is on solid ground vs. speculative.",
    ],
  },
  {
    slug: "us-econ",
    number: "VIII",
    name: "US Econ Dashboard",
    tagline: "All 50 states. Click one. See the counties.",
    blurb:
      "Pick any state to see its labor, cost-of-living, and education metrics, then drill into county-level data. Sourced from BLS LAUS, state QCEW filings, MIT Living Wage Calculator, and the National Center for Education Statistics.",
    status: "beta",
    category: "Local",
    icon: "map",
    citations: [
      { label: "BLS Local Area Unemployment Statistics (LAUS)", url: "https://www.bls.gov/lau/" },
      { label: "BLS Quarterly Census of Employment and Wages (QCEW)", url: "https://www.bls.gov/cew/" },
      { label: "MIT Living Wage Calculator", url: "https://livingwage.mit.edu/" },
      { label: "National Center for Education Statistics (NCES), state graduation rates", url: "https://nces.ed.gov/" },
      { label: "Zillow Home Value Index (ZHVI)", url: "https://www.zillow.com/research/data/" },
    ],
    methodology: [
      "State-level: BLS LAUS unemployment, QCEW total nonfarm payrolls, MIT Living Wage state median, NCES 4-year cohort graduation rate.",
      "County drilldown: BLS LAUS county series + ZHVI median home value where available; counties limited to top-population subset for performance.",
      "Colorado specialist data preserved: CDLE QCEW Q2 2024 cleanup adjustment (+19.4%); county graduation rates from CDE district-aggregated cohorts.",
      "All state and county records ship with last-observation timestamps and source URLs. National baseline: mean hourly wage $32.66 (US QCEW).",
    ],
    whatThisTeaches:
      "National economic statistics hide enormous regional variation. The US unemployment rate is one number, but Larimer County's is a different number from Mesa County's, and the cost of living to wages ratio in Boulder is nothing like the same ratio in Pueblo. This tool teaches you to think about labor markets, cost of living, and education at the resolution they actually matter, by state and by county.",
    apUnit: "AP Macro Unit 2 (Economic Indicators and the Business Cycle); useful for any student writing about local labor markets.",
    whoItsFor: "Students writing economics-flavored college essays, debate cases on local policy, or capstone projects on their home community.",
    tryThis: "Pick your home state, drill into your county, and compare its unemployment rate and living wage against the state median.",
    howItWorks: [
      "You pick any of the 50 states from the map.",
      "It loads the BLS LAUS unemployment, QCEW total payrolls, MIT Living Wage, and NCES graduation rate for that state.",
      "You drill down into a specific county and the same metrics render at county resolution where data is available.",
      "Every record ships with a last-observation timestamp and a link back to the source dataset.",
    ],
  },
  {
    slug: "econlever",
    number: "IX",
    name: "EconLever",
    tagline: "Four levers. Ten years of growth, deficit, and inequality.",
    blurb:
      "The original sister project, now embedded. Move four policy sliders, top marginal tax, corporate tax, social welfare spending, federal funds rate, and watch a 10-year projection of US real GDP growth, the federal deficit, and the Gini coefficient redraw. Calibrated to peer-reviewed macro literature.",
    status: "live",
    category: "Policy",
    icon: "sliders",
    flagship: true,
    citations: [
      { label: "EconLever original, econlever.org", url: "https://econlever.org" },
      { label: "Romer & Romer (2010), 'The Macroeconomic Effects of Tax Changes'", url: "https://www.aeaweb.org/articles?id=10.1257/aer.100.3.763" },
      { label: "Auerbach & Gorodnichenko (2012), state-dependent multipliers", url: "https://www.aeaweb.org/articles?id=10.1257/pol.4.2.1" },
      { label: "Piketty, Saez & Zucman (2018), 'Distributional National Accounts'", url: "https://www.nber.org/papers/w22945" },
      { label: "CBO, The Budget and Economic Outlook (annual baseline)", url: "https://www.cbo.gov/about/products/budget-economic-data" },
    ],
    methodology: [
      "Baseline: 2025 US, GDP growth 2.1%, federal deficit $1.83T, Gini 0.415, top marginal tax 37%, corporate tax 21%, welfare 11.4% GDP, fed funds 3.25%.",
      "Tax-elasticity coefficients calibrated to Romer & Romer (2010) tax-change multipliers and to CBO's economic projections.",
      "Spending multiplier state-dependent per Auerbach & Gorodnichenko (2012); higher in slack regimes, near-zero in expansion.",
      "Inequality channel uses Piketty-Saez-Zucman top-1%/bottom-50% income elasticities to map tax/transfer changes onto Gini movement.",
      "Improvement over the original econlever.org: USITC EE-2024 elasticities for trade pass-through, current 3.25% policy rate baseline, FAIT-modified Taylor reaction.",
      "Illustrative simulation; coefficients calibrated to mainstream macroeconomic literature; not a substitute for DSGE/VAR analysis.",
    ],
    whatThisTeaches:
      "Fiscal and monetary policy are not free; every lever has trade-offs across growth, deficits, and inequality. EconLever teaches you to feel those trade-offs by moving sliders and watching ten-year projections redraw. Cutting the top marginal rate boosts growth a little but widens Gini noticeably. Raising welfare spending shrinks Gini but widens the deficit unless growth offsets it. The tool turns abstract policy debate into a numerical instinct.",
    apUnit: "AP Macro Unit 3 (Fiscal Policy); AP Macro Unit 4 (Monetary Policy); AP Macro Unit 5 (Long-Run Consequences); AP Micro Unit 6 (Income Distribution).",
    whoItsFor: "Students learning fiscal-monetary policy and anyone who wants to argue tax policy with numbers instead of vibes.",
    tryThis: "Drop the top marginal tax rate from 37% to 28% and the corporate rate from 21% to 15%, then watch what happens to GDP growth, the deficit, and Gini over ten years.",
    howItWorks: [
      "Four sliders set the scenario: top marginal income tax, corporate tax, social welfare spending, and fed funds rate.",
      "The model uses Romer-Romer (2010) tax-change multipliers and Auerbach-Gorodnichenko (2012) state-dependent spending multipliers.",
      "Inequality moves through Piketty-Saez-Zucman top-1% / bottom-50% income elasticities.",
      "Three time-series redraw together: real GDP growth, the federal deficit, and the Gini coefficient over a ten-year horizon.",
    ],
  },
  {
    slug: "inflation-decomposer",
    number: "X",
    name: "Inflation Decomposer",
    tagline: "Split headline CPI into supply, demand, expectations, and policy components.",
    blurb:
      "Paste this quarter's CPI inputs and watch headline inflation break apart into Bernanke-Blanchard components: supply (energy + food), demand (V/U + output gap), expectations (TIPS + survey), and policy lag. Flags whether expectations are anchored. The tool every Fed Chair memo wishes it had.",
    status: "live",
    category: "Macro",
    icon: "trending-down",
    flagship: true,
    citations: [
      { label: "Bernanke & Blanchard (2023), 'What Caused the U.S. Pandemic-Era Inflation?', NBER w31417", url: "https://www.nber.org/papers/w31417" },
      { label: "Hazell, Herreño, Nakamura, Steinsson (2022), 'The Slope of the Phillips Curve'", url: "https://www.nber.org/papers/w28005" },
      { label: "Holston, Laubach, Williams (2024), natural rate r* updates", url: "https://www.newyorkfed.org/research/policy/rstar" },
      { label: "Cleveland Fed, Inflation trend-cycle decomposition", url: "https://www.clevelandfed.org/indicators-and-data/inflation-nowcasting" },
      { label: "Federal Reserve Economic Data (FRED), CPIAUCSL, T5YIE, FEDFUNDS, JTSJOL", url: "https://fred.stlouisfed.org/" },
    ],
    methodology: [
      "Headline π = trend (2%) + supply + demand + expectations + policy, per Bernanke-Blanchard (2023) two-stage approach.",
      "Supply: 0.07 × energy YoY × 0.60 passthrough + 0.13 × food YoY × 0.55, weights from CPI-U.",
      "Demand: piecewise tightness gap β = 0.32 below V/U=1.5, β = 0.55 above, plus 0.15 × output gap (Phillips slope).",
      "Expectations: 0.5 × 5Y breakeven + 0.5 × survey, deviation from 2% target × 0.85 (Hazell-Herreño-Nakamura-Steinsson).",
      "Policy: (r* − real rate) × 0.18 with HLW 2024 r* ≈ 0.5; 4-quarter lag.",
      "Anchored if composite expectations within ±0.4pp of 2% target. Five built-in presets including 1980 Q1, 2009 Q4, 2022 Q2.",
    ],
    whatThisTeaches:
      "Inflation is never one thing. The 8.9% peak in 2022 was mostly supply (energy and food) plus demand (tight labor market), not Fed laxity. The 14% spike in 1980 was mostly unanchored expectations. This tool teaches you that 'inflation' is a sum of components, each driven by a different mechanism, and policy works only when it targets the right component.",
    apUnit: "AP Macro Unit 2 (Economic Indicators); AP Macro Unit 4 (Financial Sector); AP Macro Unit 5 (Long-Run Consequences).",
    whoItsFor: "Students learning the Phillips Curve and anyone trying to follow the post-2021 inflation debate.",
    tryThis: "Load the 2022 Q2 preset and see how much of that 8.9% headline inflation came from energy and food versus from a hot labor market.",
    howItWorks: [
      "You enter (or load a preset for) one quarter's worth of inputs: energy YoY, food YoY, labor-market tightness, breakeven expectations, real interest rate.",
      "The Bernanke-Blanchard (2023) two-stage decomposition splits headline CPI into supply, demand, expectations, and policy components.",
      "It checks whether expectations are anchored (composite within plus or minus 0.4 percentage points of 2%).",
      "It returns a stacked-bar breakdown showing how much of the headline number each channel contributed.",
    ],
  },
  {
    slug: "natural-experiments",
    number: "XI",
    name: "Natural Experiment Finder",
    tagline: "Match your research question to the canonical identification strategy.",
    blurb:
      "A searchable library of 60+ canonical natural experiments, Card-Krueger NJ minimum wage, the Mariel boatlift, the Vietnam draft, Oregon Medicaid, the China Shock, Volcker, MTO. Filter by method (DiD, RDD, IV, RCT, synthetic control, bunching, shift-share, lottery), field, and AP-CED concept tag. Each entry: research question, treatment, finding, identification logic, diagnostic threats, and a downloadable strategy brief.",
    status: "live",
    category: "Tools",
    icon: "flask-conical",
    citations: [
      { label: "Angrist & Pischke, Mostly Harmless Econometrics" },
      { label: "Cunningham, Causal Inference: The Mixtape", url: "https://mixtape.scunning.com/" },
      { label: "Imbens & Rubin, Causal Inference for Statistics, Social, and Biomedical Sciences" },
      { label: "AEA RCT Registry", url: "https://www.socialscienceregistry.org/" },
      { label: "NBER Working Papers", url: "https://www.nber.org/papers" },
    ],
    methodology: [
      "60+ entries hand-curated from the canonical applied-econometrics syllabus (Harvard, MIT, Berkeley, Stanford PhD core).",
      "Each entry indexed by method, field, and AP-CED concept tag for college-app and AP cross-reference.",
      "Identification descriptions follow Angrist-Pischke and Imbens-Rubin terminology; diagnostic threats list common rebuttals (parallel-trends violations, McCrary density, weak first-stage F, SUTVA spillovers).",
      "Method primers match the assumption ladder used in any first-year PhD identification course.",
      "Designed to invert the typical research workflow: instead of starting with method, start with a research question and discover which experiments and methods apply.",
    ],
    whatThisTeaches:
      "Causal claims in economics rest on identification strategies: research designs that isolate one variable's effect from everything else moving in the world. The Mariel Boatlift (immigration), Card-Krueger (minimum wage), the Vietnam Draft (education), and Oregon Medicaid (health insurance) are the canonical examples. This tool teaches you the strategies by showing you the cases that made them famous.",
    apUnit: "Beyond AP, foundational for AP Research, AP Statistics extension work, and any college economics course.",
    whoItsFor: "Students writing research papers, debate cases, or applying to economics-track college programs.",
    tryThis: "Filter for 'difference in differences' and read the Card-Krueger NJ minimum wage entry, the strategy that defined a generation of empirical labor economics.",
    howItWorks: [
      "You filter sixty-plus canonical experiments by method (DiD, RDD, IV, RCT, synthetic control, bunching, shift-share, lottery), field, or AP-CED concept.",
      "Each entry lays out the research question, treatment, finding, and identification logic in plain English.",
      "Diagnostic threats are flagged (parallel-trends violations, McCrary density, weak first-stage F, SUTVA spillovers) so you understand the rebuttals.",
      "You can download a strategy brief for any entry to use as a primer or research starting point.",
    ],
  },
  {
    slug: "counterfactual-engine",
    number: "XII",
    name: "Counterfactual Engine",
    tagline: "Edit the past. Simulate the road not taken.",
    blurb:
      "Five canonical macro counterfactuals, Volcker 1979, Lehman 2008, ARP 2021, UK austerity 2010, Greenspan-era housing, with adjustable parameters and side-by-side actual-vs-counterfactual time-series. Calibrated to peer-reviewed magnitudes (Sargent 1982, Romer-Romer 1989, Mian-Sufi 2014, Bernanke-Blanchard 2023, Auerbach-Gorodnichenko 2012, Glaeser-Gottlieb-Gyourko 2010).",
    status: "live",
    category: "Macro",
    icon: "git-branch",
    flagship: true,
    citations: [
      { label: "Sargent (1982), 'Ends of Four Big Inflations'", url: "https://www.minneapolisfed.org/research/working-papers/the-ends-of-four-big-inflations" },
      { label: "Mian & Sufi (2014), House of Debt", url: "https://press.uchicago.edu/ucp/books/book/chicago/H/bo16728737.html" },
      { label: "Bernanke & Blanchard (2023), NBER w31417", url: "https://www.nber.org/papers/w31417" },
      { label: "Auerbach & Gorodnichenko (2012), state-dependent multipliers", url: "https://www.aeaweb.org/articles?id=10.1257/pol.4.2.1" },
      { label: "Taylor (2007), 'Housing and Monetary Policy'", url: "https://www.kansascityfed.org/research/jackson-hole-economic-symposium/" },
    ],
    methodology: [
      "Volcker 1979: accelerationist Phillips curve where convergence speed scales with peak fed funds and expectations decay.",
      "Lehman 2008: Mian-Sufi credit-spread elasticity Δu = 0.011 × (LIBOR-OIS − 50bp) − 0.18 × fiscal stimulus % GDP.",
      "ARP 2021: Bernanke-Blanchard fiscal pass-through 0.18 + supply-shock contribution 0.07 × 0.6 from energy.",
      "UK austerity 2010: Auerbach-Gorodnichenko slack-state multiplier (1.5–3.5) × cumulative fiscal impulse.",
      "Greenspan 2003-04: Glaeser-Gottlieb-Gyourko mortgage-rate channel (4% lower HPI growth per 100bp fed funds).",
      "Each scenario ships with its own actual time-series and editable parameters; defaults reproduce observed history exactly.",
    ],
    whatThisTeaches:
      "History looks inevitable in retrospect, but every macro crisis was a policy choice. What if Volcker hadn't hiked to 19% in 1979? What if Lehman had been bailed out? What if the American Rescue Plan had been half its size? This tool teaches you to think counterfactually, the same way professional macroeconomists do, by re-running history with different parameters and watching the path diverge.",
    apUnit: "AP Macro Unit 4 (Financial Sector); AP Macro Unit 5 (Long-Run Consequences); AP Macro Unit 3 (Fiscal Policy).",
    whoItsFor: "Students who already know the standard AP curriculum and want the next level: how policy choices shape the macro path.",
    tryThis: "Load Volcker 1979 and lower the peak fed funds rate from 19% to 12%. Watch the inflation path stay elevated through the 1980s instead of breaking.",
    howItWorks: [
      "You pick one of five canonical macro episodes (Volcker 1979, Lehman 2008, ARP 2021, UK austerity 2010, or Greenspan-era housing).",
      "You adjust the key policy parameter (peak fed funds, fiscal stimulus size, mortgage-rate path, etc.).",
      "The model runs an empirically calibrated equation drawn from the canonical paper for that episode (Sargent, Mian-Sufi, Bernanke-Blanchard, Auerbach-Gorodnichenko, or Glaeser-Gottlieb-Gyourko).",
      "It plots the actual historical time-series alongside your counterfactual so the divergence is visible quarter by quarter.",
    ],
  },
];

export const TOOL_BY_SLUG = Object.fromEntries(TOOLS.map(t => [t.slug, t]));
