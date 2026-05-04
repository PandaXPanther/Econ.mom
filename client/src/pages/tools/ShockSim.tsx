import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PageShell } from "@/components/brand/PageShell";
import { ToolPageHeader } from "@/components/brand/ToolPageHeader";
import { TOOL_BY_SLUG } from "@/lib/tools";
import { SEO } from "@/components/brand/SEO";
import { Newspaper, Sparkles, AlertTriangle, ExternalLink } from "lucide-react";

type ShockType = "demand_increase" | "demand_decrease" | "supply_increase" | "supply_decrease";

interface GeminiShockResp {
  type: ShockType;
  market: string;
  magnitude: "small" | "medium" | "large";
  priceChangePct: number;
  quantityChangePct: number;
  elasticityDemand: number;
  elasticitySupply: number;
  shiftPct: number;
  reasoning: string;
  historicalAnalogs: { event: string; year: number; outcome: string }[];
  watchVariables: WatchVariable[];
}

interface WatchVariable {
  label: string;
  fredSeries: string | null;
  source: string;
  sourceUrl: string;
}

const HEADLINES = [
  "OPEC+ announces 2 million barrels per day production cut starting next month",
  "Federal Reserve raises target federal funds rate by 25 basis points",
  "USDA reports record corn harvest with 15.3 billion bushels",
];

export default function ShockSim() {
  const tool = TOOL_BY_SLUG["shock-sim"];
  const [headline, setHeadline] = useState("");
  const [result, setResult] = useState<GeminiShockResp | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onAnalyze = async (h: string) => {
    setHeadline(h);
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const r = await fetch("/api/gemini-shock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ headline: h }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j.error || `HTTP ${r.status}`);
      }
      const data = await r.json();
      setResult(data);
    } catch (e: any) {
      setError(e?.message || "Classification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell>
      <SEO
        title="Shock Simulator, paste a headline, see the supply-and-demand graph shift correctly | The Mother Of Econ"
        description="Drop any economics news headline in. Shock Simulator classifies it as a supply or demand shock, quantifies the price and quantity effects, and renders the correct S/D graph shift with realistic elasticities."
        path="/shock-sim"
      />
      <ToolPageHeader tool={tool} />
      <section className="mx-auto max-w-7xl px-6 py-12 lg:px-10 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <div className="rounded-xl border border-border bg-card p-6 lg:p-8">
              <div className="label-cap mb-3 flex items-center gap-2"><Newspaper size={12}/> Paste a headline</div>
              <textarea
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="e.g., 'OPEC+ announces 2 million barrels per day production cut'"
                data-testid="textarea-headline"
                rows={3}
                className="w-full rounded-md border border-border bg-background p-4 text-[0.95rem] focus:border-primary focus:outline-none"
              />
              <button
                onClick={() => onAnalyze(headline)}
                disabled={!headline || loading}
                data-testid="button-analyze-headline"
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 font-medium text-background hover:-translate-y-0.5 transition-transform disabled:opacity-60"
              >
                {loading ? <><Sparkles size={14} className="animate-pulse" /> Gemini is classifying…</> : "Render the shift"}
              </button>
              {error && (
                <div className="mt-4 flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-[0.85rem] text-destructive">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0" /> {error}
                </div>
              )}
            </div>

            <div className="mt-8">
              <div className="label-cap mb-3">Or try one of these</div>
              <div className="grid gap-3">
                {HEADLINES.map((h) => (
                  <button
                    key={h}
                    onClick={() => onAnalyze(h)}
                    data-testid={`button-example-${h.slice(0, 12)}`}
                    className="text-left rounded-lg border border-border bg-card p-4 hover:border-primary/40 transition-colors"
                  >
                    <p className="prose-serif text-[0.92rem] text-foreground/90">{h}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <AnimatePresence mode="wait">
              {result && (
                <motion.div
                  key={headline}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="rounded-xl border border-border bg-card p-6 lg:p-8 sticky top-24"
                  data-testid="shock-result"
                >
                  <div className="label-cap mb-2 text-primary">Classification · Gemini</div>
                  <h3 className="text-editorial text-[1.75rem]">{shockTitle(result.type)}</h3>
                  <p className="prose-serif mt-3 text-[0.92rem] text-muted-foreground">in {result.market} · {result.magnitude}</p>

                  <div className="rule mt-6" />

                  <SDDiagram type={result.type} />

                  {/* Numeric panel */}
                  <div className="mt-5 grid grid-cols-2 gap-2">
                    <Stat label="ΔP" value={`${result.priceChangePct >= 0 ? "+" : ""}${result.priceChangePct.toFixed(1)}%`} sign={result.priceChangePct} />
                    <Stat label="ΔQ" value={`${result.quantityChangePct >= 0 ? "+" : ""}${result.quantityChangePct.toFixed(1)}%`} sign={result.quantityChangePct} />
                    <Stat label="|εd|" value={result.elasticityDemand?.toFixed(2) ?? ", "} mono />
                    <Stat label="|εs|" value={result.elasticitySupply?.toFixed(2) ?? ", "} mono />
                    <Stat label="Curve shift" value={`${result.shiftPct >= 0 ? "+" : ""}${result.shiftPct?.toFixed(1)}%`} mono />
                    <Stat label="Magnitude" value={result.magnitude} mono />
                  </div>

                  <div className="mt-6 space-y-4 text-[0.92rem]">
                    <Row label="Reasoning" body={result.reasoning} />
                    {result.historicalAnalogs?.length > 0 && (
                      <div>
                        <div className="label-cap mb-1">Historical analogs</div>
                        <ul className="prose-serif text-foreground/85 space-y-1.5">
                          {result.historicalAnalogs.map((a, i) => (
                            <li key={i} className="text-[0.9rem]">
                              <strong>{a.event}</strong> ({a.year}), {a.outcome}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {result.watchVariables?.length > 0 && (
                      <div>
                        <div className="label-cap mb-1">Watch</div>
                        <div className="flex flex-wrap gap-1.5">
                          {result.watchVariables.map((v, i) => {
                            const wv = normalizeWatch(v);
                            const tagClass = "inline-flex items-center gap-1 font-mono text-[0.7rem] uppercase tracking-wider rounded bg-muted px-2 py-0.5";
                            if (wv.sourceUrl) {
                              return (
                                <a
                                  key={i}
                                  href={wv.sourceUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  data-testid={`link-watch-${i}`}
                                  className={`${tagClass} hover:bg-primary/10 hover:text-primary transition-colors`}
                                  title={wv.fredSeries ? `FRED · ${wv.fredSeries}` : wv.source || "Official source"}
                                >
                                  <span>{wv.label}</span>
                                  <ExternalLink size={9} className="opacity-50" />
                                </a>
                              );
                            }
                            return (
                              <span key={i} className={tagClass}>{wv.label}</span>
                            );
                          })}
                        </div>
                        <p className="mt-2 text-[0.7rem] text-muted-foreground/80">
                          Each link opens the official series page (FRED, BLS, EIA, BEA, USDA, Census, or the Federal Reserve). Links are server-validated against an allowlist; non-matching URLs are stripped.
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
              {!result && !loading && (
                <div className="rounded-xl border border-dashed border-border bg-muted/20 p-10 text-center">
                  <p className="prose-serif text-muted-foreground">
                    The diagram, signed % changes, elasticities, and historical analogs appear here.
                  </p>
                </div>
              )}
              {loading && (
                <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-10 text-center">
                  <Sparkles size={20} className="mx-auto animate-pulse text-primary" />
                  <p className="prose-serif mt-3 text-muted-foreground">Gemini is calibrating elasticities…</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>
    </PageShell>
  );
}

// Tolerate both the new {label, sourceUrl, ...} shape and the legacy string form.
function normalizeWatch(v: WatchVariable | string): WatchVariable {
  if (typeof v === "string") return { label: v, fredSeries: null, source: "", sourceUrl: "" };
  return {
    label: v?.label || "",
    fredSeries: v?.fredSeries ?? null,
    source: v?.source || "",
    sourceUrl: v?.sourceUrl || "",
  };
}

function shockTitle(t: ShockType) {
  const map: Record<ShockType, string> = {
    "supply_decrease": "Supply ↓ shock",
    "supply_increase": "Supply ↑ shock",
    "demand_decrease": "Demand ↓ shock",
    "demand_increase": "Demand ↑ shock",
  };
  return map[t] || "Shock";
}

function Row({ label, body }: { label: string; body: string }) {
  return (
    <div>
      <div className="label-cap mb-1">{label}</div>
      <p className="prose-serif text-foreground/85">{body}</p>
    </div>
  );
}

function Stat({ label, value, sign, mono }: { label: string; value: string; sign?: number; mono?: boolean }) {
  const color = sign === undefined ? undefined : sign > 0 ? "hsl(var(--destructive))" : sign < 0 ? "hsl(var(--primary))" : undefined;
  return (
    <div className="rounded-lg border border-border bg-background px-3 py-2">
      <div className="font-mono text-[0.6rem] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`mt-0.5 ${mono ? "font-mono" : "font-semibold"} text-[1rem]`} style={color ? { color } : undefined}>
        {value}
      </div>
    </div>
  );
}

function SDDiagram({ type }: { type: ShockType }) {
  /*
   * Sign convention (both axes use SVG coordinates where y increases downward):
   *   supplyShift > 0  = supply curve shifts RIGHT  (supply increase: lower P, higher Q)
   *   supplyShift < 0  = supply curve shifts LEFT   (supply decrease: higher P, lower Q)
   *   demandShift > 0  = demand curve shifts RIGHT  (demand increase: higher P, higher Q)
   *   demandShift < 0  = demand curve shifts LEFT   (demand decrease: lower P, lower Q)
   *
   * Original curves (SVG viewBox 320x220, axes at x=30/y=200):
   *   D: (50,30) -> (290,190)   slope = +160/240  (downward in economics sense)
   *   S: (50,190) -> (290,30)   slope = -160/240  (upward in economics sense)
   *   Baseline equilibrium E1: algebraic intersection at cx=170, cy=110.
   *
   * After shifting S by sh and D by dh (both horizontal in SVG pixels), the new
   * intersection is derived exactly by solving the two parametric equations:
   *   E2.cx = 170 + (sh + dh) / 2
   *   E2.cy = 110 + (sh - dh) / 3
   *
   * Verification:
   *   supply_decrease (sh=-38, dh=0): cx=151 (Q down), cy=97 (P up)  [correct]
   *   supply_increase (sh=+38, dh=0): cx=189 (Q up),  cy=123 (P down)[correct]
   *   demand_increase (sh=0,  dh=+38): cx=189 (Q up), cy=97 (P up)   [correct]
   *   demand_decrease (sh=0,  dh=-38): cx=151 (Q down),cy=123 (P down)[correct]
   */
  const supplyShift = type.startsWith("supply") ? (type.endsWith("increase") ? 38 : -38) : 0;
  const demandShift = type.startsWith("demand") ? (type.endsWith("increase") ? 38 : -38) : 0;

  const e2cx = 170 + (supplyShift + demandShift) / 2;
  const e2cy = 110 + (supplyShift - demandShift) / 3;

  // E2 label: position it so it never overlaps E1
  const labelOffsetX = e2cx > 170 ? 6 : -16;
  const labelOffsetY = e2cy < 110 ? -4 : 14;

  return (
    <svg viewBox="0 0 320 220" className="w-full h-auto">
      {/* Axes */}
      <line x1={30} y1={10} x2={30} y2={200} stroke="hsl(var(--border))" />
      <line x1={30} y1={200} x2={310} y2={200} stroke="hsl(var(--border))" />
      <text x={20} y={14} fontSize={9} fill="hsl(var(--muted-foreground))" textAnchor="end" fontFamily="JetBrains Mono">P</text>
      <text x={310} y={214} fontSize={9} fill="hsl(var(--muted-foreground))" textAnchor="end" fontFamily="JetBrains Mono">Q</text>

      {/* Demand curve */}
      <line x1={50} y1={30} x2={290} y2={190} stroke="hsl(var(--chart-1))" strokeWidth={2} opacity={demandShift !== 0 ? 0.3 : 1} />
      <text x={285} y={200} fontSize={10} fill="hsl(var(--chart-1))" fontFamily="JetBrains Mono">D</text>

      {demandShift !== 0 && (
        <>
          <motion.line
            initial={{ x1: 50, y1: 30, x2: 290, y2: 190 }}
            animate={{ x1: 50 + demandShift, y1: 30, x2: 290 + demandShift, y2: 190 }}
            transition={{ duration: 0.7 }}
            stroke="hsl(var(--chart-1))"
            strokeWidth={2}
          />
          <motion.text
            initial={{ x: 285, y: 200 }}
            animate={{ x: 285 + demandShift, y: 200 }}
            transition={{ duration: 0.7 }}
            fontSize={10} fill="hsl(var(--chart-1))" fontFamily="JetBrains Mono"
          >D'</motion.text>
        </>
      )}

      {/* Supply curve */}
      <line x1={50} y1={190} x2={290} y2={30} stroke="hsl(var(--chart-3))" strokeWidth={2} opacity={supplyShift !== 0 ? 0.3 : 1} />
      <text x={285} y={28} fontSize={10} fill="hsl(var(--chart-3))" fontFamily="JetBrains Mono">S</text>

      {supplyShift !== 0 && (
        <>
          <motion.line
            initial={{ x1: 50, y1: 190, x2: 290, y2: 30 }}
            animate={{ x1: 50 + supplyShift, y1: 190, x2: 290 + supplyShift, y2: 30 }}
            transition={{ duration: 0.7 }}
            stroke="hsl(var(--chart-3))"
            strokeWidth={2}
          />
          <motion.text
            initial={{ x: 285, y: 28 }}
            animate={{ x: 285 + supplyShift, y: 28 }}
            transition={{ duration: 0.7 }}
            fontSize={10} fill="hsl(var(--chart-3))" fontFamily="JetBrains Mono"
          >S'</motion.text>
        </>
      )}

      {/* E1, original equilibrium */}
      <circle cx={170} cy={110} r={3.5} fill="hsl(var(--foreground))" />
      <text x={176} y={106} fontSize={10} fontFamily="JetBrains Mono" fill="hsl(var(--foreground))">E₁</text>

      {/* Dashed path from E1 to E2 */}
      {(supplyShift !== 0 || demandShift !== 0) && (
        <motion.line
          initial={{ x1: 170, y1: 110, x2: 170, y2: 110 }}
          animate={{ x1: 170, y1: 110, x2: e2cx, y2: e2cy }}
          transition={{ duration: 0.5, delay: 0.5 }}
          stroke="hsl(var(--primary))"
          strokeWidth={1}
          strokeDasharray="4 3"
          opacity={0.5}
        />
      )}

      {/* E2, new equilibrium (algebraically correct position) */}
      <motion.circle
        initial={{ cx: 170, cy: 110, r: 0 }}
        animate={{ cx: e2cx, cy: e2cy, r: 4 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        fill="hsl(var(--primary))"
      />
      {(supplyShift !== 0 || demandShift !== 0) && (
        <motion.text
          initial={{ x: 170, y: 110, opacity: 0 }}
          animate={{ x: e2cx + labelOffsetX, y: e2cy + labelOffsetY, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          fontSize={10} fontFamily="JetBrains Mono" fill="hsl(var(--primary))"
        >E₂</motion.text>
      )}
    </svg>
  );
}
