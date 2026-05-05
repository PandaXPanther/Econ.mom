import { useEffect, useMemo, useRef, useState } from "react";
import { ToolPageHeader } from "@/components/brand/ToolPageHeader";
import { ToolExplainer } from "@/components/brand/ToolExplainer";
import { TOOL_BY_SLUG } from "@/lib/tools";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { decomposeInflation, DECOMPOSE_PRESETS, type DecomposeInput } from "@/lib/inflation/decompose";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell, ReferenceLine } from "recharts";
import { Download, RefreshCw, Loader2, RotateCcw, Sparkles } from "lucide-react";
import { GeminiProgress } from "@/components/GeminiProgress";
import { BriefDocument } from "@/components/brief/BriefDocument";
import { exportBriefAsPdf } from "@/lib/brief/exportBrief";
import { fetchInflationSnapshot } from "@/lib/fred";

const SLUG = "inflation-decomposer";

function NumInput({
  label, value, onChange, step = 0.1, min, max, suffix, hint,
}: {
  label: string; value: number; onChange: (v: number) => void;
  step?: number; min?: number; max?: number; suffix?: string; hint?: string;
}) {
  return (
    <label className="block">
      <span className="block text-[11px] uppercase tracking-[0.16em] text-muted-foreground mb-1">
        {label}{suffix ? ` (${suffix})` : ""}
      </span>
      <input
        type="number"
        className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        value={value}
        step={step}
        min={min}
        max={max}
        onChange={(e) => onChange(Number(e.target.value))}
        data-testid={`input-${label.toLowerCase().replace(/\s+/g, "-")}`}
      />
      {hint ? <span className="block text-[10px] text-muted-foreground mt-1">{hint}</span> : null}
    </label>
  );
}

export default function InflationDecomposer() {
  const tool = TOOL_BY_SLUG[SLUG];
  const [input, setInput] = useState<DecomposeInput>(DECOMPOSE_PRESETS[0].input);
  const [liveAsOf, setLiveAsOf] = useState<string | null>(null);
  const [loadingLive, setLoadingLive] = useState(false);
  const [liveErr, setLiveErr] = useState<string | null>(null);
  const briefRef = useRef<HTMLDivElement>(null);

  async function loadLive() {
    setLoadingLive(true);
    setLiveErr(null);
    try {
      const snap = await fetchInflationSnapshot();
      setInput((p) => ({
        headlineCpi: snap.headlineCpi ?? p.headlineCpi,
        energyYoY: snap.energyYoY ?? p.energyYoY,
        foodYoY: snap.foodYoY ?? p.foodYoY,
        vacancyToUnemployment: snap.vacancyToUnemployment ?? p.vacancyToUnemployment,
        breakeven5y: snap.breakeven5y ?? p.breakeven5y,
        surveyExpect5y: p.surveyExpect5y, // not on FRED
        fedFundsRate: snap.fedFundsRate ?? p.fedFundsRate,
        outputGap: snap.outputGap ?? p.outputGap,
      }));
      setLiveAsOf(snap.asOf);
    } catch (e: any) {
      setLiveErr(e?.message || "FRED unavailable");
    } finally {
      setLoadingLive(false);
    }
  }

  const result = useMemo(() => decomposeInflation(input), [input]);
  const chartData = result.components.map((c) => ({ name: c.label, value: c.value, color: c.color }));

  // Auto-load live FRED on mount
  useEffect(() => {
    loadLive();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Gemini deep explanation
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiData, setAiData] = useState<{
    narrative: string;
    drivers: { name?: string; label?: string; contribution?: number; explanation: string; outlook?: string }[];
    supplyVsDemand: { supplyPp: number; demandPp: number; explanation: string };
    fedImplication: string;
    historicalContext: string;
    watchNext: string[];
    _degraded?: boolean;
    _reason?: string;
  } | null>(null);

  async function explainWithGemini() {
    setAiLoading(true);
    setAiError(null);
    try {
      const res = await fetch("/api/gemini-inflation-explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          headlineCpi: input.headlineCpi,
          components: result.components.map((c) => ({ label: c.label, value: c.value })),
        }),
      });
      const data = await res.json();
      // Server may return 502 with a `fallback` payload; render it gracefully.
      if (!res.ok) {
        if (data?.fallback) {
          setAiData({ ...data.fallback, _degraded: true, _reason: data.error });
        } else {
          throw new Error(data?.error || `HTTP ${res.status}`);
        }
      } else {
        setAiData(data);
      }
    } catch (e: any) {
      setAiError(e?.message ?? "Gemini unavailable");
    } finally {
      setAiLoading(false);
    }
  }

  function set<K extends keyof DecomposeInput>(k: K, v: number) {
    setInput((p) => ({ ...p, [k]: v }));
  }

  async function onExport() {
    if (!briefRef.current) return;
    await exportBriefAsPdf(briefRef.current, {
      title: "econ.mom · Inflation Decomposer Brief",
      subject: "Headline CPI Decomposition (Bernanke-Blanchard 2023)",
      filename: "Inflation-Decomposer-Brief.pdf",
      author: "econ.mom",
    });
  }

  return (
    <div>
      <ToolPageHeader tool={tool} />
      <ToolExplainer tool={tool} />

      <section className="mx-auto max-w-6xl px-6 lg:px-10 pb-24">
        {/* Status bar */}
        <div className="rounded-2xl border border-border bg-card p-5 flex flex-wrap items-center justify-between gap-4 mb-6" data-testid="status-bar">
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-primary mb-1">Regime</div>
            <div className="text-base font-medium">{result.regime}</div>
            <div className="text-xs text-muted-foreground mt-1">
              Expectations {result.expectationsAnchored ? "anchored within ±0.4pp of 2%" : "DEANCHORED, restoration required"}
            </div>
          </div>
          <Button onClick={onExport} variant="default" data-testid="button-export-brief">
            <Download className="h-4 w-4 mr-2" /> Export Policy Brief (PDF)
          </Button>
        </div>

        {/* Presets + Live FRED */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <button
            onClick={loadLive}
            disabled={loadingLive}
            className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition disabled:opacity-60"
            data-testid="button-load-live"
          >
            {loadingLive ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
            {loadingLive ? "Loading FRED\u2026" : "Pull live FRED data"}
          </button>
          <button
            onClick={() => { setInput(DECOMPOSE_PRESETS[0].input); setLiveAsOf(null); setAiData(null); }}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs hover:border-foreground/40 transition"
            data-testid="button-reset"
          >
            <RotateCcw className="h-3 w-3" /> Reset
          </button>
          {liveAsOf && (
            <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Live as of {liveAsOf}
            </span>
          )}
          {liveErr && (
            <span className="text-[10px] uppercase tracking-[0.18em] text-destructive">
              {liveErr}
            </span>
          )}
          <span className="mx-1 h-4 w-px bg-border" />
          {DECOMPOSE_PRESETS.map((p) => (
            <button
              key={p.name}
              onClick={() => { setInput(p.input); setLiveAsOf(null); }}
              className="rounded-full border border-border px-3 py-1.5 text-xs hover:border-primary hover:text-primary transition"
              data-testid={`preset-${p.name.replace(/\s+/g, "-").toLowerCase()}`}
            >
              {p.name}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Inputs</h2>
            <div className="grid grid-cols-2 gap-4">
              <NumInput label="Headline CPI YoY" value={input.headlineCpi} onChange={(v) => set("headlineCpi", v)} suffix="%" hint="FRED CPIAUCSL YoY" />
              <NumInput label="Energy YoY" value={input.energyYoY} onChange={(v) => set("energyYoY", v)} suffix="%" hint="WTI · CPIENGSL" />
              <NumInput label="Food YoY" value={input.foodYoY} onChange={(v) => set("foodYoY", v)} suffix="%" hint="FAO Food Price Index" />
              <NumInput label="Vacancy / Unemployment" value={input.vacancyToUnemployment} onChange={(v) => set("vacancyToUnemployment", v)} step={0.05} hint="JTSJOL ÷ UNEMPLOY" />
              <NumInput label="5Y Breakeven" value={input.breakeven5y} onChange={(v) => set("breakeven5y", v)} suffix="%" hint="FRED T5YIE" />
              <NumInput label="Survey 5Y Expect." value={input.surveyExpect5y} onChange={(v) => set("surveyExpect5y", v)} suffix="%" hint="Michigan / SCE" />
              <NumInput label="Fed Funds" value={input.fedFundsRate} onChange={(v) => set("fedFundsRate", v)} suffix="%" hint="FRED FEDFUNDS" />
              <NumInput label="Output Gap" value={input.outputGap} onChange={(v) => set("outputGap", v)} suffix="% pot." hint="CBO" />
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Decomposition</h2>
            <div className="h-[260px] -mx-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} width={150} />
                  <ReferenceLine x={0} stroke="hsl(var(--foreground))" />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                    formatter={(v: number) => [`${v.toFixed(2)} pp`, "Contribution"]}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {chartData.map((c, i) => <Cell key={i} fill={c.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-lg border border-border p-3">
                <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Model π</div>
                <div className="text-2xl font-semibold mt-0.5">{result.total.toFixed(2)}<span className="text-base ml-0.5">%</span></div>
              </div>
              <div className="rounded-lg border border-border p-3">
                <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Observed</div>
                <div className="text-2xl font-semibold mt-0.5">{input.headlineCpi.toFixed(2)}<span className="text-base ml-0.5">%</span></div>
              </div>
              <div className="rounded-lg border border-border p-3">
                <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Residual</div>
                <div className="text-2xl font-semibold mt-0.5" style={{ color: Math.abs(result.residual) > 0.5 ? "hsl(var(--destructive))" : undefined }}>
                  {result.residual >= 0 ? "+" : ""}{result.residual.toFixed(2)}<span className="text-base ml-0.5">pp</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Component table */}
        <Card className="mt-6 p-6">
          <h2 className="text-xl font-semibold mb-3">Component drivers</h2>
          <div className="space-y-2">
            {result.components.map((c) => (
              <div key={c.label} className="flex items-start gap-4 py-2 border-b border-border last:border-0">
                <div className="h-3 w-3 rounded-sm mt-1.5" style={{ background: c.color }} />
                <div className="flex-1">
                  <div className="font-medium">{c.label}</div>
                  <div className="text-xs text-muted-foreground">{c.note}</div>
                </div>
                <div className="font-mono text-sm tabular-nums">{c.value >= 0 ? "+" : ""}{c.value.toFixed(2)} pp</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Recommendation */}
        <Card className="mt-6 p-6 border-primary/40">
          <div className="text-[10px] uppercase tracking-[0.18em] text-primary mb-2">Policy take</div>
          <div className="text-base">{result.recommendation}</div>
        </Card>

        {/* Gemini deep explanation */}
        <Card className="mt-6 p-6 border-primary/30 bg-primary/5">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-primary mb-1 flex items-center gap-1.5">
                <Sparkles className="h-3 w-3" /> Deep explanation
              </div>
              <div className="text-xs text-muted-foreground">Read your decomposition like a chief economist would.</div>
            </div>
            <Button onClick={explainWithGemini} disabled={aiLoading} variant="default" data-testid="button-deep-explain">
              {aiLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
              {aiLoading ? "Reading the data\u2026" : aiData ? "Refresh explanation" : "Explain this decomposition"}
            </Button>
          </div>
          {aiError && (
            <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-xs text-destructive">
              <div className="font-medium mb-1">Gemini call failed</div>
              <div>{aiError}</div>
              <button onClick={explainWithGemini} className="mt-2 underline">Try again</button>
            </div>
          )}
          <div className="mb-4">
            <GeminiProgress
              active={aiLoading}
              label="Reading your decomposition"
              etaSeconds={15}
              stages={[
                "Reading the decomposition",
                "Identifying supply vs demand drivers",
                "Drafting Fed implication",
                "Pulling historical analog",
              ]}
            />
          </div>
          {aiData && !aiError && (
            <div className="space-y-5">
              {aiData._degraded && (
                <div className="rounded-md border border-amber-500/40 bg-amber-500/5 p-3 text-xs text-amber-700 dark:text-amber-400">
                  <span className="font-semibold">Static fallback shown.</span> {aiData._reason || "Gemini took too long; showing a deterministic decomposition."} Click “Refresh explanation” to retry the live model.
                </div>
              )}
              <div className="prose-serif text-[0.95rem] text-foreground/90 leading-relaxed">{aiData.narrative}</div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div className="rounded-lg border border-border bg-background p-4">
                  <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-1">Supply contribution</div>
                  <div className="text-2xl font-semibold tabular-nums">{aiData.supplyVsDemand.supplyPp >= 0 ? "+" : ""}{aiData.supplyVsDemand.supplyPp.toFixed(2)} pp</div>
                </div>
                <div className="rounded-lg border border-border bg-background p-4">
                  <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-1">Demand contribution</div>
                  <div className="text-2xl font-semibold tabular-nums">{aiData.supplyVsDemand.demandPp >= 0 ? "+" : ""}{aiData.supplyVsDemand.demandPp.toFixed(2)} pp</div>
                </div>
              </div>
              <div className="text-sm text-foreground/85">{aiData.supplyVsDemand.explanation}</div>

              {aiData.drivers?.length > 0 && (
                <div>
                  <div className="text-[10px] uppercase tracking-[0.18em] text-primary mb-2">Driver-by-driver</div>
                  <div className="space-y-2">
                    {aiData.drivers.map((d, i) => (
                      <div key={i} className="rounded-md border border-border bg-background p-3">
                        <div className="flex items-baseline justify-between mb-0.5">
                          <div className="text-sm font-medium">{d.label || d.name || `Driver ${i + 1}`}</div>
                          {typeof d.contribution === "number" && (
                            <div className="text-xs font-mono tabular-nums text-muted-foreground">{d.contribution >= 0 ? "+" : ""}{d.contribution.toFixed(2)} pp</div>
                          )}
                        </div>
                        <div className="text-xs text-foreground/80">{d.explanation}</div>
                        {d.outlook && <div className="text-[11px] text-muted-foreground italic mt-1">Outlook: {d.outlook}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-3">
                <div className="rounded-lg border border-border bg-background p-4">
                  <div className="text-[10px] uppercase tracking-[0.18em] text-primary mb-1">Fed implication</div>
                  <div className="text-sm text-foreground/90">{aiData.fedImplication}</div>
                </div>
                <div className="rounded-lg border border-border bg-background p-4">
                  <div className="text-[10px] uppercase tracking-[0.18em] text-primary mb-1">Historical context</div>
                  <div className="text-sm text-foreground/90">{aiData.historicalContext}</div>
                </div>
              </div>

              {aiData.watchNext?.length > 0 && (
                <div className="rounded-lg border border-primary/30 bg-background p-4">
                  <div className="text-[10px] uppercase tracking-[0.18em] text-primary mb-2">Watch next</div>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-foreground/85">
                    {aiData.watchNext.map((w, i) => <li key={i}>{w}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}
        </Card>
      </section>

      <BriefDocument
        ref={briefRef}
        toolName="Inflation Decomposer"
        toolNumber={tool?.number ?? "X"}
        headline={`${input.headlineCpi.toFixed(1)}% headline → ${result.regime}`}
        subhead="Headline CPI decomposed into trend, supply, demand, expectations, and policy components per Bernanke-Blanchard (2023, NBER w31417) and Cleveland Fed trend-cycle methodology."
        regimeBadge={result.expectationsAnchored ? "Anchored" : "Deanchored"}
        metrics={[
          { label: "Observed Headline", value: `${input.headlineCpi.toFixed(2)}%`, context: "YoY", tone: "neutral" },
          { label: "Model-implied", value: `${result.total.toFixed(2)}%`, context: "Σ components", tone: "neutral" },
          { label: "Residual", value: `${result.residual >= 0 ? "+" : ""}${result.residual.toFixed(2)}pp`, context: "Unexplained", tone: Math.abs(result.residual) > 0.5 ? "negative" : "positive" },
        ]}
        sections={[
          {
            heading: "Component decomposition (pp contribution)",
            rows: result.components.map((c) => ({ label: c.label, value: `${c.value >= 0 ? "+" : ""}${c.value.toFixed(2)} pp` })),
          },
          {
            heading: "Inputs",
            rows: [
              { label: "Energy YoY", value: `${input.energyYoY.toFixed(1)}%` },
              { label: "Food YoY", value: `${input.foodYoY.toFixed(1)}%` },
              { label: "V/U ratio", value: input.vacancyToUnemployment.toFixed(2) },
              { label: "5Y breakeven", value: `${input.breakeven5y.toFixed(2)}%` },
              { label: "Survey 5Y expect.", value: `${input.surveyExpect5y.toFixed(2)}%` },
              { label: "Fed funds", value: `${input.fedFundsRate.toFixed(2)}%` },
              { label: "Output gap", value: `${input.outputGap.toFixed(1)}%` },
            ],
          },
          { heading: "Recommendation", body: result.recommendation },
        ]}
        footerNote="Bernanke-Blanchard 2023 · HLW 2024 · Cleveland Fed"
      />
    </div>
  );
}
