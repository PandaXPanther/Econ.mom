// Sector-level elasticities and baseline market data for TariffLab
// Elasticities calibrated to USITC TPIS and Kee, Nicita & Olarreaga (2008).
// Baselines are representative 2024-vintage annual figures (in $B).

export interface Sector {
  id: string;
  label: string;
  hsPrefix: string;
  importDemandElasticity: number;  // |εm|, positive
  exportSupplyElasticity: number;  // εx_row (rest of world), positive
  laborIntensity: number;          // jobs per $M output (sector-specific)
  baselineImports: number;          // $B
  baselineDomesticOutput: number;   // $B
  baselineWorldPrice: number;       // index, 100 = 2024
  description: string;
}

// These numbers are illustrative starting points. They can be swapped for the
// Gemini-generated dataset once you wish.
export const SECTORS: Sector[] = [
  {
    id: "steel",
    label: "Steel (iron & steel products)",
    hsPrefix: "HS 72",
    importDemandElasticity: 2.8,
    exportSupplyElasticity: 3.5,
    laborIntensity: 1.4,
    baselineImports: 32,
    baselineDomesticOutput: 115,
    baselineWorldPrice: 100,
    description: "Flat-rolled steel, rebar, wire rod. Historically politically salient.",
  },
  {
    id: "aluminum",
    label: "Aluminum",
    hsPrefix: "HS 76",
    importDemandElasticity: 2.4,
    exportSupplyElasticity: 4.0,
    laborIntensity: 1.1,
    baselineImports: 20,
    baselineDomesticOutput: 42,
    baselineWorldPrice: 100,
    description: "Primary and semi-fabricated aluminum products.",
  },
  {
    id: "solar",
    label: "Solar modules",
    hsPrefix: "HS 8541.43",
    importDemandElasticity: 3.5,
    exportSupplyElasticity: 5.0,
    laborIntensity: 1.8,
    baselineImports: 16,
    baselineDomesticOutput: 8,
    baselineWorldPrice: 100,
    description: "Photovoltaic cells assembled into modules. Heavy import exposure.",
  },
  {
    id: "ev",
    label: "Electric vehicles",
    hsPrefix: "HS 8703.80",
    importDemandElasticity: 2.2,
    exportSupplyElasticity: 2.8,
    laborIntensity: 2.3,
    baselineImports: 14,
    baselineDomesticOutput: 92,
    baselineWorldPrice: 100,
    description: "Passenger battery-electric vehicles. Trade policy flashpoint 2024–26.",
  },
  {
    id: "semiconductors",
    label: "Semiconductors & integrated circuits",
    hsPrefix: "HS 8542",
    importDemandElasticity: 1.6,
    exportSupplyElasticity: 2.1,
    laborIntensity: 1.6,
    baselineImports: 78,
    baselineDomesticOutput: 66,
    baselineWorldPrice: 100,
    description: "Microprocessors, memory, logic ICs. Low substitutability short-run.",
  },
  {
    id: "apparel",
    label: "Apparel (knit & woven)",
    hsPrefix: "HS 61 & 62",
    importDemandElasticity: 4.2,
    exportSupplyElasticity: 6.5,
    laborIntensity: 3.1,
    baselineImports: 82,
    baselineDomesticOutput: 12,
    baselineWorldPrice: 100,
    description: "Finished clothing. Extremely high elasticity; import-dependent.",
  },
  {
    id: "agriculture",
    label: "Agricultural commodities",
    hsPrefix: "HS 10 & 12",
    importDemandElasticity: 1.9,
    exportSupplyElasticity: 2.5,
    laborIntensity: 2.4,
    baselineImports: 44,
    baselineDomesticOutput: 210,
    baselineWorldPrice: 100,
    description: "Grains, oilseeds. US is a net exporter; retaliation risk is real.",
  },
  {
    id: "autoparts",
    label: "Auto parts",
    hsPrefix: "HS 8708",
    importDemandElasticity: 2.6,
    exportSupplyElasticity: 3.2,
    laborIntensity: 2.0,
    baselineImports: 88,
    baselineDomesticOutput: 180,
    baselineWorldPrice: 100,
    description: "Engines, transmissions, components. Deep supply-chain integration with Mexico.",
  },
];

export const SECTOR_BY_ID = Object.fromEntries(SECTORS.map((s) => [s.id, s]));

// Linear-approximation tariff incidence model.
// Let t = tariff rate, η = import demand elasticity, εx = RoW export supply elasticity.
// Share of tariff borne by domestic consumers = εx / (η + εx)
// Price rise to consumers Δp/p = t × εx / (η + εx).
// Quantity fall: Δq/q = -η × Δp/p.
// DWL triangle ≈ 0.5 × Δp × Δq (in dollar terms).
// Revenue = t × p_world × Q_imports_new.
// Consumer surplus loss = trapezoid = Δp × Q_new + 0.5 × Δp × (Q_old - Q_new).
// Producer surplus gain (domestic) = Δp × Q_domestic_baseline (small-domestic approx).
// Employment change ≈ (ΔQ_domestic) × laborIntensity.

export interface TariffResult {
  sector: Sector;
  tariffRate: number; // as decimal, e.g. 0.25

  priceChangePct: number;
  consumerPriceIndex: number;  // new world price basis 100
  importQuantityNew: number;   // $B
  importQuantityDelta: number; // $B (should be negative)

  consumerSurplusLoss: number; // $B
  producerSurplusGain: number; // $B
  governmentRevenue: number;   // $B
  deadweightLoss: number;      // $B
  netNationalLoss: number;     // $B (CS loss - PS gain - Gov rev)

  domesticOutputGain: number;   // $B
  employmentGainJobs: number;   // jobs (positive = gained)
  employmentLostFromRetaliation: number; // jobs lost (estimate)

  // for drawing the S/D graph
  chart: {
    qFreeTrade: number;
    qPostTariff: number;
    pWorld: number;
    pDomestic: number;
  };
}

export function computeTariffImpact(sector: Sector, tariffPct: number): TariffResult {
  const t = tariffPct / 100;
  const passThrough = sector.exportSupplyElasticity / (sector.importDemandElasticity + sector.exportSupplyElasticity);
  const priceChange = t * passThrough;

  const qOld = sector.baselineImports;
  const qNew = qOld * (1 - sector.importDemandElasticity * priceChange);
  const qNewClamped = Math.max(qNew, qOld * 0.05);

  const pWorld = sector.baselineWorldPrice;
  const pDomestic = pWorld * (1 + priceChange);

  // Consumer surplus loss (trapezoid, in $B roughly = priceChange × average quantity)
  const csLoss = priceChange * pWorld / 100 * (qOld + qNewClamped) / 2 + (sector.baselineDomesticOutput * priceChange * 0.6);
  // Simpler: CS loss ≈ Δp/p × total consumption
  const totalConsumption = qOld + sector.baselineDomesticOutput;
  const csLossSimple = priceChange * totalConsumption;

  // Producer surplus gain ≈ Δp × domestic output
  const psGain = priceChange * sector.baselineDomesticOutput * 0.9;

  // Government revenue = tariff × new imports (in $B)
  const revenue = t * pWorld / 100 * qNewClamped;

  // DWL = 0.5 × Δp × ΔQ_imports (approximation, in $B)
  const dwl = 0.5 * priceChange * (qOld - qNewClamped);
  // Add production inefficiency triangle (small-country approx)
  const productionInefficiency = 0.5 * priceChange * sector.baselineDomesticOutput * 0.1;
  const totalDwl = dwl + productionInefficiency;

  const domesticOutputGain = sector.baselineDomesticOutput * priceChange * 0.8;
  // Employment: jobs gained in domestic sector
  const jobsGained = domesticOutputGain * 1000 * sector.laborIntensity;  // $B → $M × labor intensity
  // Retaliation estimate: ~60% of sector export value at risk, with 0.3 pass-through
  const retaliationJobsLost = sector.baselineDomesticOutput * 0.25 * (t * 0.3) * 1000 * sector.laborIntensity;

  const netNationalLoss = csLossSimple - psGain - revenue;

  return {
    sector,
    tariffRate: t,
    priceChangePct: priceChange * 100,
    consumerPriceIndex: 100 * (1 + priceChange),
    importQuantityNew: qNewClamped,
    importQuantityDelta: qNewClamped - qOld,
    consumerSurplusLoss: csLossSimple,
    producerSurplusGain: psGain,
    governmentRevenue: revenue,
    deadweightLoss: totalDwl,
    netNationalLoss,
    domesticOutputGain,
    employmentGainJobs: Math.round(jobsGained),
    employmentLostFromRetaliation: Math.round(retaliationJobsLost),
    chart: {
      qFreeTrade: qOld,
      qPostTariff: qNewClamped,
      pWorld: pWorld,
      pDomestic: pDomestic,
    },
  };
}
