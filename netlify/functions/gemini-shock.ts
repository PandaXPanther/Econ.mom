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
  "historicalAnalogs": [                     // 2-3 real past events
    { "event": string, "year": number, "outcome": string }
  ],
  "watchVariables": [string]                 // 3-5 specific FRED-style indicators to monitor
}

Rules:
- Be precise: cite real elasticity literature (Kee-Nicita-Olarreaga, BLS, USDA ERS, EIA) in reasoning.
- priceChangePct and quantityChangePct must obey the type direction (demand_increase: both up; supply_increase: P down Q up; etc).
- Magnitudes should reflect real-world plausibility, not toy numbers.

Return ONLY the JSON object.`;

  return await callGemini(apiKey, prompt);
};

async function callGemini(apiKey: string, prompt: string) {
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
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
    parsed.fetchedAt = new Date().toISOString();
    return jsonResp(200, parsed);
  } catch (err: any) {
    return jsonResp(500, { error: err?.message || "Gemini call failed" });
  }
}

function jsonResp(statusCode: number, body: unknown) {
  return { statusCode, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) };
}
