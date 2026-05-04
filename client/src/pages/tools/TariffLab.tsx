import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { PageShell } from "@/components/brand/PageShell";
import { ToolPageHeader } from "@/components/brand/ToolPageHeader";
import { TOOL_BY_SLUG } from "@/lib/tools";
import { SECTORS, computeTariffImpact, Sector, TariffResult } from "@/lib/tariff-sectors";
import { SEO } from "@/components/brand/SEO";
import { TrendingDown, TrendingUp, Banknote, Users, AlertTriangle, Sparkles, Loader2 } from "lucide-react";
import { GeminiProgress } from "@/components/GeminiProgress";

interface LiveSector extends Sector {
  sources?: string[];
  priceSeries?: { month: string; index: number }[];
  tariffHistory?: string;
  retaliationRisk?: string;
  generated?: boolean;
  fetchedAt?: string;
}

export default function TariffLab() {
  const tool = TOOL_BY_SLUG["tarifflab"];
  const [customSectors, setCustomSectors] = useState<LiveSector[]>([]);
  const [sectorId, setSectorId] = useState(SECTORS[0].id);
  const [tariff, setTariff] = useState(25);
  const [sectorQuery, setSectorQuery] = useState("");
  const [fetchState, setFetchState] = useState<"idle" | "loading" | "error">("idle");
  const [fetchError, setFetchError] = useState<string | null>(null);

  const allSectors = useMemo(() => [...SECTORS, ...customSectors], [customSectors]);
  const sectorMap = useMemo(
    () => Object.fromEntries(allSectors.map((s) => [s.id, s])),
    [allSectors],
  );
  const sector = sectorMap[sectorId] || SECTORS[0];
  const liveSector = sector as LiveSector;

  const result = useMemo(() => computeTariffImpact(sector, tariff), [sector, tariff]);

  async function handleFetchLiveSector() {
    const q = sectorQuery.trim();
    if (!q) return;
    setFetchState("loading");
    setFetchError(null);
    try {
      const r = await fetch("/api/tariff-sector-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sector: q }),
      });
      const data = await r.json();
      if (!r.ok) {
        throw new Error(data.error || `HTTP ${r.status}`);
      }
      const newSector: LiveSector = {
        id: data.id,
        label: data.label,
        hsPrefix: data.hsPrefix,
        importDemandElasticity: data.importDemandElasticity,
        exportSupplyElasticity: data.exportSupplyElasticity,
        laborIntensity: data.laborIntensity,
        baselineImports: data.baselineImports,
        baselineDomesticOutput: data.baselineDomesticOutput,
        baselineWorldPrice: 100,
        description: data.description,
        sources: data.sources,
        priceSeries: data.priceSeries,
        tariffHistory: data.tariffHistory,
        retaliationRisk: data.retaliationRisk,
        generated: true,
        fetchedAt: data.fetchedAt,
      };
      setCustomSectors((prev) => {
        const without = prev.filter((s) => s.id !== newSector.id);
        return [...without, newSector];
      });
      setSectorId(newSector.id);
      setFetchState("idle");
      setSectorQuery("");
    } catch (err: any) {
      setFetchState("error");
      setFetchError(err?.message || "Fetch failed");
    }
  }

  return (
    <PageShell>
      <SEO
        title="TariffLab, deadweight loss, surplus, and employment effects of any US tariff | The Mother Of Econ"
        description="Pick a sector, set a tariff, and see the deadweight-loss triangle, consumer- and producer-surplus shifts, government revenue, and employment effects, with USITC and Peterson Institute elasticities."
        path="/tarifflab"
      />
      <ToolPageHeader tool={tool} />

      <section className="mx-auto max-w-7xl px-6 py-12 lg:px-10 lg:py-16">
        <div className="grid gap-8 lg:grid-cols-12">
          {/* CONTROLS */}
          <aside className="lg:col-span-4">
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="label-cap mb-4">Sector</div>
              <select
                value={sectorId}
                onChange={(e) => setSectorId(e.target.value)}
                data-testid="select-sector"
                className="w-full rounded-md border border-border bg-background px-3 py-2.5 font-medium focus:border-primary focus:outline-none"
              >
                <optgroup label="Curated sectors">
                  {SECTORS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label} · {s.hsPrefix}
                    </option>
                  ))}
                </optgroup>
                {customSectors.length > 0 && (
                  <optgroup label="Live (Gemini)">
                    {customSectors.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label} · {s.hsPrefix}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
              <p className="prose-serif mt-3 text-[0.85rem] text-muted-foreground">
                {sector.description}
              </p>

              {liveSector.generated && (
                <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 font-mono text-[0.65rem] uppercase tracking-widest text-primary">
                  <Sparkles size={10} /> Live · Gemini-fetched
                </div>
              )}

              <div className="rule mt-6" />

              <div className="mt-6">
                <div className="label-cap mb-2 flex items-center gap-1.5">
                  <Sparkles size={11} /> Fetch any sector (live)
                </div>
                <p className="text-[0.78rem] text-muted-foreground mb-3">
                  Type any HS-coded import (e.g. "lithium batteries", "wine", "rare earths") and Gemini will return calibrated elasticities, baselines, and a 24-month world-price series.
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={sectorQuery}
                    onChange={(e) => setSectorQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleFetchLiveSector()}
                    placeholder="lithium batteries"
                    data-testid="input-sector-query"
                    className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  />
                  <button
                    onClick={handleFetchLiveSector}
                    disabled={fetchState === "loading" || !sectorQuery.trim()}
                    data-testid="button-fetch-sector"
                    className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {fetchState === "loading" ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Sparkles size={14} />
                    )}
                    Fetch
                  </button>
                </div>
                {fetchError && (
                  <div className="mt-2 rounded-md border border-destructive/40 bg-destructive/5 p-2 text-[0.75rem] text-destructive">
                    {fetchError}
                  </div>
                )}
                <div className="mt-3">
                  <GeminiProgress
                    active={fetchState === "loading"}
                    label="Gemini is calibrating this sector"
                    etaSeconds={18}
                    stages={[
                      "Looking up HS code",
                      "Calibrating elasticities",
                      "Pulling 24 month price series",
                      "Estimating retaliation risk",
                    ]}
                  />
                </div>
              </div>

              <div className="rule mt-6" />

              <div className="mt-6">
                <div className="flex items-baseline justify-between">
                  <div className="label-cap">Tariff rate</div>
                  <div className="num-display text-[1.5rem] text-foreground">
                    {tariff}<span className="text-muted-foreground text-base">%</span>
                  </div>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={tariff}
                  onChange={(e) => setTariff(parseInt(e.target.value))}
                  data-testid="slider-tariff"
                  className="mt-3 w-full accent-primary"
                />
                <div className="flex justify-between font-mono text-[0.7rem] text-muted-foreground mt-1">
                  <span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span>
                </div>
              </div>

              <div className="rule mt-6" />

              <div className="mt-6 space-y-3 text-sm">
                <Param label="Import demand elasticity (η)" value={sector.importDemandElasticity.toFixed(2)} />
                <Param label="RoW export supply elasticity (εx)" value={sector.exportSupplyElasticity.toFixed(2)} />
                <Param label="Pass-through to domestic price" value={`${(100 * sector.exportSupplyElasticity / (sector.importDemandElasticity + sector.exportSupplyElasticity)).toFixed(0)}%`} />
                <Param label="Baseline imports" value={`$${sector.baselineImports}B`} />
                <Param label="Baseline domestic output" value={`$${sector.baselineDomesticOutput}B`} />
              </div>
            </div>

            <div className="mt-6 rounded-md border border-dashed border-border p-4 text-[0.78rem] text-muted-foreground">
              <div className="label-cap mb-2 text-foreground flex items-center gap-1.5"><AlertTriangle size={11}/> Reading the model</div>
              Linear-approximation incidence model. Pass-through = εx / (η + εx). DWL ≈ ½ · Δp · ΔQ. Full formulas on Methodology.
            </div>
          </aside>

          {/* RESULTS */}
          <div className="lg:col-span-8">
            {/* Top-line cards */}
            <div className="grid gap-4 md:grid-cols-4">
              <KPI
                label="Consumer price ↑"
                value={`+${result.priceChangePct.toFixed(1)}%`}
                tone="negative"
                info={`% change in domestic price = pass-through × tariff. Pass-through = εx / (εm + εx) = ${(100 * sector.exportSupplyElasticity / (sector.importDemandElasticity + sector.exportSupplyElasticity)).toFixed(0)}%. Base = current world price (index = 100, 2024 vintage).`}
              />
              <KPI
                label="Imports"
                value={`$${result.importQuantityNew.toFixed(1)}B`}
                sub={`from $${sector.baselineImports}B`}
                tone="negative"
                info={`New US imports of ${sector.label.toLowerCase()} after the tariff, in nominal 2024 USD billions. Computed by reducing baseline imports by import-demand elasticity × price change.`}
              />
              <KPI
                label="Gov't revenue"
                value={`$${result.governmentRevenue.toFixed(1)}B`}
                tone="positive"
                info={`Tariff rate × new import quantity, in nominal 2024 USD billions. Excludes tariff revenue lost to evasion or tariff exemptions.`}
              />
              <KPI
                label="Deadweight loss"
                value={`$${result.deadweightLoss.toFixed(1)}B`}
                tone="warning"
                highlight
                info={`Welfare loss from misallocated resources. Computed as the area of the Harberger triangle: ½ × tariff × ΔQ. Harberger (1964); see Methodology page for derivation.`}
              />
            </div>

            {/* S/D Graph */}
            <div className="mt-8 rounded-xl border border-border bg-card p-6 lg:p-8">
              <div className="flex items-baseline justify-between mb-6">
                <div>
                  <div className="label-cap mb-2">Supply / Demand · {sector.label}</div>
                  <h3 className="font-display text-[1.35rem] font-medium">Welfare incidence under {tariff}% tariff</h3>
                </div>
                <div className="hidden sm:flex items-center gap-4 text-[0.72rem] font-mono">
                  <Legend color="hsl(var(--chart-1))" label="CS loss" />
                  <Legend color="hsl(var(--chart-3))" label="PS gain" />
                  <Legend color="hsl(var(--chart-2))" label="Gov rev" />
                  <Legend color="hsl(var(--destructive))" label="DWL" />
                </div>
              </div>

              <SDGraph result={result} />
            </div>

            {/* Live price series, only when Gemini-generated sector */}
            {liveSector.priceSeries && liveSector.priceSeries.length > 0 && (
              <div className="mt-8 rounded-xl border border-primary/30 bg-card p-6 lg:p-8">
                <div className="flex items-baseline justify-between mb-4">
                  <div>
                    <div className="label-cap mb-2 flex items-center gap-1.5">
                      <Sparkles size={11} /> 24-month world-price index
                    </div>
                    <h3 className="font-display text-[1.35rem] font-medium">{liveSector.label}</h3>
                  </div>
                  {liveSector.fetchedAt && (
                    <div className="font-mono text-[0.65rem] text-muted-foreground">
                      Fetched {new Date(liveSector.fetchedAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
                <PriceSeriesChart series={liveSector.priceSeries} />
                {(liveSector.tariffHistory || liveSector.retaliationRisk) && (
                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    {liveSector.tariffHistory && (
                      <div className="rounded-md border border-border p-4">
                        <div className="label-cap mb-2">Recent tariff history</div>
                        <p className="prose-serif text-[0.9rem] text-foreground/85">{liveSector.tariffHistory}</p>
                      </div>
                    )}
                    {liveSector.retaliationRisk && (
                      <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4">
                        <div className="label-cap mb-2 text-destructive">Retaliation risk</div>
                        <p className="prose-serif text-[0.9rem] text-foreground/85">{liveSector.retaliationRisk}</p>
                      </div>
                    )}
                  </div>
                )}
                {liveSector.sources && liveSector.sources.length > 0 && (
                  <div className="mt-4 font-mono text-[0.7rem] text-muted-foreground">
                    Sources: {liveSector.sources.join(" · ")}
                  </div>
                )}
              </div>
            )}

            {/* Welfare breakdown */}
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              <Outcome
                icon={<TrendingDown size={18} />}
                label="Consumer surplus"
                primary={`-$${result.consumerSurplusLoss.toFixed(1)}B`}
                body="Higher prices reduce consumer welfare. The trapezoid under demand between the old and new prices."
                tone="negative"
              />
              <Outcome
                icon={<TrendingUp size={18} />}
                label="Producer surplus"
                primary={`+$${result.producerSurplusGain.toFixed(1)}B`}
                body="Domestic producers gain. The rectangle under the new domestic price across baseline output."
                tone="positive"
              />
              <Outcome
                icon={<Banknote size={18} />}
                label="Government revenue"
                primary={`+$${result.governmentRevenue.toFixed(1)}B`}
                body="Tariff rate × imports under the new equilibrium."
                tone="positive"
              />
            </div>

            {/* Net effect + employment */}
            <div className="mt-8 rounded-xl border border-primary/30 bg-primary/5 p-6 lg:p-8">
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <div className="label-cap mb-2 text-primary">Net national welfare</div>
                  <div className="num-display text-[2.25rem] text-foreground">
                    {result.netNationalLoss > 0 ? "−" : "+"}${Math.abs(result.netNationalLoss).toFixed(1)}B
                  </div>
                  <p className="prose-serif mt-3 text-[0.92rem] text-foreground/85">
                    The net welfare change once consumer losses, producer gains, and government revenue are netted out. Negative values indicate the tariff destroys more welfare than it creates.
                  </p>
                </div>
                <div className="border-l border-primary/20 pl-6">
                  <div className="label-cap mb-2 text-primary flex items-center gap-1.5"><Users size={11}/> Employment</div>
                  <div className="grid gap-3">
                    <div>
                      <div className="font-mono text-[0.7rem] uppercase tracking-widest text-muted-foreground">Domestic jobs gained</div>
                      <div className="num-display text-[1.5rem] text-foreground">+{result.employmentGainJobs.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="font-mono text-[0.7rem] uppercase tracking-widest text-muted-foreground">Jobs at risk from retaliation</div>
                      <div className="num-display text-[1.5rem] text-destructive">−{result.employmentLostFromRetaliation.toLocaleString()}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Plain-English read */}
            <div className="mt-8 rounded-xl border border-border bg-card p-6 lg:p-8">
              <div className="label-cap mb-3">Plain-English read</div>
              <p className="prose-serif text-[1rem] text-foreground/90">
                A <strong>{tariff}%</strong> tariff on <strong>{sector.label.toLowerCase()}</strong> raises consumer prices by{" "}
                <strong className="text-primary">{result.priceChangePct.toFixed(1)}%</strong>, cuts imports by{" "}
                <strong>${Math.abs(result.importQuantityDelta).toFixed(1)}B</strong>, and generates{" "}
                <strong>${result.governmentRevenue.toFixed(1)}B</strong> in tariff revenue. Domestic producers see roughly{" "}
                <strong>${result.producerSurplusGain.toFixed(1)}B</strong> in producer-surplus gains, but consumers lose{" "}
                <strong>${result.consumerSurplusLoss.toFixed(1)}B</strong>. The deadweight-loss triangle , {" "}
                <strong className="text-destructive">${result.deadweightLoss.toFixed(1)}B</strong>, is welfare that simply disappears, regardless of who you tax.
              </p>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}

function Param({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono text-foreground">{value}</span>
    </div>
  );
}

function KPI({ label, value, sub, tone, highlight, info }: { label: string; value: string; sub?: string; tone: "positive" | "negative" | "warning"; highlight?: boolean; info?: string }) {
  const toneCls =
    tone === "positive" ? "text-emerald-700 dark:text-emerald-400"
    : tone === "negative" ? "text-foreground"
    : "text-destructive";
  return (
    <div className={`group relative rounded-lg border bg-card p-4 ${highlight ? "border-primary/40 shadow-sm" : "border-border"}`}>
      <div className="flex items-center gap-1.5">
        <div className="label-cap text-[0.6rem]">{label}</div>
        {info && (
          <span
            tabIndex={0}
            role="button"
            aria-label={`What is this metric? ${info}`}
            title={info}
            className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full border border-muted-foreground/40 text-[8px] font-bold text-muted-foreground hover:border-primary hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary cursor-help"
          >
            i
          </span>
        )}
      </div>
      <div className={`num-display mt-2 text-[1.6rem] leading-none ${toneCls}`}>{value}</div>
      {sub && <div className="mt-1 font-mono text-[0.7rem] text-muted-foreground">{sub}</div>}
    </div>
  );
}

function Outcome({ icon, label, primary, body, tone }: { icon: React.ReactNode; label: string; primary: string; body: string; tone: "positive" | "negative" }) {
  const cls = tone === "positive" ? "text-emerald-700 dark:text-emerald-400" : "text-destructive";
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-center gap-2 text-muted-foreground">{icon}<span className="label-cap">{label}</span></div>
      <div className={`num-display mt-3 text-[1.75rem] leading-none ${cls}`}>{primary}</div>
      <p className="prose-serif mt-3 text-[0.85rem] text-muted-foreground">{body}</p>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="block h-2.5 w-2.5 rounded-sm" style={{ background: color }} />
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
}

// Drew an inline SVG S/D graph. We construct a simple linear-supply / linear-demand
// diagram with shaded welfare regions. Coordinates in the 600x360 box.
function SDGraph({ result }: { result: TariffResult }) {
  const W = 720;
  const H = 360;
  const pad = { l: 60, r: 30, t: 24, b: 50 };
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;

  // Quantity axis: 0 to 1.4× sector total consumption baseline
  const qMax = (result.sector.baselineImports + result.sector.baselineDomesticOutput) * 1.25;
  const pMax = result.chart.pWorld * 2.0;

  const x = (q: number) => pad.l + (q / qMax) * innerW;
  const y = (p: number) => pad.t + innerH - (p / pMax) * innerH;

  // Demand line: passes through (0, 2*pWorld) and (qMax, 0), hand-calibrated for nice slope
  const demand = (q: number) => {
    const m = -(pMax - result.chart.pWorld * 0.4) / qMax;
    return Math.max(0, pMax + m * q);
  };

  // Supply (domestic): passes through (0, 0.4*pWorld) and (qDomestic, pWorld)
  const qDomesticBaseline = result.sector.baselineDomesticOutput * 0.7;
  const supplyDomestic = (q: number) => {
    const m = (result.chart.pWorld - result.chart.pWorld * 0.4) / Math.max(1, qDomesticBaseline);
    return result.chart.pWorld * 0.4 + m * q;
  };

  // World price line
  const pW = result.chart.pWorld;
  const pT = result.chart.pDomestic;

  // Quantities at the world price
  const qConsumeFreeTrade = solveDemand(pW, demand, qMax);
  const qProduceFreeTrade = solveSupply(pW, supplyDomestic, qMax);
  const qConsumeTariff = solveDemand(pT, demand, qMax);
  const qProduceTariff = solveSupply(pT, supplyDomestic, qMax);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Supply and demand graph">
      {/* axes */}
      <line x1={pad.l} y1={pad.t} x2={pad.l} y2={H - pad.b} stroke="hsl(var(--border))" />
      <line x1={pad.l} y1={H - pad.b} x2={W - pad.r} y2={H - pad.b} stroke="hsl(var(--border))" />
      <text x={pad.l - 8} y={pad.t} fill="hsl(var(--muted-foreground))" fontSize="10" textAnchor="end" fontFamily="JetBrains Mono">P</text>
      <text x={W - pad.r} y={H - pad.b + 18} fill="hsl(var(--muted-foreground))" fontSize="10" textAnchor="end" fontFamily="JetBrains Mono">Q</text>

      {/* DWL triangle (right side: deadweight on imports) */}
      <motion.polygon
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        points={`
          ${x(qConsumeTariff)},${y(pT)}
          ${x(qConsumeFreeTrade)},${y(pW)}
          ${x(qConsumeTariff)},${y(pW)}
        `}
        fill="hsl(var(--destructive) / 0.35)"
      />
      {/* DWL production-side */}
      <polygon
        points={`
          ${x(qProduceFreeTrade)},${y(pW)}
          ${x(qProduceTariff)},${y(pT)}
          ${x(qProduceFreeTrade)},${y(pT)}
        `}
        fill="hsl(var(--destructive) / 0.35)"
      />

      {/* Government revenue (rectangle on imports between qProduceTariff and qConsumeTariff at height pT-pW) */}
      <rect
        x={x(qProduceTariff)}
        y={y(pT)}
        width={x(qConsumeTariff) - x(qProduceTariff)}
        height={y(pW) - y(pT)}
        fill="hsl(var(--chart-2) / 0.45)"
      />

      {/* Producer surplus gain (small rectangle from 0 to qProduceFreeTrade between pW and pT) */}
      <rect
        x={pad.l}
        y={y(pT)}
        width={x(qProduceFreeTrade) - pad.l}
        height={y(pW) - y(pT)}
        fill="hsl(var(--chart-3) / 0.45)"
      />

      {/* CS loss highlight, the slim trapezoid above pW between qConsumeTariff and qConsumeFreeTrade */}
      <rect
        x={pad.l}
        y={y(pT)}
        width={x(qConsumeTariff) - pad.l}
        height={y(pW) - y(pT)}
        fill="hsl(var(--chart-1) / 0.10)"
      />

      {/* Demand & Supply curves */}
      <Curve fn={demand} qMax={qMax} x={x} y={y} stroke="hsl(var(--chart-1))" label="D" labelPos={{ q: qMax * 0.95, p: demand(qMax * 0.95) }} />
      <Curve fn={supplyDomestic} qMax={qDomesticBaseline * 1.4} x={x} y={y} stroke="hsl(var(--chart-3))" label="S (domestic)" labelPos={{ q: qDomesticBaseline * 1.35, p: supplyDomestic(qDomesticBaseline * 1.35) }} />

      {/* World price line */}
      <line x1={pad.l} y1={y(pW)} x2={W - pad.r} y2={y(pW)} stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" />
      <text x={W - pad.r - 4} y={y(pW) - 4} textAnchor="end" fontSize="10" fontFamily="JetBrains Mono" fill="hsl(var(--muted-foreground))">P_world</text>

      {/* Tariff price line */}
      <motion.line
        x1={pad.l}
        y1={y(pT)}
        x2={W - pad.r}
        y2={y(pT)}
        stroke="hsl(var(--primary))"
        strokeDasharray="4 4"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.6 }}
      />
      <text x={W - pad.r - 4} y={y(pT) - 4} textAnchor="end" fontSize="10" fontFamily="JetBrains Mono" fill="hsl(var(--primary))">P_tariff</text>

      {/* Q markers */}
      <line x1={x(qProduceFreeTrade)} y1={H - pad.b} x2={x(qProduceFreeTrade)} y2={y(pW)} stroke="hsl(var(--border))" strokeDasharray="2 2" />
      <line x1={x(qConsumeFreeTrade)} y1={H - pad.b} x2={x(qConsumeFreeTrade)} y2={y(pW)} stroke="hsl(var(--border))" strokeDasharray="2 2" />
      <line x1={x(qProduceTariff)} y1={H - pad.b} x2={x(qProduceTariff)} y2={y(pT)} stroke="hsl(var(--primary) / 0.4)" strokeDasharray="2 2" />
      <line x1={x(qConsumeTariff)} y1={H - pad.b} x2={x(qConsumeTariff)} y2={y(pT)} stroke="hsl(var(--primary) / 0.4)" strokeDasharray="2 2" />
    </svg>
  );
}

function Curve({ fn, qMax, x, y, stroke, label, labelPos }: any) {
  const points: string[] = [];
  const N = 80;
  for (let i = 0; i <= N; i++) {
    const q = (i / N) * qMax;
    const p = fn(q);
    if (p >= 0) points.push(`${x(q)},${y(p)}`);
  }
  return (
    <>
      <polyline points={points.join(" ")} fill="none" stroke={stroke} strokeWidth={2} />
      {label && labelPos && (
        <text x={x(labelPos.q) + 6} y={y(labelPos.p)} fontFamily="JetBrains Mono" fontSize="11" fill={stroke}>
          {label}
        </text>
      )}
    </>
  );
}

function solveDemand(p: number, fn: (q: number) => number, qMax: number): number {
  // bisection
  let lo = 0, hi = qMax;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (fn(mid) > p) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

function solveSupply(p: number, fn: (q: number) => number, qMax: number): number {
  let lo = 0, hi = qMax;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (fn(mid) < p) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

function PriceSeriesChart({ series }: { series: { month: string; index: number }[] }) {
  if (!series || series.length === 0) return null;
  const W = 720;
  const H = 260;
  const pad = { l: 50, r: 30, t: 20, b: 40 };
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;

  const values = series.map((s) => s.index);
  const minV = Math.min(...values, 80);
  const maxV = Math.max(...values, 120);
  const range = Math.max(1, maxV - minV);
  const padded = range * 0.1;
  const lo = minV - padded;
  const hi = maxV + padded;

  const x = (i: number) => pad.l + (i / Math.max(1, series.length - 1)) * innerW;
  const y = (v: number) => pad.t + innerH - ((v - lo) / (hi - lo)) * innerH;

  const linePoints = series.map((s, i) => `${x(i)},${y(s.index)}`).join(" ");
  const areaPath =
    `M ${x(0)},${y(lo)} ` +
    series.map((s, i) => `L ${x(i)},${y(s.index)}`).join(" ") +
    ` L ${x(series.length - 1)},${y(lo)} Z`;

  // y-axis ticks
  const yTicks = 4;
  const yTickValues = Array.from({ length: yTicks + 1 }, (_, i) => lo + ((hi - lo) * i) / yTicks);

  // x-axis: show every ~6th month
  const xLabelEvery = Math.max(1, Math.floor(series.length / 6));

  const last = series[series.length - 1];
  const first = series[0];
  const totalChange = ((last.index - first.index) / first.index) * 100;

  return (
    <div>
      <div className="mb-3 flex items-baseline gap-4">
        <div className="num-display text-[1.75rem] text-foreground">{last.index.toFixed(1)}</div>
        <div
          className={`font-mono text-[0.85rem] ${
            totalChange >= 0 ? "text-emerald-700 dark:text-emerald-400" : "text-destructive"
          }`}
        >
          {totalChange >= 0 ? "+" : ""}
          {totalChange.toFixed(1)}% over 24 months
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="World price index time series">
        {/* gridlines */}
        {yTickValues.map((v, i) => (
          <g key={i}>
            <line
              x1={pad.l}
              y1={y(v)}
              x2={W - pad.r}
              y2={y(v)}
              stroke="hsl(var(--border))"
              strokeDasharray="2 4"
              opacity={0.4}
            />
            <text
              x={pad.l - 6}
              y={y(v) + 3}
              textAnchor="end"
              fontSize="10"
              fontFamily="JetBrains Mono"
              fill="hsl(var(--muted-foreground))"
            >
              {v.toFixed(0)}
            </text>
          </g>
        ))}

        {/* axes */}
        <line x1={pad.l} y1={pad.t} x2={pad.l} y2={H - pad.b} stroke="hsl(var(--border))" />
        <line x1={pad.l} y1={H - pad.b} x2={W - pad.r} y2={H - pad.b} stroke="hsl(var(--border))" />

        {/* area under curve */}
        <motion.path
          d={areaPath}
          fill="hsl(var(--primary) / 0.12)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        />

        {/* line */}
        <motion.polyline
          points={linePoints}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth={2.25}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />

        {/* x labels */}
        {series.map((s, i) =>
          i % xLabelEvery === 0 || i === series.length - 1 ? (
            <text
              key={i}
              x={x(i)}
              y={H - pad.b + 16}
              textAnchor="middle"
              fontSize="9"
              fontFamily="JetBrains Mono"
              fill="hsl(var(--muted-foreground))"
            >
              {s.month}
            </text>
          ) : null,
        )}

        {/* last point marker */}
        <circle
          cx={x(series.length - 1)}
          cy={y(last.index)}
          r={4}
          fill="hsl(var(--primary))"
          stroke="hsl(var(--background))"
          strokeWidth={2}
        />
      </svg>
    </div>
  );
}
