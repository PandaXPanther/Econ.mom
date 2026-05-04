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

  const prompt = `You are a trade economist with deep knowledge of USITC TPIS, Peterson Institute trade data, Kee, Nicita & Olarreaga (2008) elasticities, and US Census Bureau import data. Return calibrated, defensible numbers for the following US import sector.

USER REQUEST (verbatim): "${sectorQuery}"

CRITICAL RULES FOR "label" AND "hsPrefix":
1. The output MUST be the SAME commodity the user asked for. If they say "wine", return wine (HS 2204). If they say "steel", return steel (HS 7208 or 7210). If they say "lithium batteries", return lithium-ion batteries (HS 8507.60).
2. NEVER substitute an unrelated sector. Wine is NOT batteries. Steel is NOT semiconductors.
3. If the user request is ambiguous (e.g. "chips"), pick the most common interpretation in trade-policy context ("chips" → semiconductors, HS 8542) but make sure "label" still references the original word.
4. If the request is genuinely nonsense (e.g. "asdfghj"), return a JSON object with an "error" field: { "error": "Sector not recognized. Try a commodity name like 'wine', 'steel', or an HS code." } and nothing else.
5. The "label" field MUST contain the user's word or an obvious synonym, so the user can visually verify the match.

Return ONLY valid JSON in this exact shape (no markdown, no commentary):

{
  "id": string,                              // kebab-case slug derived from label
  "label": string,                           // 3-7 word human label that contains the user's commodity word
  "hsPrefix": string,                        // HS code matching the commodity, e.g. "HS 2204" for wine, "HS 8507.60" for lithium-ion batteries
  "importDemandElasticity": number,          // |εm|, positive, typical 1.0-5.0
  "exportSupplyElasticity": number,          // εx_row, positive, typical 1.5-7.0
  "laborIntensity": number,                  // jobs per $M output, typical 0.8-3.5
  "baselineImports": number,                 // 2024 US imports for THIS commodity, $B
  "baselineDomesticOutput": number,          // 2024 US domestic shipments for THIS commodity, $B
  "baselineWorldPrice": 100,                 // index, ALWAYS 100 = today
  "description": string,                     // one editorial sentence about the commodity the user asked about
  "sources": [string],                       // 2-4 source citations, e.g. "USITC DataWeb 2024", "BLS QCEW 2024"
  "priceSeries": [
    { "month": "YYYY-MM", "index": number }  // 24 months ending this month, index relative to current=100, realistic volatility for this commodity
  ],
  "tariffHistory": string,                   // one sentence on recent US tariff actions in THIS sector
  "retaliationRisk": string                  // one sentence on which trading partners would retaliate against tariffs on THIS sector
}

Quality bar:
- Use real 2024-vintage US trade data. Cite real sources in "sources".
- Elasticities calibrated to USITC TPIS or Kee-Nicita-Olarreaga ranges.
- priceSeries: 24 monthly observations ending this month, baselineWorldPrice=100.
- description: one editorial sentence, Financial Times tone.

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

    // Gemini explicitly signalled "unrecognized sector"
    if (parsed?.error && typeof parsed.error === "string") {
      return jsonResp(422, { error: parsed.error });
    }

    // Validation + normalization
    if (
      typeof parsed?.importDemandElasticity !== "number" ||
      typeof parsed?.exportSupplyElasticity !== "number" ||
      typeof parsed?.baselineImports !== "number"
    ) {
      return jsonResp(502, { error: "Malformed sector data from Gemini.", raw: parsed });
    }

    // Sanity check: label should contain the user's query word (or an obvious
    // synonym). If not, the model probably hallucinated an unrelated sector.
    const userWord = sectorQuery.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    const labelLower = String(parsed.label || "").toLowerCase();
    const descLower = String(parsed.description || "").toLowerCase();
    const idLower = String(parsed.id || "").toLowerCase();
    const haystack = labelLower + " " + descLower + " " + idLower;
    const matched = userWord.length === 0 || userWord.some(w => haystack.includes(w));
    if (!matched) {
      return jsonResp(422, {
        error: `The classifier returned "${parsed.label}" for "${sectorQuery}", which doesn't match. Try a more specific commodity name (e.g. "wine", "lithium batteries", "semiconductors") or an HS code.`,
        suggested: parsed.label,
      });
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
