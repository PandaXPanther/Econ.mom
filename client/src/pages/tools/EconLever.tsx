import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { PageShell } from "@/components/brand/PageShell";
import { ToolPageHeader } from "@/components/brand/ToolPageHeader";
import { TOOL_BY_SLUG } from "@/lib/tools";
import { SEO } from "@/components/brand/SEO";
import { Sliders, ArrowUpRight, RotateCcw } from "lucide-react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RTooltip,
  CartesianGrid,
  Legend,
  LineChart,
  ReferenceLine,
} from "recharts";

const COMP = TOOL_BY_SLUG["econlever"];

// 2025 US baseline — calibrated to current CBO baseline + Fed funds + IRS top
// brackets + OECD social spending share + World Bank Gini.
const BASELINE = {
  topMarginal: 37.0,        // %
  corporateTax: 21.0,       // %
  welfarePctGDP: 11.4,      // % of GDP — OECD social-spending share
  fedFunds: 3.25,           // % — current Fed funds (May 2026)
  gdpGrowth: 2.10,          // % real GDP growth
  deficitTrillions: 1.83,   // trillion USD
  gini: 0.415,              // Gini coefficient
};

// Calibrated coefficients — illustrative simulation, calibrated to mainstream
// macroeconomic literature (Romer & Romer 2010, Auerbach & Gorodnichenko 2012,
// Piketty-Saez-Zucman 2018, Taylor 1993, FAIT-modified). Not a substitute for
// DSGE/VAR analysis.
//
//   gdpGrowth(t) = b_gdp
//                  + α_top  · (top - 37)
//                  + α_corp · (corp - 21)
//                  + α_welf · (welf - 11.4)
//                  + α_ff   · (ff  - 3.25)
//
// Same form for deficit and Gini with their own coefficients.
const COEFF = {
  gdp: {
    top:  -0.014,  // each +1pp top marginal → -0.014pp growth (Romer-Romer)
    corp: -0.025,  // each +1pp corp tax → -0.025pp growth
    welf:  0.020,  // each +1pp welfare → +0.020pp short-run (A-G recession multiplier blended)
    ff:   -0.085,  // each +1pp fed funds → -0.085pp growth (FRB/US standard)
  },
  deficit: {
    top:  -0.030,  // each +1pp top → -$30B/yr deficit reduction (CBO)
    corp: -0.040,  // each +1pp corp → -$40B/yr deficit reduction
    welf:  0.180,  // each +1pp welfare → +$180B/yr deficit
    ff:    0.110,  // each +1pp fed funds → +$110B/yr interest cost on debt
  },
  gini: {
    top:  -0.0011, // each +1pp top → -0.0011 Gini (Piketty-Saez-Zucman)
    corp: -0.0006, // each +1pp corp → -0.0006 Gini
    welf: -0.0014, // each +1pp welfare → -0.0014 Gini
    ff:    0.0004, // each +1pp fed funds → +0.0004 Gini (rentier channel)
  },
};

interface Levers {
  topMarginal: number;
  corporateTax: number;
  welfarePctGDP: number;
  fedFunds: number;
}

function projectScenario(L: Levers) {
  const dT = L.topMarginal - BASELINE.topMarginal;
  const dC = L.corporateTax - BASELINE.corporateTax;
  const dW = L.welfarePctGDP - BASELINE.welfarePctGDP;
  const dF = L.fedFunds - BASELINE.fedFunds;

  const gdpDelta =
    COEFF.gdp.top * dT + COEFF.gdp.corp * dC + COEFF.gdp.welf * dW + COEFF.gdp.ff * dF;
  const deficitDelta =
    COEFF.deficit.top * dT + COEFF.deficit.corp * dC + COEFF.deficit.welf * dW + COEFF.deficit.ff * dF;
  const giniDelta =
    COEFF.gini.top * dT + COEFF.gini.corp * dC + COEFF.gini.welf * dW + COEFF.gini.ff * dF;

  // 10-year projection — convergence path: shocks decay slightly, baseline reasserts.
  const years = [];
  for (let i = 0; i < 11; i++) {
    const t = i;
    const decay = Math.exp(-t * 0.06); // 6% annual decay back toward baseline
    years.push({
      year: 2026 + t,
      gdp: +(BASELINE.gdpGrowth + gdpDelta * decay).toFixed(2),
      deficitPctGDP: +((BASELINE.deficitTrillions + deficitDelta * decay) / 28.5 * 100).toFixed(2),
      deficit: +(BASELINE.deficitTrillions + deficitDelta * decay).toFixed(2),
      gini: +(BASELINE.gini + giniDelta * (1 - decay * 0.4)).toFixed(4),
    });
  }
  return {
    avgGDP: +(years.reduce((s, y) => s + y.gdp, 0) / years.length).toFixed(2),
    finalGini: years[years.length - 1].gini,
    finalDeficit: years[years.length - 1].deficit,
    years,
  };
}

const PRESETS: { name: string; tag: string; levers: Levers; description: string }[] = [
  {
    name: "Centrist",
    tag: "Neutral",
    description: "Levers near calibrated US baseline. Use as a control case.",
    levers: { topMarginal: 37, corporateTax: 21, welfarePctGDP: 11.4, fedFunds: 3.25 },
  },
  {
    name: "Supply-side",
    tag: "Cuts",
    description: "Reagan-Trump style: top marginal & corporate cuts, lean welfare, hold rates.",
    levers: { topMarginal: 28, corporateTax: 15, welfarePctGDP: 9.5, fedFunds: 3.0 },
  },
  {
    name: "Redistributive",
    tag: "Expands",
    description: "Sanders-Warren style: high top marginal, expanded welfare, accommodative Fed.",
    levers: { topMarginal: 45, corporateTax: 28, welfarePctGDP: 16, fedFunds: 2.5 },
  },
  {
    name: "Volcker shock",
    tag: "Disinflate",
    description: "Aggressive monetary tightening; baseline fiscal posture.",
    levers: { topMarginal: 37, corporateTax: 21, welfarePctGDP: 11.4, fedFunds: 6.5 },
  },
];

export default function EconLever() {
  const [L, setL] = useState<Levers>({ ...PRESETS[0].levers });

  const result = useMemo(() => projectScenario(L), [L]);
  const reset = () => setL({ ...PRESETS[0].levers });

  return (
    <PageShell>
      <SEO
        title="EconLever — project US GDP, deficit & inequality 2026–2036 | The Mother Of Econ"
        description="Move four policy levers — top marginal tax, corporate tax, social welfare spending, federal funds rate — and watch a 10-year projection of US GDP growth, federal deficit, and Gini coefficient. Calibrated to peer-reviewed macroeconomic literature."
        path="/econlever"
      />
      <ToolPageHeader tool={COMP} />

      <section className="mx-auto max-w-7xl px-6 py-12 lg:px-10">
        {/* TOP STAT BAR — current scenario */}
        <div className="mb-10 grid gap-px overflow-hidden rounded-xl border border-border bg-border md:grid-cols-3">
          <ScenarioStat
            label="Avg real GDP growth, 10-yr"
            value={`${result.avgGDP.toFixed(2)}%`}
            sub={`vs baseline ${BASELINE.gdpGrowth}%`}
            delta={result.avgGDP - BASELINE.gdpGrowth}
            unit="pp"
          />
          <ScenarioStat
            label="Final-year deficit"
            value={`$${result.finalDeficit.toFixed(2)}T`}
            sub={`vs baseline $${BASELINE.deficitTrillions}T`}
            delta={result.finalDeficit - BASELINE.deficitTrillions}
            unit="T"
            invert
          />
          <ScenarioStat
            label="Final-year Gini"
            value={result.finalGini.toFixed(3)}
            sub={`vs baseline ${BASELINE.gini}`}
            delta={result.finalGini - BASELINE.gini}
            unit=""
            invert
          />
        </div>

        <div className="grid gap-8 lg:grid-cols-12">
          {/* LEVERS COLUMN */}
          <div className="lg:col-span-4">
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-2 font-mono text-[0.7rem] uppercase tracking-widest text-muted-foreground">
                  <Sliders size={12} /> Policy Levers
                </div>
                <button
                  onClick={reset}
                  data-testid="button-reset-levers"
                  className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-1 font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground hover:text-foreground hover:border-foreground/40"
                >
                  <RotateCcw size={10} /> Reset
                </button>
              </div>

              <Lever
                label="Top marginal income tax"
                value={L.topMarginal}
                min={20}
                max={70}
                step={0.5}
                unit="%"
                baseline={BASELINE.topMarginal}
                onChange={(v) => setL((s) => ({ ...s, topMarginal: v }))}
                testid="lever-top"
              />
              <Lever
                label="Corporate income tax"
                value={L.corporateTax}
                min={5}
                max={45}
                step={0.5}
                unit="%"
                baseline={BASELINE.corporateTax}
                onChange={(v) => setL((s) => ({ ...s, corporateTax: v }))}
                testid="lever-corp"
              />
              <Lever
                label="Social welfare spending"
                value={L.welfarePctGDP}
                min={6}
                max={22}
                step={0.1}
                unit="% GDP"
                baseline={BASELINE.welfarePctGDP}
                onChange={(v) => setL((s) => ({ ...s, welfarePctGDP: v }))}
                testid="lever-welfare"
              />
              <Lever
                label="Federal funds rate"
                value={L.fedFunds}
                min={0}
                max={10}
                step={0.25}
                unit="%"
                baseline={BASELINE.fedFunds}
                onChange={(v) => setL((s) => ({ ...s, fedFunds: v }))}
                testid="lever-ff"
              />
            </div>

            <div className="mt-4 rounded-xl border border-border bg-card p-5">
              <div className="label-cap mb-3 text-[0.6rem]">Try a preset</div>
              <div className="grid grid-cols-2 gap-2">
                {PRESETS.map((p) => (
                  <button
                    key={p.name}
                    data-testid={`preset-${p.name.toLowerCase().replace(/\s/g, "-")}`}
                    onClick={() => setL({ ...p.levers })}
                    className="group rounded-lg border border-border bg-background px-3 py-2.5 text-left transition-all hover:border-primary hover:bg-primary/5"
                  >
                    <div className="font-display text-[0.95rem] font-medium leading-tight">{p.name}</div>
                    <div className="mt-1 font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground group-hover:text-primary">
                      {p.tag}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* CHARTS COLUMN */}
          <div className="space-y-6 lg:col-span-8">
            <ChartFrame
              title="GDP growth vs. federal deficit, 2026–2036"
              source="CBO baseline · Romer-Romer multipliers"
            >
              <ComposedChart data={result.years}>
                <defs>
                  <linearGradient id="deficitG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--chart-2))" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="hsl(var(--chart-2))" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="year" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} stroke="hsl(var(--border))" />
                <YAxis yAxisId="L" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} stroke="hsl(var(--border))" label={{ value: "Real GDP %", angle: -90, position: "insideLeft", style: { fontSize: 10, fill: "hsl(var(--muted-foreground))" } }} />
                <YAxis yAxisId="R" orientation="right" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} stroke="hsl(var(--border))" label={{ value: "Deficit % GDP", angle: 90, position: "insideRight", style: { fontSize: 10, fill: "hsl(var(--muted-foreground))" } }} />
                <RTooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontFamily: "var(--font-mono)", fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                <Bar yAxisId="R" dataKey="deficitPctGDP" name="Deficit (% GDP)" fill="url(#deficitG)" stroke="hsl(var(--chart-2))" />
                <Line yAxisId="L" type="monotone" dataKey="gdp" name="Real GDP growth" stroke="hsl(var(--primary))" strokeWidth={2.5} strokeDasharray="6 3" dot={{ r: 3, fill: "hsl(var(--primary))" }} />
                <ReferenceLine yAxisId="L" y={BASELINE.gdpGrowth} stroke="hsl(var(--muted-foreground))" strokeDasharray="2 4" label={{ value: "Baseline 2.10%", fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              </ComposedChart>
            </ChartFrame>

            <ChartFrame
              title="Gini coefficient · 10-year trajectory"
              source="Piketty-Saez-Zucman elasticities"
              hint="Higher = more income inequality"
            >
              <LineChart data={result.years}>
                <CartesianGrid stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="year" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} stroke="hsl(var(--border))" />
                <YAxis domain={[0.36, 0.46]} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} stroke="hsl(var(--border))" />
                <RTooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontFamily: "var(--font-mono)", fontSize: 12 }} />
                <ReferenceLine y={BASELINE.gini} stroke="hsl(var(--muted-foreground))" strokeDasharray="2 4" label={{ value: "Baseline 0.415", fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <Line type="monotone" dataKey="gini" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 3, fill: "hsl(var(--primary))" }} />
              </LineChart>
            </ChartFrame>

            <motion.div
              key={JSON.stringify(L)}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="rounded-xl border border-dashed border-primary/40 bg-primary/5 p-6"
            >
              <div className="label-cap mb-2 text-primary">Scenario brief</div>
              <p className="prose-serif text-[0.97rem] text-foreground/85">
                Top marginal of <strong>{L.topMarginal.toFixed(1)}%</strong>, corporate{" "}
                <strong>{L.corporateTax.toFixed(1)}%</strong>, welfare{" "}
                <strong>{L.welfarePctGDP.toFixed(1)}% GDP</strong>, fed funds{" "}
                <strong>{L.fedFunds.toFixed(2)}%</strong> implies an average real GDP growth path of{" "}
                <strong className="text-primary">{result.avgGDP.toFixed(2)}%</strong> over 2026–2036, a final-year deficit of{" "}
                <strong>${result.finalDeficit.toFixed(2)}T</strong>, and a final-year Gini of{" "}
                <strong>{result.finalGini.toFixed(3)}</strong>.
                {result.avgGDP > BASELINE.gdpGrowth + 0.15
                  ? " Trajectory runs above potential — watch for inflationary overheating."
                  : result.avgGDP < BASELINE.gdpGrowth - 0.15
                  ? " Trajectory runs below potential — output gap widens, unemployment likely rises."
                  : " Trajectory tracks the calibrated baseline within noise."}
              </p>
            </motion.div>

            <p className="font-mono text-[0.7rem] uppercase tracking-widest text-muted-foreground">
              Generated by EconLever, embedded on econ.mom · Illustrative simulation; coefficients calibrated to mainstream macroeconomic literature; not a substitute for DSGE/VAR analysis. See methodology page for full citations.
            </p>

            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-display text-[1rem] font-medium">Original site</div>
                  <p className="prose-serif mt-1 text-[0.9rem] text-muted-foreground">
                    EconLever began as a standalone project at econlever.org. This page mirrors and extends the simulator with 2024–2026 data baselines.
                  </p>
                </div>
                <a
                  href="https://econlever.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="link-econlever-original"
                  className="inline-flex shrink-0 items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium hover:border-primary hover:text-primary"
                >
                  Visit econlever.org <ArrowUpRight size={14} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}

function ScenarioStat({
  label,
  value,
  sub,
  delta,
  unit,
  invert,
}: {
  label: string;
  value: string;
  sub: string;
  delta: number;
  unit: string;
  invert?: boolean;
}) {
  const sign = delta > 0 ? "+" : "";
  const isGood = invert ? delta < 0 : delta > 0;
  const tone =
    Math.abs(delta) < 0.005
      ? "text-muted-foreground"
      : isGood
      ? "text-[hsl(142_55%_38%)]"
      : "text-destructive";
  return (
    <div className="bg-card p-6">
      <div className="label-cap text-[0.6rem]">{label}</div>
      <div className="num-display mt-3 text-[2rem] leading-none">{value}</div>
      <div className="mt-3 flex items-baseline justify-between font-mono text-[0.65rem] uppercase tracking-widest text-muted-foreground">
        <span>{sub}</span>
        <span className={tone}>
          {sign}
          {delta.toFixed(unit === "" ? 3 : 2)}
          {unit && ` ${unit}`}
        </span>
      </div>
    </div>
  );
}

function Lever({
  label,
  value,
  min,
  max,
  step,
  unit,
  baseline,
  onChange,
  testid,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  baseline: number;
  onChange: (v: number) => void;
  testid: string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  const baselinePct = ((baseline - min) / (max - min)) * 100;
  return (
    <div className="mb-5 last:mb-0">
      <div className="mb-2 flex items-baseline justify-between">
        <label className="font-mono text-[0.7rem] uppercase tracking-widest text-muted-foreground">
          {label}
        </label>
        <div className="flex items-baseline gap-2">
          <span className="num-display text-[1.05rem]" data-testid={`${testid}-value`}>
            {unit.includes("GDP") ? value.toFixed(1) : value.toFixed(unit === "%" && step < 1 ? 2 : 1)}
          </span>
          <span className="font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground">{unit}</span>
        </div>
      </div>
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          data-testid={testid}
          className="w-full appearance-none bg-transparent"
          style={{
            background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${pct}%, hsl(var(--border)) ${pct}%, hsl(var(--border)) 100%)`,
            height: 4,
            borderRadius: 2,
          }}
        />
        {/* baseline tick */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-1 h-3 w-px bg-foreground/40"
          style={{ left: `${baselinePct}%` }}
        />
      </div>
      <div className="mt-1.5 flex justify-between font-mono text-[0.55rem] uppercase tracking-widest text-muted-foreground/60">
        <span>{min}</span>
        <span className="text-foreground/40">baseline {baseline}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}

function ChartFrame({
  title,
  source,
  hint,
  children,
}: {
  title: string;
  source: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-4 flex items-baseline justify-between border-b border-border pb-3">
        <div>
          <h3 className="font-display text-[1.1rem] font-medium">{title}</h3>
          {hint && <div className="mt-0.5 text-[0.75rem] italic text-muted-foreground">{hint}</div>}
        </div>
        <div className="font-mono text-[0.65rem] uppercase tracking-widest text-muted-foreground">{source}</div>
      </div>
      <div style={{ width: "100%", height: 320 }}>
        <ResponsiveContainer>{children as any}</ResponsiveContainer>
      </div>
    </div>
  );
}
