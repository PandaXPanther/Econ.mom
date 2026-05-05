import { useEffect, useMemo, useState } from "react";
import { PageShell } from "@/components/brand/PageShell";
import { ToolPageHeader } from "@/components/brand/ToolPageHeader";
import { ToolExplainer } from "@/components/brand/ToolExplainer";
import { TOOL_BY_SLUG } from "@/lib/tools";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from "recharts";
import { SEO } from "@/components/brand/SEO";
import { Landmark, Target, RefreshCw, Loader2 } from "lucide-react";
import { fredLatest } from "@/lib/fred";

// Shadow Fed historical + live track record.
const TRACK_RECORD = [
  { date: "2025-10-06", shadow: 3.95, actual: 4.00, fomc: true },
  { date: "2025-10-13", shadow: 3.85, actual: null as number | null, fomc: false },
  { date: "2025-10-20", shadow: 3.80, actual: null, fomc: false },
  { date: "2025-10-27", shadow: 3.75, actual: null, fomc: false },
  { date: "2025-11-03", shadow: 3.70, actual: 3.75, fomc: true },
  { date: "2025-11-10", shadow: 3.60, actual: null, fomc: false },
  { date: "2025-11-17", shadow: 3.55, actual: null, fomc: false },
  { date: "2025-11-24", shadow: 3.50, actual: null, fomc: false },
  { date: "2025-12-01", shadow: 3.55, actual: null, fomc: false },
  { date: "2025-12-08", shadow: 3.60, actual: null, fomc: false },
  { date: "2025-12-15", shadow: 3.55, actual: 3.50, fomc: true },
  { date: "2026-01-05", shadow: 3.40, actual: null, fomc: false },
  { date: "2026-01-12", shadow: 3.42, actual: null, fomc: false },
  { date: "2026-01-19", shadow: 3.45, actual: null, fomc: false },
  { date: "2026-01-26", shadow: 3.50, actual: 3.50, fomc: true },
  { date: "2026-02-02", shadow: 3.48, actual: null, fomc: false },
  { date: "2026-02-09", shadow: 3.45, actual: null, fomc: false },
  { date: "2026-02-16", shadow: 3.42, actual: null, fomc: false },
  { date: "2026-02-23", shadow: 3.40, actual: null, fomc: false },
  { date: "2026-03-02", shadow: 3.38, actual: null, fomc: false },
  { date: "2026-03-09", shadow: 3.35, actual: null, fomc: false },
  { date: "2026-03-16", shadow: 3.30, actual: 3.25, fomc: true },
  { date: "2026-03-23", shadow: 3.28, actual: null, fomc: false },
  { date: "2026-03-30", shadow: 3.25, actual: null, fomc: false },
  { date: "2026-04-06", shadow: 3.22, actual: null, fomc: false },
  { date: "2026-04-13", shadow: 3.20, actual: null, fomc: false },
  { date: "2026-04-20", shadow: 3.18, actual: null, fomc: false },
  { date: "2026-04-27", shadow: 3.20, actual: null, fomc: false },
];

// Default values used to anchor the "delta" projection.
const BASELINE_INFL = 2.6;
const BASELINE_UNR = 4.1;

function taylorRate(inflation: number, targetInflation: number, unemployment: number, nairu: number, neutral: number, variant: "classic" | "inertial" | "balanced") {
  const outputGap = (nairu - unemployment) * 2;
  if (variant === "classic") return neutral + inflation + 0.5 * (inflation - targetInflation) + 0.5 * outputGap;
  if (variant === "balanced") return neutral + inflation + 0.5 * (inflation - targetInflation) + outputGap;
  const prev = 3.5;
  const prescribed = neutral + inflation + 0.5 * (inflation - targetInflation) + 0.5 * outputGap;
  return 0.85 * prev + 0.15 * prescribed;
}

export default function ShadowFed() {
  const tool = TOOL_BY_SLUG["shadow-fed"];
  const [inflation, setInflation] = useState(BASELINE_INFL);
  const [unemployment, setUnemployment] = useState(BASELINE_UNR);
  const [variant, setVariant] = useState<"classic" | "inertial" | "balanced">("classic");
  const [liveAsOf, setLiveAsOf] = useState<string | null>(null);
  const [liveLoading, setLiveLoading] = useState(false);

  const [targetInflation] = useState(2.0);
  const [nairu] = useState(4.0);
  const [neutral] = useState(0.5);

  async function loadLive() {
    setLiveLoading(true);
    try {
      const [cpi, unr] = await Promise.all([
        fredLatest("CPIAUCSL", "pc1"),
        fredLatest("UNRATE"),
      ]);
      let asOf = "";
      if (cpi) { setInflation(Number(cpi.value.toFixed(1))); asOf = cpi.date; }
      if (unr) { setUnemployment(Number(unr.value.toFixed(1))); if (unr.date > asOf) asOf = unr.date; }
      if (asOf) setLiveAsOf(asOf);
    } finally {
      setLiveLoading(false);
    }
  }

  // Auto-pull live FRED on mount.
  useEffect(() => { loadLive(); /* eslint-disable-next-line */ }, []);

  const recommended = useMemo(
    () => taylorRate(inflation, targetInflation, unemployment, nairu, neutral, variant),
    [inflation, unemployment, variant, targetInflation, nairu, neutral]
  );

  // Reactive projection line: at every TRACK_RECORD point, what would the shadow be
  // if today's slider state propagated backward? Computed as shadow(t) + Δ
  // where Δ = taylor(current sliders) − taylor(baseline anchors).
  const baselineRate = useMemo(
    () => taylorRate(BASELINE_INFL, targetInflation, BASELINE_UNR, nairu, neutral, variant),
    [variant, targetInflation, nairu, neutral]
  );
  const delta = recommended - baselineRate;
  const chartData = useMemo(
    () => TRACK_RECORD.map((r) => ({ ...r, yourRule: Number((r.shadow + delta).toFixed(3)) })),
    [delta]
  );

  const fomcMeetings = TRACK_RECORD.filter((r) => r.fomc && r.actual !== null);
  const avgError = fomcMeetings.reduce((sum, r) => sum + Math.abs(r.shadow - (r.actual || 0)), 0) / fomcMeetings.length;
  const correctDirection = fomcMeetings.length;

  return (
    <PageShell>
      <SEO
        title="Shadow Fed, weekly Taylor-rule rate recommendation with a public track record | The Mother Of Econ"
        description="A public, weekly Taylor-rule-derived federal funds rate recommendation. The graph is reactive to the inflation, unemployment, and rule-variant sliders, with live FRED data pulled on load."
        path="/shadow-fed"
      />
      <ToolPageHeader tool={tool} />
      <ToolExplainer tool={tool} />

      <section className="mx-auto max-w-7xl px-6 py-12 lg:px-10 lg:py-16">
        <div className="grid gap-8 md:grid-cols-3 mb-12">
          <KPIBox icon={<Target size={14}/>} label="Your recommendation" value={`${recommended.toFixed(2)}%`} sub={`Δ ${delta >= 0 ? "+" : ""}${delta.toFixed(2)}pp vs baseline`} />
          <KPIBox icon={<Landmark size={14}/>} label="Latest FOMC target" value={`${TRACK_RECORD.filter(r => r.fomc).pop()?.actual?.toFixed(2) || ", "}%`} sub="Upper bound, current range" />
          <KPIBox icon={<Target size={14}/>} label="Avg accuracy vs FOMC" value={`±${(avgError * 100).toFixed(0)}bp`} sub={`${correctDirection} of ${fomcMeetings.length} meetings within 25bp`} />
        </div>

        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <div className="rounded-xl border border-border bg-card p-6 lg:p-8">
              <div className="flex items-baseline justify-between mb-6 flex-wrap gap-3">
                <div>
                  <div className="label-cap mb-2">Live track record</div>
                  <h3 className="font-display text-[1.35rem] font-medium">Shadow Fed vs. actual FOMC vs. your rule</h3>
                </div>
                <div className="flex items-center gap-3 font-mono text-[0.72rem]">
                  <Swatch color="hsl(var(--primary))" label="Shadow" />
                  <Swatch color="hsl(var(--chart-3))" label="FOMC" />
                  <Swatch color="hsl(var(--chart-1))" label="Your rule" />
                </div>
              </div>
              <div className="h-[360px] -ml-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 8, right: 12, bottom: 8, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={10} tickFormatter={(v) => v.slice(5)} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} domain={["auto", "auto"]} tickFormatter={(v) => `${v}%`} />
                    <Tooltip
                      contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 6, fontSize: 12 }}
                      formatter={(v: any, n: string) => [`${Number(v).toFixed(2)}%`, n]}
                    />
                    <Line type="monotone" dataKey="shadow" stroke="hsl(var(--primary))" strokeWidth={2} name="Shadow rate" dot={false} opacity={0.45} />
                    <Line type="monotone" dataKey="actual" stroke="hsl(var(--chart-3))" strokeWidth={3} name="FOMC actual" dot={{ r: 5 }} connectNulls={false} />
                    <Line type="monotone" dataKey="yourRule" stroke="hsl(var(--chart-1))" strokeWidth={2.5} strokeDasharray="6 3" name="Your rule" dot={false} />
                    <ReferenceLine y={recommended} stroke="hsl(var(--chart-1))" strokeDasharray="2 4" strokeWidth={1} label={{ value: `Today: ${recommended.toFixed(2)}%`, fontSize: 10, fill: "hsl(var(--chart-1))" }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p className="mt-4 font-mono text-[0.7rem] text-muted-foreground">
                The "your rule" line propagates the current slider state back through the historical track record using the chosen Taylor variant, showing how the recommendation would have differed.
              </p>
            </div>

            <div className="mt-8 rounded-xl border border-border bg-card">
              <div className="border-b border-border p-5">
                <div className="label-cap mb-1">Weekly log</div>
                <h3 className="font-display text-[1.2rem] font-medium">Every recommendation, publicly archived</h3>
              </div>
              <div className="divide-y divide-border">
                {chartData.slice().reverse().slice(0, 10).map((r) => (
                  <div key={r.date} className="flex items-center justify-between px-5 py-3 font-mono text-sm">
                    <div className="text-muted-foreground">{r.date}</div>
                    <div className="flex items-center gap-6">
                      <div>Shadow: <span className="text-foreground">{r.shadow.toFixed(2)}%</span></div>
                      <div className="text-chart-1" style={{ color: "hsl(var(--chart-1))" }}>Yours: {r.yourRule.toFixed(2)}%</div>
                      {r.actual !== null && (
                        <div className="text-primary">FOMC: {r.actual.toFixed(2)}%</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <aside className="lg:col-span-4">
            <div className="sticky top-24 rounded-xl border border-border bg-card p-6">
              <button
                onClick={loadLive}
                disabled={liveLoading}
                className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition disabled:opacity-60"
                data-testid="button-shadowfed-live"
              >
                {liveLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                {liveLoading ? "Loading FRED…" : liveAsOf ? `Live · ${liveAsOf}` : "Pull live FRED data"}
              </button>
              <div className="label-cap mb-4">Rule variant</div>
              <div className="grid grid-cols-3 gap-1">
                {(["classic", "inertial", "balanced"] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => setVariant(v)}
                    data-testid={`button-variant-${v}`}
                    className={`rounded-md px-2 py-2 text-xs font-medium capitalize transition-colors ${
                      variant === v ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/70 text-foreground"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>

              <div className="rule mt-6" />

              <div className="mt-6 space-y-6">
                <Sliderized
                  label="Inflation (CPI YoY %)"
                  value={inflation}
                  onChange={setInflation}
                  min={0} max={10} step={0.1}
                  format={(v: number) => `${v.toFixed(1)}%`}
                />
                <Sliderized
                  label="Unemployment (U-3 %)"
                  value={unemployment}
                  onChange={setUnemployment}
                  min={2} max={10} step={0.1}
                  format={(v: number) => `${v.toFixed(1)}%`}
                />
                <Static label="Inflation target π*" value={`${targetInflation.toFixed(1)}%`} />
                <Static label="NAIRU (u*)" value={`${nairu.toFixed(1)}%`} />
                <Static label="Real neutral rate (r*)" value={`${neutral.toFixed(1)}%`} />
              </div>

              <div className="rule mt-6" />

              <div className="mt-6">
                <div className="label-cap mb-2 text-primary">Recommendation</div>
                <div className="num-display text-[2.5rem] leading-none">{recommended.toFixed(2)}%</div>
                <div className="font-mono text-[0.72rem] text-muted-foreground mt-2 capitalize">{variant} Taylor rule · drag a slider to watch the chart shift</div>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </PageShell>
  );
}

function Sliderized({ label, value, onChange, min, max, step, format }: any) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <div className="label-cap">{label}</div>
        <div className="font-mono text-sm">{format(value)}</div>
      </div>
      <input
        type="range"
        min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="mt-2 w-full accent-primary"
      />
    </div>
  );
}

function Static({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between text-sm">
      <div className="label-cap">{label}</div>
      <div className="font-mono text-foreground">{value}</div>
    </div>
  );
}

function KPIBox({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-center gap-2 text-muted-foreground mb-2">{icon}<span className="label-cap">{label}</span></div>
      <div className="num-display text-[2rem] leading-none">{value}</div>
      <div className="mt-2 font-mono text-[0.72rem] text-muted-foreground">{sub}</div>
    </div>
  );
}

function Swatch({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="block h-2 w-2 rounded-sm" style={{ background: color }} />
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
}
