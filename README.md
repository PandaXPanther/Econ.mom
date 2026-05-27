<p align="center">
  <img src=".github/assets/logo.png" alt="econ.mom logo" width="180" />
</p>

<h1 align="center">The Mother of Econ</h1>

<p align="center">
  <em>Twelve free tools that make AP Economics actually make sense.</em>
  <br /><br />
  <a href="https://econ.mom"><b>econ.mom</b></a>
  &nbsp;·&nbsp;
  <a href="https://www.youtube.com/@themotherofeconomics">YouTube</a>
  &nbsp;·&nbsp;
  <a href="https://www.linkedin.com/in/saras-totey-64a777334/">LinkedIn</a>
</p>

<p align="center">
  <img alt="Live" src="https://img.shields.io/website?down_color=red&down_message=down&label=econ.mom&up_color=2A0E47&up_message=live&url=https%3A%2F%2Fecon.mom" />
  <img alt="React" src="https://img.shields.io/badge/React-18-149ECA?logo=react&logoColor=white" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white" />
  <img alt="Tailwind" src="https://img.shields.io/badge/Tailwind-3-38BDF8?logo=tailwindcss&logoColor=white" />
  <img alt="License" src="https://img.shields.io/badge/license-MIT-2A0E47" />
</p>

---

## What is econ.mom?

econ.mom is a free website with twelve mini apps that help you learn AP Economics. Instead of just reading a textbook, you can play with the ideas. You can paste a news headline and see which graph it moves. You can grade your own free response answers against the real AP rubric. You can set a fake federal funds rate and watch what would happen to jobs and inflation. You can pull live data from the Federal Reserve without writing any code.

It is built by a high school student for high school students. Everything is free, every formula is shown on the page, and every number comes from a real source you can click on (FRED, BLS, BEA, NBER, or the Fed). No login, no ads, no paywall.

If your textbook feels like it was written for someone in 1987, econ.mom is the modern version that uses today's data.

---

## The twelve tools

| # | Tool | What it does |
|---|---|---|
| 1 | [AP FRQ Grader](https://econ.mom/#/tools/frq-grader) | Paste your free response, get a point by point score using the College Board rubric. Has a built-in graph grader so it can read your hand-drawn AS-AD diagram too. |
| 2 | [TariffLab](https://econ.mom/#/tools/tarifflab) | Pick a country and a product, set a tariff rate, see who wins, who loses, and how much deadweight loss you just created. |
| 3 | [Textbook Atlas](https://econ.mom/#/tools/textbook-atlas) | Every standard AP Macro graph, but the lines move with real live data instead of being drawn from memory. |
| 4 | [Shock Simulator](https://econ.mom/#/tools/shock-sim) | Pick a shock (oil spike, tax cut, supply chain hit) and watch AS-AD shift the right way, with a Fed reaction baked in. |
| 5 | [Shadow Fed](https://econ.mom/#/tools/shadow-fed) | Make your own FOMC decision, then compare it to the real dot plot. Keeps a public track record so you can see if you would have called it. |
| 6 | [Econ Paper Decoder](https://econ.mom/#/tools/paper-decoder) | Drop in a hairy NBER or AER paper, get a plain English summary, the identification strategy, and a quality flag. |
| 7 | [News Translator](https://econ.mom/#/tools/news-translator) | Paste a headline. The site picks the model (AS-AD, Phillips, Loanable Funds, etc.), shows the graph that shifts, and predicts what FRED series will move first. Optional live AI button uses Perplexity Sonar with citations from the Fed, BLS, Reuters, FT, Bloomberg, and WSJ. |
| 8 | [Counterfactual Engine](https://econ.mom/#/tools/counterfactual-engine) | Edit the past. What if the Fed never cut rates in 2008? What if NAFTA never happened? Re-runs the macro path. |
| 9 | [Inflation Decomposer](https://econ.mom/#/tools/inflation-decomposer) | Splits monthly CPI into four buckets: supply, demand, expectations, and policy. Tells you which one is actually driving the headline number. |
| 10 | [Natural Experiment Finder](https://econ.mom/#/tools/natural-experiments) | Type a research question, get back the best identification strategy (diff-in-diff, RDD, IV, synthetic control) plus a real paper that used it. |
| 11 | [US Econ State Lab](https://econ.mom/#/tools/us-econ) | Every US state and county. Labor, cost of living, education, industry mix, live. |
| 12 | [EconLever](https://econ.mom/#/tools/econlever) | Four policy levers (fiscal, monetary, trade, redistribution). Pull a lever, watch ten years of GDP growth, deficit, and inequality update against a real macro baseline. |

> The Graph Grader is built into the FRQ Grader, not a separate tool. Twelve tools total.

---

## Why this exists

Most economics websites are one of two things. Either they are giant paywalled data terminals (Bloomberg, Refinitiv, FactSet) that cost thousands of dollars a year, or they are static textbook PDFs that show you a graph from 1995 and call it a day.

There was no free, modern, interactive site that actually let a high school student touch the data and play with the models. So I built one.

Every tool follows the same rules:
- The data source is shown on the page, with a link.
- The formula is shown on the page, in math notation.
- The graph follows AP College Board conventions exactly.
- It works on a phone.
- It does not need a login.

---

## Tech stack

**Frontend**
- Vite + React 18 + TypeScript
- Tailwind CSS v3 + shadcn/ui
- wouter (hash routing so deep links survive on any static host)
- Recharts for time series and AS-AD style graphs
- Framer Motion for the editorial feel

**Backend** (Netlify Functions)
- Gemini 2.5 Flash for FRQ grading, paper decoding, scenario explainers
- Perplexity Sonar for the live News Translator with cited sources
- FRED API for macro data (CPI, unemployment, fed funds, treasury yields)
- BLS, BEA, NBER for primary source data
- Netlify Blobs for per-IP rate limit counters and a response cache

**Type and palette**
- Fraunces (display, italic) and Inter Tight (body) and JetBrains Mono (data)
- Oxblood and parchment in light mode, library-at-night and amber in dark mode

---

## Running it locally

```bash
git clone https://github.com/PandaXPanther/the-mother-of-econ.git
cd the-mother-of-econ
npm install
npm run dev
# open http://localhost:5000
```

To build for production:

```bash
npm run build
# output goes to dist/public, deployable to any static CDN
```

The Netlify Functions in `netlify/functions/` need three environment variables if you want the AI features to work:

```
GEMINI_API_KEY=...
PERPLEXITY_API_KEY=...
FRED_API_KEY=...
```

Without these, every tool that uses live AI or live FRED data will fall back to a deterministic offline mode. The site still works, you just lose the live cited translations and the live FRED charts.

See [`RATE_LIMITS.md`](./RATE_LIMITS.md) for the per-IP and global daily caps on each AI endpoint. The caps are sized so a normal student grinding FRQs at full speed will never hit them, but a bot scripting the endpoint will.

---

## Project structure

```
econ-mom/
├── client/                  # Vite + React frontend
│   ├── src/
│   │   ├── pages/           # one file per route
│   │   │   └── tools/       # the twelve tools
│   │   ├── components/      # SiteHeader, SiteFooter, brand, charts
│   │   ├── lib/             # methodology, tool registry, helpers
│   │   └── index.css        # Tailwind + design tokens
│   └── public/              # favicon, og image, robots, sitemap
├── netlify/
│   └── functions/           # serverless endpoints (Gemini, Perplexity, FRED)
│       └── _lib/limits.ts   # shared rate limit wrapper
├── server/                  # Express (dev only, prod is static + functions)
├── shared/                  # zod schemas, shared types
├── scripts/
│   └── prerender-seo.mjs    # pre-renders per-route SEO tags for crawlers
├── netlify.toml             # build, headers, redirects
├── RATE_LIMITS.md           # full rate limit table and rationale
└── README.md                # you are here
```

---

## Methodology and citations

Every tool ships a full methodology page that shows the data source, the formula, the validation steps, and a primary literature citation. See [econ.mom/#/methodology](https://econ.mom/#/methodology) for the live version.

If you find a number that looks wrong, open an issue and link the FRED series or the BLS release. I will fix it.

---

## Roadmap

- [ ] Mobile responsiveness sweep on the wider data tables (in progress)
- [ ] Per-tool teacher mode with worksheets you can print
- [ ] Spanish translation for every tool
- [ ] Open the rate limit dashboard to the public so you can see live usage
- [ ] AP Stats companion site (different domain)

---

## Contributing

Pull requests are welcome. If you are a student or teacher and you spotted a textbook claim that does not hold up against the live data, that is exactly the kind of thing I want to fix. Open an issue with the headline and the FRED series and I will get to it.

If you want to add a new tool, start by opening an issue describing the model, the input, the output, and the data source. Then we can decide if it fits the twelve.

---

## Credits

Built by **[Saras Totey](https://www.linkedin.com/in/saras-totey-64a777334/)** in Boulder, Colorado. Previous project: [EconLever](https://econlever.org).

Sister channel on YouTube: [@themotherofeconomics](https://www.youtube.com/@themotherofeconomics).

If econ.mom helped you on a test, [leave a tip](https://www.buymeacoffee.com/sarast1) so the API bills keep getting paid.

---

## License

MIT. See [`LICENSE`](./LICENSE).

The data on this site comes from public sources (FRED, BLS, BEA, NBER, Federal Reserve). Those agencies own their data, not me. The code, design, and copy on this site are mine, and you can use them under MIT as long as you keep the credit line.
