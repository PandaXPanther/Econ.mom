// Netlify Function: FRED proxy.
// Hides FRED_API_KEY server-side; lets the client request any series safely.
// Usage from client:
//   GET /api/fred?series_id=CPIAUCSL&observation_start=2020-01-01&units=pc1
// Optional `op=latest` returns the most recent observation only.

import type { Handler } from "@netlify/functions";

const FRED_BASE = "https://api.stlouisfed.org/fred";

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return jsonResp(405, { error: "Method not allowed" });
  }

  const apiKey = process.env.FRED_API_KEY;
  if (!apiKey) {
    return jsonResp(503, {
      error: "FRED unavailable: FRED_API_KEY not configured.",
    });
  }

  const qs = event.queryStringParameters || {};
  const op = (qs.op || "observations").toLowerCase();

  // Allow series search too
  if (op === "search") {
    const text = qs.text || "";
    if (!text) return jsonResp(400, { error: "Missing text param." });
    const url = `${FRED_BASE}/series/search?search_text=${encodeURIComponent(
      text
    )}&limit=${qs.limit || "20"}&order_by=popularity&sort_order=desc&file_type=json&api_key=${apiKey}`;
    const r = await fetch(url);
    if (!r.ok) return jsonResp(502, { error: `FRED ${r.status}` });
    return jsonResp(200, await r.json());
  }

  const series = qs.series_id;
  if (!series) return jsonResp(400, { error: "Missing series_id." });

  const params = new URLSearchParams({
    series_id: series,
    api_key: apiKey,
    file_type: "json",
  });
  if (qs.observation_start) params.set("observation_start", qs.observation_start);
  if (qs.observation_end) params.set("observation_end", qs.observation_end);
  if (qs.units) params.set("units", qs.units); // pc1 = YoY % change
  if (qs.frequency) params.set("frequency", qs.frequency);
  if (qs.aggregation_method) params.set("aggregation_method", qs.aggregation_method);
  if (qs.limit) params.set("limit", qs.limit);
  if (qs.sort_order) params.set("sort_order", qs.sort_order);

  if (op === "latest") {
    params.set("sort_order", "desc");
    params.set("limit", "1");
  }

  const url = `${FRED_BASE}/series/observations?${params.toString()}`;
  try {
    const r = await fetch(url);
    if (!r.ok) {
      const t = await r.text();
      return jsonResp(502, { error: `FRED ${r.status}`, detail: t.slice(0, 300) });
    }
    const data: any = await r.json();
    // Strip "." (FRED missing-value sentinel)
    const observations = (data.observations || []).filter(
      (o: any) => o.value !== "."
    );
    return jsonResp(200, {
      series_id: series,
      count: observations.length,
      observations,
      meta: { units: qs.units || "lin", frequency: qs.frequency || "auto" },
    });
  } catch (err: any) {
    return jsonResp(500, { error: err?.message || "FRED fetch failed" });
  }
};

function jsonResp(statusCode: number, body: unknown) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=300", // 5 min CDN cache
    },
    body: JSON.stringify(body),
  };
}
