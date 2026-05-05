// Netlify Function: Gemini-powered shock interpreter for ShockSim.
// Takes a free-form headline and returns S/D shock parameters with numbers.

import type { Handler } from "@netlify/functions";

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") return jsonResp(405, { error: "Method not allowed" });
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return jsonResp(503, { error: "GEMINI_API_KEY not configured." });

  let body: any;
  try { body = JSON.parse(event.body || "{}"); } catch { return jsonResp(400, { error: "Invalid JSON body" }); }
  const headline = String(body.headline || "").slice(0, 400).trim();
  if (!headline) return jsonResp(400, { error: "Missing headline." });

  const prompt = `You are an AP-level microeconomics professor. Classify this real-world headline as an S/D shock and quantify it.

Headline: "${headline}"

Return ONLY JSON in this shape (no markdown):

{
  "type": "demand_increase" | "demand_decrease" | "supply_increase" | "supply_decrease",
  "market": string,                          // 2-5 word label, e.g. "US natural gas"
  "magnitude": "small" | "medium" | "large",
  "priceChangePct": number,                  // expected % change in equilibrium price, signed
  "quantityChangePct": number,               // expected % change in equilibrium quantity, signed
  "elasticityDemand": number,                // |εd|, typical 0.2-3.0
  "elasticitySupply": number,                // |εs|, typical 0.3-4.0
  "shiftPct": number,                        // % horizontal shift of the affected curve
  "reasoning": string,                       // 2-3 sentences citing real elasticity ranges
  "historicalAnalogs": [
    { "event": string, "year": number, "outcome": string }
  ],
  "watchVariables": [
    {
      "label": string,            // short human label, e.g. "WTI Crude Oil Price"
      "fredSeries": string|null,  // exact FRED series ID if it exists, e.g. "DCOILWTICO". null if not on FRED.
      "source": string,           // one of: "FRED", "BLS", "EIA", "BEA", "USDA", "CENSUS", "FederalReserve"
      "sourceUrl": string         // direct deep link to the official data series page (must be real and resolvable)
    }
  ]
}

FRED series ID examples (use these EXACT IDs when relevant):
- DCOILWTICO (WTI), DCOILBRENTEU (Brent), GASREGW (US gasoline), DHHNGSP (Henry Hub natgas)
- CPIAUCSL (CPI), CPILFESL (Core CPI), PCEPI (PCE), PCEPILFE (Core PCE), T5YIE (5y breakeven)
- UNRATE (U-3), CIVPART (LFPR), PAYEMS (nonfarm payrolls), JTSJOL (JOLTS openings)
- FEDFUNDS, DFF, SOFR, GS10, GS2, T10Y2Y, MORTGAGE30US, BAA10Y
- GDPC1 (real GDP), GDPPOT, GDPDEF, INDPRO, RSAFS (retail sales), HOUST (housing starts)
- DEXUSEU, DEXJPUS, DEXCHUS, DTWEXBGS (broad dollar)
- TWEXAFEGSMTHx, USRECDM (recession indicator)

Non-FRED source URLs (use these EXACT URLs only):
- EIA STEO: https://www.eia.gov/outlooks/steo/
- EIA Petroleum Weekly: https://www.eia.gov/petroleum/weekly/
- EIA Natural Gas Weekly: https://www.eia.gov/naturalgas/weekly/
- BLS Employment Situation: https://www.bls.gov/news.release/empsit.toc.htm
- BLS CPI release: https://www.bls.gov/news.release/cpi.toc.htm
- BLS PPI release: https://www.bls.gov/news.release/ppi.toc.htm
- BLS JOLTS: https://www.bls.gov/jlt/
- BEA GDP: https://www.bea.gov/data/gdp/gross-domestic-product
- BEA PCE: https://www.bea.gov/data/income-saving/personal-income
- USDA WASDE: https://www.usda.gov/oce/commodity/wasde
- USDA ERS Commodity Outlook: https://www.ers.usda.gov/topics/farm-economy/farm-commodity-policy/commodity-outlook/
- Census Foreign Trade: https://www.census.gov/foreign-trade/
- FOMC statement: https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm
- Fed H.15: https://www.federalreserve.gov/releases/h15/
- Fed H.4.1: https://www.federalreserve.gov/releases/h41/

Rules:
- Provide 3-5 watch variables, each genuinely informative for THIS shock.
- For each variable, prefer FRED. If on FRED, set fredSeries to the EXACT ID and set sourceUrl to https://fred.stlouisfed.org/series/<ID>.
- If not on FRED, set fredSeries to null and use one of the explicit non-FRED URLs above. Do NOT invent URLs.
- Be precise: cite real elasticity literature (Kee-Nicita-Olarreaga, BLS, USDA ERS, EIA) in reasoning.
- priceChangePct and quantityChangePct must obey the type direction (demand_increase: both up; supply_increase: P down Q up; etc).
- Magnitudes should reflect real-world plausibility, not toy numbers.

Return ONLY the JSON object.`;

  return await callGemini(apiKey, prompt);
};

async function callGemini(apiKey: string, prompt: string) {
  const model = process.env.GEMINI_MODEL || "gemini-3-flash-preview";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.4, responseMimeType: "application/json" },
      }),
    });
    if (!r.ok) return jsonResp(502, { error: `Gemini ${r.status}`, detail: (await r.text()).slice(0, 500) });
    const data: any = await r.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join("") || "";
    let parsed: any;
    try { parsed = JSON.parse(text); }
    catch {
      const cleaned = text.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
      parsed = JSON.parse(cleaned);
    }
    parsed.watchVariables = sanitizeWatchVariables(parsed.watchVariables);
    parsed.fetchedAt = new Date().toISOString();
    return jsonResp(200, parsed);
  } catch (err: any) {
    return jsonResp(500, { error: err?.message || "Gemini call failed" });
  }
}

function jsonResp(statusCode: number, body: unknown) {
  return { statusCode, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) };
}

// Whitelist of real, official economic-data hosts. URLs not matching these are dropped.
const URL_WHITELIST = [
  "fred.stlouisfed.org",
  "www.eia.gov",
  "www.bls.gov",
  "www.bea.gov",
  "www.usda.gov",
  "www.ers.usda.gov",
  "www.census.gov",
  "www.federalreserve.gov",
];

function sanitizeWatchVariables(wv: any): { label: string; fredSeries: string | null; source: string; sourceUrl: string }[] {
  if (!Array.isArray(wv)) return [];
  const out: { label: string; fredSeries: string | null; source: string; sourceUrl: string }[] = [];
  for (const raw of wv) {
    // Tolerate the legacy string form: convert to a label-only entry with no link.
    if (typeof raw === "string") {
      const label = raw.trim().slice(0, 80);
      if (label) out.push({ label, fredSeries: null, source: "", sourceUrl: "" });
      continue;
    }
    if (!raw || typeof raw !== "object") continue;
    const label = String(raw.label || "").trim().slice(0, 80);
    if (!label) continue;
    const fredSeries = typeof raw.fredSeries === "string" && /^[A-Z0-9]{2,20}$/.test(raw.fredSeries) ? raw.fredSeries : null;
    let sourceUrl = typeof raw.sourceUrl === "string" ? raw.sourceUrl.trim() : "";
    const source = String(raw.source || (fredSeries ? "FRED" : "")).trim().slice(0, 30);
    if (fredSeries) {
      // Always rebuild FRED URL ourselves from the validated series id.
      sourceUrl = `https://fred.stlouisfed.org/series/${fredSeries}`;
    } else if (sourceUrl) {
      try {
        const u = new URL(sourceUrl);
        if (u.protocol !== "https:" || !URL_WHITELIST.includes(u.hostname)) {
          sourceUrl = "";
        }
      } catch {
        sourceUrl = "";
      }
    }
    out.push({ label, fredSeries, source, sourceUrl });
    if (out.length >= 8) break;
  }
  return out;
}
