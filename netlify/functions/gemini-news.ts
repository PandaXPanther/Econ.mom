// Netlify Function: Gemini-powered news translator with numbers, analog, and forecast.
// Rate-limited via shared limits.ts and 12h-cached by headline hash.

import type { Handler } from "@netlify/functions";
import { enforce, getCachedJSON, setCachedJSON, hashStable } from "./_lib/limits";

export const handler: Handler = async (event) => {
  const blocked = await enforce(event, { service: "gemini-text", perMin: 12, perHour: 60, perDay: 120, perDayGlobal: 600, maxBodyBytes: 6144 });
  if (blocked) return blocked;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return jsonResp(503, { error: "GEMINI_API_KEY not configured." });

  let body: any;
  try { body = JSON.parse(event.body || "{}"); } catch { return jsonResp(400, { error: "Invalid JSON body" }); }
  const headline = String(body.headline || "").slice(0, 500).trim();
  if (!headline) return jsonResp(400, { error: "Missing headline." });

  const cacheKey = `gemini:news:${hashStable(headline.toLowerCase())}`;
  const cached = await getCachedJSON<any>(cacheKey, 60 * 60 * 12);
  if (cached) return jsonResp(200, { ...cached, cached: true });

  const prompt = `You are a senior macroeconomist translating a news headline into AP Macro terms with quantitative rigor.

Headline: "${headline}"

Return ONLY JSON (no markdown):

{
  "model": "ADAS" | "Phillips" | "LoanableFunds" | "ForexAD" | "MoneyMarket" | "PPF",
  "curve": string,                           // which curve shifts, e.g. "AD shifts left"
  "direction": "left" | "right" | "up" | "down",
  "shortRun": string,                        // 1-2 sentences on SR effects
  "longRun": string,                         // 1-2 sentences on LR adjustment
  "magnitudeNumbers": {
    "gdpEffectPct": number,                  // signed % change in real GDP
    "inflationEffectPp": number,             // signed pp change in CPI YoY
    "unemploymentEffectPp": number,          // signed pp change in u-rate
    "policyRateEffectBps": number,           // signed bps change in fed funds
    "horizonMonths": number                  // when these peaks hit
  },
  "fredSeries": [string],                    // 3-5 FRED series IDs to watch (e.g. "CPIAUCSL", "FEDFUNDS")
  "historicalAnalog": {
    "event": string,                         // real past episode
    "date": string,                          // YYYY or YYYY-MM
    "outcome": string,                       // 1 sentence on what happened
    "magnitude": string                      // numeric outcome, e.g. "GDP fell 4.3% peak-to-trough"
  },
  "forecast": {
    "watch": string,                         // 1 sentence on what to watch next
    "range": string,                         // numeric range, e.g. "Fed funds 3.75-4.25% by Q3"
    "confidence": "low" | "medium" | "high",
    "reasoning": string                      // 1-2 sentences citing the analog and real data
  }
}

Rules:
- Use real macro elasticities (Okun's law: 1pp u-rate ≈ 2% GDP; Phillips slope ≈ 0.3-0.5).
- Numbers must be signed and economically plausible.
- historicalAnalog must be a real, dated event with a real numeric outcome.
- forecast.range must include real numeric thresholds.

Return ONLY the JSON object.`;

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
    parsed.fetchedAt = new Date().toISOString();
    await setCachedJSON(cacheKey, parsed, 60 * 60 * 12);
    return jsonResp(200, { ...parsed, cached: false });
  } catch (err: any) {
    return jsonResp(500, { error: err?.message || "Gemini call failed" });
  }
};

function jsonResp(statusCode: number, body: unknown) {
  return { statusCode, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) };
}
