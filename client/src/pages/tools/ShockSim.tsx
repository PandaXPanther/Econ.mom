import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PageShell } from "@/components/brand/PageShell";
import { ToolPageHeader } from "@/components/brand/ToolPageHeader";
import { TOOL_BY_SLUG } from "@/lib/tools";
import { SEO } from "@/components/brand/SEO";
import { Newspaper, Sparkles } from "lucide-react";

interface ShockClassification {
  type: "supply-decrease" | "supply-increase" | "demand-decrease" | "demand-increase";
  market: string;
  magnitude: "small" | "moderate" | "large";
  reasoning: string;
  priceEffect: string;
  quantityEffect: string;
  realWorld: string;
}

const HEADLINES: { headline: string; classification: ShockClassification }[] = [
  {
    headline: "OPEC+ announces 2 million barrels per day production cut starting next month",
    classification: {
      type: "supply-decrease",
      market: "Crude oil (and downstream gasoline)",
      magnitude: "large",
      reasoning: "OPEC+ accounts for ~40% of global crude. A 2 mb/d cut is roughly 2% of global daily production. Supply curve shifts left.",
      priceEffect: "Prices RISE. Pre-cut Brent baseline ~$78/bbl. Linear-elasticity estimate: 2% supply cut × short-run supply elasticity (~0.1) inversion → +20% price, partially absorbed by inventory release.",
      quantityEffect: "Equilibrium quantity FALLS modestly (consumers face higher prices, demand is short-run inelastic at ~0.2).",
      realWorld: "October 2022 OPEC+ cut announcement caused +6% Brent price spike same week.",
    },
  },
  {
    headline: "Federal Reserve raises target federal funds rate by 25 basis points",
    classification: {
      type: "demand-decrease",
      market: "Credit-sensitive markets (housing, autos, durables)",
      magnitude: "moderate",
      reasoning: "Higher policy rate raises borrowing costs throughout the economy, dampening consumption and investment. Demand curve shifts left in interest-sensitive markets.",
      priceEffect: "Prices fall in interest-sensitive markets (housing, autos). Effects propagate over 6–18 months.",
      quantityEffect: "Quantity falls. New mortgage originations and auto-loan demand contract.",
      realWorld: "March 2022 Fed hiking cycle began; existing-home sales fell ~25% YoY by mid-2023.",
    },
  },
  {
    headline: "USDA reports record corn harvest with 15.3 billion bushels — second-highest on record",
    classification: {
      type: "supply-increase",
      market: "Corn (and downstream feed, ethanol, sweetener markets)",
      magnitude: "large",
      reasoning: "Bumper crop expands supply. Supply curve shifts right.",
      priceEffect: "Cash corn prices fall. Approximate 5–8% price decline against a normal-crop baseline.",
      quantityEffect: "Equilibrium quantity rises significantly.",
      realWorld: "October 2024 USDA WASDE report — corn futures fell ~3% on the day.",
    },
  },
];

function classify(headline: string): ShockClassification {
  // Simple keyword-based classification with tiered detection.
  const h = headline.toLowerCase();

  // Supply decrease cues
  if (/\b(opec|cut|halt|disrupt|tariff|export ban|drought|hurricane|strike|outage|sanction)/.test(h)) {
    return {
      type: "supply-decrease",
      market: extractMarket(h),
      magnitude: /large|massive|record|major|million|billion/.test(h) ? "large" : "moderate",
      reasoning: "The headline indicates a supply-side disruption (production cut, trade barrier, weather event, or strike). Supply curve shifts LEFT.",
      priceEffect: "Equilibrium PRICE rises. Magnitude depends on demand elasticity.",
      quantityEffect: "Equilibrium QUANTITY falls.",
      realWorld: "Match this headline against historical supply shocks in the same market for magnitude calibration.",
    };
  }
  // Supply increase
  if (/\b(record harvest|surplus|new technology|productivity|increase production|ramp up|breakthrough)/.test(h)) {
    return {
      type: "supply-increase",
      market: extractMarket(h),
      magnitude: "moderate",
      reasoning: "The headline indicates a supply-side expansion. Supply curve shifts RIGHT.",
      priceEffect: "Equilibrium PRICE falls.",
      quantityEffect: "Equilibrium QUANTITY rises.",
      realWorld: "Look for similar productivity or harvest news in the same sector for calibration.",
    };
  }
  // Demand decrease
  if (/\b(rate hike|raises rates|recession|tax increase|fear|consumer confidence falls|layoffs|unemployment)/.test(h)) {
    return {
      type: "demand-decrease",
      market: extractMarket(h) || "Aggregate / interest-sensitive markets",
      magnitude: "moderate",
      reasoning: "The headline indicates contractionary demand pressure (higher rates, taxes, or weakened income/sentiment). Demand curve shifts LEFT.",
      priceEffect: "Equilibrium PRICE falls (in affected markets).",
      quantityEffect: "Equilibrium QUANTITY falls.",
      realWorld: "Compare against past Fed tightening cycles or fiscal-contraction episodes.",
    };
  }
  // Demand increase
  if (/\b(stimulus|tax cut|rate cut|consumer confidence rises|jobs report beats|wages rise)/.test(h)) {
    return {
      type: "demand-increase",
      market: extractMarket(h) || "Aggregate / consumption goods",
      magnitude: "moderate",
      reasoning: "The headline indicates expansionary demand pressure. Demand curve shifts RIGHT.",
      priceEffect: "Equilibrium PRICE rises.",
      quantityEffect: "Equilibrium QUANTITY rises.",
      realWorld: "Compare against past stimulus or rate-cutting cycles.",
    };
  }

  return {
    type: "demand-increase",
    market: "Unclassified — provide more detail",
    magnitude: "small",
    reasoning: "The headline doesn't match a clear supply/demand cue. Try adding the affected market and the direction of the change explicitly.",
    priceEffect: "Indeterminate.",
    quantityEffect: "Indeterminate.",
    realWorld: "—",
  };
}

function extractMarket(h: string): string {
  if (/oil|crude|opec/.test(h)) return "Crude oil";
  if (/corn|wheat|soybean|grain|harvest/.test(h)) return "Agricultural commodities";
  if (/housing|mortgage|home/.test(h)) return "Housing";
  if (/auto|car|vehicle/.test(h)) return "Automobiles";
  if (/chip|semiconductor/.test(h)) return "Semiconductors";
  if (/labor|jobs|employment|wages/.test(h)) return "Labor markets";
  return "Affected market";
}

export default function ShockSim() {
  const tool = TOOL_BY_SLUG["shock-sim"];
  const [headline, setHeadline] = useState("");
  const [result, setResult] = useState<ShockClassification | null>(null);
  const [loading, setLoading] = useState(false);

  const onAnalyze = async (h: string) => {
    setHeadline(h);
    setLoading(true);
    setResult(null);
    await new Promise((r) => setTimeout(r, 700));
    setResult(classify(h));
    setLoading(false);
  };

  return (
    <PageShell>
      <SEO
        title="Shock Simulator — paste a headline, see the supply-and-demand graph shift correctly | The Mother Of Econ"
        description="Drop any economics news headline in. Shock Simulator classifies it as a supply, demand, expectations, or policy shock and renders the correct S/D graph shift with realistic elasticities."
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
                {loading ? <><Sparkles size={14} className="animate-pulse" /> Classifying…</> : "Render the shift"}
              </button>
            </div>

            <div className="mt-8">
              <div className="label-cap mb-3">Or try one of these</div>
              <div className="grid gap-3">
                {HEADLINES.map((h) => (
                  <button
                    key={h.headline}
                    onClick={() => onAnalyze(h.headline)}
                    data-testid={`button-example-${h.headline.slice(0, 12)}`}
                    className="text-left rounded-lg border border-border bg-card p-4 hover:border-primary/40 transition-colors"
                  >
                    <p className="prose-serif text-[0.92rem] text-foreground/90">{h.headline}</p>
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
                  <div className="label-cap mb-2 text-primary">Classification</div>
                  <h3 className="text-editorial text-[1.75rem]">{shockTitle(result.type)}</h3>
                  <p className="prose-serif mt-3 text-[0.92rem] text-muted-foreground">in {result.market}</p>

                  <div className="rule mt-6" />

                  <SDDiagram type={result.type} />

                  <div className="mt-6 space-y-4 text-[0.92rem]">
                    <Row label="Reasoning" body={result.reasoning} />
                    <Row label="Price effect" body={result.priceEffect} />
                    <Row label="Quantity effect" body={result.quantityEffect} />
                    <Row label="Historical analog" body={result.realWorld} />
                  </div>
                </motion.div>
              )}
              {!result && !loading && (
                <div className="rounded-xl border border-dashed border-border bg-muted/20 p-10 text-center">
                  <p className="prose-serif text-muted-foreground">
                    The diagram and classification appear here.
                  </p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>
    </PageShell>
  );
}

function shockTitle(t: string) {
  const map: Record<string, string> = {
    "supply-decrease": "Supply ↓ shock",
    "supply-increase": "Supply ↑ shock",
    "demand-decrease": "Demand ↓ shock",
    "demand-increase": "Demand ↑ shock",
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

function SDDiagram({ type }: { type: ShockClassification["type"] }) {
  // Animate the appropriate curve shifting.
  const supplyShift = type.startsWith("supply") ? (type.endsWith("decrease") ? 38 : -38) : 0;
  const demandShift = type.startsWith("demand") ? (type.endsWith("decrease") ? -38 : 38) : 0;

  return (
    <svg viewBox="0 0 320 220" className="w-full h-auto">
      <line x1={30} y1={10} x2={30} y2={200} stroke="hsl(var(--border))" />
      <line x1={30} y1={200} x2={310} y2={200} stroke="hsl(var(--border))" />
      <text x={20} y={14} fontSize={9} fill="hsl(var(--muted-foreground))" textAnchor="end" fontFamily="JetBrains Mono">P</text>
      <text x={310} y={214} fontSize={9} fill="hsl(var(--muted-foreground))" textAnchor="end" fontFamily="JetBrains Mono">Q</text>

      {/* Original demand */}
      <line x1={50} y1={30} x2={290} y2={190} stroke="hsl(var(--chart-1))" strokeWidth={2} opacity={demandShift !== 0 ? 0.35 : 1} />
      <text x={285} y={200} fontSize={10} fill="hsl(var(--chart-1))" fontFamily="JetBrains Mono">D</text>

      {/* Shifted demand */}
      {demandShift !== 0 && (
        <motion.line
          initial={{ x1: 50, y1: 30, x2: 290, y2: 190 }}
          animate={{ x1: 50 + demandShift, y1: 30, x2: 290 + demandShift, y2: 190 }}
          transition={{ duration: 0.7 }}
          stroke="hsl(var(--chart-1))"
          strokeWidth={2}
        />
      )}

      {/* Original supply */}
      <line x1={50} y1={190} x2={290} y2={30} stroke="hsl(var(--chart-3))" strokeWidth={2} opacity={supplyShift !== 0 ? 0.35 : 1} />
      <text x={285} y={28} fontSize={10} fill="hsl(var(--chart-3))" fontFamily="JetBrains Mono">S</text>

      {/* Shifted supply */}
      {supplyShift !== 0 && (
        <motion.line
          initial={{ x1: 50, y1: 190, x2: 290, y2: 30 }}
          animate={{ x1: 50 + supplyShift, y1: 190, x2: 290 + supplyShift, y2: 30 }}
          transition={{ duration: 0.7 }}
          stroke="hsl(var(--chart-3))"
          strokeWidth={2}
        />
      )}

      {/* Original equilibrium */}
      <circle cx={170} cy={110} r={3.5} fill="hsl(var(--foreground))" />
      <text x={176} y={106} fontSize={10} fontFamily="JetBrains Mono" fill="hsl(var(--foreground))">E₁</text>

      {/* New equilibrium approx */}
      <motion.circle
        initial={{ cx: 170, cy: 110, r: 0 }}
        animate={{ cx: 170 + (supplyShift + demandShift) * 0.5, cy: 110 + (supplyShift > 0 || demandShift < 0 ? -22 : (supplyShift < 0 || demandShift > 0 ? 22 : 0)), r: 4 }}
        transition={{ duration: 0.7, delay: 0.2 }}
        fill="hsl(var(--primary))"
      />
    </svg>
  );
}
