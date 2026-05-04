import { useMemo, useRef, useState } from "react";
import { ToolPageHeader } from "@/components/brand/ToolPageHeader";
import { TOOL_BY_SLUG } from "@/lib/tools";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { COUNTERFACTUAL_SCENARIOS, SCENARIO_BY_ID, type CounterfactualScenario, type ScenarioParam, type SeriesPoint } from "@/lib/counterfactual/scenarios";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Download, Sparkles, Loader2 } from "lucide-react";
import { BriefDocument } from "@/components/brief/BriefDocument";
import { exportBriefAsPdf } from "@/lib/brief/exportBrief";

// Linear simulator factory used for AI-generated scenarios:
// counterfactual[i] = actual[i] + Σ coeff_k * (param_k − defaultActual_k)
function makeLinearSimulator(paramsWithCoeff: (ScenarioParam & { coefficient: number })[]) {
  return (params: Record<string, number>, base: SeriesPoint[]): number[] => {
    return base.map((p) => {
      let delta = 0;
      for (const meta of paramsWithCoeff) {
        const v = params[meta.key] ?? meta.defaultCounterfactual;
        delta += (meta.coefficient ?? 0) * (v - meta.defaultActual);
      }
      return p.actual + delta;
    });
  };
}

const SLUG = "counterfactual-engine";

export default function CounterfactualEngine() {
  const tool = TOOL_BY_SLUG[SLUG];
  // Runtime AI-generated scenarios (additive on top of curated ones).
  const [aiScenarios, setAiScenarios] = useState<CounterfactualScenario[]>([]);
  const allScenarios = useMemo(() => [...COUNTERFACTUAL_SCENARIOS, ...aiScenarios], [aiScenarios]);
  const allById = useMemo(() => Object.fromEntries(allScenarios.map((s) => [s.id, s])) as Record<string, CounterfactualScenario>, [allScenarios]);

  const [scenarioId, setScenarioId] = useState(COUNTERFACTUAL_SCENARIOS[0].id);
  const scenario = allById[scenarioId] ?? COUNTERFACTUAL_SCENARIOS[0];
  const [paramValues, setParamValues] = useState<Record<string, number>>(() =>
    Object.fromEntries(scenario.params.map((p) => [p.key, p.defaultCounterfactual])),
  );
  const briefRef = useRef<HTMLDivElement>(null);

  function selectScenario(id: string) {
    setScenarioId(id);
    const s = allById[id] ?? SCENARIO_BY_ID[id];
    setParamValues(Object.fromEntries(s.params.map((p) => [p.key, p.defaultCounterfactual])));
  }

  // Gemini custom scenario
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  async function generateScenario() {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    setAiError(null);
    try {
      const res = await fetch("/api/gemini-scenario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: aiPrompt }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const paramsWithCoeff = (data.params ?? []).map((p: any) => ({
        key: String(p.key),
        label: String(p.label),
        description: String(p.description ?? ""),
        min: Number(p.min),
        max: Number(p.max),
        step: Number(p.step ?? 0.1),
        defaultActual: Number(p.defaultActual),
        defaultCounterfactual: Number(p.defaultCounterfactual),
        unit: String(p.unit ?? ""),
        coefficient: Number(p.coefficient ?? 0),
      }));
      const newScenario: CounterfactualScenario = {
        id: `ai-${Date.now()}`,
        title: String(data.title ?? "Custom counterfactual"),
        era: String(data.era ?? "User-defined"),
        question: String(data.question ?? ""),
        context: String(data.context ?? ""),
        outcomeUnit: String(data.outcomeUnit ?? ""),
        outcomeLabel: String(data.outcomeLabel ?? "Outcome"),
        params: paramsWithCoeff.map(({ coefficient, ...p }: any) => p),
        series: (data.series ?? []).map((p: any) => ({ t: String(p.t), actual: Number(p.actual) })),
        simulate: makeLinearSimulator(paramsWithCoeff),
        citations: data.citations ?? [],
      };
      setAiScenarios((s) => [...s, newScenario]);
      setScenarioId(newScenario.id);
      setParamValues(Object.fromEntries(newScenario.params.map((p) => [p.key, p.defaultCounterfactual])));
      setAiPrompt("");
    } catch (e: any) {
      setAiError(e?.message ?? "Could not generate scenario");
    } finally {
      setAiLoading(false);
    }
  }

  const chartData = useMemo(() => {
    const cf = scenario.simulate(paramValues, scenario.series);
    return scenario.series.map((p, i) => ({ t: p.t, actual: p.actual, counterfactual: cf[i] }));
  }, [scenario, paramValues]);

  const finalActual = chartData[chartData.length - 1]?.actual ?? 0;
  const finalCF = chartData[chartData.length - 1]?.counterfactual ?? 0;
  const delta = finalCF - finalActual;
  const peakActual = Math.max(...chartData.map((d) => d.actual));
  const peakCF = Math.max(...chartData.map((d) => d.counterfactual));

  async function onExport() {
    if (!briefRef.current) return;
    await exportBriefAsPdf(briefRef.current, {
      title: `econ.mom · ${scenario.title}`,
      subject: "Counterfactual Engine Brief",
      filename: `Counterfactual-${scenario.id}.pdf`,
    });
  }

  return (
    <div>
      <ToolPageHeader tool={tool} />

      <section className="mx-auto max-w-7xl px-6 lg:px-10 pb-24">
        <div className="rounded-2xl border border-border bg-card p-5 mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-primary mb-1">Counterfactual</div>
            <div className="text-base font-medium">{scenario.title}</div>
            <div className="text-xs text-muted-foreground mt-1">{scenario.era}</div>
          </div>
          <Button onClick={onExport} data-testid="button-export-brief">
            <Download className="h-4 w-4 mr-2" /> Export Counterfactual Brief (PDF)
          </Button>
        </div>

        {/* Scenario picker */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
          {allScenarios.map((s) => (
            <button
              key={s.id}
              onClick={() => selectScenario(s.id)}
              className={`text-left rounded-xl border p-4 transition ${scenarioId === s.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"} ${s.id.startsWith("ai-") ? "ring-1 ring-primary/30" : ""}`}
              data-testid={`scenario-${s.id}`}
            >
              <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-1">
                {s.id.startsWith("ai-") ? <span className="text-primary">AI · {s.era}</span> : s.era}
              </div>
              <div className="font-medium leading-snug text-sm">{s.title}</div>
            </button>
          ))}
        </div>

        {/* Custom AI scenario builder */}
        <Card className="p-5 mb-6 border-primary/30 bg-primary/5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex-1 min-w-[260px]">
              <div className="text-[10px] uppercase tracking-[0.18em] text-primary mb-1 flex items-center gap-1.5">
                <Sparkles className="h-3 w-3" /> Build a custom counterfactual
              </div>
              <div className="text-xs text-muted-foreground mb-2">Describe a historical “what if”. Gemini calibrates parameters, sliders, and a baseline path.</div>
              <textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="e.g. What if the Smoot-Hawley tariff had passed at half its actual rate in 1930?"
                rows={2}
                data-testid="input-custom-scenario"
                className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <Button onClick={generateScenario} disabled={aiLoading || !aiPrompt.trim()} data-testid="button-generate-scenario">
              {aiLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
              {aiLoading ? "Calibrating…" : "Generate scenario"}
            </Button>
          </div>
          {aiError && <div className="mt-2 text-xs text-destructive">{aiError}</div>}
        </Card>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Levers */}
          <Card className="p-6 lg:col-span-1">
            <h2 className="text-xl font-semibold mb-1">Levers</h2>
            <p className="text-xs text-muted-foreground mb-4">Adjust counterfactual assumptions; the actual path is fixed.</p>
            <div className="space-y-5">
              {scenario.params.map((p) => (
                <div key={p.key}>
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{p.label}</span>
                    <span className="font-mono text-sm">{paramValues[p.key]?.toFixed(2)} {p.unit}</span>
                  </div>
                  <Slider
                    min={p.min} max={p.max} step={p.step}
                    value={[paramValues[p.key] ?? p.defaultCounterfactual]}
                    onValueChange={([v]) => setParamValues((s) => ({ ...s, [p.key]: v }))}
                    data-testid={`slider-${p.key}`}
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                    <span>min {p.min}</span>
                    <span>actual {p.defaultActual}</span>
                    <span>max {p.max}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1.5">{p.description}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Chart */}
          <Card className="p-6 lg:col-span-2">
            <div className="flex items-baseline justify-between mb-3">
              <h2 className="text-xl font-semibold">{scenario.outcomeLabel}</h2>
              <span className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{scenario.outcomeUnit}</span>
            </div>
            <div className="h-[320px] -mx-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ left: 4, right: 16, top: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="t" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="actual" stroke="hsl(var(--foreground))" strokeWidth={2} dot={false} name="Actual history" />
                  <Line type="monotone" dataKey="counterfactual" stroke="hsl(var(--primary))" strokeWidth={2.5} strokeDasharray="6 3" dot={false} name="Counterfactual" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-3 gap-3 mt-5">
              <div className="rounded-lg border border-border p-3">
                <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Final Δ</div>
                <div className="text-xl font-semibold mt-0.5" style={{ color: delta > 0 ? "hsl(var(--destructive))" : "hsl(var(--primary))" }}>
                  {delta >= 0 ? "+" : ""}{delta.toFixed(2)}
                </div>
              </div>
              <div className="rounded-lg border border-border p-3">
                <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Peak (actual)</div>
                <div className="text-xl font-semibold mt-0.5">{peakActual.toFixed(2)}</div>
              </div>
              <div className="rounded-lg border border-border p-3">
                <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Peak (CF)</div>
                <div className="text-xl font-semibold mt-0.5">{peakCF.toFixed(2)}</div>
              </div>
            </div>
          </Card>
        </div>

        <Card className="mt-6 p-6">
          <div className="text-[10px] uppercase tracking-[0.18em] text-primary mb-2">Question</div>
          <p className="text-base mb-3">{scenario.question}</p>
          <div className="text-[10px] uppercase tracking-[0.18em] text-primary mb-2">Historical context</div>
          <p className="text-sm text-foreground/85 mb-4">{scenario.context}</p>
          <div className="text-[10px] uppercase tracking-[0.18em] text-primary mb-2">Citations</div>
          <ul className="text-xs space-y-1">
            {scenario.citations.map((c, i) => (
              <li key={i}>
                {c.url ? <a className="text-primary underline" href={c.url} target="_blank" rel="noreferrer">{c.label}</a> : c.label}
              </li>
            ))}
          </ul>
        </Card>
      </section>

      <BriefDocument
        ref={briefRef}
        toolName="Counterfactual Engine"
        toolNumber={tool?.number ?? "XII"}
        headline={scenario.title}
        subhead={`${scenario.era} · ${scenario.outcomeLabel} (${scenario.outcomeUnit})`}
        regimeBadge="Counterfactual"
        metrics={[
          { label: "Final actual", value: finalActual.toFixed(2), context: scenario.outcomeUnit, tone: "neutral" },
          { label: "Final CF", value: finalCF.toFixed(2), context: "model", tone: "neutral" },
          { label: "Δ", value: `${delta >= 0 ? "+" : ""}${delta.toFixed(2)}`, context: "CF − actual", tone: delta > 0 ? "negative" : "positive" },
        ]}
        sections={[
          { heading: "Research question", body: scenario.question },
          { heading: "Historical context", body: scenario.context },
          {
            heading: "Counterfactual parameters",
            rows: scenario.params.map((p) => ({
              label: p.label,
              value: `${paramValues[p.key]?.toFixed(2)} ${p.unit} (actual ${p.defaultActual})`,
            })),
          },
          {
            heading: "Citations",
            paragraphs: scenario.citations.map((c) => `${c.label}${c.url ? `, ${c.url}` : ""}`),
          },
        ]}
        footerNote="Calibrated to peer-reviewed estimates · Illustrative only"
      />
    </div>
  );
}
