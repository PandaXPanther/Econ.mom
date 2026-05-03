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

  // If this is a tool page, inject SoftwareApplication JSON-LD before </head>.
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
      creator: { "@type": "Person", name: "Saras Totey", url: `${SITE}/founder` },
      publisher: { "@type": "Organization", name: "The Mother Of Econ", url: SITE },
      description: route.app.description,
      inLanguage: "en-US",
    };
    const tag = `<script type="application/ld+json" id="page-app-jsonld">${JSON.stringify(appLd)}</script>`;
    html = html.replace("</head>", `    ${tag}\n  </head>`);
  }

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
