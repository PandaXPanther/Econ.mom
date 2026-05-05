// Netlify Function: Gemini-powered custom counterfactual scenario generator.

import type { Handler } from "@netlify/functions";

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") return jsonResp(405, { error: "Method not allowed" });
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return jsonResp(503, { error: "GEMINI_API_KEY not configured." });

  let body: any;
  try { body = JSON.parse(event.body || "{}"); } catch { return jsonResp(400, { error: "Invalid JSON body" }); }
  const description = String(body.description || "").slice(0, 600).trim();
  if (!description) return jsonResp(400, { error: "Missing description." });

  const prompt = `You are a macroeconomic historian designing a calibrated counterfactual scenario. Given a user's "what if" question, generate a complete scenario with real historical data and a parameterized simulator.

User's counterfactual: "${description}"

Return ONLY JSON (no markdown):

{
  "id": string,                              // kebab-case slug
  "title": string,                           // 5-12 word headline
  "era": string,                             // e.g. "1971 Q3 – 1980 Q4"
  "question": string,                        // 1 sentence research question
  "context": string,                         // 2-3 sentence historical context with real numbers
  "outcomeUnit": string,                     // e.g. "% YoY", "%", "Index"
  "outcomeLabel": string,                    // chart y-axis label
  "params": [                                // 2-3 sliders
    {
      "key": string,                         // camelCase
      "label": string,
      "description": string,
      "min": number, "max": number, "step": number,
      "defaultActual": number,
      "defaultCounterfactual": number,
      "unit": string,
      "coefficient": number                  // ∂outcome / ∂param sensitivity (signed)
    }
  ],
  "series": [                                // 12-24 ACTUAL historical observations
    { "t": string, "actual": number }
  ],
  "citations": [
    { "label": string, "url": string }       // 2-4 real sources, prefer fred.stlouisfed.org or NBER
  ]
}

Rules:
- Use REAL historical FRED data for "series", exact monthly or quarterly observations.
- "coefficient" is the linear sensitivity of outcome to (param − defaultActual). Sign matters.
- 12-24 series points covering the era. Realistic variation.
- Cite real sources with real URLs.

Return ONLY the JSON object.`;

  const model = process.env.GEMINI_MODEL || "gemini-3-flash-preview";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.5, responseMimeType: "application/json" },
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
    if (!Array.isArray(parsed?.series) || !Array.isArray(parsed?.params)) {
      return jsonResp(502, { error: "Malformed scenario", raw: parsed });
    }
    parsed.id = parsed.id || `custom-${Date.now()}`;
    parsed.fetchedAt = new Date().toISOString();
    return jsonResp(200, parsed);
  } catch (err: any) {
    return jsonResp(500, { error: err?.message || "Gemini call failed" });
  }
};

function jsonResp(statusCode: number, body: unknown) {
  return { statusCode, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) };
}
