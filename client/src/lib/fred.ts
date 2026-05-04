// FRED client helper, talks to /api/fred (Netlify Function proxy).
// Never exposes the API key; always goes through the proxy.

import { apiRequest } from "@/lib/queryClient";

export interface FredObservation {
  date: string;
  value: string;
}

export interface FredResponse {
  series_id: string;
  count: number;
  observations: FredObservation[];
  meta: { units: string; frequency: string };
}

export interface FredSearchHit {
  id: string;
  title: string;
  units?: string;
  frequency?: string;
  popularity?: number;
  notes?: string;
}

/**
 * Fetch observations for a FRED series.
 *
 * @param seriesId  e.g. "CPIAUCSL", "FEDFUNDS", "T5YIE", "UNRATE"
 * @param opts.units  "lin" | "pc1" (YoY % chg) | "pch" | "log"
 * @param opts.start ISO date (YYYY-MM-DD)
 * @param opts.end   ISO date
 * @param opts.frequency  "d" | "w" | "m" | "q" | "a"
 * @param opts.latestOnly  if true, returns only most recent observation
 */
export async function fredObservations(
  seriesId: string,
  opts: {
    units?: "lin" | "pc1" | "pch" | "log";
    start?: string;
    end?: string;
    frequency?: "d" | "w" | "m" | "q" | "a";
    limit?: number;
    latestOnly?: boolean;
  } = {}
): Promise<FredResponse> {
  const params = new URLSearchParams({ series_id: seriesId });
  if (opts.units) params.set("units", opts.units);
  if (opts.start) params.set("observation_start", opts.start);
  if (opts.end) params.set("observation_end", opts.end);
  if (opts.frequency) params.set("frequency", opts.frequency);
  if (opts.limit) params.set("limit", String(opts.limit));
  if (opts.latestOnly) params.set("op", "latest");

  const r = await apiRequest("GET", `/api/fred?${params.toString()}`);
  if (!r.ok) throw new Error(`FRED ${r.status}`);
  return r.json();
}

/** Latest numeric value of a series (NaN if unavailable). */
export async function fredLatest(
  seriesId: string,
  units?: "lin" | "pc1" | "pch"
): Promise<{ value: number; date: string } | null> {
  try {
    const r = await fredObservations(seriesId, { units, latestOnly: true });
    const obs = r.observations[0];
    if (!obs) return null;
    const v = Number(obs.value);
    if (!Number.isFinite(v)) return null;
    return { value: v, date: obs.date };
  } catch {
    return null;
  }
}

/** Search FRED's series catalog. */
export async function fredSearch(text: string, limit = 20): Promise<FredSearchHit[]> {
  const params = new URLSearchParams({ op: "search", text, limit: String(limit) });
  const r = await apiRequest("GET", `/api/fred?${params.toString()}`);
  if (!r.ok) throw new Error(`FRED search ${r.status}`);
  const data = await r.json();
  return (data?.seriess || data?.results || []).map((s: any) => ({
    id: s.id,
    title: s.title,
    units: s.units_short || s.units,
    frequency: s.frequency_short || s.frequency,
    popularity: s.popularity,
    notes: s.notes?.slice(0, 240),
  }));
}

/**
 * Convenience: pull every input the Inflation Decomposer needs from FRED.
 * Returns a partial DecomposeInput (numeric); caller merges with defaults.
 */
export interface FredInflationSnapshot {
  asOf: string; // most recent observation date encountered
  headlineCpi?: number;       // CPIAUCSL pc1
  energyYoY?: number;         // CPIENGSL pc1
  foodYoY?: number;           // CPIUFDSL pc1
  vacancyToUnemployment?: number; // JTSJOL / UNEMPLOY
  breakeven5y?: number;       // T5YIE
  fedFundsRate?: number;      // FEDFUNDS
  outputGap?: number;         // (GDPC1 - GDPPOT) / GDPPOT × 100
  partial: boolean;
}

export async function fetchInflationSnapshot(): Promise<FredInflationSnapshot> {
  const out: FredInflationSnapshot = { asOf: "", partial: false };
  let asOf = "";

  const tasks: Promise<void>[] = [
    fredLatest("CPIAUCSL", "pc1").then((r) => {
      if (r) { out.headlineCpi = round(r.value, 2); asOf = max(asOf, r.date); }
      else out.partial = true;
    }),
    fredLatest("CPIENGSL", "pc1").then((r) => {
      if (r) { out.energyYoY = round(r.value, 2); asOf = max(asOf, r.date); }
      else out.partial = true;
    }),
    fredLatest("CPIUFDSL", "pc1").then((r) => {
      if (r) { out.foodYoY = round(r.value, 2); asOf = max(asOf, r.date); }
      else out.partial = true;
    }),
    fredLatest("T5YIE").then((r) => {
      if (r) { out.breakeven5y = round(r.value, 2); asOf = max(asOf, r.date); }
      else out.partial = true;
    }),
    fredLatest("FEDFUNDS").then((r) => {
      if (r) { out.fedFundsRate = round(r.value, 2); asOf = max(asOf, r.date); }
      else out.partial = true;
    }),
    Promise.all([fredLatest("JTSJOL"), fredLatest("UNEMPLOY")]).then(([j, u]) => {
      if (j && u && u.value > 0) {
        out.vacancyToUnemployment = round(j.value / u.value, 2);
        asOf = max(asOf, j.date);
      } else out.partial = true;
    }),
    Promise.all([fredLatest("GDPC1"), fredLatest("GDPPOT")]).then(([g, p]) => {
      if (g && p && p.value > 0) {
        out.outputGap = round(((g.value - p.value) / p.value) * 100, 2);
        asOf = max(asOf, g.date);
      } else out.partial = true;
    }),
  ];

  await Promise.all(tasks);
  out.asOf = asOf || new Date().toISOString().slice(0, 10);
  return out;
}

function round(v: number, d: number) {
  const k = Math.pow(10, d);
  return Math.round(v * k) / k;
}
function max(a: string, b: string) { return a > b ? a : b; }
