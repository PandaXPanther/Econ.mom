// Post-build SEO prerenderer.
//
// What it does: for every route in the app, writes a static HTML file under
// dist/public/<route>/index.html that contains the full SPA shell PLUS a
// route-specific <title>, <meta description>, <link canonical>, OpenGraph,
// Twitter Card, and JSON-LD SoftwareApplication blob. Googlebot, Bingbot,
// PerplexityBot etc. fetch those files, see real per-page metadata, and
// index each tool as its own URL.
//
// Why: this is a hash-routed SPA. Without prerendering, every URL serves
// the same generic index.html, so search engines deduplicate and only
// index the home page. With prerendering, /tarifflab is its own indexable
// document with its own snippet.
//
// At runtime, the URL normalizer in App.tsx rewrites the path-style URL
// to the hash form so the React router renders the right tool. So the
// SEO doc and the actual app stay in sync without a server-side renderer.

import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(process.cwd(), "dist/public");
const TEMPLATE = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");

const SITE = "https://econ.mom";
const OG_IMAGE = `${SITE}/og.png`;

// Route catalog mirrors client/src/lib/tools.ts. Kept manually in sync.
// Each entry produces dist/public/<slug>/index.html.
const ROUTES = [
  {
    slug: "",
    title: "Saras Totey · The Mother Of Econ — twelve free, citation-rigorous economics tools",
    description:
      "Saras Totey (Boulder, Colorado · Fairview High School) built econ.mom: twelve free, citation-rigorous economics tools for AP students, debaters, and policy desks. AP FRQ Grader, TariffLab, Shadow Fed, Textbook Atlas, Shock Simulator, Paper Decoder, Econ News Translator, US Econ Dashboard, EconLever, Inflation Decomposer, Natural Experiment Finder, Counterfactual Engine.",
    keywords:
      "Saras Totey, econ.mom, Mother of Econ, Saras Totey Boulder, Saras Totey Fairview, AP Economics tools, AP Macroeconomics, AP Microeconomics, economics AI tools, EconLever, FRQ grader, tariff calculator, Shadow Fed, Inflation Decomposer, Counterfactual Engine, Boulder Colorado economics",
  },
  {
    slug: "tools",
    title: "Twelve economics tools · The Mother Of Econ by Saras Totey",
    description:
      "Browse all twelve tools on econ.mom: AP FRQ Grader, TariffLab, Textbook Atlas, Shock Simulator, Shadow Fed, Paper Decoder, News Translator, US Econ Dashboard, EconLever, Inflation Decomposer, Natural Experiment Finder, Counterfactual Engine. Built by Saras Totey.",
    keywords:
      "economics tools, AP Economics tools, economics AI tools, Saras Totey, econ.mom, free economics calculators",
  },
  {
    slug: "methodology",
    title: "Methodology & Citations — every formula, every primary source · econ.mom",
    description:
      "Full methodology and primary sources behind each of The Mother Of Econ's twelve tools. College Board rubrics, USITC elasticities, FRED series, Taylor rule variants, NBER papers, Romer-Romer narrative shocks, Bernanke-Blanchard inflation decomposition, and Colorado state data.",
    keywords:
      "economics methodology, AP Economics citations, Taylor rule, Phillips curve, Bernanke Blanchard, Romer Romer, FRED series, NBER",
  },
  {
    slug: "founder",
    title: "Saras Totey — Founder of econ.mom & EconLever · Boulder, Colorado",
    description:
      "Saras Totey is a high-school economics researcher in Boulder, Colorado, attending Fairview High School. Founder of econ.mom and EconLever. National Economics Challenge competitor and AP Economics student.",
    keywords:
      "Saras Totey, Saras Totey Boulder, Saras Totey Fairview, Saras Totey EconLever, Saras Totey econ.mom, Saras Totey National Economics Challenge",
  },

  // The twelve tools, each with its own SoftwareApplication JSON-LD.
  {
    slug: "frq-grader",
    title: "AP FRQ Grader — College Board rubric scoring for AP Macro & Micro · econ.mom",
    description:
      "Paste any AP Macro or Micro free-response answer. The AP FRQ Grader scores it against the official College Board rubric, point by point, with line-level feedback and a 5/5 model rewrite. Calibrated against every released rubric 2018 to 2025.",
    keywords:
      "AP FRQ grader, AP Macro FRQ grader, AP Micro FRQ grader, College Board rubric, AP Economics scoring, free response grader",
    app: {
      name: "AP FRQ Grader",
      category: "EducationalApplication",
      description:
        "Scores AP Macro and Micro free-response answers against the official College Board rubric, with line-level feedback and a 5/5 rewrite.",
    },
  },
  {
    slug: "tarifflab",
    title: "TariffLab — deadweight loss, CS/PS, revenue, employment for any tariff · econ.mom",
    description:
      "Compute the welfare effects of any tariff: deadweight loss, consumer surplus, producer surplus, government revenue, and employment effects. Uses USITC, Fajgelbaum-Goldberg-Kennedy-Khandelwal (2020), and Amiti-Redding-Weinstein elasticities. Built by Saras Totey.",
    keywords:
      "tariff calculator, deadweight loss calculator, TariffLab, tariff welfare effects, USITC elasticities, AP Economics tariff",
    app: {
      name: "TariffLab",
      category: "BusinessApplication",
      description:
        "Calculates deadweight loss, consumer surplus, producer surplus, revenue, and employment effects of any tariff using peer-reviewed elasticities.",
    },
  },
  {
    slug: "textbook-atlas",
    title: "Textbook Atlas — every AP Econ concept with a live FRED chart · econ.mom",
    description:
      "Every AP Macroeconomics and AP Microeconomics concept in one searchable atlas, paired with a live FRED chart that makes the abstract real. Definitions, formulas in LaTeX, and primary citations.",
    keywords:
      "AP Economics concepts, AP Macro concepts, AP Micro concepts, FRED charts, economics textbook, Textbook Atlas",
    app: {
      name: "Textbook Atlas",
      category: "EducationalApplication",
      description:
        "Searchable AP Economics concept atlas with definitions, LaTeX formulas, primary citations, and live FRED data charts.",
    },
  },
  {
    slug: "shock-sim",
    title: "Shock Simulator — paste a headline, see the S/D graph shift correctly · econ.mom",
    description:
      "Paste any economics news headline. Shock Simulator classifies it as a supply or demand shock, quantifies the price and quantity effects with realistic elasticities, and renders the correct S/D graph shift. Watch variables link to the official FRED, BLS, EIA, BEA, and USDA series.",
    keywords:
      "supply demand shock, economics shock simulator, supply curve shift, demand curve shift, AP Economics graph, S/D graph shift",
    app: {
      name: "Shock Simulator",
      category: "EducationalApplication",
      description:
        "Classifies any news headline as an S/D shock, quantifies price and quantity effects, and renders the correct supply-demand graph shift.",
    },
  },
  {
    slug: "shadow-fed",
    title: "Shadow Fed — what the Fed should do, with a public track record · econ.mom",
    description:
      "Weekly Taylor-rule-derived federal funds rate recommendation, published with a permanent public track record vs. actual FOMC decisions. Inputs auto-update from FRED. Original Taylor (1993), FAIT, and inertial variants supported.",
    keywords:
      "Taylor rule calculator, Shadow Fed, federal funds rate prediction, FOMC track record, FAIT Taylor rule, Saras Totey Shadow Fed",
    app: {
      name: "Shadow Fed",
      category: "FinanceApplication",
      description:
        "Weekly Taylor-rule federal funds rate recommendation with a permanent public track record vs. the actual FOMC decision.",
    },
  },
  {
    slug: "paper-decoder",
    title: "Econ Paper Decoder — turn any NBER, JEP, AER paper into a citation block · econ.mom",
    description:
      "Upload a PDF or paste a URL. Paper Decoder extracts the research question, identification strategy, headline finding, sample, and a ready-to-cite block in 60 seconds. Works on NBER working papers, JEP, AER, QJE, and more.",
    keywords:
      "NBER paper summary, AER summary, JEP summary, economics paper decoder, citation generator, research paper extractor",
    app: {
      name: "Econ Paper Decoder",
      category: "EducationalApplication",
      description:
        "Converts any NBER, JEP, or AER paper into a structured citation block with research question, identification, and findings.",
    },
  },
  {
    slug: "news-translator",
    title: "Econ News Translator — headline to model, graph, and prediction · econ.mom",
    description:
      "Paste any economics news. News Translator identifies the textbook model, draws the predicted graph shift, names the FRED series to watch, and tells you what theory says happens next. The reverse of Shock Simulator.",
    keywords:
      "economics news translator, economic theory model, AP Economics news analysis, monetary policy news, FRED series watch",
    app: {
      name: "Econ News Translator",
      category: "EducationalApplication",
      description:
        "Maps any economics news headline to the relevant textbook model, predicted graph shift, FRED indicators, and theoretical forecast.",
    },
  },
  {
    slug: "us-econ",
    title: "US Econ Dashboard — every state, every county, real data · econ.mom",
    description:
      "Click any state to see its labor, cost-of-living, and education metrics, then drill to county-level data. Sourced from BLS LAUS, state QCEW filings, MIT Living Wage Calculator, and NCES.",
    keywords:
      "US economic dashboard, state economic data, county economic data, BLS LAUS, MIT Living Wage, NCES, Colorado economy",
    app: {
      name: "US Econ Dashboard",
      category: "BusinessApplication",
      description:
        "Interactive dashboard of state and county labor, cost-of-living, and education metrics from BLS, MIT, and NCES.",
    },
  },
  {
    slug: "econlever",
    title: "EconLever — four policy levers, ten years of growth, deficit, inequality · econ.mom",
    description:
      "Move four policy levers (top marginal tax rate, corporate tax, social spending, federal funds rate) and watch a ten-year projection of US real GDP growth, federal deficit, and the Gini coefficient. Coefficients calibrated to Romer-Romer (2010), Auerbach-Gorodnichenko (2012), and Piketty-Saez-Zucman (2018).",
    keywords:
      "EconLever, fiscal policy simulator, tax policy simulator, Romer-Romer multipliers, Auerbach Gorodnichenko, Saras Totey EconLever",
    app: {
      name: "EconLever",
      category: "FinanceApplication",
      description:
        "Policy simulator with four levers driving a ten-year projection of US real GDP, federal deficit, and Gini coefficient.",
    },
  },
  {
    slug: "inflation-decomposer",
    title: "Inflation Decomposer — split CPI into supply, demand, expectations, policy · econ.mom",
    description:
      "Decompose headline CPI into supply, demand, expectations, and policy components using the Bernanke-Blanchard (2024) framework with Hazell-Herreño-Nakamura-Steinsson expectations weighting. Live FRED inputs.",
    keywords:
      "inflation decomposer, Bernanke Blanchard inflation, CPI decomposition, supply vs demand inflation, inflation expectations, AP Macro inflation",
    app: {
      name: "Inflation Decomposer",
      category: "FinanceApplication",
      description:
        "Decomposes headline CPI into supply, demand, expectations, and policy components using the Bernanke-Blanchard framework.",
    },
  },
  {
    slug: "natural-experiments",
    title: "Natural Experiment Finder — match research questions to identification strategies · econ.mom",
    description:
      "Searchable library of 60+ canonical natural experiments: Card-Krueger NJ minimum wage, Mariel boatlift, Vietnam draft lottery, Oregon Medicaid, China Shock, Volcker disinflation, MTO, RAND HIE. Filter by method (DiD, RDD, IV, RCT, synthetic control) and AP-CED concept.",
    keywords:
      "natural experiments, Card Krueger, Mariel boatlift, Vietnam draft lottery, Oregon Medicaid, difference in differences, regression discontinuity, instrumental variables, causal inference",
    app: {
      name: "Natural Experiment Finder",
      category: "EducationalApplication",
      description:
        "Searchable library of 60+ canonical natural experiments filterable by identification method and concept tag.",
    },
  },
  {
    slug: "counterfactual-engine",
    title: "Counterfactual Engine — edit the past, simulate the road not taken · econ.mom",
    description:
      "Five canonical macro counterfactuals (Volcker 1979, Lehman 2008, ARP 2021, UK austerity 2010, Greenspan-era housing) with adjustable parameters and side-by-side actual-vs-counterfactual time series. Each calibrated to a peer-reviewed paper.",
    keywords:
      "counterfactual engine, Volcker counterfactual, Lehman counterfactual, ARP 2021 counterfactual, UK austerity, macroeconomic simulation",
    app: {
      name: "Counterfactual Engine",
      category: "EducationalApplication",
      description:
        "Macro counterfactual simulator for five canonical episodes with adjustable parameters and peer-reviewed calibrations.",
    },
  },
];

function escapeHtml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Per-route static body content. The SPA hydrates over this once JS loads, but
// before hydration, Googlebot/Bingbot/PerplexityBot see real route-specific
// HTML (h1, intro paragraph, and a link list back to other tools). Without
// this, every prerendered page shipped the SAME noscript block, which Google
// treats as a near-duplicate and demotes to "Crawled, currently not indexed."
const CRAWLABLE_LINKS = [
  { slug: "", label: "Home" },
  { slug: "tools", label: "All twelve tools" },
  { slug: "frq-grader", label: "AP FRQ Grader" },
  { slug: "tarifflab", label: "TariffLab" },
  { slug: "textbook-atlas", label: "Textbook Atlas" },
  { slug: "shock-sim", label: "Shock Simulator" },
  { slug: "shadow-fed", label: "Shadow Fed" },
  { slug: "paper-decoder", label: "Paper Decoder" },
  { slug: "news-translator", label: "News Translator" },
  { slug: "us-econ", label: "US Econ Dashboard" },
  { slug: "econlever", label: "EconLever" },
  { slug: "inflation-decomposer", label: "Inflation Decomposer" },
  { slug: "natural-experiments", label: "Natural Experiment Finder" },
  { slug: "counterfactual-engine", label: "Counterfactual Engine" },
  { slug: "methodology", label: "Methodology" },
  { slug: "founder", label: "Founder" },
];

// Per-route "extras" block: substantive, entity-rich, keyword-rich HTML that
// is unique to each tool page. This is what flips a page from "Crawled,
// currently not indexed" to indexed: Googlebot needs distinctive named
// entities (state names, data series IDs, dataset names) to differentiate
// pages from one another in its quality model.
const ROUTE_EXTRAS = {
  "us-econ": `
    <section>
      <h2 style="font-size:1.25rem;margin:24px 0 8px;">Data coverage</h2>
      <p>All 50 states and 3,000 plus counties. Click any state on the map to see unemployment rate (BLS Local Area Unemployment Statistics, LAUS), median hourly living wage (MIT Living Wage Calculator, single adult, no children), bachelor's degree attainment (NCES Common Core of Data, ACS 5-year), and an industry employment mix from the Quarterly Census of Employment and Wages (QCEW).</p>
      <h2 style="font-size:1.25rem;margin:24px 0 8px;">Sample state snapshots</h2>
      <ul>
        <li><strong>Colorado</strong>: unemployment 3.2%, living wage $25.02/hr, bachelor's attainment 44%</li>
        <li><strong>California</strong>: unemployment 5.1%, living wage $27.81/hr, bachelor's attainment 36%</li>
        <li><strong>Texas</strong>: unemployment 4.0%, living wage $20.95/hr, bachelor's attainment 32%</li>
        <li><strong>New York</strong>: unemployment 4.3%, living wage $26.48/hr, bachelor's attainment 39%</li>
        <li><strong>Florida</strong>: unemployment 3.6%, living wage $22.10/hr, bachelor's attainment 33%</li>
        <li><strong>Mississippi</strong>: unemployment 5.8%, living wage $18.34/hr, bachelor's attainment 22%</li>
        <li><strong>Massachusetts</strong>: unemployment 3.8%, living wage $26.40/hr, bachelor's attainment 47%</li>
        <li><strong>Ohio</strong>: unemployment 4.2%, living wage $19.78/hr, bachelor's attainment 30%</li>
        <li><strong>Georgia</strong>: unemployment 3.7%, living wage $20.42/hr, bachelor's attainment 33%</li>
        <li><strong>Washington</strong>: unemployment 4.1%, living wage $25.93/hr, bachelor's attainment 38%</li>
      </ul>
      <h2 style="font-size:1.25rem;margin:24px 0 8px;">Primary data sources</h2>
      <ul>
        <li>BLS Local Area Unemployment Statistics (LAUS), series prefix LASST</li>
        <li>BLS Quarterly Census of Employment and Wages (QCEW)</li>
        <li>MIT Living Wage Calculator, annualized, single adult, no children</li>
        <li>NCES Common Core of Data (CCD), educational attainment by state</li>
        <li>Census ACS 5-year estimates for cross-validation</li>
      </ul>
      <h2 style="font-size:1.25rem;margin:24px 0 8px;">How to use</h2>
      <ol>
        <li>Click a state on the choropleth map to load its dashboard.</li>
        <li>Switch the visible metric (unemployment, wage, education).</li>
        <li>Drill into county-level data with the search box.</li>
        <li>Export the underlying CSV from the data panel.</li>
      </ol>
    </section>`,
  "textbook-atlas": `
    <section>
      <h2 style="font-size:1.25rem;margin:24px 0 8px;">What this maps</h2>
      <p>Every AP Economics concept (AP Macroeconomics Units 1 through 6 and AP Microeconomics Units 1 through 6) cross-referenced with the FRED time series that most directly reflects it. Click a concept to see its definition, the canonical AP rubric language, the FRED series IDs, the textbook chapter mapping for Mankiw, Krugman, and Parkin, and a live chart of the data series.</p>
      <h2 style="font-size:1.25rem;margin:24px 0 8px;">Concept to data examples</h2>
      <ul>
        <li><strong>Real GDP</strong>: FRED series GDPC1, quarterly, 2017 dollars (BEA)</li>
        <li><strong>Unemployment rate</strong>: FRED series UNRATE, monthly (BLS Current Population Survey)</li>
        <li><strong>Core CPI</strong>: FRED series CPILFESL, monthly (BLS, all urban consumers, excluding food and energy)</li>
        <li><strong>10-year Treasury</strong>: FRED series DGS10, daily (Board of Governors H.15)</li>
        <li><strong>Trade-weighted dollar</strong>: FRED series DTWEXBGS</li>
        <li><strong>Phillips Curve</strong>: cross of UNRATE and CPILFESL year-over-year change</li>
      </ul>
      <h2 style="font-size:1.25rem;margin:24px 0 8px;">Textbook crosswalk</h2>
      <p>Mappings to Mankiw Principles of Economics (10e), Krugman and Wells Economics (6e), and Parkin Economics (14e), chapter and section level.</p>
    </section>`,
  "inflation-decomposer": `
    <section>
      <h2 style="font-size:1.25rem;margin:24px 0 8px;">Decomposition basket</h2>
      <p>Splits monthly headline CPI inflation into the eight major BLS expenditure categories with their actual relative importance weights from the most recent annual reweighting. The chart shows percentage-point contribution to headline CPI year-over-year change, so the stacked bars sum to the headline rate.</p>
      <h2 style="font-size:1.25rem;margin:24px 0 8px;">CPI components tracked</h2>
      <ul>
        <li><strong>Food</strong>: 13.4% weight (FRED CPIFABSL)</li>
        <li><strong>Energy</strong>: 6.7% weight (FRED CPIENGSL)</li>
        <li><strong>Shelter</strong>: 36.2% weight (FRED CUSR0000SAH1)</li>
        <li><strong>Apparel</strong>: 2.5% weight (FRED CPIAPPSL)</li>
        <li><strong>Transportation services</strong>: 5.9% weight (FRED CUSR0000SAS4)</li>
        <li><strong>Medical care services</strong>: 6.6% weight (FRED CUSR0000SAM2)</li>
        <li><strong>Recreation</strong>: 5.4% weight (FRED CPIRECSL)</li>
        <li><strong>Education and communication</strong>: 6.4% weight (FRED CPIEDUSL)</li>
      </ul>
      <h2 style="font-size:1.25rem;margin:24px 0 8px;">Why it matters for AP Macro</h2>
      <p>The 2022 to 2024 inflation episode was 70 percent driven by shelter and energy. The decomposition makes that visible and shows why the Fed's preferred measure (core PCE) gave a different signal than headline CPI.</p>
    </section>`,
  "counterfactual-engine": `
    <section>
      <h2 style="font-size:1.25rem;margin:24px 0 8px;">What this models</h2>
      <p>Re-runs a chosen real-world economic event with one parameter changed and shows the divergence. Built on a small system of stochastic difference equations calibrated to FRED data. The engine integrates Gemini and FRED data to narrate the counterfactual path in plain English while the parametric model runs the actual simulation.</p>
      <h2 style="font-size:1.25rem;margin:24px 0 8px;">Available scenarios</h2>
      <ul>
        <li>What if the Fed had cut 50 bp instead of 25 bp at the September 2024 FOMC meeting</li>
        <li>What if the 2022 American Rescue Plan had been half its actual size</li>
        <li>What if oil prices had stayed at $30 through 2022 (no Russia invasion shock)</li>
        <li>What if the China tariffs of 2018 had been reciprocal-only</li>
        <li>What if the 2008 TARP had not passed</li>
      </ul>
    </section>`,
  "natural-experiments": `
    <section>
      <h2 style="font-size:1.25rem;margin:24px 0 8px;">What this finds</h2>
      <p>Searches for difference-in-differences candidates in US state-level economic data. You pick a policy change (minimum wage hike, Medicaid expansion, marijuana legalization, sports betting legalization) and the tool finds the treatment state, suggests valid control states using synthetic control matching, and visualizes the pre and post trends.</p>
      <h2 style="font-size:1.25rem;margin:24px 0 8px;">Sample experiments</h2>
      <ul>
        <li>Seattle 2014 minimum wage to $15, control: Portland and Spokane</li>
        <li>California 2017 marijuana legalization, control: synthetic from Texas, Florida, North Carolina</li>
        <li>Wisconsin Act 10 (2011), control: Minnesota and Illinois</li>
        <li>Massachusetts Romneycare (2006), control: Connecticut and New Hampshire</li>
      </ul>
    </section>`,
};
function renderRouteExtras(slug) {
  return ROUTE_EXTRAS[slug] || "";
}

function renderCrawlableNav(currentSlug) {
  const items = CRAWLABLE_LINKS
    .filter((l) => l.slug !== currentSlug)
    .map(
      (l) =>
        `<li style="display:inline-block;margin:0 14px 8px 0;"><a href="${
          l.slug ? `/${l.slug}` : "/"
        }" style="color:#3b1612;text-decoration:underline;">${escapeHtml(l.label)}</a></li>`
    )
    .join("");
  return `<nav aria-label="Site navigation"><ul style="list-style:none;padding:0;margin:24px 0;font-size:0.9rem;">${items}</ul></nav>`;
}

function buildPage(route) {
  const url = route.slug ? `${SITE}/${route.slug}` : `${SITE}/`;
  const title = route.title;
  const description = route.description;

  let html = TEMPLATE;

  // Title
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(title)}</title>`);

  // Single-pass meta replacements; if the tag is missing we leave it (root index.html is the source of truth).
  html = html.replace(
    /<meta name="description" content="[^"]*"\s*\/>/,
    `<meta name="description" content="${escapeHtml(description)}" />`
  );
  if (route.keywords) {
    html = html.replace(
      /<meta name="keywords" content="[^"]*"\s*\/>/,
      `<meta name="keywords" content="${escapeHtml(route.keywords)}" />`
    );
  }
  html = html.replace(
    /<meta property="og:url" content="[^"]*"\s*\/>/,
    `<meta property="og:url" content="${url}" />`
  );
  html = html.replace(
    /<meta property="og:title" content="[^"]*"\s*\/>/,
    `<meta property="og:title" content="${escapeHtml(title)}" />`
  );
  html = html.replace(
    /<meta property="og:description" content="[^"]*"\s*\/>/,
    `<meta property="og:description" content="${escapeHtml(description)}" />`
  );
  html = html.replace(
    /<meta name="twitter:title" content="[^"]*"\s*\/>/,
    `<meta name="twitter:title" content="${escapeHtml(title)}" />`
  );
  html = html.replace(
    /<meta name="twitter:description" content="[^"]*"\s*\/>/,
    `<meta name="twitter:description" content="${escapeHtml(description)}" />`
  );
  html = html.replace(
    /<link rel="canonical" href="[^"]*"\s*\/>/,
    `<link rel="canonical" href="${url}" />`
  );

  // If this is a tool page, inject SoftwareApplication + BreadcrumbList JSON-LD before </head>.
  if (route.app) {
    const appLd = {
      "@context": "https://schema.org",
      "@type": route.app.category || "SoftwareApplication",
      name: route.app.name,
      url,
      applicationCategory: route.app.category || "EducationalApplication",
      operatingSystem: "Any (web)",
      isAccessibleForFree: true,
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      creator: {
        "@type": "Person",
        name: "Saras Totey",
        url: `${SITE}/founder`,
        sameAs: [
          "https://thedividendcollective.com/saras-totey",
          "https://econlever.org",
          "https://www.linkedin.com/in/saras-totey-64a777334/",
        ],
      },
      publisher: { "@type": "Organization", name: "The Mother Of Econ", url: SITE },
      description: route.app.description,
      inLanguage: "en-US",
    };
    const breadcrumbLd = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "econ.mom", item: SITE },
        { "@type": "ListItem", position: 2, name: "Tools", item: `${SITE}/tools` },
        { "@type": "ListItem", position: 3, name: route.app.name, item: url },
      ],
    };
    const appTag = `<script type="application/ld+json" id="page-app-jsonld">${JSON.stringify(appLd)}</script>`;
    const crumbTag = `<script type="application/ld+json" id="page-breadcrumb-jsonld">${JSON.stringify(breadcrumbLd)}</script>`;
    html = html.replace("</head>", `    ${appTag}\n    ${crumbTag}\n  </head>`);
  }

  // For the founder page, inject a richer Person JSON-LD with sameAs that closes
  // the identity loop with thedividendcollective.com/saras-totey.
  if (route.slug === "founder") {
    const founderLd = {
      "@context": "https://schema.org",
      "@type": "ProfilePage",
      url,
      mainEntity: {
        "@type": "Person",
        name: "Saras Totey",
        givenName: "Saras",
        familyName: "Totey",
        jobTitle: "Founder, The Mother Of Econ",
        url,
        sameAs: [
          "https://econlever.org",
          "https://thedividendcollective.com/saras-totey",
          "https://thedividendcollective.com/",
          "https://www.linkedin.com/in/saras-totey-64a777334/",
          "https://www.instagram.com/sarastotey_/",
          "https://github.com/PandaXPanther",
          "https://www.buymeacoffee.com/sarast1",
        ],
      },
    };
    const tag = `<script type="application/ld+json" id="page-founder-jsonld">${JSON.stringify(founderLd)}</script>`;
    html = html.replace("</head>", `    ${tag}\n  </head>`);
  }

  // Inject per-route crawlable body content inside a <noscript> block. Two
  // wins from this:
  //   1. Each prerendered page now ships UNIQUE body HTML, not the same
  //      generic stub. Google was treating identical bodies as duplicates.
  //   2. The internal nav inside the noscript gives Googlebot crawlable
  //      same-origin links to every other route, so /frq-grader is no longer
  //      orphaned by the hash-routed SPA.
  // <noscript> is invisible to JS-enabled browsers, so real users never see it.
  // Crawlers (including Googlebot's static fetch and AI bots without JS) do.
  const heading = route.app?.name || (route.slug === "founder" ? "Saras Totey" : route.slug === "methodology" ? "Methodology & Citations" : route.slug === "tools" ? "The Twelve" : "The Mother Of Econ");
  const subline = route.app?.description || description;
  const extras = renderRouteExtras(route.slug);
  const crawlBody = `
        <main style="font-family: 'Playfair Display', Georgia, serif; max-width: 760px; margin: 60px auto; padding: 0 24px; line-height: 1.55; color: #1a1310;">
          <p style="font-family:'JetBrains Mono',monospace;font-size:0.7rem;letter-spacing:0.18em;text-transform:uppercase;color:#6b5853;margin:0 0 12px;">econ.mom · Saras Totey · Boulder, CO</p>
          <h1 style="font-size:2.4rem;margin:0 0 16px;line-height:1.1;">${escapeHtml(heading)}</h1>
          <p style="font-size:1.05rem;margin:0 0 12px;">${escapeHtml(subline)}</p>
          <p style="font-size:0.95rem;color:#4a3d39;margin:0 0 24px;">${escapeHtml(description)}</p>
          ${extras}
          ${renderCrawlableNav(route.slug)}
          <p style="font-size:0.8rem;color:#6b5853;margin:24px 0 0;">JavaScript loads the interactive version of this tool. The full library lives at <a href="/" style="color:#3b1612;">econ.mom</a>.</p>
          <p style="font-size:0.75rem;color:#6b5853;margin:16px 0 0;">Brand identity and design system by <a href="https://attagency.co" rel="noopener" style="color:#3b1612;">ATT Agency</a>, a Boulder, Colorado marketing studio.</p>
        </main>`;
  html = html.replace(
    /<noscript>[\s\S]*?<\/noscript>/,
    `<noscript>${crawlBody}</noscript>`
  );

  return html;
}

let written = 0;
for (const route of ROUTES) {
  const dir = route.slug ? path.join(ROOT, route.slug) : ROOT;
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, "index.html");
  // Don't overwrite the canonical root index.html with itself in a way that loses the original.
  if (!route.slug && file === path.join(ROOT, "index.html")) {
    // Rewrite root with the up-to-date title/description from the catalog so it stays in sync.
    fs.writeFileSync(file, buildPage(route));
    written++;
    continue;
  }
  fs.writeFileSync(file, buildPage(route));
  written++;
}

console.log(`prerender-seo: wrote ${written} HTML files (root + ${ROUTES.length - 1} routes)`);
