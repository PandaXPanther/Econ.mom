import { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { PageShell } from "@/components/brand/PageShell";
import { ToolPageHeader } from "@/components/brand/ToolPageHeader";
import { TOOL_BY_SLUG } from "@/lib/tools";
import { SEO } from "@/components/brand/SEO";
import { Sliders, ArrowUpRight, RotateCcw, Download, Sparkles, Loader2 } from "lucide-react";
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

// 1:1 engine + brief from upstream econlever.org repo
import {
  simulate,
  PRESETS as ENGINE_PRESETS,
  BASELINE as ENGINE_BASELINE,
  type PolicyLevers,
} from "@/lib/econlever/engine";
import { PolicyBriefDocument } from "@/components/econlever/PolicyBriefDocument";
import { exportPolicyBriefAsPdf } from "@/lib/econlever/exportPdf";

const COMP = TOOL_BY_SLUG["econlever"];

// Display baseline (the upstream engine uses calibrated reference values; the
// page top-bar still cites the published 2025 anchor figures users see in news).
const DISPLAY_BASELINE = {
  topMarginal: ENGINE_BASELINE.neutral.topMarginalTax,    // 37
  corporateTax: ENGINE_BASELINE.neutral.corporateTax,     // 21
  welfarePctGDP: ENGINE_BASELINE.neutral.welfareSpending, // 14
  fedFunds: ENGINE_BASELINE.neutral.fedFundsRate,         // 4.5
  gdpGrowth: ENGINE_BASELINE.potentialGdpGrowth,          // 2.0
  deficitPctGDP: ENGINE_BASELINE.deficit,                 // 6.0
  gini: ENGINE_BASELINE.gini,                             // 0.415
};

export default function EconLever() {
  const [L, setL] = useState<PolicyLevers>({ ...ENGINE_PRESETS[0].levers });
  const [exporting, setExporting] = useState(false);
  const briefRef = useRef<HTMLDivElement>(null);

  const result = useMemo(() => simulate(L), [L]);
  const reset = () => setL({ ...ENGINE_PRESETS[0].levers });

  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<{ label: string; regime: string; rationale: string; expectedRegime: string } | null>(null);

  const suggestPreset = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    setAiError(null);
    try {
      const res = await fetch("/api/gemini-preset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: aiPrompt }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setL({
        topMarginalTax: data.topMarginalTax,
        corporateTax: data.corporateTax,
        welfareSpending: data.welfareSpending,
        fedFundsRate: data.fedFundsRate,
      });
      setAiResult({ label: data.label, regime: data.regime, rationale: data.rationale, expectedRegime: data.expectedRegime });
    } catch (e: any) {
      setAiError(e?.message ?? "Failed to suggest preset");
    } finally {
      setAiLoading(false);
    }
  };

  const handleExport = async () => {
    if (!briefRef.current) return;
    setExporting(true);
    try {
      // Allow the off-screen brief to lay out before capture.
      await new Promise((r) => setTimeout(r, 60));
      await exportPolicyBriefAsPdf(briefRef.current, "EconLever-Policy-Brief.pdf");
    } finally {
      setExporting(false);
    }
  };

  // Top-bar derived metrics
  const finalYear = result.series[result.series.length - 1];
  const avgGdp = result.avgGdpGrowth;
  const finalDeficitPctGDP = finalYear.deficit;

  return (
    <PageShell>
      <SEO
        title="EconLever — project US GDP, deficit & inequality 2026–2036 | The Mother Of Econ"
        description="Move four policy levers — top marginal tax, corporate tax, social welfare spending, federal funds rate — and watch a 10-year projection of US GDP growth, federal deficit, and Gini coefficient. Calibrated to peer-reviewed macroeconomic literature."
        path="/econlever"
      />
      <ToolPageHeader tool={COMP} />

      {/* Off-screen, byte-for-byte upstream Policy Brief */}
      <PolicyBriefDocument ref={briefRef} levers={L} result={result} />

      <section className="mx-auto max-w-7xl px-6 py-12 lg:px-10">
        {/* Export bar */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card/60 px-5 py-4">
          <div>
            <div className="font-mono text-[0.62rem] uppercase tracking-[0.22em] text-primary">
              Regime · {result.regime}
            </div>
            <div className="prose-serif mt-1 text-[0.92rem] text-foreground/80">
              Found a scenario worth defending? Export it as a one-page policy brief.
            </div>
          </div>
          <button
            onClick={handleExport}
            disabled={exporting}
            data-testid="button-export-brief"
            className="group inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Download size={14} />
            {exporting ? "Building PDF…" : "Export Policy Brief (PDF)"}
          </button>
        </div>

        {/* TOP STAT BAR */}
        <div className="mb-10 grid gap-px overflow-hidden rounded-xl border border-border bg-border md:grid-cols-3">
          <ScenarioStat
            label="Avg real GDP growth, 10-yr"
            value={`${avgGdp.toFixed(2)}%`}
            sub={`vs potential ${DISPLAY_BASELINE.gdpGrowth.toFixed(1)}%`}
            delta={avgGdp - DISPLAY_BASELINE.gdpGrowth}
            unit="pp"
          />
          <ScenarioStat
            label="Final-year deficit"
            value={`${finalDeficitPctGDP.toFixed(2)}% GDP`}
            sub={`vs baseline ${DISPLAY_BASELINE.deficitPctGDP.toFixed(1)}%`}
            delta={finalDeficitPctGDP - DISPLAY_BASELINE.deficitPctGDP}
            unit="pp"
            invert
          />
          <ScenarioStat
            label="Final-year Gini"
            value={result.finalGini.toFixed(3)}
            sub={`vs baseline ${DISPLAY_BASELINE.gini}`}
            delta={result.giniDelta}
            unit=""
            invert
          />
        </div>

        <div className="grid gap-8 lg:grid-cols-12">
          {/* LEVERS */}
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
                value={L.topMarginalTax}
                min={20}
                max={70}
                step={0.5}
                unit="%"
                baseline={DISPLAY_BASELINE.topMarginal}
                onChange={(v) => setL((s) => ({ ...s, topMarginalTax: v }))}
                testid="lever-top"
              />
              <Lever
                label="Corporate income tax"
                value={L.corporateTax}
                min={5}
                max={45}
                step={0.5}
                unit="%"
                baseline={DISPLAY_BASELINE.corporateTax}
                onChange={(v) => setL((s) => ({ ...s, corporateTax: v }))}
                testid="lever-corp"
              />
              <Lever
                label="Social welfare spending"
                value={L.welfareSpending}
                min={5}
                max={30}
                step={0.5}
                unit="% GDP"
                baseline={DISPLAY_BASELINE.welfarePctGDP}
                onChange={(v) => setL((s) => ({ ...s, welfareSpending: v }))}
                testid="lever-welfare"
              />
              <Lever
                label="Federal funds rate"
                value={L.fedFundsRate}
                min={0}
                max={10}
                step={0.25}
                unit="%"
                baseline={DISPLAY_BASELINE.fedFunds}
                onChange={(v) => setL((s) => ({ ...s, fedFundsRate: v }))}
                testid="lever-ff"
              />
            </div>

            <div className="mt-4 rounded-xl border border-border bg-card p-5">
              <div className="label-cap mb-3 text-[0.6rem]">Try a preset</div>
              <div className="grid grid-cols-2 gap-2">
                {ENGINE_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    data-testid={`preset-${p.id}`}
                    onClick={() => setL({ ...p.levers })}
                    title={p.description}
                    className="group rounded-lg border border-border bg-background px-3 py-2.5 text-left transition-all hover:border-primary hover:bg-primary/5"
                  >
                    <div className="font-display text-[0.95rem] font-medium leading-tight">{p.label}</div>
                    <div className="mt-1 font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground group-hover:text-primary line-clamp-1">
                      {p.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* GEMINI PRESET SUGGESTER */}
            <div className="mt-4 rounded-xl border border-primary/30 bg-primary/5 p-5">
              <div className="label-cap mb-3 flex items-center gap-2 text-[0.6rem] text-primary">
                <Sparkles size={11} /> Describe a scenario, get a preset
              </div>
              <textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="e.g. Nordic-style social democracy with high taxes and strong safety net"
                data-testid="input-preset-prompt"
                rows={3}
                className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 font-mono text-[0.78rem] text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
              <button
                onClick={suggestPreset}
                disabled={aiLoading || !aiPrompt.trim()}
                data-testid="button-suggest-preset"
                className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 font-mono text-[0.7rem] uppercase tracking-widest text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {aiLoading ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
                {aiLoading ? "Calibrating…" : "Suggest preset"}
              </button>
              {aiError && (
                <div className="mt-2 font-mono text-[0.62rem] text-destructive">{aiError}</div>
              )}
              {aiResult && !aiError && (
                <div className="mt-3 space-y-1.5 border-t border-primary/20 pt-3">
                  <div className="font-display text-[0.95rem] font-semibold leading-tight">{aiResult.label}</div>
                  <div className="font-mono text-[0.6rem] uppercase tracking-widest text-primary">Expected regime · {aiResult.expectedRegime}</div>
                  <div className="prose-serif text-[0.82rem] text-foreground/85">{aiResult.rationale}</div>
                </div>
              )}
            </div>
          </div>

          {/* CHARTS */}
          <div className="space-y-6 lg:col-span-8">
            <ChartFrame
              title="GDP growth vs. federal deficit, 2026–2036"
              source="CBO baseline · Romer-Romer multipliers"
            >
              <ComposedChart data={result.series}>
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
                <Bar yAxisId="R" dataKey="deficit" name="Deficit (% GDP)" fill="url(#deficitG)" stroke="hsl(var(--chart-2))" />
                <Line yAxisId="L" type="monotone" dataKey="gdpGrowth" name="Real GDP growth" stroke="hsl(var(--primary))" strokeWidth={2.5} strokeDasharray="6 3" dot={{ r: 3, fill: "hsl(var(--primary))" }} />
                <ReferenceLine yAxisId="L" y={DISPLAY_BASELINE.gdpGrowth} stroke="hsl(var(--muted-foreground))" strokeDasharray="2 4" label={{ value: `Potential ${DISPLAY_BASELINE.gdpGrowth.toFixed(1)}%`, fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              </ComposedChart>
            </ChartFrame>

            <ChartFrame
              title="Gini coefficient · 10-year trajectory"
              source="Piketty-Saez-Zucman elasticities"
              hint="Higher = more income inequality"
            >
              <LineChart data={result.series}>
                <CartesianGrid stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="year" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} stroke="hsl(var(--border))" />
                <YAxis domain={[0.34, 0.52]} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} stroke="hsl(var(--border))" />
                <RTooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontFamily: "var(--font-mono)", fontSize: 12 }} />
                <ReferenceLine y={DISPLAY_BASELINE.gini} stroke="hsl(var(--muted-foreground))" strokeDasharray="2 4" label={{ value: `Baseline ${DISPLAY_BASELINE.gini}`, fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
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
                Top marginal of <strong>{L.topMarginalTax.toFixed(1)}%</strong>, corporate{" "}
                <strong>{L.corporateTax.toFixed(1)}%</strong>, welfare{" "}
                <strong>{L.welfareSpending.toFixed(1)}% GDP</strong>, fed funds{" "}
                <strong>{L.fedFundsRate.toFixed(2)}%</strong> implies an average real GDP growth path of{" "}
                <strong className="text-primary">{avgGdp.toFixed(2)}%</strong> over 2026–2036, a final-year deficit of{" "}
                <strong>{finalDeficitPctGDP.toFixed(2)}% GDP</strong>, and a final-year Gini of{" "}
                <strong>{result.finalGini.toFixed(3)}</strong>.
                {avgGdp > DISPLAY_BASELINE.gdpGrowth + 0.15
                  ? " Trajectory runs above potential — watch for inflationary overheating."
                  : avgGdp < DISPLAY_BASELINE.gdpGrowth - 0.15
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
                    EconLever began as a standalone project at econlever.org. This page mirrors its engine, presets, and PDF brief 1:1.
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
