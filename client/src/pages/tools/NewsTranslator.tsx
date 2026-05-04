import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PageShell } from "@/components/brand/PageShell";
import { ToolPageHeader } from "@/components/brand/ToolPageHeader";
import { TOOL_BY_SLUG } from "@/lib/tools";
import { SEO } from "@/components/brand/SEO";
import { Newspaper, Sparkles, ArrowDown, ExternalLink, TrendingUp, History, Telescope } from "lucide-react";

const COMP = TOOL_BY_SLUG["news-translator"];

type ModelKey =
  | "as_ad"
  | "is_lm"
  | "phillips"
  | "loanable_funds"
  | "money_market"
  | "solow"
  | "sd"
  | "trade";

type Direction = "left" | "right" | "rotate" | "none";

interface Translation {
  model: ModelKey;
  modelLabel: string;
  curve: string;
  direction: Direction;
  shortRun: string;
  longRun: string;
  fredSeries: { code: string; label: string }[];
  magnitude: "small" | "moderate" | "large";
  textbookCh: string;
  confidence: "low" | "medium" | "high";
}

interface Headline {
  text: string;
  triggers: RegExp[];
  out: Translation;
  exemplar?: string; // historical episode for confidence calibration
}

// Core taxonomy, built by hand. Each entry maps a regex pattern of the headline
// onto a deterministic textbook treatment. Pattern matching is inclusive: the
// first match wins, but unmatched headlines fall through to a smart heuristic.
const PATTERNS: Headline[] = [
  {
    text: "Fed raises rates / hawkish FOMC",
    triggers: [/fed.*(raise|hike|hawk|tighten)/i, /rate.*hike/i, /fomc.*(hawk|tighten)/i],
    exemplar: "March 2022 liftoff cycle",
    out: {
      model: "as_ad",
      modelLabel: "Aggregate Supply / Aggregate Demand",
      curve: "AD shifts left",
      direction: "left",
      shortRun:
        "Higher real rates → lower investment & durable consumption → AD shifts left → output Y falls below Y*, price level eases. Phillips curve says unemployment rises.",
      longRun:
        "Output returns to potential as nominal wages adjust; price level lower than pre-shock. Effect on real GDP is transitory; effect on inflation is persistent.",
      fredSeries: [
        { code: "FEDFUNDS", label: "Effective Federal Funds Rate" },
        { code: "GDPC1", label: "Real GDP" },
        { code: "UNRATE", label: "Unemployment Rate" },
        { code: "CPIAUCSL", label: "CPI All Urban" },
      ],
      magnitude: "moderate",
      textbookCh: "Mankiw Ch. 35; Blanchard Ch. 5",
      confidence: "high",
    },
  },
  {
    text: "Fed cuts rates / dovish FOMC",
    triggers: [/fed.*(cut|dovish|ease|loosen)/i, /rate.*cut/i, /fomc.*(dove|ease)/i],
    exemplar: "September 2024 first cut",
    out: {
      model: "as_ad",
      modelLabel: "Aggregate Supply / Aggregate Demand",
      curve: "AD shifts right",
      direction: "right",
      shortRun:
        "Lower real rates → higher investment & durable consumption → AD shifts right → output Y rises above Y*, price level rises. Phillips curve says unemployment falls.",
      longRun:
        "Output returns to potential; price level permanently higher. Real GDP gain is short-run only.",
      fredSeries: [
        { code: "FEDFUNDS", label: "Effective Federal Funds Rate" },
        { code: "GDPC1", label: "Real GDP" },
        { code: "PAYEMS", label: "Total Nonfarm Payrolls" },
      ],
      magnitude: "moderate",
      textbookCh: "Mankiw Ch. 35",
      confidence: "high",
    },
  },
  {
    text: "OPEC supply cut / oil shock",
    triggers: [/opec.*(cut|reduce|production)/i, /oil.*(cut|shock|supply)/i, /(barrel|crude).*(cut|surge)/i],
    exemplar: "October 2022 OPEC+ 2M bpd cut",
    out: {
      model: "as_ad",
      modelLabel: "Aggregate Supply / Aggregate Demand",
      curve: "SRAS shifts left (negative supply shock)",
      direction: "left",
      shortRun:
        "Energy is an input cost across the economy → SRAS shifts left → stagflation: output falls AND price level rises. Phillips curve traces upward (the 1973-style outward shift).",
      longRun:
        "Wage and price expectations adjust; SRAS shifts back as substitution and capital reallocation occur. Real GDP returns to potential at a higher price level.",
      fredSeries: [
        { code: "DCOILWTICO", label: "WTI Crude Oil Price" },
        { code: "GASREGW", label: "US Regular Gasoline Prices" },
        { code: "CPIENGSL", label: "CPI Energy" },
        { code: "GDPC1", label: "Real GDP" },
      ],
      magnitude: "large",
      textbookCh: "Mankiw Ch. 33; Blanchard Ch. 8",
      confidence: "high",
    },
  },
  {
    text: "Tariff imposed / trade barrier",
    triggers: [/tariff/i, /trade.*(war|barrier|duty|levy)/i, /import.*(tax|duty)/i, /reciprocal.*tariff/i],
    exemplar: "EO 14257, April 2025 universal 10% reciprocal tariff",
    out: {
      model: "trade",
      modelLabel: "International Trade · S/D with World Price",
      curve: "Domestic price ↑ to Pw + t; imports ↓",
      direction: "rotate",
      shortRun:
        "Domestic price rises by tariff t (≈100% pass-through on US import tariffs per Fajgelbaum 2020). Consumer surplus falls; producer surplus rises; gov't revenue is the rectangle on imports; deadweight loss is the two triangles.",
      longRun:
        "Import-substituting sectors expand (slow); export sectors contract via real exchange-rate appreciation and retaliation. Real wages fall in tradable sectors. Aggregate welfare loss persists.",
      fredSeries: [
        { code: "IEABC", label: "Trade Balance: Goods & Services" },
        { code: "IR", label: "Imports of Goods, BoP basis" },
        { code: "CPIAUCSL", label: "CPI All Urban (pass-through)" },
      ],
      magnitude: "large",
      textbookCh: "Krugman & Obstfeld Ch. 9; Mankiw Ch. 9",
      confidence: "high",
    },
  },
  {
    text: "Hot CPI print / inflation surprise",
    triggers: [/cpi.*(hot|jump|surge|above)/i, /inflation.*(hot|surge|surprise|spike)/i, /pce.*(hot|surge|above)/i],
    exemplar: "June 2022 CPI 9.1% YoY",
    out: {
      model: "phillips",
      modelLabel: "Short-Run Phillips Curve",
      curve: "Move along the SRPC; expectations risk shift outward",
      direction: "rotate",
      shortRun:
        "If hot inflation reflects strong AD (low U-rate), economy moves NW along SRPC. If it reflects supply shock, the entire SRPC shifts outward. Either way, real wages fall unless wage growth catches up.",
      longRun:
        "Expected inflation rises → SRPC shifts up → at any unemployment rate, inflation is higher. Volcker-style disinflation requires above-NAIRU unemployment to push expectations back down.",
      fredSeries: [
        { code: "CPIAUCSL", label: "CPI All Urban" },
        { code: "CPILFESL", label: "Core CPI" },
        { code: "PCEPI", label: "PCE Price Index" },
        { code: "T5YIE", label: "5-Yr Breakeven Inflation" },
      ],
      magnitude: "moderate",
      textbookCh: "Mankiw Ch. 35.4; Blanchard Ch. 8",
      confidence: "high",
    },
  },
  {
    text: "Strong jobs report / payrolls beat",
    triggers: [/(jobs|payrolls|nfp).*(beat|strong|surge|hot)/i, /unemployment.*(fall|drop|low)/i],
    exemplar: "January 2023 NFP +517k",
    out: {
      model: "phillips",
      modelLabel: "Short-Run Phillips Curve",
      curve: "Movement along SRPC toward lower U, higher π",
      direction: "rotate",
      shortRun:
        "Tighter labor market → wage pressure → inflation pressure (Phillips trade-off). Beveridge curve sits above pre-pandemic regime if vacancies remain elevated.",
      longRun:
        "If U falls below NAIRU, inflation expectations drift up. Fed's reaction function (Taylor rule) prescribes higher policy rate. Hawkish surprise then loops to AS-AD: AD shifts left.",
      fredSeries: [
        { code: "PAYEMS", label: "Total Nonfarm Payrolls" },
        { code: "UNRATE", label: "Unemployment Rate" },
        { code: "JTSJOL", label: "Job Openings (JOLTS)" },
        { code: "CES0500000003", label: "Avg. Hourly Earnings" },
      ],
      magnitude: "moderate",
      textbookCh: "Mankiw Ch. 35.4; CED Macro Unit 5",
      confidence: "high",
    },
  },
  {
    text: "Government deficit / fiscal stimulus",
    triggers: [/(deficit|spending).*(rise|surge|expand|stimulus)/i, /infrastructure.*(bill|package)/i, /tax.*(cut|rebate|stimulus)/i],
    exemplar: "ARRA 2009; CARES 2020; IIJA 2021",
    out: {
      model: "loanable_funds",
      modelLabel: "Loanable Funds + AS-AD",
      curve: "Demand for loanable funds shifts right; AD shifts right",
      direction: "right",
      shortRun:
        "Government borrowing → demand for loanable funds shifts right → real interest rate rises → crowds out some private investment. AD shifts right → Y rises above Y* short-run.",
      longRun:
        "State-dependent (Auerbach-Gorodnichenko 2012): in slack/recession, multiplier ≈ 3.5 with crowding-in. In expansion, multiplier ≈ 0 with full crowding-out and inflation pressure.",
      fredSeries: [
        { code: "FYFSGDA188S", label: "Federal Surplus/Deficit % GDP" },
        { code: "GS10", label: "10-Year Treasury Constant Maturity" },
        { code: "GPDIC1", label: "Real Gross Private Domestic Investment" },
      ],
      magnitude: "moderate",
      textbookCh: "Mankiw Ch. 26 & 34; Blanchard Ch. 22",
      confidence: "high",
    },
  },
  {
    text: "Quantitative easing / balance sheet",
    triggers: [/(qe|quantitative.*easing|balance.*sheet)/i, /(asset purchase|fed.*buy)/i, /(qt|tightening|run.*off)/i],
    exemplar: "QE3 2012; QT 2022–2024",
    out: {
      model: "money_market",
      modelLabel: "Money Market",
      curve: "Money supply shifts right (QE) or left (QT)",
      direction: "right",
      shortRun:
        "QE: Fed buys long-term assets → reserves up → flattens long-end of yield curve → portfolio-balance channel pushes investment up. QT reverses.",
      longRun:
        "Long-run neutrality: money is neutral and price level adjusts. Real effects come from term-premium and credit-channel transmission, not from money quantity per se.",
      fredSeries: [
        { code: "WALCL", label: "Total Assets of the Federal Reserve" },
        { code: "M2SL", label: "M2 Money Stock" },
        { code: "GS10", label: "10-Year Treasury" },
        { code: "MORTGAGE30US", label: "30-Year Fixed Mortgage" },
      ],
      magnitude: "moderate",
      textbookCh: "Mankiw Ch. 30; Blanchard Ch. 4",
      confidence: "medium",
    },
  },
  {
    text: "Productivity / TFP / AI surge",
    triggers: [/(productivity|tfp|technology).*(surge|jump|rise)/i, /(ai|automation).*(growth|productivity)/i],
    exemplar: "Late-1990s ICT boom",
    out: {
      model: "solow",
      modelLabel: "Solow Growth Model",
      curve: "Production function shifts up; new steady-state K* higher",
      direction: "right",
      shortRun:
        "Higher A → output per worker rises at every K/L. SRAS shifts right → disinflationary growth.",
      longRun:
        "Steady-state capital per worker rises; growth path shifts up permanently if A growth persists. Real wages rise.",
      fredSeries: [
        { code: "OPHNFB", label: "Nonfarm Business Sector: Labor Productivity" },
        { code: "RKNANPUSA666NRUG", label: "Capital Stock (PWT 10.01)" },
        { code: "GDPC1", label: "Real GDP" },
      ],
      magnitude: "large",
      textbookCh: "Mankiw Ch. 25; Romer Advanced Macro Ch. 1",
      confidence: "medium",
    },
  },
  {
    text: "Housing supply shock / mortgage rates",
    triggers: [/(mortgage|housing).*(rate|surge|drop|crisis)/i, /(home|housing).*(price|sale)/i],
    exemplar: "2022–2023 mortgage rate spike",
    out: {
      model: "sd",
      modelLabel: "Sectoral Supply / Demand · Housing",
      curve: "Demand for owned housing shifts left; rentals shift right",
      direction: "left",
      shortRun:
        "Higher mortgage rates → monthly payment for given price rises → demand for owned housing shifts left at every price → transactions fall, prices stagnate or decline.",
      longRun:
        "Supply (housing starts) responds slowly. Construction employment falls. Rental demand rises → rents up. Wealth effect via lower equity slows consumption.",
      fredSeries: [
        { code: "MORTGAGE30US", label: "30-Year Fixed Mortgage Rate" },
        { code: "MSACSR", label: "Months' Supply of New Houses" },
        { code: "HOUST", label: "New Privately-Owned Housing Starts" },
        { code: "CSUSHPISA", label: "Case-Shiller Home Price Index" },
      ],
      magnitude: "moderate",
      textbookCh: "Mankiw Ch. 4–6 (S/D)",
      confidence: "high",
    },
  },
];

const SAMPLES = [
  "Fed raises rates by 25bp at March FOMC",
  "OPEC+ announces 2 million barrels per day production cut",
  "Trump signs executive order imposing 25% tariff on Chinese imports",
  "September CPI prints at 3.7% YoY, hotter than 3.4% expected",
  "Treasury announces $1.6T deficit-financed infrastructure package",
  "30-year mortgage rate hits 7.8%, highest since 2000",
];

function classify(headline: string): Translation | null {
  const text = headline.trim();
  if (text.length < 4) return null;
  for (const p of PATTERNS) {
    if (p.triggers.some((re) => re.test(text))) return p.out;
  }
  return null;
}

interface GeminiNewsEnrichment {
  model?: string;
  curve?: string;
  direction?: string;
  shortRun?: string;
  longRun?: string;
  fredSeries?: string[];
  magnitudeNumbers?: {
    gdpEffectPct: number;
    inflationEffectPp: number;
    unemploymentEffectPp: number;
    policyRateEffectBps: number;
    horizonMonths: number;
  };
  historicalAnalog?: { event: string; date: string; outcome: string; magnitude: string };
  forecast?: { watch: string; range: string; confidence: string; reasoning: string };
}

export default function NewsTranslator() {
  const [headline, setHeadline] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [enrichment, setEnrichment] = useState<GeminiNewsEnrichment | null>(null);
  const [enrichLoading, setEnrichLoading] = useState(false);
  const [enrichError, setEnrichError] = useState<string | null>(null);

  const result = useMemo(() => classify(submitted), [submitted]);

  // Whenever a headline is submitted, fire Gemini for numbers + analog + forecast.
  useEffect(() => {
    if (!submitted) { setEnrichment(null); setEnrichError(null); return; }
    let cancel = false;
    setEnrichment(null);
    setEnrichError(null);
    setEnrichLoading(true);
    fetch("/api/gemini-news", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ headline: submitted }),
    })
      .then(async (r) => {
        if (!r.ok) {
          const j = await r.json().catch(() => ({}));
          throw new Error(j.error || `HTTP ${r.status}`);
        }
        return r.json();
      })
      .then((d) => { if (!cancel) setEnrichment(d); })
      .catch((e) => { if (!cancel) setEnrichError(e?.message || "failed"); })
      .finally(() => { if (!cancel) setEnrichLoading(false); });
    return () => { cancel = true; };
  }, [submitted]);

  return (
    <PageShell>
      <SEO
        title="Econ News Translator, read any headline like a textbook | The Mother Of Econ"
        description="Paste any economics news headline and get the textbook model that applies, the predicted graph shift, the FRED series to watch, and what theory says happens next. Reverse of Shock Simulator."
        path="/news-translator"
      />
      <ToolPageHeader tool={COMP} />

      <section className="mx-auto max-w-7xl px-6 py-12 lg:px-10">
        <div className="grid gap-8 lg:grid-cols-12">
          {/* INPUT */}
          <div className="lg:col-span-5">
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="mb-3 flex items-center gap-2 font-mono text-[0.7rem] uppercase tracking-widest text-muted-foreground">
                <Newspaper size={12} /> Paste a headline
              </div>
              <textarea
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="e.g., 'Fed raises rates by 25bp', 'OPEC+ cuts production by 2M bpd', 'Trump imposes 25% tariff on imports'"
                rows={4}
                data-testid="input-headline"
                className="w-full resize-none rounded-lg border border-border bg-background p-3 font-sans text-[0.95rem] focus:border-primary focus:outline-none"
              />
              <button
                onClick={() => setSubmitted(headline)}
                disabled={headline.trim().length < 4}
                data-testid="button-translate"
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-[0.9rem] font-medium text-background transition-transform hover:-translate-y-0.5 disabled:opacity-50"
              >
                Translate <ArrowDown size={14} />
              </button>
            </div>

            <div className="mt-5">
              <div className="label-cap mb-3 text-[0.6rem]">Try a sample headline</div>
              <div className="space-y-2">
                {SAMPLES.map((s, i) => (
                  <button
                    key={i}
                    data-testid={`sample-${i}`}
                    onClick={() => {
                      setHeadline(s);
                      setSubmitted(s);
                    }}
                    className="block w-full rounded-lg border border-border bg-background px-4 py-2.5 text-left text-[0.9rem] transition-all hover:border-primary hover:bg-primary/5"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* OUTPUT */}
          <div className="lg:col-span-7">
            <AnimatePresence mode="wait">
              {!submitted ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex h-full min-h-[420px] items-center justify-center rounded-xl border border-dashed border-border bg-card/50 p-10 text-center"
                >
                  <div>
                    <Sparkles className="mx-auto mb-4 text-muted-foreground" size={28} />
                    <p className="prose-serif text-foreground/60">
                      Paste a headline. Get the model, the graph shift, the FRED watch list, and what textbook theory predicts next.
                    </p>
                  </div>
                </motion.div>
              ) : !result ? (
                <motion.div
                  key="nomatch"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div className="rounded-xl border border-primary/40 bg-primary/5 p-6">
                    <div className="label-cap mb-2 text-primary">Routed to Gemini</div>
                    <p className="prose-serif text-[0.95rem] text-foreground/85">
                      No clean rule-based match. Gemini will decode this headline using AP Macro models, real elasticities, a historical analog, and a forecast.
                    </p>
                  </div>
                  {enrichLoading && (
                    <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-8 text-center">
                      <Sparkles size={20} className="mx-auto animate-pulse text-primary" />
                      <p className="prose-serif mt-3 text-muted-foreground">Gemini is calibrating numbers and finding the analog…</p>
                    </div>
                  )}
                  {enrichError && (
                    <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5 text-[0.9rem] text-destructive">{enrichError}</div>
                  )}
                  {enrichment && (
                    <GeminiBlock e={enrichment} />
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key={submitted}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-4"
                >
                  {/* Model header */}
                  <div className="rounded-xl border border-primary/40 bg-primary/5 p-6">
                    <div className="flex items-baseline justify-between">
                      <div className="label-cap text-primary">Model identified</div>
                      <div className="font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground">
                        confidence · {result.confidence}
                      </div>
                    </div>
                    <h2 className="mt-2 text-editorial text-[1.85rem]">{result.modelLabel}</h2>
                    <p className="prose-serif mt-3 text-[1rem] text-foreground/85">
                      <strong>{result.curve}.</strong> Magnitude regime: {result.magnitude}. Reference text: {result.textbookCh}.
                    </p>
                  </div>

                  {/* Graph */}
                  <ModelGraph translation={result} />

                  {/* Predictions */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-xl border border-border bg-card p-5">
                      <div className="label-cap mb-2 text-[0.6rem]">Short run</div>
                      <p className="prose-serif text-[0.92rem] leading-[1.55] text-foreground/85">
                        {result.shortRun}
                      </p>
                    </div>
                    <div className="rounded-xl border border-border bg-card p-5">
                      <div className="label-cap mb-2 text-[0.6rem]">Long run</div>
                      <p className="prose-serif text-[0.92rem] leading-[1.55] text-foreground/85">
                        {result.longRun}
                      </p>
                    </div>
                  </div>

                  {/* FRED watch list */}
                  <div className="rounded-xl border border-border bg-card p-5">
                    <div className="mb-3 flex items-baseline justify-between">
                      <div className="label-cap text-[0.6rem]">FRED watch list</div>
                      <span className="font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground">
                        Series most likely to move first
                      </span>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {result.fredSeries.map((s) => (
                        <a
                          key={s.code}
                          href={`https://fred.stlouisfed.org/series/${s.code}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          data-testid={`fred-link-${s.code}`}
                          className="group flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2.5 hover:border-primary"
                        >
                          <div>
                            <div className="font-mono text-[0.78rem] font-semibold text-foreground">{s.code}</div>
                            <div className="font-sans text-[0.78rem] text-muted-foreground">{s.label}</div>
                          </div>
                          <ExternalLink size={12} className="text-muted-foreground group-hover:text-primary" />
                        </a>
                      ))}
                    </div>
                  </div>

                  {enrichLoading && (
                    <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-6 text-center">
                      <Sparkles size={16} className="mx-auto animate-pulse text-primary" />
                      <p className="prose-serif mt-2 text-sm text-muted-foreground">Gemini is layering on numbers, the historical analog, and a forecast…</p>
                    </div>
                  )}
                  {enrichment && <GeminiBlock e={enrichment} />}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="mt-16 rounded-lg border border-dashed border-primary/30 bg-primary/5 p-6">
          <div className="label-cap mb-2 text-primary">How the translator works</div>
          <p className="prose-serif text-[0.95rem] text-foreground/85">
            Headlines are matched against a hand-built taxonomy of canonical economic models, AS-AD, IS-LM, Phillips, Loanable Funds, Money Market, Solow Growth, Sectoral S/D, and Trade. Each match returns a deterministic graph treatment using AP-CED conventions, plus a short- and long-run prediction grounded in the textbook chapter cited. FRED series are chosen as the variables most likely to move first under the predicted shift. The Translator is the inverse of Shock Simulator: Shock Sim takes a curated shock and shows the response; Translator takes raw news and identifies the shock.
          </p>
        </div>
      </section>
    </PageShell>
  );
}

/* ============================================================================
 * Schematic graph, renders the predicted shift as a clean SVG diagram.
 * ============================================================================ */
function ModelGraph({ translation }: { translation: Translation }) {
  const { model, direction } = translation;
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-3 flex items-baseline justify-between">
        <div className="label-cap text-[0.6rem]">Predicted shift</div>
        <div className="font-mono text-[0.65rem] uppercase tracking-widest text-muted-foreground">
          {translation.curve}
        </div>
      </div>
      <div className="mx-auto" style={{ maxWidth: 560 }}>
        <svg viewBox="0 0 480 320" className="w-full" role="img" aria-label="Predicted shift diagram">
          {/* axes */}
          <line x1="60" y1="40" x2="60" y2="280" stroke="hsl(var(--foreground))" strokeWidth={1.5} />
          <line x1="60" y1="280" x2="440" y2="280" stroke="hsl(var(--foreground))" strokeWidth={1.5} />
          <text x="60" y="30" fontSize="11" fontFamily="ui-monospace, monospace" fill="hsl(var(--muted-foreground))">
            {axisY(model)}
          </text>
          <text x="425" y="298" fontSize="11" fontFamily="ui-monospace, monospace" fill="hsl(var(--muted-foreground))">
            {axisX(model)}
          </text>

          {renderModel(model, direction)}
        </svg>
      </div>
    </div>
  );
}

function axisY(m: ModelKey) {
  return m === "as_ad" || m === "phillips" || m === "sd" || m === "trade"
    ? m === "phillips"
      ? "Inflation π"
      : m === "sd" || m === "trade"
      ? "Price"
      : "Price level"
    : m === "loanable_funds" || m === "money_market"
    ? "Real interest r"
    : "Output / worker";
}

function axisX(m: ModelKey) {
  return m === "as_ad"
    ? "Real output Y"
    : m === "phillips"
    ? "Unemployment u"
    : m === "loanable_funds"
    ? "Loanable funds"
    : m === "money_market"
    ? "Money M"
    : m === "solow"
    ? "Capital / worker"
    : "Quantity Q";
}

function renderModel(m: ModelKey, dir: Direction) {
  // Coordinate system: x in [60,440], y in [40,280]
  if (m === "as_ad") {
    const dx = dir === "right" ? 40 : dir === "left" ? -40 : 0;
    return (
      <>
        {/* SRAS */}
        <line x1="100" y1="240" x2="380" y2="80" stroke="hsl(var(--foreground))" strokeWidth={2} />
        <text x="385" y="82" fontSize="11" fill="hsl(var(--foreground))">SRAS</text>
        {/* AD original */}
        <line x1="100" y1="80" x2="380" y2="240" stroke="hsl(var(--muted-foreground))" strokeWidth={1.5} strokeDasharray="4 4" />
        <text x="385" y="240" fontSize="11" fill="hsl(var(--muted-foreground))">AD₁</text>
        {/* AD shifted */}
        <line x1={100 + dx} y1="80" x2={380 + dx} y2="240" stroke="hsl(var(--primary))" strokeWidth={2.5} />
        <text x={385 + dx} y="80" fontSize="11" fill="hsl(var(--primary))">AD₂</text>
        {/* LRAS */}
        <line x1="245" y1="40" x2="245" y2="280" stroke="hsl(var(--accent))" strokeWidth={1.5} strokeDasharray="2 4" />
        <text x="250" y="50" fontSize="10" fill="hsl(var(--accent))">LRAS</text>
        {/* shift arrow */}
        <Arrow from={[180, 160]} to={[180 + dx, 160]} />
      </>
    );
  }
  if (m === "phillips") {
    return (
      <>
        <path d="M 90 80 Q 200 90 250 180 Q 320 260 410 270" stroke="hsl(var(--foreground))" strokeWidth={2} fill="none" />
        <text x="395" y="260" fontSize="11" fill="hsl(var(--foreground))">SRPC</text>
        <circle cx="180" cy="120" r="4" fill="hsl(var(--primary))" />
        <text x="186" y="118" fontSize="10" fill="hsl(var(--primary))">A</text>
        <circle cx="280" cy="200" r="4" fill="hsl(var(--accent))" />
        <text x="286" y="200" fontSize="10" fill="hsl(var(--accent))">B</text>
        <Arrow from={[180, 120]} to={[280, 200]} />
      </>
    );
  }
  if (m === "loanable_funds" || m === "money_market") {
    const dx = dir === "right" ? 40 : dir === "left" ? -40 : 0;
    return (
      <>
        <line x1="100" y1="240" x2="380" y2="80" stroke="hsl(var(--foreground))" strokeWidth={2} />
        <text x="385" y="82" fontSize="11" fill="hsl(var(--foreground))">{m === "loanable_funds" ? "S" : "Mₛ"}</text>
        <line x1="100" y1="80" x2="380" y2="240" stroke="hsl(var(--muted-foreground))" strokeWidth={1.5} strokeDasharray="4 4" />
        <text x="385" y="240" fontSize="11" fill="hsl(var(--muted-foreground))">{m === "loanable_funds" ? "D₁" : "Mᴅ₁"}</text>
        <line x1={100 + dx} y1="80" x2={380 + dx} y2="240" stroke="hsl(var(--primary))" strokeWidth={2.5} />
        <text x={385 + dx} y="80" fontSize="11" fill="hsl(var(--primary))">{m === "loanable_funds" ? "D₂" : "Mᴅ₂"}</text>
        <Arrow from={[180, 160]} to={[180 + dx, 160]} />
      </>
    );
  }
  if (m === "solow") {
    return (
      <>
        <path d="M 60 280 Q 220 100 440 90" stroke="hsl(var(--muted-foreground))" strokeWidth={1.5} strokeDasharray="4 4" fill="none" />
        <text x="380" y="100" fontSize="10" fill="hsl(var(--muted-foreground))">y₁ = A₁ f(k)</text>
        <path d="M 60 280 Q 220 70 440 60" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="none" />
        <text x="380" y="70" fontSize="10" fill="hsl(var(--primary))">y₂ = A₂ f(k)</text>
        <Arrow from={[300, 110]} to={[300, 80]} />
      </>
    );
  }
  if (m === "sd" || m === "trade") {
    const dx = dir === "left" ? -40 : 40;
    return (
      <>
        <line x1="100" y1="240" x2="380" y2="80" stroke="hsl(var(--foreground))" strokeWidth={2} />
        <text x="385" y="82" fontSize="11" fill="hsl(var(--foreground))">S</text>
        <line x1="100" y1="80" x2="380" y2="240" stroke="hsl(var(--muted-foreground))" strokeWidth={1.5} strokeDasharray="4 4" />
        <text x="385" y="240" fontSize="11" fill="hsl(var(--muted-foreground))">D₁</text>
        <line x1={100 + dx} y1="80" x2={380 + dx} y2="240" stroke="hsl(var(--primary))" strokeWidth={2.5} />
        <text x={385 + dx} y="80" fontSize="11" fill="hsl(var(--primary))">D₂</text>
        {m === "trade" && (
          <>
            <line x1="60" y1="180" x2="440" y2="180" stroke="hsl(var(--accent))" strokeWidth={1.5} strokeDasharray="2 4" />
            <text x="50" y="178" fontSize="10" fill="hsl(var(--accent))" textAnchor="end">Pw</text>
            <line x1="60" y1="140" x2="440" y2="140" stroke="hsl(var(--primary))" strokeWidth={1.5} strokeDasharray="2 4" />
            <text x="50" y="138" fontSize="10" fill="hsl(var(--primary))" textAnchor="end">Pw+t</text>
          </>
        )}
        <Arrow from={[180, 160]} to={[180 + dx, 160]} />
      </>
    );
  }
  return null;
}

function GeminiBlock({ e }: { e: GeminiNewsEnrichment }) {
  const m = e.magnitudeNumbers;
  return (
    <div className="space-y-4">
      {m && (
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center gap-2">
            <TrendingUp size={14} className="text-primary" />
            <div className="label-cap">Quantitative magnitude · Gemini</div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            <NumStat label="ΔGDP" value={`${m.gdpEffectPct >= 0 ? "+" : ""}${m.gdpEffectPct?.toFixed(2)}%`} />
            <NumStat label="Δπ" value={`${m.inflationEffectPp >= 0 ? "+" : ""}${m.inflationEffectPp?.toFixed(2)}pp`} />
            <NumStat label="Δu" value={`${m.unemploymentEffectPp >= 0 ? "+" : ""}${m.unemploymentEffectPp?.toFixed(2)}pp`} />
            <NumStat label="Δr" value={`${m.policyRateEffectBps >= 0 ? "+" : ""}${m.policyRateEffectBps}bp`} />
            <NumStat label="Horizon" value={`${m.horizonMonths}mo`} />
          </div>
        </div>
      )}
      {e.historicalAnalog && (
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center gap-2">
            <History size={14} className="text-primary" />
            <div className="label-cap">Historical analog</div>
          </div>
          <div className="font-display text-[1.05rem] font-medium">{e.historicalAnalog.event}</div>
          <div className="font-mono text-[0.7rem] uppercase tracking-widest text-muted-foreground mt-0.5">{e.historicalAnalog.date}</div>
          <p className="prose-serif text-[0.92rem] text-foreground/85 mt-2">{e.historicalAnalog.outcome}</p>
          <div className="mt-2 inline-block rounded-md bg-muted/40 px-2 py-1 font-mono text-[0.78rem]">{e.historicalAnalog.magnitude}</div>
        </div>
      )}
      {e.forecast && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-5">
          <div className="mb-3 flex items-center gap-2">
            <Telescope size={14} className="text-primary" />
            <div className="label-cap text-primary">Forecast · confidence {e.forecast.confidence}</div>
          </div>
          <p className="prose-serif text-[0.95rem] text-foreground/90"><strong>Watch:</strong> {e.forecast.watch}</p>
          <p className="prose-serif text-[0.95rem] text-foreground/90 mt-2"><strong>Range:</strong> {e.forecast.range}</p>
          <p className="prose-serif text-[0.9rem] text-foreground/75 mt-2">{e.forecast.reasoning}</p>
        </div>
      )}
    </div>
  );
}

function NumStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-background px-2 py-2 text-center">
      <div className="font-mono text-[0.6rem] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-0.5 font-mono text-sm font-semibold">{value}</div>
    </div>
  );
}

function Arrow({ from, to }: { from: [number, number]; to: [number, number] }) {
  const [x1, y1] = from;
  const [x2, y2] = to;
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="hsl(var(--primary))" strokeWidth={2} />
      <polygon
        points={`${x2},${y2} ${x2 - (x2 > x1 ? 8 : -8)},${y2 - 4} ${x2 - (x2 > x1 ? 8 : -8)},${y2 + 4}`}
        fill="hsl(var(--primary))"
      />
    </g>
  );
}
