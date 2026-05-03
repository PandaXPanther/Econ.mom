// Netlify Function: Gemini-powered live sector data fetcher for TariffLab.
// Takes a free-form sector name (e.g. "lithium batteries", "wine", "rare earths")
// and returns a Sector object matching client/src/lib/tariff-sectors.ts schema,
// plus a 24-month world-price index time series for graphing.

import type { Handler } from "@netlify/functions";

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return jsonResp(405, { error: "Method not allowed" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return jsonResp(503, { error: "GEMINI_API_KEY not configured." });
  }

  let body: any;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return jsonResp(400, { error: "Invalid JSON body" });
  }

  const sectorQuery = String(body.sector || "").slice(0, 200).trim();
  if (!sectorQuery) return jsonResp(400, { error: "Missing sector." });

  const prompt = `You are a trade economist with deep knowledge of USITC TPIS, Peterson Institute trade data, Kee, Nicita & Olarreaga (2008) elasticities, and US Census Bureau import data. Return calibrated, defensible numbers for the following US import sector: "${sectorQuery}".

Return ONLY valid JSON in this exact shape (no markdown, no commentary):

{
  "id": string,                              // kebab-case slug
  "label": string,                           // 3-7 word human label
  "hsPrefix": string,                        // HS code, e.g. "HS 8506" or "HS 8541.43"
  "importDemandElasticity": number,          // |εm|, positive, typical 1.0-5.0
  "exportSupplyElasticity": number,          // εx_row, positive, typical 1.5-7.0
  "laborIntensity": number,                  // jobs per $M output, typical 0.8-3.5
  "baselineImports": number,                 // 2024 US imports, $B
  "baselineDomesticOutput": number,          // 2024 US domestic shipments, $B
  "baselineWorldPrice": 100,                 // index, ALWAYS 100 = today
  "description": string,                     // one sentence, terse, editorial tone
  "sources": [string],                       // 2-4 source citations, e.g. "USITC DataWeb 2024", "BLS QCEW 2024"
  "priceSeries": [
    { "month": "YYYY-MM", "index": number }  // 24 months ending this month, index relative to current=100
  ],
  "tariffHistory": string,                   // one sentence on recent US tariff actions in this sector
  "retaliationRisk": string                  // one sentence on which trading partners would retaliate
}

Rules:
- Use real 2024-vintage US data. Cite real sources in "sources".
- Elasticities must be calibrated to USITC TPIS or Kee-Nicita-Olarreaga ranges.
- priceSeries must have exactly 24 monthly observations ending this month, with realistic month-over-month volatility for this commodity.
- baselineWorldPrice MUST be 100 (the index is normalized to today).
- description: one editorial sentence, like a Financial Times headline.
- If the sector is too narrow or made-up, snap to the closest real HS chapter.

Sector to analyze: ${sectorQuery}

Return ONLY the JSON object.`;

  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.4,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!r.ok) {
      const errText = await r.text();
      return jsonResp(502, {
        error: `Gemini ${r.status}`,
        detail: errText.slice(0, 500),
      });
    }

    const data: any = await r.json();
    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join("") ||
      "";

    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch {
      const cleaned = text.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
      parsed = JSON.parse(cleaned);
    }

    // Validation + normalization
    if (
      typeof parsed?.importDemandElasticity !== "number" ||
      typeof parsed?.exportSupplyElasticity !== "number" ||
      typeof parsed?.baselineImports !== "number"
    ) {
      return jsonResp(502, { error: "Malformed sector data from Gemini.", raw: parsed });
    }

    parsed.id = parsed.id || sectorQuery.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    parsed.baselineWorldPrice = 100;
    parsed.generated = true;
    parsed.fetchedAt = new Date().toISOString();

    if (!Array.isArray(parsed.priceSeries)) parsed.priceSeries = [];

    return jsonResp(200, parsed);
  } catch (err: any) {
    return jsonResp(500, { error: err?.message || "Sector fetch failed" });
  }
};

function jsonResp(statusCode: number, body: unknown) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}
