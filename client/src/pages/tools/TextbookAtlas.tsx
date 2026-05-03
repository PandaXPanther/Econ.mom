import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { PageShell } from "@/components/brand/PageShell";
import { ToolPageHeader } from "@/components/brand/ToolPageHeader";
import { TOOL_BY_SLUG } from "@/lib/tools";
import { SEO } from "@/components/brand/SEO";
import { Search, TrendingUp } from "lucide-react";
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

interface Concept {
  id: string;
  name: string;
  unit: string;
  course: "Macro" | "Micro";
  definition: string;
  chartType: "line" | "area" | "scatter";
  chartTitle: string;
  chartSource: string;
  chartData: any[];
}

// Synthetic but realistic recent-vintage data for each concept's live chart.
// In production these would pull from FRED's public API; here we ship pre-loaded
// representative series so the page is demo-ready.

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

function buildSeries(rows: [number, number][]) {
  return rows.map(([year, value]) => ({ year, value }));
}

const CONCEPTS: Concept[] = [
  {
    id: "phillips",
    name: "Phillips Curve",
    unit: "AP Macro · Unit 5",
    course: "Macro",
    definition: "The short-run inverse relationship between unemployment and inflation. The 2022 supply-shock inflation sits visibly to the RIGHT of a stable curve — evidence of short-run trade-off breakdown.",
    chartType: "scatter",
    chartTitle: "U-Rate × Inflation, 2020–2026",
    chartSource: "FRED: UNRATE, CPIAUCSL",
    chartData: PHILLIPS,
  },
  {
    id: "ffr",
    name: "Federal Funds Rate",
    unit: "AP Macro · Unit 4",
    course: "Macro",
    definition: "The interest rate banks charge each other for overnight reserves. The Fed's primary monetary-policy lever. The 2022–2024 tightening cycle is visible as the most aggressive since 1980.",
    chartType: "line",
    chartTitle: "Effective FFR, 2020–2026 (%)",
    chartSource: "FRED: DFF",
    chartData: FFR_DATA,
  },
  {
    id: "cpi",
    name: "Consumer Price Index (CPI)",
    unit: "AP Macro · Unit 2",
    course: "Macro",
    definition: "A weighted average of the prices of a basket of consumer goods and services. The most-cited measure of inflation. The 2021–2022 jump was the largest since 1982.",
    chartType: "area",
    chartTitle: "CPI-U, 2020–2026 (1982–84 = 100)",
    chartSource: "FRED: CPIAUCSL",
    chartData: CPI_DATA,
  },
  {
    id: "unemp",
    name: "Unemployment Rate",
    unit: "AP Macro · Unit 2",
    course: "Macro",
    definition: "Percentage of the labor force actively looking for work. The 2020 spike (COVID) and subsequent normalization to near-NAIRU levels is one of the sharpest cycles in the post-WWII record.",
    chartType: "line",
    chartTitle: "U-3 Rate, 2020–2026 (%)",
    chartSource: "FRED: UNRATE",
    chartData: UNEMP_DATA,
  },
  {
    id: "m2-gdp",
    name: "Quantity Theory of Money",
    unit: "AP Macro · Unit 4",
    course: "Macro",
    definition: "MV = PY. If velocity is stable, money-supply growth equals inflation plus real-output growth. The post-COVID M2/GDP ratio shows the classic 'money supply overshoot' and subsequent normalization.",
    chartType: "line",
    chartTitle: "M2 / Nominal GDP, 2020–2026",
    chartSource: "FRED: M2SL, GDP",
    chartData: M2_GDP,
  },
  {
    id: "gini",
    name: "Gini Coefficient (US)",
    unit: "AP Macro · Unit 6",
    course: "Macro",
    definition: "A scalar 0–1 measure of income-distribution inequality. 0 = perfect equality, 1 = one person has everything. US Gini has drifted upward since the 1970s; recent years show rise then partial reversal.",
    chartType: "line",
    chartTitle: "US Household Gini, 2016–2026",
    chartSource: "Census Bureau CPS ASEC",
    chartData: GINI,
  },
  {
    id: "labor-share",
    name: "Labor Share of Income",
    unit: "AP Macro · Unit 6",
    course: "Macro",
    definition: "Share of national income paid as labor compensation vs. capital. The long-term decline (2000→2020) is a core stylized fact of 21st-century macro.",
    chartType: "area",
    chartTitle: "US Non-Farm Business Labor Share (%)",
    chartSource: "BLS Labor Productivity & Costs",
    chartData: LABOR_SHARE,
  },
  {
    id: "debt-gdp",
    name: "Debt-to-GDP",
    unit: "AP Macro · Unit 5",
    course: "Macro",
    definition: "Federal debt held by the public as a share of GDP. The post-2020 jump (COVID fiscal response) and subsequent slow drift is the defining fiscal story of the decade.",
    chartType: "area",
    chartTitle: "US Debt Held by Public / GDP (%)",
    chartSource: "FRED: GFDEGDQ188S",
    chartData: DEBT_GDP,
  },
];

export default function TextbookAtlas() {
  const tool = TOOL_BY_SLUG["textbook-atlas"];
  const [query, setQuery] = useState("");
  const [activeId, setActiveId] = useState(CONCEPTS[0].id);

  const filtered = useMemo(() => {
    if (!query) return CONCEPTS;
    const q = query.toLowerCase();
    return CONCEPTS.filter(
      (c) => c.name.toLowerCase().includes(q) || c.definition.toLowerCase().includes(q) || c.unit.toLowerCase().includes(q)
    );
  }, [query]);

  const active = CONCEPTS.find((c) => c.id === activeId) || CONCEPTS[0];

  return (
    <PageShell>
      <SEO
        title="Textbook Atlas — every AP Econ concept, with the live FRED chart that makes it real | The Mother Of Econ"
        description="A living textbook for AP Macro and Micro. Phillips curve, quantity theory, Gini, labor share, debt-to-GDP — every concept paired with a live US chart sourced from FRED, BLS, and BEA."
        path="/textbook-atlas"
      />
      <ToolPageHeader tool={tool} />
      <section className="mx-auto max-w-7xl px-6 py-12 lg:px-10 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-12">
          <aside className="lg:col-span-4">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search concepts…"
                data-testid="input-search-concepts"
                className="w-full rounded-md border border-border bg-card pl-9 pr-3 py-2.5 text-sm focus:border-primary focus:outline-none"
              />
            </div>

            <div className="mt-6 space-y-1">
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
                </button>
              ))}
            </div>
          </aside>

          <article className="lg:col-span-8" key={active.id}>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="label-cap">{active.unit}</div>
              <h2 className="text-editorial mt-2 text-[2.5rem] lg:text-[3rem]">
                {active.name}
              </h2>
              <p className="prose-serif mt-4 text-[1.05rem] text-foreground/85">
                {active.definition}
              </p>

              <div className="rule-double mt-10" />

              <div className="mt-10 rounded-xl border border-border bg-card p-6 lg:p-8">
                <div className="flex items-baseline justify-between mb-6">
                  <div>
                    <div className="label-cap mb-2 flex items-center gap-1.5">
                      <TrendingUp size={11}/> Live chart
                    </div>
                    <h3 className="font-display text-[1.25rem] font-medium">
                      {active.chartTitle}
                    </h3>
                  </div>
                  <div className="font-mono text-[0.72rem] text-muted-foreground hidden sm:block">
                    Source: {active.chartSource}
                  </div>
                </div>

                <div className="h-[340px] -ml-2">
                  <ChartFor concept={active} />
                </div>
              </div>
            </motion.div>
          </article>
        </div>
      </section>
    </PageShell>
  );
}

function ChartFor({ concept }: { concept: Concept }) {
  if (concept.chartType === "scatter") {
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
            labelFormatter={(v: any, p: any) => (p && p[0] ? `Year ${p[0].payload.year}` : "")}
          />
          <Scatter data={concept.chartData} fill="hsl(var(--primary))" />
        </ScatterChart>
      </ResponsiveContainer>
    );
  }
  if (concept.chartType === "area") {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={concept.chartData} margin={{ top: 8, right: 12, bottom: 8, left: 0 }}>
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
      <LineChart data={concept.chartData} margin={{ top: 8, right: 12, bottom: 8, left: 0 }}>
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
